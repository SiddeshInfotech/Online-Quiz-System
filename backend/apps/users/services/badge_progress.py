from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Avg, Sum, Q
from apps.attempts.models import QuizAttempt, UserAnswer
from apps.quizzes.models import Question  # Add this import

class BadgeProgressHelper:
    @staticmethod
    def get_all_progress(user, badges):
        """Compute progress for all badges in one efficient pass."""
        # Fetch user data once
        attempts = QuizAttempt.objects.filter(user=user, submitted_at__isnull=False).select_related('quiz')
        answers = UserAnswer.objects.filter(attempt__user=user)
        
        # Precompute question counts for all quizzes in attempts
        quiz_ids = set(attempts.values_list('quiz_id', flat=True))
        question_counts = {}
        for qid in quiz_ids:
            question_counts[qid] = Question.objects.filter(quiz_id=qid).count()
        
        # Pre-aggregate data
        total_attempts = attempts.count()
        total_correct = answers.filter(is_correct=True).count()
        reviewed_count = answers.filter(reviewed=True).count()
        perfect_attempts = attempts.filter(percentage=100)
        perfect_count = perfect_attempts.count()
        
        # Streak (from user model)
        streak = getattr(user, 'current_streak', 0)
        
        # Subject counts
        subject_counts = {}
        for att in attempts:
            subj = att.quiz.subject
            if subj not in subject_counts:
                subject_counts[subj] = {'count': 0, 'scores': []}
            subject_counts[subj]['count'] += 1
            subject_counts[subj]['scores'].append(att.percentage)
        
        # Distinct quizzes per subject with score >=80%
        subject_mastered = {}
        for subj, data in subject_counts.items():
            if data['count'] >= 5 and sum(data['scores']) / len(data['scores']) >= 80:
                subject_mastered[subj] = True
        
        # Coding quizzes mastered
        coding_quiz_ids = set()
        python_quiz_ids = set()
        java_quiz_ids = set()
        cpp_quiz_ids = set()
        hard_high_score = False
        speed_run = False
        hidden_gem_done = False
        sharp_shooter_done = False
        peak_performer_done = False
        
        for att in attempts:
            qid = att.quiz_id
            q_count = question_counts.get(qid, 0)
            
            # Sharp Shooter (17): 90%+ on 10+ Qs
            if not sharp_shooter_done and q_count >= 10 and att.percentage >= 90:
                sharp_shooter_done = True
            
            # Peak Performer (59): 95%+ on 10+ Qs
            if not peak_performer_done and q_count >= 10 and att.percentage >= 95:
                peak_performer_done = True
            
            # Coding
            if att.quiz.question_type == 'Coding' and att.percentage >= 80:
                coding_quiz_ids.add(qid)
            # Python, Java, C++ (case-insensitive)
            subj_lower = att.quiz.subject.lower()
            if 'python' in subj_lower and att.percentage >= 80:
                python_quiz_ids.add(qid)
            if 'java' in subj_lower and att.percentage >= 80:
                java_quiz_ids.add(qid)
            if 'c++' in subj_lower and att.percentage >= 80:
                cpp_quiz_ids.add(qid)
            # Hard quiz with 70%+
            if att.quiz.difficulty == 'Hard' and att.percentage >= 70:
                hard_high_score = True
            # Speed runner (less than half time)
            time_taken = (att.submitted_at - att.started_at).total_seconds()
            time_limit = att.quiz.duration_minutes * 60
            if time_limit > 0 and time_taken < time_limit / 2:
                speed_run = True
            # Hidden gem: total attempts on this quiz <= 2
            if not hidden_gem_done:
                total_quiz_attempts = QuizAttempt.objects.filter(quiz=att.quiz, submitted_at__isnull=False).count()
                if total_quiz_attempts <= 2:
                    hidden_gem_done = True

        # Daily counts (today)
        today = timezone.localtime(timezone.now()).date()
        today_attempts = attempts.filter(submitted_at__date=today)
        today_questions = UserAnswer.objects.filter(attempt__user=user, attempt__submitted_at__date=today).count()
        today_quiz_count = today_attempts.count()

        # Consecutive days (for Daily Dedication)
        consecutive_days = 0
        for i in range(7):
            day = today - timedelta(days=i)
            if attempts.filter(submitted_at__date=day).exists():
                consecutive_days += 1
            else:
                break

        # Max time spent in a day (minutes)
        max_day_minutes = 0
        for day in [today - timedelta(days=i) for i in range(30)]:
            total_sec = attempts.filter(submitted_at__date=day).aggregate(Sum('time_spent_seconds'))['time_spent_seconds__sum'] or 0
            if total_sec // 60 > max_day_minutes:
                max_day_minutes = total_sec // 60

        # Goal achieved days (for Goal Getter)
        daily_goal = getattr(user, 'daily_quiz_goal', 3)
        goal_days = 0
        for day in [today - timedelta(days=i) for i in range(30)]:
            day_count = attempts.filter(submitted_at__date=day).count()
            if day_count >= daily_goal:
                goal_days += 1
            else:
                goal_days = 0

        # Early bird and night owl flags
        early_bird = False
        night_owl = False
        for att in attempts.order_by('submitted_at'):
            local_time = timezone.localtime(att.submitted_at)
            if local_time.hour < 9:
                early_bird = True
            if local_time.hour >= 22:
                night_owl = True
            if early_bird and night_owl:
                break

        # Quiz Champion: 100 quizzes with >=80%
        champion_count = attempts.filter(percentage__gte=80).count()

        # Build progress map
        progress_map = {
            # Streak (1-8)
            1: streak, 2: streak, 3: streak, 4: streak, 5: streak, 6: streak, 7: streak,
            # Quiz Count (9-16, 55)
            9: total_attempts, 10: total_attempts, 11: total_attempts, 12: total_attempts,
            13: total_attempts, 16: total_attempts, 55: total_attempts,
            14: today_questions,
            15: today_quiz_count,
            # Accuracy (17-22, 59, 60, 61)
            17: 1 if sharp_shooter_done else 0,
            18: perfect_count,
            19: BadgeProgressHelper._consecutive_perfect_count(attempts),
            20: BadgeProgressHelper._average_last_20(attempts),
            21: BadgeProgressHelper._no_mistake_streak(attempts),
            22: BadgeProgressHelper._redemption(attempts),
            59: 1 if peak_performer_done else 0,
            60: total_correct,
            61: 1 if speed_run else 0,
            # Subject (27-33)
            27: len(coding_quiz_ids),
            28: len(python_quiz_ids),
            29: len(java_quiz_ids),
            30: len(cpp_quiz_ids),
            32: BadgeProgressHelper._subjects_above_80(subject_counts, threshold=5),
            33: BadgeProgressHelper._subjects_above_80(subject_counts, threshold=10),
            # Time (34-39)
            34: consecutive_days,
            35: max_day_minutes,
            37: 1 if early_bird else 0,
            38: 1 if night_owl else 0,
            39: goal_days,
            # Miscellaneous (40,45,50,51,52,58,64)
            40: len(subject_counts),
            58: len(subject_counts),
            45: 1 if hidden_gem_done else 0,
            50: 1 if hard_high_score else 0,
            51: attempts.filter(submitted_at__gte=timezone.now() - timedelta(days=7)).count(),
            52: reviewed_count,
            64: 1 if attempts.exists() else 0,  # Feedback hero checked later
        }

        # Override for badge 8 (Comeback King) - not implemented yet
        progress_map[8] = 0

        # Override for badge 53 (Top Performer) and 62 (Legend in Progress) – handled elsewhere
        progress_map[53] = 0
        progress_map[62] = 0

        # Badge 54 Quiz Champion
        progress_map[54] = champion_count

        return progress_map

    # ... (rest of helper methods remain the same)
    @staticmethod
    def _consecutive_perfect_count(attempts):
        count = 0
        for att in attempts.order_by('-submitted_at'):
            if att.percentage == 100:
                count += 1
            else:
                break
        return count

    @staticmethod
    def _average_last_20(attempts):
        last_20 = list(attempts.order_by('-submitted_at')[:20])
        if last_20:
            return sum(a.percentage for a in last_20) / len(last_20)
        return 0

    @staticmethod
    def _no_mistake_streak(attempts):
        no_mistake = 0
        for att in attempts.order_by('-submitted_at'):
            answers = UserAnswer.objects.filter(attempt=att)
            if answers.filter(is_correct=False).exists():
                no_mistake = 0
            else:
                no_mistake += 1
        return no_mistake

    @staticmethod
    def _redemption(attempts):
        quiz_ids = attempts.values_list('quiz_id', flat=True).distinct()
        for qid in quiz_ids:
            q_attempts = attempts.filter(quiz_id=qid).order_by('submitted_at')
            if q_attempts.count() >= 2:
                first = q_attempts.first()
                last = q_attempts.last()
                if first.percentage < 60 and last.percentage == 100:
                    return 1
        return 0

    @staticmethod
    def _subjects_above_80(subject_counts, threshold):
        count = 0
        for subj, data in subject_counts.items():
            if len(data['scores']) >= 5 and sum(data['scores']) / len(data['scores']) >= 80:
                count += 1
        return count

    @staticmethod
    def get_target(badge):
        target_map = {
            1: 3, 2: 7, 3: 14, 4: 30, 5: 60, 6: 100, 7: 365,
            9: 1, 10: 10, 11: 50, 12: 100, 13: 250, 14: 100, 15: 5, 16: 500, 55: 50,
            17: 90, 18: 100, 19: 5, 20: 80, 21: 3, 22: 1,
            27: 5, 28: 5, 29: 5, 30: 5, 32: 5, 33: 10,
            34: 7, 35: 60, 37: 1, 38: 1, 39: 7,
            40: 5, 45: 1, 50: 70, 51: 20, 52: 20, 53: 10, 54: 100, 58: 10, 59: 95, 60: 100, 61: 1, 62: 1, 64: 1,
        }
        return target_map.get(badge.badge_id, 1)