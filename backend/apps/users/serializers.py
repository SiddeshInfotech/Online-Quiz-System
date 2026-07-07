import google.oauth2.id_token
from google.auth.transport import requests
from django.conf import settings
from rest_framework import serializers
from .models import User

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    last_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'password', 'role']

    def create(self, validated_data):
        first_name = validated_data.pop('first_name', '')
        last_name = validated_data.pop('last_name', '')
        full_name = validated_data.get('full_name', '')
        
        if not full_name and (first_name or last_name):
            full_name = f"{first_name} {last_name}".strip()
            validated_data['full_name'] = full_name
            
        if not validated_data.get('full_name'):
            validated_data['full_name'] = validated_data['username']
        
        user = User(**validated_data)
        user.set_password(validated_data['password'])
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
    access_token = serializers.CharField(required=True)

    def validate_access_token(self, value):
        try:
            # Verify Google token
            idinfo = google.oauth2.id_token.verify_oauth2_token(
                value,
                requests.Request(),
                settings.GOOGLE_CLIENT_ID
            )
            
            if idinfo.get('iss') not in ['accounts.google.com', 'https://accounts.google.com']:
                raise serializers.ValidationError("Invalid issuer")

            email = idinfo.get('email')
            if not email:
                raise serializers.ValidationError("Email not found")

            # Get or create user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0] + str(User.objects.count()),
                    'full_name': idinfo.get('name', ''),
                    'role': 'Student'
                }
            )
            if not created and idinfo.get('name'):
                user.full_name = idinfo.get('name')
                user.save()

            self.context['user'] = user
            return value

        except ValueError as e:
            raise serializers.ValidationError(f"Invalid Google token: {str(e)}")