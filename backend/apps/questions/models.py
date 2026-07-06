from django.db import models
from apps.quizzes.models import Quiz

class Question(models.Model):
    TYPE = (('MCQ','MCQ'),('True/False','True/False'),('Fill in the Blank','Fill in the Blank'))
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    question_text = models.TextField()
    question_type = models.CharField(max_length=50, choices=TYPE)
    correct_answer = models.TextField()
    marks = models.IntegerField(default=1)
    question_order = models.IntegerField()

    def __str__(self):
        return self.question_text[:50]

class QuestionOption(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    option_text = models.TextField()
    is_correct = models.BooleanField(default=False)