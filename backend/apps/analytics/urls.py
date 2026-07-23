from django.urls import path
from .views import DashboardSummaryView, SubjectPerformanceView
from apps.leaderboard.views import GlobalLeaderboardView

urlpatterns = [
    path('summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('subject-performance/', SubjectPerformanceView.as_view(), name='subject-performance'),
    path('subjects/', SubjectPerformanceView.as_view(), name='analytics-subjects'),
    path('leaderboard/', GlobalLeaderboardView.as_view(), name='analytics-leaderboard'),
]