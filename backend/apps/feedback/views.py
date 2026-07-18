from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Avg
from django.shortcuts import get_object_or_404
from .models import Feedback
from .serializers import FeedbackSerializer, FeedbackCreateSerializer

MAX_FEEDBACK_PER_USER = 2


class FeedbackCreateView(APIView):
    """Create feedback. Each user may create at most 2 (item 14)."""
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
        return Response({
            "message": "Feedback submitted successfully",
            "feedback": FeedbackSerializer(feedback).data
        }, status=status.HTTP_201_CREATED)


class FeedbackListView(generics.ListAPIView):
    """All feedback, visible to every user (item 14)."""
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
    """Edit or delete ONE of the current user's feedback entries by id (item 14: editable)."""
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
        return Response({
            "message": "Feedback updated successfully",
            "feedback": FeedbackSerializer(feedback).data
        }, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        feedback = self._get_object(request, pk)
        feedback.delete()
        return Response({"message": "Feedback deleted successfully"},
                        status=status.HTTP_204_NO_CONTENT)
