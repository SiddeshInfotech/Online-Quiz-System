import os
import random
from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer, GoogleAuthSerializer
from .models import User
from apps.otp.models import OTPVerification
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            user.is_active = False
            user.save()

            otp_code = str(random.randint(100000, 999999))
            expires_at = timezone.now() + timezone.timedelta(minutes=10)

            OTPVerification.objects.filter(user=user, purpose='Email Verification').delete()
            OTPVerification.objects.create(
                user=user,
                otp_code=otp_code,
                purpose='Email Verification',
                expires_at=expires_at
            )

            try:
                from_email = os.environ.get('FROM_EMAIL', 'zeeshanansari1081015@gmail.com')
                message = Mail(
                    from_email=from_email,
                    to_emails=user.email,
                    subject='Verify Your Email - Online Quiz System',
                    html_content=f"""
                    <p>Hello {user.full_name or user.username},</p>
                    <p>Thank you for registering! Your OTP for email verification is: <b>{otp_code}</b></p>
                    <p>This OTP is valid for 10 minutes.</p>
                    <p>If you did not register, please ignore this email.</p>
                    <p>- Online Quiz Team</p>
                    """
                )
                sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
                response = sg.send(message)
                print(f"✅ Verification email sent to {user.email}, status: {response.status_code}")
            except Exception as e:
                print(f"❌ Email send failed: {e}")

            return Response({
                "message": "Registration successful! Please verify your email with the OTP sent.",
                "userId": user.id,
                "email": user.email,
                "otp": otp_code,
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            if not user.is_active:
                return Response({
                    "error": "Please verify your email before logging in."
                }, status=status.HTTP_403_FORBIDDEN)
            
            refresh = RefreshToken.for_user(user)
            return Response({
                "message": "Login Successful",
                "token": str(refresh.access_token),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "full_name": user.full_name,
                    "role": user.role
                }
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.context['user']
            refresh = RefreshToken.for_user(user)
            return Response({
                "message": "Google login successful",
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.full_name,
                    "role": user.role
                }
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "No user found with this email"}, status=status.HTTP_404_NOT_FOUND)

        otp_code = str(random.randint(100000, 999999))
        expires_at = timezone.now() + timezone.timedelta(minutes=10)
        
        OTPVerification.objects.filter(user=user, purpose='Password Reset').delete()
        OTPVerification.objects.create(
            user=user,
            otp_code=otp_code,
            purpose='Password Reset',
            expires_at=expires_at
        )

        try:
            from_email = os.environ.get('FROM_EMAIL', 'zeeshanansari1081015@gmail.com')
            message = Mail(
                from_email=from_email,
                to_emails=email,
                subject='Password Reset OTP - Online Quiz System',
                html_content=f"""
                <p>Hello {user.full_name or user.username},</p>
                <p>Your OTP for password reset is: <b>{otp_code}</b></p>
                <p>This OTP is valid for 10 minutes.</p>
                <p>If you did not request this, please ignore this email.</p>
                <p>- Online Quiz Team</p>
                """
            )
            sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
            sg.send(message)
        except Exception as e:
            pass

        return Response({
            "message": "OTP sent successfully to your email",
            "otp": otp_code
        }, status=status.HTTP_200_OK)

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp_code = request.data.get('otp')
        if not email or not otp_code:
            return Response({"error": "Email and OTP are required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "No user found"}, status=status.HTTP_404_NOT_FOUND)
        try:
            otp_record = OTPVerification.objects.get(
                user=user,
                otp_code=otp_code,
                purpose='Password Reset'
            )
        except OTPVerification.DoesNotExist:
            return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)

        if otp_record.expires_at < timezone.now():
            return Response({"error": "OTP has expired"}, status=status.HTTP_400_BAD_REQUEST)

        otp_record.is_verified = True
        otp_record.save()
        return Response({"message": "OTP verified successfully"}, status=status.HTTP_200_OK)

class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp_code = request.data.get('otp')
        new_password = request.data.get('new_password')
        if not email or not otp_code or not new_password:
            return Response(
                {"error": "Email, OTP, and new password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        if len(new_password) < 6:
            return Response(
                {"error": "Password must be at least 6 characters"},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "No user found"}, status=status.HTTP_404_NOT_FOUND)
        try:
            otp_record = OTPVerification.objects.get(
                user=user,
                otp_code=otp_code,
                purpose='Password Reset',
                is_verified=True
            )
        except OTPVerification.DoesNotExist:
            return Response(
                {"error": "Invalid or unverified OTP"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if otp_record.expires_at < timezone.now():
            return Response({"error": "OTP has expired"}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        otp_record.delete()
        return Response({"message": "Password reset successfully"}, status=status.HTTP_200_OK)
    
class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp_code = request.data.get('otp')

        if not email or not otp_code:
            return Response({"error": "Email and OTP are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
             user = User.objects.get(email=email)

        except User.DoesNotExist:
            return Response({"error": "No user found"}, status=status.HTTP_404_NOT_FOUND)

        if user.is_active:
            return Response({"message": "Email already verified"}, status=status.HTTP_200_OK)

        try:
            otp_record = OTPVerification.objects.get(
                user=user,
                otp_code=otp_code,
                purpose='Email Verification'
            )
        except OTPVerification.DoesNotExist:
            return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)

        if otp_record.expires_at < timezone.now():
            return Response({"error": "OTP has expired"}, status=status.HTTP_400_BAD_REQUEST)

        user.is_active = True
        user.save()
        otp_record.delete()

        refresh = RefreshToken.for_user(user)

        return Response({
            "message": "Email verified successfully!",
            "access_token": str(refresh.access_token),
            "refresh_token": str(refresh),
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role
            }
        }, status=status.HTTP_200_OK)

class ResendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        purpose = request.data.get('purpose', 'Email Verification')

        if not email:
            return Response({"error": "Email is required"}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "No user found with this email"}, status=404)

        if purpose == 'Email Verification' and user.is_active:
            return Response({"error": "Email already verified"}, status=400)

        OTPVerification.objects.filter(user=user, purpose=purpose).delete()

        otp_code = str(random.randint(100000, 999999))
        expires_at = timezone.now() + timezone.timedelta(minutes=10)

        OTPVerification.objects.create(
            user=user,
            otp_code=otp_code,
            purpose=purpose,
            expires_at=expires_at
        )

        try:
            from_email = os.environ.get('FROM_EMAIL', 'noreply@quizsystem.com')
            subject = 'Resend OTP - Online Quiz System'
            if purpose == 'Password Reset':
                subject = 'New Password Reset OTP'
            message = Mail(
                from_email=from_email,
                to_emails=email,
                subject=subject,
                html_content=f"""
                <p>Hello {user.full_name or user.username},</p>
                <p>Your new OTP is: <b>{otp_code}</b></p>
                <p>This OTP is valid for 10 minutes.</p>
                <p>- Online Quiz Team</p>
                """
            )
            sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
            sg.send(message)
        except Exception as e:
            print(f"Email failed: {e}")

        return Response({
            "message": "OTP resent successfully",
            "otp": otp_code
        }, status=200)


