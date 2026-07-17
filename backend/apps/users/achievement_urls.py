from django.urls import path
from .views import UserBadgesView, AchievementStatsView, AchievementCategoriesView, AllBadgesView

urlpatterns = [
    path('badges/', UserBadgesView.as_view(), name='achievement-badges'),
    path('stats/', AchievementStatsView.as_view(), name='achievement-stats'),
    path('categories/', AchievementCategoriesView.as_view(), name='achievement-categories'),
    path('all/', AllBadgesView.as_view(), name='achievement-all'),
]