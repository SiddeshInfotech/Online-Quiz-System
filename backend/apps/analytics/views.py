from django.utils import timezone
from django.db.models import Count, Avg, Sum, Q
from django.db.models.functions import ExtractWeekDay
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import timedelta, datetime

from apps.quizzes.models import Quiz
from apps.attempts.models import QuizAttempt, UserAnswer
from apps.notifications.models import Notification


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        current_streak = self._calculate_streak(user)
        longest_streak = user.longest_streak if hasattr(user, 'longest_streak') else 0

        total_quizzes = Quiz.objects.filter(status='published').count()
        completed_attempts = QuizAttempt.objects.filter(
            user=user, submitted_at__isnull=False
        )
        total_completed = completed_attempts.count()
        progress_percentage = 0
        if total_quizzes > 0:
            progress_percentage = round((total_completed / total_quizzes) * 100, 2)

        # ==================== CONTINUE QUIZ LOGIC (FIXED) ====================
        continue_quiz_data = None

        # ✅ Get most recent unsubmitted attempt (NO time window)
        in_progress_attempt = QuizAttempt.objects.filter(
            user=user,
            submitted_at__isnull=True
        ).select_related('quiz').order_by('-started_at').first()

        if in_progress_attempt:
            quiz = in_progress_attempt.quiz
            elapsed = (timezone.now() - in_progress_attempt.started_at).total_seconds()
            total_duration = quiz.duration_minutes * 60
            remaining = max(0, total_duration - elapsed)

            # Get answered questions count
            answered_count = UserAnswer.objects.filter(attempt=in_progress_attempt).count()
            total_questions = quiz.question_set.count()

            # Auto-submit if expired
            if remaining <= 0:
                in_progress_attempt.submitted_at = timezone.now()
                in_progress_attempt.save()
                print(f"⏰ Auto-submitted expired attempt {in_progress_attempt.id} for user {user.username}")
            else:
                # ✅ Standardized response structure
                continue_quiz_data = {
                    "has_incomplete_quiz": True,
                    "attempt_id": in_progress_attempt.id,
                    "quiz_id": quiz.id,
                    "quiz_title": quiz.title,
                    "total_questions": total_questions,
                    "current_question_index": answered_count,
                    "answered_questions": answered_count,
                    "remaining_time_seconds": int(remaining),
                    "resume_url": f"/quiz/attempt/{in_progress_attempt.id}/",
                    "started_at": in_progress_attempt.started_at.isoformat(),
                    "progress_percentage": round((answered_count / total_questions) * 100, 2) if total_questions > 0 else 0
                }

        quizzes_available = total_quizzes

        notification_qs = Notification.objects.filter(user=user).order_by('-created_at')[:5]
        notifications = [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat(),
                "type": getattr(n, 'type', 'system')
            }
            for n in notification_qs
        ]
        if not notifications:
            notifications.append({
                "id": 0,
                "title": "Welcome to QuizGen AI!",
                "message": "Start your first quiz today.",
                "is_read": False,
                "created_at": user.date_joined.isoformat() if user.date_joined else timezone.now().isoformat(),
                "type": "system_welcome"
            })

        daily_goal = getattr(user, 'daily_quiz_goal', 3)
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_completed = QuizAttempt.objects.filter(
            user=user,
            submitted_at__isnull=False,
            submitted_at__gte=today_start
        ).count()
        todays_goal_progress = min(today_completed, daily_goal)

        recent_attempts = QuizAttempt.objects.filter(
            user=user, submitted_at__isnull=False
        ).order_by('-submitted_at')[:5]

        recent_attempts_data = []
        for attempt in recent_attempts:
            recent_attempts_data.append({
                "attempt_id": attempt.id,
                "quiz_title": attempt.quiz.title,
                "score": attempt.score,
                "percentage": attempt.percentage,
                "date": attempt.submitted_at.strftime("%Y-%m-%d %H:%M") if attempt.submitted_at else None,
                "status": "Passed" if attempt.percentage >= 40 else "Failed",
                "quiz_id": attempt.quiz.id
            })

        total_attempts = completed_attempts.count()
        avg_score = completed_attempts.aggregate(Avg('percentage'))['percentage__avg'] or 0

        user_answers = UserAnswer.objects.filter(attempt__user=user)
        total_answered = user_answers.exclude(selected_option_id__isnull=True).count()
        correct_answers = user_answers.filter(is_correct=True).count()
        accuracy = round((correct_answers / total_answered * 100), 2) if total_answered > 0 else 0

        total_time_spent = completed_attempts.aggregate(
            total=Sum('time_spent_seconds')
        )['total'] or 0

        week_ago = timezone.now() - timedelta(days=7)
        weekly_attempts = completed_attempts.filter(
            submitted_at__gte=week_ago
        )
        weekly_data = []
        for i in range(6, -1, -1):
            day = timezone.now().date() - timedelta(days=i)
            day_start = timezone.make_aware(datetime.combine(day, datetime.min.time()))
            day_end = timezone.make_aware(datetime.combine(day, datetime.max.time()))
            day_attempts = weekly_attempts.filter(submitted_at__range=(day_start, day_end))
            day_avg = day_attempts.aggregate(Avg('percentage'))['percentage__avg'] or 0
            weekly_data.append({
                "day": day.strftime("%a"),
                "score": round(day_avg, 1)
            })

        quick_actions = {
            "join_quiz": {
                "enabled": True,
                "endpoint": "/api/quizzes/join/",
                "description": "Join a quiz with a code"
            },
            "practice_mode": {
                "enabled": True,
                "endpoint": "/api/quizzes/practice/",
                "description": "Practice unlimited questions"
            },
            "mock_test": {
                "enabled": True,
                "endpoint": "/api/quizzes/mock/",
                "description": "Full-length mock test"
            }
        }

        return Response({
            "streak": {
                "current_streak": current_streak,
                "longest_streak": longest_streak
            },
            "overall_progress": {
                "percentage": progress_percentage,
                "completed": total_completed,
                "total": total_quizzes
            },
            "continue_quiz": continue_quiz_data,
            "quizzes_available": quizzes_available,
            "notifications": notifications,
            "todays_goal": {
                "completed": today_completed,
                "target": daily_goal
            },
            "recent_attempts": recent_attempts_data,
            "performance": {
                "quizzes_attempted": total_attempts,
                "average_score": round(avg_score, 2),
                "accuracy": accuracy,
                "total_time_spent_seconds": total_time_spent,
                "weekly_data": weekly_data
            },
            "quick_actions": quick_actions
        })

    def _calculate_streak(self, user):
        today = timezone.now().date()
        streak = 0
        check_date = today

        # If they did not attempt today, check if they attempted yesterday.
        # If they did not attempt yesterday either, their active streak is 0.
        # If they attempted yesterday, we begin counting consecutive days from yesterday.
        day_start = timezone.make_aware(datetime.combine(today, datetime.min.time()))
        day_end = timezone.make_aware(datetime.combine(today, datetime.max.time()))
        has_today = QuizAttempt.objects.filter(
            user=user,
            submitted_at__isnull=False,
            submitted_at__range=(day_start, day_end)
        ).exists()

        if not has_today:
            check_date = today - timedelta(days=1)

        while True:
            d_start = timezone.make_aware(datetime.combine(check_date, datetime.min.time()))
            d_end = timezone.make_aware(datetime.combine(check_date, datetime.max.time()))

            attempts_on_day = QuizAttempt.objects.filter(
                user=user,
                submitted_at__isnull=False,
                submitted_at__range=(d_start, d_end)
            ).exists()

            if attempts_on_day:
                streak += 1
                check_date -= timedelta(days=1)
            else:
                break

        return streak