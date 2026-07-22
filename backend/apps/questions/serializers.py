from rest_framework import serializers
from .models import Question, QuestionOption

class QuestionOptionSerializer(serializers.ModelSerializer):
    text = serializers.CharField(source='option_text', read_only=True)

    class Meta:
        model = QuestionOption
        fields = ['id', 'option_text', 'text', 'is_correct', 'question']

class QuestionSerializer(serializers.ModelSerializer):
    options = serializers.SerializerMethodField()
    choices = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = ['id', 'question_text', 'question_type', 'marks', 'question_order', 'options', 'choices']

    def get_options(self, obj):
        opts = list(obj.questionoption_set.all().order_by('id'))
        return [
            {
                "id": opt.id,
                "option_text": opt.option_text,
                "text": opt.option_text,
                "question_id": obj.id,
                "is_correct": opt.is_correct
            }
            for opt in opts
        ]

    def get_choices(self, obj):
        return self.get_options(obj)

class AttemptQuestionSerializer(serializers.ModelSerializer):
    options = serializers.SerializerMethodField()
    choices = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = ['id', 'question_text', 'question_type', 'marks', 'options', 'choices']

    def get_options(self, obj):
        opts = list(obj.questionoption_set.all().order_by('id'))
        return [
            {
                "id": opt.id,
                "option_text": opt.option_text,
                "text": opt.option_text,
                "question_id": obj.id
            }
            for opt in opts
        ]

    def get_choices(self, obj):
        return self.get_options(obj)

