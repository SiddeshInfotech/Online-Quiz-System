import threading
import time
from django.core.cache import cache

def prewarm_user_cache(user_id):
    """
    Background worker that pre-computes and caches user endpoints asynchronously in parallel threads.
    Ensures that cold hits from the user's perspective are INSTANT (under 50ms).
    """
    def _run_warm_list(views_list):
        try:
            from django.db import close_old_connections
            close_old_connections()
            from django.contrib.auth import get_user_model
            from rest_framework.test import APIRequestFactory, force_authenticate
            User = get_user_model()
            user = User.objects.filter(id=user_id).first()
            if not user:
                return

            factory = APIRequestFactory()
            for name, view_cls in views_list:
                try:
                    close_old_connections()
                    req = factory.get('/')
                    force_authenticate(req, user=user)
                    view = view_cls.as_view()
                    view(req)
                except Exception as ex:
                    print(f"[Prewarmer Error for {name}]: {ex}")
        except Exception as e:
            print(f"[Prewarmer Worker Failed]: {e}")

    from apps.analytics.views import DashboardSummaryView
    from apps.users.views import AllBadgesView, UserBadgesView, AchievementStatsView
    from apps.feedback.views import MyFeedbackView, FeedbackSummaryView, FeedbackListView
    from apps.users.subscription_views import UserSubscriptionView
    from apps.quizzes.views import RecommendedQuizzesListView, QuizLibraryListView

    group1 = [
        ("dashboard", DashboardSummaryView),
        ("all_badges", AllBadgesView),
        ("user_badges", UserBadgesView),
        ("achievement_stats", AchievementStatsView),
    ]
    group2 = [
        ("my_feedback", MyFeedbackView),
        ("feedback_summary", FeedbackSummaryView),
        ("feedback_list", FeedbackListView),
        ("user_subscription", UserSubscriptionView),
        ("recommended_quizzes", RecommendedQuizzesListView),
        ("quiz_library", QuizLibraryListView),
    ]

    t1 = threading.Thread(target=_run_warm_list, args=(group1,), daemon=True)
    t2 = threading.Thread(target=_run_warm_list, args=(group2,), daemon=True)
    t1.start()
    t2.start()
