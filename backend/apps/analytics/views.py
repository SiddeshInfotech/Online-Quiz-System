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

        # ✅ FIXED: Continue Quiz Logic with Progress Tracking & Auto-Submit
        continue_quiz_data = None
        time_limit_hours = 24
        cutoff_time = timezone.now() - timedelta(hours=time_limit_hours)
        
        in_progress_attempts = QuizAttempt.objects.filter(
            user=user,
            submitted_at__isnull=True,
            started_at__gte=cutoff_time
        ).select_related('quiz').order_by('-started_at')
        
        for attempt in in_progress_attempts:
            # Check if user completed this quiz after starting this attempt
            completed_after_start = QuizAttempt.objects.filter(
                user=user,
                quiz=attempt.quiz,
                submitted_at__isnull=False,
                started_at__gte=attempt.started_at
            ).exists()
            
            if completed_after_start:
                # Stale attempt - delete it
                attempt.delete()
                continue
            
            elapsed = (timezone.now() - attempt.started_at).total_seconds()
            total_duration_seconds = attempt.quiz.duration_minutes * 60
            remaining = max(0, total_duration_seconds - elapsed)
            
            # ✅ NEW: Get answered questions count
            answered_count = UserAnswer.objects.filter(attempt=attempt).count()
            total_questions = attempt.quiz.question_set.count()
            
            # ✅ Auto-submit if time expired OR all questions answered
            if remaining <= 0:
                attempt.submitted_at = timezone.now()
                attempt.save()
                print(f"⏰ Auto-submitted expired attempt {attempt.id} for user {user.username}")
                continue
            
            if answered_count >= total_questions and total_questions > 0:
                attempt.submitted_at = timezone.now()
                attempt.save()
                print(f"✅ Auto-submitted complete attempt {attempt.id} for user {user.username}")
                continue
            
            # ✅ Valid in-progress attempt found
            continue_quiz_data = {
                "attempt_id": attempt.id,
                "quiz_id": attempt.quiz.id,
                "title": attempt.quiz.title,
                "remaining_time_seconds": int(remaining),
                "started_at": attempt.started_at,
                "total_questions": total_questions,
                "answered_questions": answered_count,
                "progress_percentage": round((answered_count / total_questions) * 100, 2) if total_questions > 0 else 0
            }
            break  # Found valid attempt, stop searching

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

        while True:
            day_start = timezone.make_aware(datetime.combine(check_date, datetime.min.time()))
            day_end = timezone.make_aware(datetime.combine(check_date, datetime.max.time()))

            attempts_on_day = QuizAttempt.objects.filter(
                user=user,
                submitted_at__isnull=False,
                submitted_at__range=(day_start, day_end)
            ).exists()

            if attempts_on_day:
                streak += 1
                check_date -= timedelta(days=1)
            else:
                if check_date == today:
                    return 0
                break

        return streak