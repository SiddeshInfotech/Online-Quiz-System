from django.urls import path
from apps.users.views import LoginView
from .views import (
    AdminDashboardAnalyticsView,
    AdminUserListView,
    AdminUserToggleStatusView,
    AdminQuizListCreateView,
    AdminQuizDetailUpdateDeleteView,
    AdminQuizToggleVisibilityView,
    AdminPenaltyLogListView,
    AdminSupportMessageListView,
    AdminSupportMessageToggleResolveView
)

urlpatterns = [
    # Auth
    path('auth/login/', LoginView.as_view(), name='admin-auth-login'),
    path('login/', LoginView.as_view(), name='admin-login'),

    # A. Analytics
    path('analytics/', AdminDashboardAnalyticsView.as_view(), name='admin-analytics'),

    # B. Users
    path('users/', AdminUserListView.as_view(), name='admin-users-list'),
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
]
