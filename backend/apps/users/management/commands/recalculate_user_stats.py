from django.core.management.base import BaseCommand
from django.core.cache import cache
from apps.users.models import User
from apps.users.services.points_service import recalculate_user_points_and_stats


class Command(BaseCommand):
    help = "Recalculates and repairs total_points, quizzes_completed, xp, and level for all users."

    def handle(self, *args, **options):
        self.stdout.write("🔄 Starting recalculation of user points and statistics...")
        
        users = User.objects.all()
        recalculated_count = 0

        for user in users:
            old_points = user.total_points
            old_quizzes = user.quizzes_completed

            stats = recalculate_user_points_and_stats(user)

            new_points = user.total_points
            new_quizzes = user.quizzes_completed

            self.stdout.write(
                f"👤 User '{user.username}' (ID: {user.id}): "
                f"Points: {old_points} -> {new_points} (Quiz Score: {stats['quiz_score_total']}, Badge XP: {stats['badge_xp']}) | "
                f"Quizzes Completed: {old_quizzes} -> {new_quizzes}"
            )
            recalculated_count += 1

        # Clear leaderboard cache explicitly
        cache.delete("leaderboard_all_rankings")

        self.stdout.write(
            self.style.SUCCESS(
                f"🎉 Successfully recalculated stats for {recalculated_count} user(s) and flushed leaderboard cache!"
            )
        )
