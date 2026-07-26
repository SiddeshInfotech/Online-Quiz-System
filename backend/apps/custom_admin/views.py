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

        # Admin quizzes = quizzes created by official admin superuser
        admin_quizzes = Quiz.objects.filter(
            Q(created_by__username__iexact='admin') | Q(created_by__is_superuser=True)
        ).count()
        # User quizzes = all other quizzes (created by regular users)
        user_quizzes = Quiz.objects.exclude(
            Q(created_by__username__iexact='admin') | Q(created_by__is_superuser=True)
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
        from django.db.models import Count, Q
        from django.utils import timezone
        today = timezone.localdate()
        return User.objects.all().select_related('subscription').annotate(
            annotated_total_attempts=Count('attempts', distinct=True),
            annotated_penalty_count=Count('penalties', distinct=True),
            annotated_quizzes_created_today=Count('quiz', filter=Q(quiz__created_at__date=today), distinct=True),
            annotated_attempts_today=Count('attempts', filter=Q(attempts__started_at__date=today), distinct=True)
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
        """Admin-created quizzes are always curated (is_ai_generated=False) and published under official Admin user."""
        from django.core.cache import cache
        from apps.users.models import User as UserModel
        from django.db.models import Q
        admin_user = UserModel.objects.filter(
            Q(username__iexact='admin') | Q(is_superuser=True)
        ).first() or self.request.user

        serializer.save(
            created_by=admin_user,
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

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['include_questions'] = True
        return context

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


# 🛠️ Subscription Management Endpoints for Admin Panel
from datetime import timedelta
from django.utils import timezone
from apps.users.models import Subscription

class AdminSubscriptionStatsView(APIView):
    permission_classes = [IsCustomAdmin]

    def get(self, request):
        total_users = User.objects.count()
        pro_subscriptions = Subscription.objects.filter(plan='PRO', status='ACTIVE')
        pro_users = pro_subscriptions.count()
        free_users = max(0, total_users - pro_users)
        active_subscriptions = Subscription.objects.filter(status='ACTIVE').count()
        expired_subscriptions = Subscription.objects.filter(status='EXPIRED').count()
        cancelled_subscriptions = Subscription.objects.filter(status='CANCELLED').count()
        
        monthly_revenue = pro_users * 299  # ₹299 per pro user

        return Response({
            "total_users": total_users,
            "free_users": free_users,
            "pro_users": pro_users,
            "active_subscriptions": active_subscriptions,
            "expired_subscriptions": expired_subscriptions,
            "cancelled_subscriptions": cancelled_subscriptions,
            "monthly_revenue": monthly_revenue,
            "monthly_revenue_formatted": f"₹{monthly_revenue:,}"
        }, status=status.HTTP_200_OK)


class AdminSubscriptionsListView(APIView):
    permission_classes = [IsCustomAdmin]

    def get(self, request):
        users = User.objects.all().select_related('subscription').order_by('-date_joined')
        today = timezone.localdate()

        result = []
        for user in users:
            sub = getattr(user, 'subscription', None)
            is_pro = sub.is_pro if sub else False
            plan = "PRO" if is_pro else "FREE"
            status_val = sub.status if (sub and is_pro) else "ACTIVE"

            days_remaining = 0
            if sub and sub.end_date:
                days_remaining = max(0, (sub.end_date - timezone.now()).days)

            daily_quiz_used = Quiz.objects.filter(
                created_by=user,
                created_at__date=today
            ).count()

            result.append({
                "user_id": user.id,
                "user": user.username,
                "username": user.username,
                "full_name": user.full_name or user.username,
                "email": user.email,
                "current_plan": plan,
                "plan": plan,
                "status": status_val,
                "billing_cycle": sub.billing_cycle if sub else "MONTHLY",
                "subscription_start": sub.start_date.isoformat() if (sub and sub.start_date) else user.date_joined.isoformat(),
                "subscription_end": sub.end_date.isoformat() if (sub and sub.end_date) else None,
                "renewal_date": sub.end_date.isoformat() if (sub and sub.end_date) else None,
                "days_remaining": days_remaining,
                "daily_quiz_used": daily_quiz_used,
                "daily_quiz_limit": 10 if is_pro else 3,
                "is_pro": is_pro
            })

        return Response(result, status=status.HTTP_200_OK)


class AdminSubscriptionActionView(APIView):
    permission_classes = [IsCustomAdmin]

    def post(self, request, user_id):
        target_user = get_object_or_404(User, id=user_id)
        action = request.data.get('action', '').upper()

        sub, _ = Subscription.objects.get_or_create(user=target_user)

        if action == 'UPGRADE':
            sub.plan = 'PRO'
            sub.status = 'ACTIVE'
            sub.start_date = timezone.now()
            sub.end_date = timezone.now() + timedelta(days=30)
            sub.save()
            msg = f"User {target_user.username} successfully upgraded to PRO tier."
        elif action == 'DOWNGRADE':
            sub.plan = 'FREE'
            sub.status = 'ACTIVE'
            sub.save()
            msg = f"User {target_user.username} downgraded to FREE tier."
        elif action == 'EXTEND_30_DAYS':
            sub.plan = 'PRO'
            sub.status = 'ACTIVE'
            current_end = sub.end_date if (sub.end_date and sub.end_date > timezone.now()) else timezone.now()
            sub.end_date = current_end + timedelta(days=30)
            sub.save()
            msg = f"Subscription for {target_user.username} extended by 30 days."
        elif action == 'CANCEL':
            sub.plan = 'FREE'
            sub.status = 'CANCELLED'
            sub.cancellation_requested = True
            sub.save()
            msg = f"Subscription for {target_user.username} cancelled."
        elif action == 'REACTIVATE':
            sub.plan = 'PRO'
            sub.status = 'ACTIVE'
            sub.start_date = timezone.now()
            sub.end_date = timezone.now() + timedelta(days=30)
            sub.save()
            msg = f"Subscription for {target_user.username} reactivated."
        else:
            return Response({"error": "Invalid action. Supported: UPGRADE, DOWNGRADE, EXTEND_30_DAYS, CANCEL, REACTIVATE."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "success": True,
            "message": msg,
            "user_id": target_user.id,
            "username": target_user.username,
            "plan": sub.plan,
            "status": sub.status,
            "is_pro": sub.is_pro,
            "end_date": sub.end_date.isoformat() if sub.end_date else None
        }, status=status.HTTP_200_OK)


# 🔔 ADMIN PANEL NOTIFICATION ENDPOINTS
from apps.notifications.models import Notification
from apps.notifications.serializers import NotificationSerializer

class AdminNotificationsListView(APIView):
    permission_classes = [IsCustomAdmin]

    def get(self, request):
        user = request.user
        type_filter = request.query_params.get('type')
        qs = Notification.objects.filter(user=user).order_by('-created_at')

        if type_filter:
            qs = qs.filter(type__iexact=type_filter)

        unread_count = Notification.objects.filter(user=user, is_read=False).count()
        serializer = NotificationSerializer(qs[:50], many=True)

        return Response({
            "unread_count": unread_count,
            "total": qs.count(),
            "notifications": serializer.data
        }, status=status.HTTP_200_OK)


class AdminNotificationsUnreadCountView(APIView):
    permission_classes = [IsCustomAdmin]

    def get(self, request):
        unread_count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({
            "unread_count": unread_count
        }, status=status.HTTP_200_OK)


class AdminNotificationsMarkReadView(APIView):
    permission_classes = [IsCustomAdmin]

    def post(self, request, pk=None):
        user = request.user
        notification_id = pk or request.data.get('id') or request.data.get('notification_id')
        mark_all = request.data.get('all', False) or request.data.get('mark_all', False)

        if mark_all or str(notification_id).lower() == 'all':
            count = Notification.objects.filter(user=user, is_read=False).update(is_read=True)
            return Response({"message": f"Marked {count} notifications as read.", "unread_count": 0}, status=status.HTTP_200_OK)

        if notification_id:
            updated = Notification.objects.filter(id=notification_id, user=user).update(is_read=True)
            unread_count = Notification.objects.filter(user=user, is_read=False).count()
            if updated:
                return Response({"message": "Notification marked as read.", "unread_count": unread_count}, status=status.HTTP_200_OK)
            return Response({"error": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response({"error": "Provide notification_id or all: true"}, status=status.HTTP_400_BAD_REQUEST)

