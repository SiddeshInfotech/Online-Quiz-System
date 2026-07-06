from rest_framework import serializers
from .models import QuizCategory, Quiz

class QuizCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizCategory
        fields = ['id', 'category_name', 'description', 'created_at']

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
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'join_code', 'share_link']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)