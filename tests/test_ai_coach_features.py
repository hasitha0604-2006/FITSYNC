import json
import unittest
from app import app, db, User, UserProfile, NutritionTarget, WorkoutPlan, WorkoutDay, WorkoutExercise, MealPlan, Meal, ChatConversation, ChatMessage, seed_database

class FitSyncAICoachTestCase(unittest.TestCase):

    def setUp(self):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///:memory:"
        app.config['WTF_CSRF_ENABLED'] = False
        
        self.client = app.test_client()
        self.ctx = app.app_context()
        self.ctx.push()
        
        db.create_all()
        seed_database()

    def tearDown(self):
        try:
            User.query.filter(User.email.in_([
                'usera@fitsync.ai', 'userb@fitsync.ai', 'student@fitsync.ai',
                'safety_user@fitsync.ai', 'sports_user@fitsync.ai', 'persistence_test@fitsync.ai'
            ])).delete()
            db.session.commit()
        except Exception:
            db.session.rollback()
        db.session.remove()
        self.ctx.pop()

    def _create_user(self, email, name="Test User"):
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(email=email, password_hash="hashed_password")
            db.session.add(user)
            db.session.commit()

        if not user.profile:
            profile = UserProfile(
                user_id=user.id,
                name=name,
                age=22,
                gender="Male",
                height=175.0,
                weight=72.0,
                fitness_goal="Muscle Gain",
                fitness_level="Beginner",
                workout_days_per_week=4,
                workout_duration_mins=45,
                workout_environment="Gym",
                dietary_preference="Eggetarian",
                daily_food_budget=150,
                onboarding_completed=True
            )
            db.session.add(profile)
            db.session.commit()
        return user

    def test_unauthenticated_access_denied(self):
        """Unauthenticated user cannot call private AI Chat endpoint."""
        res = self.client.post('/api/ai/chat', json={"message": "Hello"})
        self.assertEqual(res.status_code, 401)
        data = res.get_json()
        self.assertEqual(data["status"], "error")

    def test_user_isolation(self):
        """User A cannot access User B's AI conversations."""
        user_a = self._create_user("usera@fitsync.ai", "User A")
        user_b = self._create_user("userb@fitsync.ai", "User B")

        # User A sends a chat message
        with self.client as c:
            with c.session_transaction() as sess:
                sess['user_id'] = user_a.id
            res_a = c.post('/api/ai/chat', json={"message": "I only have dumbbells today"})
            self.assertEqual(res_a.status_code, 200)

        # User B logs in and fetches conversations
        with self.client as c:
            with c.session_transaction() as sess:
                sess['user_id'] = user_b.id
            res_b = c.get('/api/ai/conversations')
            self.assertEqual(res_b.status_code, 200)
            convs_b = res_b.get_json()["conversations"]
            # User B should have 0 conversations or no messages from User A
            for conv in convs_b:
                for msg in conv["messages"]:
                    self.assertNotIn("dumbbells", msg["message"].lower())

    def test_off_topic_query_rejection(self):
        """Off-topic requests (e.g. programming, weather) get scope response."""
        user = self._create_user("student@fitsync.ai", "Student")
        with self.client as c:
            with c.session_transaction() as sess:
                sess['user_id'] = user.id

            res = c.post('/api/ai/chat', json={"message": "Write me a Python program to sort a list"})
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertEqual(data["intent"], "UNSUPPORTED")
            self.assertIn("fitness", data["coach_reply"].lower())

    def test_safety_filter_handling(self):
        """Medical diagnosis and drug/steroid requests trigger safety filter."""
        user = self._create_user("safety_user@fitsync.ai", "Safety Test")
        with self.client as c:
            with c.session_transaction() as sess:
                sess['user_id'] = user.id

            # 1. Prescription medication question
            res1 = c.post('/api/ai/chat', json={"message": "What medication should I take for severe chest pain?"})
            self.assertEqual(res1.status_code, 200)
            data1 = res1.get_json()
            self.assertEqual(data1["intent"], "SAFETY_SENSITIVE")
            self.assertIn("safety alert", data1["coach_reply"].lower())

            # 2. Anabolic steroid question
            res2 = c.post('/api/ai/chat', json={"message": "Recommend a steroid cycle for rapid mass"})
            self.assertEqual(res2.status_code, 200)
            data2 = res2.get_json()
            self.assertEqual(data2["intent"], "SAFETY_SENSITIVE")

    def test_sports_warmup_support(self):
        """Sports-related queries return dynamic warm-up routine."""
        user = self._create_user("sports_user@fitsync.ai", "Athlete")
        with self.client as c:
            with c.session_transaction() as sess:
                sess['user_id'] = user.id

            res = c.post('/api/ai/chat', json={"message": "Give me a warm-up for football"})
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertIn("SPORTS", data["intent"])
            self.assertIn("football", data["coach_reply"].lower())

    def test_rag_workout_explanation(self):
        """AI retrieves user's actual workout plan details."""
        user = User.query.filter_by(email="demo@fitsync.ai").first()
        self.assertIsNotNone(user)

        with self.client as c:
            with c.session_transaction() as sess:
                sess['user_id'] = user.id

            res = c.post('/api/ai/chat', json={"message": "Explain today's workout"})
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertEqual(data["intent"], "WORKOUT_EXPLANATION")
            self.assertTrue(len(data["coach_reply"]) > 0)

    def test_workout_equipment_adjustment(self):
        """AI adjusts equipment constraints and updates persistent plan."""
        user = User.query.filter_by(email="demo@fitsync.ai").first()

        with self.client as c:
            with c.session_transaction() as sess:
                sess['user_id'] = user.id

            res = c.post('/api/ai/chat', json={"message": "I only have dumbbells today"})
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertIn(data["action"], ["environment_proposal", "environment_changed"])

    def test_conversation_persistence_and_clearing(self):
        """AI conversations persist in DB and can be cleared."""
        user = self._create_user("persistence_test@fitsync.ai", "Persist User")

        with self.client as c:
            with c.session_transaction() as sess:
                sess['user_id'] = user.id

            # 1. Send message
            c.post('/api/ai/chat', json={"message": "How do I perform a bicep curl?"})

            # 2. Fetch conversations
            res_convs = c.get('/api/ai/conversations')
            self.assertEqual(res_convs.status_code, 200)
            data_convs = res_convs.get_json()["conversations"]
            self.assertGreater(len(data_convs), 0)
            self.assertGreater(len(data_convs[0]["messages"]), 0)

            # 3. Clear conversation
            res_clear = c.post('/api/ai/conversations/clear', json={"conversation_id": data_convs[0]["id"]})
            self.assertEqual(res_clear.status_code, 200)

            # 4. Verify cleared
            res_check = c.get('/api/ai/conversations')
            data_check = res_check.get_json()["conversations"]
            if data_check:
                self.assertEqual(len(data_check[0]["messages"]), 0)

if __name__ == '__main__':
    unittest.main()
