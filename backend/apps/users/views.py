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
from .models import User, UserBadge
from apps.otp.models import OTPVerification
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Content
from .serializers import AllBadgeSerializer
from .services.badge_progress import BadgeProgressHelper
from .models import Badge
from django.core.cache import cache 
import time

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        email = request.data.get('email')
        username = request.data.get('username')

        # ✅ Check if email already exists
        existing_user = User.objects.filter(email=email).first()

        if existing_user:
            # If user exists but is not active → unverified, resend OTP
            if not existing_user.is_active:
                otp_code = str(random.randint(100000, 999999))
                expires_at = timezone.now() + timezone.timedelta(minutes=10)

                OTPVerification.objects.filter(user=existing_user, purpose='Email Verification').delete()
                OTPVerification.objects.create(
                    user=existing_user,
                    otp_code=otp_code,
                    purpose='Email Verification',
                    expires_at=expires_at
                )

                # Send OTP email
                self._send_otp_email(existing_user, otp_code, purpose='verification')

                return Response({
                    "message": "This email is already registered but not verified. A new OTP has been sent.",
                    "requires_verification": True,
                    "email": existing_user.email,
                    "otp": otp_code,
                }, status=status.HTTP_200_OK)

            # If user exists and is active → already registered
            return Response({
                "error": "Email already registered. Please login."
            }, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Check if username exists
        if User.objects.filter(username=username).exists():
            return Response({
                "error": "Username already taken."
            }, status=status.HTTP_400_BAD_REQUEST)

        # ✅ New user → normal registration
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

            # Send OTP email
            self._send_otp_email(user, otp_code, purpose='verification')

            return Response({
                "message": "Registration successful! Please verify your email with the OTP sent.",
                "userId": user.id,
                "email": user.email,
                "otp": otp_code,
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _send_otp_email(self, user, otp_code, purpose='verification'):
        """Helper to send OTP email (used for both registration and resend)"""
        try:
            from_email = os.environ.get('FROM_EMAIL', 'zeeshanansari1081015@gmail.com')
            if purpose == 'verification':
                subject = 'Verify Your Email - Online Quiz System'
                html_content = f"""
                <p>Hello {user.full_name or user.username},</p>
                <p>Thank you for registering! Your OTP for email verification is: <b>{otp_code}</b></p>
                <p>This OTP is valid for 10 minutes.</p>
                <p>If you did not register, please ignore this email.</p>
                <p>- Online Quiz Team</p>
                """
            else:  # password reset
                subject = 'Password Reset OTP - Online Quiz System'
                html_content = f"""
                <p>Hello {user.full_name or user.username},</p>
                <p>Your OTP for password reset is: <b>{otp_code}</b></p>
                <p>This OTP is valid for 10 minutes.</p>
                <p>- Online Quiz Team</p>
                """

            message = Mail(
                from_email=from_email,
                to_emails=user.email,
                subject=subject,
                html_content=html_content
            )
            sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
            response = sg.send(message)
            print(f"✅ Email sent to {user.email}, status: {response.status_code}")
        except Exception as e:
            print(f"❌ Email send failed: {e}")


class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']

            if not user.is_active:
                # BUGFIX (#4): check deactivation FIRST so a deactivated user
                # gets the correct message instead of "Email not verified".
                if getattr(user, 'deactivated_at', None):
                    return Response({
                        "error": f"Your account was deactivated on {user.deactivated_at.strftime('%Y-%m-%d')}. Please contact support to reactivate.",
                        "deactivated": True,
                    }, status=status.HTTP_403_FORBIDDEN)
                # ✅ Check if user is unverified (has pending OTP or never logged in)
                otp_exists = OTPVerification.objects.filter(
                    user=user,
                    purpose='Email Verification'
                ).exists()

                if otp_exists or not user.last_login:
                    # Resend OTP automatically
                    otp_code = str(random.randint(100000, 999999))
                    expires_at = timezone.now() + timezone.timedelta(minutes=10)

                    OTPVerification.objects.filter(user=user, purpose='Email Verification').delete()
                    OTPVerification.objects.create(
                        user=user,
                        otp_code=otp_code,
                        purpose='Email Verification',
                        expires_at=expires_at
                    )

                    # Send email
                    self._send_otp_email(user, otp_code, purpose='verification')

                    return Response({
                        "error": "Email not verified. A new OTP has been sent to your email.",
                        "requires_verification": True,
                        "email": user.email,
                    }, status=status.HTTP_403_FORBIDDEN)

                if hasattr(user, 'deactivated_at') and user.deactivated_at:
                    return Response({
                        "error": f"Your account was deactivated on {user.deactivated_at.strftime('%Y-%m-%d')}. Please contact support to reactivate."
                    }, status=status.HTTP_403_FORBIDDEN)

                return Response({
                    "error": "Please verify your email before logging in."
                }, status=status.HTTP_403_FORBIDDEN)

            # ✅ User is active → login
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

    def _send_otp_email(self, user, otp_code, purpose='verification'):
        """Same helper as RegisterView (reuse)"""
        try:
            from_email = os.environ.get('FROM_EMAIL', 'zeeshanansari1081015@gmail.com')
            if purpose == 'verification':
                subject = 'Verify Your Email - Online Quiz System'
                html_content = f"""
                <p>Hello {user.full_name or user.username},</p>
                <p>Your OTP for email verification is: <b>{otp_code}</b></p>
                <p>This OTP is valid for 10 minutes.</p>
                <p>- Online Quiz Team</p>
                """
            else:
                subject = 'Password Reset OTP - Online Quiz System'
                html_content = f"""
                <p>Hello {user.full_name or user.username},</p>
                <p>Your OTP for password reset is: <b>{otp_code}</b></p>
                <p>This OTP is valid for 10 minutes.</p>
                <p>- Online Quiz Team</p>
                """
            message = Mail(
                from_email=from_email,
                to_emails=user.email,
                subject=subject,
                html_content=html_content
            )
            sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
            response = sg.send(message)
            print(f"✅ Email sent to {user.email}, status: {response.status_code}")
        except Exception as e:
            print(f"❌ Email send failed: {e}")


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response({
            "message": "Profile updated successfully",
            "user": serializer.data
        })


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
            from_email = f"QuizGen AI <{os.environ.get('FROM_EMAIL', 'zeeshanansari1081015@gmail.com')}>"
            message = Mail(
                from_email=from_email,
                to_emails=email,
                subject='Password Reset OTP - Online Quiz System'
            )
            text_content = f"""
Hello {user.full_name or user.username},

Your OTP for password reset is: {otp_code}

This OTP is valid for 10 minutes.

If you did not request this, please ignore this email.

- Online Quiz Team
"""
            message.add_content(Content("text/plain", text_content))

            html_content = f"""
<div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
    <h2 style="color: #4F46E5;">Password Reset OTP</h2>
    <p>Hello <b>{user.full_name or user.username}</b>,</p>
    <p>Your OTP for password reset is:</p>
    <div style="font-size: 28px; font-weight: bold; color: #4F46E5; padding: 15px 0; text-align: center;">
        {otp_code}
    </div>
    <p>This OTP is valid for <b>10 minutes</b>.</p>
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
    <p style="font-size: 12px; color: #888;">
        If you did not request this, please ignore this email.
    </p>
    <p style="font-size: 12px; color: #888; margin-top: 10px;">
        - Online Quiz Team
    </p>
</div>
"""
            message.add_content(Content("text/html", html_content))

            sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
            response = sg.send(message)
            print(f"✅ Email sent to {email}, status: {response.status_code}")

        except Exception as e:
            print(f"❌ Email send failed: {e}")

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


class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response(
                {"error": "Old password and new password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.check_password(old_password):
            return Response(
                {"error": "Current password is incorrect"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(new_password) < 6:
            return Response(
                {"error": "New password must be at least 6 characters"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        return Response(
            {"message": "Password updated successfully"},
            status=status.HTTP_200_OK
        )

class UserSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "appearance": getattr(user, 'theme_preference', 'light'),
            "email_notifications": getattr(user, 'email_notifications', True),
            "push_notifications": getattr(user, 'push_notifications', False),
            "daily_quiz_goal": getattr(user, 'daily_quiz_goal', 3)
        })

    def patch(self, request):
        user = request.user
        data = request.data

        if 'appearance' in data:
            user.theme_preference = data['appearance']
        if 'email_notifications' in data:
            user.email_notifications = data['email_notifications']
        if 'push_notifications' in data:
            user.push_notifications = data['push_notifications']
        if 'daily_quiz_goal' in data:
            user.daily_quiz_goal = int(data['daily_quiz_goal'])

        user.save()
        user.refresh_from_db()

        return Response({
            "message": "Settings updated successfully",
            "settings": {
                "appearance": user.theme_preference,
                "email_notifications": user.email_notifications,
                "push_notifications": user.push_notifications,
                "daily_quiz_goal": user.daily_quiz_goal
            }
        }, status=status.HTTP_200_OK)


class AccountDestructionView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user
        
        user.is_active = False
        user.deactivated_at = timezone.now()
        user.save(update_fields=['is_active', 'deactivated_at'])
        
        return Response({
            "message": "Your account has been deactivated. It will be permanently deleted after 30 days. You can contact support to reactivate."
        }, status=status.HTTP_200_OK)
    
from django.core.cache import cache

class UserBadgesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        
        cache_key = f"user_badges_{user.id}"
        cached_data = cache.get(cache_key)
        
        if cached_data is not None:
            return Response(cached_data)
        
        user_badges = UserBadge.objects.filter(
            user=user, 
            status='CLAIMED'
        ).select_related('badge').order_by('-claimed_at')  
        
        badges_data = [
            {
                "badge_id": ub.badge.badge_id,
                "name": ub.badge.name,
                "description": ub.badge.description,
                "image_url": ub.badge.image_url,
                "category": ub.badge.category,
                "rarity": ub.badge.rarity,
                "claimed_at": ub.claimed_at,
                "status": ub.status
            }
            for ub in user_badges
        ]
        
        response_data = {
            "badges": badges_data,
            "count": len(badges_data)
        }
        
        cache.set(cache_key, response_data, 300)
        
        return Response(response_data)

class AchievementStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_badges = UserBadge.objects.filter(
            user=request.user, 
            status='CLAIMED'
        ).select_related('badge')
        total_badges = user_badges.count()
        rarity_counts = {}
        category_counts = {}

        for ub in user_badges:
            rarity = ub.badge.rarity
            category = ub.badge.category
            rarity_counts[rarity] = rarity_counts.get(rarity, 0) + 1
            category_counts[category] = category_counts.get(category, 0) + 1

        return Response({
            "total_badges": total_badges,
            "rarity_distribution": rarity_counts,
            "category_distribution": category_counts,
        })

class AchievementCategoriesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        categories = Badge.objects.values_list('category', flat=True).distinct().order_by('category')
        category_data = []
        for cat in categories:
            total = Badge.objects.filter(category=cat).count()
            earned = UserBadge.objects.filter(
                user=request.user, 
                badge__category=cat,
                status='CLAIMED'
            ).count()
            category_data.append({
                "name": cat,
                "total": total,
                "earned": earned,
            })
        return Response(category_data)
    
class AllBadgesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start_total = time.time()
        user = request.user
        
        cache_key = f"badges_all_{user.id}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            print(f"✅ [ALL BADGES CACHE HIT] user={user.id}")
            return Response(cached_data)
        
        print(f"⏳ [ALL BADGES CACHE MISS] user={user.id}, computing...")
        
        # ✅ Check if progress cache exists, if not compute it first
        progress_cache_key = f"badge_progress_{user.id}"
        progress_cached = cache.get(progress_cache_key)
        
        if not progress_cached:
            print(f"⏳ [PROGRESS CACHE MISS] user={user.id}, computing progress first...")
            # Compute progress and cache it (this will take 30s first time)
            progress_map = BadgeProgressHelper.get_all_progress(user, None)
            print(f"✅ [PROGRESS CACHE SET] user={user.id}")
        else:
            print(f"✅ [PROGRESS CACHE HIT] user={user.id}")
            progress_map = progress_cached
        
        # Precompute UserBadge data
        user_badges = UserBadge.objects.filter(user=user).select_related('badge')
        earned_ids = set()
        claimed_ids = set()
        awarded_at_map = {}
        claimed_at_map = {}
        
        for ub in user_badges:
            earned_ids.add(ub.badge.badge_id)
            awarded_at_map[ub.badge.badge_id] = ub.earned_at
            if ub.status == 'CLAIMED':
                claimed_ids.add(ub.badge.badge_id)
                claimed_at_map[ub.badge.badge_id] = ub.claimed_at
        
        t1 = time.time()
        badges = Badge.objects.all().order_by('badge_id')
        print(f"  📊 Badges fetched: {time.time() - t1:.2f}s")
        
        # ✅ Use cached progress_map (no recomputation)
        t2 = time.time()
        context = {
            'user': user,
            'progress_map': progress_map,
            'earned_ids': earned_ids,
            'claimed_ids': claimed_ids,
            'awarded_at_map': awarded_at_map,
            'claimed_at_map': claimed_at_map,
        }
        serializer = AllBadgeSerializer(badges, many=True, context=context)
        data = {
            "total": badges.count(),
            "claimable": len(earned_ids) - len(claimed_ids),
            "claimed": len(claimed_ids),
            "badges": serializer.data
        }
        print(f"  📦 Serialized: {time.time() - t2:.2f}s")
        
        # ✅ Cache the final response
        cache.set(cache_key, data, 600)
        print(f"✅ Total time: {time.time() - start_total:.2f}s")
        return Response(data)
    
class XPProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        next_level_xp = user.level * 100
        return Response({
            "level": user.level,
            "current_xp": user.xp,
            "next_level_xp": next_level_xp,
            "progress_percentage": round((user.xp / next_level_xp) * 100, 2) if next_level_xp > 0 else 0
        })

class ClaimBadgeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, badge_id):
        user = request.user

        try:
            badge = Badge.objects.get(badge_id=badge_id)
        except Badge.DoesNotExist:
            return Response({"error": "Badge not found"}, status=404)

        try:
            user_badge = UserBadge.objects.get(user=user, badge=badge)
        except UserBadge.DoesNotExist:
            return Response({
                "error": "You haven't unlocked this badge yet. Keep going!"
            }, status=403)

        if user_badge.status == 'CLAIMED':
            return Response({
                "error": "Badge already claimed",
                "claimed_at": user_badge.claimed_at
            }, status=400)

        if user_badge.status == 'CLAIMABLE':
            user_badge.status = 'CLAIMED'
            user_badge.claimed_at = timezone.now()
            user_badge.save()

            # Award XP  use the badge's own xp_reward so it matches the
            # total_points recomputation in attempts/signals.py (which sums
            # badge__xp_reward for CLAIMED badges). Keeping these in sync
            # prevents points from drifting on the next quiz submit.
            xp_reward = badge.xp_reward or 10
            user.xp += xp_reward
            # total_points is recomputed authoritatively as quiz_score_sum +
            # claimed_badge_xp; set it directly here too so the response is
            # immediately correct without waiting for a quiz submit.
            from apps.attempts.models import QuizAttempt
            from django.db.models import Sum as _Sum
            quiz_score_total = QuizAttempt.objects.filter(
                user=user, submitted_at__isnull=False
            ).aggregate(total=_Sum('score'))['total'] or 0
            badge_xp = UserBadge.objects.filter(
                user=user, status='CLAIMED'
            ).aggregate(total=_Sum('badge__xp_reward'))['total'] or 0
            user.total_points = quiz_score_total + badge_xp
            user.save()

            # ✅ Clear all caches
            cache.delete(f"badges_all_{user.id}")
            cache.delete(f"user_badges_{user.id}")
            cache.delete(f"badge_count_{user.id}")
            BadgeProgressHelper.clear_progress_cache(user)

            # #17: create a claim notification (also drives the celebratory
            # full-screen animation on the frontend) and return the badge
            # metadata the animation needs.
            try:
                from apps.notifications.services import notify_badge_claimed
                notify_badge_claimed(user, badge, xp_reward)
            except Exception as e:
                print(f"[claim-notify] skipped: {e}")

            return Response({
                "message": "Badge claimed successfully!",
                "badge_id": badge.badge_id,
                "status": "CLAIMED",
                "claimed_at": user_badge.claimed_at,
                "xp_earned": xp_reward,
                "new_total_xp": user.xp,
                # extra fields so the claim animation can render the badge
                "badge": {
                    "badge_id": badge.badge_id,
                    "name": badge.name,
                    "description": badge.description,
                    "image_url": badge.image_url,
                    "rarity": badge.rarity,
                    "category": badge.category,
                },
                "celebrate": True,
            }, status=200)
        else:
            return Response({"error": "Invalid badge status"}, status=400)

class CheckAndUnlockBadgesView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        unlocked_count = 0
        unlocked_badges = []

        all_badges = Badge.objects.all()

        for badge in all_badges:
            # Check if user already has a UserBadge row
            existing = UserBadge.objects.filter(user=user, badge=badge).first()
            if existing:
                continue

            # Check if user meets the requirement
            if BadgeProgressHelper.is_requirement_met(user, badge):
                user_badge = UserBadge.objects.create(
                    user=user,
                    badge=badge,
                    status='CLAIMABLE',
                    earned_at=timezone.now()
                )
                unlocked_count += 1
                unlocked_badges.append({
                    "badge_id": badge.badge_id,
                    "name": badge.name,
                    "status": "CLAIMABLE"
                })

        # Clear all caches
        if unlocked_count > 0:
            cache.delete(f"badges_all_{user.id}")
            cache.delete(f"user_badges_{user.id}")
            cache.delete(f"badge_count_{user.id}")

        return Response({
            "message": f"{unlocked_count} new badge(s) unlocked!",
            "unlocked_count": unlocked_count,
            "unlocked_badges": unlocked_badges
        }, status=status.HTTP_200_OK)