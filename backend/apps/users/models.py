from django.contrib.auth.models import AbstractUser
from django.db import models
from cloudinary.models import CloudinaryField
from django.conf import settings
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
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('deleted', 'Deleted'),
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    suspension_reason = models.TextField(blank=True, null=True)
    suspended_at = models.DateTimeField(blank=True, null=True)
    is_deleted = models.BooleanField(default=False)
    xp = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    

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
    xp_reward = models.IntegerField(default=10)  # NEW: awarded to user.total_points on claim
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.badge_id}: {self.name} ({self.rarity})"


class UserBadge(models.Model):
    STATUS_CHOICES = [
        ('CLAIMABLE', 'Claimable'),
        ('CLAIMED', 'Claimed'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='earned_badges')
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='CLAIMABLE')  # ADD THIS
    earned_at = models.DateTimeField(auto_now_add=True)
    claimed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'badge')
        indexes = [
            models.Index(fields=['user', 'status']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.badge.name} ({self.status})"


from django.utils import timezone

class Subscription(models.Model):
    PLAN_CHOICES = (
        ('FREE', 'Free Tier'),
        ('PRO', 'Premium Pro'),
    )
    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('EXPIRED', 'Expired'),
        ('CANCELLED', 'Cancelled'),
    )
    BILLING_CHOICES = (
        ('MONTHLY', 'Monthly'),
        ('YEARLY', 'Yearly'),
    )

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='subscription')
    plan = models.CharField(max_length=10, choices=PLAN_CHOICES, default='FREE')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='ACTIVE')
    billing_cycle = models.CharField(max_length=10, choices=BILLING_CHOICES, default='MONTHLY', null=True, blank=True)
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True)
    cancellation_requested = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.plan} ({self.status})"

    @property
    def is_pro(self):
        if self.plan == 'PRO' and self.status == 'ACTIVE':
            if self.end_date and timezone.now() > self.end_date:
                return False
            return True
        return False