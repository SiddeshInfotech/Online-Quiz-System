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


from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from .models import QuizAttempt, Result
from .serializers import StartAttemptSerializer
from apps.quizzes.models import Quiz


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

        if quiz.status != 'Published':
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
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, attempt_id):
        try:
            attempt = QuizAttempt.objects.get(id=attempt_id, user=request.user, submitted_at__isnull=True)
        except QuizAttempt.DoesNotExist:
            return Response({"error": "Attempt not found or already submitted."}, status=status.HTTP_404_NOT_FOUND)

        quiz = attempt.quiz
        duration = quiz.duration_minutes
        elapsed = (timezone.now() - attempt.started_at).total_seconds() / 60

        is_auto_submitted = elapsed > duration

        # 🔥 Get answers data — support both array and object formats
        answers_data = request.data.get('answers', [])

        # If answers_data is a dict (like {"100": 347}), convert to list of objects
        if isinstance(answers_data, dict):
            answers_data = [
                {"question_id": int(q_id), "selected_option_id": opt_id}
                for q_id, opt_id in answers_data.items()
            ]

        # If empty, treat as empty array
        if not answers_data:
            answers_data = []

        correct_count = 0
        wrong_count = 0
        unanswered_count = 0
        total_score = 0
        total_marks = 0

        all_questions = Question.objects.filter(quiz=quiz)
        answered_question_ids = []

        # Process each answer
        for answer_data in answers_data:
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

            if question.question_type == 'MCQ' or question.question_type == 'True/False':
                if selected_option_id:
                    try:
                        option = QuestionOption.objects.get(id=selected_option_id, question=question)
                        is_correct = option.is_correct
                        marks_obtained = question.marks if is_correct else 0
                    except QuestionOption.DoesNotExist:
                        return Response({"error": f"Invalid option for question {question_id}."}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    is_correct = False
                    marks_obtained = 0

            elif question.question_type == 'Fill in the Blank':
                if answer_text:
                    is_correct = answer_text.strip().lower() == question.correct_answer.strip().lower()
                    marks_obtained = question.marks if is_correct else 0

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

        unanswered_count = all_questions.count() - len(answered_question_ids)

        # Save unanswered as wrong
        for q in all_questions:
            if q.id not in answered_question_ids:
                UserAnswer.objects.create(
                    attempt=attempt,
                    question=q,
                    is_correct=False,
                    marks_obtained=0
                )

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

class UserResultsView(generics.ListAPIView):
    serializer_class = ResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Result.objects.filter(attempt__user=self.request.user).order_by('-generated_at')


class ResultDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Result.objects.filter(attempt__user=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        result = self.get_object()
        attempt = result.attempt
        quiz = attempt.quiz

        time_diff = attempt.submitted_at - attempt.started_at
        time_taken_seconds = int(time_diff.total_seconds()) if attempt.submitted_at else 0
        time_remaining_seconds = max(0, (quiz.duration_minutes * 60) - time_taken_seconds)

        return Response({
            "attempt_id": attempt.id,
            "quiz": {
                "id": quiz.id,
                "title": quiz.title,
                "category": quiz.category.category_name if quiz.category else "Uncategorized",
                "difficulty": quiz.difficulty,
                "total_questions": quiz.question_set.count(),
                "time_limit_minutes": quiz.duration_minutes,
                "passing_marks": int(0.4 * quiz.question_set.count()),
                "marks_per_question": 1
            },
            "score": result.total_score,
            "percentage": result.percentage,
            "passed": result.pass_status,
            "correct_answers": result.correct_answers,
            "incorrect_answers": result.wrong_answers,
            "unanswered": result.unanswered_questions,
            "accuracy": result.percentage,
            "points_earned": result.total_score,
            "time_taken_seconds": time_taken_seconds,
            "time_remaining_seconds": time_remaining_seconds,
            "submitted_at": attempt.submitted_at.isoformat() if attempt.submitted_at else None
        })


class AttemptResultDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, attempt_id):
        try:
            attempt = QuizAttempt.objects.get(id=attempt_id, user=request.user)
        except QuizAttempt.DoesNotExist:
            return Response({"error": "Attempt not found."}, status=status.HTTP_404_NOT_FOUND)

        answers = UserAnswer.objects.filter(attempt=attempt)
        answers_data = []
        for ans in answers:
            answers_data.append({
                "question_id": ans.question.id,
                "question_text": ans.question.question_text,
                "selected_option_id": ans.selected_option_id if ans.selected_option_id else None,
                "selected_option_text": ans.selected_option.option_text if ans.selected_option else None,
                "answer_text": ans.answer_text,
                "is_correct": ans.is_correct,
                "marks_obtained": ans.marks_obtained,
                "correct_answer": ans.question.correct_answer
            })

        return Response({
            "attempt_id": attempt.id,
            "quiz_title": attempt.quiz.title,
            "started_at": attempt.started_at,
            "submitted_at": attempt.submitted_at,
            "score": attempt.score,
            "percentage": attempt.percentage,
            "answers": answers_data
        }, status=status.HTTP_200_OK)

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

        
        UserAnswer.objects.filter(attempt=attempt, question=question).delete()

        
        UserAnswer.objects.create(
            attempt=attempt,
            question=question,
            selected_option_id=selected_option_id,
            marked_for_review=marked_for_review
        )

        return Response({"success": True}, status=status.HTTP_200_OK)

class AttemptResultView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, attempt_id):
        try:
            attempt = QuizAttempt.objects.get(id=attempt_id, user=request.user)
        except QuizAttempt.DoesNotExist:
            return Response({"error": "Attempt not found."}, status=status.HTTP_404_NOT_FOUND)

        if not attempt.submitted_at:
            return Response({"error": "Attempt not submitted yet."}, status=status.HTTP_400_BAD_REQUEST)

        result = getattr(attempt, 'result', None)
        if not result:
            return Response({"error": "Result not found for this attempt."}, status=status.HTTP_404_NOT_FOUND)

        quiz = attempt.quiz
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
                "total_questions": quiz.question_set.count(),
                "time_limit_minutes": quiz.duration_minutes,
                "passing_marks": int(0.4 * quiz.question_set.count()),
                "marks_per_question": 1
            },
            "score": result.total_score,
            "total_questions": quiz.question_set.count(),
            "correct_answers": result.correct_answers,
            "incorrect_answers": result.wrong_answers,
            "unanswered": result.unanswered_questions,
            "percentage": result.percentage,
            "accuracy": result.percentage,
            "passed": result.pass_status,
            "points_earned": result.total_score,
            "time_spent_seconds": time_taken_seconds,
            "time_remaining_seconds": time_remaining_seconds,
            "submitted_at": attempt.submitted_at.isoformat()
        })

