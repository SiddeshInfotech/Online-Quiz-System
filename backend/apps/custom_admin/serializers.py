from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.attempts.models import QuizAttempt
from apps.quizzes.models import Quiz
from apps.custom_admin.models import UserPenaltyLog
from apps.support.models import ContactMessage

User = get_user_model()

from django.utils import timezone

class AdminUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    total_attempts = serializers.SerializerMethodField()
    penalty_count = serializers.SerializerMethodField()

    # 💳 Subscription & Tier details
    subscription_plan = serializers.SerializerMethodField()
    subscription_status = serializers.SerializerMethodField()
    is_pro = serializers.SerializerMethodField()
    billing_cycle = serializers.SerializerMethodField()
    subscription_start = serializers.SerializerMethodField()
    subscription_end = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()
    quizzes_created_today = serializers.SerializerMethodField()
    attempts_today = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name', 'total_points', 
            'xp', 'level', 'role', 'is_active', 'status', 'suspension_reason',
            'suspended_at', 'is_deleted', 'is_staff', 'is_superuser',
            'total_attempts', 'penalty_count', 'date_joined',
            'subscription_plan', 'subscription_status', 'is_pro',
            'billing_cycle', 'subscription_start', 'subscription_end',
            'days_remaining', 'quizzes_created_today', 'attempts_today'
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.full_name or obj.username or ""

    def get_total_attempts(self, obj):
        return QuizAttempt.objects.filter(user=obj).count()

    def get_penalty_count(self, obj):
        return UserPenaltyLog.objects.filter(user=obj).count()

    def get_subscription_plan(self, obj):
        sub = getattr(obj, 'subscription', None)
        if sub:
            return "PRO" if sub.is_pro else "FREE"
        return "FREE"

    def get_subscription_status(self, obj):
        sub = getattr(obj, 'subscription', None)
        if sub and sub.is_pro:
            return sub.status
        return "ACTIVE"

    def get_is_pro(self, obj):
        sub = getattr(obj, 'subscription', None)
        return sub.is_pro if sub else False

    def get_billing_cycle(self, obj):
        sub = getattr(obj, 'subscription', None)
        return (sub.billing_cycle or "MONTHLY") if sub else "FOREVER"

    def get_subscription_start(self, obj):
        sub = getattr(obj, 'subscription', None)
        return sub.start_date.isoformat() if (sub and sub.start_date) else None

    def get_subscription_end(self, obj):
        sub = getattr(obj, 'subscription', None)
        return sub.end_date.isoformat() if (sub and sub.end_date) else None

    def get_days_remaining(self, obj):
        sub = getattr(obj, 'subscription', None)
        if sub and sub.end_date:
            delta = (sub.end_date - timezone.now()).days
            return max(0, delta)
        elif sub and sub.is_pro:
            return 30
        return 365

    def get_quizzes_created_today(self, obj):
        today = timezone.localdate()
        return Quiz.objects.filter(created_by=obj, created_at__date=today).count()

    def get_attempts_today(self, obj):
        today = timezone.localdate()
        return QuizAttempt.objects.filter(user=obj, started_at__date=today).count()

class AdminQuizSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.category_name')
    created_by_name = serializers.SerializerMethodField()
    question_count = serializers.SerializerMethodField()
    questions = serializers.JSONField(required=False, write_only=False)
    created_by_label = serializers.SerializerMethodField()
    is_admin_quiz = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            'id', 'title', 'description', 'subject', 'difficulty',
            'question_type', 'visibility', 'status', 'duration_minutes',
            'total_marks', 'is_ai_generated', 'join_code', 'share_link',
            'category', 'category_name', 'created_by', 'created_by_name',
            'created_at', 'updated_at', 'grade_level', 'is_published',
            'max_attempts', 'question_count', 'questions',
            'created_by_label', 'is_admin_quiz'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'join_code', 'share_link', 'question_count']

    def get_is_admin_quiz(self, obj):
        if not obj.created_by:
            return True
        return (
            obj.is_ai_generated or
            obj.created_by.username.lower() == 'admin' or
            obj.created_by.is_superuser or
            obj.created_by.is_staff or
            getattr(obj.created_by, 'role', '') == 'Admin'
        )

    def get_created_by_label(self, obj):
        if self.get_is_admin_quiz(obj):
            return "QuizGen AI"
        if obj.created_by:
            return obj.created_by.username
        return "QuizGen AI"

    def get_created_by_name(self, obj):
        return self.get_created_by_label(obj)

    def get_question_count(self, obj):
        if hasattr(obj, 'annotated_question_count'):
            return obj.annotated_question_count or 0
        return obj.question_set.count()

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'time_limit' in data and 'duration_minutes' not in data:
            data['duration_minutes'] = data['time_limit']
        
        quiz_t = data.get('quiz_type') or data.get('question_type')
        if str(quiz_t).strip().lower() == 'coding':
            data['question_type'] = 'Coding'
        else:
            data['question_type'] = 'MCQ'

        if 'duration_minutes' not in data:
            data['duration_minutes'] = 30

        # Admin panel quizzes are always curated (not AI-generated) and published
        data.setdefault('is_ai_generated', False)
        data.setdefault('is_published', True)
        data.setdefault('status', 'published')

        if 'category' not in data or not data['category']:
            from apps.quizzes.models import QuizCategory
            cat_name = data.get('subject', 'General')
            cat, _ = QuizCategory.objects.get_or_create(category_name=cat_name)
            data['category'] = cat.id
        return super().to_internal_value(data)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['time_limit'] = instance.duration_minutes
        ret['quiz_type'] = 'Coding' if instance.question_type == 'Coding' else 'Theory'
        
        # Include heavy nested question objects list ONLY for detail view or if explicitly requested via context
        if self.context.get('include_questions', False):
            from apps.questions.models import Question
            qs = Question.objects.filter(quiz=instance).prefetch_related('options')

            questions_list = []
            for q in qs:
                options_qs = q.options.all()
                opts = [opt.option_text for opt in options_qs]
                questions_list.append({
                    "id": q.id,
                    "question_text": q.question_text,
                    "options": opts,
                    "correct_answer": q.correct_answer,
                    "question_type": q.question_type
                })
            ret['questions'] = questions_list
        else:
            ret['questions'] = []
        return ret

    def create(self, validated_data):
        from apps.questions.models import Question, QuestionOption
        questions_data = validated_data.pop('questions', None)
        quiz = super().create(validated_data)

        if questions_data and isinstance(questions_data, list):
            self._save_questions(quiz, questions_data)
        return quiz

    def update(self, instance, validated_data):
        questions_data = validated_data.pop('questions', None)
        quiz = super().update(instance, validated_data)

        if questions_data is not None and isinstance(questions_data, list):
            # Delete old questions and recreate
            quiz.question_set.all().delete()
            self._save_questions(quiz, questions_data)
        return quiz

    def _save_questions(self, quiz, questions_data):
        from apps.questions.models import Question, QuestionOption
        for idx, q_data in enumerate(questions_data):
            if not isinstance(q_data, dict):
                continue
            q_text = q_data.get('question_text', q_data.get('text', '')).strip()
            q_type = q_data.get('question_type', quiz.question_type or 'MCQ')
            correct = q_data.get('correct_answer', '').strip()
            options = q_data.get('options', [])

            question = Question.objects.create(
                quiz=quiz,
                question_text=q_text,
                question_type=q_type,
                correct_answer=correct,
                marks=1,
                question_order=idx + 1
            )

            if options and isinstance(options, list):
                for opt_idx, opt in enumerate(options):
                    opt_text = str(opt).strip()
                    QuestionOption.objects.create(
                        question=question,
                        option_text=opt_text,
                        is_correct=(opt_text.lower() == correct.lower() or (not correct and opt_idx == 0))
                    )

class UserPenaltyLogSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    student_name = serializers.SerializerMethodField()
    email = serializers.ReadOnlyField(source='user.email')
    quiz_title = serializers.SerializerMethodField()
    violations = serializers.ReadOnlyField(source='violations_count')

    class Meta:
        model = UserPenaltyLog
        fields = [
            'id', 'user', 'username', 'student_name', 'email', 'attempt', 'quiz_title',
            'violations_count', 'violations', 'points_deducted', 'reason', 'created_at'
        ]

    def get_student_name(self, obj):
        if not obj.user:
            return "Unknown User"
        return obj.user.full_name or obj.user.username or ""

    def get_quiz_title(self, obj):
        if obj.attempt and obj.attempt.quiz:
            return obj.attempt.quiz.title
        return "N/A"

class AdminSupportMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'email', 'subject', 'category', 'message', 'created_at', 'is_resolved', 'reply_message', 'replied_at']
        read_only_fields = ['name', 'email', 'subject', 'category', 'message', 'created_at']
