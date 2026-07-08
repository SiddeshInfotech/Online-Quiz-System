from django.db import migrations
from django.contrib.auth import get_user_model

def create_superuser(apps, schema_editor):
    User = get_user_model()
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser(
            username='admin',
            email='admin@test.com',
            password='Admin@123'
        )
        print("✅ Superuser created successfully via migration.")

class Migration(migrations.Migration):
    dependencies = [
        ('users', '0003_initial'),  # Make sure this matches your last migration
    ]
    operations = [
        migrations.RunPython(create_superuser),
    ]