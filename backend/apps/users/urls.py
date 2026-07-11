from django.urls import path
from .views import RegisterView, LoginView, ProfileView, GoogleLoginView,ForgotPasswordView, VerifyOTPView, ResetPasswordView, VerifyEmailView, ResendOTPView, PasswordChangeView


urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('google-login/', GoogleLoginView.as_view(), name='google-login'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('resend-otp/', ResendOTPView.as_view(), name='resend-otp'),
    path('change-password/', PasswordChangeView.as_view(), name='change-password'),
]