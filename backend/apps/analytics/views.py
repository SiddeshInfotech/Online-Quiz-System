from django.utils import timezone
from django.db.models import Count, Avg, Sum
from django.db.models.functions import ExtractWeekDay
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.quizzes.models import Quiz
from apps.attempts.models import QuizAttempt, Result
from apps.notifications.models import Notification


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        total_quizzes = Quiz.objects.filter(status='published').count()

        attempts = QuizAttempt.objects.filter(user=user)
        completed_attempts = attempts.filter(submitted_at__isnull=False)
        total_attempted = completed_attempts.count()

        progress_percentage = 0
        if total_quizzes > 0:
            progress_percentage = round((total_attempted / total_quizzes) * 100, 2)

        todays_count = completed_attempts.filter(
            submitted_at__date=timezone.now().date()
        ).count()

        current_streak = user.current_streak if hasattr(user, 'current_streak') else 0
        best_streak = user.longest_streak if hasattr(user, 'longest_streak') else 0

        notifications = []
        if total_attempted == 0:
            notifications.append({
                "id": 0,
                "title": "Welcome to QuizGen AI!",
                "message": "Start your first quiz today.",
                "is_read": False,
                "created_at": user.date_joined.isoformat() if user.date_joined else timezone.now().isoformat(),
                "type": "system_welcome"
            })

        return Response({
            "streak": {
                "current_streak": current_streak,
                "best_streak": best_streak,
            },
            "overall_progress": {
                "percentage": progress_percentage,
                "completed": total_attempted,
                "total": total_quizzes,
            },
            "quizzes_available_count": total_quizzes,
            "todays_goal": {
                "completed": todays_count,
                "target": 3
            },
            "notifications": notifications,
        })


class PerformanceAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        attempts = QuizAttempt.objects.filter(user=user, submitted_at__isnull=False)
        total_attempts = attempts.count()

        avg_score = attempts.aggregate(Avg('percentage'))['percentage__avg'] or 0

        total_time = attempts.aggregate(Sum('time_spent_seconds'))['time_spent_seconds__sum'] or 0

        answer_stats = Result.objects.filter(attempt__user=user).aggregate(
            total_correct=Sum('correct_answers'),
            total_wrong=Sum('wrong_answers')
        )

        total_correct = answer_stats['total_correct'] or 0
        total_wrong = answer_stats['total_wrong'] or 0
        total_answered = total_correct + total_wrong

        accuracy = 0
        if total_answered > 0:
            accuracy = round((total_correct / total_answered) * 100, 2)

        weekday_map = {1: "Sun", 2: "Mon", 3: "Tue", 4: "Wed", 5: "Thu", 6: "Fri", 7: "Sat"}

        weekly_data = (
            attempts.annotate(day_of_week=ExtractWeekDay('submitted_at'))
            .values('day_of_week')
            .annotate(day_score=Avg('percentage'))
        )

        db_graph_points = {item['day_of_week']: round(item['day_score'], 1) for item in weekly_data}

        graph_points = []
        ui_day_order = [2, 3, 4, 5, 6, 7, 1]

        for day_idx in ui_day_order:
            graph_points.append({
                "day": weekday_map[day_idx],
                "score": db_graph_points.get(day_idx, 0)
            })

        return Response({
            "quizzes_attempted": total_attempts,
            "average_score": round(avg_score, 2),
            "accuracy": accuracy,
            "total_time_spent_seconds": total_time,
            "graph_points": graph_points,
        })
