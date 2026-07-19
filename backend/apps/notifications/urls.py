from django.urls import path
from .views import (
    NotificationListView,
    NotificationCreateView,
    NotificationMarkReadView,
    NotificationMarkAllReadView,
    NotificationMarkAsReadView,
    NotificationUnreadCountView
)

urlpatterns = [
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/create/', NotificationCreateView.as_view(), name='notification-create'),
    path('notifications/<int:pk>/read/', NotificationMarkReadView.as_view(), name='notification-mark-read'),
    path('notifications/read-all/', NotificationMarkAllReadView.as_view(), name='notification-mark-all-read'),
    path('mark-as-read/', NotificationMarkAsReadView.as_view(), name='notification-mark-as-read'),
    path('unread-count/', NotificationUnreadCountView.as_view(), name='notification-unread-count'),
]