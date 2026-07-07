from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from .models import OTPVerification

User = get_user_model()

class OTPSendSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email does not exist.")
        return value

class OTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp_code = serializers.CharField(max_length=10)

    def validate(self, data):
        email = data.get('email')
        otp_code = data.get('otp_code')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found.")

        otp_record = OTPVerification.objects.filter(
            user=user,
            otp_code=otp_code,
            is_verified=False,
            expires_at__gt=timezone.now()
        ).order_by('-created_at').first()

        if not otp_record:
            raise serializers.ValidationError("Invalid or expired OTP.")

        data['user'] = user
        data['otp_record'] = otp_record
        return data

class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp_code = serializers.CharField(max_length=10)
    new_password = serializers.CharField(min_length=6, write_only=True)

    def validate(self, data):
        email = data.get('email')
        otp_code = data.get('otp_code')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found.")

        otp_record = OTPVerification.objects.filter(
            user=user,
            otp_code=otp_code,
            is_verified=False,
            expires_at__gt=timezone.now()
        ).order_by('-created_at').first()

        if not otp_record:
            raise serializers.ValidationError("Invalid or expired OTP.")

        data['user'] = user
        data['otp_record'] = otp_record
        return data
