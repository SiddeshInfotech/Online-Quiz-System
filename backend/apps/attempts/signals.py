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

    user = instance.user

    # Existing stats update
    try:
        result = Result.objects.get(attempt=instance)
        points = result.total_score or instance.score or 0
    except Result.DoesNotExist:
        points = instance.score or 0

    total_points = QuizAttempt.objects.filter(
        user=user, submitted_at__isnull=False
    ).aggregate(total=Sum('score'))['total'] or 0

    quizzes_completed = QuizAttempt.objects.filter(
        user=user, submitted_at__isnull=False
    ).count()

    User.objects.filter(id=user.id).update(
        total_points=total_points,
        quizzes_completed=quizzes_completed
    )

    # Auto-unlock badges
    _unlock_badges_for_user(user)


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
        unlocked_badge_names = []
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
                unlocked_badge_names.append(badge.name)

        if new_userbadges:
            UserBadge.objects.bulk_create(new_userbadges, ignore_conflicts=True)
            cache.delete(f"badges_all_{user.id}")
            cache.delete(f"user_badges_{user.id}")
            cache.delete(f"badge_count_{user.id}")
            print(
                f"Unlocked {len(new_userbadges)} badge(s) for {user.username}: "
                f"{', '.join(unlocked_badge_names)}"
            )
    except Exception as e:
        print(f"[badge-unlock] skipped due to error: {e}")
