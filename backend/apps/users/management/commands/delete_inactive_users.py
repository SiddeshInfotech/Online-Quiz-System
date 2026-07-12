from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.users.models import User

class Command(BaseCommand):
    help = 'Permanently delete users deactivated for more than 30 days'

    def handle(self, *args, **options):
        cutoff_date = timezone.now() - timedelta(days=30)
        users_to_delete = User.objects.filter(
            is_active=False,
            deactivated_at__lte=cutoff_date
        )
        
        count = users_to_delete.count()
        if count > 0:
            users_to_delete.delete()
            self.stdout.write(self.style.SUCCESS(f"✅ Deleted {count} accounts older than 30 days."))
        else:
            self.stdout.write("✅ No accounts to delete.")
