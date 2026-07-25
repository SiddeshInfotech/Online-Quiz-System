from typing import Any
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User
from .models import Feedback

class AdminFeedbackApiTests(TestCase):
    def setUp(self):
        self.client: Any = APIClient()
        
        self.student = User.objects.create_user(
            username='student1',
            email='student1@example.com',
            password='password123',
            role='Student'
        )
        
        self.admin = User.objects.create_user(
            username='admin1',
            email='admin1@example.com',
            password='adminpassword',
            is_staff=True,
            is_superuser=True,
            role='Admin'
        )
        
        self.feedback = Feedback.objects.create(
            user=self.student,
            rating=5,
            message='Great quiz platform! Very helpful.'
        )

    def test_public_feedback_list_excludes_hidden(self):
        self.client.force_authenticate(user=self.student)
        res = self.client.get('/api/feedback/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

        # Hide feedback
        self.feedback.is_hidden = True
        self.feedback.status = 'Hidden'
        self.feedback.save()

        res_hidden = self.client.get('/api/feedback/')
        self.assertEqual(res_hidden.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_hidden.data), 0)

    def test_admin_feedback_list_and_stats(self):
        self.client.force_authenticate(user=self.admin)
        
        # Test List
        res_list = self.client.get('/api/admin/feedback/')
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_list.data['results']), 1)

        # Test Stats
        res_stats = self.client.get('/api/admin/feedback/stats/')
        self.assertEqual(res_stats.status_code, status.HTTP_200_OK)
        self.assertEqual(res_stats.data['total_feedback'], 1)
        self.assertEqual(res_stats.data['pending'], 1)

    def test_admin_feedback_reply(self):
        self.client.force_authenticate(user=self.admin)
        
        # Empty reply should return 400
        bad_res = self.client.post(f'/api/admin/feedback/{self.feedback.id}/reply/', {'reply_message': ''})
        self.assertEqual(bad_res.status_code, status.HTTP_400_BAD_REQUEST)

        # Valid reply
        res = self.client.post(f'/api/admin/feedback/{self.feedback.id}/reply/', {'reply_message': 'Thank you for your feedback.'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
        self.feedback.refresh_from_db()
        self.assertEqual(self.feedback.status, 'Replied')
        self.assertEqual(self.feedback.reply_message, 'Thank you for your feedback.')
        self.assertEqual(self.feedback.replied_by, self.admin)

    def test_admin_feedback_hide(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post(f'/api/admin/feedback/{self.feedback.id}/hide/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
        self.feedback.refresh_from_db()
        self.assertTrue(self.feedback.is_hidden)
        self.assertEqual(self.feedback.status, 'Hidden')

    def test_admin_feedback_delete(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.delete(f'/api/admin/feedback/{self.feedback.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(Feedback.objects.filter(id=self.feedback.id).exists())
