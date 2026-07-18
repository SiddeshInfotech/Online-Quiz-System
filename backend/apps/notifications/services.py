"""
Central place that creates in-app notifications so the rules live in one file
instead of being scattered. All calls are defensive  a notification failure
must never break a quiz submit or a badge claim.
"""
from django.utils import timezone
from apps.notifications.models import Notification


def notify_badge_claimable(user, badge):
    """Fire when an achievement is completed and the badge becomes CLAIMABLE (#7/#13)."""
    try:
        # Idempotent: don't create a second 'claimable' notice for the same badge.
        exists = Notification.objects.filter(
            user=user, type='achievement', reference_id=badge.badge_id
        ).exists()
        if exists:
            return None
        return Notification.objects.create(
            user=user,
            type='achievement',
            reference_id=badge.badge_id,
            title=f"Achievement unlocked: {badge.name}",
            message=f"You've earned the '{badge.name}' badge. Claim it to collect "
                    f"{badge.xp_reward or 10} XP.",
        )
    except Exception as e:
        print(f"[notify] badge_claimable skipped: {e}")
        return None


def notify_badge_claimed(user, badge, xp_reward):
    """Fire when the user claims a badge (feeds the claim animation on #17)."""
    try:
        return Notification.objects.create(
            user=user,
            type='badge_claimed',
            reference_id=badge.badge_id,
            title=f"Badge claimed: {badge.name}",
            message=f"Nice! '{badge.name}' is now in your collection. +{xp_reward} XP.",
        )
    except Exception as e:
        print(f"[notify] badge_claimed skipped: {e}")
        return None


def notify_daily_goal_complete(user, completed, target):
    """
    Fire once per day when the user reaches their daily quiz goal (#7).
    Idempotent per calendar day so we don't notify on every extra quiz.
    """
    try:
        today = timezone.localdate()
        already = Notification.objects.filter(
            user=user,
            type='daily_goal',
            created_at__date=today,
        ).exists()
        if already:
            return None
        return Notification.objects.create(
            user=user,
            type='daily_goal',
            title="Daily goal complete",
            message=f"You hit your goal of {target} quizzes today ({completed}/{target}). "
                    f"Keep the streak going!",
        )
    except Exception as e:
        print(f"[notify] daily_goal skipped: {e}")
        return None
