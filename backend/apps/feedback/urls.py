from django.urls import path
from .views import (
    FeedbackCreateView,
    FeedbackListView,
    FeedbackSummaryView,
    MyFeedbackView,
    MyFeedbackDeleteView
)

urlpatterns = [
    path('', FeedbackListView.as_view(), name='feedback-list'),
    path('submit/', FeedbackCreateView.as_view(), name='feedback-submit'),
    path('summary/', FeedbackSummaryView.as_view(), name='feedback-summary'),
    path('me/', MyFeedbackView.as_view(), name='feedback-me'),
    path('me/delete/', MyFeedbackDeleteView.as_view(), name='feedback-delete'),
]