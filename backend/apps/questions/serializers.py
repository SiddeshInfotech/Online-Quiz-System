from rest_framework import serializers
from .models import Question, QuestionOption

class QuestionOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionOption
        fields = ['id', 'option_text', 'is_correct']

class QuestionSerializer(serializers.ModelSerializer):
    options = QuestionOptionSerializer(many=True, source='questionoption_set', required=False)

    class Meta:
        model = Question
        fields = ['id', 'quiz', 'question_text', 'question_type', 'marks', 'question_order', 'options']
        read_only_fields = ['quiz']  # Hum URL se quiz_id set karenge

    def create(self, validated_data):
        options_data = validated_data.pop('questionoption_set', [])
        question = Question.objects.create(**validated_data)
        for option_data in options_data:
            QuestionOption.objects.create(question=question, **option_data)
        return question

    def update(self, instance, validated_data):
        options_data = validated_data.pop('questionoption_set', [])
        instance.question_text = validated_data.get('question_text', instance.question_text)
        instance.question_type = validated_data.get('question_type', instance.question_type)
        instance.marks = validated_data.get('marks', instance.marks)
        instance.question_order = validated_data.get('question_order', instance.question_order)
        instance.save()

        # Purani options hatao aur nayi daalo (simple approach)
        instance.questionoption_set.all().delete()
        for option_data in options_data:
            QuestionOption.objects.create(question=instance, **option_data)
        return instance