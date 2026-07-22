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
    options = serializers.SerializerMethodField()
    choices = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = ['id', 'question_text', 'question_type', 'marks', 'question_order', 'options', 'choices']

    def get_options(self, obj):
        # Prefetch-friendly: check cache to avoid N+1 queries and database roundtrips
        if hasattr(obj, '_prefetched_objects_cache') and 'questionoption_set' in obj._prefetched_objects_cache:
            opts = obj._prefetched_objects_cache['questionoption_set'].all()
            opts = sorted(opts, key=lambda x: x.id)
        else:
            opts = obj.questionoption_set.all().order_by('id')
            
        return QuestionOptionSerializer(opts, many=True, context=self.context).data

    def get_choices(self, obj):
        return self.get_options(obj)

class AttemptQuestionSerializer(serializers.ModelSerializer):
    options = serializers.SerializerMethodField()
    choices = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = ['id', 'question_text', 'question_type', 'marks', 'options', 'choices']

    def get_options(self, obj):
        # Prefetch-friendly: check cache to avoid N+1 queries and database roundtrips
        if hasattr(obj, '_prefetched_objects_cache') and 'questionoption_set' in obj._prefetched_objects_cache:
            opts = obj._prefetched_objects_cache['questionoption_set'].all()
            opts = sorted(opts, key=lambda x: x.id)
        else:
            opts = obj.questionoption_set.all().order_by('id')
            
        return AttemptQuestionOptionSerializer(opts, many=True, context=self.context).data

    def get_choices(self, obj):
        return self.get_options(obj)


