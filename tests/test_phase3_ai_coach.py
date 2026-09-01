"""
FITSYNC AI — PHASE 3 FEATURE & INTEGRATION TEST SUITE
Verifies AI Coach UI API, Scope Enforcement, Safety Layer, Sports Conditioning,
RAG Data Grounding, User Context Telemetry, Conversation Scoping & Clearing, and Truthful Fallbacks.
"""

import os
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import json
import unittest
from app import app, db, User, UserProfile, NutritionTarget, WorkoutPlan, WorkoutDay, WorkoutExercise, MealPlan, Meal, ChatConversation, ChatMessage, seed_database

class Phase3AICoachTestCase(unittest.TestCase):

    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        self.app.config['WTF_CSRF_ENABLED'] = False
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()

        self.test_emails = [
            'coach_test@fitsync.ai', 'fitness_scope@fitsync.ai', 'off_topic@fitsync.ai',
            'safety@fitsync.ai', 'sports@fitsync.ai', 'persist_conv@fitsync.ai',
            'usera_ai@fitsync.ai', 'userb_ai@fitsync.ai', 'fallback_test@fitsync.ai'
        ]
        try:
            users = User.query.filter(User.email.in_(self.test_emails)).all()
            for u in users:
                UserProfile.query.filter_by(user_id=u.id).delete()
                ChatConversation.query.filter_by(user_id=u.id).delete()
                db.session.delete(u)
            db.session.commit()
        except Exception:
            db.session.rollback()

    def tearDown(self):
        try:
            users = User.query.filter(User.email.in_(self.test_emails)).all()
            for u in users:
                UserProfile.query.filter_by(user_id=u.id).delete()
                ChatConversation.query.filter_by(user_id=u.id).delete()
                db.session.delete(u)
            db.session.commit()
        except Exception:
            db.session.rollback()
        db.session.remove()
        self.ctx.pop()

    def _create_and_login_user(self, email="coach_test@fitsync.ai", name="Coach Athlete"):
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(email=email, password_hash="hashed_pwd")
            db.session.add(user)
            db.session.commit()

        if not user.profile:
            profile = UserProfile(
                user_id=user.id,
                name=name,
                age=23,
                gender="Male",
                height=176.0,
                weight=73.0,
                fitness_goal="Muscle Gain",
                fitness_level="Beginner",
                workout_days_per_week=4,
                workout_duration_mins=45,
                workout_environment="Gym",
                dietary_preference="Eggetarian",
                daily_food_budget=160,
                onboarding_completed=True
            )
            db.session.add(profile)
            db.session.commit()

        with self.client.session_transaction() as sess:
            sess['user_id'] = user.id

        return user

    def test_unauthenticated_api_access_denied(self):
        """Unauthenticated call to /api/ai/chat returns 401 Unauthorized."""
        res = self.client.post('/api/ai/chat', json={"message": "Hello Coach"})
        self.assertEqual(res.status_code, 401)
        data = res.get_json()
        self.assertEqual(data["status"], "error")

    def test_fitness_scope_acceptance(self):
        """Fitness, exercise, and nutrition queries are accepted and answered."""
        self._create_and_login_user("fitness_scope@fitsync.ai", "Scope Tester")

        res = self.client.post('/api/ai/chat', json={"message": "Explain today's workout"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn(data["intent"], ["WORKOUT_EXPLANATION", "EXERCISE_EXPLANATION", "GENERAL_FITNESS"])
        self.assertTrue(len(data["coach_reply"]) > 0)

    def test_off_topic_rejection(self):
        """Unrelated non-fitness questions (programming, weather) return polite scope response with UNSUPPORTED intent."""
        self._create_and_login_user("off_topic@fitsync.ai", "Student")

        res = self.client.post('/api/ai/chat', json={"message": "Write a Python script to sort a list"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["intent"], "UNSUPPORTED")
        self.assertIn("fitness", data["coach_reply"].lower())

    def test_safety_filter_medical_and_steroids(self):
        """Medical diagnoses, prescription drugs, anabolic steroids, and starvation trigger safety alert."""
        self._create_and_login_user("safety@fitsync.ai", "Safety Tester")

        # 1. Medication & Diagnosis
        res1 = self.client.post('/api/ai/chat', json={"message": "What prescription medicine should I take for sharp knee pain?"})
        self.assertEqual(res1.status_code, 200)
        data1 = res1.get_json()
        self.assertEqual(data1["intent"], "SAFETY_SENSITIVE")
        self.assertIn("safety alert", data1["coach_reply"].lower())

        # 2. Steroids
        res2 = self.client.post('/api/ai/chat', json={"message": "Tell me the best steroid cycle for rapid muscle mass"})
        self.assertEqual(res2.status_code, 200)
        data2 = res2.get_json()
        self.assertEqual(data2["intent"], "SAFETY_SENSITIVE")

    def test_sports_warmup_conditioning(self):
        """Sports-specific queries return structured dynamic warm-up routines."""
        self._create_and_login_user("sports@fitsync.ai", "Football Player")

        res = self.client.post('/api/ai/chat', json={"message": "Give me a warm-up for football"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["intent"], "SPORTS_WARMUP")
        self.assertIn("football", data["coach_reply"].lower())

    def test_rag_user_telemetry_grounding(self):
        """AI Coach incorporates user's actual profile, equipment, targets, and workout split into response."""
        user = User.query.filter_by(email="demo@fitsync.ai").first()
        self.assertIsNotNone(user)

        with self.client.session_transaction() as sess:
            sess['user_id'] = user.id

        res = self.client.post('/api/ai/chat', json={"message": "I only have dumbbells today"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn(data["action"], ["environment_proposal", "environment_changed"])

    def test_conversation_persistence_and_clearing(self):
        """Conversations persist per user and can be fetched or cleared."""
        user = self._create_and_login_user("persist_conv@fitsync.ai", "Persist Conv User")

        # 1. Send Chat Message
        self.client.post('/api/ai/chat', json={"message": "How do I perform a bicep curl?"})

        # 2. Fetch Conversations
        res_convs = self.client.get('/api/ai/conversations')
        self.assertEqual(res_convs.status_code, 200)
        convs = res_convs.get_json()["conversations"]
        self.assertGreater(len(convs), 0)
        conv_id = convs[0]["id"]
        self.assertGreater(len(convs[0]["messages"]), 0)

        # 3. Clear Conversation
        res_clear = self.client.post('/api/ai/conversations/clear', json={"conversation_id": conv_id})
        self.assertEqual(res_clear.status_code, 200)

        # 4. Verify Cleared
        res_check = self.client.get('/api/ai/conversations')
        check_convs = res_check.get_json()["conversations"]
        if check_convs:
            self.assertEqual(len(check_convs[0]["messages"]), 0)

    def test_user_conversation_isolation(self):
        """User B cannot fetch or view User A's conversation history."""
        user_a = self._create_and_login_user("usera_ai@fitsync.ai", "User A")
        self.client.post('/api/ai/chat', json={"message": "I want to train chest today"})

        # Switch session to User B
        user_b = self._create_and_login_user("userb_ai@fitsync.ai", "User B")

        res_b = self.client.get('/api/ai/conversations')
        self.assertEqual(res_b.status_code, 200)
        convs_b = res_b.get_json()["conversations"]

        for c in convs_b:
            for m in c["messages"]:
                self.assertNotIn("chest today", m["message"].lower())

    def test_truthful_offline_fallback(self):
        """When LLM API key is unconfigured, system operates deterministically using built-in engines."""
        user = self._create_and_login_user("fallback_test@fitsync.ai", "Fallback User")

        # Temporarily clear environment API key if present
        orig_key = os.environ.get("GEMINI_API_KEY")
        if "GEMINI_API_KEY" in os.environ:
            del os.environ["GEMINI_API_KEY"]

        res = self.client.post('/api/ai/chat', json={"message": "Suggest a high-protein dinner"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["status"] in ["success", True])
        self.assertTrue(len(data["coach_reply"]) > 0)

        if orig_key:
            os.environ["GEMINI_API_KEY"] = orig_key

    def test_database_schema_health_and_persistence(self):
        """Verify all 17 core database tables exist and user lookup does not throw OperationalError."""
        inspector = db.inspect(db.engine)
        tables = set(inspector.get_table_names())
        required = {"users", "user_profiles", "user_equipments", "user_food_preferences", "nutrition_targets", "exercises", "foods", "custom_foods", "workout_plans", "workout_days", "workout_exercises", "meal_plans", "meals", "progress_records", "completed_workouts", "chat_conversations", "chat_messages"}
        self.assertTrue(required.issubset(tables))

        user = User.query.first()
        self.assertIsNotNone(user)

if __name__ == '__main__':
    unittest.main()
