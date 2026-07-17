from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import Sum, Max
from django.utils import timezone
from django.core.cache import cache
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

    # --- NEW: Auto-unlock badges ---
    _unlock_badges_for_user(user)


def _unlock_badges_for_user(user):
    """Helper function to unlock badges when requirements are met"""
    all_badges = Badge.objects.all()
    unlocked_count = 0

    for badge in all_badges:
        # Check if user already has a UserBadge row
        existing = UserBadge.objects.filter(user=user, badge=badge).first()
        if existing:
            continue

        # Check if requirement is met
        if BadgeProgressHelper.is_requirement_met(user, badge):
            UserBadge.objects.create(
                user=user,
                badge=badge,
                status='CLAIMABLE',
                awarded_at=timezone.now()
            )
            unlocked_count += 1

    # Clear cache if any badges unlocked
    if unlocked_count > 0:
        cache.delete(f"badges_all_{user.id}")