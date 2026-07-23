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
            is_ai_generated=True,
            created_by=user,
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

                question = Question.objects.create(
                    quiz=quiz,
                    question_text=question_text,
                    question_type=q_type,
                    correct_answer=correct_answer,
                    marks=1,
                    question_order=idx + 1
                )

                if options:
                    trimmed_options = [str(opt).strip() for opt in options]
                    trimmed_correct = str(correct_answer).strip()

                    try:
                        correct_index = trimmed_options.index(trimmed_correct)
                    except ValueError:
                        lower_options = [opt.lower() for opt in trimmed_options]
                        try:
                            correct_index = lower_options.index(trimmed_correct.lower())
                        except ValueError:
                            correct_index = 0

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

        return Response({
            "success": True,
            "message": f"AI Quiz generated and saved successfully! ({quiz_mode} mode)",
            "quiz_id": quiz.id,
            "title": quiz.title,
            "total_questions": len(questions_data),
            "difficulty": difficulty,
            "subject": subject,
            "quiz_mode": quiz_mode
        }, status=status.HTTP_201_CREATED)
