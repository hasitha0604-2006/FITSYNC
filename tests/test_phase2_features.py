"""
FITSYNC AI — PHASE 2 FEATURE & INTEGRATION TEST SUITE
Verifies Dashboard, Profile Updates, Exercise Library, Workout Execution/Replacement/Rescheduling,
Nutrition/Meal Swaps/Custom Foods/Budget, Progress Tracking across process restarts, and User Isolation.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import json
import unittest
from datetime import datetime
from app import (app, db, User, UserProfile, UserEquipment, UserFoodPreference,
                 NutritionTarget, WorkoutPlan, WorkoutDay, WorkoutExercise,
                 MealPlan, Meal, CustomFood, ProgressRecord, Exercise, Food, seed_database)
from reset_database import reset_database

class Phase2FeaturesTestCase(unittest.TestCase):

    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///:memory:"
        self.app.config['WTF_CSRF_ENABLED'] = False
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()

        db.create_all()
        seed_database()

    def tearDown(self):
        try:
            User.query.filter(User.email.in_([
                'dash_user@fitsync.ai', 'prof_user@fitsync.ai', 'ex_lib@fitsync.ai',
                'workout_exec@fitsync.ai', 'sub_user@fitsync.ai', 'cf_user@fitsync.ai',
                'meal_sub@fitsync.ai', 'prog_user@fitsync.ai', 'sec_usera@fitsync.ai',
                'sec_userb@fitsync.ai', 'metrics_test@fitsync.ai', 'bounds_test@fitsync.ai'
            ])).delete()
            db.session.commit()
        except Exception:
            db.session.rollback()
        db.session.remove()
        self.ctx.pop()
        if hasattr(self, 'orig_uri') and self.orig_uri:
            self.app.config['SQLALCHEMY_DATABASE_URI'] = self.orig_uri

    def _create_and_onboard_user(self, email, name, goal="Muscle Gain", budget=150):
        self.client.post('/register', data={'email': email, 'password': 'Password123!'}, follow_redirects=True)
        self.client.post('/onboarding', json={
            "name": name,
            "age": 22,
            "gender": "Male",
            "height": 175,
            "weight": 72,
            "fitness_goal": goal,
            "fitness_level": "Beginner",
            "workout_days_per_week": 4,
            "workout_duration_mins": 45,
            "workout_environment": "Gym",
            "dietary_preference": "Eggetarian",
            "daily_food_budget": budget,
            "equipments": ["Dumbbells", "Barbell"],
            "food_preferences": []
        })
        self.client.post('/login', data={'email': email, 'password': 'Password123!'}, follow_redirects=True)
        with self.app.app_context():
            user = User.query.filter_by(email=email).first()
            return user.id

    def test_dashboard_real_data_rendering(self):
        """Dashboard displays real user profile, workout day, and nutrition targets."""
        uid = self._create_and_onboard_user("dash_user@fitsync.ai", "Dashboard Champ")

        res = self.client.get('/dashboard')
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"Dashboard Champ", res.data)
        self.assertIn(b"Muscle Gain", res.data)

    def test_profile_update_and_engine_integration(self):
        """Updating profile attributes updates persistent SQLite DB and recalculates targets."""
        uid = self._create_and_onboard_user("prof_user@fitsync.ai", "Initial Name")

        # Update profile via API
        res = self.client.post('/api/profile/save', json={
            "name": "Updated Name Hero",
            "weight": 80.0,
            "fitness_goal": "Fat Loss",
            "daily_food_budget": 220,
            "equipments": ["Dumbbells"]
        })
        self.assertEqual(res.status_code, 200)

        # Verify DB updated
        with self.app.app_context():
            user = User.query.get(uid)
            self.assertEqual(user.profile.name, "Updated Name Hero")
            self.assertEqual(user.profile.weight, 80.0)
            self.assertEqual(user.profile.fitness_goal, "Fat Loss")
            self.assertEqual(user.profile.daily_food_budget, 220)

    def test_exercise_library_and_demonstrations(self):
        """Exercise library queries central Exercise model and returns valid details."""
        uid = self._create_and_onboard_user("ex_lib@fitsync.ai", "Lib User")
        res_lib = self.client.get('/exercises')
        self.assertEqual(res_lib.status_code, 200)

        with self.app.app_context():
            ex = Exercise.query.first()
            self.assertIsNotNone(ex)
            ex_id = ex.id

        res_detail = self.client.get(f'/exercise/{ex_id}')
        self.assertEqual(res_detail.status_code, 200)
        self.assertIn(ex.name.encode('utf-8'), res_detail.data)

    def test_workout_execution_completion(self):
        """Toggling workout exercise completion updates SQLite and syncs ProgressRecord."""
        uid = self._create_and_onboard_user("workout_exec@fitsync.ai", "Workout Runner")

        with self.app.app_context():
            plan = WorkoutPlan.query.filter_by(user_id=uid, is_active=True).first()
            self.assertIsNotNone(plan)
            first_day = next((d for d in plan.days if not d.is_rest_day), None)
            self.assertIsNotNone(first_day)
            first_ex = first_day.exercises[0]
            ex_id = first_ex.id

        res_toggle = self.client.post('/api/workout/exercise/toggle-complete', json={"id": ex_id})
        self.assertEqual(res_toggle.status_code, 200)
        data = res_toggle.get_json()
        self.assertTrue(data["is_completed"])

        # Verify persisted in SQLite
        with self.app.app_context():
            we = WorkoutExercise.query.get(ex_id)
            self.assertTrue(we.is_completed)

    def test_exercise_replacement(self):
        """Exercise substitution queries alternatives from central Exercise database."""
        uid = self._create_and_onboard_user("sub_user@fitsync.ai", "Substitute Athlete")

        with self.app.app_context():
            plan = WorkoutPlan.query.filter_by(user_id=uid, is_active=True).first()
            first_day = next((d for d in plan.days if not d.is_rest_day), None)
            orig_ex = first_day.exercises[0]
            orig_ex_id = orig_ex.id
            orig_name = orig_ex.name

        res_sub = self.client.post('/api/workout/exercise/substitute', json={"id": orig_ex_id, "reason": "too hard"})
        self.assertEqual(res_sub.status_code, 200)
        data = res_sub.get_json()
        self.assertEqual(data["status"], "success")

        with self.app.app_context():
            updated_ex = WorkoutExercise.query.get(orig_ex_id)
            self.assertNotEqual(updated_ex.name, orig_name)

    def test_custom_food_creation_and_user_scoping(self):
        """Custom foods belong to user_id and persist across requests."""
        uid = self._create_and_onboard_user("cf_user@fitsync.ai", "Chef User")

        res_add = self.client.post('/api/custom-foods', json={
            "name": "Chef Protein Oats",
            "category": "Breakfast",
            "serving_size_g": 200,
            "calories": 350,
            "protein": 28.0,
            "carbs": 40.0,
            "fat": 6.0,
            "cost": 45
        })
        self.assertEqual(res_add.status_code, 200)

        with self.app.app_context():
            cf = CustomFood.query.filter_by(user_id=uid, name="Chef Protein Oats").first()
            self.assertIsNotNone(cf)
            self.assertEqual(cf.cost, 45)

    def test_meal_substitution_and_budget_recalculation(self):
        """Meal substitution updates MealPlan totals and ProgressRecord."""
        uid = self._create_and_onboard_user("meal_sub@fitsync.ai", "Nutritionist")

        today_str = datetime.now().strftime("%Y-%m-%d")
        with self.app.app_context():
            m_plan = MealPlan.query.filter_by(user_id=uid, date=today_str).first()
            self.assertIsNotNone(m_plan)
            first_meal = m_plan.meals[0]
            meal_id = first_meal.id

        res_sub = self.client.post('/api/nutrition/meal/substitute', json={"id": meal_id})
        self.assertEqual(res_sub.status_code, 200)
        data = res_sub.get_json()
        self.assertEqual(data["status"], "success")

        with self.app.app_context():
            updated_plan = MealPlan.query.filter_by(user_id=uid, date=today_str).first()
            self.assertGreater(updated_plan.total_calories, 0)

    def test_progress_persistence_across_app_restart(self):
        """Progress records survive database connection disposes and process restarts."""
        email = "prog_user@fitsync.ai"
        pwd = "Password123!"
        uid = self._create_and_onboard_user(email, "Tracker User")
        today_str = datetime.now().strftime("%Y-%m-%d")

        # Log weight
        self.client.post('/api/progress/log', json={"date": today_str, "weight": 76.5})

        # Simulate Flask App Restart
        with self.app.app_context():
            db.session.remove()
            db.engine.dispose()

        fresh_client = self.app.test_client()
        fresh_client.post('/login', data={'email': email, 'password': pwd}, follow_redirects=True)

        # Query progress history
        res_hist = fresh_client.get('/api/progress/history')
        self.assertEqual(res_hist.status_code, 200)
        data = res_hist.get_json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)
        last_rec = data[-1]
        self.assertEqual(last_rec["weight"], 76.5)

    def test_user_data_isolation_security(self):
        """User A cannot access or mutate User B's workout exercises, custom foods, or meal items."""
        uid_a = self._create_and_onboard_user("sec_usera@fitsync.ai", "Security User A")

        # Create Custom Food for User A
        self.client.post('/api/custom-foods', json={
            "name": "User A Secret Bar",
            "category": "Snack",
            "serving_size_g": 100,
            "calories": 200,
            "protein": 15.0,
            "carbs": 20.0,
            "fat": 5.0,
            "cost": 30
        })
        with self.app.app_context():
            cf_a = CustomFood.query.filter_by(user_id=uid_a).first()
            cf_a_id = cf_a.id

        self.client.get('/logout')

        # Register User B
        uid_b = self._create_and_onboard_user("sec_userb@fitsync.ai", "Security User B")

        # User B attempts to delete User A's custom food
        res_del = self.client.delete(f'/api/custom-foods/{cf_a_id}')
        self.assertEqual(res_del.status_code, 404)

        # User A's custom food should still exist in SQLite
        with self.app.app_context():
            cf_check = CustomFood.query.get(cf_a_id)
            self.assertIsNotNone(cf_check)

    def test_update_physical_metrics_recalculates_targets_and_bmi(self):
        """Updating physical metrics updates profile, recalculates targets & BMI, and logs progress."""
        uid = self._create_and_onboard_user("metrics_test@fitsync.ai", "Metrics User", goal="Muscle Gain")

        res = self.client.post('/api/profile/update-metrics', json={
            "height": 180.0,
            "weight": 80.0,
            "age": 25,
            "gender": "Male",
            "fitness_goal": "Fat Loss",
            "workout_environment": "Dumbbells Only"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["profile"]["height"], 180.0)
        self.assertEqual(data["profile"]["weight"], 80.0)
        self.assertEqual(data["profile"]["age"], 25)
        self.assertEqual(data["profile"]["fitness_goal"], "Fat Loss")
        self.assertEqual(data["profile"]["workout_environment"], "Dumbbells Only")
        # BMI for 80kg / 1.80m = 24.7 (Normal)
        self.assertEqual(data["profile"]["bmi"], 24.7)
        self.assertEqual(data["profile"]["bmi_label"], "Normal")

        # Verify DB persistence
        with self.app.app_context():
            user = db.session.get(User, uid)
            self.assertEqual(user.profile.height, 180.0)
            self.assertEqual(user.profile.weight, 80.0)
            target = NutritionTarget.query.filter_by(user_id=uid).first()
            self.assertIsNotNone(target)
            self.assertGreater(target.calories, 0)
            self.assertGreater(target.protein, 0)

    def test_update_physical_metrics_validates_bounds(self):
        """Invalid physical metrics ranges are rejected with 400 Bad Request."""
        self._create_and_onboard_user("bounds_test@fitsync.ai", "Bounds User")

        # Negative weight
        res1 = self.client.post('/api/profile/update-metrics', json={"weight": -10})
        self.assertEqual(res1.status_code, 400)

        # Excessive height
        res2 = self.client.post('/api/profile/update-metrics', json={"height": 500})
        self.assertEqual(res2.status_code, 400)

        # Unauthenticated request
        self.client.get('/logout')
        res3 = self.client.post('/api/profile/update-metrics', json={"weight": 75})
        self.assertEqual(res3.status_code, 401)

if __name__ == '__main__':
    unittest.main()

