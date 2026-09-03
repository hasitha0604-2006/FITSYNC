import unittest
from app import app, db, Exercise
from services.form_analysis import check_exercise_form

class TestAIFormCheckAllMuscles(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    def test_new_muscle_groups_form_check(self):
        # Exercises spanning Abs, Quads, Hamstrings, Glutes, Calves, Forearms
        test_exercises = [
            ("Crunch", "Core"),
            ("Bicycle Crunches", "Core"),
            ("Hanging Leg Raise", "Core"),
            ("Russian Twists", "Core"),
            ("Plank", "Core"),
            ("Squat", "Legs"),
            ("Kettlebell Goblet Squat", "Legs"),
            ("Walking Lunges", "Legs"),
            ("Leg Press", "Legs"),
            ("Seated Leg Curl", "Hamstrings"),
            ("Dumbbell Romanian Deadlift", "Hamstrings"),
            ("Glute Bridge", "Glutes"),
            ("Barbell Glute Bridge", "Glutes"),
            ("Seated Calf Raise", "Calves"),
            ("Standing Barbell Calf Raise", "Calves"),
            ("Wrist Curls", "Forearms"),
            ("Reverse Wrist Curls", "Forearms"),
            ("Farmers Walk", "Forearms")
        ]

        for ex_name, category in test_exercises:
            res = check_exercise_form(ex_name, "MOCK_FRAME")
            self.assertEqual(res["status"], "success", f"Form check failed for {ex_name}")
            self.assertIn("feedback", res, f"Feedback missing for {ex_name}")
            self.assertIn("score", res, f"Score missing for {ex_name}")
            self.assertIn("phase", res, f"Phase missing for {ex_name}")

    def test_existing_muscle_groups_regression(self):
        # Existing muscle groups
        existing_exercises = [
            "Bench Press",
            "Incline Bench Press",
            "Tricep Pushdown",
            "Dumbbell Overhead Extension",
            "Lat Pulldown",
            "Seated Cable Row",
            "Bicep Curl",
            "Hammer Curl",
            "Shoulder Press",
            "Lateral Raise"
        ]

        for ex_name in existing_exercises:
            res = check_exercise_form(ex_name, "MOCK_FRAME")
            self.assertEqual(res["status"], "success", f"Form check failed for {ex_name}")

if __name__ == "__main__":
    unittest.main()
