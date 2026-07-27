import random
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from .models import OTPVerification
from .serializers import (
    OTPSendSerializer,
    OTPVerifySerializer,
    PasswordResetSerializer
)

User = get_user_model()

class OTPSendView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPSendSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        user = User.objects.get(email=email)
        otp_code = str(random.randint(100000, 999999))

        OTPVerification.objects.create(
            user=user,
            otp_code=otp_code,
            purpose='Password Reset',
            expires_at=timezone.now() + timedelta(minutes=10)
        )

        try:
            send_mail(
                subject='Your Password Reset OTP',
                message=f'Hello {user.username},\n\nYour OTP for password reset is: {otp_code}\n\nThis OTP is valid for 10 minutes.\n\nIf you did not request this, please ignore this email.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Email sending failed: {e}")

        return Response({
            "message": "OTP sent successfully!"
        }, status=status.HTTP_200_OK)

class OTPVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data['user']
        otp_record = serializer.validated_data['otp_record']

        otp_record.is_verified = True
        otp_record.save()

        return Response({
            "message": "OTP verified successfully."
        }, status=status.HTTP_200_OK)

class PasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data['user']
        otp_record = serializer.validated_data['otp_record']
        new_password = serializer.validated_data['new_password']

        user.set_password(new_password)
        user.save()

        if not otp_record.is_verified:
            otp_record.is_verified = True
            otp_record.save()

        return Response({
            "message": "Password reset successful."
        }, status=status.HTTP_200_OK)
