from django.urls import path
from .views import DashboardSummaryView, PerformanceAnalyticsView

urlpatterns = [
    path('summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('performance/', PerformanceAnalyticsView.as_view(), name='performance-analytics'),
]