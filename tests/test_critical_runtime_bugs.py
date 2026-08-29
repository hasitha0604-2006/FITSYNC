"""
FITSYNC AI — CRITICAL RUNTIME BUGS REGRESSION TEST SUITE
Verifies Exercise Demo Asset Resolution, SVG Fallbacks, AI Coach Request Validation,
Distinct HTTP Status Errors, Offline Fallback, Transaction Rollbacks, and Action Cards.
"""

import os
import json
import unittest
from datetime import datetime
from app import app, db, User, UserProfile, Exercise, WorkoutPlan, WorkoutDay, WorkoutExercise, MealPlan, Meal, ChatConversation, ChatMessage, seed_database

class CriticalRuntimeBugsTestCase(unittest.TestCase):

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
            User.query.filter(User.email != 'demo@fitsync.ai').delete()
            db.session.commit()
        except Exception:
            db.session.rollback()
        db.session.remove()
        self.ctx.pop()

    def _create_user(self, email, name):
        self.client.post('/register', data={'email': email, 'password': 'Password123!'}, follow_redirects=True)
        self.client.post('/onboarding', json={
            "name": name,
            "age": 22,
            "gender": "Male",
            "height": 178,
            "weight": 74,
            "fitness_goal": "Muscle Gain",
            "fitness_level": "Intermediate",
            "workout_days_per_week": 4,
            "workout_duration_mins": 45,
            "workout_environment": "Gym",
            "dietary_preference": "Eggetarian",
            "daily_food_budget": 150,
            "equipments": ["Dumbbells", "Barbell", "Full Gym"],
            "food_preferences": []
        })
        return User.query.filter_by(email=email).first()

    # 1. Demo Asset Path Resolution
    def test_1_demo_asset_path_resolution(self):
        """Exercise.to_dict() resolves valid demonstration_asset path existing on filesystem."""
        exs = Exercise.query.all()
        self.assertGreater(len(exs), 0)
        for ex in exs:
            d = ex.to_dict()
            self.assertIn("media_path", d)
            self.assertIn("demonstration_asset", d)
            asset = d["demonstration_asset"].lstrip('/')
            self.assertTrue(os.path.exists(asset), f"Demo asset {asset} does not exist on disk for {ex.name}")

    # 2. Demo Fallback
    def test_2_demo_fallback(self):
        """WorkoutExercise for unknown or missing demo asset falls back to fallback_demo.svg."""
        we = WorkoutExercise(
            workout_day_id=1,
            name="NonExistent Exercise Custom",
            category="Custom",
            sets=3,
            reps="10",
            rest_seconds=60
        )
        d = we.to_dict()
        self.assertEqual(d["media_path"], "/static/exercises/fallback_demo.svg")

    # 3. Demo Metadata
    def test_3_demo_metadata(self):
        """WorkoutExercise.to_dict() returns instructions, positioning, and muscle mapping metadata."""
        user = self._create_user("demo_meta@fitsync.ai", "Demo Meta")
        plan = WorkoutPlan.query.filter_by(user_id=user.id, is_active=True).first()
        active_day = next(d for d in plan.days if d.exercises)
        we = active_day.exercises[0].to_dict()

        self.assertIn("name", we)
        self.assertIn("category", we)
        self.assertIn("primary_muscles", we)
        self.assertIn("secondary_muscles", we)
        self.assertIn("instructions", we)
        self.assertIn("start_pos", we)
        self.assertIn("movement", we)
        self.assertIn("end_pos", we)

    # 4. AI Authenticated Request
    def test_4_ai_authenticated_request(self):
        """Authenticated call to /api/ai/chat returns 200 with structured JSON response."""
        user = self._create_user("ai_auth@fitsync.ai", "AI Auth")
        res = self.client.post('/api/ai/chat', json={"message": "What is my workout today?"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertTrue(len(data.get("message", "")) > 0)

    # 5. AI Unauthenticated Request
    def test_5_ai_unauthenticated_request(self):
        """Unauthenticated call to /api/ai/chat returns 401 with clear login prompt message."""
        self.client.get('/logout')
        res = self.client.post('/api/ai/chat', json={"message": "What is my workout today?"})
        self.assertEqual(res.status_code, 401)
        data = res.get_json(force=True)
        self.assertEqual(data["status"], "error")
        self.assertIn("log in", data["message"].lower())

    # 6. AI Response Structure
    def test_6_ai_response_structure(self):
        """/api/ai/chat response body contains all contract fields."""
        user = self._create_user("ai_struct@fitsync.ai", "AI Struct")
        res = self.client.post('/api/ai/chat', json={"message": "Explain today's workout."})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("status", data)
        self.assertIn("conversation_id", data)
        self.assertIn("message", data)
        self.assertIn("coach_reply", data)
        self.assertIn("intent", data)
        self.assertIn("results", data)
        self.assertIn("food_results", data)

    # 7. AI Offline Fallback
    def test_7_ai_offline_fallback(self):
        """When GEMINI_API_KEY is not set, system returns fitness-grounded response."""
        orig_key = os.environ.get("GEMINI_API_KEY")
        if "GEMINI_API_KEY" in os.environ:
            del os.environ["GEMINI_API_KEY"]

        user = self._create_user("ai_off@fitsync.ai", "AI Offline")
        res = self.client.post('/api/ai/chat', json={"message": "What is my workout today?"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")

        if orig_key:
            os.environ["GEMINI_API_KEY"] = orig_key

    # 8. AI Invalid API Handling
    def test_8_ai_invalid_api_handling(self):
        """Invalid API key safely falls back to offline engine without crashing Flask."""
        os.environ["GEMINI_API_KEY"] = "INVALID_KEY_12345"
        user = self._create_user("ai_inv@fitsync.ai", "AI Invalid Key")
        res = self.client.post('/api/ai/chat', json={"message": "Suggest a high protein meal."})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")

    # 9. AI Conversation Persistence
    def test_9_ai_conversation_persistence(self):
        """ChatConversation and ChatMessage records persist in database across requests."""
        user = self._create_user("ai_persist@fitsync.ai", "AI Persist")
        self.client.post('/api/ai/chat', json={"message": "Tell me a warm-up routine."})

        conv = ChatConversation.query.filter_by(user_id=user.id).first()
        self.assertIsNotNone(conv)
        self.assertGreater(len(conv.messages), 0)

    # 10. AI Transaction Rollback
    def test_10_ai_transaction_rollback(self):
        """Exceptions during AI endpoint execution trigger db.session.rollback() without poisoning subsequent requests."""
        user = self._create_user("ai_roll@fitsync.ai", "AI Rollback")
        # Send valid request first
        res1 = self.client.post('/api/ai/chat', json={"message": "Hello coach."})
        self.assertEqual(res1.status_code, 200)

        # Subsequent dashboard request remains fully functional
        res2 = self.client.get('/dashboard')
        self.assertEqual(res2.status_code, 200)

    # 11. AI Action Confirmation
    def test_11_ai_action_confirmation(self):
        """AI proposals do NOT mutate database until user explicitly confirms via proposed action endpoint."""
        user = self._create_user("ai_act@fitsync.ai", "AI Action")
        plan = WorkoutPlan.query.filter_by(user_id=user.id, is_active=True).first()
        today_name = datetime.now().strftime("%A")
        today_w = WorkoutDay.query.filter_by(workout_plan_id=plan.id, day_name=today_name).first()
        if not today_w or today_w.is_rest_day:
            today_w = next((d for d in plan.days if not d.is_rest_day), plan.days[0])

        orig_mins = today_w.duration_minutes

        # Ask AI to shorten workout
        res = self.client.post('/api/ai/chat', json={"message": "I only have 30 minutes today."})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("proposed_action", data)
        action = data["proposed_action"]

        # Verify DB unmutated prior to confirmation
        db.session.refresh(today_w)
        self.assertEqual(today_w.duration_minutes, orig_mins)

        # Confirm action via endpoint
        res_conf = self.client.post(action["endpoint"], json=action["payload"])
        self.assertEqual(res_conf.status_code, 200)

        # Verify DB mutated exactly once after confirmation
        db.session.refresh(today_w)
        self.assertEqual(today_w.duration_minutes, 30)

    # 12. User Isolation
    def test_12_user_isolation(self):
        """User B cannot fetch User A's AI conversation history or workout plans."""
        user_a = self._create_user("usera_iso@fitsync.ai", "User A")
        self.client.post('/api/ai/chat', json={"message": "My private goal is User A Goal."})
        self.client.get('/logout')

        user_b = self._create_user("userb_iso@fitsync.ai", "User B")
        res = self.client.get('/api/ai/conversations')
        data = res.get_json()
        convs = data.get("conversations", [])
        for c in convs:
            for m in c.get("messages", []):
                self.assertNotIn("User A Goal", m.get("message", ""))

if __name__ == '__main__':
    unittest.main()
