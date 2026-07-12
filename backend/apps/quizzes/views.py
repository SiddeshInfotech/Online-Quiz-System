from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response
from .models import Quiz, QuizCategory
from .serializers import QuizLibrarySerializer, QuizSerializer, QuizCategorySerializer
from apps.attempts.models import QuizAttempt
from apps.questions.serializers import QuestionSerializer
from django.db.models import Count
from rest_framework import status

class CategoryListView(generics.ListAPIView):
    queryset = QuizCategory.objects.all().order_by('category_name')
    serializer_class = QuizCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

class QuizLibraryListView(generics.ListAPIView):
    serializer_class = QuizLibrarySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['difficulty', 'grade_level', 'subject']
    search_fields = ['title', 'subject', 'description']
    ordering_fields = ['created_at', 'title', 'duration_minutes']
    ordering = ['-created_at']

    def get_queryset(self):
        return Quiz.objects.filter(status='published')

class RecommendedQuizzesListView(generics.ListAPIView):
    serializer_class = QuizLibrarySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        user_grade = user.grade_level if hasattr(user, 'grade_level') else None
        
        queryset = Quiz.objects.filter(status='published')
        if user_grade:
            return queryset.filter(grade_level=user_grade)[:5]
        return queryset.order_by('?')[:5]

class QuizLibraryMetaView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        total_quizzes = Quiz.objects.filter(status='published').count()
        total_categories = QuizCategory.objects.filter(
            quiz__status='published'
        ).distinct().count()
        
        return Response({
            "total_quizzes": total_quizzes,
            "total_categories": total_categories,
            "message": f"Explore {total_quizzes}+ quizzes across {total_categories}+ categories"
        })

class QuizListCreateView(generics.ListCreateAPIView):
    queryset = Quiz.objects.all().order_by('-created_at')
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        return Response(
            {"error": "Manual quiz creation is disabled. Please use the AI Generator."},
            status=status.HTTP_403_FORBIDDEN
        )

    def perform_create(self, serializer):
        pass


class QuizDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        quiz = self.get_object()
        if quiz.created_by != self.request.user and not self.request.user.is_superuser:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You are not the owner of this quiz.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.created_by != self.request.user and not self.request.user.is_superuser:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You are not the owner of this quiz.")
        instance.delete()

class QuizStartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, quiz_id):
        quiz = get_object_or_404(Quiz, id=quiz_id, status='published')
        user = request.user

        existing_attempt = QuizAttempt.objects.filter(
            user=user, quiz=quiz, submitted_at__isnull=True
        ).first()

        if existing_attempt:
            attempt = existing_attempt
        else:
            attempt = QuizAttempt.objects.create(
                quiz=quiz,
                user=user,
                started_at=timezone.now()
            )

        if attempt.started_at:
            elapsed = (timezone.now() - attempt.started_at).total_seconds()
            remaining = max(0, (quiz.duration_minutes * 60) - elapsed)
        else:
            remaining = quiz.duration_minutes * 60

        questions = quiz.question_set.all().order_by('question_order')
        question_data = QuestionSerializer(questions, many=True).data

        return Response({
            "attempt_id": attempt.id,
            "quiz": {
                "id": quiz.id,
                "title": quiz.title,
                "description": quiz.description or "",
                "difficulty": quiz.difficulty,
                "time_limit_minutes": quiz.duration_minutes,
                "total_questions": questions.count()
            },
            "questions": question_data,
            "remaining_time_seconds": int(remaining),
            "started_at": attempt.started_at
        }, status=status.HTTP_200_OK)

