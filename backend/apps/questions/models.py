from django.db import models
from apps.quizzes.models import Quiz

class Question(models.Model):
    TYPE_CHOICES = (
        ('MCQ', 'MCQ'),
        ('True/False', 'True/False'),
        ('Fill in the Blank', 'Fill in the Blank'),
        ('Coding', 'Coding'),
    )
    
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    question_text = models.TextField()
    question_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    correct_answer = models.TextField()
    explanation = models.TextField(blank=True, null=True)
    marks = models.IntegerField(default=1)
    question_order = models.IntegerField()

    def __str__(self):
        return self.question_text[:50]

class QuestionOption(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options')
    option_text = models.TextField()
    is_correct = models.BooleanField(default=False)