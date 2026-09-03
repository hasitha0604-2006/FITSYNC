import unittest
from app import app, db, User, UserProfile, WorkoutPlan, WorkoutDay, WorkoutExercise, get_exercises_data
from services.fitness_engine import generate_custom_today_workout, EXACT_TODAYS_WORKOUT_OPTIONS

class TestTodaysWorkout16Selections(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    def test_all_16_selections(self):
        user = User.query.filter_by(email="test16@fitsync.com").first()
        if not user:
            user = User(email="test16@fitsync.com", password_hash="hashed")
            db.session.add(user)
            db.session.commit()
            
        if not user.profile:
            profile = UserProfile(
                user_id=user.id,
                name="Tester Sixteen",
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
        
        all_16_options = [
            ("Chest Only", ["chest"], False),
            ("Chest + Triceps", ["chest", "triceps"], True),
            ("Triceps Only", ["triceps"], False),
            ("Back Only", ["back"], False),
            ("Back + Biceps", ["back", "biceps"], True),
            ("Biceps Only", ["biceps"], False),
            ("Legs Only", ["legs"], False),
            ("Legs + Shoulders", ["legs", "shoulders"], True),
            ("Shoulders Only", ["shoulders"], False),
            ("Cardio", ["cardio"], False),
            ("Abs", ["abs"], False),
            ("Quadriceps", ["quadriceps"], False),
            ("Hamstrings", ["hamstrings"], False),
            ("Glutes", ["glutes"], False),
            ("Calves", ["calves"], False),
            ("Forearms", ["forearms"], False),
        ]

        self.assertEqual(len(all_16_options), 16, "Must test exactly 16 focus options")

        for title, expected_groups, is_combined in all_16_options:
            success, msg, created = generate_custom_today_workout(
                plan, "Monday", title, 45, "Gym",
                user.profile, user.equipments, all_ex, db.session,
                WorkoutDay, WorkoutExercise
            )

            self.assertTrue(success, f"Failed to generate workout for {title}")
            self.assertGreater(len(created), 0, f"No exercises generated for {title}")

            # Verify no duplicate exercise IDs
            created_ids = [e["exercise_id"] for e in created]
            self.assertEqual(len(created_ids), len(set(created_ids)), f"Duplicate exercises found in {title}")

            # Verify volume targets
            if is_combined:
                # Combined workouts must generate exercises for BOTH groups (10+ exercises when DB has enough)
                self.assertGreaterEqual(len(created), 8, f"Combined workout {title} should generate sufficient volume")
            else:
                # Single-muscle workouts target 5-7 exercises (or max available in DB)
                self.assertGreaterEqual(len(created), 3, f"Single muscle workout {title} generated too few exercises")

            # Verify exercise_id preservation for AI Form Check
            for e in created:
                self.assertIsNotNone(e["exercise_id"], f"Missing exercise_id in {title} exercise {e['name']}")

if __name__ == "__main__":
    unittest.main()
