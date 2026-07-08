from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from .models import Quiz
from .serializers import QuizSerializer

class QuizListCreateView(generics.ListCreateAPIView):
    queryset = Quiz.objects.all().order_by('-created_at')
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class QuizDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        quiz = self.get_object()
        if quiz.created_by != self.request.user and not self.request.user.is_superuser:
            raise PermissionDenied("You are not the owner of this quiz.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.created_by != self.request.user and not self.request.user.is_superuser:
            raise PermissionDenied("You are not the owner of this quiz.")
        instance.delete()
