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

        # ✅ Send admin notification (new)
        self._send_admin_notification(request.user, feedback, is_new=True)

        return Response({
            "message": "Feedback submitted successfully",
            "created": True,
            "updated": False,
            "feedback": FeedbackSerializer(feedback).data
        }, status=status.HTTP_201_CREATED)

    def _send_admin_notification(self, user, feedback, is_new):
        """Send email to admin when feedback is created or updated."""
        try:
            subject = f"[Feedback] {'New' if is_new else 'Updated'} feedback from {user.username}"
            message = f"""
Feedback {'submitted' if is_new else 'updated'} by:

User Name: {user.full_name or 'Not set'}
Username: {user.username}
Email: {user.email}
Rating: {feedback.rating}★
Message: {feedback.message}
Time: {feedback.updated_at.strftime('%Y-%m-%d %H:%M:%S')}
Status: {'New Feedback' if is_new else 'Updated Feedback'}
            """
            admin_email = getattr(settings, 'ADMIN_EMAIL', None) or getattr(settings, 'FROM_EMAIL', None)
            if admin_email:
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [admin_email],
                    fail_silently=True,
                )
            else:
                logger.warning("Admin email not configured, skipping notification.")
        except Exception as e:
            logger.error(f"Failed to send feedback notification: {e}")


class FeedbackListView(generics.ListAPIView):
    """All feedback, visible to every user."""
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return Feedback.objects.select_related('user').order_by('-created_at')


class FeedbackSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        total_reviews = Feedback.objects.count()
        avg_rating = Feedback.objects.aggregate(Avg('rating'))['rating__avg'] or 0
        distribution = {
            str(r): Feedback.objects.filter(rating=r).count() for r in range(1, 6)
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
        qs = Feedback.objects.filter(user=request.user).order_by('created_at')
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
        """Same helper as above."""
        try:
            subject = f"[Feedback] {'New' if is_new else 'Updated'} feedback from {user.username}"
            message = f"""
Feedback {'submitted' if is_new else 'updated'} by:

User Name: {user.full_name or 'Not set'}
Username: {user.username}
Email: {user.email}
Rating: {feedback.rating}★
Message: {feedback.message}
Time: {feedback.updated_at.strftime('%Y-%m-%d %H:%M:%S')}
Status: {'New Feedback' if is_new else 'Updated Feedback'}
            """
            admin_email = getattr(settings, 'ADMIN_EMAIL', None) or getattr(settings, 'FROM_EMAIL', None)
            if admin_email:
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [admin_email],
                    fail_silently=True,
                )
        except Exception as e:
            logger.error(f"Failed to send feedback notification: {e}")