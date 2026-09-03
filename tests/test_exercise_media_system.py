import unittest
import json
import os
from pathlib import Path
from app import app, db, Exercise, WorkoutExercise, validate_media_path

class TestExerciseMediaSystem(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['WTF_CSRF_ENABLED'] = False
        self.client = app.test_client()

    def test_canonical_exercise_mapping(self):
        with app.app_context():
            bench = Exercise.query.filter_by(id=1).first()
            self.assertIsNotNone(bench)
            b_dict = bench.to_dict()
            self.assertEqual(b_dict['id'], 1)
            self.assertEqual(b_dict['slug'], 'bench_press')
            self.assertIn('bench_press', b_dict['demonstration_asset'])

            squat = Exercise.query.filter_by(id=10).first()
            self.assertIsNotNone(squat)
            s_dict = squat.to_dict()
            self.assertEqual(s_dict['id'], 10)
            self.assertEqual(s_dict['slug'], 'squat')
            self.assertIn('squat', s_dict['demonstration_asset'])

    def test_api_get_exercise_details(self):
        res = self.client.get('/api/exercises/1')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['id'], 1)
        self.assertEqual(data['name'], 'Bench Press')
        self.assertEqual(data['slug'], 'bench_press')
        self.assertIn('primary_muscles', data)
        self.assertIn('secondary_muscles', data)
        self.assertIn('instructions', data)
        self.assertIn('common_mistakes', data)
        self.assertIn('safety_notes', data)
        self.assertIn('media_status', data)
        self.assertIn('media_available', data)

    def test_api_get_nonexistent_exercise(self):
        res = self.client.get('/api/exercises/99999')
        self.assertEqual(res.status_code, 404)
        data = json.loads(res.data)
        self.assertEqual(data['status'], 'error')

    def test_missing_media_graceful_handling(self):
        res = self.client.get('/api/exercises/2')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data['id'], 2)
        if not os.path.exists('static/exercise_media/incline_dumbbell_press.mp4'):
            self.assertFalse(data['media_available'])
            self.assertEqual(data['media_status'], 'missing')

    def test_media_security_path_validation(self):
        self.assertFalse(validate_media_path('../../.env'))
        self.assertFalse(validate_media_path('/etc/passwd'))
        self.assertFalse(validate_media_path('C:\\Windows\\System32\\cmd.exe'))
        self.assertFalse(validate_media_path('/static/../app.py'))
        self.assertFalse(validate_media_path('static/exercise_media/../../../secret.txt'))
        self.assertFalse(validate_media_path(''))
        self.assertFalse(validate_media_path(None))
        self.assertTrue(validate_media_path('/static/exercise_media/bench_press.mp4'))
        self.assertTrue(validate_media_path('/static/exercises/bench_press/demo.svg'))

    def test_exercise_media_manifest_integrity(self):
        manifest_path = Path('data/exercise_media.json')
        self.assertTrue(manifest_path.exists())
        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest = json.load(f)
        self.assertGreaterEqual(len(manifest), 112)
        self.assertIn('1', manifest)
        self.assertEqual(manifest['1']['slug'], 'bench_press')
        self.assertEqual(manifest['1']['video'], '/static/exercise_media/bench_press.mp4')

    def test_exercise_search_api_includes_media_info(self):
        res = self.client.get('/api/exercises/search?q=bench')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        results = data.get('results') or data.get('exercises', [])
        self.assertGreater(len(results), 0)
        for ex in results:
            self.assertIn('slug', ex)
            self.assertIn('media_path', ex)

    def test_exercise_variations_have_unique_identities(self):
        with app.app_context():
            bench1 = Exercise.query.filter_by(id=1).first()
            bench2 = Exercise.query.filter_by(id=2).first()
            self.assertNotEqual(bench1.id, bench2.id)
            self.assertNotEqual(bench1.to_dict()['slug'], bench2.to_dict()['slug'])
            self.assertNotEqual(bench1.to_dict()['demonstration_asset'], bench2.to_dict()['demonstration_asset'])

if __name__ == '__main__':
    unittest.main()
