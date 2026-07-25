from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Avg, Count, Q
from django.shortcuts import get_object_or_404
from .models import Feedback
from .serializers import AdminFeedbackSerializer
from apps.custom_admin.views import IsCustomAdmin


class AdminFeedbackListView(generics.ListAPIView):
    serializer_class = AdminFeedbackSerializer
    permission_classes = [IsCustomAdmin]

    def get_queryset(self):
        qs = Feedback.objects.select_related('user', 'replied_by', 'edited_by').all()
        params = self.request.query_params

        # 1. Search filter (username, email, message)
        search = params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(user__username__icontains=search) |
                Q(user__email__icontains=search) |
                Q(user__full_name__icontains=search) |
                Q(message__icontains=search)
            )

        # 2. Rating filter
        rating = params.get('rating', '').strip()
        if rating and rating.isdigit():
            qs = qs.filter(rating=int(rating))

        # 3. Status filter ('Pending', 'Reviewed', 'Replied', 'Hidden')
        status_val = params.get('status', '').strip()
        if status_val:
            qs = qs.filter(status__iexact=status_val)

        # 4. Ordering
        ordering = params.get('ordering', '').strip()
        if ordering in ['created_at', '-created_at', 'rating', '-rating', 'status', '-status', 'updated_at', '-updated_at']:
            qs = qs.order_by(ordering)
        else:
            qs = qs.order_by('-created_at')

        return qs


class AdminFeedbackDetailUpdateDeleteView(APIView):
    permission_classes = [IsCustomAdmin]

    def get(self, request, pk):
        feedback = get_object_or_404(Feedback.objects.select_related('user', 'replied_by', 'edited_by'), id=pk)
        return Response(AdminFeedbackSerializer(feedback).data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        feedback = get_object_or_404(Feedback, id=pk)
        data = request.data

        edited = False
        if 'message' in data and data['message']:
            feedback.message = str(data['message']).strip()
            edited = True
        if 'rating' in data and str(data['rating']).isdigit():
            r = int(data['rating'])
            if 1 <= r <= 5:
                feedback.rating = r
                edited = True
        if 'status' in data and data['status']:
            st = str(data['status']).strip()
            valid_statuses = [choice[0] for choice in Feedback.STATUS_CHOICES]
            for val in valid_statuses:
                if val.lower() == st.lower():
                    feedback.status = val
                    if val == 'Hidden':
                        feedback.is_hidden = True
                    elif val != 'Hidden' and feedback.is_hidden:
                        feedback.is_hidden = False
                    edited = True
                    break

        if edited:
            feedback.edited_by = request.user
            feedback.edited_at = timezone.now()
            feedback.save()

        return Response({
            "message": "Feedback updated successfully.",
            "feedback": AdminFeedbackSerializer(feedback).data
        }, status=status.HTTP_200_OK)

    def put(self, request, pk):
        return self.patch(request, pk)

    def delete(self, request, pk):
        feedback = get_object_or_404(Feedback, id=pk)
        feedback.delete()
        return Response({"message": "Feedback deleted successfully."}, status=status.HTTP_200_OK)


class AdminFeedbackReplyView(APIView):
    permission_classes = [IsCustomAdmin]

    def post(self, request, pk):
        feedback = get_object_or_404(Feedback.objects.select_related('user'), id=pk)
        reply_msg = request.data.get('reply_message', '').strip()

        if not reply_msg:
            return Response(
                {"error": "Reply message cannot be empty."},
                status=status.HTTP_400_BAD_REQUEST
            )

        feedback.reply_message = reply_msg
        feedback.status = 'Replied'
        feedback.reply_date = timezone.now()
        feedback.replied_by = request.user
        feedback.save()

        # ✅ Send resolution email notification to user
        if feedback.user and feedback.user.email:
            from apps.support.utils import send_resolution_email
            send_resolution_email(
                recipient_email=feedback.user.email,
                recipient_name=feedback.user.full_name or feedback.user.username,
                ticket_subject=f"Feedback #{feedback.id} ({feedback.rating}★)",
                original_message=feedback.message,
                reply_message=feedback.reply_message,
                is_resolved=True
            )

        return Response({
            "message": "Reply sent and email notification dispatched to user successfully.",
            "feedback": AdminFeedbackSerializer(feedback).data
        }, status=status.HTTP_200_OK)


class AdminFeedbackHideView(APIView):
    permission_classes = [IsCustomAdmin]

    def post(self, request, pk):
        feedback = get_object_or_404(Feedback, id=pk)
        feedback.is_hidden = True
        feedback.status = 'Hidden'
        feedback.save()

        return Response({
            "message": "Feedback hidden successfully.",
            "id": feedback.id,
            "is_hidden": True,
            "status": "Hidden",
            "feedback": AdminFeedbackSerializer(feedback).data
        }, status=status.HTTP_200_OK)


class AdminFeedbackStatsView(APIView):
    permission_classes = [IsCustomAdmin]

    def get(self, request):
        total_feedback = Feedback.objects.count()
        pending = Feedback.objects.filter(status='Pending').count()
        reviewed = Feedback.objects.filter(status='Reviewed').count()
        replied = Feedback.objects.filter(status='Replied').count()
        hidden = Feedback.objects.filter(Q(status='Hidden') | Q(is_hidden=True)).count()

        avg_rating = Feedback.objects.aggregate(avg=Avg('rating'))['avg'] or 0.0

        five_star = Feedback.objects.filter(rating=5).count()
        four_star = Feedback.objects.filter(rating=4).count()
        three_star = Feedback.objects.filter(rating=3).count()
        two_star = Feedback.objects.filter(rating=2).count()
        one_star = Feedback.objects.filter(rating=1).count()

        return Response({
            "total_feedback": total_feedback,
            "pending": pending,
            "reviewed": reviewed,
            "replied": replied,
            "hidden": hidden,
            "average_rating": round(float(avg_rating), 1),
            "five_star": five_star,
            "four_star": four_star,
            "three_star": three_star,
            "two_star": two_star,
            "one_star": one_star
        }, status=status.HTTP_200_OK)
