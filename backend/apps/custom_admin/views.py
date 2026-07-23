from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Q, Avg
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


class IsCustomAdmin(permissions.BasePermission):
    """
    Allows access to users who are staff, superusers, or have role == 'Admin'.
    """
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and 
            user.is_authenticated and 
            (user.is_staff or user.is_superuser or getattr(user, 'role', None) == 'Admin')
        )


# 🛠️ 1. Real Dynamic Analytics View (GET /api/custom_admin/analytics/)
class AdminAnalyticsView(APIView):
    permission_classes = [IsCustomAdmin]

    def get(self, request):
        # 1. Total actual registered accounts currently in DB
        total_users = User.objects.count()

        # 2. Total actual quizzes created by admins vs students
        admin_quizzes = Quiz.objects.filter(Q(created_by__is_staff=True) | Q(created_by__role='Admin')).count()
        user_quizzes = Quiz.objects.filter(created_by__is_staff=False, created_by__role='Student').count()

        # 3. Total actual attempts taken by real students in DB
        total_attempts = QuizAttempt.objects.count()

        # 4. Total points deducted in actual penalty logs
        penalty_points = UserPenaltyLog.objects.aggregate(total=Sum('points_deducted'))['total'] or 0

        # 5. Dynamic subject performance with average scores across attempts
        subject_stats = QuizAttempt.objects.filter(
            submitted_at__isnull=False
        ).values('quiz__subject').annotate(
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

        subject_distribution = list(
            Quiz.objects.values('subject')
            .annotate(attempts=Count('quizattempt'))
            .order_by('-attempts')
        )

        if not subject_performance:
            for item in subject_distribution:
                subj_name = item['subject'] or 'General'
                subject_performance.append({
                    "subject": subj_name,
                    "attempts": item['attempts'],
                    "average_score": 0.0
                })

        return Response({
            "overview": {
                "total_users": total_users,
                "admin_quizzes": admin_quizzes,
                "user_quizzes": user_quizzes,
                "total_attempts": total_attempts,
                "penalty_points": penalty_points,
                "total_points_deducted": penalty_points,
                "subject_performance": subject_performance
            },
            "subject_distribution": subject_distribution,
            "top_subjects": [
                {"subject": item['subject'] or 'General', "attempts": item['attempts']}
                for item in subject_distribution
            ],
            "subject_performance": subject_performance,
            "performance": {
                "subject_performance": subject_performance
            }
        }, status=status.HTTP_200_OK)

# Alias for backwards compatibility
AdminDashboardAnalyticsView = AdminAnalyticsView


# 🛠️ 2. Real Users Endpoint (GET /api/custom_admin/users/)
class AdminUsersListView(generics.ListAPIView):
    permission_classes = [IsCustomAdmin]
    serializer_class = AdminUserSerializer
    pagination_class = None

    def get_queryset(self):
        # Return ALL actual registered user accounts from DB (including nilesh 45 and admin staff)
        return User.objects.all().annotate(
            total_attempts=Count('quizattempt', distinct=True),
            penalty_count=Count('penalties', distinct=True)
        ).order_by('-date_joined')

# Alias for backwards compatibility
AdminUserListView = AdminUsersListView


class AdminUserToggleStatusView(APIView):
    permission_classes = [IsCustomAdmin]

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
    permission_classes = [IsCustomAdmin]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class AdminQuizDetailUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Quiz.objects.all()
    serializer_class = AdminQuizSerializer
    permission_classes = [IsCustomAdmin]

class AdminQuizToggleVisibilityView(APIView):
    permission_classes = [IsCustomAdmin]

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
    permission_classes = [IsCustomAdmin]


# E. Support Ticket Inbox Views
class AdminSupportMessageListView(generics.ListAPIView):
    queryset = ContactMessage.objects.all().order_by('-created_at')
    serializer_class = AdminSupportMessageSerializer
    permission_classes = [IsCustomAdmin]

class AdminSupportMessageToggleResolveView(APIView):
    permission_classes = [IsCustomAdmin]

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

