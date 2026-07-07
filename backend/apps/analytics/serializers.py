from rest_framework import serializers

class QuizAnalyticsSerializer(serializers.Serializer):
    quiz_id = serializers.IntegerField()
    quiz_title = serializers.CharField()
    total_attempts = serializers.IntegerField()
    total_users = serializers.IntegerField()
    average_score = serializers.DecimalField(max_digits=5, decimal_places=2)
    average_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    max_score = serializers.IntegerField()
    min_score = serializers.IntegerField()
    pass_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    fail_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)

class QuestionAnalyticsSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    question_text = serializers.CharField()
    total_attempts = serializers.IntegerField()
    correct_count = serializers.IntegerField()
    wrong_count = serializers.IntegerField()
    accuracy_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)

class UserAnalyticsSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    full_name = serializers.CharField()
    total_quizzes = serializers.IntegerField()
    total_attempts = serializers.IntegerField()
    average_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    best_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)