from rest_framework import serializers
from .models import Feedback
from apps.users.models import User

class FeedbackUserSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'full_name', 'profile_picture']

    def get_profile_picture(self, obj):
        if obj.profile_picture:
            return obj.profile_picture.url if hasattr(obj.profile_picture, 'url') else str(obj.profile_picture)
        return None

class FeedbackSerializer(serializers.ModelSerializer):
    user = FeedbackUserSerializer(read_only=True)

    class Meta:
        model = Feedback
        fields = ['id', 'user', 'rating', 'message', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

class FeedbackCreateSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    message = serializers.CharField(min_length=10, max_length=1000)

class FeedbackSummarySerializer(serializers.Serializer):
    average_rating = serializers.FloatField()
    total_reviews = serializers.IntegerField()
    distribution = serializers.DictField(child=serializers.IntegerField())

class AdminFeedbackSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    username = serializers.SerializerMethodField()
    student_name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    user_profile_picture = serializers.SerializerMethodField()
    replied_by_username = serializers.SerializerMethodField()
    edited_by_username = serializers.SerializerMethodField()

    class Meta:
        model = Feedback
        fields = [
            'id', 'user', 'user_name', 'username', 'student_name', 'email', 'user_profile_picture',
            'rating', 'message', 'status', 'reply_message', 'reply_date',
            'replied_by', 'replied_by_username', 'is_hidden',
            'edited_by', 'edited_by_username', 'edited_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'replied_by', 'reply_date', 'edited_by', 'edited_at']

    def get_user_name(self, obj):
        if not obj.user:
            return "Anonymous"
        return obj.user.full_name or obj.user.username

    def get_username(self, obj):
        return obj.user.username if obj.user else ""

    def get_student_name(self, obj):
        if not obj.user:
            return "Anonymous"
        return obj.user.full_name or obj.user.username

    def get_email(self, obj):
        return obj.user.email if obj.user else ""

    def get_user_profile_picture(self, obj):
        if obj.user and obj.user.profile_picture:
            try:
                return obj.user.profile_picture.url
            except Exception:
                return str(obj.user.profile_picture)
        return None

    def get_replied_by_username(self, obj):
        return obj.replied_by.username if obj.replied_by else None

    def get_edited_by_username(self, obj):
        return obj.edited_by.username if obj.edited_by else None