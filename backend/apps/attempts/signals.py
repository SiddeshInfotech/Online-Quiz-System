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
    """Helper function to unlock badges when requirements are met"""
    all_badges = Badge.objects.all()
    unlocked_count = 0
    unlocked_badge_names = []

    for badge in all_badges:
        existing = UserBadge.objects.filter(user=user, badge=badge).first()
        if existing:
            continue

        if BadgeProgressHelper.is_requirement_met(user, badge):
            try:
                UserBadge.objects.create(
                    user=user,
                    badge=badge,
                    status='CLAIMABLE',
                    earned_at=timezone.now()
                )
                unlocked_count += 1
                unlocked_badge_names.append(badge.name)
            except Exception as e:
                print(f"❌ Error creating UserBadge for {badge.name}: {e}")

    if unlocked_count > 0:
        cache.delete(f"badges_all_{user.id}")
        cache.delete(f"user_badges_{user.id}")
        cache.delete(f"badge_count_{user.id}")
        print(f"✅ Unlocked {unlocked_count} badge(s) for {user.username}: {', '.join(unlocked_badge_names)}")