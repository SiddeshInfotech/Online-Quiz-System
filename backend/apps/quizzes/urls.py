from django.urls import path
from .views import (
    QuizListCreateView, QuizDetailView, QuizLibraryListView,
    RecommendedQuizzesListView, QuizLibraryMetaView, CategoryListView, QuizStartView,
    QuizSearchView
)


from apps.ai_generator.views import GenerateAIQuizView
from apps.attempts.views import StartAttemptView

urlpatterns = [
    path('generate/', GenerateAIQuizView.as_view(), name='quiz-generate-alias'),
    path('search/', QuizSearchView.as_view(), name='quiz-search'),
    path('', QuizListCreateView.as_view(), name='quiz-list-create'),
    path('<int:pk>/', QuizDetailView.as_view(), name='quiz-detail'),
    path('<int:pk>/retry/', StartAttemptView.as_view(), name='quiz-retry-alias'),
    path('library/', QuizLibraryListView.as_view(), name='quiz-library-list'),
    path('library/recommended/', RecommendedQuizzesListView.as_view(), name='quiz-recommended-list'),
    path('library/meta/', QuizLibraryMetaView.as_view(), name='quiz-library-meta'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('<int:pk>/start/', QuizStartView.as_view(), name='quiz-start'),
]
