from django.db import models
from django.conf import settings
from apps.quizzes.models import Quiz
from apps.questions.models import Question, QuestionOption

class QuizAttempt(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    score = models.IntegerField(default=0)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    time_taken = models.TimeField(null=True, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    time_spent_seconds = models.IntegerField(default=0)
    tab_switch_count = models.IntegerField(default=0)
    is_auto_submitted = models.BooleanField(default=False)
    class Meta:
        indexes = [
            models.Index(fields=['user', 'submitted_at']),
            models.Index(fields=['quiz', 'submitted_at']),
        ]

class UserAnswer(models.Model):
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_option = models.ForeignKey(QuestionOption, on_delete=models.SET_NULL, null=True, blank=True)
    answer_text = models.TextField(null=True, blank=True)
    is_correct = models.BooleanField(null=True, blank=True)
    marks_obtained = models.IntegerField(default=0)
    marked_for_review = models.BooleanField(default=False)
    reviewed = models.BooleanField(default=False)

class Result(models.Model):
    attempt = models.OneToOneField(QuizAttempt, on_delete=models.CASCADE)
    correct_answers = models.IntegerField(default=0)
    wrong_answers = models.IntegerField(default=0)
    unanswered_questions = models.IntegerField(default=0)
    total_score = models.IntegerField(default=0)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    grade = models.CharField(max_length=5, null=True, blank=True)
    pass_status = models.BooleanField(default=False)
    generated_at = models.DateTimeField(auto_now_add=True)