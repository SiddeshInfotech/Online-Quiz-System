from django.urls import path
from .views import (
    StartAttemptView, 
    SubmitAttemptView, 
    UserResultsView, 
    ResultDetailView,
    AttemptDetailView, 
    UserAttemptsHistoryView
)

urlpatterns = [
   
    path('attempts/start/', StartAttemptView.as_view(), name='start-attempt'),
    
    path('attempts/<int:attempt_id>/submit/', SubmitAttemptView.as_view(), name='submit-attempt'),
    
    path('results/', UserResultsView.as_view(), name='user-results'),
    
    path('results/<int:pk>/', ResultDetailView.as_view(), name='result-detail'),
    
    path('attempts/<int:attempt_id>/', AttemptDetailView.as_view(), name='attempt-detail'),     

    path('history/', UserAttemptsHistoryView.as_view(), name='user-attempts-history'),
]