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