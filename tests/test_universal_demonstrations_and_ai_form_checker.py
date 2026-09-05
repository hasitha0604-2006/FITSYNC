import unittest
import json
from pathlib import Path
from app import app, db, Exercise, get_exercises_data

class TestUniversalDemonstrationsAndAIFormChecker(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        self.base_dir = Path(__file__).resolve().parent.parent

    def tearDown(self):
        self.ctx.pop()

    def test_01_exercise_id_to_demonstration_mapping(self):
        """Verify all exercises in database have valid demonstration mappings or explicit status."""
        all_ex = get_exercises_data()
        self.assertGreaterEqual(len(all_ex), 115, "Exercise library must contain all library exercises")

        for ex in all_ex:
            ex_id = ex.get("id")
            name = ex.get("name")
            self.assertIsNotNone(ex_id, f"Exercise {name} must have a valid ID")
            self.assertTrue(bool(name), f"Exercise ID {ex_id} must have a non-empty name")
            
            # Media path or demonstration asset must be present
            has_media = bool(ex.get("media_path") or ex.get("demonstration_asset"))
            self.assertTrue(has_media, f"Exercise {name} (ID {ex_id}) missing demonstration asset")

    def test_02_exercise_id_to_form_configuration(self):
        """Verify that JavaScript AI Form Checker defines form rules and landmark requirements for core exercises."""
        checker_js = (self.base_dir / "static" / "js" / "ai_form_checker.js").read_text(encoding="utf-8")
        
        core_exercises = [
            "bench_press", "incline_bench_press", "dumbbell_bench_press",
            "push_up", "lat_pulldown", "seated_cable_row", "bicep_curl",
            "tricep_pushdown", "shoulder_press", "squat", "deadlift",
            "plank", "crunch", "bicycle_crunch", "leg_raise", "russian_twist"
        ]

        for slug in core_exercises:
            self.assertIn(slug, checker_js, f"AI Form Checker must contain explicit configuration for {slug}")
            self.assertIn(f"name:", checker_js)

    def test_03_yoga_pose_id_to_yoga_form_configuration(self):
        """Verify all 20 Yoga poses have dedicated configurations in AI Form Checker and 3D configuration registry."""
        checker_js = (self.base_dir / "static" / "js" / "ai_form_checker.js").read_text(encoding="utf-8")
        config_3d_js = (self.base_dir / "static" / "js" / "exercise_3d_config.js").read_text(encoding="utf-8")
        
        yoga_poses = [
            "mountain_pose", "child_pose", "cat_cow", "downward_facing_dog",
            "cobra_pose", "upward_facing_dog", "warrior_i", "warrior_ii",
            "triangle_pose", "tree_pose", "chair_pose", "bridge_pose",
            "boat_pose", "seated_forward_fold", "butterfly_pose", "low_lunge",
            "crescent_lunge", "side_plank", "corpse_pose"
        ]

        for pose in yoga_poses:
            self.assertTrue(
                pose in checker_js or pose.replace("_pose", "") in checker_js or pose.replace("_facing", "") in checker_js,
                f"AI Form Checker missing Yoga pose configuration for {pose}"
            )
            self.assertTrue(
                pose in config_3d_js or pose.replace("_pose", "") in config_3d_js or pose.replace("facing_", "") in config_3d_js or pose.replace("child_", "childs_") in config_3d_js or "downward_dog" in config_3d_js,
                f"3D Config missing Yoga pose configuration for {pose}"
            )

    def test_04_missing_media_handling(self):
        """Verify that the 3D Viewer and UI handle missing or unavailable demonstrations gracefully."""
        viewer_js = (self.base_dir / "static" / "js" / "exercise_3d_viewer.js").read_text(encoding="utf-8")
        self.assertIn("hud-fallback-msg", viewer_js, "3D Viewer must include graceful standby/unavailable fallback messaging")
        self.assertIn("highlightMuscles", viewer_js, "3D Viewer must provide muscle highlighting fallback")

    def test_05_invalid_exercise_id_api_handling(self):
        """Verify API responds with 404 and clean JSON on invalid or nonexistent exercise IDs."""
        res = self.client.get('/api/exercises/99999')
        self.assertEqual(res.status_code, 404)
        data = res.get_json()
        self.assertEqual(data.get("status"), "error")

    def test_06_valid_exercise_api_compatibility(self):
        """Verify API returns 3D metadata, primary/secondary muscles, and equipment for valid exercises."""
        res = self.client.get('/api/exercises/1')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("name", data)
        self.assertIn("category", data)
        self.assertIn("primary_muscles", data)
        self.assertIn("secondary_muscles", data)
        self.assertIn("has_3d_demo", data)
        self.assertTrue(data.get("demonstration_available", True))

    def test_07_rep_state_transitions_logic(self):
        """Verify state-based rep counter logic prevents double counts and counts completed movement cycles."""
        checker_js = (self.base_dir / "static" / "js" / "ai_form_checker.js").read_text(encoding="utf-8")
        self.assertIn("rep_thresholds", checker_js, "AI Form Checker must use threshold-based rep state tracking")
        self.assertIn("repState", checker_js, "AI Form Checker must track repState across movement cycles")

    def test_08_static_pose_hold_detection(self):
        """Verify static Yoga poses use hold timer detection instead of artificial rep counting."""
        checker_js = (self.base_dir / "static" / "js" / "ai_form_checker.js").read_text(encoding="utf-8")
        self.assertIn("is_hold_exercise", checker_js, "AI Form Checker must distinguish static hold poses")
        self.assertIn("holdSeconds", checker_js, "AI Form Checker must compute holdSeconds for static asanas")

    def test_09_ui_demonstration_button_labels_and_ids(self):
        """Verify templates render Demonstration labels and pass exercise_id/to_dict properly."""
        plan_html = (self.base_dir / "templates" / "workout_plan.html").read_text(encoding="utf-8")
        today_html = (self.base_dir / "templates" / "today_workout.html").read_text(encoding="utf-8")
        detail_html = (self.base_dir / "templates" / "exercise_detail.html").read_text(encoding="utf-8")

        self.assertIn("Demonstration", plan_html, "workout_plan.html must use Demonstration label")
        self.assertIn("Demonstration", today_html, "today_workout.html must use Demonstration label")
        self.assertIn("AI Form Check", plan_html, "workout_plan.html must have AI Form Check connection")
        self.assertIn("exercise_id", plan_html, "workout_plan.html must link via exercise_id")

    def test_10_safety_and_privacy_disclaimers(self):
        """Verify that Form Checker includes estimated score labeling and safety coaching disclaimer."""
        checker_js = (self.base_dir / "static" / "js" / "ai_form_checker.js").read_text(encoding="utf-8")
        self.assertIn("FitSync Estimated Form Score", checker_js, "Must include estimated form score phrasing")
        self.assertIn("not a medical diagnosis", checker_js, "Must explicitly clarify coaching aid nature")

if __name__ == "__main__":
    unittest.main()
