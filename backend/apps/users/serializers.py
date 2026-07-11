import google.oauth2.id_token
from google.auth.transport import requests
from django.conf import settings
from rest_framework import serializers
from .models import User
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    last_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    full_name = serializers.CharField(required=False, allow_blank=True)

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
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'role', 'bio', 'date_joined']


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
