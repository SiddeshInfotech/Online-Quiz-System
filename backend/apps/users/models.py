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

    def __str__(self):
        return self.username