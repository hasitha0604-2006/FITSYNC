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

    def test_cpp_engine_structure_and_bones_exist(self):
        base_dir = Path(__file__).resolve().parent.parent
        cpp_dir = base_dir / "animation_engine"
        
        self.assertTrue(cpp_dir.exists(), "animation_engine directory must exist")
        self.assertTrue((cpp_dir / "CMakeLists.txt").exists(), "CMakeLists.txt must exist")
        self.assertTrue((cpp_dir / "include" / "AnimationEngine.h").exists(), "AnimationEngine.h must exist")
        self.assertTrue((cpp_dir / "include" / "Joint.h").exists(), "Joint.h must exist")
        self.assertTrue((cpp_dir / "include" / "Bone.h").exists(), "Bone.h must exist")
        self.assertTrue((cpp_dir / "src" / "Bone.cpp").exists(), "Bone.cpp must exist")
        self.assertTrue((cpp_dir / "exercises" / "bench_press.cpp").exists(), "bench_press.cpp must exist")
        self.assertTrue((cpp_dir / "exercises" / "romanian_deadlift.cpp").exists(), "romanian_deadlift.cpp must exist")

    def test_exercise_animations_json_schema(self):
        base_dir = Path(__file__).resolve().parent.parent
        json_path = base_dir / "data" / "exercise_animations.json"
        
        self.assertTrue(json_path.exists(), "exercise_animations.json must exist")
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        required_exercises = [
            "bench_press", "squat", "deadlift", "pushup", "pullup",
            "bicep_curl", "shoulder_press", "lateral_raise", "tricep_pushdown", "romanian_deadlift"
        ]

        for ex_id in required_exercises:
            self.assertIn(ex_id, data, f"Exercise animation '{ex_id}' must exist in exercise_animations.json")
            ex_data = data[ex_id]
            self.assertIn("keyframes", ex_data)
            self.assertTrue(len(ex_data["keyframes"]) >= 2)
            self.assertIn("primary_muscles", ex_data)

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

    def test_exercise_substitution_animation_update(self):
        res_barbell = self.client.get("/api/exercises/bench_press/animation-config")
        self.assertEqual(res_barbell.status_code, 200)

        res_rdl = self.client.get("/api/exercises/romanian_deadlift/animation-config")
        self.assertEqual(res_rdl.status_code, 200)

        data_rdl = res_rdl.get_json()
        self.assertEqual(data_rdl["status"], "success")
        self.assertEqual(data_rdl["config"]["animation_data"]["name"], "Romanian Deadlift")

if __name__ == '__main__':
    unittest.main()
