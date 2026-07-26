from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from django.utils import timezone
from datetime import timedelta

from .models import Subscription
from apps.quizzes.models import Quiz


class UserSubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        sub, _ = Subscription.objects.get_or_create(user=user)
        
        is_pro = sub.is_pro
        plan = "PRO" if is_pro else "FREE"
        status_val = sub.status if is_pro else "ACTIVE"
        
        today = timezone.localdate()
        daily_quiz_used = Quiz.objects.filter(
            created_by=user,
            created_at__date=today
        ).count()

        daily_quiz_limit = 10 if is_pro else 3
        daily_quiz_remaining = max(0, daily_quiz_limit - daily_quiz_used)
        allowed_question_counts = [5, 10, 15, 20, 25] if is_pro else [5, 10]
        quiz_retries_allowed = 1 if is_pro else 0
        max_total_attempts = 2 if is_pro else 1

        days_remaining = 0
        if sub.end_date:
            delta = (sub.end_date - timezone.now()).days
            days_remaining = max(0, delta)
        elif is_pro:
            days_remaining = 30
        else:
            days_remaining = 365

        response_data = {
            "plan": plan,
            "subscription_plan": plan,
            "status": status_val,
            "subscription_status": status_val,
            "is_pro": is_pro,
            "billing_cycle": sub.billing_cycle or "MONTHLY",
            "subscription_start": sub.start_date.isoformat() if sub.start_date else None,
            "subscription_end": sub.end_date.isoformat() if sub.end_date else None,
            "renewal_date": sub.end_date.isoformat() if sub.end_date else None,
            "days_remaining": days_remaining,

            # Usage statistics for progress bars
            "daily_quiz_limit": daily_quiz_limit,
            "daily_quiz_used": daily_quiz_used,
            "daily_quiz_remaining": daily_quiz_remaining,

            # Question count limits
            "allowed_question_counts": allowed_question_counts,
            "max_questions_choice": max(allowed_question_counts),
            "coding_question_limit": max(allowed_question_counts),
            "coding_question_used": daily_quiz_used * 5,

            # Retry limits
            "quiz_retry_limit": quiz_retries_allowed,
            "quiz_retries_allowed": quiz_retries_allowed,
            "quiz_retry_used": 0,
            "max_total_attempts_per_quiz": max_total_attempts,

            "features": {
                "ai_quiz_generation": True,
                "extended_question_counts": is_pro,
                "quiz_retries": is_pro,
                "detailed_ai_explanations": is_pro,
                "advanced_analytics": is_pro,
                "priority_support": is_pro,
                "premium_badges": is_pro,
                "export_results": is_pro
            }
        }
        return Response(response_data, status=status.HTTP_200_OK)


class SubscriptionPlansView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        plans = [
            {
                "id": 1,
                "plan_key": "FREE",
                "name": "FREE",
                "display_name": "Free Tier",
                "price": 0,
                "price_inr": 0,
                "price_usd": 0,
                "billing_cycle": "FOREVER",
                "daily_quiz_limit": 3,
                "allowed_question_counts": [5, 10],
                "coding_question_options": [5, 10],
                "quiz_retry_limit": 0,
                "quiz_retries_allowed": 0,
                "max_total_attempts_per_quiz": 1,
                "features": [
                    "3 AI Quiz Generations Per Day",
                    "5 or 10 Questions Per Quiz",
                    "1 Attempt Per Quiz (No Retries)",
                    "Basic Analytics & Badges"
                ]
            },
            {
                "id": 2,
                "plan_key": "PRO",
                "name": "PRO",
                "display_name": "QuizGen Pro",
                "price": 9.99,
                "price_inr": 299,
                "price_usd": 9.99,
                "billing_cycle": "MONTHLY",
                "daily_quiz_limit": 10,
                "allowed_question_counts": [5, 10, 15, 20, 25],
                "coding_question_options": [5, 10, 15, 20, 25],
                "quiz_retry_limit": 1,
                "quiz_retries_allowed": 1,
                "max_total_attempts_per_quiz": 2,
                "features": [
                    "10 AI Quiz Generations Per Day",
                    "5, 10, 15, 20, or 25 Questions Choice",
                    "1 Retry Allowed Per Quiz (2 Attempts)",
                    "Detailed AI Explanations Engine",
                    "Advanced Analytics & Priority Badges",
                    "Priority Support",
                    "Export Results"
                ]
            }
        ]
        return Response(plans, status=status.HTTP_200_OK)


class SubscriptionUpgradeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        billing_cycle = request.data.get('billing_cycle', 'MONTHLY').upper()
        if billing_cycle not in ['MONTHLY', 'YEARLY']:
            billing_cycle = 'MONTHLY'

        sub, _ = Subscription.objects.get_or_create(user=user)
        sub.plan = 'PRO'
        sub.status = 'ACTIVE'
        sub.billing_cycle = billing_cycle
        sub.start_date = timezone.now()
        
        if billing_cycle == 'YEARLY':
            sub.end_date = timezone.now() + timedelta(days=365)
        else:
            sub.end_date = timezone.now() + timedelta(days=30)
            
        sub.cancellation_requested = False
        sub.save()

        return Response({
            "message": "Successfully upgraded to QuizGen Pro!",
            "plan": "PRO",
            "status": "ACTIVE",
            "is_pro": True,
            "billing_cycle": sub.billing_cycle,
            "subscription_start": sub.start_date.isoformat(),
            "subscription_end": sub.end_date.isoformat()
        }, status=status.HTTP_200_OK)


class SubscriptionCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        sub = Subscription.objects.filter(user=user).first()
        if sub:
            sub.cancellation_requested = True
            sub.status = 'CANCELLED'
            sub.plan = 'FREE'
            sub.save()

        return Response({
            "message": "Subscription cancelled successfully. You are now on the Free tier.",
            "plan": "FREE",
            "status": "CANCELLED",
            "is_pro": False
        }, status=status.HTTP_200_OK)
