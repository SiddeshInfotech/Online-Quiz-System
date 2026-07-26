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
                print(f"[AUTO-SUBMIT] Auto-submitted expired attempt {in_progress_attempt.id} for user {user.username}")
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
                "id": attempt.id,
                "attempt_id": attempt.id,
                "quiz_id": attempt.quiz.id,
                "quiz_title": attempt.quiz.title,
                "title": attempt.quiz.title,
                "subject": attempt.quiz.subject or "General",
                "difficulty": attempt.quiz.difficulty or "Medium",
                "score": attempt.score,
                "percentage": attempt.percentage,
                "date": attempt.submitted_at.strftime("%Y-%m-%d %H:%M") if attempt.submitted_at else None,
                "submitted_at": attempt.submitted_at.isoformat() if attempt.submitted_at else None,
                "status": "Passed" if attempt.percentage >= 40 else "Failed"
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

        # Calculate current week bounds (Sun - Sat)
        now_dt = timezone.now()
        today_date = timezone.localdate(now_dt)

        # Sunday as start of week (0=Sunday, 1=Monday ... 6=Saturday)
        # Python weekday: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
        idx_sun = (today_date.weekday() + 1) % 7
        start_of_week_date = today_date - timedelta(days=idx_sun)
        start_of_week_dt = timezone.make_aware(datetime.combine(start_of_week_date, datetime.min.time()))

        # Filter attempts completed in current week (Sun - Sat)
        weekly_attempts_qs = completed_attempts.filter(submitted_at__gte=start_of_week_dt)

        weekly_quizzes_attempted = weekly_attempts_qs.count()
        weekly_avg_score = round(float(weekly_attempts_qs.aggregate(avg=Avg('percentage'))['avg'] or 0), 1)

        # Time spent in current week formatted (e.g. 1h 45m or 45m)
        weekly_time_sec = weekly_attempts_qs.aggregate(tot=Sum('time_spent_seconds'))['tot'] or 0
        w_hours = weekly_time_sec // 3600
        w_mins = (weekly_time_sec % 3600) // 60
        time_spent_formatted = f"{w_hours}h {w_mins}m" if w_hours > 0 else f"{w_mins}m"

        # Accuracy in current week
        weekly_answers_stats = UserAnswer.objects.filter(attempt__in=weekly_attempts_qs).aggregate(
            total_answered=Count('id', filter=~Q(selected_option_id__isnull=True)),
            correct_answers=Count('id', filter=Q(is_correct=True))
        )
        w_total_ans = weekly_answers_stats['total_answered'] or 0
        w_correct_ans = weekly_answers_stats['correct_answers'] or 0
        weekly_accuracy = round((w_correct_ans / w_total_ans * 100), 1) if w_total_ans > 0 else 0

        # Construct Sun - Sat 7-day chart array
        day_names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        day_scores_map = { d: [] for d in range(7) }

        all_weekly_attempts = list(weekly_attempts_qs.values('submitted_at', 'percentage'))
        for att in all_weekly_attempts:
            local_d = timezone.localdate(att['submitted_at'])
            d_idx = (local_d.weekday() + 1) % 7
            day_scores_map[d_idx].append(float(att['percentage']))

        weekly_activity = []
        for d_idx in range(7):
            scores = day_scores_map[d_idx]
            d_avg = round(sum(scores) / len(scores), 1) if scores else 0
            weekly_activity.append({
                "day": day_names[d_idx],
                "score": d_avg
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
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "daily_streak": current_streak,
            "level": level,
            "current_level_xp": current_level_xp,
            "current_xp": current_xp,
            "next_level_xp": next_level_xp,
            "remaining_xp": remaining_xp,
            "quizzes_attempted": weekly_quizzes_attempted,
            "average_score": weekly_avg_score,
            "accuracy": weekly_accuracy,
            "time_spent": time_spent_formatted,
            "time_spent_formatted": time_spent_formatted,
            "weekly_activity": weekly_activity,
            "chart_data": weekly_activity,
            "weekly_data": weekly_activity,
            "recent_attempts": recent_attempts_data,
            "recent_quiz_attempts": recent_attempts_data,
            "recentQuizAttempts": recent_attempts_data,
            "user": {
                "id": user.id,
                "username": user.username,
                "current_streak": current_streak,
                "longest_streak": longest_streak,
                "level": level,
                "xp": current_xp
            },
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
                "quizzes_attempted": weekly_quizzes_attempted,
                "total_attempts": total_attempts,
                "average_score": weekly_avg_score,
                "accuracy": weekly_accuracy,
                "time_spent": time_spent_formatted,
                "time_spent_formatted": time_spent_formatted,
                "total_time_spent_seconds": total_time_spent,
                "weekly_activity": weekly_activity,
                "chart_data": weekly_activity,
                "weekly_data": weekly_activity,
                "subject_performance": subject_performance,
                "recent_attempts": recent_attempts_data
            },
            "stats": {
                "quizzes_attempted": weekly_quizzes_attempted,
                "average_score": weekly_avg_score,
                "accuracy": weekly_accuracy,
                "time_spent": time_spent_formatted,
                "weekly_activity": weekly_activity,
                "chart_data": weekly_activity,
                "recent_attempts": recent_attempts_data
            },
            "quick_actions": quick_actions
        }

        # Subscription & Daily Quiz Limits
        from apps.users.models import Subscription
        sub, _ = Subscription.objects.get_or_create(user=user)
        is_pro = sub.is_pro

        daily_quiz_used = Quiz.objects.filter(
            created_by=user,
            created_at__date=today_date
        ).count()
        daily_quiz_limit = 10 if is_pro else 3
        daily_quiz_remaining = max(0, daily_quiz_limit - daily_quiz_used)

        daily_attempt_used = QuizAttempt.objects.filter(
            user=user,
            started_at__date=today_date
        ).count()
        daily_attempt_limit = 999999 if is_pro else 10
        daily_attempt_remaining = max(0, 10 - daily_attempt_used) if not is_pro else 999999

        subscription_info = {
            "plan": "PRO" if is_pro else "FREE",
            "subscription_plan": "PRO" if is_pro else "FREE",
            "is_pro": is_pro,
            "status": sub.status if is_pro else "ACTIVE",
            "daily_quiz_limit": daily_quiz_limit, # 3 for Free, 10 for Pro
            "daily_quiz_used": daily_quiz_used,
            "daily_quiz_remaining": daily_quiz_remaining,

            "daily_quizzes_limit": daily_quiz_limit,
            "daily_quizzes_used": daily_quiz_used,
            "daily_quizzes_remaining": daily_quiz_remaining,

            "max_daily_quizzes": daily_quiz_limit,
            "daily_attempt_limit": daily_attempt_limit,
            "daily_attempt_used": daily_attempt_used,
            "daily_attempt_remaining": daily_attempt_remaining,
        }

        res_data["subscription"] = subscription_info
        res_data["daily_quiz_limit"] = daily_quiz_limit
        res_data["daily_quiz_used"] = daily_quiz_used
        res_data["daily_quiz_remaining"] = daily_quiz_remaining
        res_data["daily_quizzes_limit"] = daily_quiz_limit
        res_data["daily_quizzes_used"] = daily_quiz_used
        res_data["daily_quizzes_remaining"] = daily_quiz_remaining

        cache.set(cache_key, res_data, 15)
        return Response(res_data)

    def _calculate_streak(self, user):
        try:
            today = timezone.localdate()
            from django.db.models.functions import TruncDate
            dates_list = QuizAttempt.objects.filter(
                user=user,
                submitted_at__isnull=False
            ).annotate(sub_date=TruncDate('submitted_at')).values_list('sub_date', flat=True).distinct()

            if not dates_list:
                if user.current_streak != 0:
                    user.current_streak = 0
                    user.save(update_fields=['current_streak'])
                return 0

            dates_set = set(dates_list)

            streak = 0
            check_date = today

            # If no submission today, start checking from yesterday
            if today not in dates_set:
                check_date = today - timedelta(days=1)

            # If yesterday ALSO had no submission, the streak is broken (0)
            if check_date not in dates_set:
                if user.current_streak != 0:
                    user.current_streak = 0
                    user.save(update_fields=['current_streak'])
                return 0

            while check_date in dates_set:
                streak += 1
                check_date -= timedelta(days=1)

            longest_streak = max(getattr(user, 'longest_streak', 0) or 0, streak)

            if user.current_streak != streak or user.longest_streak != longest_streak:
                user.current_streak = streak
                user.longest_streak = longest_streak
                user.save(update_fields=['current_streak', 'longest_streak'])

            return streak
        except Exception as e:
            print(f"[WARNING] Error calculating streak for {user.username}: {e}")
            return getattr(user, 'current_streak', 0) or 0


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