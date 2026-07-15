import json
import traceback
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404

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

        try:
            ai_service = AIService()
            questions_data = ai_service.generate_quiz(
                subject=subject,
                difficulty=difficulty,
                num_questions=num_questions,
                prompt_topic=prompt_topic,
                quiz_mode=quiz_mode
            )
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

        quiz_title = f"{subject}: {prompt_topic if prompt_topic else 'AI Generated Quiz'}"
        quiz_description = f"AI-generated {quiz_mode} quiz on {subject} - {difficulty} difficulty"

        quiz = Quiz.objects.create(
            title=quiz_title,
            description=quiz_description,
            subject=subject,
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

            if q_type in ['MCQ', 'True/False', 'Fill in the Blank', 'Coding'] and options:
                trimmed_options = [opt.strip() for opt in options]
                trimmed_correct = correct_answer.strip()
    
    
                try:
                    correct_index = trimmed_options.index(trimmed_correct)
                except ValueError:
                    lower_options = [opt.lower() for opt in trimmed_options]
                    try:
                        correct_index = lower_options.index(trimmed_correct.lower())
                    except ValueError:
                        correct_index = 0
                        print(f"⚠️ WARNING: correct_answer '{trimmed_correct}' not found in options {trimmed_options}, defaulting to index 0")
                
                for opt_idx, opt_text in enumerate(trimmed_options):
                    QuestionOption.objects.create(
                        question=question,
                        option_text=opt_text,
                        is_correct=(opt_idx == correct_index)
                    )

        return Response({
            "success": True,
            "message": f"AI Quiz generated and saved successfully! ({quiz_mode} mode)",
            "quiz_id": quiz.id,
            "title": quiz.title,
            "total_questions": num_questions,
            "difficulty": difficulty,
            "subject": subject,
            "quiz_mode": quiz_mode
        }, status=status.HTTP_201_CREATED)
