import re
from rest_framework import serializers
from .models import Question, QuestionOption

def clean_quiz_text(text):
    if not text or not isinstance(text, str):
        return text if text is not None else ""
    t = text.strip()
    prev = None
    while prev != t:
        prev = t
        # Strip leading question numbers e.g., "1. ", "Question 1: ", "Q1: ", "#1: " (REQUIRES punctuation after number, not plain space)
        t = re.sub(r'^(?:Question\s*)?#?\d+[\.:\)\-]\s*', '', t, flags=re.IGNORECASE)
        # Strip choice prefixes e.g., "(D) ", "[D] ", "Option D: ", "Option D - ", "D) ", "D. ", "D: "
        t = re.sub(r'^(?:Option\s*)?[\(\[]?[A-Da-d][\)\.\:\-\s\]]\s*', '', t, flags=re.IGNORECASE)
        # Strip embedded '#1', '#2', '#3' patterns
        t = re.sub(r'\s*#\d+\b', '', t)
        t = t.strip()
    return t

class QuestionOptionSerializer(serializers.ModelSerializer):
    text = serializers.SerializerMethodField()
    option_text = serializers.SerializerMethodField()
    question_id = serializers.PrimaryKeyRelatedField(source='question', read_only=True)

    class Meta:
        model = QuestionOption
        fields = ['id', 'option_text', 'text', 'is_correct', 'question_id']

    def get_text(self, obj):
        return clean_quiz_text(obj.option_text)

    def get_option_text(self, obj):
        return clean_quiz_text(obj.option_text)

class AttemptQuestionOptionSerializer(serializers.ModelSerializer):
    text = serializers.SerializerMethodField()
    option_text = serializers.SerializerMethodField()
    question_id = serializers.PrimaryKeyRelatedField(source='question', read_only=True)

    class Meta:
        model = QuestionOption
        fields = ['id', 'option_text', 'text', 'question_id']

    def get_text(self, obj):
        return clean_quiz_text(obj.option_text)

    def get_option_text(self, obj):
        return clean_quiz_text(obj.option_text)

class QuestionSerializer(serializers.ModelSerializer):
    question_id = serializers.IntegerField(source='id', read_only=True)
    question_text = serializers.SerializerMethodField()
    options = serializers.SerializerMethodField()
    choices = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = ['id', 'question_id', 'question_text', 'question_type', 'marks', 'question_order', 'options', 'choices']

    def get_question_text(self, obj):
        return clean_quiz_text(obj.question_text)

    def get_options(self, obj):
        if hasattr(obj, 'options') and isinstance(obj.options, list) and obj.options:
            return [clean_quiz_text(opt) for opt in obj.options if opt is not None]
        # Prefetch-friendly: use related_name 'options' (set on QuestionOption.question FK)
        if hasattr(obj, '_prefetched_objects_cache') and 'options' in obj._prefetched_objects_cache:
            opts = obj._prefetched_objects_cache['options'].all()
            opts = sorted(opts, key=lambda x: x.id)
        else:
            opts = obj.options.all().order_by('id')
            
        return [clean_quiz_text(opt.option_text) for opt in opts if opt.option_text is not None]

    def get_choices(self, obj):
        return self.get_options(obj)

class AttemptQuestionSerializer(serializers.ModelSerializer):
    question_id = serializers.IntegerField(source='id', read_only=True)
    question_text = serializers.SerializerMethodField()
    options = serializers.SerializerMethodField()
    choices = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = ['id', 'question_id', 'question_text', 'question_type', 'marks', 'question_order', 'options', 'choices']

    def get_question_text(self, obj):
        return clean_quiz_text(obj.question_text)

    def get_options(self, obj):
        if hasattr(obj, 'options') and isinstance(obj.options, list) and obj.options:
            return [clean_quiz_text(opt) for opt in obj.options if opt is not None]
        # Prefetch-friendly: use related_name 'options' (set on QuestionOption.question FK)
        if hasattr(obj, '_prefetched_objects_cache') and 'options' in obj._prefetched_objects_cache:
            opts = obj._prefetched_objects_cache['options'].all()
            opts = sorted(opts, key=lambda x: x.id)
        else:
            opts = obj.options.all().order_by('id')
            
        return [clean_quiz_text(opt.option_text) for opt in opts if opt.option_text is not None]

    def get_choices(self, obj):
        return self.get_options(obj)



