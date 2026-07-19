from django.db import models
from django.conf import settings

class QuizCategory(models.Model):
    category_name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.category_name

class Quiz(models.Model):
    DIFFICULTY = (('Easy','Easy'), ('Medium','Medium'), ('Hard','Hard'))
    TYPE = (('MCQ','MCQ'), ('True/False','True/False'), ('Fill in the Blank','Fill in the Blank'))
    VISIBILITY = (('Public','Public'), ('Private','Private'))
    STATUS = (('Draft','Draft'), ('Published','Published'))

    category = models.ForeignKey(QuizCategory, on_delete=models.RESTRICT)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    title = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    subject = models.CharField(max_length=100, blank=True, null=True)
    topic = models.CharField(max_length=150, blank=True, null=True)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY)
    question_type = models.CharField(max_length=50, choices=TYPE)
    visibility = models.CharField(max_length=20, choices=VISIBILITY, default='Public')
    status = models.CharField(max_length=20, choices=STATUS, default='Draft')
    duration_minutes = models.IntegerField()
    total_marks = models.IntegerField(default=0)
    is_ai_generated = models.BooleanField(default=False)
    join_code = models.CharField(max_length=20, unique=True, blank=True, null=True)
    share_link = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    GRADE_CHOICES = [
        ('8', 'Class 8'),
        ('9', 'Class 9'),
        ('10', 'Class 10'),
        ('11', 'Class 11'),
        ('12', 'Class 12'),
    ]
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
    ]
    
    grade_level = models.CharField(max_length=10, choices=GRADE_CHOICES, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')

    def __str__(self):
        return self.title