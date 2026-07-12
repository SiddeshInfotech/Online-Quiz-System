from rest_framework import serializers

class QuizGenerationPayloadSerializer(serializers.Serializer):
    subject = serializers.CharField(required=True, error_messages={
        "required": "Programming Subject is mandatory."
    })
    difficulty = serializers.ChoiceField(
        choices=['Easy', 'Medium', 'Hard'], 
        required=True
    )
    question_type = serializers.ChoiceField(
        choices=['MCQ', 'True/False'], 
        required=True
    )
    number_of_questions = serializers.ChoiceField(
        choices=[5, 10, 15, 20, 25], 
        required=True
    )
    prompt_topic = serializers.CharField(
        required=False, 
        allow_blank=True, 
        max_length=1000
    )
    category_id = serializers.IntegerField(
        required=False, 
        allow_null=True,
        help_text="Optional category ID for the quiz"
    )