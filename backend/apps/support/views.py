import logging
import threading
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import ContactMessage
from .serializers import ContactMessageSerializer

logger = logging.getLogger(__name__)

TARGET_SUPPORT_EMAIL = "uidssvps@gmail.com"


def send_contact_notification_email(contact_instance):
    """
    Sends email notification strictly to uidssvps@gmail.com in a fail-safe manner.
    """
    try:
        subject = f"[QuizGen Support - {contact_instance.category}] {contact_instance.subject}"
        body = (
            f"New Contact Us Form Submission Received:\n\n"
            f"--------------------------------------------------\n"
            f"Sender Name:    {contact_instance.name}\n"
            f"Sender Email:   {contact_instance.email}\n"
            f"Category:       {contact_instance.category}\n"
            f"Submitted At:   {contact_instance.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}\n"
            f"--------------------------------------------------\n\n"
            f"Message:\n{contact_instance.message}\n\n"
            f"--------------------------------------------------\n"
            f"This message was saved to the database (ID: {contact_instance.id})."
        )
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None) or 'noreply@quizgen.com'

        send_mail(
            subject=subject,
            message=body,
            from_email=from_email,
            recipient_list=[TARGET_SUPPORT_EMAIL],
            fail_silently=False,
        )
        logger.info(f"Support notification email sent successfully to {TARGET_SUPPORT_EMAIL} for message ID {contact_instance.id}")
    except Exception as e:
        logger.error(f"Failed to send support notification email for message ID {contact_instance.id}: {e}")


class ContactCreateView(APIView):
    """
    POST /api/support/contact/
    Allows unauthenticated / public access for visitors and users to submit support messages.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = ContactMessageSerializer(data=request.data)
        if serializer.is_valid():
            contact_instance = serializer.save()

            # Fail-safe asynchronous email dispatch
            email_thread = threading.Thread(
                target=send_contact_notification_email,
                args=(contact_instance,),
                daemon=True
            )
            email_thread.start()

            return Response({
                "status": "success",
                "message": "Your message has been submitted successfully. Our support team will get back to you shortly.",
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response({
            "status": "error",
            "message": "Validation failed.",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
