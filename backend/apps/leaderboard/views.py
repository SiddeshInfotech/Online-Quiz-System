from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Avg, Count, Max, Min, F, Q
from django.db.models import Window
from django.db.models.functions import Rank
from django.db import connection
from apps.attempts.models import QuizAttempt, Result
from apps.quizzes.models import Quiz
from apps.users.models import User, UserBadge, Badge  
from .serializers import LeaderboardEntrySerializer, QuizLeaderboardSerializer
from rest_framework.permissions import IsAuthenticated


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

        total_attempts = attempts.count()
        avg_score = attempts.aggregate(Avg('score'))['score__avg'] or 0
        avg_percentage = attempts.aggregate(Avg('percentage'))['percentage__avg'] or 0

        top_10 = attempts[:10]
        top_performers = []
        rank = 1
        for attempt in top_10:
            time_diff = attempt.submitted_at - attempt.started_at
            minutes = int(time_diff.total_seconds() // 60)
            seconds = int(time_diff.total_seconds() % 60)
            time_taken = f"{minutes}m {seconds}s"

            profile_pic = None
            if attempt.user.profile_picture:
                profile_pic = attempt.user.profile_picture.url

            top_performers.append({
                "rank": rank,
                "user": {
                    "id": attempt.user.id,
                    "username": attempt.user.username,
                    "full_name": attempt.user.full_name,
                    "email": attempt.user.email,
                    "profile_picture": profile_pic, 
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
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.core.cache import cache
        try:
            from apps.users.services.badge_progress import evaluate_user_badges
            evaluate_user_badges(request.user)
        except Exception as e:
            print(f"[leaderboard evaluate_user_badges error]: {e}")

        all_rankings = cache.get("leaderboard_all_rankings")
        if not all_rankings:
            ranked_users = User.objects.filter(
                deactivated_at__isnull=True,
                is_active=True
            ).annotate(
                calculated_rank=Window(
                    expression=Rank(),
                    order_by=F('total_points').desc()
                )
            ).order_by('calculated_rank')

            # Pre-aggregate claimed badge counts in ONE query to avoid N+1 queries
            badge_counts = {
                item['user_id']: item['count']
                for item in UserBadge.objects.filter(status='CLAIMED')
                .values('user_id')
                .annotate(count=Count('id'))
            }

            all_rankings = []
            for user in ranked_users:
                profile_picture_url = None
                if user.profile_picture:
                    try:
                        profile_picture_url = user.profile_picture.url
                    except Exception:
                        profile_picture_url = None

                badge_count = badge_counts.get(user.id, 0)

                all_rankings.append({
                    "rank": user.calculated_rank,
                    "full_name": user.full_name or user.username,
                    "username": user.username,
                    "points": user.total_points,
                    "total_points": user.total_points,
                    "quizzes_count": user.quizzes_completed,
                    "profile_picture": profile_picture_url,
                    "user_id": user.id,
                    "badge_count": badge_count,
                })

            # Cache rankings list for 30 seconds
            cache.set("leaderboard_all_rankings", all_rankings, 30)

        top_3 = all_rankings[:3] if len(all_rankings) >= 3 else all_rankings

        current_user = next(
            (u for u in all_rankings if u["username"] == request.user.username),
            None
        )

        current_user_profile_pic = None
        if request.user.profile_picture:
            try:
                current_user_profile_pic = request.user.profile_picture.url
            except Exception:
                current_user_profile_pic = None

        current_user_badge_count = UserBadge.objects.filter(
            user=request.user, 
            status='CLAIMED'
        ).count()

        return Response({
            "personal_stats": {
                "your_rank": current_user["rank"] if current_user else None,
                "your_points": request.user.total_points,
                "total_points": request.user.total_points,
                "quizzes_completed": request.user.quizzes_completed,
                "profile_picture": current_user_profile_pic,
                "full_name": request.user.full_name or request.user.username,
                "is_in_top_3": current_user["rank"] <= 3 if current_user else False,
                "badge_count": current_user_badge_count,  
            },
            "top_3_podium": top_3,
            "all_rankings_list": all_rankings
        })
