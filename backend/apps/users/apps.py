from django.apps import AppConfig
from django.db.models.signals import post_migrate

def create_superuser(sender, **kwargs):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    username = 'admin'
    email = 'admin@test.com'
    password = 'Admin@123'
    
    # Check if user already exists
    if not User.objects.filter(username=username).exists():
        User.objects.create_superuser(
            username=username,
            email=email,
            password=password
        )
        print(f"✅ SUPERUSER CREATED: {username} (Email: {email})")
    else:
        print(f"ℹ️ SUPERUSER ALREADY EXISTS: {username}")

class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'

    def ready(self):
        # Connect the signal to run after migrations are complete
        post_migrate.connect(create_superuser, sender=self)