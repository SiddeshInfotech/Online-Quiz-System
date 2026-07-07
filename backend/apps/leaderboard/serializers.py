from rest_framework import serializers
from apps.attempts.models import QuizAttempt, Result
from apps.quizzes.models import Quiz
from apps.users.models import User

class LeaderboardUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'email']

class LeaderboardEntrySerializer(serializers.Serializer):
    rank = serializers.IntegerField()
    user = LeaderboardUserSerializer()
    score = serializers.IntegerField()
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    time_taken = serializers.CharField()
    submitted_at = serializers.DateTimeField()

class QuizLeaderboardSerializer(serializers.Serializer):
    quiz_id = serializers.IntegerField()
    quiz_title = serializers.CharField()
    total_attempts = serializers.IntegerField()
    average_score = serializers.DecimalField(max_digits=5, decimal_places=2)
    average_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    top_performers = LeaderboardEntrySerializer(many=True)