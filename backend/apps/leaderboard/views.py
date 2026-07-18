from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Avg, Count, Max, Min, F, Q
from django.db.models import Window
from django.db.models.functions import Rank
from django.db import connection
from apps.attempts.models import QuizAttempt, Result
from apps.quizzes.models import Quiz
from apps.users.models import User, UserBadge  
from .serializers import LeaderboardEntrySerializer, QuizLeaderboardSerializer
from rest_framework.permissions import IsAuthenticated
from .models import Badge


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
        # ✅ Get total badges count once
        total_badges = Badge.objects.count()

        ranked_users = User.objects.filter(
            deactivated_at__isnull=True,
            is_active=True
        ).annotate(
            calculated_rank=Window(
                expression=Rank(),
                order_by=F('total_points').desc()
            )
        ).order_by('calculated_rank')

        all_rankings = []
        for user in ranked_users:
            profile_picture_url = None
            if user.profile_picture:
                profile_picture_url = user.profile_picture.url

            # ✅ Compute badge stats
            claimed_badges = UserBadge.objects.filter(
                user=user, status='CLAIMED'
            ).count()
            claimable_badges = UserBadge.objects.filter(
                user=user, status='CLAIMABLE'
            ).count()
            completion_percentage = round(
                (claimed_badges / total_badges * 100), 2
            ) if total_badges > 0 else 0

            # ✅ Compute level from XP (assuming 100 XP per level)
            level = (user.xp // 100) + 1

            all_rankings.append({
                "rank": user.calculated_rank,
                "user_id": user.id,
                "username": user.username,
                "full_name": user.full_name or user.username,
                "profile_picture": profile_picture_url,
                # Existing fields
                "points": user.total_points,
                "quizzes_count": user.quizzes_completed,
                # ✅ NEW FIELDS
                "level": level,
                "total_xp": user.xp,
                "claimed_badges": claimed_badges,
                "claimable_badges": claimable_badges,
                "completion_percentage": completion_percentage,
            })

        top_3 = all_rankings[:3] if len(all_rankings) >= 3 else all_rankings

        # Current user stats
        current_user = next(
            (u for u in all_rankings if u["username"] == request.user.username),
            None
        )

        current_user_profile_pic = None
        if request.user.profile_picture:
            current_user_profile_pic = request.user.profile_picture.url

        current_user_claimed = UserBadge.objects.filter(
            user=request.user, status='CLAIMED'
        ).count()
        current_user_claimable = UserBadge.objects.filter(
            user=request.user, status='CLAIMABLE'
        ).count()
        current_user_completion = round(
            (current_user_claimed / total_badges * 100), 2
        ) if total_badges > 0 else 0
        current_user_level = (request.user.xp // 100) + 1

        return Response({
            "personal_stats": {
                "your_rank": current_user["rank"] if current_user else None,
                "your_points": request.user.total_points,
                "quizzes_completed": request.user.quizzes_completed,
                "profile_picture": current_user_profile_pic,
                "full_name": request.user.full_name or request.user.username,
                "is_in_top_3": current_user["rank"] <= 3 if current_user else False,
                # ✅ NEW FIELDS
                "level": current_user_level,
                "total_xp": request.user.xp,
                "claimed_badges": current_user_claimed,
                "claimable_badges": current_user_claimable,
                "completion_percentage": current_user_completion,
            },
            "top_3_podium": top_3,
            "all_rankings_list": all_rankings
        })