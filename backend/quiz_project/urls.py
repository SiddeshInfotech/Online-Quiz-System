from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static


def home(request):
    return JsonResponse({
        "message": "🚀 Online Quiz System Backend is Live!",
        "status": "healthy",
        "endpoints": [
            "api/auth/",
            "api/quizzes/",
            "api/analytics/",
        ]
    })

def health_check(request):
    return JsonResponse({
        "status": "OK",
        "message": "Server is running"
    })

urlpatterns = [
    path('', home, name='home'),
    path('api/health/', health_check, name='health-check'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/achievements/', include('apps.users.achievement_urls')),
    path('api/badges/', include('apps.users.badge_urls')),

    path('api/quizzes/', include('apps.quizzes.urls')),
    path('api/questions/', include('apps.questions.urls')),
    path('api/attempts/', include('apps.attempts.urls')),
    path('api/leaderboard/', include('apps.leaderboard.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/otp/', include('apps.otp.urls')),
    path('api/ai/', include('apps.ai_generator.urls')),
    path('api/feedback/', include('apps.feedback.urls')),
    path('api/support/', include('apps.support.urls')),
    path('api/custom_admin/', include('apps.custom_admin.urls')),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
