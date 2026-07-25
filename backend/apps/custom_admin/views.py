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
        from django.core.cache import cache
        cached = cache.get("admin_analytics_summary")
        if cached:
            return Response(cached, status=status.HTTP_200_OK)

        # 1. Total actual registered accounts currently in DB
        total_users = User.objects.count()

        # Admin quizzes = quizzes created by staff or Admin-role users
        admin_quizzes = Quiz.objects.filter(
            Q(created_by__is_staff=True) | Q(created_by__role='Admin')
        ).distinct().count()
        # User quizzes = all other quizzes (created by regular users)
        user_quizzes = Quiz.objects.exclude(
            Q(created_by__is_staff=True) | Q(created_by__role='Admin')
        ).count()

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

        data = {
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
        }
        cache.set("admin_analytics_summary", data, 15)
        return Response(data, status=status.HTTP_200_OK)

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
        if user.is_staff or user.is_superuser or user.role == 'Admin':
            return Response(
                {"error": "Cannot change status of staff or admin users."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        user.is_active = not user.is_active
        user.status = 'active' if user.is_active else 'suspended'
        if not user.is_active:
            from django.utils import timezone
            user.suspended_at = timezone.now()
            user.suspension_reason = "Suspended by admin via panel"
        else:
            user.suspended_at = None
            user.suspension_reason = None
        user.save()
        
        return Response({
            "id": user.id,
            "username": user.username,
            "is_active": user.is_active,
            "status": user.status,
            "message": f"User status successfully updated to {'Active' if user.is_active else 'Suspended'}."
        }, status=status.HTTP_200_OK)


class AdminUserSuspendView(APIView):
    permission_classes = [IsCustomAdmin]

    def post(self, request, pk):
        user = get_object_or_404(User, id=pk)

        if user.is_staff or user.is_superuser or user.role == 'Admin':
            return Response(
                {"error": "Cannot suspend staff or admin users."},
                status=status.HTTP_400_BAD_REQUEST
            )

        reason = request.data.get('reason') or request.data.get('suspension_reason') or "Suspended by admin via panel"

        from django.utils import timezone
        user.is_active = False
        user.status = "suspended"
        user.suspension_reason = str(reason).strip()
        user.suspended_at = timezone.now()
        user.save()

        return Response({
            "message": "User suspended successfully",
            "user_id": str(user.id),
            "is_active": False,
            "status": "suspended",
            "suspension_reason": user.suspension_reason,
            "suspended_at": user.suspended_at
        }, status=status.HTTP_200_OK)


class AdminUserActivateView(APIView):
    permission_classes = [IsCustomAdmin]

    def post(self, request, pk):
        user = get_object_or_404(User, id=pk)

        user.is_active = True
        user.status = "active"
        user.suspension_reason = None
        user.suspended_at = None
        user.is_deleted = False
        user.save()

        return Response({
            "message": "User reactivated successfully",
            "user_id": str(user.id),
            "is_active": True,
            "status": "active"
        }, status=status.HTTP_200_OK)


class AdminUserDeleteView(APIView):
    permission_classes = [IsCustomAdmin]

    def delete(self, request, pk):
        user = get_object_or_404(User, id=pk)

        if user.is_staff or user.is_superuser or user.role == 'Admin':
            return Response(
                {"error": "Cannot delete staff or admin users."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.is_deleted = True
        user.is_active = False
        user.status = "deleted"
        user.save()

        return Response({
            "message": "User deleted successfully",
            "user_id": str(user.id)
        }, status=status.HTTP_200_OK)

    def post(self, request, pk):
        return self.delete(request, pk)


# C. Admin Quiz Creation & Moderation Views
class AdminQuizListCreateView(generics.ListCreateAPIView):
    serializer_class = AdminQuizSerializer
    permission_classes = [IsCustomAdmin]
    pagination_class = None  # Return ALL quizzes, frontend handles paging

    def get_queryset(self):
        return Quiz.objects.all().select_related('category', 'created_by').annotate(
            annotated_question_count=Count('question', distinct=True)
        ).order_by('-created_at')

    def perform_create(self, serializer):
        """Admin-created quizzes are always curated (is_ai_generated=False) and published."""
        from django.core.cache import cache
        serializer.save(
            created_by=self.request.user,
            is_ai_generated=False,
            is_published=True,
            status='published'
        )
        # Invalidate admin analytics cache so the new quiz appears immediately
        cache.delete("admin_analytics_summary")

class AdminQuizDetailUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Quiz.objects.all().select_related('category', 'created_by')
    serializer_class = AdminQuizSerializer
    permission_classes = [IsCustomAdmin]

    def perform_update(self, serializer):
        from django.core.cache import cache
        serializer.save()
        cache.delete("admin_analytics_summary")

    def perform_destroy(self, instance):
        from django.core.cache import cache
        instance.delete()
        cache.delete("admin_analytics_summary")

class AdminQuizToggleVisibilityView(APIView):
    permission_classes = [IsCustomAdmin]

    def post(self, request, pk):
        quiz = get_object_or_404(Quiz, id=pk)
        if 'is_published' in request.data:
            quiz.is_published = bool(request.data['is_published'])
        else:
            quiz.is_published = not quiz.is_published
        quiz.save()
        from django.core.cache import cache
        cache.delete("admin_analytics_summary")
        return Response({
            "id": quiz.id,
            "title": quiz.title,
            "is_published": quiz.is_published,
            "status": quiz.status,
            "message": f"Quiz visibility set to {'Published' if quiz.is_published else 'Draft'}."
        }, status=status.HTTP_200_OK)


# D. Penalty & Violation Logs Audit View
class AdminPenaltyLogListView(generics.ListAPIView):
    serializer_class = UserPenaltyLogSerializer
    permission_classes = [IsCustomAdmin]

    def get_queryset(self):
        return UserPenaltyLog.objects.all().select_related('user', 'attempt', 'attempt__quiz').order_by('-created_at')


# E. Support Ticket Inbox Views
class AdminSupportMessageListView(generics.ListAPIView):
    queryset = ContactMessage.objects.all().order_by('-created_at')
    serializer_class = AdminSupportMessageSerializer
    permission_classes = [IsCustomAdmin]
    permission_classes = [IsCustomAdmin]

class AdminSupportMessageToggleResolveView(APIView):
    permission_classes = [IsCustomAdmin]

    def patch(self, request, pk):
        message = get_object_or_404(ContactMessage, id=pk)
        message.is_resolved = not message.is_resolved
        reply_text = request.data.get('reply_message') or request.data.get('reply')
        if reply_text:
            message.reply_message = str(reply_text).strip()
            from django.utils import timezone
            message.replied_at = timezone.now()
        message.save()

        # ✅ Send email notification to user when support ticket is resolved or replied
        if message.is_resolved or reply_text:
            from apps.support.utils import send_resolution_email
            send_resolution_email(
                recipient_email=message.email,
                recipient_name=message.name,
                ticket_subject=message.subject,
                original_message=message.message,
                reply_message=message.reply_message,
                is_resolved=message.is_resolved
            )

        return Response({
            "id": message.id,
            "subject": message.subject,
            "is_resolved": message.is_resolved,
            "reply_message": message.reply_message,
            "message": f"Support message status updated to {'Resolved' if message.is_resolved else 'Unresolved'}."
        }, status=status.HTTP_200_OK)

    def post(self, request, pk):
        return self.patch(request, pk)


class AdminSupportMessageReplyView(APIView):
    permission_classes = [IsCustomAdmin]

    def post(self, request, pk):
        message = get_object_or_404(ContactMessage, id=pk)
        reply_msg = request.data.get('reply_message') or request.data.get('reply') or request.data.get('message', '').strip()

        if not reply_msg:
            return Response({"error": "Reply message cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        from django.utils import timezone
        message.reply_message = str(reply_msg).strip()
        message.is_resolved = True
        message.replied_at = timezone.now()
        message.save()

        # ✅ Send email notification to user
        from apps.support.utils import send_resolution_email
        send_resolution_email(
            recipient_email=message.email,
            recipient_name=message.name,
            ticket_subject=message.subject,
            original_message=message.message,
            reply_message=message.reply_message,
            is_resolved=True
        )

        return Response({
            "success": True,
            "message": "Resolution reply sent and email dispatched to user successfully.",
            "data": AdminSupportMessageSerializer(message).data
        }, status=status.HTTP_200_OK)

