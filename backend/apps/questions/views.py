from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Question
from .serializers import QuestionSerializer
from apps.quizzes.models import Quiz

class QuestionListCreateView(generics.ListCreateAPIView):
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        quiz_id = self.kwargs.get('quiz_id')
        if quiz_id:
            return Question.objects.filter(quiz_id=quiz_id).order_by('question_order')
        return Question.objects.none()  # Saare questions nahi dikhane, quiz wise hi dikhayenge

    def perform_create(self, serializer):
        quiz_id = self.kwargs.get('quiz_id')
        quiz = Quiz.objects.get(id=quiz_id)  # Validate quiz exists
        serializer.save(quiz=quiz)

class QuestionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated]