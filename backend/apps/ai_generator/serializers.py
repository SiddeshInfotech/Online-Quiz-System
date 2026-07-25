from rest_framework import serializers

class QuizGenerationPayloadSerializer(serializers.Serializer):
    subject = serializers.CharField(required=True)
    difficulty = serializers.ChoiceField(choices=['Easy', 'Medium', 'Hard'], required=True)
    number_of_questions = serializers.IntegerField(min_value=1, max_value=50, required=False, default=5)
    num_questions = serializers.IntegerField(min_value=1, max_value=50, required=False, default=5)
    prompt_topic = serializers.CharField(required=False, allow_blank=True, max_length=1000)
    category_id = serializers.IntegerField(required=False, allow_null=True)
    
    quiz_mode = serializers.ChoiceField(
        choices=['Theory', 'Coding'],
        required=False,
        default='Theory',
        help_text="Theory: mix of MCQ, True/False, Fill in the Blank. Coding: programming problems."
    )

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'number_of_questions' not in data and 'num_questions' in data:
            data['number_of_questions'] = data['num_questions']
        if 'number_of_questions' not in data:
            data['number_of_questions'] = 5
        return super().to_internal_value(data)
