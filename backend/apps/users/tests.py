from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.quizzes.models import Quiz, QuizCategory
from apps.questions.models import Question, QuestionOption
from apps.attempts.models import QuizAttempt
from apps.users.models import Badge

User = get_user_model()

class BackendModulesVerificationTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create normal user
        self.user = User.objects.create_user(
            username="student_user",
            email="student@example.com",
            password="Password123!",
            full_name=None, # Test null full_name handling
            is_active=True
        )
        # Create admin user
        self.admin_user = User.objects.create_superuser(
            username="admin_user",
            email="admin@example.com",
            password="Password123!",
            full_name="Admin Boss",
            is_active=True,
            role="Admin"
        )
        # Create Quiz & Questions
        self.category = QuizCategory.objects.create(category_name="Python")
        self.quiz = Quiz.objects.create(
            title="Python Basics",
            description="Test Python quiz",
            subject="Python",
            difficulty="EASY",
            status="published",
            duration_minutes=15,
            total_marks=2,
            category=self.category,
            created_by=self.admin_user
        )
        self.q1 = Question.objects.create(
            quiz=self.quiz,
            question_text="What is 2+2?",
            question_type="MCQ",
            correct_answer="4",
            marks=1,
            question_order=1
        )
        self.opt1 = QuestionOption.objects.create(question=self.q1, option_text="3", is_correct=False)
        self.opt2 = QuestionOption.objects.create(question=self.q1, option_text="4", is_correct=True)
        self.opt3 = QuestionOption.objects.create(question=self.q1, option_text="5", is_correct=False)
        self.opt4 = QuestionOption.objects.create(question=self.q1, option_text="6", is_correct=False)

        # Seed a badge
        self.badge = Badge.objects.create(
            badge_id=1,
            name="First Steps",
            description="Complete your first quiz",
            image_url="http://example.com/icon.png",
            category="GENERAL",
            rarity="COMMON",
            requirement="COMPLETED_QUIZZES_1"
        )

    def test_module_1_quiz_options(self):
        self.client.force_authenticate(user=self.user)
        # Test 1: Start attempt via POST /api/quizzes/{quiz_id}/start/
        res_quiz_start = self.client.post(f'/api/quizzes/{self.quiz.id}/start/')
        self.assertEqual(res_quiz_start.status_code, 200)
        data_quiz_start = res_quiz_start.json()
        self.assertIn('attempt_id', data_quiz_start)
        self.assertIn('quiz', data_quiz_start)
        self.assertIn('timer', data_quiz_start)
        self.assertIn('questions', data_quiz_start)
        self.assertTrue(len(data_quiz_start['questions']) > 0)
        q_item = data_quiz_start['questions'][0]
        self.assertIn('id', q_item)
        self.assertIn('question_id', q_item)
        self.assertEqual(q_item['id'], self.q1.id)
        self.assertEqual(q_item['question_id'], self.q1.id)
        self.assertIn('question_text', q_item)
        self.assertIn('options', q_item)
        self.assertEqual(q_item['options'], ["3", "4", "5", "6"])

        # Test 2: Start attempt via POST /api/attempts/start/
        res = self.client.post('/api/attempts/start/', {'quiz_id': self.quiz.id}, format='json')
        self.assertIn(res.status_code, [200, 201])
        data = res.json()
        self.assertIn('timer', data)
        self.assertIn('quiz', data)
        questions = data.get('questions', [])
        self.assertTrue(len(questions) > 0)
        first_q = questions[0]
        self.assertIn('id', first_q)
        self.assertIn('question_id', first_q)
        self.assertIn('options', first_q)
        options = first_q['options']
        # Must be a clean, non-null list of strings
        self.assertIsInstance(options, list)
        self.assertEqual(options, ["3", "4", "5", "6"])

        # Test submit attempt with string answer
        attempt_id = data['attempt_id']
        submit_res = self.client.post(
            f'/api/attempts/{attempt_id}/submit/',
            {'answers': [{'question_id': self.q1.id, 'selected_option_id': '4'}]},
            format='json'
        )
        self.assertEqual(submit_res.status_code, 200)

    def test_module_2_custom_admin_health(self):
        self.client.force_authenticate(user=self.admin_user)
        # Analytics
        res_analytics = self.client.get('/api/custom_admin/analytics/')
        self.assertEqual(res_analytics.status_code, 200)
        # Users list (with user having null full_name and 0 attempt history)
        res_users = self.client.get('/api/custom_admin/users/')
        self.assertEqual(res_users.status_code, 200)
        users_data = res_users.json()
        self.assertTrue(len(users_data) >= 2)

    def test_module_3_badges_payload(self):
        self.client.force_authenticate(user=self.user)
        # GET /api/badges/all/
        res_badges = self.client.get('/api/badges/all/')
        self.assertEqual(res_badges.status_code, 200)
        data = res_badges.json()
        self.assertIn('badges', data)
        badge_item = data['badges'][0]
        
        required_keys = [
            'badge_id', 'badge_name', 'description', 'icon_url', 'category',
            'is_unlocked', 'is_claimed', 'current_progress', 'required_target',
            'progress_percentage', 'earned_at'
        ]
        for key in required_keys:
            self.assertIn(key, badge_item, f"Missing key: {key}")

        self.assertIsInstance(badge_item['is_unlocked'], bool)
        self.assertIsInstance(badge_item['is_claimed'], bool)
        self.assertIsInstance(badge_item['current_progress'], int)
        self.assertIsInstance(badge_item['required_target'], int)
        self.assertIsInstance(badge_item['progress_percentage'], (float, int))

        # GET /api/achievements/
        res_achievements = self.client.get('/api/achievements/')
        self.assertEqual(res_achievements.status_code, 200)

    def test_module_4_profile_and_settings(self):
        self.client.force_authenticate(user=self.user)
        # GET profile
        res_get_profile = self.client.get('/api/users/profile/')
        self.assertEqual(res_get_profile.status_code, 200)

        # PATCH profile
        res_patch_profile = self.client.patch(
            '/api/users/profile/',
            {'full_name': 'New Student Name', 'bio': 'Learning python'},
            format='json'
        )
        self.assertEqual(res_patch_profile.status_code, 200)
        patched_data = res_patch_profile.json()
        self.assertEqual(patched_data.get('user', {}).get('full_name'), 'New Student Name')

        # GET settings
        res_get_settings = self.client.get('/api/users/settings/')
        self.assertEqual(res_get_settings.status_code, 200)

        # PATCH settings
        res_patch_settings = self.client.patch(
            '/api/users/settings/',
            {'appearance': 'dark', 'daily_quiz_goal': 5},
            format='json'
        )
        self.assertEqual(res_patch_settings.status_code, 200)

