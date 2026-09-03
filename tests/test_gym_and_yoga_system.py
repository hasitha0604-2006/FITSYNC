import unittest
from app import app, db, User, UserProfile, WorkoutPlan, WorkoutDay, WorkoutExercise, get_exercises_data
from services.fitness_engine import generate_custom_today_workout, EXACT_TODAYS_WORKOUT_OPTIONS, EXACT_YOGA_OPTIONS

class TestGymAndYogaSystem(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    def test_all_16_gym_options(self):
        user = User.query.filter_by(email="testgym@fitsync.com").first()
        if not user:
            user = User(email="testgym@fitsync.com", password_hash="hashed")
            db.session.add(user)
            db.session.commit()
            
        if not user.profile:
            profile = UserProfile(
                user_id=user.id,
                name="Gym Tester",
                age=25,
                gender="Male",
                height=175.0,
                weight=70.0,
                fitness_goal="Muscle Gain",
                fitness_level="Intermediate",
                workout_environment="Gym",
                dietary_preference="None"
            )
            db.session.add(profile)
            db.session.commit()

        plan = WorkoutPlan.query.filter_by(user_id=user.id, is_active=True).first()
        if not plan:
            plan = WorkoutPlan(user_id=user.id, is_active=True)
            db.session.add(plan)
            db.session.commit()

        all_ex = get_exercises_data()
        self.assertGreaterEqual(len(all_ex), 116, "Database must contain Gym and Yoga exercise records")

        for key, cfg in EXACT_TODAYS_WORKOUT_OPTIONS.items():
            title = cfg["title"]
            success, msg, created = generate_custom_today_workout(
                plan, "Monday", title, 45, "Gym",
                user.profile, user.equipments, all_ex, db.session,
                WorkoutDay, WorkoutExercise
            )
            self.assertTrue(success, f"Gym generation failed for {title}")
            self.assertGreater(len(created), 0, f"No Gym exercises generated for {title}")

    def test_all_9_yoga_categories(self):
        user = User.query.filter_by(email="testyoga@fitsync.com").first()
        if not user:
            user = User(email="testyoga@fitsync.com", password_hash="hashed")
            db.session.add(user)
            db.session.commit()
            
        if not user.profile:
            profile = UserProfile(
                user_id=user.id,
                name="Yoga Tester",
                age=25,
                gender="Female",
                height=165.0,
                weight=55.0,
                fitness_goal="Flexibility",
                fitness_level="Beginner",
                workout_environment="No Equipment",
                dietary_preference="Vegetarian"
            )
            db.session.add(profile)
            db.session.commit()

        plan = WorkoutPlan.query.filter_by(user_id=user.id, is_active=True).first()
        if not plan:
            plan = WorkoutPlan(user_id=user.id, is_active=True)
            db.session.add(plan)
            db.session.commit()

        all_ex = get_exercises_data()

        for key, cfg in EXACT_YOGA_OPTIONS.items():
            title = cfg["title"]
            success, msg, created = generate_custom_today_workout(
                plan, "Tuesday", title, 30, "No Equipment",
                user.profile, user.equipments, all_ex, db.session,
                WorkoutDay, WorkoutExercise
            )
            self.assertTrue(success, f"Yoga generation failed for {title}")
            self.assertGreaterEqual(len(created), 4, f"Yoga category {title} generated too few poses")
            
            # Verify pose IDs and category
            for pose in created:
                self.assertIsNotNone(pose["exercise_id"], f"Missing exercise_id in Yoga pose {pose['name']}")
                self.assertTrue("yoga" in pose["category"].lower(), f"Category must be Yoga for {pose['name']}")

if __name__ == "__main__":
    unittest.main()
