import os
import logging
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def send_resolution_email(recipient_email, recipient_name, ticket_subject, original_message, reply_message=None, is_resolved=True):
    """
    Sends an automated HTML resolution email to the user when their support ticket,
    bug report, or feedback is resolved or replied to by an admin.
    """
    if not recipient_email:
        print("⚠️ [send_resolution_email] No recipient email provided. Skipping email delivery.")
        return False

    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None) or 'zeeshanansari1081015@gmail.com'
    status_label = "RESOLVED" if is_resolved else "REPLIED"
    subject = f"[Online Quiz System] Issue {status_label}: {ticket_subject}"

    display_name = recipient_name or 'Valued User'
    admin_reply_note = str(reply_message).strip() if (reply_message and str(reply_message).strip()) else "Your ticket has been reviewed and marked as resolved by our moderation team."

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }}
    .card {{ max-width: 600px; margin: 0 auto; background-color: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }}
    .logo {{ text-align: center; margin-bottom: 24px; font-size: 22px; font-weight: bold; color: #a855f7; }}
    .badge {{ display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; background-color: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); margin-bottom: 16px; }}
    .greeting {{ font-size: 18px; font-weight: 600; color: #f1f5f9; margin-bottom: 12px; }}
    .message-box {{ background-color: #090d16; border: 1px solid #334155; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 14px; color: #cbd5e1; line-height: 1.6; }}
    .reply-box {{ background-color: rgba(168, 85, 247, 0.1); border-left: 4px solid #a855f7; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 14px; color: #e2e8f0; line-height: 1.6; }}
    .footer {{ text-align: center; font-size: 12px; color: #64748b; margin-top: 32px; border-top: 1px solid #334155; padding-top: 16px; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">⚡ Online Quiz System</div>
    <div class="badge">✓ ISSUE {status_label}</div>
    
    <div class="greeting">Hello {display_name},</div>
    <p style="color: #94a3b8; font-size: 14px;">Great news! Your support ticket/feedback has been reviewed and resolved by our administration team.</p>
    
    <div style="font-size: 12px; font-weight: bold; color: #94a3b8; text-transform: uppercase; margin-top: 16px;">Original Inquiry:</div>
    <div class="message-box">
      <strong>Subject:</strong> {ticket_subject}<br><br>
      {original_message}
    </div>
    
    <div style="font-size: 12px; font-weight: bold; color: #c084fc; text-transform: uppercase; margin-top: 16px;">Admin Resolution Note:</div>
    <div class="reply-box">
      {admin_reply_note}
    </div>
    
    <p style="color: #94a3b8; font-size: 13px; margin-top: 20px;">If you have any further questions or if your issue persists, feel free to submit a follow-up ticket via the platform support inbox.</p>
    
    <div class="footer">
      © 2026 Online Quiz System Support Team. All rights reserved.
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
            message=f"Hello {display_name},\n\nYour reported ticket/feedback '{ticket_subject}' has been {status_label}.\n\nAdmin Resolution Note:\n{admin_reply_note}\n\nThank you,\nOnline Quiz Support Team",
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
