from django.contrib import admin
from .models import Question, QuestionOption

admin.site.register(Question)
admin.site.register(QuestionOption)