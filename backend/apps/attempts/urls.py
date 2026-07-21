from django.urls import path
from .views import (
    StartAttemptView,
    SubmitAttemptView,
    AttemptDetailView,
    UserAttemptsHistoryView,
    SaveAnswerView,
    AttemptResultView,
    AttemptReviewView,
    LogViolationView
)

urlpatterns = [
    path('start/', StartAttemptView.as_view(), name='start-attempt'),
    path('<int:attempt_id>/submit/', SubmitAttemptView.as_view(), name='submit-attempt'),
    path('<int:attempt_id>/review/', AttemptReviewView.as_view(), name='attempt-review'),
    path('<int:attempt_id>/result/', AttemptResultView.as_view(), name='attempt-result'),
    path('history/', UserAttemptsHistoryView.as_view(), name='user-attempts-history'),
    path('<int:attempt_id>/answer/', SaveAnswerView.as_view(), name='save-answer'),
    path('<int:pk>/', AttemptDetailView.as_view(), name='attempt-detail'),
    path('<int:attempt_id>/log-violation/', LogViolationView.as_view(), name='log-violation'),
]