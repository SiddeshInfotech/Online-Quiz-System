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
    Unlock badges whose requirements are met.

    Performance fix (item 9): progress is computed ONCE for all not-yet-earned
    badges via get_met_badge_ids, instead of recomputing the full progress map
    per badge (which caused slow quiz-submit / axios timeout). Fully wrapped so
    badge logic can never break or block a quiz submission.
    """
    try:
        earned_badge_ids = set(
            UserBadge.objects.filter(user=user).values_list("badge_id", flat=True)
        )
        candidate_badges = [b for b in Badge.objects.all() if b.id not in earned_badge_ids]
        if not candidate_badges:
            return

        met_ids = BadgeProgressHelper.get_met_badge_ids(user, candidate_badges)

        new_userbadges = []
        newly_unlocked = []
        for badge in candidate_badges:
            if badge.badge_id in met_ids:
                new_userbadges.append(
                    UserBadge(
                        user=user,
                        badge=badge,
                        status="CLAIMABLE",
                        earned_at=timezone.now(),
                    )
                )
                newly_unlocked.append(badge)

        if new_userbadges:
            UserBadge.objects.bulk_create(new_userbadges, ignore_conflicts=True)
            cache.delete(f"badges_all_{user.id}")
            cache.delete(f"user_badges_{user.id}")
            cache.delete(f"badge_count_{user.id}")
            BadgeProgressHelper.clear_progress_cache(user)

            # #7/#13: notify the user for each achievement that just completed.
            from apps.notifications.services import notify_badge_claimable
            for badge in newly_unlocked:
                notify_badge_claimable(user, badge)

            from django.utils import timezone
            from .tasks import compute_badge_progress_async
            compute_badge_progress_async(user.id)

            print(
                f"Unlocked {len(new_userbadges)} badge(s) for {user.username}: "
                f"{', '.join(b.name for b in newly_unlocked)}"
            )
    except Exception as e:
        print(f"[badge-unlock] skipped due to error: {e}")
