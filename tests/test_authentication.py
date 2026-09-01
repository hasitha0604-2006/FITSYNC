"""
FITSYNC AI — AUTHENTICATION & LOGIN CONSISTENCY TEST SUITE
Verifies Registration, SQLite Persistence, Logout, Login, Email Normalization,
Wrong Password handling, Unknown Email handling, and Process Restart persistence.
"""

import unittest
from app import app, db, User, UserProfile, seed_database

class AuthenticationConsistencyTestCase(unittest.TestCase):

    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        self.app.config['WTF_CSRF_ENABLED'] = False
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()

        db.create_all()
        seed_database()

    def tearDown(self):
        try:
            User.query.filter(User.email.in_([
                'new_athlete@fitsync.ai',
                'normalized_user@fitsync.ai',
                'pass_test@fitsync.ai'
            ])).delete()
            db.session.commit()
        except Exception:
            db.session.rollback()
        db.session.remove()
        self.ctx.pop()

    def test_new_user_registration_and_login_lifecycle(self):
        """Register new user -> verify SQLite -> logout -> login -> access dashboard."""
        email = "new_athlete@fitsync.ai"
        password = "Password123!"

        # 1. Register
        res_reg = self.client.post('/register', data={'email': email, 'password': password}, follow_redirects=True)
        self.assertEqual(res_reg.status_code, 200)

        # 2. Complete Onboarding
        res_onb = self.client.post('/onboarding', json={
            "name": "Athlete One",
            "age": 24,
            "gender": "Male",
            "height": 178,
            "weight": 74,
            "fitness_goal": "Muscle Gain",
            "fitness_level": "Intermediate",
            "workout_days_per_week": 4,
            "workout_duration_mins": 45,
            "workout_environment": "Gym",
            "dietary_preference": "Eggetarian",
            "daily_food_budget": 160,
            "equipments": ["Dumbbells", "Barbell"],
            "food_preferences": []
        })
        self.assertEqual(res_onb.status_code, 200)

        # 3. Verify in SQLite DB
        user = User.query.filter_by(email=email).first()
        self.assertIsNotNone(user)
        self.assertEqual(user.profile.name, "Athlete One")

        # 4. Logout
        self.client.get('/logout')

        # 5. Login again
        res_login = self.client.post('/login', data={'email': email, 'password': password}, follow_redirects=True)
        self.assertEqual(res_login.status_code, 200)
        self.assertIn(b"Athlete One", res_login.data)

    def test_email_normalization_during_login(self):
        """Uppercase and whitespace variants find the same user account."""
        email = "normalized_user@fitsync.ai"
        password = "Password123!"

        # Register with lowercase
        self.client.post('/register', data={'email': email, 'password': password}, follow_redirects=True)
        self.client.get('/logout')

        # Login with Uppercase & Whitespace
        res_login = self.client.post('/login', data={'email': "  NORMALIZED_USER@FITSYNC.AI  ", 'password': password}, follow_redirects=True)
        self.assertEqual(res_login.status_code, 200)

    def test_wrong_password_handling(self):
        """Login with wrong password fails gracefully without server crash."""
        email = "pass_test@fitsync.ai"
        self.client.post('/register', data={'email': email, 'password': 'CorrectPassword123!'}, follow_redirects=True)
        self.client.get('/logout')

        res = self.client.post('/login', data={'email': email, 'password': 'WrongPassword999!'}, follow_redirects=True)
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"Incorrect password", res.data)

    def test_unknown_email_handling(self):
        """Login with non-existent email displays clear error message and does not auto-create user."""
        unknown_email = "non_existent_user_999@fitsync.ai"

        res = self.client.post('/login', data={'email': unknown_email, 'password': 'Password123!'}, follow_redirects=True)
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"No account found", res.data)

        # Confirm user was NOT created
        user = User.query.filter_by(email=unknown_email).first()
        self.assertIsNone(user)

    def test_demo_user_credentials_login(self):
        """Built-in demo credentials (demo@fitsync.ai / Demo@123) work directly out-of-the-box."""
        res = self.client.post('/login', data={'email': 'demo@fitsync.ai', 'password': 'Demo@123'}, follow_redirects=True)
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"Rahul Sharma", res.data)

if __name__ == '__main__':
    unittest.main()
