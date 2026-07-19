from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from datetime import datetime
from .models import QuizAttempt, UserAnswer, Result
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Max, Count
from .serializers import StartAttemptSerializer, SubmitAnswerSerializer, AttemptSerializer, ResultSerializer
from apps.quizzes.models import Quiz
from apps.questions.models import Question, QuestionOption
from apps.questions.serializers import QuestionSerializer
from django.shortcuts import get_object_or_404
from apps.questions.serializers import AttemptQuestionSerializer
from apps.ai_generator.services import AIService

class StartAttemptView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = StartAttemptSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        quiz_id = serializer.validated_data['quiz_id']

        try:
            quiz = Quiz.objects.get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response(
                {"error": "Quiz not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if quiz.status != 'published':
            return Response(
                {"error": "This quiz is not published yet."},
                status=status.HTTP_403_FORBIDDEN
            )

        existing_attempt = QuizAttempt.objects.filter(
            user=request.user,
            quiz=quiz,
            submitted_at__isnull=True
        ).first()

        if existing_attempt:

            elapsed = (
                timezone.now() - existing_attempt.started_at
            ).total_seconds() / 60

            if elapsed > quiz.duration_minutes:

                existing_attempt.submitted_at = (
                    existing_attempt.started_at +
                    timezone.timedelta(minutes=quiz.duration_minutes)
                )
                existing_attempt.score = 0
                existing_attempt.percentage = 0
                existing_attempt.save()

                # Create result if it doesn't exist
                Result.objects.get_or_create(
                    attempt=existing_attempt,
                    defaults={
                        "correct_answers": 0,
                        "wrong_answers": 0,
                        "unanswered_questions": 0,
                        "total_score": 0,
                        "percentage": 0,
                        "grade": "F",
                        "pass_status": False,
                    },
                )

                attempt = QuizAttempt.objects.create(
                    quiz=quiz,
                    user=request.user,
                    started_at=timezone.now()
                )

                return Response(
                    {
                        "message": "Previous attempt expired. New attempt started.",
                        "attempt_id": attempt.id,
                        "quiz_title": quiz.title,
                        "started_at": attempt.started_at,
                        "duration_minutes": quiz.duration_minutes,
                    },
                    status=status.HTTP_201_CREATED
                )


            return Response(
                {
                    "message": "You already have an in-progress attempt.",
                    "attempt_id": existing_attempt.id,
                    "started_at": existing_attempt.started_at,
                    "duration_minutes": quiz.duration_minutes,
                },
                status=status.HTTP_200_OK
            )

        attempt = QuizAttempt.objects.create(
            quiz=quiz,
            user=request.user,
            started_at=timezone.now()
        )

        return Response(
            {
                "message": "Quiz attempt started successfully.",
                "attempt_id": attempt.id,
                "quiz_title": quiz.title,
                "started_at": attempt.started_at,
                "duration_minutes": quiz.duration_minutes,
            },
            status=status.HTTP_201_CREATED
        )

class SubmitAttemptView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, attempt_id):
        import time
        from django.db import transaction
        from django.core.cache import cache

        start_time = time.time()

        try:
            attempt = QuizAttempt.objects.get(id=attempt_id, user=request.user, submitted_at__isnull=True)
        except QuizAttempt.DoesNotExist:
            return Response({"error": "Attempt not found or already submitted."}, status=status.HTTP_404_NOT_FOUND)

        quiz = attempt.quiz

        # ✅ OPTIMIZATION 1: Fetch all questions and options in ONE query
        questions = Question.objects.filter(quiz=quiz).prefetch_related('questionoption_set')
        question_map = {q.id: q for q in questions}
        option_map = {}
        for q in questions:
            for opt in q.questionoption_set.all():
                option_map[opt.id] = opt

        # ✅ OPTIMIZATION 2: Delete old answers
        UserAnswer.objects.filter(attempt=attempt).delete()

        # Parse answers
        answers_data = request.data.get('answers', [])
        if isinstance(answers_data, dict):
            answers_data = [
                {"question_id": int(q_id), "selected_option_id": opt_id}
                for q_id, opt_id in answers_data.items()
            ]

        # ✅ OPTIMIZATION 3: Process in memory
        user_answers_to_create = []
        correct_count = 0
        wrong_count = 0
        total_score = 0
        total_marks = 0
        answered_question_ids = set()

        for answer_data in answers_data:
            question_id = answer_data.get('question_id')
            selected_option_id = answer_data.get('selected_option_id')

            question = question_map.get(question_id)
            if not question:
                continue

            # Skip duplicate submissions for the same question
            if question_id in answered_question_ids:
                continue

            is_correct = False
            marks_obtained = 0

            # MCQ / True/False -- only counts as "answered" if an option was chosen
            if selected_option_id:
                answered_question_ids.add(question_id)
                option = option_map.get(selected_option_id)
                if option and option.question_id == question_id:
                    is_correct = option.is_correct
                    marks_obtained = question.marks if is_correct else 0

                if is_correct:
                    correct_count += 1
                else:
                    wrong_count += 1

                total_marks += question.marks
                total_score += marks_obtained
            else:
                # Selected nothing -> treated as unanswered below, skip
                continue

            user_answers_to_create.append(
                UserAnswer(
                    attempt=attempt,
                    question=question,
                    selected_option_id=selected_option_id,
                    is_correct=is_correct,
                    marks_obtained=marks_obtained
                )
            )

        # Mark unanswered
        for q in questions:
            if q.id not in answered_question_ids:
                total_marks += q.marks
                user_answers_to_create.append(
                    UserAnswer(
                        attempt=attempt,
                        question=q,
                        is_correct=False,
                        marks_obtained=0
                    )
                )

        total_questions = questions.count()
        answered_count = len(answered_question_ids)
        unanswered_count = total_questions - answered_count
        percentage = round((total_score / total_marks * 100), 2) if total_marks > 0 else 0

        # ✅ OPTIMIZATION 4: Bulk insert
        with transaction.atomic():
            UserAnswer.objects.bulk_create(user_answers_to_create)

            # Update attempt
            attempt.submitted_at = timezone.now()
            attempt.score = total_score
            attempt.percentage = percentage
            attempt.save()

            # Create/replace Result (idempotent so re-submits don't error)
            Result.objects.update_or_create(
                attempt=attempt,
                defaults={
                    "correct_answers": correct_count,
                    "wrong_answers": wrong_count,
                    "unanswered_questions": unanswered_count,
                    "total_score": total_score,
                    "percentage": percentage,
                    "grade": self._calculate_grade(percentage),
                    "pass_status": percentage >= 40,
                },
            )

        # ✅ OPTIMIZATION 5: Minified response
        elapsed_ms = int((time.time() - start_time) * 1000)
        print(f"✅ Quiz submitted in {elapsed_ms}ms")

        return Response({
            "status": "success",
            "attempt_id": attempt.id,
            "message": "Quiz submitted successfully! Fetch result from /api/attempts/{attempt_id}/result/"
        }, status=status.HTTP_200_OK)

    def _calculate_grade(self, percentage):
        if percentage >= 90:
            return "A+"
        elif percentage >= 80:
            return "A"
        elif percentage >= 70:
            return "B"
        elif percentage >= 60:
            return "C"
        elif percentage >= 40:
            return "D"
        else:
            return "F"

class UserAttemptsHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        attempts_qs = QuizAttempt.objects.filter(
            user=user, 
            submitted_at__isnull=False
        ).order_by('-submitted_at')

        total_attempts = attempts_qs.count()
        avg_score = attempts_qs.aggregate(Avg('percentage'))['percentage__avg'] or 0
        best_score = attempts_qs.aggregate(Max('percentage'))['percentage__max'] or 0

        passed_count = attempts_qs.filter(percentage__gte=50).count()
        success_rate = round((passed_count / total_attempts * 100), 2) if total_attempts > 0 else 0

        # Implement limit-offset pagination
        try:
            limit = int(request.query_params.get('limit', 20))
        except (ValueError, TypeError):
            limit = 20

        try:
            offset = int(request.query_params.get('offset', 0))
        except (ValueError, TypeError):
            offset = 0

        # Ensure pagination parameters are reasonable
        limit = max(1, min(limit, 100))
        offset = max(0, offset)

        # Optimization: Fetch only the requested page of attempts and join related models in a single query
        paginated_qs = attempts_qs.select_related('quiz', 'quiz__category', 'result')[offset:offset + limit]

        history_list = []
        for attempt in paginated_qs:
            result = getattr(attempt, 'result', None)
            correct_answers = result.correct_answers if result else 0
            wrong_answers = result.wrong_answers if result else 0
            unanswered = result.unanswered_questions if result else 0
            total_questions = correct_answers + wrong_answers + unanswered

            history_list.append({
                "id": attempt.id,
                "quiz_id": attempt.quiz.id,  
                "quiz_title": attempt.quiz.title,
                "category": attempt.quiz.category.category_name if attempt.quiz.category else "Uncategorized",
                "difficulty_level": attempt.quiz.difficulty,
                "date": attempt.submitted_at.strftime("%Y-%m-%d %H:%M"),
                "correct_count": correct_answers,
                "total_questions": total_questions,
                "time_spent_seconds": attempt.time_spent_seconds or 0,
                "score": attempt.percentage,
                "status": "Passed" if attempt.percentage >= 50 else "Failed"
            })

        return Response({
            "stats": {
                "total_attempts": total_attempts,
                "average_score": round(avg_score, 2),
                "best_score": round(best_score, 2),
                "success_rate": success_rate
            },
            "attempts": history_list,
            "pagination": {
                "total": total_attempts,
                "limit": limit,
                "offset": offset,
                "has_next": offset + limit < total_attempts,
                "has_prev": offset > 0
            }
        })

class AttemptDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):   
        try:
            attempt = QuizAttempt.objects.get(id=pk, user=request.user, submitted_at__isnull=True)
        except QuizAttempt.DoesNotExist:
            return Response({"error": "Attempt not found."}, status=status.HTTP_404_NOT_FOUND)

        user_answers = UserAnswer.objects.filter(attempt=attempt)
        answer_map = {
            ua.question_id: {
                "selected_option_id": ua.selected_option_id,
                "marked_for_review": getattr(ua, 'marked_for_review', False)
            }
            for ua in user_answers
        }

        questions = attempt.quiz.question_set.all().order_by('question_order')
        question_data = AttemptQuestionSerializer(questions, many=True).data
        for q in question_data:
            if 'question_text' not in q and 'question' in q:
                q['question_text'] = q.pop('question')

        for q in question_data:
            q['selected_option_id'] = answer_map.get(q['id'], {}).get('selected_option_id')
            q['marked_for_review'] = answer_map.get(q['id'], {}).get('marked_for_review', False)

        elapsed = (timezone.now() - attempt.started_at).total_seconds()
        remaining = max(0, (attempt.quiz.duration_minutes * 60) - elapsed)

        return Response({
            "attempt_id": attempt.id,
            "quiz": {
                "id": attempt.quiz.id,
                "title": attempt.quiz.title,
                "difficulty": attempt.quiz.difficulty,
                "time_limit_minutes": attempt.quiz.duration_minutes,
                "total_questions": attempt.quiz.question_set.count()
            },
            "questions": question_data,
            "remaining_time_seconds": int(remaining),
            "started_at": attempt.started_at
        }, status=status.HTTP_200_OK)


    
class SaveAnswerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, attempt_id):
        try:
            attempt = QuizAttempt.objects.get(id=attempt_id, user=request.user, submitted_at__isnull=True)
        except QuizAttempt.DoesNotExist:
            return Response({"error": "Attempt not found or already submitted."}, status=status.HTTP_404_NOT_FOUND)

        question_id = request.data.get('question_id')
        selected_option_id = request.data.get('selected_option_id')
        marked_for_review = request.data.get('marked_for_review', False)

        if not question_id:
            return Response({"error": "question_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            question = Question.objects.get(id=question_id, quiz=attempt.quiz)
        except Question.DoesNotExist:
            return Response({"error": "Question does not belong to this quiz."}, status=status.HTTP_400_BAD_REQUEST)

        # 🔥 Compute is_correct
        is_correct = False
        if selected_option_id:
            try:
                option = QuestionOption.objects.get(id=selected_option_id, question=question)
                is_correct = option.is_correct
            except QuestionOption.DoesNotExist:
                # Option not found, leave is_correct as False
                pass

        # Delete existing answer (if any)
        UserAnswer.objects.filter(attempt=attempt, question=question).delete()

        # Create new answer with is_correct
        UserAnswer.objects.create(
            attempt=attempt,
            question=question,
            selected_option_id=selected_option_id,
            marked_for_review=marked_for_review,
            is_correct=is_correct  # 🔥 Now set!
        )

        return Response({"success": True}, status=status.HTTP_200_OK)

class AttemptResultView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, attempt_id):
        try:
            # ✅ OPTIMIZATION: select_related to reduce queries
            if request.user.is_superuser:
                attempt = QuizAttempt.objects.select_related('quiz', 'quiz__category', 'result').get(id=attempt_id)
            else:
                attempt = QuizAttempt.objects.select_related('quiz', 'quiz__category', 'result').get(
                    id=attempt_id, 
                    user=request.user
                )
        except QuizAttempt.DoesNotExist:
            return Response({"error": "Attempt not found."}, status=status.HTTP_404_NOT_FOUND)

        if not attempt.submitted_at:
            return Response({"error": "Attempt not submitted yet."}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ OPTIMIZATION: Use result if exists, otherwise calculate
        if hasattr(attempt, 'result') and attempt.result:
            result = attempt.result
            correct_count = result.correct_answers
            incorrect_count = result.wrong_answers
            unanswered_count = result.unanswered_questions
            total_score = result.total_score
            percentage = float(result.percentage)
            passed = result.pass_status
            grade = result.grade
        else:
            # Fallback: calculate from UserAnswer
            user_answers = UserAnswer.objects.filter(attempt=attempt)
            total_questions = attempt.quiz.question_set.count()
            
            correct_count = user_answers.filter(is_correct=True).count()
            incorrect_count = user_answers.filter(is_correct=False, selected_option_id__isnull=False).count()
            unanswered_count = total_questions - (correct_count + incorrect_count)
            unanswered_count = max(0, unanswered_count)
            total_score = correct_count
            percentage = (total_score / total_questions * 100) if total_questions > 0 else 0
            passed = percentage >= 40
            grade = self._calculate_grade(percentage)

        quiz = attempt.quiz
        time_diff = attempt.submitted_at - attempt.started_at
        time_taken_seconds = int(time_diff.total_seconds())
        time_remaining_seconds = max(0, (quiz.duration_minutes * 60) - time_taken_seconds)

        # ✅ Get total questions count efficiently
        total_questions = attempt.quiz.question_set.count()

        return Response({
            "attempt_id": attempt.id,
            "result_id": attempt.result.id if hasattr(attempt, 'result') and attempt.result else None,
            "quiz": {
                "id": quiz.id,
                "title": quiz.title,
                "category": quiz.category.category_name if quiz.category else "Uncategorized",
                "difficulty": quiz.difficulty,
                "total_questions": total_questions,
                "time_limit_minutes": quiz.duration_minutes,
                "passing_marks": int(0.4 * total_questions),
                "marks_per_question": 1
            },
            "score": total_score,
            "total_questions": total_questions,
            "correct_answers": correct_count,
            "incorrect_answers": incorrect_count,
            "unanswered": unanswered_count,
            "percentage": round(percentage, 2),
            "accuracy": round(percentage, 2),
            "passed": passed,
            "points_earned": total_score,
            "time_spent_seconds": time_taken_seconds,
            "time_remaining_seconds": time_remaining_seconds,
            "submitted_at": attempt.submitted_at.isoformat(),
            "grade": grade  # ✅ Added grade for frontend
        })

    def _calculate_grade(self, percentage):
        if percentage >= 90:
            return "A+"
        elif percentage >= 80:
            return "A"
        elif percentage >= 70:
            return "B"
        elif percentage >= 60:
            return "C"
        elif percentage >= 40:
            return "D"
        else:
            return "F"
    
class AttemptReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, attempt_id):
        try:
            # Superuser can view any attempt
            if request.user.is_superuser:
                attempt = QuizAttempt.objects.get(id=attempt_id)
            else:
                attempt = QuizAttempt.objects.get(id=attempt_id, user=request.user)
        except QuizAttempt.DoesNotExist:
            return Response({"error": "Attempt not found."}, status=status.HTTP_404_NOT_FOUND)

        if not attempt.submitted_at:
            return Response({"error": "Attempt not submitted yet."}, status=status.HTTP_400_BAD_REQUEST)

        # Get all user answers
        user_answers = UserAnswer.objects.filter(attempt=attempt).select_related('question')
        user_answers.update(reviewed=True)
        questions = attempt.quiz.question_set.all().order_by('question_order')

        # Build question data
        questions_data = []
        for question in questions:
            user_answer = user_answers.filter(question=question).first()
            selected_option_id = user_answer.selected_option_id if user_answer else None
            is_correct = user_answer.is_correct if user_answer else False

            options = question.questionoption_set.all().order_by('id')
            correct_option = options.filter(is_correct=True).first()
            correct_option_id = correct_option.id if correct_option else None

            questions_data.append({
                "question_id": question.id,
                "question_text": question.question_text,
                "question_type": question.question_type,
                "options": [
                    {"id": opt.id, "text": opt.option_text}
                    for opt in options
                ],
                "selected_option_id": selected_option_id,
                "correct_option_id": correct_option_id,
                "is_correct": is_correct,
                "ai_explanation": None
            })

        # Generate AI explanations
        if questions_data:
            try:
                explanations = self._generate_ai_explanations(attempt, questions_data)
                for i, q_data in enumerate(questions_data):
                    q_data["ai_explanation"] = explanations[i] if i < len(explanations) else ""
            except Exception as e:
                print(f"AI explanation generation failed: {e}")

        return Response({
            "attempt_id": attempt.id,
            "quiz_title": attempt.quiz.title,
            "submitted_at": attempt.submitted_at,
            "questions": questions_data
        }, status=status.HTTP_200_OK)

    def _generate_ai_explanations(self, attempt, questions_data):
        """Generate explanations for all questions using OpenRouter."""
        prompt = self._build_explanation_prompt(attempt.quiz.title, questions_data)
        
        try:
            if AIService is None:
                print("❌ AIService not available (import failed)")
                return [""] * len(questions_data)
                
            ai_service = AIService()
            explanations = ai_service.generate_explanations(prompt, len(questions_data))
            return explanations
            
        except Exception as e:
            print(f"❌ Explanation generation failed: {e}")
            return [""] * len(questions_data)

    def _build_explanation_prompt(self, quiz_title, questions_data):
        """Build prompt for AI explanation generation."""
        questions_text = ""
        for i, q in enumerate(questions_data):
            selected_text = "None"
            correct_text = "Unknown"
            
            for opt in q['options']:
                if opt['id'] == q['selected_option_id']:
                    selected_text = opt['text']
                if opt['id'] == q['correct_option_id']:
                    correct_text = opt['text']
            
            questions_text += f"""
Question {i+1}: {q['question_text']}
Options: {', '.join([opt['text'] for opt in q['options']])}
Selected Answer: {selected_text}
Correct Answer: {correct_text}
User's answer was {'correct' if q['is_correct'] else 'incorrect'}.
---
"""

        prompt = f"""
You are an expert tutor. For the quiz "{quiz_title}", provide brief, educational explanations for each question.

Each explanation should be 3-6 lines and:
- Explain WHY the correct answer is correct.
- Explain WHY the selected answer is incorrect (if applicable).
- Briefly describe the underlying concept.

Here are the questions with the user's answers:

{questions_text}

Return a JSON array of exactly {len(questions_data)} strings, where each string is the explanation for that question.

Example output:
[
  "Explanation for question 1...",
  "Explanation for question 2..."
]

Return ONLY valid JSON. No extra text.
"""
        return prompt