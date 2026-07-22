from django.urls import path
from .views import DashboardSummaryView
from apps.leaderboard.views import GlobalLeaderboardView

urlpatterns = [
    path('summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('leaderboard/', GlobalLeaderboardView.as_view(), name='analytics-leaderboard'),
]