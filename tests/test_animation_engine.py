import os
import json
import unittest
from pathlib import Path
from app import app, db, Exercise, seed_database

class AnimationEngineTestCase(unittest.TestCase):

    def setUp(self):
        app.config['TESTING'] = True
        app.config['WTF_CSRF_ENABLED'] = False
        self.client = app.test_client()
        self.ctx = app.app_context()
        self.ctx.push()
        db.create_all()
        seed_database()

    def tearDown(self):
        db.session.remove()
        self.ctx.pop()

    def test_cpp_engine_structure_exists(self):
        base_dir = Path(__file__).resolve().parent.parent
        cpp_dir = base_dir / "animation_engine"
        
        self.assertTrue(cpp_dir.exists(), "animation_engine directory must exist")
        self.assertTrue((cpp_dir / "CMakeLists.txt").exists(), "CMakeLists.txt must exist")
        self.assertTrue((cpp_dir / "include" / "AnimationEngine.h").exists(), "AnimationEngine.h must exist")
        self.assertTrue((cpp_dir / "include" / "Joint.h").exists(), "Joint.h must exist")
        self.assertTrue((cpp_dir / "include" / "AnimationFrame.h").exists(), "AnimationFrame.h must exist")
        self.assertTrue((cpp_dir / "src" / "AnimationEngine.cpp").exists(), "AnimationEngine.cpp must exist")
        self.assertTrue((cpp_dir / "exercises" / "bench_press.cpp").exists(), "bench_press.cpp must exist")

    def test_exercise_animations_json_schema(self):
        base_dir = Path(__file__).resolve().parent.parent
        json_path = base_dir / "data" / "exercise_animations.json"
        
        self.assertTrue(json_path.exists(), "exercise_animations.json must exist")
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.assertIn("bench_press", data)
        self.assertIn("squat", data)
        self.assertIn("deadlift", data)
        self.assertIn("bicep_curl", data)

        bench = data["bench_press"]
        self.assertEqual(bench["movement_type"], "push")
        self.assertIn("Chest", bench["primary_muscles"])
        self.assertTrue(len(bench["keyframes"]) >= 3)
        self.assertIn("equipment", bench["keyframes"][0])

    def test_animation_api_endpoints(self):
        # 1. /api/exercises/<id>/animation
        res = self.client.get("/api/exercises/1/animation")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertIn("animation", data)

        # 2. /api/exercises/<id>/muscles
        res = self.client.get("/api/exercises/1/muscles")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertIn("primary_muscles", data)

        # 3. /api/exercises/<id>/movement
        res = self.client.get("/api/exercises/1/movement")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertIn("movement_type", data)

        # 4. /api/exercises/<id>/animation-config
        res = self.client.get("/api/exercises/1/animation-config")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "success")
        self.assertIn("config", data)
        self.assertIn("animation_data", data["config"])

    def test_exercise_substitution_animation_data(self):
        # Verify bench_press -> dumbbell_bench_press substitution animation lookup
        res_barbell = self.client.get("/api/exercises/bench_press/animation-config")
        self.assertEqual(res_barbell.status_code, 200)

        res_dumbbell = self.client.get("/api/exercises/dumbbell_bench_press/animation-config")
        self.assertEqual(res_dumbbell.status_code, 200)
        data_db = res_dumbbell.get_json()
        self.assertEqual(data_db["status"], "success")

if __name__ == '__main__':
    unittest.main()
