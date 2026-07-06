from rest_framework import serializers
from .models import QuizAttempt, UserAnswer, Result
from apps.questions.models import Question, QuestionOption
from apps.quizzes.models import Quiz

class StartAttemptSerializer(serializers.Serializer):
    quiz_id = serializers.IntegerField()


class SubmitAnswerSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    selected_option_id = serializers.IntegerField(required=False, allow_null=True)
    answer_text = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        question_id = data.get('question_id')
        selected_option_id = data.get('selected_option_id')
        answer_text = data.get('answer_text', '')

       
        try:
            question = Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            raise serializers.ValidationError(f"Question with id {question_id} does not exist.")

        attempt = self.context.get('attempt')
        if attempt and question.quiz_id != attempt.quiz_id:
            raise serializers.ValidationError(
                f"Question {question_id} does not belong to the quiz of this attempt."
            )
        
        if question.question_type == 'MCQ':
            if not selected_option_id:
                raise serializers.ValidationError("MCQ questions require a selected option.")
            
            try:
                option = QuestionOption.objects.get(id=selected_option_id, question=question)
            except QuestionOption.DoesNotExist:
                raise serializers.ValidationError(
                    f"Option {selected_option_id} does not belong to question {question_id}."
                )
           
            data['_option'] = option

        elif question.question_type == 'True/False':
            if not answer_text:
                raise serializers.ValidationError("True/False questions require an answer text.")

            if answer_text.strip().lower() not in ['true', 'false']:
                raise serializers.ValidationError("Answer must be 'True' or 'False'.")

        elif question.question_type == 'Fill in the Blank':
            if not answer_text:
                raise serializers.ValidationError("Fill in the Blank questions require an answer text.")

        data['_question'] = question
        return data

class AttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAttempt
        fields = ['id', 'quiz', 'user', 'score', 'percentage', 'time_taken', 'started_at', 'submitted_at']
        read_only_fields = ['user', 'started_at', 'submitted_at']

class UserAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAnswer
        fields = ['id', 'attempt', 'question', 'selected_option', 'answer_text', 'is_correct', 'marks_obtained']


class ResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = Result
        fields = ['id', 'attempt', 'correct_answers', 'wrong_answers', 'unanswered_questions',
                  'total_score', 'percentage', 'grade', 'pass_status', 'generated_at']