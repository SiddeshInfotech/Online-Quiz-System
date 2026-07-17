import google.oauth2.id_token
from google.auth.transport import requests
from django.conf import settings
from rest_framework import serializers
from .models import User
from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Badge, UserBadge 
from .services.badge_progress import BadgeProgressHelper  
from rest_framework.validators import UniqueValidator

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    last_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    full_name = serializers.CharField(required=False, allow_blank=True)

    email = serializers.EmailField(
        validators=[UniqueValidator(queryset=User.objects.all(), message="This email is already registered.")]
    )
    username = serializers.CharField(
        validators=[UniqueValidator(queryset=User.objects.all(), message="Username already taken.")]
    )

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'password', 'role']
        extra_kwargs = {
            'role': {'required': False},
        }

    def create(self, validated_data):
        first_name = validated_data.pop('first_name', '')
        last_name = validated_data.pop('last_name', '')
        full_name = validated_data.pop('full_name', '')
        password = validated_data.pop('password')

        if not full_name and (first_name or last_name):
            full_name = f"{first_name} {last_name}".strip()

        if not full_name:
            full_name = validated_data.get('username')

        validated_data['full_name'] = full_name

        if 'role' not in validated_data or not validated_data['role']:
            validated_data['role'] = 'Student'

        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid credentials")
        if not user.check_password(password):
            raise serializers.ValidationError("Invalid credentials")
        data['user'] = user
        return data


class UserSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()
    profile_completion = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name', 'role', 'bio',
            'date_joined', 'profile_picture', 'school', 'grade',
            'subject_interests', 'profile_completion'
        ]
        read_only_fields = ['id', 'username', 'email', 'role', 'date_joined']
    def get_profile_picture(self, obj):
        if obj.profile_picture:
            return obj.profile_picture.url
        return None

    def get_profile_completion(self, obj):
        total_fields = 6
        filled = 0
        if obj.full_name:
            filled += 1
        if obj.bio:
            filled += 1
        if obj.profile_picture:
            filled += 1
        if obj.school:
            filled += 1
        if obj.grade:
            filled += 1
        if obj.subject_interests and len(obj.subject_interests) > 0:
            filled += 1
        return int((filled / total_fields) * 100)



class GoogleAuthSerializer(serializers.Serializer):
    id_token = serializers.CharField(required=False, allow_blank=True)
    access_token = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        token = data.get('id_token') or data.get('access_token')
        if not token:
            raise serializers.ValidationError("Google token is required (id_token or access_token)")

        client_id = getattr(settings, 'GOOGLE_CLIENT_ID', None)
        if not client_id:
            raise serializers.ValidationError("Google Client ID not configured on server.")

        try:
            idinfo = google.oauth2.id_token.verify_oauth2_token(
                token,
                requests.Request(),
                client_id
            )
            if idinfo.get('iss') not in ['accounts.google.com', 'https://accounts.google.com']:
                raise serializers.ValidationError("Invalid token issuer")

            email = idinfo.get('email')
            if not email:
                raise serializers.ValidationError("Email not provided by Google")

            base_username = email.split('@')[0]
            username = base_username
            suffix = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}_{suffix}"
                suffix += 1

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': username,
                    'full_name': (idinfo.get('name') or base_username).title(),
                    'role': 'Student'
                }
            )

            if not created:
                desired_full_name = idinfo.get('name', base_username)
                if not user.full_name or (idinfo.get('name') and user.full_name != idinfo.get('name')):
                    user.full_name = desired_full_name
                    user.save()

            self.context['user'] = user
            return data

        except ValueError as e:
            raise serializers.ValidationError(f"Invalid Google token: {str(e)}")

class AllBadgeSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()
    target = serializers.SerializerMethodField()
    xp_reward = serializers.SerializerMethodField()
    awarded_at = serializers.SerializerMethodField()
    claimed_at = serializers.SerializerMethodField()  # NEW

    class Meta:
        model = Badge
        fields = [
            'badge_id', 'name', 'description', 'image_url',
            'category', 'rarity', 'requirement',
            'status', 'progress', 'target', 'xp_reward', 
            'awarded_at', 'claimed_at'  # ADD claimed_at
        ]

    def get_status(self, obj):
        # earned_ids = badges the user has a UserBadge row for (CLAIMABLE or CLAIMED)
        earned_ids = self.context.get('earned_ids', set())
        if obj.badge_id not in earned_ids:
            return "LOCKED"
        # Check if claimed
        claimed_ids = self.context.get('claimed_ids', set())
        if obj.badge_id in claimed_ids:
            return "CLAIMED"
        return "CLAIMABLE"

    def get_awarded_at(self, obj):
        awarded_at_map = self.context.get('awarded_at_map', {})
        return awarded_at_map.get(obj.badge_id, None)

    def get_claimed_at(self, obj):
        claimed_at_map = self.context.get('claimed_at_map', {})
        return claimed_at_map.get(obj.badge_id, None)

    def get_progress(self, obj):
        progress_map = self.context.get('progress_map', {})
        return progress_map.get(obj.badge_id, 0)

    def get_target(self, obj):
        from .services.badge_progress import BadgeProgressHelper
        return BadgeProgressHelper.get_target(obj)

    def get_xp_reward(self, obj):
        xp_map = {'COMMON': 25, 'RARE': 50, 'EPIC': 100, 'LEGENDARY': 200}
        return xp_map.get(obj.rarity, 25)

