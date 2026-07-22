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

# A. Dashboard Analytics View
class AdminDashboardAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get(self, request):
        total_users = User.objects.count()
        
        admin_quizzes = Quiz.objects.filter(created_by__is_staff=True).count()
        user_quizzes = Quiz.objects.filter(created_by__is_staff=False).count()
        
        total_attempts = QuizAttempt.objects.count()
        
        total_points_deducted = UserPenaltyLog.objects.aggregate(
            total=Sum('points_deducted')
        )['total'] or 0

        # Top Subjects distribution of attempts
        subject_counts = QuizAttempt.objects.filter(
            quiz__subject__isnull=False
        ).values('quiz__subject').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        top_subjects = [
            {"subject": item['quiz__subject'] or 'General', "attempts": item['count']} 
            for item in subject_counts
        ]

        return Response({
            "overview": {
                "total_users": total_users,
                "admin_quizzes": admin_quizzes,
                "user_quizzes": user_quizzes,
                "total_attempts": total_attempts,
                "total_points_deducted": total_points_deducted
            },
            "top_subjects": top_subjects
        }, status=status.HTTP_200_OK)


# B. User Management Views
class AdminUserListView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get_queryset(self):
        return User.objects.annotate(
            total_attempts=Count('quizattempt', distinct=True),
            penalty_count=Count('penalties', distinct=True)
        ).order_by('-date_joined')

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
        # Admin can create directly, we can respect is_published passed in data or default to False
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
