from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Avg
from apps.attempts.models import QuizAttempt, UserAnswer
from apps.quizzes.models import Quiz
from django.db.models import Sum


class BadgeProgressHelper:
    @staticmethod
    def get_progress(user, badge):
        """Calculate current progress for a badge based on its type."""
        badge_id = badge.badge_id
        
        # ===== Streak Badges (1-8) =====
        if badge_id in [1, 2, 3, 4, 5, 6, 7]:
            streak = getattr(user, 'current_streak', 0)
            return streak
        
        # ===== Quiz Count Badges (9-16, 55) =====
        if badge_id in [9, 10, 11, 12, 13, 16, 55]:
            total = QuizAttempt.objects.filter(
                user=user, submitted_at__isnull=False
            ).count()
            return total
        
        if badge_id == 14:  # Century Club: 100 questions in one day
            today = timezone.localtime(timezone.now()).date()
            return UserAnswer.objects.filter(
                attempt__user=user, attempt__submitted_at__date=today
            ).count()
        
        if badge_id == 15:  # Marathoner: 5 quizzes in one day
            today = timezone.localtime(timezone.now()).date()
            return QuizAttempt.objects.filter(
                user=user, submitted_at__date=today
            ).count()
        
        # ===== Accuracy Badges (17-22, 59, 60, 61) =====
        if badge_id == 17 or badge_id == 59:  # Sharp Shooter / Peak Performer
            attempts = QuizAttempt.objects.filter(
                user=user, submitted_at__isnull=False
            ).order_by('-submitted_at')
            for att in attempts:
                if att.quiz.question_set.count() >= 10 and att.percentage >= 90:
                    return 1
            return 0
        
        if badge_id == 18:  # Perfectionist: 100% on any quiz
            attempts = QuizAttempt.objects.filter(
                user=user, submitted_at__isnull=False, percentage=100
            )
            return attempts.count() if attempts.exists() else 0
        
        if badge_id == 19:  # Flawless Five: 5 consecutive 100% scores
            attempts = QuizAttempt.objects.filter(
                user=user, submitted_at__isnull=False
            ).order_by('-submitted_at')
            perfect_count = 0
            for att in attempts:
                if att.percentage == 100:
                    perfect_count += 1
                    if perfect_count >= 5:
                        return 5
                else:
                    perfect_count = 0
            return perfect_count
        
        if badge_id == 20:  # Consistent Mind: 80%+ avg over last 20
            attempts = QuizAttempt.objects.filter(
                user=user, submitted_at__isnull=False
            ).order_by('-submitted_at')[:20]
            if attempts:
                avg = sum(a.percentage for a in attempts) / len(attempts)
                return avg
            return 0
        
        if badge_id == 21:  # No Mistakes Allowed: 3 quizzes without incorrect
            attempts = QuizAttempt.objects.filter(
                user=user, submitted_at__isnull=False
            ).order_by('-submitted_at')
            no_mistake = 0
            for att in attempts:
                answers = UserAnswer.objects.filter(attempt=att)
                if answers.filter(is_correct=False).exists():
                    no_mistake = 0
                else:
                    no_mistake += 1
                    if no_mistake >= 3:
                        return 3
            return no_mistake
        
        if badge_id == 22:  # Redemption Arc: 100% on previously failed quiz
            attempts = QuizAttempt.objects.filter(
                user=user, submitted_at__isnull=False
            ).order_by('submitted_at')
            quiz_ids = attempts.values_list('quiz_id', flat=True).distinct()
            for qid in quiz_ids:
                q_attempts = attempts.filter(quiz_id=qid)
                if q_attempts.count() >= 2:
                    first = q_attempts.first()
                    last = q_attempts.last()
                    if first.percentage < 60 and last.percentage == 100:
                        return 1
            return 0
        
        if badge_id == 60:  # Precision Master: 100 correct answers total
            return UserAnswer.objects.filter(
                attempt__user=user, is_correct=True
            ).count()
        
        if badge_id == 61:  # Speed Runner: complete in less than half time
            attempts = QuizAttempt.objects.filter(
                user=user, submitted_at__isnull=False
            ).order_by('-submitted_at')
            for att in attempts:
                time_taken = (att.submitted_at - att.started_at).total_seconds()
                time_limit = att.quiz.duration_minutes * 60
                if time_limit > 0 and time_taken < time_limit / 2:
                    return 1
            return 0
        
        # ===== Subject Badges (27-33) =====
        if badge_id == 27:  # Code Conqueror: 5 distinct Coding quizzes mastered
            attempts = QuizAttempt.objects.filter(
                user=user, submitted_at__isnull=False
            )
            coding_ids = set()
            for att in attempts:
                if att.quiz.question_type == 'Coding' and att.percentage >= 80:
                    coding_ids.add(att.quiz_id)
            return len(coding_ids)
        
        if badge_id == 28:  # Python Pro
            attempts = QuizAttempt.objects.filter(
                user=user, submitted_at__isnull=False,
                quiz__subject__icontains='Python', percentage__gte=80
            )
            return len(set(attempts.values_list('quiz_id', flat=True)))
        
        if badge_id == 29:  # Java Genius
            attempts = QuizAttempt.objects.filter(
                user=user, submitted_at__isnull=False,
                quiz__subject__icontains='Java', percentage__gte=80
            )
            return len(set(attempts.values_list('quiz_id', flat=True)))
        
        if badge_id == 30:  # C++ Champion
            attempts = QuizAttempt.objects.filter(
                user=user, submitted_at__isnull=False,
                quiz__subject__icontains='C++', percentage__gte=80
            )
            return len(set(attempts.values_list('quiz_id', flat=True)))
        
        if badge_id == 32 or badge_id == 33:  # All-Rounder / Subject Master
            attempts = QuizAttempt.objects.filter(
                user=user, submitted_at__isnull=False
            ).select_related('quiz')
            subject_data = {}
            for att in attempts:
                subj = att.quiz.subject
                if subj not in subject_data:
                    subject_data[subj] = {'scores': []}
                subject_data[subj]['scores'].append(att.percentage)
            count_80 = 0
            for data in subject_data.values():
                if sum(data['scores']) / len(data['scores']) >= 80:
                    count_80 += 1
            return count_80
        
        # ===== Time Badges (34-39) =====
        if badge_id == 34:  # Daily Dedication: 7 consecutive days
            attempts = QuizAttempt.objects.filter(
                user=user, submitted_at__isnull=False
            )
            today = timezone.localtime(timezone.now()).date()
            days = 0
            for i in range(7):
                day = today - timedelta(days=i)
                if attempts.filter(submitted_at__date=day).exists():
                    days += 1
                else:
                    break
            return days
        
        if badge_id == 35:  # Time Keeper: 60 minutes in one day
            attempts = QuizAttempt.objects.filter(
                user=user, submitted_at__isnull=False
            )
            today = timezone.localtime(timezone.now()).date()
            max_time = 0
            for day in [today - timedelta(days=i) for i in range(30)]:
                total = attempts.filter(submitted_at__date=day).aggregate(
                    Sum('time_spent_seconds')
                )['time_spent_seconds__sum'] or 0
                if total > max_time:
                    max_time = total
            return max_time // 60  # Return in minutes
        
        if badge_id == 37:  # Early Bird: quiz before 9 AM
            attempts = QuizAttempt.objects.filter(
                user=user, submitted_at__isnull=False
            )
            for att in attempts:
                local = timezone.localtime(att.submitted_at)
                if local.hour < 9:
                    return 1
            return 0
        
        if badge_id == 38:  # Night Owl: quiz after 10 PM
            attempts = QuizAttempt.objects.filter(
                user=user, submitted_at__isnull=False
            )
            for att in attempts:
                local = timezone.localtime(att.submitted_at)
                if local.hour >= 22:
                    return 1
            return 0
        
        if badge_id == 39:  # Goal Getter: 7 times achieving daily goal
            attempts = QuizAttempt.objects.filter(
                user=user, submitted_at__isnull=False
            )
            daily_goal = getattr(user, 'daily_quiz_goal', 3)
            today = timezone.localtime(timezone.now()).date()
            achieved = 0
            for day in [today - timedelta(days=i) for i in range(30)]:
                count = attempts.filter(submitted_at__date=day).count()
                if count >= daily_goal:
                    achieved += 1
                else:
                    achieved = 0
            return achieved
        
        # ===== Miscellaneous Badges =====
        if badge_id == 40 or badge_id == 58:  # Explorer / Knowledge Seeker
            attempts = QuizAttempt.objects.filter(
                user=user, submitted_at__isnull=False
            )
            return len(set(attempts.values_list('quiz__subject', flat=True)))
        
        if badge_id == 45:  # Hidden Gem: quiz with 2 or fewer attempts
            attempts = QuizAttempt.objects.filter(
                user=user, submitted_at__isnull=False
            ).select_related('quiz')
            for att in attempts:
                total = QuizAttempt.objects.filter(quiz=att.quiz, submitted_at__isnull=False).count()
                if total <= 2:
                    return 1
            return 0
        
        if badge_id == 50:  # Risk Taker: Hard quiz with 70%+
            attempts = QuizAttempt.objects.filter(
                user=user, submitted_at__isnull=False
            ).select_related('quiz')
            for att in attempts:
                if att.quiz.difficulty == 'Hard' and att.percentage >= 70:
                    return 1
            return 0
        
        if badge_id == 51:  # Weekly Warrior: 20 quizzes in a week
            week_ago = timezone.now() - timedelta(days=7)
            return QuizAttempt.objects.filter(
                user=user, submitted_at__gte=week_ago
            ).count()
        
        if badge_id == 52:  # Analyst: reviewed 20 questions
            return UserAnswer.objects.filter(
                attempt__user=user, reviewed=True
            ).count()
        
        if badge_id == 64:  # Feedback Hero
            from apps.feedback.models import Feedback
            return 1 if Feedback.objects.filter(user=user).exists() else 0
        
        # ===== Leaderboard Badges (53, 62) =====
        # Progress can't be computed here; handled separately in leaderboard view
        
        # ===== Milestone Badges (54) =====
        if badge_id == 54:  # Quiz Champion: win 100 quizzes (80%+)
            return QuizAttempt.objects.filter(
                user=user, submitted_at__isnull=False, percentage__gte=80
            ).count()
        
        if badge_id == 9:  # First Step: complete 1 quiz
            return QuizAttempt.objects.filter(
                user=user, submitted_at__isnull=False
            ).count()
        
        # ===== Default =====
        return 0

    @staticmethod
    def get_target(badge):
        """Return the target value for a badge."""
        target_map = {
            1: 3, 2: 7, 3: 14, 4: 30, 5: 60, 6: 100, 7: 365,
            9: 1, 10: 10, 11: 50, 12: 100, 13: 250, 14: 100, 15: 5, 16: 500, 55: 50,
            17: 90, 18: 100, 19: 5, 20: 80, 21: 3, 22: 1,
            27: 5, 28: 5, 29: 5, 30: 5, 32: 5, 33: 10,
            34: 7, 35: 60, 37: 1, 38: 1, 39: 7,
            40: 5, 45: 1, 50: 70, 51: 20, 52: 20, 53: 10, 54: 100, 58: 10, 59: 95, 60: 100, 61: 1, 62: 1, 64: 1,
        }
        return target_map.get(badge.badge_id, 1)