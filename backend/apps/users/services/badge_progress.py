from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Avg, Sum, Q
from apps.attempts.models import QuizAttempt, UserAnswer
from apps.questions.models import Question

class BadgeProgressHelper:
    @staticmethod
    def get_all_progress(user, badges):
        """Compute progress for all badges in one optimized pass."""
        # Fetch user data once with necessary relations
        attempts = QuizAttempt.objects.filter(
            user=user, submitted_at__isnull=False
        ).select_related('quiz').order_by('-submitted_at')
        
        answers = UserAnswer.objects.filter(attempt__user=user)
        
        # --- Pre-aggregate data ---
        total_attempts = attempts.count()
        total_correct = answers.filter(is_correct=True).count()
        reviewed_count = answers.filter(reviewed=True).count()
        perfect_count = attempts.filter(percentage=100).count()
        streak = getattr(user, 'current_streak', 0)
        
        # Question counts per quiz (single query)
        quiz_ids = list(attempts.values_list('quiz_id', flat=True))
        question_counts = {}
        if quiz_ids:
            q_counts = Question.objects.filter(quiz_id__in=quiz_ids).values('quiz_id').annotate(count=Count('id'))
            question_counts = {item['quiz_id']: item['count'] for item in q_counts}
        
        # Subject stats
        subject_data = {}
        for att in attempts:
            subj = att.quiz.subject
            if subj not in subject_data:
                subject_data[subj] = {'count': 0, 'scores': []}
            subject_data[subj]['count'] += 1
            subject_data[subj]['scores'].append(att.percentage)
        
        subject_avg = {}
        for subj, data in subject_data.items():
            subject_avg[subj] = sum(data['scores']) / len(data['scores']) if data['scores'] else 0
        
        # Mastered subjects (>=80% avg and at least 5 quizzes)
        mastered_subjects = {
            subj for subj, avg in subject_avg.items() 
            if subject_data[subj]['count'] >= 5 and avg >= 80
        }
        
        # Distinct subjects
        subjects_count = len(subject_data)
        
        # Coding/Python/Java/C++ mastered
        coding_quiz_ids = set()
        python_quiz_ids = set()
        java_quiz_ids = set()
        cpp_quiz_ids = set()
        sharp_shooter = False
        peak_performer = False
        speed_run = False
        hidden_gem = False
        hard_high_score = False
        champion_count = 0
        no_mistake_streak = 0
        perfect_consecutive = 0
        
        for att in attempts:
            qid = att.quiz_id
            q_count = question_counts.get(qid, 0)
            
            # Sharp Shooter / Peak Performer
            if q_count >= 10:
                if att.percentage >= 90:
                    sharp_shooter = True
                if att.percentage >= 95:
                    peak_performer = True
            
            # Coding, Python, Java, C++
            if att.percentage >= 80:
                qtype = att.quiz.question_type
                subj = att.quiz.subject.lower()
                if qtype == 'Coding':
                    coding_quiz_ids.add(qid)
                if 'python' in subj:
                    python_quiz_ids.add(qid)
                if 'java' in subj:
                    java_quiz_ids.add(qid)
                if 'c++' in subj:
                    cpp_quiz_ids.add(qid)
            
            # Champion (80%+ quizzes)
            if att.percentage >= 80:
                champion_count += 1
            
            # Hard quiz with 70%+
            if att.quiz.difficulty == 'Hard' and att.percentage >= 70:
                hard_high_score = True
            
            # Speed runner (<50% time)
            time_taken = (att.submitted_at - att.started_at).total_seconds()
            time_limit = att.quiz.duration_minutes * 60
            if time_limit > 0 and time_taken < time_limit / 2:
                speed_run = True
            
            # Hidden gem (<=2 attempts)
            if not hidden_gem:
                total_quiz_attempts = QuizAttempt.objects.filter(quiz=att.quiz, submitted_at__isnull=False).count()
                if total_quiz_attempts <= 2:
                    hidden_gem = True
            
            # No mistake streak
            user_answers = UserAnswer.objects.filter(attempt=att)
            if user_answers.filter(is_correct=False).exists():
                no_mistake_streak = 0
            else:
                no_mistake_streak += 1
            
            # Consecutive perfect scores
            if att.percentage == 100:
                perfect_consecutive += 1
            else:
                perfect_consecutive = 0
        
        # Today's data
        today = timezone.localtime(timezone.now()).date()
        today_attempts = attempts.filter(submitted_at__date=today)
        today_questions = UserAnswer.objects.filter(attempt__user=user, attempt__submitted_at__date=today).count()
        today_quiz_count = today_attempts.count()
        
        # Consecutive days (for badge 34)
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
        
        # Goal achieved days
        daily_goal = getattr(user, 'daily_quiz_goal', 3)
        goal_days = 0
        for day in [today - timedelta(days=i) for i in range(30)]:
            day_count = attempts.filter(submitted_at__date=day).count()
            if day_count >= daily_goal:
                goal_days += 1
            else:
                goal_days = 0
        
        # Early bird / Night owl
        early_bird = False
        night_owl = False
        for att in attempts:
            local_time = timezone.localtime(att.submitted_at)
            if local_time.hour < 9:
                early_bird = True
            if local_time.hour >= 22:
                night_owl = True
            if early_bird and night_owl:
                break
        
        # Redemption (100% on previously failed quiz)
        redemption = 0
        quiz_ids_distinct = attempts.values_list('quiz_id', flat=True).distinct()
        for qid in quiz_ids_distinct:
            q_attempts = attempts.filter(quiz_id=qid).order_by('submitted_at')
            if q_attempts.count() >= 2:
                first = q_attempts.first()
                last = q_attempts.last()
                if first.percentage < 60 and last.percentage == 100:
                    redemption = 1
                    break
        
        # Weekly warrior (20 quizzes in last 7 days)
        week_ago = timezone.now() - timedelta(days=7)
        weekly_count = attempts.filter(submitted_at__gte=week_ago).count()
        
        # --- Build progress map ---
        progress_map = {
            1: streak, 2: streak, 3: streak, 4: streak, 5: streak, 6: streak, 7: streak,
            8: 0,  # Comeback King not implemented
            9: total_attempts, 10: total_attempts, 11: total_attempts, 12: total_attempts,
            13: total_attempts, 14: today_questions, 15: today_quiz_count, 16: total_attempts,
            17: 1 if sharp_shooter else 0,
            18: perfect_count,
            19: perfect_consecutive,
            20: BadgeProgressHelper._average_last_20(attempts),
            21: no_mistake_streak,
            22: redemption,
            27: len(coding_quiz_ids),
            28: len(python_quiz_ids),
            29: len(java_quiz_ids),
            30: len(cpp_quiz_ids),
            32: BadgeProgressHelper._subjects_above_80(subject_data, threshold=5),
            33: BadgeProgressHelper._subjects_above_80(subject_data, threshold=10),
            34: consecutive_days,
            35: max_day_minutes,
            37: 1 if early_bird else 0,
            38: 1 if night_owl else 0,
            39: goal_days,
            40: subjects_count,
            45: 1 if hidden_gem else 0,
            50: 1 if hard_high_score else 0,
            51: weekly_count,
            52: reviewed_count,
            53: 0,  # Top Performer (handled externally)
            54: champion_count,
            55: total_attempts,
            58: subjects_count,
            59: 1 if peak_performer else 0,
            60: total_correct,
            61: 1 if speed_run else 0,
            62: 0,  # Legend in Progress (handled externally)
            64: 1,  # Feedback Hero (simplified)
        }
        
        return progress_map

    @staticmethod
    def _average_last_20(attempts):
        last_20 = list(attempts[:20])
        if last_20:
            return sum(a.percentage for a in last_20) / len(last_20)
        return 0

    @staticmethod
    def _subjects_above_80(subject_data, threshold):
        count = 0
        for subj, data in subject_data.items():
            if data['count'] >= 5 and sum(data['scores']) / len(data['scores']) >= 80:
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