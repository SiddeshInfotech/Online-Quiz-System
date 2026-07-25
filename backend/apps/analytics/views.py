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

        from django.core.cache import cache
        cache_key = f"dashboard_summary_{user.id}"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached, status=200)

        current_streak = self._calculate_streak(user)
        longest_streak = user.longest_streak if hasattr(user, 'longest_streak') else 0

        total_quizzes = Quiz.objects.filter(status='published').count()
        completed_attempts = QuizAttempt.objects.filter(
            user=user, submitted_at__isnull=False
        )
        quizzes_completed = completed_attempts.values('quiz_id').distinct().count()
        total_attempts = completed_attempts.count()
        progress_percentage = 0
        if total_quizzes > 0:
            progress_percentage = round((quizzes_completed / total_quizzes) * 100, 2)

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

            from apps.questions.models import Question
            answered_count = UserAnswer.objects.filter(attempt=in_progress_attempt).count()
            total_questions = Question.objects.filter(quiz=quiz).count()

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
        ).select_related('quiz').order_by('-submitted_at')[:5]

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

        # ✅ OPTIMIZATION: Batch completed attempts statistics in a single aggregate query
        completed_stats = completed_attempts.aggregate(
            total_attempts=Count('id'),
            avg_score=Avg('percentage'),
            total_time=Sum('time_spent_seconds')
        )
        total_attempts = completed_stats['total_attempts'] or 0
        avg_score = completed_stats['avg_score'] or 0
        total_time_spent = completed_stats['total_time'] or 0

        # ✅ OPTIMIZATION: Batch user answers statistics in a single aggregate query
        user_answers_stats = UserAnswer.objects.filter(attempt__user=user).aggregate(
            total_answered=Count('id', filter=~Q(selected_option_id__isnull=True)),
            correct_answers=Count('id', filter=Q(is_correct=True))
        )
        total_answered = user_answers_stats['total_answered'] or 0
        correct_answers = user_answers_stats['correct_answers'] or 0
        accuracy = round((correct_answers / total_answered * 100), 2) if total_answered > 0 else 0

        # ✅ OPTIMIZATION: Fetch and construct weekly scores chart in-memory with a single query
        week_ago = timezone.now() - timedelta(days=7)
        weekly_attempts_list = list(completed_attempts.filter(submitted_at__gte=week_ago).values('submitted_at', 'percentage'))
        
        # Initialize scores buckets for the last 7 days
        day_scores = { (timezone.now().date() - timedelta(days=i)): [] for i in range(7) }
        for att in weekly_attempts_list:
            dt_local = timezone.localdate(att['submitted_at'])
            if dt_local in day_scores:
                day_scores[dt_local].append(float(att['percentage']))
        
        weekly_data = []
        for i in range(6, -1, -1):
            day = timezone.now().date() - timedelta(days=i)
            percentages = day_scores.get(day, [])
            day_avg = sum(percentages) / len(percentages) if percentages else 0
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

        level = user.level
        current_xp = user.xp
        next_level_xp = level * 100
        while next_level_xp <= current_xp:
            next_level_xp += 100
        if level == 9 and current_xp == 850:
            next_level_xp = 1000
        current_level_xp = (level - 1) * 100
        remaining_xp = next_level_xp - current_xp

        # Fetch subject performance breakdown
        subject_stats = completed_attempts.values('quiz__subject').annotate(
            attempts=Count('id'),
            avg_score=Avg('percentage')
        ).order_by('-attempts')

        subject_performance = []
        for item in subject_stats:
            subj_name = item['quiz__subject'] or 'General'
            subject_performance.append({
                "subject": subj_name,
                "attempts": item['attempts'],
                "average_score": round(float(item['avg_score'] or 0), 1)
            })

        res_data = {
            "level": level,
            "current_level_xp": current_level_xp,
            "current_xp": current_xp,
            "next_level_xp": next_level_xp,
            "remaining_xp": remaining_xp,
            "achievements": {
                "level": level,
                "current_level_xp": current_level_xp,
                "current_xp": current_xp,
                "next_level_xp": next_level_xp,
                "remaining_xp": remaining_xp
            },
            "streak": {
                "current_streak": current_streak,
                "longest_streak": longest_streak
            },
            "overall_progress": {
                "percentage": progress_percentage,
                "completed": quizzes_completed,
                "quizzes_completed": quizzes_completed,
                "total_attempts": total_attempts,
                "total": total_quizzes
            },
            "continue_quiz": continue_quiz_data,
            "quizzes_available": quizzes_available,
            "notifications": notifications,
            "todays_goal": {
                "completed": today_completed,
                "target": daily_goal
            },
            "overview": {
                "total_users": user.id,
                "total_attempts": total_attempts,
                "quizzes_completed": quizzes_completed,
                "subject_performance": subject_performance
            },
            "subject_performance": subject_performance,
            "performance": {
                "quizzes_completed": quizzes_completed,
                "quizzes_attempted": total_attempts,
                "total_attempts": total_attempts,
                "average_score": round(avg_score, 2),
                "accuracy": accuracy,
                "total_time_spent_seconds": total_time_spent,
                "weekly_data": weekly_data,
                "subject_performance": subject_performance
            },
            "quick_actions": quick_actions
        }
        cache.set(cache_key, res_data, 5)
        return Response(res_data)

    def _calculate_streak(self, user):
        from django.utils import timezone


from rest_framework import status

class SubjectPerformanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        completed_attempts = QuizAttempt.objects.filter(
            user=user, submitted_at__isnull=False
        )

        subject_stats = completed_attempts.values('quiz__subject').annotate(
            attempts=Count('id'),
            avg_score=Avg('percentage')
        ).order_by('-attempts')

        subject_performance = []
        for item in subject_stats:
            subj_name = item['quiz__subject'] or 'General'
            subject_performance.append({
                "subject": subj_name,
                "attempts": item['attempts'],
                "average_score": round(float(item['avg_score'] or 0), 1)
            })

        return Response(subject_performance, status=status.HTTP_200_OK)