from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import Sum, Max
from django.utils import timezone
from django.core.cache import cache
from django.contrib.auth.signals import user_logged_in  # ✅ NEW
from .models import QuizAttempt, Result
from apps.users.models import User, Badge, UserBadge
from apps.users.services.badge_progress import BadgeProgressHelper


@receiver(post_save, sender=QuizAttempt)
def update_user_stats(sender, instance, created, **kwargs):
    if not instance.submitted_at:
        return

    # Trigger stats computation, badge checks and notifications asynchronously in background thread
    from .tasks import process_quiz_submission_background
    process_quiz_submission_background(instance.user.id, instance.id)


# ✅ NEW: Check badges on every login (covers existing users)
@receiver(user_logged_in)
def check_badges_on_login(sender, request, user, **kwargs):
    _unlock_badges_for_user(user)


def _unlock_badges_for_user(user):
    """
    Unlock badges whose requirements are met using the centralized evaluator.
    """
    try:
        from apps.users.services.badge_progress import evaluate_user_badges
        return evaluate_user_badges(user)
    except Exception as e:
        print(f"[badge-unlock] skipped due to error: {e}")
        return []

