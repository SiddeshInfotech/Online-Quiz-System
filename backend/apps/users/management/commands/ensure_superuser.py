from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password

class Command(BaseCommand):
    help = "Enforce superuser permissions for the test admin user"

    def handle(self, *args, **options):
        User = get_user_model()
        email = 'admin@test.com'
        
        try:
            user = User.objects.get(email=email)
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True
            user.role = 'Admin'
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Successfully updated superuser {email}"))
        except User.DoesNotExist:
            try:
                user = User.objects.get(username='admin')
                user.email = email
                user.is_staff = True
                user.is_superuser = True
                user.is_active = True
                user.role = 'Admin'
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Successfully updated admin user with email {email}"))
            except User.DoesNotExist:
                User.objects.create(
                    username='admin',
                    email=email,
                    password=make_password('admin123', hasher='pbkdf2_sha256'),
                    is_staff=True,
                    is_superuser=True,
                    is_active=True,
                    role='Admin'
                )
                self.stdout.write(self.style.SUCCESS(f"Successfully created superuser admin ({email})"))
