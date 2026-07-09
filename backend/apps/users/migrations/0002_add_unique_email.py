from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('users', '0001_initial'),  # Must match the initial migration
    ]

    operations = [
        migrations.RunSQL(
            sql='ALTER TABLE users_user MODIFY email VARCHAR(254) UNIQUE;',
            reverse_sql='ALTER TABLE users_user MODIFY email VARCHAR(254);'
        ),
    ]