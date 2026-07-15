from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator, MinLengthValidator, MaxLengthValidator

class Feedback(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='feedback',
        unique=True
    )
    rating = models.SmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    message = models.TextField(
        validators=[MinLengthValidator(10), MaxLengthValidator(1000)]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['rating']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.rating}★"