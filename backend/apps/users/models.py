from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    email = models.EmailField(unique=True, blank=False, null=False)
    ROLE_CHOICES = (('Student', 'Student'), ('Admin', 'Admin'))
    full_name = models.CharField(max_length=100, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Student')
    profile_picture = models.BinaryField(blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_active_date = models.DateField(null=True, blank=True)
    total_points = models.IntegerField(default=0, db_index=True)  
    quizzes_completed = models.IntegerField(default=0) 
    theme_preference = models.CharField(
        max_length=20,
        choices=[('light', 'Light'), ('dark', 'Dark')],
        default='light'
    )
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=False)
    daily_quiz_goal = models.IntegerField(default=3)
    deactivated_at = models.DateTimeField(null=True, blank=True)
    profile_picture = models.ImageField(
    upload_to='profile_pics/', 
    null=True, 
    blank=True
    )
    school = models.CharField(max_length=255, blank=True)
    grade = models.CharField(max_length=20, blank=True)
    subject_interests = models.JSONField(default=list, blank=True)


    def __str__(self):
        return self.username