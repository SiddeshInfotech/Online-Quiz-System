import json
import hashlib
import traceback
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.core.cache import cache

from .serializers import QuizGenerationPayloadSerializer
from .services import AIService
from apps.quizzes.models import Quiz, QuizCategory
from apps.questions.models import Question, QuestionOption


class GenerateAIQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = QuizGenerationPayloadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "error": "Validation failed",
                "details": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data

        user = request.user
        subject = validated_data['subject']
        difficulty = validated_data['difficulty']
        num_questions = validated_data['number_of_questions']
        prompt_topic = validated_data.get('prompt_topic', '')
        category_id = validated_data.get('category_id')
        quiz_mode = validated_data.get('quiz_mode', 'Theory')

        # Premium Feature Protection Checks
        from apps.users.models import Subscription
        from django.utils import timezone
        sub, _ = Subscription.objects.get_or_create(user=user)
        is_pro = sub.is_pro

        # 1. Question count choice restriction for Free tier (Only 5 or 10)
        if not is_pro and num_questions > 10:
            return Response({
                "code": "PREMIUM_REQUIRED",
                "detail": "Generating 15, 20, or 25 questions per quiz is a Pro feature. Upgrade to QuizGen Pro to unlock!",
                "message": "Generating 15, 20, or 25 questions per quiz is a Pro feature. Upgrade to QuizGen Pro to unlock!",
                "upgrade_url": "/pricing"
            }, status=status.HTTP_403_FORBIDDEN)

        # 2. Daily Quiz Generation limit check (Free = 3/day, Pro = 10/day)
        today = timezone.localdate()
        today_creations = Quiz.objects.filter(
            created_by=user,
            created_at__date=today
        ).count()

        max_daily = 10 if is_pro else 3
        if today_creations >= max_daily:
            return Response({
                "code": "PREMIUM_REQUIRED",
                "detail": f"Daily quiz limit reached ({max_daily}/day). Upgrade to QuizGen Pro for 10 quizzes/day.",
                "message": f"Daily quiz limit reached ({max_daily}/day). Upgrade to QuizGen Pro for 10 quizzes/day.",
                "upgrade_url": "/pricing"
            }, status=status.HTTP_403_FORBIDDEN)

        # Check cache for identical AI generation requests
        cache_hash = hashlib.md5(f"{subject}_{difficulty}_{num_questions}_{prompt_topic}_{quiz_mode}".encode('utf-8')).hexdigest()
        cache_key = f"ai_gen_quiz_{cache_hash}"
        cached_result = cache.get(cache_key)

        if cached_result:
            quiz_title = cached_result.get("quiz_title", "").strip()
            questions_data = cached_result.get("questions", [])
        else:
            try:
                ai_service = AIService()
                generation_result = ai_service.generate_quiz(
                    subject=subject,
                    difficulty=difficulty,
                    num_questions=num_questions,
                    prompt_topic=prompt_topic,
                    quiz_mode=quiz_mode
                )
                quiz_title = generation_result.get("quiz_title", "").strip()
                questions_data = generation_result.get("questions", [])
                cache.set(cache_key, generation_result, 600)
            except ValueError as e:
                return Response({
                    "error": str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({
                    "error": "AI generation failed",
                    "details": str(e),
                    "traceback": traceback.format_exc()
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        category = None
        if category_id:
            category = get_object_or_404(QuizCategory, id=category_id)
        else:
            category, _ = QuizCategory.objects.get_or_create(
                category_name=subject
            )

        if not quiz_title:
            quiz_title = f"{subject}: {prompt_topic if prompt_topic else 'AI Generated Quiz'}"
            
        quiz_description = f"AI-generated {quiz_mode} quiz on {subject} - {difficulty} difficulty"

        referer = request.META.get('HTTP_REFERER', '') or request.headers.get('Referer', '')
        is_from_admin = bool(
            request.data.get('is_admin') or
            request.data.get('is_admin_quiz') or
            request.data.get('from_admin') or
            'custom_admin' in request.path or
            'admin' in request.path or
            user.is_superuser or
            user.is_staff or
            getattr(user, 'role', '') == 'Admin' or
            user.username.lower() == 'admin'
        )

        from apps.users.models import User as UserModel
        from django.db.models import Q
        admin_user = UserModel.objects.filter(
            Q(username__iexact='admin') | Q(is_superuser=True)
        ).first()

        if is_from_admin:
            quiz_creator = admin_user or user
            is_ai_flag = True
        else:
            quiz_creator = user
            is_ai_flag = True

        quiz = Quiz.objects.create(
            title=quiz_title,
            description=quiz_description,
            subject=subject,
            topic=prompt_topic,
            difficulty=difficulty,
            question_type='MCQ' if quiz_mode == 'Theory' else 'Coding',
            visibility='Public',
            status='published',
            duration_minutes=num_questions * 2,
            total_marks=num_questions,
            is_ai_generated=is_ai_flag,
            created_by=quiz_creator,
            category=category
        )

        # Create questions and bulk-insert options atomically with guaranteed PKs
        from django.db import transaction

        options_to_create = []
        with transaction.atomic():
            for idx, q_data in enumerate(questions_data):
                q_type = q_data.get('question_type', 'MCQ')
                question_text = q_data.get('question_text', '').strip()
                options = q_data.get('options', [])
                correct_answer = q_data.get('correct_answer', '').strip()
                explanation_text = q_data.get('explanation', '').strip()

                from apps.questions.serializers import clean_quiz_text
                trimmed_correct = clean_quiz_text(str(correct_answer)).strip()

                trimmed_options = []
                if options:
                    seen_opts = set()
                    for opt in options:
                        clean_opt = clean_quiz_text(str(opt)).strip()
                        if clean_opt and clean_opt not in seen_opts:
                            seen_opts.add(clean_opt)
                            trimmed_options.append(clean_opt)

                    if len(trimmed_options) > 4:
                        trimmed_options = trimmed_options[:4]

                    # 🛡️ GUARANTEE: Ensure correct_answer is ALWAYS in trimmed_options!
                    has_correct = any(opt == trimmed_correct for opt in trimmed_options)
                    if not has_correct and trimmed_correct:
                        if len(trimmed_options) >= 4:
                            trimmed_options[0] = trimmed_correct
                        else:
                            trimmed_options.append(trimmed_correct)

                    try:
                        correct_index = [opt for opt in trimmed_options].index(trimmed_correct)
                    except ValueError:
                        correct_index = 0
                        trimmed_options[0] = trimmed_correct

                    final_correct_text = trimmed_options[correct_index]
                else:
                    final_correct_text = trimmed_correct
                    correct_index = 0
                    trimmed_options = [trimmed_correct]

                # 🛡️ GUARANTEE STRICTLY 4 OPTIONS FOR EVERY QUESTION!
                fallback_distractors = ["TypeError", "AttributeError", "SyntaxError", "None", "Compilation Error", "Undefined Behavior", "0", "1"]
                seen_set = set(trimmed_options)
                for dist in fallback_distractors:
                    if len(trimmed_options) >= 4:
                        break
                    if dist not in seen_set:
                        trimmed_options.append(dist)
                        seen_set.add(dist)

                # Format code snippet in question_text if unformatted
                if ("print(" in question_text or "cout" in question_text or "System.out" in question_text or "def " in question_text or "class " in question_text or "int main" in question_text) and "```" not in question_text:
                    parts = question_text.rsplit(':', 1)
                    if len(parts) == 2 and ("code" in parts[0].lower() or "output" in parts[0].lower() or "print" in parts[1].lower()):
                        stem = parts[0].strip() + ":"
                        snippet = parts[1].strip().rstrip('?')
                        lang = "python"
                        subj_lower = str(subject).lower()
                        if "c++" in subj_lower or "cpp" in subj_lower:
                            lang = "cpp"
                        elif "java" in subj_lower:
                            lang = "java"
                        question_text = f"{stem}\n\n```{lang}\n{snippet}\n```"

                question = Question.objects.create(
                    quiz=quiz,
                    question_text=question_text,
                    question_type=q_type,
                    correct_answer=final_correct_text,
                    explanation=explanation_text,
                    marks=1,
                    question_order=idx + 1
                )

                for opt_idx, opt_text in enumerate(trimmed_options):
                    options_to_create.append(
                        QuestionOption(
                            question=question,
                            option_text=opt_text,
                            is_correct=(opt_idx == correct_index)
                        )
                    )

            if options_to_create:
                QuestionOption.objects.bulk_create(options_to_create)

        cache.delete("admin_analytics_summary")

        # Construct questions list matching frontend specifications
        formatted_questions = []
        for q in quiz.question_set.prefetch_related('options').all():
            formatted_questions.append({
                "id": q.id,
                "question_text": q.question_text,
                "options": [opt.option_text for opt in q.options.all()],
                "correct_answer": q.correct_answer,
                "question_type": q.question_type
            })

        return Response({
            "success": True,
            "message": f"AI Quiz generated and saved successfully! ({quiz_mode} mode)",
            "quiz_id": quiz.id,
            "id": quiz.id,
            "title": quiz.title,
            "total_questions": len(formatted_questions),
            "difficulty": difficulty,
            "subject": subject,
            "quiz_mode": quiz_mode,
            "questions": formatted_questions
        }, status=status.HTTP_200_OK)
