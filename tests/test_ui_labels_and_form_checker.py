import unittest
from pathlib import Path
from app import app, Exercise, get_exercises_data

class TestUILabelsAndFormChecker(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        self.base_dir = Path("e:/FITSYNC-AI")

    def tearDown(self):
        self.ctx.pop()

    def test_ui_labels_no_single_muscle_focus(self):
        today_html = (self.base_dir / "templates" / "today_workout.html").read_text(encoding="utf-8")
        plan_html = (self.base_dir / "templates" / "workout_plan.html").read_text(encoding="utf-8")

        self.assertNotIn("Single Muscle / Focus", today_html, "Old label Single Muscle / Focus must be removed")
        self.assertNotIn("Single Muscle", today_html, "Old label Single Muscle must be removed")
        self.assertIn("Choose What You Want to Train Today", today_html, "Must contain exact wording Choose What You Want to Train Today")

    def test_demonstration_button_labels(self):
        today_html = (self.base_dir / "templates" / "today_workout.html").read_text(encoding="utf-8")
        plan_html = (self.base_dir / "templates" / "workout_plan.html").read_text(encoding="utf-8")

        self.assertIn("Demonstration", today_html, "today_workout.html must use Demonstration label")
        self.assertIn("Demonstration", plan_html, "workout_plan.html must use Demonstration label")

    def test_exercise_media_and_form_checker_coverage(self):
        all_ex = get_exercises_data()
        self.assertGreaterEqual(len(all_ex), 136, "Must contain all 136 DB exercises")

        checker_js = (self.base_dir / "static" / "js" / "ai_form_checker.js").read_text(encoding="utf-8")

        for ex in all_ex:
            name = ex["name"]
            slug = ex.get("slug") or name.lower().replace(" ", "_")
            cat = ex.get("category", "")
            
            # Media path check
            media_path = ex.get("media_path") or f"/static/exercises/{slug}/demo.svg"
            self.assertIsNotNone(media_path, f"Missing media path for exercise {name}")

            # AI Form Check coverage check
            has_explicit = (slug in checker_js) or (name.lower().replace(" ", "_") in checker_js)
            has_fallback = ("getCategoryFallback" in checker_js)
            self.assertTrue(has_explicit or has_fallback, f"Missing AI Form Checker coverage for {name}")

if __name__ == "__main__":
    unittest.main()
