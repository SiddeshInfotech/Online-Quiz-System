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
        try:
            attempt = QuizAttempt.objects.get(id=attempt_id, user=request.user, submitted_at__isnull=True)
        except QuizAttempt.DoesNotExist:
            return Response({"error": "Attempt not found or already submitted."}, status=status.HTTP_404_NOT_FOUND)

        quiz = attempt.quiz
        duration = quiz.duration_minutes
        elapsed = (timezone.now() - attempt.started_at).total_seconds() / 60
        is_auto_submitted = elapsed > duration
        UserAnswer.objects.filter(attempt=attempt).delete()

        # Get answers data (supports both array and object formats)
        answers_data = request.data.get('answers', [])
        if isinstance(answers_data, dict):
            answers_data = [
                {"question_id": int(q_id), "selected_option_id": opt_id}
                for q_id, opt_id in answers_data.items()
            ]
        if not answers_data:
            answers_data = []

        correct_count = 0
        wrong_count = 0
        unanswered_count = 0
        total_score = 0
        total_marks = 0

        all_questions = Question.objects.filter(quiz=quiz)
        answered_question_ids = []

        for answer_data in answers_data:
            # Validate with serializer
            serializer = SubmitAnswerSerializer(data=answer_data, context={'attempt': attempt})
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            question_id = serializer.validated_data['question_id']
            selected_option_id = serializer.validated_data.get('selected_option_id')
            answer_text = serializer.validated_data.get('answer_text', '')

            try:
                question = Question.objects.get(id=question_id, quiz=quiz)
            except Question.DoesNotExist:
                return Response({"error": f"Question {question_id} does not belong to this quiz."}, status=status.HTTP_400_BAD_REQUEST)

            answered_question_ids.append(question_id)
            is_correct = False
            marks_obtained = 0

            q_type = question.question_type

            # ---------- MCQ ----------
            if q_type == 'MCQ':
                if selected_option_id:
                    try:
                        option = QuestionOption.objects.get(id=selected_option_id, question=question)
                        is_correct = option.is_correct
                        marks_obtained = question.marks if is_correct else 0
                        if not is_correct and option.option_text.strip() == question.correct_answer.strip():
                            is_correct = True
                            marks_obtained = question.marks
                    except QuestionOption.DoesNotExist:
                        return Response({"error": f"Invalid option for question {question_id}."}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    is_correct = False
                    marks_obtained = 0

            # ---------- True/False ----------
            elif q_type == 'True/False':
                # True/False questions also have options (like MCQ)
                if selected_option_id:
                    try:
                        option = QuestionOption.objects.get(id=selected_option_id, question=question)
                        is_correct = option.is_correct
                        marks_obtained = question.marks if is_correct else 0
                        if not is_correct and option.option_text.strip() == question.correct_answer.strip():
                            is_correct = True
                            marks_obtained = question.marks
                    except QuestionOption.DoesNotExist:
                        return Response({"error": f"Invalid option for question {question_id}."}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    is_correct = False
                    marks_obtained = 0

            # ---------- Fill in the Blank ----------
            elif q_type == 'Fill in the Blank':
                # Check if the question has options (like our AI-generated ones)
                has_options = question.questionoption_set.exists()
                if has_options and selected_option_id:
                    try:
                        option = QuestionOption.objects.get(id=selected_option_id, question=question)
                        is_correct = option.is_correct
                        marks_obtained = question.marks if is_correct else 0
                        if not is_correct and option.option_text.strip() == question.correct_answer.strip():
                            is_correct = True
                            marks_obtained = question.marks
                    except QuestionOption.DoesNotExist:
                        is_correct = False
                        marks_obtained = 0
                elif answer_text:
                    # Free-text fill-in-the-blank (if not using options)
                    is_correct = answer_text.strip().lower() == question.correct_answer.strip().lower()
                    marks_obtained = question.marks if is_correct else 0
                else:
                    is_correct = False
                    marks_obtained = 0

            # ---------- Save UserAnswer ----------
            UserAnswer.objects.create(
                attempt=attempt,
                question=question,
                selected_option_id=selected_option_id,
                answer_text=answer_text,
                is_correct=is_correct,
                marks_obtained=marks_obtained
            )

            total_marks += question.marks
            total_score += marks_obtained

            if is_correct:
                correct_count += 1
            else:
                wrong_count += 1

        # Mark unanswered questions
        unanswered_count = all_questions.count() - len(answered_question_ids)
        for q in all_questions:
            if q.id not in answered_question_ids:
                UserAnswer.objects.create(
                    attempt=attempt,
                    question=q,
                    is_correct=False,
                    marks_obtained=0
                )

        # Update attempt
        attempt.submitted_at = timezone.now()
        attempt.score = total_score
        attempt.percentage = (total_score / total_marks * 100) if total_marks > 0 else 0
        attempt.save()

        # Create Result
        result = Result.objects.create(
            attempt=attempt,
            correct_answers=correct_count,
            wrong_answers=wrong_count,
            unanswered_questions=unanswered_count,
            total_score=total_score,
            percentage=(total_score / total_marks * 100) if total_marks > 0 else 0,
            grade=self._calculate_grade((total_score / total_marks * 100) if total_marks > 0 else 0),
            pass_status=(total_score / total_marks * 100) >= 40 if total_marks > 0 else False
        )

        # Build response
        time_diff = attempt.submitted_at - attempt.started_at
        time_taken_seconds = int(time_diff.total_seconds())
        time_remaining_seconds = max(0, (quiz.duration_minutes * 60) - time_taken_seconds)

        return Response({
            "attempt_id": attempt.id,
            "result_id": result.id,
            "quiz": {
                "id": quiz.id,
                "title": quiz.title,
                "category": quiz.category.category_name if quiz.category else "Uncategorized",
                "difficulty": quiz.difficulty,
                "total_questions": all_questions.count(),
                "time_limit_minutes": quiz.duration_minutes,
                "passing_marks": int(0.4 * all_questions.count()),
                "marks_per_question": 1
            },
            "score": total_score,
            "total_questions": all_questions.count(),
            "correct_answers": correct_count,
            "incorrect_answers": wrong_count,
            "unanswered": unanswered_count,
            "percentage": result.percentage,
            "accuracy": result.percentage,
            "passed": result.pass_status,
            "points_earned": total_score,
            "time_spent_seconds": time_taken_seconds,
            "time_remaining_seconds": time_remaining_seconds,
            "submitted_at": attempt.submitted_at.isoformat(),
            "auto_submitted": is_auto_submitted
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

        history_list = []
        for attempt in attempts_qs:
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
            "attempts": history_list
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
            if request.user.is_superuser:
                attempt = QuizAttempt.objects.get(id=attempt_id)
            else:
                attempt = QuizAttempt.objects.get(id=attempt_id, user=request.user)
        except QuizAttempt.DoesNotExist:
            return Response({"error": "Attempt not found."}, status=status.HTTP_404_NOT_FOUND)

        if not attempt.submitted_at:
            return Response({"error": "Attempt not submitted yet."}, status=status.HTTP_400_BAD_REQUEST)

        # Get UserAnswer records for this attempt (should be unique now after submit fix)
        user_answers = UserAnswer.objects.filter(attempt=attempt)
        total_questions = attempt.quiz.question_set.count()

        # Calculate correct and incorrect counts
        correct_count = user_answers.filter(is_correct=True).count()
        # Incorrect: answered but wrong (is_correct=False AND selected_option_id is not null)
        incorrect_count = user_answers.filter(is_correct=False, selected_option_id__isnull=False).count()

        # Unanswered: questions that were never answered (no UserAnswer or selected_option_id null)
        # We can compute as total_questions - (correct_count + incorrect_count)
        # But also include answers with selected_option_id null as unanswered
        unanswered_count = total_questions - (correct_count + incorrect_count)
        # Safety: ensure never negative
        unanswered_count = max(0, unanswered_count)

        # Score: assume 1 mark per correct answer (or use marks_obtained sum if needed)
        # Since we cleared duplicates, we can just use correct_count
        total_score = correct_count
        percentage = (total_score / total_questions * 100) if total_questions > 0 else 0

        quiz = attempt.quiz
        time_diff = attempt.submitted_at - attempt.started_at
        time_taken_seconds = int(time_diff.total_seconds())
        time_remaining_seconds = max(0, (quiz.duration_minutes * 60) - time_taken_seconds)

        return Response({
            "attempt_id": attempt.id,
            "result_id": getattr(attempt, 'result', None).id if hasattr(attempt, 'result') and attempt.result else None,
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
            "passed": percentage >= 40,
            "points_earned": total_score,
            "time_spent_seconds": time_taken_seconds,
            "time_remaining_seconds": time_remaining_seconds,
            "submitted_at": attempt.submitted_at.isoformat()
        })
    
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