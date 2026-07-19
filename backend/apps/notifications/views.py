from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Notification
from .serializers import NotificationSerializer

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from .services import trigger_proactive_notifications
        trigger_proactive_notifications(self.request.user)
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

class NotificationCreateView(generics.CreateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class NotificationMarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            notification = Notification.objects.get(id=pk, user=request.user)
        except Notification.DoesNotExist:
            return Response({"error": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)

        notification.is_read = True
        notification.save()
        return Response({"message": "Notification marked as read."}, status=status.HTTP_200_OK)

class NotificationMarkAllReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"message": f"{count} notifications marked as read."}, status=status.HTTP_200_OK)

class NotificationMarkAsReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        notification_id = request.data.get('notification_id') or request.data.get('id')
        mark_all = request.data.get('mark_all')

        if mark_all is True or str(mark_all).lower() == 'true':
            Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
            message = "All active notifications marked as read."
        elif notification_id:
            try:
                notification = Notification.objects.get(id=notification_id, user=request.user)
                notification.is_read = True
                notification.save()
                message = f"Notification {notification_id} marked as read."
            except Notification.DoesNotExist:
                return Response({"error": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response(
                {"error": "Please provide either notification_id or mark_all=true."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Recalculate unread count
        unread_count = Notification.objects.filter(user=request.user, is_read=False).count()

        return Response({
            "status": "success",
            "unread_count": unread_count,
            "message": message
        }, status=status.HTTP_200_OK)

class NotificationUnreadCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        unread_count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({
            "status": "success",
            "unread_count": unread_count
        }, status=status.HTTP_200_OK)