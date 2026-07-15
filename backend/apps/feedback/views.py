from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Avg, Count, Q
from .models import Feedback
from .serializers import FeedbackSerializer, FeedbackCreateSerializer, FeedbackSummarySerializer

class FeedbackCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = FeedbackCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data

        # One feedback per user — update if exists, create otherwise
        feedback, created = Feedback.objects.update_or_create(
            user=request.user,
            defaults={
                'rating': validated_data['rating'],
                'message': validated_data['message']
            }
        )

        return Response({
            "message": "Feedback submitted successfully",
            "feedback": FeedbackSerializer(feedback).data
        }, status=status.HTTP_200_OK)


class FeedbackListView(generics.ListAPIView):
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None  # Disable for now, or use DRF's default pagination

    def get_queryset(self):
        return Feedback.objects.select_related('user').order_by('-created_at')


class FeedbackSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        total_reviews = Feedback.objects.count()
        avg_rating = Feedback.objects.aggregate(Avg('rating'))['rating__avg'] or 0

        # Distribution: count per rating
        distribution = {}
        for rating in range(1, 6):
            distribution[str(rating)] = Feedback.objects.filter(rating=rating).count()

        return Response({
            "average_rating": round(avg_rating, 2),
            "total_reviews": total_reviews,
            "distribution": distribution
        })


class MyFeedbackView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            feedback = Feedback.objects.get(user=request.user)
            return Response(FeedbackSerializer(feedback).data, status=status.HTTP_200_OK)
        except Feedback.DoesNotExist:
            return Response({"detail": "No feedback found."}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request):
        try:
            feedback = Feedback.objects.get(user=request.user)
        except Feedback.DoesNotExist:
            return Response({"detail": "No feedback found."}, status=status.HTTP_404_NOT_FOUND)

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


class MyFeedbackDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        try:
            feedback = Feedback.objects.get(user=request.user)
            feedback.delete()
            return Response({"message": "Feedback deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Feedback.DoesNotExist:
            return Response({"detail": "No feedback found."}, status=status.HTTP_404_NOT_FOUND)