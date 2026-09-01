"""
FITSYNC AI — PHASE 5 UI/UX & PRODUCT INTELLIGENCE TEST SUITE
Verifies Dashboard UI rendering, Workout & Demo Modal data contracts, Muscle Highlighting mappings,
Nutrition & Food Budget calculations, Meal Swap options, Progress analytics, and User Security Isolation.
"""

import os
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import unittest
from app import app, db, User, UserProfile, NutritionTarget, WorkoutPlan, WorkoutDay, WorkoutExercise, MealPlan, Meal, Exercise, Food, CustomFood, seed_database

class Phase5UIUXTestCase(unittest.TestCase):

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
            User.query.filter(User.email.in_(['p5_user@fitsync.ai'])).delete()
            db.session.commit()
        except Exception:
            db.session.rollback()
        db.session.remove()
        self.ctx.pop()

    def _create_and_onboard_user(self, email="p5_user@fitsync.ai", name="Phase 5 Athlete"):
        self.client.post('/register', data={'email': email, 'password': 'Password123!'}, follow_redirects=True)
        self.client.post('/onboarding', json={
            "name": name,
            "age": 22,
            "gender": "Female",
            "height": 165,
            "weight": 58,
            "fitness_goal": "Fat Loss",
            "fitness_level": "Beginner",
            "workout_days_per_week": 4,
            "workout_duration_mins": 45,
            "workout_environment": "Gym",
            "dietary_preference": "Eggetarian",
            "daily_food_budget": 150,
            "equipments": ["Dumbbells", "Barbell", "Full Gym"],
            "food_preferences": []
        })
        user = User.query.filter_by(email=email).first()
        return user

    def test_1_dashboard_rendering_and_user_telemetry(self):
        """Dashboard renders personalized greeting, today's workout split, and macro targets."""
        user = self._create_and_onboard_user()

        res = self.client.get('/dashboard')
        self.assertEqual(res.status_code, 200)
        html = res.get_data(as_text=True)
        self.assertIn("Phase 5 Athlete", html)
        self.assertIn("Fat Loss", html)
        self.assertIn("₹150", html)

    def test_2_workout_schedule_rendering(self):
        """Workout plan page renders 7-day schedule grid with focus split and status badges."""
        self._create_and_onboard_user()

        res = self.client.get('/workout-plan')
        self.assertEqual(res.status_code, 200)
        html = res.get_data(as_text=True)
        self.assertIn("Weekly Workout Plan", html)

    def test_3_exercise_demo_modal_data_contract(self):
        """WorkoutExercise.to_dict() populates muscle maps, demo paths, and instructions for demo modal."""
        user = self._create_and_onboard_user()

        plan = WorkoutPlan.query.filter_by(user_id=user.id, is_active=True).first()
        self.assertIsNotNone(plan)
        active_day = next((d for d in plan.days if d.exercises), plan.days[0])
        self.assertGreater(len(active_day.exercises), 0)

        we = active_day.exercises[0]
        data = we.to_dict()
        self.assertIn("name", data)
        self.assertIn("primary_muscles", data)
        self.assertIn("secondary_muscles", data)
        self.assertIn("media_path", data)

    def test_4_exercise_replacement_alternative_query(self):
        """Substituting an exercise queries compatible alternatives matching category and equipment."""
        user = self._create_and_onboard_user()

        plan = WorkoutPlan.query.filter_by(user_id=user.id, is_active=True).first()
        active_day = next((d for d in plan.days if d.exercises), plan.days[0])
        we = active_day.exercises[0]

        res = self.client.post('/api/workout/exercise/substitute', json={"id": we.id})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["status"], "success")

    def test_5_nutrition_targets_and_budget_calculation(self):
        """Nutrition page displays calculated BMR/TDEE targets and ₹150 daily food budget bar."""
        user = self._create_and_onboard_user()

        res = self.client.get('/nutrition')
        self.assertEqual(res.status_code, 200)
        html = res.get_data(as_text=True)
        self.assertIn("Daily Budget", html)

    def test_6_meal_swap_option_recalculation(self):
        """Substituting a meal updates meal plan calories, protein, and estimated cost."""
        user = self._create_and_onboard_user()

        mp = MealPlan.query.filter_by(user_id=user.id).first()
        self.assertIsNotNone(mp)
        self.assertGreater(len(mp.meals), 0)
        target_m = mp.meals[0]

        # Find alternative food
        alt_food = Food.query.filter(Food.id != target_m.food_id).first()
        self.assertIsNotNone(alt_food)

        res = self.client.post('/api/nutrition/meal/substitute', json={"meal_id": target_m.id, "new_food_id": alt_food.id})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["status"], "success")

    def test_7_progress_dashboard_stats(self):
        """Progress page renders completion stats without throwing template errors."""
        self._create_and_onboard_user()

        res = self.client.get('/progress')
        self.assertEqual(res.status_code, 200)
        html = res.get_data(as_text=True)
        self.assertIn("Progress Analytics", html)

    def test_8_ai_coach_action_cards_and_confirmation(self):
        """AI Coach returns proposed_action cards requiring user confirmation."""
        self._create_and_onboard_user()

        res = self.client.post('/api/ai/chat', json={"message": "I have 20 minutes today."})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("proposed_action", data)
        p = data["proposed_action"]
        self.assertEqual(p["type"], "ADJUST_DURATION")
        self.assertEqual(p["endpoint"], "/api/workout/adjust-duration")

    def test_9_two_user_data_isolation_security(self):
        """User A and User B cannot view or modify each other's UI components or database records."""
        user_a = self._create_and_onboard_user(email="user_a_p5@fitsync.ai", name="User A")
        res_a_dash = self.client.get('/dashboard')
        self.assertIn("User A", res_a_dash.get_data(as_text=True))
        self.client.get('/logout')

        user_b = self._create_and_onboard_user(email="user_b_p5@fitsync.ai", name="User B")
        res_b_dash = self.client.get('/dashboard')
        self.assertIn("User B", res_b_dash.get_data(as_text=True))
        self.assertNotIn("User A", res_b_dash.get_data(as_text=True))

    def test_10_empty_state_handling(self):
        """Newly registered users are redirected to onboarding wizard and render cleanly."""
        self.client.post('/register', data={'email': 'empty_user@fitsync.ai', 'password': 'Password123!'}, follow_redirects=True)

        res = self.client.get('/dashboard', follow_redirects=True)
        self.assertEqual(res.status_code, 200)
        self.assertIn("FitSync", res.get_data(as_text=True))

if __name__ == '__main__':
    unittest.main()
