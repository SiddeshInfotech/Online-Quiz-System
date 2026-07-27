from django.urls import path
from apps.users.views import LoginView
from .views import (
    AdminDashboardAnalyticsView,
    AdminUserListView,
    AdminUserToggleStatusView,
    AdminUserSuspendView,
    AdminUserActivateView,
    AdminUserDeleteView,
    AdminQuizListCreateView,
    AdminQuizDetailUpdateDeleteView,
    AdminQuizToggleVisibilityView,
    AdminPenaltyLogListView,
    AdminSupportMessageListView,
    AdminSupportMessageToggleResolveView,
    AdminSupportMessageReplyView,
    AdminSubscriptionStatsView,
    AdminSubscriptionsListView,
    AdminSubscriptionActionView,
    AdminNotificationsListView,
    AdminNotificationsUnreadCountView,
    AdminNotificationsMarkReadView
)
from apps.feedback.admin_views import (
    AdminFeedbackListView,
    AdminFeedbackDetailUpdateDeleteView,
    AdminFeedbackReplyView,
    AdminFeedbackHideView,
    AdminFeedbackStatsView
)

from apps.ai_generator.views import AdminGenerateAIQuizView

urlpatterns = [
    # Auth
    path('auth/login/', LoginView.as_view(), name='admin-auth-login'),
    path('login/', LoginView.as_view(), name='admin-login'),

    # A. Analytics
    path('analytics/', AdminDashboardAnalyticsView.as_view(), name='admin-analytics'),

    # AI Quiz Generation (Admin Dedicated Routes)
    path('ai/generate-quiz/', AdminGenerateAIQuizView.as_view(), name='admin-ai-generate-quiz'),
    path('ai/generate/', AdminGenerateAIQuizView.as_view(), name='admin-ai-generate-alias'),
    path('quizzes/generate-ai/', AdminGenerateAIQuizView.as_view(), name='admin-quizzes-generate-ai'),

    # B. Users
    path('users/', AdminUserListView.as_view(), name='admin-users-list'),
    path('users/<int:pk>/', AdminUserDeleteView.as_view(), name='admin-users-detail-delete'),
    path('users/<int:pk>/suspend/', AdminUserSuspendView.as_view(), name='admin-users-suspend'),
    path('users/<int:pk>/activate/', AdminUserActivateView.as_view(), name='admin-users-activate'),
    path('users/<int:pk>/toggle-status/', AdminUserToggleStatusView.as_view(), name='admin-users-toggle-status'),

    # C. Quizzes & Moderation
    path('quizzes/', AdminQuizListCreateView.as_view(), name='admin-quizzes-list-create'),
    path('quizzes/create/', AdminQuizListCreateView.as_view(), name='admin-quizzes-create-alias'),
    path('quizzes/<int:pk>/', AdminQuizDetailUpdateDeleteView.as_view(), name='admin-quizzes-detail-update-delete'),
    path('quizzes/<int:pk>/delete/', AdminQuizDetailUpdateDeleteView.as_view(), name='admin-quizzes-delete-alias'),
    path('quizzes/<int:pk>/toggle-visibility/', AdminQuizToggleVisibilityView.as_view(), name='admin-quizzes-toggle-visibility'),

    # D. Penalty logs
    path('penalties/', AdminPenaltyLogListView.as_view(), name='admin-penalties-list'),

    # E. Support
    path('support/', AdminSupportMessageListView.as_view(), name='admin-support-list'),
    path('support/<int:pk>/', AdminSupportMessageToggleResolveView.as_view(), name='admin-support-toggle-resolve'),
    path('support/<int:pk>/reply/', AdminSupportMessageReplyView.as_view(), name='admin-support-reply'),

    # F. Feedback Moderation
    path('feedback/', AdminFeedbackListView.as_view(), name='custom-admin-feedback-list'),
    path('feedback/stats/', AdminFeedbackStatsView.as_view(), name='custom-admin-feedback-stats'),
    path('feedback/<int:pk>/', AdminFeedbackDetailUpdateDeleteView.as_view(), name='custom-admin-feedback-detail'),
    path('feedback/<int:pk>/reply/', AdminFeedbackReplyView.as_view(), name='custom-admin-feedback-reply'),
    path('feedback/<int:pk>/hide/', AdminFeedbackHideView.as_view(), name='custom-admin-feedback-hide'),

    # G. Subscription Management
    path('subscriptions/stats/', AdminSubscriptionStatsView.as_view(), name='admin-subscriptions-stats'),
    path('subscriptions/', AdminSubscriptionsListView.as_view(), name='admin-subscriptions-list'),
    path('subscriptions/<int:user_id>/action/', AdminSubscriptionActionView.as_view(), name='admin-subscriptions-action'),

    # H. Admin Panel Real-Time Notifications
    path('notifications/', AdminNotificationsListView.as_view(), name='admin-notifications-list'),
    path('notifications/unread-count/', AdminNotificationsUnreadCountView.as_view(), name='admin-notifications-unread-count'),
    path('notifications/mark-read/', AdminNotificationsMarkReadView.as_view(), name='admin-notifications-mark-read'),
    path('notifications/<int:pk>/read/', AdminNotificationsMarkReadView.as_view(), name='admin-notifications-mark-read-pk'),
]
