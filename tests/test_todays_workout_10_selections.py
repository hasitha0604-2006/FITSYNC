import unittest
from app import app, db, User, UserProfile, WorkoutPlan, WorkoutDay, WorkoutExercise, get_exercises_data
from services.fitness_engine import generate_custom_today_workout, EXACT_TODAYS_WORKOUT_OPTIONS

class TestTodaysWorkout10Selections(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    def test_all_10_selections(self):
        user = User.query.filter_by(email="test10@fitsync.com").first()
        if not user:
            user = User(email="test10@fitsync.com", password_hash="hashed")
            db.session.add(user)
            db.session.commit()
            
        if not user.profile:
            profile = UserProfile(
                user_id=user.id,
                name="Tester Ten",
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
        
        selections = [
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
        ]

        for title, expected_groups, is_combined in selections:
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

            # Verify exercise categories match targeted groups
            group_hits = {g: 0 for g in expected_groups}
            for e in created:
                cat = e["category"].lower()
                self.assertIsNotNone(e["exercise_id"], f"Missing exercise_id in {title} exercise {e['name']}")
                
                # Check that exercise belongs to one of the expected groups
                matched = False
                for g in expected_groups:
                    if g == "chest" and cat == "chest":
                        matched = True
                        group_hits["chest"] += 1
                    elif g == "triceps" and cat == "triceps":
                        matched = True
                        group_hits["triceps"] += 1
                    elif g == "back" and cat == "back":
                        matched = True
                        group_hits["back"] += 1
                    elif g == "biceps" and cat == "biceps":
                        matched = True
                        group_hits["biceps"] += 1
                    elif g == "legs" and cat in ["legs", "quadriceps", "hamstrings", "glutes", "calves"]:
                        matched = True
                        group_hits["legs"] += 1
                    elif g == "shoulders" and cat in ["shoulders", "deltoids"]:
                        matched = True
                        group_hits["shoulders"] += 1
                    elif g == "cardio" and cat == "cardio":
                        matched = True
                        group_hits["cardio"] += 1

                self.assertTrue(matched, f"Unrelated exercise '{e['name']}' (category: {e['category']}) in {title}")

            # For combined workouts, verify BOTH target groups are represented
            if is_combined:
                for g in expected_groups:
                    self.assertGreater(group_hits[g], 0, f"Combined workout {title} missing group {g}")

if __name__ == "__main__":
    unittest.main()
