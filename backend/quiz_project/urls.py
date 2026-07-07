from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/quizzes/', include('apps.quizzes.urls')),
    path('api/', include('apps.questions.urls')),
    path('api/', include('apps.attempts.urls')),
    path('api/', include('apps.leaderboard.urls')),   
    path('api/', include('apps.notifications.urls')),  
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/otp/', include('apps.otp.urls')),  
]