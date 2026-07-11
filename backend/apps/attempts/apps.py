from django.apps import AppConfig


class AttemptsConfig(AppConfig):
    name = 'apps.attempts'

    def ready(self):
        import apps.attempts.signals
