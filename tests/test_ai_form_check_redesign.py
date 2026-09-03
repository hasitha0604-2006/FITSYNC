import unittest
import json
from app import app, db, Exercise
from services.form_analysis import check_exercise_form

class TestAIFormCheckRedesign(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()

    def test_all_10_exercises_and_fallbacks(self):
        exercises_to_test = [
            "Bench Press",
            "Incline Bench Press",
            "Dumbbell Bench Press",
            "Push-Up",
            "Lat Pulldown",
            "Seated Cable Row",
            "Bicep Curl",
            "Tricep Pushdown",
            "Shoulder Press",
            "Squat",
            "Custom Unknown Exercise" # Fallback test
        ]
        
        for ex in exercises_to_test:
            res = check_exercise_form(ex, "MOCK_FRAME")
            self.assertEqual(res["status"], "success")
            self.assertIn("feedback", res)
            self.assertIn("score", res)
            self.assertIn("phase", res)
            self.assertIn("angle", res)

    def test_form_check_route_renders_exercises(self):
        with self.app.app_context():
            ex = Exercise.query.first()
            if ex:
                response = self.client.get(f"/form-check?exercise_id={ex.id}")
                self.assertIn(response.status_code, [200, 302])
            else:
                response = self.client.get("/form-check")
                self.assertIn(response.status_code, [200, 302])

if __name__ == "__main__":
    unittest.main()
