from django.db import models
from django.conf import settings
from apps.attempts.models import QuizAttempt

class UserPenaltyLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='penalties')
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.SET_NULL, null=True, blank=True, related_name='penalties')
    violations_count = models.IntegerField()
    points_deducted = models.IntegerField()
    reason = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Penalty for {self.user.username}: -{self.points_deducted} points ({self.reason})"
