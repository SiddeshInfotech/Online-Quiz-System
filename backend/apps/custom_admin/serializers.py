from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.attempts.models import QuizAttempt
from apps.quizzes.models import Quiz
from apps.custom_admin.models import UserPenaltyLog
from apps.support.models import ContactMessage

User = get_user_model()

class AdminUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    total_attempts = serializers.IntegerField(read_only=True, default=0)
    penalty_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name', 'total_points', 
            'xp', 'level', 'role', 'is_active', 'total_attempts', 
            'penalty_count', 'date_joined'
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.full_name or obj.username or ""

class AdminQuizSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.category_name')
    created_by_name = serializers.ReadOnlyField(source='created_by.username')
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            'id', 'title', 'description', 'subject', 'difficulty',
            'question_type', 'visibility', 'status', 'duration_minutes',
            'total_marks', 'is_ai_generated', 'join_code', 'share_link',
            'category', 'category_name', 'created_by', 'created_by_name',
            'created_at', 'updated_at', 'grade_level', 'is_published',
            'question_count'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'join_code', 'share_link', 'question_count']

    def get_question_count(self, obj):
        return obj.question_set.count()

class UserPenaltyLogSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    student_name = serializers.SerializerMethodField()
    email = serializers.ReadOnlyField(source='user.email')
    quiz_title = serializers.SerializerMethodField()
    violations = serializers.ReadOnlyField(source='violations_count')

    class Meta:
        model = UserPenaltyLog
        fields = [
            'id', 'user', 'username', 'student_name', 'email', 'attempt', 'quiz_title',
            'violations_count', 'violations', 'points_deducted', 'reason', 'created_at'
        ]

    def get_student_name(self, obj):
        if not obj.user:
            return "Unknown User"
        return obj.user.full_name or obj.user.username or ""

    def get_quiz_title(self, obj):
        if obj.attempt and obj.attempt.quiz:
            return obj.attempt.quiz.title
        return "N/A"

class AdminSupportMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'email', 'subject', 'category', 'message', 'created_at', 'is_resolved']
        read_only_fields = ['name', 'email', 'subject', 'category', 'message', 'created_at']
