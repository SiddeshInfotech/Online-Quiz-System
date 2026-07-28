from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Avg
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.conf import settings
from .models import Feedback
from .serializers import FeedbackSerializer, FeedbackCreateSerializer
import logging

logger = logging.getLogger(__name__)

MAX_FEEDBACK_PER_USER = 2


class FeedbackCreateView(APIView):
    """Create feedback. Each user may create at most 2."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = FeedbackCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        existing_count = Feedback.objects.filter(user=request.user).count()
        if existing_count >= MAX_FEEDBACK_PER_USER:
            return Response(
                {"detail": f"You can submit a maximum of {MAX_FEEDBACK_PER_USER} feedback entries. "
                           f"Edit an existing one instead."},
                status=status.HTTP_403_FORBIDDEN
            )

        feedback = Feedback.objects.create(
            user=request.user,
            rating=serializer.validated_data['rating'],
            message=serializer.validated_data['message'],
        )

        # ✅ Trigger admin notification in DB for Admin Panel
        try:
            from apps.notifications.utils import send_admin_notification
            send_admin_notification(
                title=f"New Feedback Received ({feedback.rating}★)",
                message=f"User {request.user.username} submitted feedback: {feedback.message[:150]}",
                notification_type="feedback",
                reference_id=feedback.id
            )
        except Exception as e:
            logger.error(f"Failed to send DB admin notification for feedback: {e}")

        # ✅ Send email admin notification in non-blocking background thread
        import threading
        threading.Thread(
            target=self._send_admin_notification,
            args=(request.user, feedback, True),
            daemon=True
        ).start()

        return Response({
            "message": "Feedback submitted successfully",
            "created": True,
            "updated": False,
            "feedback": FeedbackSerializer(feedback).data
        }, status=status.HTTP_201_CREATED)

    def _send_admin_notification(self, user, feedback, is_new):
        """Send email to admin when feedback is created or updated."""
        print(f"🔍 [FeedbackCreate] Sending admin notification for {user.username}")
        
        try:
            import os
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail
            
            admin_email = getattr(settings, 'ADMIN_EMAIL', None) or getattr(settings, 'FROM_EMAIL', None) or 'zeeshanansari1081015@gmail.com'
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'zeeshanansari1081015@gmail.com')
            
            subject = f"[Feedback] {'New' if is_new else 'Updated'} feedback from {user.username}"
            html_content = f"""
            <h3>Feedback {'submitted' if is_new else 'updated'} by:</h3>
            <p><b>User Name:</b> {user.full_name or 'Not set'}</p>
            <p><b>Username:</b> {user.username}</p>
            <p><b>Email:</b> {user.email}</p>
            <p><b>Rating:</b> {feedback.rating}★</p>
            <p><b>Message:</b> {feedback.message}</p>
            <p><b>Time:</b> {feedback.updated_at.strftime('%Y-%m-%d %H:%M:%S')}</p>
            <p><b>Status:</b> {'New Feedback' if is_new else 'Updated Feedback'}</p>
            """

            message = Mail(
                from_email=from_email,
                to_emails=admin_email,
                subject=subject,
                html_content=html_content
            )
            sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
            response = sg.send(message)
            print(f"✅ [FeedbackCreate] SendGrid email sent to {admin_email}, status: {response.status_code}")

        except Exception as e:
            print(f"❌ [FeedbackCreate] Email error: {e}")
            logger.error(f"Failed to send feedback notification: {e}")


class FeedbackListView(generics.ListAPIView):
    """All public feedback, visible to every user (excludes hidden feedback)."""
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return Feedback.objects.filter(is_hidden=False).exclude(status='Hidden').select_related('user', 'replied_by').order_by('-created_at')


class FeedbackSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Feedback.objects.filter(is_hidden=False).exclude(status='Hidden')
        total_reviews = qs.count()
        avg_rating = qs.aggregate(Avg('rating'))['rating__avg'] or 0
        distribution = {
            str(r): qs.filter(rating=r).count() for r in range(1, 6)
        }
        return Response({
            "average_rating": round(avg_rating, 2),
            "total_reviews": total_reviews,
            "distribution": distribution
        })


class MyFeedbackView(APIView):
    """List the current user's feedback entries (0, 1, or 2)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Feedback.objects.filter(user=request.user).select_related('user', 'replied_by').order_by('created_at')
        return Response({
            "count": qs.count(),
            "max_allowed": MAX_FEEDBACK_PER_USER,
            "results": FeedbackSerializer(qs, many=True).data
        }, status=status.HTTP_200_OK)


class MyFeedbackDetailView(APIView):
    """Edit or delete ONE of the current user's feedback entries by id."""
    permission_classes = [permissions.IsAuthenticated]

    def _get_object(self, request, pk):
        return get_object_or_404(Feedback, pk=pk, user=request.user)

    def put(self, request, pk):
        feedback = self._get_object(request, pk)
        serializer = FeedbackCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        feedback.rating = serializer.validated_data['rating']
        feedback.message = serializer.validated_data['message']
        feedback.save()

        # ✅ Send admin notification (update)
        self._send_admin_notification(request.user, feedback, is_new=False)

        return Response({
            "message": "Feedback updated successfully",
            "created": False,
            "updated": True,
            "feedback": FeedbackSerializer(feedback).data
        }, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        feedback = self._get_object(request, pk)
        feedback.delete()
        return Response({"message": "Feedback deleted successfully"},
                        status=status.HTTP_204_NO_CONTENT)

    def _send_admin_notification(self, user, feedback, is_new):
        """Send email to admin when feedback is created or updated using SendGrid."""
        print(f"📧 [FeedbackUpdate] Sending admin notification for {user.username} via SendGrid")
        
        try:
            import os
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail
            
            admin_email = getattr(settings, 'ADMIN_EMAIL', None) or getattr(settings, 'FROM_EMAIL', None) or 'zeeshanansari1081015@gmail.com'
            from_email = 'zeeshanansari1081015@gmail.com'
            
            subject = f"[Feedback] {'New' if is_new else 'Updated'} feedback from {user.username}"
            html_content = f"""
            <h3>Feedback {'submitted' if is_new else 'updated'} by:</h3>
            <p><b>User Name:</b> {user.full_name or 'Not set'}</p>
            <p><b>Username:</b> {user.username}</p>
            <p><b>Email:</b> {user.email}</p>
            <p><b>Rating:</b> {feedback.rating}★</p>
            <p><b>Message:</b> {feedback.message}</p>
            <p><b>Time:</b> {feedback.updated_at.strftime('%Y-%m-%d %H:%M:%S')}</p>
            <p><b>Status:</b> {'New Feedback' if is_new else 'Updated Feedback'}</p>
            """

            message = Mail(
                from_email=from_email,
                to_emails=admin_email,
                subject=subject,
                html_content=html_content
            )
            sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
            response = sg.send(message)
            print(f"✅ [FeedbackUpdate] SendGrid email sent to {admin_email}, status: {response.status_code}")

        except Exception as e:
            print(f"❌ [FeedbackUpdate] SendGrid email error: {e}")
            logger.error(f"Failed to send feedback notification via SendGrid: {e}")