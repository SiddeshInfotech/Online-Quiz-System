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
        elapsed = (timezone.now() - attempt.started_at).total_seconds() / 60  # minutes

        if elapsed > duration:
            return Response({
                "error": f"Time limit exceeded. You had {duration} minutes.",
                "elapsed_minutes": elapsed
            }, status=status.HTTP_400_BAD_REQUEST)

        answers_data = request.data.get('answers', [])
        if not answers_data:
            return Response({"error": "No answers provided."}, status=status.HTTP_400_BAD_REQUEST)

        correct_count = 0
        wrong_count = 0
        unanswered_count = 0
        total_score = 0
        total_marks = 0

        all_questions = Question.objects.filter(quiz=quiz)
        answered_question_ids = []

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

            if question.question_type == 'MCQ':
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

            elif question.question_type == 'True/False':
                if answer_text:
                    
                    is_correct = answer_text.strip().lower() == question.correct_answer.strip().lower()
                    marks_obtained = question.marks if is_correct else 0
                else:
                    is_correct = False
                    marks_obtained = 0

            elif question.question_type == 'Fill in the Blank':
                
                if answer_text:
                    is_correct = answer_text.strip().lower() == question.correct_answer.strip().lower()
                    marks_obtained = question.marks if is_correct else 0
                else:
                    is_correct = False
                    marks_obtained = 0

            
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
        for q in all_questions:
            if q.id not in answered_question_ids:
                # Save as unanswered
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

       
        time_diff = attempt.submitted_at - attempt.started_at
        time_taken_seconds = time_diff.total_seconds()
        time_taken_minutes = time_taken_seconds // 60
        time_taken_remaining = time_taken_seconds % 60

       
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

        return Response({
            "message": "Quiz submitted successfully.",
            "attempt_id": attempt.id,
            "score": total_score,
            "total_marks": total_marks,
            "percentage": result.percentage,
            "grade": result.grade,
            "pass_status": result.pass_status,
            "correct_answers": correct_count,
            "wrong_answers": wrong_count,
            "unanswered_questions": unanswered_count,
            "time_taken": f"{int(time_taken_minutes)}:{int(time_taken_remaining):02d}",
            "result_id": result.id
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
    serializer_class = ResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Result.objects.filter(attempt__user=self.request.user)


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

    def get(self, request, *args, **kwargs):
        attempt_id = kwargs.get('pk')
        try:
            attempt = QuizAttempt.objects.get(id=attempt_id, user=request.user)
        except QuizAttempt.DoesNotExist:
            return Response({"error": "Attempt not found or unauthorized"}, status=status.HTTP_404_NOT_FOUND)

        questions = attempt.quiz.question_set.all().order_by('question_order')
        question_serializer = QuestionSerializer(questions, many=True)

        return Response({
            "attempt_id": attempt.id,
            "quiz_id": attempt.quiz.id,
            "quiz_title": attempt.quiz.title,
            "started_at": attempt.started_at,
            "submitted_at": attempt.submitted_at,
            "questions": question_serializer.data
        })

