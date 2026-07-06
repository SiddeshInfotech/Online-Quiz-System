from django.db import models
from django.conf import settings

class OTPVerification(models.Model):
    PURPOSE_CHOICES = (
        ('Registration', 'Registration'),
        ('Login', 'Login'),
        ('Password Reset', 'Password Reset'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    otp_code = models.CharField(max_length=10)
    purpose = models.CharField(max_length=50, choices=PURPOSE_CHOICES)
    expires_at = models.DateTimeField()
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"OTP for {self.user.username}"