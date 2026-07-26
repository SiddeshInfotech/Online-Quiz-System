from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import Notification

User = get_user_model()

def send_admin_notification(title, message, notification_type='system', reference_id=None):
    """
    Authoritative helper to send real-time notification to all Admin & Superuser accounts.
    """
    admin_users = User.objects.filter(
        Q(is_superuser=True) | Q(role='Admin') | Q(username__iexact='admin') | Q(is_staff=True)
    ).distinct()

    notifications = [
        Notification(
            user=admin,
            title=title,
            message=message,
            type=notification_type[:32],
            reference_id=reference_id
        )
        for admin in admin_users
    ]

    if notifications:
        Notification.objects.bulk_create(notifications)
