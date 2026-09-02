"""
FITSYNC AI — PHASE 1 ACCEPTANCE TEST SUITE
Verifies real-file SQLite database persistence (instance/fitsync.db), authentication flow,
profile persistence, app restart persistence, and two-user data isolation.
"""

import sys
import unittest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app import app, db, User, UserProfile, WorkoutPlan, MealPlan, CustomFood, seed_database, run_migrations
from reset_database import reset_database

class Phase1AcceptanceTestCase(unittest.TestCase):

    def setUp(self):
        # Perform explicit developer database reset before test run
        reset_database()
        self.app = app
        self.app.config['TESTING'] = True
        self.app.config['WTF_CSRF_ENABLED'] = False
        self.client = self.app.test_client()

    def test_full_phase1_persistence_and_isolation_lifecycle(self):
        print("\n==================================================")
        print("RUNNING PHASE 1 ACCEPTANCE TEST")
        print("==================================================")

        email_a = "user_alpha_p1@fitsync.ai"
        pwd_a = "Phase1Secret123!"

        # STEP 1: Register User A
        print("[STEP 1] Registering User A...")
        r_reg = self.client.post('/register', data={'email': email_a, 'password': pwd_a}, follow_redirects=False)
        self.assertEqual(r_reg.status_code, 302)
        self.assertTrue(r_reg.location.endswith('/onboarding'))

        # STEP 2: Confirm User A exists in SQLite instance/fitsync.db
        print("[STEP 2] Verifying User A in SQLite instance/fitsync.db...")
        with self.app.app_context():
            user_a = User.query.filter_by(email=email_a).first()
            self.assertIsNotNone(user_a)
            user_a_id = user_a.id
            self.assertGreater(user_a_id, 0)

        # STEP 3: Complete Onboarding for User A
        print("[STEP 3] Completing onboarding for User A...")
        r_onb = self.client.post('/onboarding', json={
            "name": "Alpha Athlete",
            "age": 24,
            "gender": "Male",
            "height": 178,
            "weight": 74,
            "fitness_goal": "Muscle Gain",
            "fitness_level": "Intermediate",
            "workout_days_per_week": 4,
            "workout_duration_mins": 50,
            "workout_environment": "Gym",
            "dietary_preference": "Non-Vegetarian",
            "daily_food_budget": 250,
            "equipments": ["Full Gym"],
            "food_preferences": []
        })
        self.assertEqual(r_onb.status_code, 200)

        # STEP 4: Confirm profile, WorkoutPlan, MealPlan exist in SQLite
        print("[STEP 4] Confirming User A profile, workout plan & meal plan in DB...")
        with self.app.app_context():
            user_a_db = db.session.get(User, user_a_id)
            self.assertIsNotNone(user_a_db.profile)
            self.assertEqual(user_a_db.profile.name, "Alpha Athlete")
            self.assertTrue(user_a_db.profile.onboarding_completed)
            self.assertGreater(WorkoutPlan.query.filter_by(user_id=user_a_id).count(), 0)
            self.assertGreater(MealPlan.query.filter_by(user_id=user_a_id).count(), 0)

        # STEP 5: Logout User A
        print("[STEP 5] Logging out User A...")
        r_logout = self.client.get('/logout', follow_redirects=False)
        self.assertEqual(r_logout.status_code, 302)

        # STEP 6: Confirm database STILL contains User A after logout
        print("[STEP 6] Confirming User A data remains intact in DB after logout...")
        with self.app.app_context():
            user_a_post_logout = db.session.get(User, user_a_id)
            self.assertIsNotNone(user_a_post_logout)
            self.assertEqual(user_a_post_logout.profile.name, "Alpha Athlete")

        # STEP 7: Login User A again
        print("[STEP 7] Logging in User A again...")
        r_login = self.client.post('/login', data={'email': email_a, 'password': pwd_a}, follow_redirects=False)
        self.assertEqual(r_login.status_code, 302)
        self.assertTrue(r_login.location.endswith('/dashboard'))

        # STEP 8: Simulate Flask App Stop & Restart
        print("[STEP 8] Simulating Flask App Stop & Restart...")
        with self.app.app_context():
            db.session.remove()
            db.engine.dispose()

        # Create new test client to simulate new process connection
        fresh_client = self.app.test_client()

        # STEP 9: Login User A on fresh app connection
        print("[STEP 9] Logging in User A after app restart...")
        r_relogin = fresh_client.post('/login', data={'email': email_a, 'password': pwd_a}, follow_redirects=False)
        self.assertEqual(r_relogin.status_code, 302)
        self.assertTrue(r_relogin.location.endswith('/dashboard'))

        # Confirm User A profile still restored on dashboard
        r_dash = fresh_client.get('/dashboard')
        self.assertEqual(r_dash.status_code, 200)
        self.assertIn(b"Alpha Athlete", r_dash.data)

        # STEP 10: Create & Onboard User B
        print("[STEP 10] Registering & onboarding User B...")
        fresh_client.get('/logout')

        email_b = "user_beta_p1@fitsync.ai"
        pwd_b = "Phase1Secret456!"

        fresh_client.post('/register', data={'email': email_b, 'password': pwd_b}, follow_redirects=True)
        fresh_client.post('/onboarding', json={
            "name": "Beta Athlete",
            "age": 28,
            "gender": "Female",
            "height": 162,
            "weight": 58,
            "fitness_goal": "Fat Loss",
            "fitness_level": "Beginner",
            "workout_days_per_week": 3,
            "workout_duration_mins": 30,
            "workout_environment": "Dumbbells Only",
            "dietary_preference": "Vegetarian",
            "daily_food_budget": 120,
            "equipments": ["Dumbbells"],
            "food_preferences": []
        })

        # Add custom food for User B
        fresh_client.post('/api/custom-foods', json={
            "name": "Beta Whey Smoothie",
            "category": "Smoothie",
            "serving_size_g": 300,
            "calories": 250,
            "protein": 30.0,
            "carbs": 20.0,
            "fat": 3.0,
            "cost": 50
        })

        # STEP 11: Verify Data Isolation
        print("[STEP 11] Verifying two-user data isolation...")
        r_dash_b = fresh_client.get('/dashboard')
        self.assertIn(b"Beta Athlete", r_dash_b.data)
        self.assertNotIn(b"Alpha Athlete", r_dash_b.data)

        print("==================================================")
        print("PHASE 1 ACCEPTANCE TEST COMPLETED SUCCESSFULLY!")
        print("==================================================")

if __name__ == '__main__':
    unittest.main()
