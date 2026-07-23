from django.db.models import Max
from django.core.cache import cache
from apps.attempts.models import QuizAttempt
from apps.users.models import UserBadge

XP_MAP = {
    'COMMON': 25,
    'RARE': 50,
    'EPIC': 100,
    'LEGENDARY': 200,
}

def recalculate_user_points_and_stats(user):
    """
    Authoritatively and idempotently recalculates user statistics:
    - quiz_score_total: Sum of highest scores per distinct quiz completed by user
    - badge_xp: Sum of XP from CLAIMED badges only
    - total_points: quiz_score_total + badge_xp
    - quizzes_completed: Count of distinct quizzes completed
    - user.xp: set to badge_xp
    - user.level: (user.xp // 100) + 1
    """
    # 1. Sum of highest scores per distinct completed quiz
    highest_scores = QuizAttempt.objects.filter(
        user=user,
        submitted_at__isnull=False
    ).values('quiz_id').annotate(max_score=Max('score'))

    quiz_score_total = sum(item['max_score'] for item in highest_scores if item['max_score'] is not None)

    # 2. Count of distinct quizzes completed
    quizzes_completed = QuizAttempt.objects.filter(
        user=user,
        submitted_at__isnull=False
    ).values('quiz_id').distinct().count()

    # 3. Sum of badge XP for CLAIMED badges
    claimed_badges = UserBadge.objects.filter(
        user=user,
        status='CLAIMED'
    ).select_related('badge')

    badge_xp = sum(XP_MAP.get(ub.badge.rarity, 25) for ub in claimed_badges)

    # 4. Sum total penalty points deducted from UserPenaltyLog
    from apps.custom_admin.models import UserPenaltyLog
    from django.db.models import Sum
    total_penalties = UserPenaltyLog.objects.filter(user=user).aggregate(total=Sum('points_deducted'))['total'] or 0

    # 5. Authoritative assignment with penalty deduction
    user.total_points = max(0, quiz_score_total + badge_xp - total_penalties)
    user.quizzes_completed = quizzes_completed
    user.xp = max(0, badge_xp - total_penalties)
    user.level = max(1, (user.xp // 100) + 1)
    user.save()

    # 6. Flush caches and evaluate badges
    cache.delete("leaderboard_all_rankings")
    cache.delete(f"user_badges_{user.id}")
    cache.delete(f"badges_all_{user.id}")
    cache.delete(f"badge_progress_{user.id}")

    try:
        from apps.users.services.badge_progress import evaluate_user_badges
        evaluate_user_badges(user)
    except Exception as e:
        print(f"[recalculate_points evaluate_user_badges error]: {e}")

    return {

        "quiz_score_total": quiz_score_total,
        "badge_xp": badge_xp,
        "total_points": user.total_points,
        "quizzes_completed": quizzes_completed,
    }
