from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator, MinLengthValidator, MaxLengthValidator

class Feedback(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Reviewed', 'Reviewed'),
        ('Replied', 'Replied'),
        ('Hidden', 'Hidden'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='feedback'
    )
    rating = models.SmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    message = models.TextField(
        validators=[MinLengthValidator(10), MaxLengthValidator(1000)]
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='Pending'
    )
    reply_message = models.TextField(blank=True, null=True)
    reply_date = models.DateTimeField(blank=True, null=True)
    replied_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='feedback_replies'
    )
    is_hidden = models.BooleanField(default=False)
    edited_at = models.DateTimeField(blank=True, null=True)
    edited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='feedback_edits'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['rating']),
            models.Index(fields=['status']),
            models.Index(fields=['is_hidden']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.rating}★ ({self.status})"