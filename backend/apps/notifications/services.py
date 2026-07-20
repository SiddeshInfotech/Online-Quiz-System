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


def trigger_proactive_notifications(user):
    """
    Trigger proactive alerts for the user:
    1. Daily Goal Warning: Alert if Today's Goal is active but incomplete as the day progresses.
    2. Unclaimed Badges Reminder: Alert if user has unclaimed/CLAIMABLE badges waiting.
    """
    try:
        from django.utils import timezone
        from apps.attempts.models import QuizAttempt
        from apps.users.models import UserBadge
        from apps.notifications.models import Notification

        today = timezone.localdate()
        
        # 1. Daily Goal Warning
        completed_today = QuizAttempt.objects.filter(
            user=user, submitted_at__date=today
        ).exclude(submitted_at__isnull=True).count()
        target = getattr(user, 'daily_quiz_goal', 3) or 3
        
        if completed_today < target:
            warning_exists = Notification.objects.filter(
                user=user,
                type='daily_goal',
                title__icontains="warning",
                created_at__date=today
            ).exists()
            if not warning_exists:
                Notification.objects.create(
                    user=user,
                    type='daily_goal',
                    title="Daily goal warning",
                    message=f"You have only completed {completed_today} of your {target} quiz goal for today. Keep going to maintain your streak!",
                )

        # 2. Unclaimed Badges Reminder
        claimable_badges = UserBadge.objects.filter(user=user, status='CLAIMABLE').select_related('badge')
        badge_ids = [ub.badge.badge_id for ub in claimable_badges]

        if badge_ids:
            # Bulk query checking to avoid N+1 queries
            existing_reminders = set(Notification.objects.filter(
                user=user,
                type='achievement',
                title__icontains="unclaimed",
                reference_id__in=badge_ids
            ).values_list('reference_id', flat=True))

            for ub in claimable_badges:
                badge_id = ub.badge.badge_id
                if badge_id not in existing_reminders:
                    Notification.objects.create(
                        user=user,
                        type='achievement',
                        reference_id=badge_id,
                        title=f"Unclaimed Badge: {ub.badge.name}",
                        message=f"You have an unclaimed '{ub.badge.name}' badge waiting for you! Claim it now to collect your +{ub.badge.xp_reward or 10} XP reward.",
                    )
    except Exception as e:
        print(f"[proactive-notify] skipped: {e}")
