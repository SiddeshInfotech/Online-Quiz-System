from rest_framework import serializers
from .models import Feedback
from apps.users.models import User

class FeedbackUserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='full_name', default='')
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