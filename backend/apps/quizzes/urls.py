from django.urls import path
from .views import (
    QuizListCreateView, QuizDetailView, QuizLibraryListView,
    RecommendedQuizzesListView, QuizLibraryMetaView, CategoryListView
)


urlpatterns = [
    path('', QuizListCreateView.as_view(), name='quiz-list-create'),
    path('<int:pk>/', QuizDetailView.as_view(), name='quiz-detail'),
    path('library/', QuizLibraryListView.as_view(), name='quiz-library-list'),
    path('library/recommended/', RecommendedQuizzesListView.as_view(), name='quiz-recommended-list'),
    path('library/meta/', QuizLibraryMetaView.as_view(), name='quiz-library-meta'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
]
