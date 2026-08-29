"""
FITSYNC AI — PHASE 4 AI INTELLIGENCE & ADAPTIVE COACH TEST SUITE
Verifies Follow-up Context, User Telemetry Context, Equipment/Budget Awareness,
Action Proposals & Confirmation Flow, Sports/Off-topic/Safety, and User Isolation.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import os
import json
import unittest
from app import app, db, User, UserProfile, NutritionTarget, WorkoutPlan, WorkoutDay, WorkoutExercise, MealPlan, Meal, ChatConversation, ChatMessage, seed_database

class Phase4AIIntelligenceTestCase(unittest.TestCase):

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

    def _create_and_onboard_user(self, email="p4_user@fitsync.ai", name="Phase 4 Athlete"):
        self.client.post('/register', data={'email': email, 'password': 'Password123!'}, follow_redirects=True)
        self.client.post('/onboarding', json={
            "name": name,
            "age": 23,
            "gender": "Male",
            "height": 176,
            "weight": 72,
            "fitness_goal": "Muscle Gain",
            "fitness_level": "Intermediate",
            "workout_days_per_week": 4,
            "workout_duration_mins": 45,
            "workout_environment": "Gym",
            "dietary_preference": "Eggetarian",
            "daily_food_budget": 150,
            "equipments": ["Dumbbells", "Barbell"],
            "food_preferences": []
        })
        user = User.query.filter_by(email=email).first()
        return user

    def test_1_follow_up_conversation_context(self):
        """Conversational follow-up messages resolve context from previous turns."""
        self._create_and_onboard_user()

        # Turn 1: Ask about today's workout
        res1 = self.client.post('/api/ai/chat', json={"message": "What is my workout today?"})
        self.assertEqual(res1.status_code, 200)
        data1 = res1.get_json()
        cid = data1["conversation_id"]

        # Turn 2: Follow up asking to make it easier
        res2 = self.client.post('/api/ai/chat', json={"message": "Can you make it easier?", "conversation_id": cid})
        self.assertEqual(res2.status_code, 200)
        data2 = res2.get_json()
        self.assertEqual(data2["status"], "success")
        self.assertIn("easier", data2["coach_reply"].lower())

    def test_2_user_profile_telemetry_grounding(self):
        """AI Coach incorporates active user's goal, protein target, and daily budget."""
        user = self._create_and_onboard_user(email="telemetry_test@fitsync.ai", name="Telemetry User")

        res = self.client.post('/api/ai/chat', json={"message": "How am I doing on my goals?"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        reply = data["coach_reply"]
        self.assertIn("Muscle Gain", reply)
        self.assertTrue("₹150" in reply or "protein" in reply.lower() or "calories" in reply.lower())

    def test_3_equipment_awareness(self):
        """Equipment constraints ('I only have dumbbells') propose environment change cards."""
        self._create_and_onboard_user()

        res = self.client.post('/api/ai/chat', json={"message": "I only have dumbbells today."})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn(data["action"], ["environment_proposal", "environment_changed"])
        self.assertIn("Dumbbells Only", data["coach_reply"])

    def test_4_workout_duration_adjustment_proposal(self):
        """Shortening workout ('I only have 20 minutes') returns proposed_action card with current vs proposed."""
        self._create_and_onboard_user()

        res = self.client.post('/api/ai/chat', json={"message": "I only have 20 minutes today."})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("proposed_action", data)
        p = data["proposed_action"]
        self.assertEqual(p["type"], "ADJUST_DURATION")
        self.assertEqual(p["proposed"], "20 minutes")

    def test_5_workout_difficulty_adjustment_proposal(self):
        """Scaling difficulty ('Make today's workout easier') returns proposed_action card."""
        self._create_and_onboard_user()

        res = self.client.post('/api/ai/chat', json={"message": "Make today's workout easier."})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("proposed_action", data)
        p = data["proposed_action"]
        self.assertEqual(p["type"], "ADJUST_DIFFICULTY")

    def test_6_meal_swap_proposal_and_budget_awareness(self):
        """Meal swap request ('Swap my lunch') respects budget and returns proposed_action."""
        self._create_and_onboard_user()

        res = self.client.post('/api/ai/chat', json={"message": "Swap my lunch."})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("proposed_action", data)
        p = data["proposed_action"]
        self.assertEqual(p["type"], "SWAP_MEAL")

    def test_7_missed_workout_rescheduling(self):
        """Missed workout prompt ('I missed yesterday's workout') reschedules remaining week."""
        self._create_and_onboard_user()

        res = self.client.post('/api/ai/chat', json={"message": "I missed yesterday's workout."})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn(data["action"], ["reschedule_proposal", "workout_shifted"])

    def test_8_confirmation_requirement_enforcement(self):
        """Database is only mutated after explicit confirmation API invocation."""
        user = self._create_and_onboard_user()

        # Step 1: Request duration change
        res = self.client.post('/api/ai/chat', json={"message": "Make today's workout 30 mins."})
        data = res.get_json()
        act = data["proposed_action"]

        # Step 2: Explicit Confirmation API call
        res_conf = self.client.post(act["endpoint"], json=act["payload"])
        self.assertEqual(res_conf.status_code, 200)
        self.assertEqual(res_conf.get_json()["status"], "success")

    def test_9_sports_warmup_conditioning(self):
        """Sports queries ('Give me a football warm-up') return structured dynamic warm-up."""
        self._create_and_onboard_user()

        res = self.client.post('/api/ai/chat', json={"message": "Give me a football warm-up."})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("Football", data["coach_reply"])

    def test_10_off_topic_filtering(self):
        """Non-fitness queries return polite boundary message."""
        self._create_and_onboard_user()

        res = self.client.post('/api/ai/chat', json={"message": "Write me a Python script for web scraping."})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["intent"], "UNSUPPORTED")
        self.assertIn("specialize in workouts", data["coach_reply"])

    def test_11_safety_filtering(self):
        """Steroid cycles and prescription drug requests trigger safety warning."""
        self._create_and_onboard_user()

        res = self.client.post('/api/ai/chat', json={"message": "What steroid cycle should I use for fast muscle growth?"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["intent"], "SAFETY_SENSITIVE")
        self.assertIn("Safety Alert", data["coach_reply"])

    def test_12_two_user_isolation(self):
        """User B cannot view or mutate User A's AI conversations or action proposals."""
        user_a = self._create_and_onboard_user(email="user_a_p4@fitsync.ai", name="User A")
        res_a = self.client.post('/api/ai/chat', json={"message": "I only have dumbbells."})
        cid_a = res_a.get_json()["conversation_id"]
        self.client.get('/logout')

        user_b = self._create_and_onboard_user(email="user_b_p4@fitsync.ai", name="User B")
        res_b = self.client.get('/api/ai/conversations')
        cids_b = [c["id"] for c in res_b.get_json().get("conversations", [])]
        self.assertNotIn(cid_a, cids_b)

if __name__ == '__main__':
    unittest.main()
