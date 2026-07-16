from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Avg, Q, Sum
from apps.attempts.models import QuizAttempt, UserAnswer
from apps.users.models import Badge, UserBadge
from apps.quizzes.models import Quiz

class BadgeService:
    def __init__(self, user):
        self.user = user
        self.earned_badges = []

    def award_badges(self):
        self.earned_badges = []
        self._check_streak_badges()
        self._check_quiz_count_badges()
        self._check_accuracy_badges()
        self._check_subject_badges()
        self._check_time_dedication_badges()
        self._check_miscellaneous_badges()
        self._check_leaderboard_badges()  # Called from leaderboard view
        return self.earned_badges

    def _award_badge(self, badge_id):
        try:
            badge = Badge.objects.get(badge_id=badge_id)
            if not UserBadge.objects.filter(user=self.user, badge=badge).exists():
                UserBadge.objects.create(user=self.user, badge=badge)
                self.earned_badges.append(badge.name)
                return True
        except Badge.DoesNotExist:
            pass
        return False

    # ===== Streak Badges =====
    def _check_streak_badges(self):
        streak = self.user.current_streak if hasattr(self.user, 'current_streak') else 0
        badge_map = {1:3, 2:7, 3:14, 4:30, 5:60, 6:100, 7:365}
        for b_id, req in badge_map.items():
            if streak >= req:
                self._award_badge(b_id)
        # Comeback King (8) - simplified: check if user rebuilt after a loss
        # We'll implement later with history tracking

    # ===== Quiz Count Badges =====
    def _check_quiz_count_badges(self):
        attempts = QuizAttempt.objects.filter(user=self.user, submitted_at__isnull=False)
        total = attempts.count()
        # 9: 1, 10: 10, 11: 50, 12: 100, 13: 250, 16: 500, 55: 50 (but 55 already covered by 11? Actually 55 is also 50, but we'll award both)
        badge_map = {9:1, 10:10, 11:50, 12:100, 13:250, 16:500, 55:50}
        for b_id, req in badge_map.items():
            if total >= req:
                self._award_badge(b_id)
        # Century Club (14): 100 questions in one day
        today = timezone.now().date()
        today_qs = UserAnswer.objects.filter(attempt__user=self.user, attempt__submitted_at__date=today).count()
        if today_qs >= 100:
            self._award_badge(14)
        # Marathoner (15): 5 quizzes in one day
        today_qz = attempts.filter(submitted_at__date=today).count()
        if today_qz >= 5:
            self._award_badge(15)
        # Quiz Champion (54): win 100 quizzes (score >=80%)
        high_score = attempts.filter(percentage__gte=80).count()
        if high_score >= 100:
            self._award_badge(54)

    # ===== Accuracy Badges =====
    def _check_accuracy_badges(self):
        attempts = QuizAttempt.objects.filter(user=self.user, submitted_at__isnull=False).order_by('-submitted_at')
        # Sharp Shooter (17): 90%+ on 10+ Qs
        for att in attempts:
            if att.quiz.question_set.count() >= 10 and att.percentage >= 90:
                self._award_badge(17)
                break
        # Perfectionist (18): 100% on any quiz (min 5 Qs)
        if attempts.filter(percentage=100, quiz__question_set__gte=5).exists():
            self._award_badge(18)
        # Flawless Five (19): 10 consecutive 100% scores
        perfect_count = 0
        for att in attempts:
            if att.percentage == 100:
                perfect_count += 1
                if perfect_count >= 10:
                    self._award_badge(19)
                    break
            else:
                perfect_count = 0
        # Consistent Mind (20): 80%+ avg over last 20
        last_20 = attempts[:20]
        if last_20:
            avg = sum(a.percentage for a in last_20) / len(last_20)
            if avg >= 80:
                self._award_badge(20)
        # No Mistakes Allowed (21): 3 quizzes without incorrect
        no_mistake = 0
        for att in attempts:
            answers = UserAnswer.objects.filter(attempt=att)
            if answers.filter(is_correct=False).exists():
                no_mistake = 0
            else:
                no_mistake += 1
                if no_mistake >= 3:
                    self._award_badge(21)
                    break
        # Redemption Arc (22): 100% on previously failed quiz
        quiz_ids = attempts.values_list('quiz_id', flat=True).distinct()
        for qid in quiz_ids:
            q_attempts = attempts.filter(quiz_id=qid).order_by('submitted_at')
            if q_attempts.count() >= 2:
                first = q_attempts.first()
                last = q_attempts.last()
                if first.percentage < 60 and last.percentage == 100:
                    self._award_badge(22)
                    break
        # Peak Performer (59): 95%+ on 10+ Qs
        for att in attempts:
            if att.quiz.question_set.count() >= 10 and att.percentage >= 95:
                self._award_badge(59)
                break
        # Precision Master (60): 100 correct answers total
        total_correct = UserAnswer.objects.filter(attempt__user=self.user, is_correct=True).count()
        if total_correct >= 100:
            self._award_badge(60)
        # Speed Runner (61): complete in less than half time
        for att in attempts:
            time_taken = (att.submitted_at - att.started_at).total_seconds()
            time_limit = att.quiz.duration_minutes * 60
            if time_taken < time_limit / 2:
                self._award_badge(61)
                break

    # ===== Subject Badges =====
    def _check_subject_badges(self):
        attempts = QuizAttempt.objects.filter(user=self.user, submitted_at__isnull=False).select_related('quiz')
        # Group by subject: count quizzes with score >=80% per subject
        subject_data = {}
        for att in attempts:
            subj = att.quiz.subject
            if subj not in subject_data:
                subject_data[subj] = {'count': 0, 'scores': []}
            subject_data[subj]['count'] += 1
            subject_data[subj]['scores'].append(att.percentage)
        # Determine mastered subjects: at least 5 quizzes with >=80% avg
        mastered_subjects = {}
        for subj, data in subject_data.items():
            if data['count'] >= 5 and sum(data['scores']) / len(data['scores']) >= 80:
                mastered_subjects[subj] = True
        # Code Conqueror (27): 5 Coding quizzes mastered (subject contains "Coding" or question_type Coding)
        # We'll check if any subject is "Coding" or quiz.question_type == 'Coding'
        coding_mastered = 0
        for att in attempts:
            if att.quiz.question_type == 'Coding' and att.percentage >= 80:
                coding_mastered += 1
        if coding_mastered >= 5:
            self._award_badge(27)
        # Python Pro (28): 5 Python quizzes mastered (subject contains Python)
        python_mastered = attempts.filter(quiz__subject__icontains='Python', percentage__gte=80).count()
        if python_mastered >= 5:
            self._award_badge(28)
        # Java Genius (29): 5 Java quizzes mastered
        java_mastered = attempts.filter(quiz__subject__icontains='Java', percentage__gte=80).count()
        if java_mastered >= 5:
            self._award_badge(29)
        # C++ Champion (30): 5 C++ quizzes mastered
        cpp_mastered = attempts.filter(quiz__subject__icontains='C++', percentage__gte=80).count()
        if cpp_mastered >= 5:
            self._award_badge(30)
        # All-Rounder (32): 80%+ in 5 different subjects
        subj_80 = [s for s, data in subject_data.items() if sum(data['scores'])/len(data['scores']) >= 80]
        if len(subj_80) >= 5:
            self._award_badge(32)
        # Subject Master (33): 10 subjects mastered (>=80% avg)
        if len(subj_80) >= 10:
            self._award_badge(33)

    # ===== Time & Dedication Badges =====
    def _check_time_dedication_badges(self):
        attempts = QuizAttempt.objects.filter(user=self.user, submitted_at__isnull=False)
        # Daily Dedication (34): 7 consecutive days with at least one quiz
        # We'll check last 7 days
        today = timezone.now().date()
        days_with_quiz = 0
        for i in range(7):
            day = today - timedelta(days=i)
            if attempts.filter(submitted_at__date=day).exists():
                days_with_quiz += 1
            else:
                days_with_quiz = 0
                break
        if days_with_quiz >= 7:
            self._award_badge(34)
        # Time Keeper (35): 60 minutes in one day
        for day in [today - timedelta(days=i) for i in range(30)]:
            day_attempts = attempts.filter(submitted_at__date=day)
            total_time = day_attempts.aggregate(Sum('time_spent_seconds'))['time_spent_seconds__sum'] or 0
            if total_time >= 3600:  # 60 minutes
                self._award_badge(35)
                break
        # Early Bird (37): quiz before 9 AM
        for att in attempts:
            if att.submitted_at.hour < 9:
                self._award_badge(37)
                break
        # Night Owl (38): quiz after 10 PM
        for att in attempts:
            if att.submitted_at.hour >= 22:
                self._award_badge(38)
                break
        # Goal Getter (39): achieve today's goal 7 times
        # We'll track goal achievements in a separate model or check daily completion relative to goal
        # Simplified: count days where completed >= daily_quiz_goal
        daily_goal = getattr(self.user, 'daily_quiz_goal', 3)
        days_achieved = 0
        for day in [today - timedelta(days=i) for i in range(30)]:
            day_count = attempts.filter(submitted_at__date=day).count()
            if day_count >= daily_goal:
                days_achieved += 1
                if days_achieved >= 7:
                    self._award_badge(39)
                    break
            else:
                days_achieved = 0

    # ===== Miscellaneous Badges =====
    def _check_miscellaneous_badges(self):
        attempts = QuizAttempt.objects.filter(user=self.user, submitted_at__isnull=False)
        # Explorer (40): 5 different subjects
        subjects = attempts.values_list('quiz__subject', flat=True).distinct()
        if subjects.count() >= 5:
            self._award_badge(40)
        # Knowledge Seeker (58): 10 different subjects
        if subjects.count() >= 10:
            self._award_badge(58)
        # Risk Taker (50): Hard difficulty quiz with 70%+
        for att in attempts:
            if att.quiz.difficulty == 'Hard' and att.percentage >= 70:
                self._award_badge(50)
                break
        # Weekly Warrior (51): 20 quizzes in a week
        week_ago = timezone.now() - timedelta(days=7)
        week_count = attempts.filter(submitted_at__gte=week_ago).count()
        if week_count >= 20:
            self._award_badge(51)
        # Analyst (52): review answers of 20 questions (we'll track review actions separately)
        # Placeholder: we can increment a counter when user visits review page
        # For now, skip or implement with a review log model
        # Feedback Hero (64): submitted feedback
        from apps.feedback.models import Feedback
        if Feedback.objects.filter(user=self.user).exists():
            self._award_badge(64)
        # Hidden Gem (45): complete a quiz with less than 2 total attempts (by all users)
        for att in attempts:
            total_attempts = QuizAttempt.objects.filter(quiz=att.quiz, submitted_at__isnull=False).count()
            if total_attempts <= 2:
                self._award_badge(45)
                break

    # ===== Leaderboard Badges (called externally) =====
    def award_leaderboard_badge(self, rank):
        if rank <= 10:
            self._award_badge(53)  # Top Performer (10)
        if rank == 1:
            self._award_badge(62)  # Legend in Progress (1)