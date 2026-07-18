from django.urls import path
from .views import UserBadgesView, AchievementStatsView, AchievementCategoriesView, AllBadgesView, XPProgressView, ClaimBadgeView, CheckAndUnlockBadgesView

urlpatterns = [
    path('badges/', UserBadgesView.as_view(), name='achievement-badges'),
    path('stats/', AchievementStatsView.as_view(), name='achievement-stats'),
    path('categories/', AchievementCategoriesView.as_view(), name='achievement-categories'),
    path('all/', AllBadgesView.as_view(), name='achievement-all'),
    path('progress/', XPProgressView.as_view(), name='achievement-progress'),
    path('claim/<int:badge_id>/', ClaimBadgeView.as_view(), name='claim-badge'),
    path('check-unlock/', CheckAndUnlockBadgesView.as_view(), name='check-unlock-badges'),
]