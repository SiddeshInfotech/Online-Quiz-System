import os
import logging
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def send_resolution_email(recipient_email, recipient_name, ticket_subject, original_message, reply_message=None, is_resolved=True):
    """
    Sends an automated email notification to the user when their support ticket,
    bug report, or feedback is resolved or replied to by an admin.
    """
    if not recipient_email:
        print("⚠️ [send_resolution_email] No recipient email provided. Skipping email delivery.")
        return False

    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None) or 'zeeshanansari1081015@gmail.com'
    status_label = "RESOLVED" if is_resolved else "REPLIED"
    subject = f"[Online Quiz System] Issue {status_label}: {ticket_subject}"

    display_name = recipient_name or 'Valued User'
    reply_block = ""
    if reply_message and str(reply_message).strip():
        reply_block = f"""
        <div style="background-color: #EEF2FF; padding: 16px; border-left: 4px solid #4F46E5; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #3730A3; font-weight: bold; font-size: 14px;">Admin Response / Resolution Note:</p>
            <p style="margin: 6px 0 0 0; color: #1E1B4B; font-size: 15px; line-height: 1.5;">{reply_message}</p>
        </div>
        """

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px; }}
        .card {{ max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 28px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }}
        .header {{ border-bottom: 2px solid #6366f1; padding-bottom: 12px; margin-bottom: 20px; }}
        .header h2 {{ color: #4f46e5; margin: 0; font-size: 22px; }}
        .content {{ color: #374151; font-size: 15px; line-height: 1.6; }}
        .details {{ background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 18px 0; }}
        .label {{ font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }}
        .value {{ color: #111827; font-size: 14px; margin-top: 4px; margin-bottom: 12px; }}
        .footer {{ border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 28px; font-size: 12px; color: #9ca3af; text-align: center; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h2>Online Quiz System Support</h2>
        </div>
        <div class="content">
          <p>Hello <strong>{display_name}</strong>,</p>
          <p>Your reported support ticket / bug report has been updated to <strong style="color: #059669;">{status_label}</strong> by our Support & Moderation Team.</p>
          
          <div class="details">
            <div class="label">Ticket Subject</div>
            <div class="value">{ticket_subject}</div>
            
            <div class="label">Your Message</div>
            <div class="value" style="font-style: italic;">"{original_message}"</div>
          </div>
          
          {reply_block}
          
          <p>If your issue persists or you need additional help, feel free to contact us again on the Support page.</p>
        </div>
        <div class="footer">
          <p>Online Quiz System &copy; 2026. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    """

    print(f"[send_resolution_email] Attempting email delivery to {recipient_email} for subject '{ticket_subject}'...")

    # Send via SendGrid API
    sendgrid_key = os.environ.get('SENDGRID_API_KEY')
    if sendgrid_key:
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail

            email_msg = Mail(
                from_email=from_email,
                to_emails=recipient_email,
                subject=subject,
                html_content=html_content
            )
            sg = SendGridAPIClient(sendgrid_key)
            resp = sg.send(email_msg)
            print(f"[send_resolution_email] SendGrid email sent to {recipient_email}, status: {resp.status_code}")
            return True
        except Exception as e:
            print(f"[send_resolution_email] SendGrid failed ({e}), attempting fallback...")

    # Fallback via Django send_mail
    try:
        send_mail(
            subject=subject,
            message=f"Hello {display_name},\n\nYour reported ticket/feedback '{ticket_subject}' has been {status_label}.\n\nReply Note: {reply_message or 'Marked as resolved.'}\n\nThank you,\nOnline Quiz Support Team",
            from_email=from_email,
            recipient_list=[recipient_email],
            fail_silently=True,
            html_message=html_content
        )
        print(f"[send_resolution_email] Django send_mail executed for {recipient_email}")
        return True
    except Exception as e:
        print(f"[send_resolution_email] Email send failed: {e}")
        logger.error(f"Email send error: {e}")
        return False
