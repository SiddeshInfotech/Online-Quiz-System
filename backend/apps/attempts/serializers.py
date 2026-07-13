from rest_framework import serializers
from .models import QuizAttempt, UserAnswer, Result
from apps.questions.models import Question, QuestionOption
from apps.quizzes.models import Quiz

class StartAttemptSerializer(serializers.Serializer):
    quiz_id = serializers.IntegerField()


class SubmitAnswerSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    selected_option_id = serializers.IntegerField(required=False, allow_null=True)
    answer_text = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, data):
        question_id = data.get('question_id')
        selected_option_id = data.get('selected_option_id')
        answer_text = data.get('answer_text', '')

        # Get the question to know its type
        try:
            question = Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            raise serializers.ValidationError("Invalid question ID")

        # For MCQ and True/False, selected_option_id is required
        if question.question_type in ['MCQ', 'True/False']:
            if not selected_option_id:
                raise serializers.ValidationError(
                    {"selected_option_id": "This field is required for MCQ and True/False questions."}
                )
        # For Fill in the Blank, answer_text is required
        elif question.question_type == 'Fill in the Blank':
            if not answer_text or not answer_text.strip():
                raise serializers.ValidationError(
                    {"answer_text": "This field is required for Fill in the Blank questions."}
                )

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