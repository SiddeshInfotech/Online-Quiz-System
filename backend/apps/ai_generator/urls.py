from django.urls import path
from .views import GenerateAIQuizView

urlpatterns = [
    path('generate-quiz/', GenerateAIQuizView.as_view(), name='generate-ai-quiz'),
]