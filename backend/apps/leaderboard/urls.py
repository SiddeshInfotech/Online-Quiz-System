from django.urls import path
from .views import QuizLeaderboardView, GlobalLeaderboardView

urlpatterns = [
    path('leaderboard/quiz/<int:quiz_id>/', QuizLeaderboardView.as_view(), name='quiz-leaderboard'),
    path('leaderboard/global/', GlobalLeaderboardView.as_view(), name='global-leaderboard'),
]