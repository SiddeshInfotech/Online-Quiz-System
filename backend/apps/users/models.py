from django.contrib.auth.models import AbstractUser
from django.db import models
from cloudinary.models import CloudinaryField
from django.core.validators import MinValueValidator, MaxValueValidator, MinLengthValidator, MaxLengthValidator

class User(AbstractUser):
    ROLE_CHOICES = (
        ('Student', 'Student'),
        ('Admin', 'Admin'),
    )
    
    full_name = models.CharField(max_length=100, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Student')
    profile_picture = CloudinaryField('image', blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    school = models.CharField(max_length=255, blank=True)
    grade = models.CharField(max_length=20, blank=True)
    subject_interests = models.JSONField(default=list, blank=True)
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_active_date = models.DateField(null=True, blank=True)
    total_points = models.IntegerField(default=0, db_index=True)
    quizzes_completed = models.IntegerField(default=0)
    theme_preference = models.CharField(max_length=20, default='light')
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=False)
    daily_quiz_goal = models.IntegerField(default=3)
    deactivated_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.username


class Badge(models.Model):
    RARITY_CHOICES = [
        ('COMMON', 'Common'),
        ('RARE', 'Rare'),
        ('EPIC', 'Epic'),
        ('LEGENDARY', 'Legendary'),
    ]
    
    badge_id = models.IntegerField(unique=True)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    image_url = models.URLField(max_length=500)
    cloudinary_filename = models.CharField(max_length=100)
    requirement = models.TextField()
    category = models.CharField(max_length=50, default='General')
    rarity = models.CharField(max_length=20, choices=RARITY_CHOICES, default='COMMON')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.badge_id}: {self.name} ({self.rarity})"


class UserBadge(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='earned_badges')
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE)
    awarded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'badge')

    def __str__(self):
        return f"{self.user.username} - {self.badge.name}"