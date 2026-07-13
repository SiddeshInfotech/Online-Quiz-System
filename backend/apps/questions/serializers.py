from rest_framework import serializers
from .models import Question, QuestionOption

class QuestionSerializer(serializers.ModelSerializer):
    options = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = ['id', 'question_text', 'question_type', 'marks', 'question_order', 'options']

    def get_options(self, obj):
        return [
            {
                "id": opt.id,
                "option_text": opt.option_text,
                "is_correct": opt.is_correct
            }
            for opt in obj.questionoption_set.all().order_by('id')
        ]

class AttemptQuestionSerializer(serializers.ModelSerializer):
    options = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = ['id', 'question_text', 'question_type', 'marks', 'options']

    def get_options(self, obj):
        return [
            {"id": opt.id, "text": opt.option_text}
            for opt in obj.questionoption_set.all().order_by('id')
        ]
