from rest_framework import serializers
from .models import QuizCategory, Quiz
from apps.attempts.models import QuizAttempt

class QuizCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizCategory
        fields = ['id', 'category_name', 'description', 'created_at']

class QuizLibrarySerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.category_name')
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            'id', 'title', 'description', 'subject', 'difficulty',
            'duration_minutes', 'total_questions', 'grade_level', 'status',
            'category', 'category_name', 'created_at', 'progress_percentage'
        ]

    def get_progress_percentage(self, obj):
        user = self.context.get('request').user
        if user and user.is_authenticated:
            latest = QuizAttempt.objects.filter(
                user=user, quiz=obj, submitted_at__isnull=False
            ).order_by('-submitted_at').first()
            return latest.percentage if latest else 0
        return 0

class QuizSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.category_name')
    created_by_name = serializers.ReadOnlyField(source='created_by.username')

    class Meta:
        model = Quiz
        fields = [
            'id', 'title', 'description', 'subject', 'difficulty',
            'question_type', 'visibility', 'status', 'duration_minutes',
            'total_marks', 'is_ai_generated', 'join_code', 'share_link',
            'category', 'category_name', 'created_by', 'created_by_name',
            'created_at', 'updated_at', 'grade_level'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'join_code', 'share_link']