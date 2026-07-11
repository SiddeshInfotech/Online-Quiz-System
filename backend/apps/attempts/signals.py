from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import Sum
from .models import QuizAttempt, Result
from apps.users.models import User

@receiver(post_save, sender=QuizAttempt)
def update_user_stats(sender, instance, created, **kwargs):
    if not instance.submitted_at:
        return

    user = instance.user

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
