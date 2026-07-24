from django.urls import path
from .views import (
    FeedbackCreateView,
    FeedbackListView,
    FeedbackSummaryView,
    MyFeedbackView,
    MyFeedbackDetailView,
)

from .admin_views import (
    AdminFeedbackListView,
    AdminFeedbackDetailUpdateDeleteView,
    AdminFeedbackReplyView,
    AdminFeedbackHideView,
    AdminFeedbackStatsView
)

urlpatterns = [
    path('', FeedbackListView.as_view(), name='feedback-list'),
    path('submit/', FeedbackCreateView.as_view(), name='feedback-submit'),
    path('summary/', FeedbackSummaryView.as_view(), name='feedback-summary'),
    path('me/', MyFeedbackView.as_view(), name='feedback-me'),
    
    # 🛠️ Admin Feedback Management Endpoints
    path('admin/', AdminFeedbackListView.as_view(), name='admin-feedback-list'),
    path('admin/stats/', AdminFeedbackStatsView.as_view(), name='admin-feedback-stats'),
    path('admin/<int:pk>/', AdminFeedbackDetailUpdateDeleteView.as_view(), name='admin-feedback-detail'),
    path('admin/<int:pk>/reply/', AdminFeedbackReplyView.as_view(), name='admin-feedback-reply'),
    path('admin/<int:pk>/hide/', AdminFeedbackHideView.as_view(), name='admin-feedback-hide'),

    path('<int:pk>/', MyFeedbackDetailView.as_view(), name='feedback-detail'),
]
