from rest_framework import serializers
from .models import Question, QuestionOption

class QuestionOptionSerializer(serializers.ModelSerializer):
    text = serializers.CharField(source='option_text', read_only=True)
    question_id = serializers.PrimaryKeyRelatedField(source='question', read_only=True)

    class Meta:
        model = QuestionOption
        fields = ['id', 'option_text', 'text', 'is_correct', 'question_id']

class AttemptQuestionOptionSerializer(serializers.ModelSerializer):
    text = serializers.CharField(source='option_text', read_only=True)
    question_id = serializers.PrimaryKeyRelatedField(source='question', read_only=True)

    class Meta:
        model = QuestionOption
        fields = ['id', 'option_text', 'text', 'question_id']

class QuestionSerializer(serializers.ModelSerializer):
    question_id = serializers.IntegerField(source='id', read_only=True)
    options = serializers.SerializerMethodField()
    choices = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = ['id', 'question_id', 'question_text', 'question_type', 'marks', 'question_order', 'options', 'choices']

    def get_options(self, obj):
        if hasattr(obj, 'options') and isinstance(obj.options, list) and obj.options:
            return [str(opt) for opt in obj.options if opt is not None]
        # Prefetch-friendly: check cache to avoid N+1 queries and database roundtrips
        if hasattr(obj, '_prefetched_objects_cache') and 'questionoption_set' in obj._prefetched_objects_cache:
            opts = obj._prefetched_objects_cache['questionoption_set'].all()
            opts = sorted(opts, key=lambda x: x.id)
        else:
            opts = obj.questionoption_set.all().order_by('id')
            
        return [opt.option_text for opt in opts if opt.option_text is not None]

    def get_choices(self, obj):
        return self.get_options(obj)

class AttemptQuestionSerializer(serializers.ModelSerializer):
    question_id = serializers.IntegerField(source='id', read_only=True)
    options = serializers.SerializerMethodField()
    choices = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = ['id', 'question_id', 'question_text', 'question_type', 'marks', 'question_order', 'options', 'choices']

    def get_options(self, obj):
        if hasattr(obj, 'options') and isinstance(obj.options, list) and obj.options:
            return [str(opt) for opt in obj.options if opt is not None]
        # Prefetch-friendly: check cache to avoid N+1 queries and database roundtrips
        if hasattr(obj, '_prefetched_objects_cache') and 'questionoption_set' in obj._prefetched_objects_cache:
            opts = obj._prefetched_objects_cache['questionoption_set'].all()
            opts = sorted(opts, key=lambda x: x.id)
        else:
            opts = obj.questionoption_set.all().order_by('id')
            
        return [opt.option_text for opt in opts if opt.option_text is not None]

    def get_choices(self, obj):
        return self.get_options(obj)



