from django.urls import path
from .subscription_views import (
    UserSubscriptionView,
    SubscriptionPlansView,
    SubscriptionUpgradeView,
    SubscriptionCancelView,
    CreateRazorpayOrderView,
    VerifyRazorpayPaymentView
)

urlpatterns = [
    path('me/', UserSubscriptionView.as_view(), name='subscription-me'),
    path('plans/', SubscriptionPlansView.as_view(), name='subscription-plans'),
    path('upgrade/', SubscriptionUpgradeView.as_view(), name='subscription-upgrade'),
    path('cancel/', SubscriptionCancelView.as_view(), name='subscription-cancel'),
    path('create-order/', CreateRazorpayOrderView.as_view(), name='subscription-create-order'),
    path('verify-payment/', VerifyRazorpayPaymentView.as_view(), name='subscription-verify-payment'),
]
