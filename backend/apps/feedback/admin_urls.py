from django.urls import path
from .admin_views import (
    AdminFeedbackListView,
    AdminFeedbackDetailUpdateDeleteView,
    AdminFeedbackReplyView,
    AdminFeedbackHideView,
    AdminFeedbackStatsView
)

urlpatterns = [
    path('', AdminFeedbackListView.as_view(), name='admin-feedback-list-root'),
    path('stats/', AdminFeedbackStatsView.as_view(), name='admin-feedback-stats-root'),
    path('<int:pk>/', AdminFeedbackDetailUpdateDeleteView.as_view(), name='admin-feedback-detail-root'),
    path('<int:pk>/reply/', AdminFeedbackReplyView.as_view(), name='admin-feedback-reply-root'),
    path('<int:pk>/hide/', AdminFeedbackHideView.as_view(), name='admin-feedback-hide-root'),
]
