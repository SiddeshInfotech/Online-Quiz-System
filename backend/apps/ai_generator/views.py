import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404

from .serializers import QuizGenerationPayloadSerializer
from .services import GeminiService
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
        question_type = validated_data['question_type']
        num_questions = validated_data['number_of_questions']
        prompt_topic = validated_data.get('prompt_topic', '')
        category_id = validated_data.get('category_id')

        try:
            gemini = GeminiService()
            questions_data = gemini.generate_quiz(
                subject=subject,
                difficulty=difficulty,
                question_type=question_type,
                num_questions=num_questions,
                prompt_topic=prompt_topic
            )
        except Exception as e:
            return Response({
                "error": "AI generation failed",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        category = None
        if category_id:
            category = get_object_or_404(QuizCategory, id=category_id)
        else:
            category, _ = QuizCategory.objects.get_or_create(
                category_name=subject
            )

        quiz = Quiz.objects.create(
            title=f"{subject}: {prompt_topic if prompt_topic else 'AI Generated Quiz'}",
            description=f"AI-generated quiz on {subject} - {difficulty} difficulty",
            subject=subject,
            difficulty=difficulty,
            question_type='MCQ',  
            visibility='Public',
            status='published',
            duration_minutes=num_questions * 2,  
            total_marks=num_questions,
            is_ai_generated=True,
            created_by=user,
            category=category
        )

        for idx, q_data in enumerate(questions_data):
            question_text = q_data.get('question_text', '')
            options = q_data.get('options', [])
            correct_answer_index = q_data.get('correct_answer', 0)

            if not options:
                continue

            q_type = 'MCQ'
            if len(options) == 2 and options == ['True', 'False']:
                q_type = 'True/False'
            elif question_type == 'Coding':
                q_type = 'MCQ'  

            question = Question.objects.create(
                quiz=quiz,
                question_text=question_text,
                question_type=q_type,
                correct_answer=options[correct_answer_index] if correct_answer_index < len(options) else options[0],
                marks=1,
                question_order=idx + 1
            )

            for opt_idx, option_text in enumerate(options):
                QuestionOption.objects.create(
                    question=question,
                    option_text=option_text,
                    is_correct=(opt_idx == correct_answer_index)
                )

        return Response({
            "success": True,
            "message": "AI Quiz generated and saved successfully!",
            "quiz_id": quiz.id,
            "title": quiz.title,
            "total_questions": num_questions,
            "difficulty": difficulty,
            "subject": subject
        }, status=status.HTTP_201_CREATED)
