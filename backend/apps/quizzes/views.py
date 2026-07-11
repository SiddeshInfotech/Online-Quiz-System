from rest_framework import generics, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response
from .models import Quiz, QuizCategory
from .serializers import QuizLibrarySerializer, QuizSerializer, QuizCategorySerializer
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
    filterset_fields = ['difficulty', 'grade_level', 'category']
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
