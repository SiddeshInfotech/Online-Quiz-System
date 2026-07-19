# backend/apps/attempts/tasks.py

import threading
from django.core.cache import cache
from django.db import connection
from apps.users.models import User
from apps.users.services.badge_progress import BadgeProgressHelper

def compute_badge_progress_async(user_id):
    """Run badge progress computation in background thread."""
    def _compute():
        try:
            # Close any existing DB connections to avoid conflicts
            connection.close()
            
            user = User.objects.get(id=user_id)
            print(f"🔄 Background: Computing badge progress for user {user_id}")
            
            # This will compute and cache
            BadgeProgressHelper.get_all_progress(user, None)
            
            print(f"✅ Background: Badge progress cached for user {user_id}")
        except Exception as e:
            print(f"❌ Background: Error computing progress: {e}")
    
    # Run in background thread
    thread = threading.Thread(target=_compute)
    thread.daemon = True
    thread.start()


def process_quiz_submission_background(user_id, attempt_id):
    """
    Update user statistics, calculate/unlock badge achievements, update leaderboard metrics,
    and trigger daily goal notifications in an asynchronous background thread.
    """
    def _run():
        try:
            # Close existing connection to ensure fresh connection in thread
            connection.close()
            
            from apps.attempts.models import QuizAttempt, Result
            from apps.users.models import User, UserBadge
            from django.db.models import Sum
            from django.utils import timezone
            from apps.attempts.signals import _unlock_badges_for_user
            
            user = User.objects.get(id=user_id)
            attempt = QuizAttempt.objects.get(id=attempt_id)
            
            print(f"🔄 Background: Processing quiz submit stats/badges for user {user_id}, attempt {attempt_id}")
            
            # Sum of quiz scores across all completed attempts
            quiz_score_total = QuizAttempt.objects.filter(
                user=user, submitted_at__isnull=False
            ).aggregate(total=Sum('score'))['total'] or 0

            quizzes_completed = QuizAttempt.objects.filter(
                user=user, submitted_at__isnull=False
            ).count()

            # --- Calculate current streak and longest streak ---
            from datetime import timedelta, datetime
            today = timezone.localdate()
            streak = 0
            check_date = today

            # Check if user has submitted any quiz today
            day_start = timezone.make_aware(datetime.combine(today, datetime.min.time()))
            day_end = timezone.make_aware(datetime.combine(today, datetime.max.time()))
            has_today = QuizAttempt.objects.filter(
                user=user,
                submitted_at__isnull=False,
                submitted_at__range=(day_start, day_end)
            ).exists()

            if not has_today:
                check_date = today - timedelta(days=1)

            while True:
                d_start = timezone.make_aware(datetime.combine(check_date, datetime.min.time()))
                d_end = timezone.make_aware(datetime.combine(check_date, datetime.max.time()))
                attempts_on_day = QuizAttempt.objects.filter(
                    user=user,
                    submitted_at__isnull=False,
                    submitted_at__range=(d_start, d_end)
                ).exists()

                if attempts_on_day:
                    streak += 1
                    check_date -= timedelta(days=1)
                else:
                    break

            longest_streak = max(getattr(user, 'longest_streak', 0) or 0, streak)

            # Retrieve badges XP
            badge_xp = UserBadge.objects.filter(
                user=user, status='CLAIMED'
            ).aggregate(total=Sum('badge__xp_reward'))['total'] or 0

            # Update User profile statistics
            User.objects.filter(id=user.id).update(
                total_points=quiz_score_total + badge_xp,
                quizzes_completed=quizzes_completed,
                current_streak=streak,
                longest_streak=longest_streak,
                last_active_date=today
            )
            
            # Update the in-memory user object attributes for subsequent badge checks
            user.current_streak = streak
            user.longest_streak = longest_streak
            user.last_active_date = today
            user.total_points = quiz_score_total + badge_xp
            user.quizzes_completed = quizzes_completed
            
            # Clear leaderboard cache so it recalculates with new stats
            cache.delete("leaderboard_all_rankings")

            # Auto-unlock badges (it has built-in cache clearances & notification triggers)
            _unlock_badges_for_user(user)

            # Notify once/day when the user completes their daily quiz goal.
            try:
                from apps.notifications.services import notify_daily_goal_complete
                target = getattr(user, 'daily_quiz_goal', 3) or 3
                today = timezone.localdate()
                completed_today = QuizAttempt.objects.filter(
                    user=user, submitted_at__date=today
                ).exclude(submitted_at__isnull=True).count()
                if completed_today >= target:
                    notify_daily_goal_complete(user, completed_today, target)
            except Exception as e:
                print(f"[daily-goal-notify] skipped in background thread: {e}")
                
            print(f"✅ Background: Finished processing submission for user {user_id}")
        except Exception as e:
            print(f"❌ Background: Error processing quiz submission: {e}")

    thread = threading.Thread(target=_run)
    thread.daemon = True
    thread.start()