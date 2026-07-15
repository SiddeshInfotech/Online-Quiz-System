from rest_framework import serializers

class QuizGenerationPayloadSerializer(serializers.Serializer):
    subject = serializers.CharField(required=True)
    difficulty = serializers.ChoiceField(choices=['Easy', 'Medium', 'Hard'], required=True)
    number_of_questions = serializers.IntegerField(min_value=1, max_value=25, required=True)
    prompt_topic = serializers.CharField(required=False, allow_blank=True, max_length=1000)
    category_id = serializers.IntegerField(required=False, allow_null=True)
    
    quiz_mode = serializers.ChoiceField(
        choices=['Theory', 'Coding'],
        required=False,
        default='Theory',
        help_text="Theory: mix of MCQ, True/False, Fill in the Blank. Coding: programming problems."
    )
