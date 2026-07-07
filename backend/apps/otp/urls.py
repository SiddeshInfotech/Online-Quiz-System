from django.urls import path
from .views import OTPSendView, OTPVerifyView, PasswordResetView

urlpatterns = [
    path('send/', OTPSendView.as_view(), name='otp-send'),
    path('verify/', OTPVerifyView.as_view(), name='otp-verify'),
    path('reset-password/', PasswordResetView.as_view(), name='otp-reset-password'),
]