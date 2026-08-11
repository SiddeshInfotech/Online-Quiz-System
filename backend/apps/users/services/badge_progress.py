from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Avg, Sum, Q
from apps.attempts.models import QuizAttempt, UserAnswer
from apps.questions.models import Question
from django.core.cache import cache
import time

class BadgeProgressHelper:
    
    @staticmethod
    def get_all_progress(user, badges=None):
        """
        Compute progress for all badges in one optimized pass.
        Results are cached for 10 minutes to avoid recomputation.
        """
        cache_key = f"badge_progress_{user.id}"
        cached_data = cache.get(cache_key)
        
        # If cache exists and we need all badges, return cached
        if cached_data is not None:
            print(f"[PROGRESS CACHE HIT] user={user.id}")
            if badges is None:
                return cached_data
            # Filter for specific badges if needed
            return {b.badge_id: cached_data.get(b.badge_id, 0) for b in badges}
        print(f"[PROGRESS CACHE MISS] user={user.id}, computing...")
        start = time.time()
        
        # --- Optimized Pass: Fetch recent attempts into list to avoid repetitive queries ---
        attempts_list = list(QuizAttempt.objects.filter(
            user=user, submitted_at__isnull=False
        ).select_related('quiz').only(
            'id', 'user_id', 'quiz_id', 'percentage', 'submitted_at', 'started_at', 'score'
        ).order_by('-submitted_at')[:100])
        
        attempt_ids = [a.id for a in attempts_list]
        
        # Single indexed query for UserAnswer statistics using attempt_ids
        total_correct = 0
        reviewed_count = 0
        attempts_with_mistakes = set()
        
        if attempt_ids:
            answer_stats = UserAnswer.objects.filter(attempt_id__in=attempt_ids).aggregate(
                total_correct=Count('id', filter=Q(is_correct=True)),
                reviewed_count=Count('id', filter=Q(reviewed=True))
            )
            total_correct = answer_stats['total_correct'] or 0
            reviewed_count = answer_stats['reviewed_count'] or 0

            attempts_with_mistakes = set(
                UserAnswer.objects.filter(attempt_id__in=attempt_ids, is_correct=False)
                .values_list('attempt_id', flat=True)
                .distinct()
            )

        # Pre-aggregate data in-memory
        total_attempts = len(attempts_list)
        perfect_count = sum(1 for a in attempts_list if a.percentage == 100)
        streak = getattr(user, 'current_streak', 0)
        
        # Question counts per quiz (single query)
        quiz_ids = [a.quiz_id for a in attempts_list]
        question_counts = {}
        if quiz_ids:
            q_counts = Question.objects.filter(quiz_id__in=quiz_ids).values('quiz_id').annotate(count=Count('id'))
            question_counts = {item['quiz_id']: item['count'] for item in q_counts}
        
        # Precompute QuizAttempt counts per quiz (scoped to user's quizzes)
        quiz_attempts_counts = {}
        if quiz_ids:
            quiz_attempts_counts = {
                item['quiz_id']: item['count']
                for item in QuizAttempt.objects.filter(quiz_id__in=quiz_ids, submitted_at__isnull=False)
                .values('quiz_id')
                .annotate(count=Count('id'))
            }

        # Subject stats in memory
        subject_data = {}
        for att in attempts_list:
            subj = att.quiz.subject or 'Uncategorized'
            if subj not in subject_data:
                subject_data[subj] = {'count': 0, 'scores': []}
            subject_data[subj]['count'] += 1
            subject_data[subj]['scores'].append(att.percentage)
        
        subject_avg = {}
        for subj, data in subject_data.items():
            subject_avg[subj] = sum(data['scores']) / len(data['scores']) if data['scores'] else 0
        
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
        max_no_mistake_streak = 0
        perfect_consecutive = 0
        max_perfect_consecutive = 0
        
        # Group attempts by quiz in memory
        attempts_by_quiz = {}
        # Group attempts by date in memory
        attempts_by_date = {}
        
        for att in reversed(attempts_list):
            # Grouping by quiz
            qid = att.quiz_id
            if qid not in attempts_by_quiz:
                attempts_by_quiz[qid] = []
            attempts_by_quiz[qid].append(att)
            
            # Grouping by date (local time)
            local_dt = timezone.localtime(att.submitted_at)
            day = local_dt.date()
            if day not in attempts_by_date:
                attempts_by_date[day] = []
            attempts_by_date[day].append(att)
            
            # Process attempt
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
                subj = (att.quiz.subject or '').lower()
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
            
            # Hidden gem (<=2 attempts globally)
            if not hidden_gem:
                total_quiz_attempts = quiz_attempts_counts.get(qid, 0)
                if total_quiz_attempts <= 2:
                    hidden_gem = True
            
            # No mistake streak
            if att.id in attempts_with_mistakes:
                no_mistake_streak = 0
            else:
                no_mistake_streak += 1
            if no_mistake_streak > max_no_mistake_streak:
                max_no_mistake_streak = no_mistake_streak
            
            # Consecutive perfect scores
            if att.percentage == 100:
                perfect_consecutive += 1
            else:
                perfect_consecutive = 0
            if perfect_consecutive > max_perfect_consecutive:
                max_perfect_consecutive = perfect_consecutive
        
        # Today's data and max daily stats
        today = timezone.localtime(timezone.now()).date()
        today_attempts = attempts_by_date.get(today, [])
        today_quiz_count = len(today_attempts)
        
        # Calculate max questions and max quizzes answered in any single day across all attempt dates
        max_day_quizzes = max([len(atts) for atts in attempts_by_date.values()], default=0)
        max_day_questions = 0
        for day, day_atts in attempts_by_date.items():
            q_cnt = sum(question_counts.get(a.quiz_id, 0) for a in day_atts)
            if q_cnt > max_day_questions:
                max_day_questions = q_cnt
        
        # Consecutive days (for badge 34)
        consecutive_days = 0
        for i in range(365):
            day = today - timedelta(days=i)
            if day in attempts_by_date:
                consecutive_days += 1
            else:
                break
        
        # Max time spent in a day (minutes)
        max_day_minutes = 0
        for day, day_attempts in attempts_by_date.items():
            total_sec = sum(a.time_spent_seconds or 0 for a in day_attempts)
            if total_sec // 60 > max_day_minutes:
                max_day_minutes = total_sec // 60
        
        # Goal achieved days
        daily_goal = getattr(user, 'daily_quiz_goal', 3)
        goal_days = 0
        for i in range(30):
            day = today - timedelta(days=i)
            day_count = len(attempts_by_date.get(day, []))
            if day_count >= daily_goal:
                goal_days += 1
            else:
                goal_days = 0
        
        # Early bird (5 AM - 9 AM) / Night owl (10 PM - 4 AM)
        early_bird = False
        night_owl = False
        for att in attempts_list:
            local_time = timezone.localtime(att.submitted_at)
            if 5 <= local_time.hour < 9:
                early_bird = True
            if local_time.hour >= 22 or 0 <= local_time.hour < 4:
                night_owl = True
            if early_bird and night_owl:
                break
        
        # Redemption (100% on previously failed quiz)
        redemption = 0
        for qid, q_atts in attempts_by_quiz.items():
            if len(q_atts) >= 2:
                first = q_atts[0]
                last = q_atts[-1]
                if first.percentage < 60 and last.percentage == 100:
                    redemption = 1
                    break
        
        # Weekly warrior (20 quizzes in last 7 days)
        week_ago = timezone.now() - timedelta(days=7)
        weekly_count = sum(1 for a in attempts_list if a.submitted_at >= week_ago)
        
        # --- Leaderboard Rank Calculation (Badges 53 & 62) ---
        global_rank = 999999
        if getattr(user, 'total_points', 0) > 0 or len(attempts_list) > 0:
            from apps.users.models import User as UserModel
            higher_points_count = UserModel.objects.filter(
                is_active=True,
                deactivated_at__isnull=True,
                total_points__gt=user.total_points
            ).count()
            global_rank = higher_points_count + 1

        top_performer = 1 if global_rank <= 10 else 0
        legend_rank1 = 1 if global_rank == 1 else 0

        # Comeback King (Badge 8)
        comeback_king = 1 if (getattr(user, 'longest_streak', 0) or 0) >= 30 and streak >= 1 else 0

        # --- Build progress map ---
        unique_quizzes = len(attempts_by_quiz)
        progress_map = {
            1: streak, 2: streak, 3: streak, 4: streak, 5: streak, 6: streak, 7: streak,
            8: comeback_king,
            9: total_attempts, 10: total_attempts, 11: total_attempts, 12: total_attempts,
            13: total_attempts, 14: max_day_questions, 15: max_day_quizzes, 16: total_attempts,
            17: 1 if sharp_shooter else 0,
            18: 1 if perfect_count >= 1 else 0,
            19: max_perfect_consecutive,
            20: BadgeProgressHelper._average_last_20(attempts_list),
            21: max_no_mistake_streak,
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
            53: top_performer,
            54: champion_count,
            55: total_attempts,
            58: subjects_count,
            59: 1 if peak_performer else 0,
            60: total_correct,
            61: 1 if speed_run else 0,
            62: legend_rank1,
            64: BadgeProgressHelper._get_feedback_count(user),
        }
        
        # Cache for 10 minutes (600 seconds)
        cache.set(cache_key, progress_map, 600)
        print(f"[PROGRESS CACHE SET] user={user.id}, took {time.time() - start:.2f}s")
        return progress_map

    @staticmethod
    def clear_progress_cache(user):
        """Clear the progress cache for a user."""
        cache.delete(f"badge_progress_{user.id}")

    @staticmethod
    def _average_last_20(attempts):
        last_20 = list(attempts[:20])
        if len(last_20) < 20:
            return 0
        return sum(a.percentage for a in last_20) / len(last_20)

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
            1: 3, 2: 7, 3: 14, 4: 30, 5: 60, 6: 100, 7: 365, 8: 1,
            9: 1, 10: 10, 11: 50, 12: 100, 13: 250, 14: 100, 15: 5, 16: 500, 55: 50,
            17: 1, 18: 1, 19: 10, 20: 80, 21: 3, 22: 1,
            27: 5, 28: 5, 29: 5, 30: 5, 32: 5, 33: 10,
            34: 7, 35: 60, 37: 1, 38: 1, 39: 7,
            40: 5, 45: 1, 50: 1, 51: 20, 52: 20, 53: 1, 54: 100, 58: 10, 59: 1, 60: 100, 61: 1, 62: 1, 
            64: 1,
        }
        bid = badge.badge_id if hasattr(badge, 'badge_id') else badge
        if bid in target_map:
            return target_map[bid]
        if hasattr(badge, 'requirement') and badge.requirement:
            import re
            numbers = re.findall(r'\d+', badge.requirement)
            if numbers:
                return int(numbers[0])
        return 1
    
    @staticmethod
    def is_requirement_met(user, badge):
        """Check if user meets badge requirement"""
        requirement = getattr(badge, 'requirement', '').lower()
        badge_id = getattr(badge, 'badge_id', badge)

        # ✅ SPECIAL CASE: Badge 20 (Consistent Mind – Average of last 20 quizzes >= 80%)
        if badge_id == 20:
            attempts = QuizAttempt.objects.filter(
                user=user, submitted_at__isnull=False
            ).order_by('-submitted_at')[:20]
            if attempts.count() < 20:
                return False
            avg = sum(a.percentage for a in attempts) / len(attempts)
            return avg >= 80

        # ✅ SPECIAL CASE: Badge 64 (Feedback Hero)
        if badge_id == 64:
            from apps.feedback.models import Feedback
            feedback_count = Feedback.objects.filter(user=user).count()
            import re
            numbers = re.findall(r'\d+', requirement)
            target = int(numbers[0]) if numbers else 1
            return feedback_count >= target

        # ✅ For all other badges, use generic progress map
        progress_map = BadgeProgressHelper.get_all_progress(user, [badge])
        current = progress_map.get(badge_id, 0)
        target = BadgeProgressHelper.get_target(badge)

        return current >= target
    
    @staticmethod
    def _get_feedback_count(user):
        try:
            from apps.feedback.models import Feedback
            return Feedback.objects.filter(user=user).count()
        except:
            return 0

    @staticmethod
    def get_met_badge_ids(user, badges):
        """
        Return the set of badge_ids whose requirement is met.
        """
        progress_map = BadgeProgressHelper.get_all_progress(user, badges)
        met = set()
        for badge in badges:
            bid = getattr(badge, 'badge_id', badge)
            target = BadgeProgressHelper.get_target(badge)
            current = progress_map.get(bid, 0)
            if current >= target:
                met.add(bid)
        return met

    @staticmethod
    def evaluate_user_badges(user):
        """
        Centralized Automated Badge Evaluator Trigger.
        Evaluates all badges for a user and automatically unlocks any unearned badges whose criteria are met.
        """
        return evaluate_user_badges(user)


def evaluate_user_badges(user):
    """
    Centralized Automated Badge Evaluator Trigger.
    Automatically executes after key user actions (quiz submission, leaderboard recalculation, login/streak updates).
    """
    if not user or not user.is_active:
        return []

    try:
        from apps.users.models import UserBadge, Badge
        earned_badge_ids = set(
            UserBadge.objects.filter(user=user).values_list("badge__badge_id", flat=True)
        )

        candidate_badges = [b for b in Badge.objects.all() if b.badge_id not in earned_badge_ids]
        if not candidate_badges:
            return []

        met_ids = BadgeProgressHelper.get_met_badge_ids(user, candidate_badges)

        new_userbadges = []
        newly_unlocked = []
        now = timezone.now()

        for badge in candidate_badges:
            if badge.badge_id in met_ids:
                ub, created = UserBadge.objects.get_or_create(
                    user=user,
                    badge=badge,
                    defaults={
                        'status': 'CLAIMABLE',
                        'earned_at': now
                    }
                )
                if created or ub.status == 'LOCKED':
                    if ub.status == 'LOCKED':
                        ub.status = 'CLAIMABLE'
                        ub.save()
                    new_userbadges.append(ub)
                    newly_unlocked.append(badge)

        if newly_unlocked:
            cache.delete(f"badges_all_{user.id}")
            cache.delete(f"user_badges_{user.id}")
            cache.delete(f"badge_count_{user.id}")
            BadgeProgressHelper.clear_progress_cache(user)

            try:
                from apps.notifications.services import notify_badge_claimable
                for badge in newly_unlocked:
                    notify_badge_claimable(user, badge)
            except Exception as e:
                print(f"[evaluate_user_badges] notify error: {e}")

            print(f"[evaluate_user_badges] Unlocked {len(newly_unlocked)} badge(s) for {user.username}: {[b.name for b in newly_unlocked]}")

        return newly_unlocked
    except Exception as e:
        print(f"[ERROR] in evaluate_user_badges for user {user.id}: {e}")
        return []
