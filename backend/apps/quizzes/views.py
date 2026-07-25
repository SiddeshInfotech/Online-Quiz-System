from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response
from django.db.models import Q, Count
from rest_framework import status
from .models import Quiz, QuizCategory
from .serializers import QuizLibrarySerializer, QuizSerializer, QuizCategorySerializer
from apps.attempts.models import QuizAttempt
from apps.questions.serializers import QuestionSerializer, AttemptQuestionSerializer


def apply_quiz_filters(queryset, request):
    """
    Applies dynamic multi-field filtering and search to Quiz querysets:
    - created_by_me / filter=my_quizzes
    - subject (ID, name, category_name)
    - difficulty (EASY, MEDIUM, HARD, etc. or comma-separated)
    - quiz_mode (TIMED, PRACTICE, THEORY, CODING, etc. or comma-separated)
    - search / q (case-insensitive search on title and description)
    - grade_level
    """
    params = request.query_params
    user = request.user if request and hasattr(request, 'user') else None

    # 1. Base filter: created_by_me vs published
    created_by_me = (
        params.get('created_by_me', '').lower() == 'true' or
        params.get('filter', '').lower() == 'my_quizzes'
    )
    if created_by_me and user and user.is_authenticated:
        queryset = queryset.filter(created_by=user)
    elif 'status' in params:
        queryset = queryset.filter(status=params.get('status'))
    else:
        if not created_by_me:
            queryset = queryset.filter(status='published')

    # 2. Subject filter (subject ID, name, category, or topic)
    subject_val = params.get('subject', '').strip()
    if subject_val:
        if subject_val.isdigit():
            queryset = queryset.filter(
                Q(subject__iexact=subject_val) |
                Q(category__id=int(subject_val)) |
                Q(category__category_name__icontains=subject_val)
            )
        else:
            queryset = queryset.filter(
                Q(subject__icontains=subject_val) |
                Q(category__category_name__icontains=subject_val) |
                Q(topic__icontains=subject_val)
            )

    # 3. Difficulty filter (EASY, MEDIUM, HARD, or comma-separated)
    diff_val = params.get('difficulty', '').strip()
    if diff_val:
        diff_items = [d.strip() for d in diff_val.split(',') if d.strip()]
        if diff_items:
            diff_q = Q()
            for d in diff_items:
                diff_q |= Q(difficulty__iexact=d)
            queryset = queryset.filter(diff_q)

    # 4. Quiz mode filter (TIMED, PRACTICE, THEORY, CODING, etc.)
    mode_val = params.get('quiz_mode', '').strip() or params.get('mode', '').strip()
    if mode_val:
        mode_items = [m.strip() for m in mode_val.split(',') if m.strip()]
        if mode_items:
            mode_q = Q()
            for m in mode_items:
                m_upper = m.upper()
                if m_upper == 'TIMED':
                    mode_q |= Q(duration_minutes__gt=0)
                elif m_upper == 'PRACTICE':
                    mode_q |= Q(duration_minutes=0)
                elif m.lower() == 'theory':
                    mode_q |= Q(question_type__iexact='MCQ')
                elif m.lower() == 'coding':
                    mode_q |= Q(question_type__iexact='Coding')
                else:
                    mode_q |= Q(question_type__icontains=m) | Q(description__icontains=m)
            queryset = queryset.filter(mode_q)

    # 5. Search filter (case-insensitive search on title and description)
    search_val = params.get('search', '').strip() or params.get('q', '').strip()
    if search_val:
        queryset = queryset.filter(
            Q(title__icontains=search_val) |
            Q(description__icontains=search_val) |
            Q(subject__icontains=search_val) |
            Q(topic__icontains=search_val)
        )

    # 6. Grade level
    grade_val = params.get('grade_level', '').strip()
    if grade_val:
        queryset = queryset.filter(grade_level__iexact=grade_val)

    # Ordering
    ordering = params.get('ordering', '').strip()
    if ordering and ordering in ['created_at', '-created_at', 'title', '-title', 'duration_minutes', '-duration_minutes']:
        queryset = queryset.order_by(ordering)
    else:
        queryset = queryset.order_by('-created_at')

    return queryset.distinct()


class CategoryListView(generics.ListAPIView):
    queryset = QuizCategory.objects.all().order_by('category_name')
    serializer_class = QuizCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

class QuizLibraryListView(generics.ListAPIView):
    serializer_class = QuizLibrarySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = apply_quiz_filters(Quiz.objects.all(), self.request).select_related('category', 'created_by')
        
        # Enforce Library Visibility rules:
        # A normal user MUST see:
        # 1. Quizzes created by themselves (created_by = user)
        # 2. Quizzes created by an Admin/Staff user (is_staff=True or role='Admin')
        if not user.is_staff and getattr(user, 'role', '') != 'Admin':
            queryset = queryset.filter(
                Q(created_by=user) |
                Q(created_by__is_staff=True) |
                Q(created_by__role='Admin')
            )

        from django.db.models import OuterRef, Subquery, Count
        
        latest_attempt = QuizAttempt.objects.filter(
            user=user,
            quiz=OuterRef('pk'),
            submitted_at__isnull=False
        ).order_by('-submitted_at')
        
        return queryset.annotate(
            annotated_progress=Subquery(latest_attempt.values('percentage')[:1]),
            annotated_total_questions=Count('question', distinct=True)
        )

class RecommendedQuizzesListView(generics.ListAPIView):
    serializer_class = QuizLibrarySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        user_grade = user.grade_level if hasattr(user, 'grade_level') else None
        
        queryset = Quiz.objects.filter(Q(status='published') | Q(is_published=True)).select_related('category', 'created_by')
        if not user.is_staff and getattr(user, 'role', '') != 'Admin':
            queryset = queryset.filter(
                Q(created_by=user) |
                Q(created_by__is_staff=True) |
                Q(created_by__role='Admin')
            )

        from django.db.models import OuterRef, Subquery, Count
        
        latest_attempt = QuizAttempt.objects.filter(
            user=user,
            quiz=OuterRef('pk'),
            submitted_at__isnull=False
        ).order_by('-submitted_at')
        
        queryset = queryset.annotate(
            annotated_progress=Subquery(latest_attempt.values('percentage')[:1]),
            annotated_total_questions=Count('question', distinct=True)
        )
        
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
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = apply_quiz_filters(Quiz.objects.all(), self.request).select_related('category', 'created_by')
        from django.db.models import Count
        return queryset.annotate(
            annotated_total_questions=Count('question', distinct=True)
        )

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
    """
    DEPRECATED: This view is deprecated in favor of StartAttemptView located in apps.attempts.views.
    
    Deprecation instructions:
    - Frontend clients must migrate to POST /api/attempts/start/ with JSON payload {"quiz_id": <id>}.
    - This view lacks advanced features like automatic expiration of previous, stale attempts that have exceeded the quiz's duration.
    - StartAttemptView correctly manages attempt lifecycle, auto-submits expired attempts, and handles multi-session states.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):  
        import warnings
        warnings.warn(
            "QuizStartView (/api/quizzes/<id>/start/) is deprecated. Use /api/attempts/start/ instead.",
            DeprecationWarning,
            stacklevel=2
        )

        quiz = get_object_or_404(Quiz, id=pk, status='published')
        user = request.user

        completed_attempts_count = QuizAttempt.objects.filter(
            user=user,
            quiz=quiz,
            submitted_at__isnull=False
        ).count()
        max_attempts = getattr(quiz, 'max_attempts', 2) or 2
        can_retry = completed_attempts_count < max_attempts

        existing_attempt = QuizAttempt.objects.filter(
            user=user, quiz=quiz, submitted_at__isnull=True
        ).first()

        if not existing_attempt and not can_retry:
            return Response(
                {
                    "detail": f"Maximum attempt limit ({max_attempts}) reached for this quiz.",
                    "error": "Attempt limit reached.",
                    "can_retry": False,
                    "attempt_count": completed_attempts_count,
                    "max_attempts": max_attempts,
                },
                status=status.HTTP_403_FORBIDDEN
            )

        if existing_attempt:
            attempt = existing_attempt
        else:
            attempt = QuizAttempt.objects.create(
                quiz=quiz,
                user=user,
                started_at=timezone.now()
            )

        elapsed = (timezone.now() - attempt.started_at).total_seconds()
        remaining = max(0, (quiz.duration_minutes * 60) - elapsed)

        questions = quiz.question_set.all().prefetch_related('options').order_by('question_order', 'id')
        question_data = AttemptQuestionSerializer(questions, many=True).data

        return Response({
            "attempt_id": attempt.id,
            "quiz_title": quiz.title,
            "started_at": attempt.started_at,
            "duration_minutes": quiz.duration_minutes,
            "timer": int(remaining),
            "remaining_time_seconds": int(remaining),
            "can_retry": can_retry,
            "attempt_count": completed_attempts_count,
            "max_attempts": max_attempts,
            "quiz": {
                "id": quiz.id,
                "quiz_id": quiz.id,
                "title": quiz.title,
                "description": quiz.description or "",
                "difficulty": quiz.difficulty,
                "duration_minutes": quiz.duration_minutes,
                "time_limit_minutes": quiz.duration_minutes,
                "total_questions": questions.count(),
                "max_attempts": max_attempts,
                "can_retry": can_retry,
                "attempt_count": completed_attempts_count,
            },
            "questions": question_data,
        }, status=status.HTTP_200_OK)


from django.db.models import Q

class QuizSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response({
                "status": "success",
                "results_count": 0,
                "data": []
            }, status=status.HTTP_200_OK)

        quizzes = Quiz.objects.filter(
            Q(title__icontains=query) |
            Q(subject__icontains=query) |
            Q(topic__icontains=query),
            status='published'
        )

        results = []
        for quiz in quizzes:
            results.append({
                "quiz_id": quiz.id,
                "title": quiz.title,
                "subject": quiz.subject or "",
                "topic": quiz.topic or "",
                "start_page_url": f"/quiz/start/{quiz.id}/"
            })

        return Response({
            "status": "success",
            "results_count": len(results),
            "data": results
        }, status=status.HTTP_200_OK)


