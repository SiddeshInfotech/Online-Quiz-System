from django.urls import path
from .views import (
    UserBadgesView, AchievementStatsView, AchievementCategoriesView,
    AllBadgesView, XPProgressView, ClaimBadgeView, CheckAndUnlockBadgesView
)

urlpatterns = [
    path('', AllBadgesView.as_view(), name='badges-root'),
    path('user/', UserBadgesView.as_view(), name='badges-user'),
    path('me/', UserBadgesView.as_view(), name='badges-me'),
    path('all/', AllBadgesView.as_view(), name='badges-all'),
    path('stats/', AchievementStatsView.as_view(), name='badges-stats'),
    path('categories/', AchievementCategoriesView.as_view(), name='badges-categories'),
    path('progress/', XPProgressView.as_view(), name='badges-progress'),
    path('claim/<int:badge_id>/', ClaimBadgeView.as_view(), name='badges-claim-1'),
    path('<int:badge_id>/claim/', ClaimBadgeView.as_view(), name='badges-claim-2'),
    path('check-unlock/', CheckAndUnlockBadgesView.as_view(), name='badges-check-unlock'),
]
