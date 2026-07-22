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
        answer_text = data.get('answer_text', '').strip()

        try:
            question = Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            raise serializers.ValidationError({"question_id": "Invalid question ID"})

        q_type = question.question_type

       
        if q_type in ['MCQ', 'True/False']:
            if not selected_option_id:
                raise serializers.ValidationError({
                    "selected_option_id": "This field is required for MCQ and True/False questions."
                })

        
        elif q_type == 'Fill in the Blank':
            
            has_options = question.questionoption_set.exists()
            
            if has_options:
                
                if not selected_option_id:
                    raise serializers.ValidationError({
                        "selected_option_id": "Please select an option for this Fill in the Blank question."
                    })
            else:
                
                if not answer_text:
                    raise serializers.ValidationError({
                        "answer_text": "Please provide an answer for this Fill in the Blank question."
                    })

        return data

class AttemptSerializer(serializers.ModelSerializer):
    can_retry = serializers.SerializerMethodField()
    retry_count = serializers.SerializerMethodField()
    max_retry = serializers.SerializerMethodField()

    class Meta:
        model = QuizAttempt
        fields = [
            'id', 'quiz', 'user', 'score', 'percentage', 'time_taken', 
            'started_at', 'submitted_at', 'tab_switch_count', 'is_auto_submitted',
            'can_retry', 'retry_count', 'max_retry'
        ]
        read_only_fields = ['user', 'started_at', 'submitted_at']

    def get_can_retry(self, obj):
        completed_count = QuizAttempt.objects.filter(
            user=obj.user,
            quiz=obj.quiz,
            submitted_at__isnull=False
        ).count()
        retry_count = max(0, completed_count - 1)
        max_retry = 1
        return retry_count < max_retry

    def get_retry_count(self, obj):
        completed_count = QuizAttempt.objects.filter(
            user=obj.user,
            quiz=obj.quiz,
            submitted_at__isnull=False
        ).count()
        return max(0, completed_count - 1)

    def get_max_retry(self, obj):
        return 1

class UserAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAnswer
        fields = ['id', 'attempt', 'question', 'selected_option', 'answer_text', 'is_correct', 'marks_obtained']


class ResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = Result
        fields = ['id', 'attempt', 'correct_answers', 'wrong_answers', 'unanswered_questions',
                  'total_score', 'percentage', 'grade', 'pass_status', 'generated_at']