from django.urls import path
from .views import (
    StartAttemptView,
    SubmitAttemptView,
    UserResultsView,
    ResultDetailView,
    AttemptDetailView,
    UserAttemptsHistoryView,
    AttemptResultDetailView
)

urlpatterns = [
    path('start/', StartAttemptView.as_view(), name='start-attempt'),
    path('<int:attempt_id>/submit/', SubmitAttemptView.as_view(), name='submit-attempt'),
    path('<int:pk>/', AttemptDetailView.as_view(), name='attempt-detail'),
    path('<int:attempt_id>/results/', AttemptResultDetailView.as_view(), name='attempt-result-detail'),
    path('results/', UserResultsView.as_view(), name='user-results'),
    path('results/<int:pk>/', ResultDetailView.as_view(), name='result-detail'),
    path('history/', UserAttemptsHistoryView.as_view(), name='user-attempts-history'),
]
