import random
import string
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from .models import OTPVerification
from apps.users.models import User

def generate_otp(length=6):
    return ''.join(random.choices(string.digits, k=length))

def send_otp_email(user, otp_code, purpose='Password Reset'):
    subject = f"{purpose} OTP for Online Quiz System"
    message = f"""
    Hello {user.full_name or user.username},
    
    Your OTP for {purpose.lower()} is: {otp_code}
    
    This OTP is valid for 10 minutes.
    
    If you didn't request this, please ignore this email.
    
    Regards,
    Online Quiz System Team
    """
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = [user.email]
    send_mail(subject, message, from_email, recipient_list, fail_silently=False)

def create_and_send_otp(email, purpose='Password Reset'):
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return None, None

    otp_code = generate_otp()
    expires_at = timezone.now() + timedelta(minutes=10)

    OTPVerification.objects.filter(user=user, purpose=purpose, is_verified=False).update(is_verified=True)

    otp_record = OTPVerification.objects.create(
        user=user,
        otp_code=otp_code,
        purpose=purpose,
        expires_at=expires_at,
        is_verified=False
    )

    send_otp_email(user, otp_code, purpose)
    return otp_code, user

def verify_otp(email, otp_code, purpose='Password Reset'):
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return None, False

    try:
        otp_record = OTPVerification.objects.get(
            user=user,
            otp_code=otp_code,
            purpose=purpose,
            is_verified=False,
            expires_at__gt=timezone.now()
        )
        
        otp_record.is_verified = True
        otp_record.save()
        return user, True
    except OTPVerification.DoesNotExist:
        return user, False
