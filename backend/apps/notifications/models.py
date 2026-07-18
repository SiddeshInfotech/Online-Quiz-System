from django.db import models
from django.conf import settings


class Notification(models.Model):
    TYPE_CHOICES = [
        ('system', 'System'),
        ('achievement', 'Achievement'),   # badge became claimable
        ('badge_claimed', 'Badge Claimed'),
        ('daily_goal', 'Daily Goal'),
        ('quiz_result', 'Quiz Result'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    type = models.CharField(max_length=32, choices=TYPE_CHOICES, default='system')
    # Optional link target, e.g. a badge_id, so the frontend can deep-link.
    reference_id = models.IntegerField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'is_read']),
        ]

    def __str__(self):
        return f"{self.title} -> {self.user_id}"
