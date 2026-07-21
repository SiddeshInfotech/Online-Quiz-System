from django.db import models


class ContactMessage(models.Model):
    CATEGORY_CHOICES = [
        ('General Inquiry', 'General Inquiry'),
        ('Feature Request', 'Feature Request'),
        ('Technical Support', 'Technical Support'),
        ('Bug Report', 'Bug Report'),
        ('Other', 'Other'),
    ]

    name = models.CharField(max_length=150)
    email = models.EmailField()
    subject = models.CharField(max_length=250)
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES, default='General Inquiry')
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_resolved = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.category}] {self.subject} - {self.name} ({self.email})"
