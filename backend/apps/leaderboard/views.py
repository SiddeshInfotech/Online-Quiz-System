from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Avg, Count, Max, Min
from django.db import connection
from apps.attempts.models import QuizAttempt, Result
from apps.quizzes.models import Quiz
from .serializers import LeaderboardEntrySerializer, QuizLeaderboardSerializer

class QuizLeaderboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, quiz_id):
        try:
            quiz = Quiz.objects.get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response({"error": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)

        attempts = QuizAttempt.objects.filter(
            quiz=quiz,
            submitted_at__isnull=False
        ).select_related('user').order_by('-percentage', 'time_taken')

        if not attempts.exists():
            return Response({
                "quiz_id": quiz_id,
                "quiz_title": quiz.title,
                "total_attempts": 0,
                "average_score": 0,
                "average_percentage": 0,
                "top_performers": []
            }, status=status.HTTP_200_OK)

        # Calculate statistics
        total_attempts = attempts.count()
        avg_score = attempts.aggregate(Avg('score'))['score__avg'] or 0
        avg_percentage = attempts.aggregate(Avg('percentage'))['percentage__avg'] or 0

        # Top 10 performers
        top_10 = attempts[:10]
        top_performers = []
        rank = 1
        for attempt in top_10:
            # Calculate time taken
            time_diff = attempt.submitted_at - attempt.started_at
            minutes = int(time_diff.total_seconds() // 60)
            seconds = int(time_diff.total_seconds() % 60)
            time_taken = f"{minutes}m {seconds}s"

            top_performers.append({
                "rank": rank,
                "user": {
                    "id": attempt.user.id,
                    "username": attempt.user.username,
                    "full_name": attempt.user.full_name,
                    "email": attempt.user.email
                },
                "score": attempt.score,
                "percentage": attempt.percentage,
                "time_taken": time_taken,
                "submitted_at": attempt.submitted_at
            })
            rank += 1

        return Response({
            "quiz_id": quiz_id,
            "quiz_title": quiz.title,
            "total_attempts": total_attempts,
            "average_score": round(avg_score, 2),
            "average_percentage": round(avg_percentage, 2),
            "top_performers": top_performers
        }, status=status.HTTP_200_OK)

class GlobalLeaderboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    u.id,
                    u.username,
                    u.full_name,
                    u.email,
                    COUNT(a.id) as total_attempts,
                    AVG(a.percentage) as avg_percentage,
                    MAX(a.percentage) as best_percentage
                FROM users_user u
                JOIN attempts_quizattempt a ON u.id = a.user_id
                WHERE a.submitted_at IS NOT NULL
                GROUP BY u.id, u.username, u.full_name, u.email
                ORDER BY best_percentage DESC, avg_percentage DESC
                LIMIT 20
            """)
            rows = cursor.fetchall()

        if not rows:
            return Response({
                "message": "No attempts found.",
                "top_users": []
            }, status=status.HTTP_200_OK)

        result = []
        rank = 1
        for row in rows:
            result.append({
                "rank": rank,
                "user": {
                    "id": row[0],
                    "username": row[1],
                    "full_name": row[2],
                    "email": row[3]
                },
                "total_attempts": row[4],
                "avg_percentage": round(row[5], 2) if row[5] else 0,
                "best_percentage": round(row[6], 2) if row[6] else 0
            })
            rank += 1

        return Response({
            "top_users": result
        }, status=status.HTTP_200_OK)