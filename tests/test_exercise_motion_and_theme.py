import unittest
import os
from app import app, db, User, UserProfile, WorkoutPlan, WorkoutDay, WorkoutExercise, Exercise, Food, NutritionTarget, seed_database
from services.ai_coach_engine import process_coach_command

class ExerciseMotionAndThemeTestCase(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.app_context = app.app_context()
        self.app_context.push()
        db.create_all()
        if not User.query.filter_by(email='demo@fitsync.ai').first():
            seed_database()

    def tearDown(self):
        self.app_context.pop()

    def test_1_exercise_motion_player_asset_integrity(self):
        js_path = os.path.join(app.root_path, 'static', 'js', 'exercise_motion_player.js')
        self.assertTrue(os.path.exists(js_path), 'exercise_motion_player.js must exist')

        with open(js_path, 'r', encoding='utf-8') as f:
            js_text = f.read()

        required_patterns = [
            'renderArmCurl', 'renderChestPress', 'renderOverheadPress',
            'renderSquat', 'renderDeadlift', 'renderRowPull',
            'renderLunge', 'renderLateralRaise', 'renderTricepExt',
            'renderCorePlank', 'renderLegIso',
            'initExerciseMotionPlayer', 'BiomechanicalPlayer'
        ]
        for pat in required_patterns:
            self.assertIn(pat, js_text, f'Pattern {pat} must be present in exercise_motion_player.js')

    def test_2_theme_css_tokens_integrity(self):
        css_path = os.path.join(app.root_path, 'static', 'css', 'style.css')
        self.assertTrue(os.path.exists(css_path), 'style.css must exist')

        with open(css_path, 'r', encoding='utf-8') as f:
            css_text = f.read()

        self.assertIn('--primary:', css_text)
        self.assertIn('--background:', css_text)
        self.assertIn('--surface:', css_text)
        self.assertIn('[data-theme="light"]', css_text)

    def test_3_ai_coach_replace_exercise_intent(self):
        u = User.query.filter_by(email='demo@fitsync.ai').first()
        self.assertIsNotNone(u)
        res = process_coach_command(u, 'Replace the first exercise in today workout')
        self.assertEqual(res.get('status'), 'success')
        self.assertEqual(res.get('intent'), 'REPLACE_EXERCISE')
        self.assertIn('proposed_action', res)
        self.assertEqual(res['proposed_action']['type'], 'REPLACE_EXERCISE')

    def test_4_ai_coach_explain_progress_intent(self):
        u = User.query.filter_by(email='demo@fitsync.ai').first()
        self.assertIsNotNone(u)
        res = process_coach_command(u, 'How am I progressing this week?')
        self.assertEqual(res.get('status'), 'success')
        self.assertEqual(res.get('intent'), 'EXPLAIN_PROGRESS')
        self.assertIn('Weekly Workout Completion', res.get('coach_reply', ''))

if __name__ == '__main__':
    unittest.main()
