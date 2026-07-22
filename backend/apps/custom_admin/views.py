from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Q
from apps.quizzes.models import Quiz
from apps.attempts.models import QuizAttempt
from apps.custom_admin.models import UserPenaltyLog
from apps.support.models import ContactMessage
from .serializers import (
    AdminUserSerializer, 
    AdminQuizSerializer, 
    UserPenaltyLogSerializer, 
    AdminSupportMessageSerializer
)

User = get_user_model()

# 🛠️ 1. Real Dynamic Analytics View (GET /api/custom_admin/analytics/)
class AdminAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get(self, request):
        # 1. Total actual registered non-superuser accounts currently in DB
        total_users = User.objects.filter(is_superuser=False).count()

        # 2. Total actual quizzes created by admins vs students
        admin_quizzes = Quiz.objects.filter(created_by__is_staff=True).count()
        user_quizzes = Quiz.objects.filter(created_by__is_staff=False).count()

        # 3. Total actual attempts taken by real students in DB
        total_attempts = QuizAttempt.objects.count()

        # 4. Total points deducted in actual penalty logs
        penalty_points = UserPenaltyLog.objects.aggregate(total=Sum('points_deducted'))['total'] or 0

        # 5. Dynamic subject breakdown based ONLY on real existing quizzes/attempts in DB
        subject_distribution = list(
            Quiz.objects.values('subject')
            .annotate(attempts=Count('quizattempt'))
            .order_by('-attempts')
        )

        return Response({
            "overview": {
                "total_users": total_users,
                "admin_quizzes": admin_quizzes,
                "user_quizzes": user_quizzes,
                "total_attempts": total_attempts,
                "penalty_points": penalty_points,
                "total_points_deducted": penalty_points
            },
            "subject_distribution": subject_distribution,
            "top_subjects": [
                {"subject": item['subject'] or 'General', "attempts": item['attempts']}
                for item in subject_distribution
            ]
        }, status=status.HTTP_200_OK)

# Alias for backwards compatibility
AdminDashboardAnalyticsView = AdminAnalyticsView


# 🛠️ 2. Real Users Endpoint (GET /api/custom_admin/users/)
class AdminUsersListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    serializer_class = AdminUserSerializer

    def get_queryset(self):
        # Return ALL actual registered non-superuser accounts from DB
        return User.objects.filter(is_superuser=False).annotate(
            total_attempts=Count('quizattempt', distinct=True),
            penalty_count=Count('penalties', distinct=True)
        ).order_by('-date_joined')

# Alias for backwards compatibility
AdminUserListView = AdminUsersListView


class AdminUserToggleStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def post(self, request, pk):
        user = get_object_or_404(User, id=pk)
        
        # Do NOT allow toggling staff/superusers (or promoting)
        if user.is_staff or user.is_superuser:
            return Response(
                {"error": "Cannot change status of staff or admin users."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        user.is_active = not user.is_active
        user.save()
        
        return Response({
            "id": user.id,
            "username": user.username,
            "is_active": user.is_active,
            "message": f"User status successfully updated to {'Active' if user.is_active else 'Suspended'}."
        }, status=status.HTTP_200_OK)


# C. Admin Quiz Creation & Moderation Views
class AdminQuizListCreateView(generics.ListCreateAPIView):
    queryset = Quiz.objects.all().order_by('-created_at')
    serializer_class = AdminQuizSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class AdminQuizDetailUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Quiz.objects.all()
    serializer_class = AdminQuizSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

class AdminQuizToggleVisibilityView(APIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def post(self, request, pk):
        quiz = get_object_or_404(Quiz, id=pk)
        quiz.is_published = not quiz.is_published
        quiz.save()
        return Response({
            "id": quiz.id,
            "title": quiz.title,
            "is_published": quiz.is_published,
            "status": quiz.status,
            "message": f"Quiz visibility toggled to {'Published' if quiz.is_published else 'Draft'}."
        }, status=status.HTTP_200_OK)


# D. Penalty & Violation Logs Audit View
class AdminPenaltyLogListView(generics.ListAPIView):
    queryset = UserPenaltyLog.objects.all().order_by('-created_at')
    serializer_class = UserPenaltyLogSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]


# E. Support Ticket Inbox Views
class AdminSupportMessageListView(generics.ListAPIView):
    queryset = ContactMessage.objects.all().order_by('-created_at')
    serializer_class = AdminSupportMessageSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

class AdminSupportMessageToggleResolveView(APIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def patch(self, request, pk):
        message = get_object_or_404(ContactMessage, id=pk)
        message.is_resolved = not message.is_resolved
        message.save()
        return Response({
            "id": message.id,
            "subject": message.subject,
            "is_resolved": message.is_resolved,
            "message": f"Support message status updated to {'Resolved' if message.is_resolved else 'Unresolved'}."
        }, status=status.HTTP_200_OK)

