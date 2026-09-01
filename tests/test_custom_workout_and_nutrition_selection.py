import unittest
import json
from app import app, db, User, UserProfile, WorkoutPlan, WorkoutDay, WorkoutExercise, MealPlan, Meal, Food, CustomFood
from werkzeug.security import generate_password_hash
from services.fitness_engine import filter_exercises_for_focus, generate_custom_today_workout
from services.nutrition_engine import swap_meal_with_chosen_food
from datetime import datetime


class TestCustomWorkoutAndNutritionSelection(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()

        # Clean existing test user
        self.test_email = 'test_custom_features@example.com'
        old_u = User.query.filter_by(email=self.test_email).first()
        if old_u:
            CustomFood.query.filter_by(user_id=old_u.id).delete()
            plans = WorkoutPlan.query.filter_by(user_id=old_u.id).all()
            for p in plans:
                for d in p.days:
                    WorkoutExercise.query.filter_by(workout_day_id=d.id).delete()
                WorkoutDay.query.filter_by(workout_plan_id=p.id).delete()
            WorkoutPlan.query.filter_by(user_id=old_u.id).delete()

            meal_plans = MealPlan.query.filter_by(user_id=old_u.id).all()
            for mp in meal_plans:
                Meal.query.filter_by(meal_plan_id=mp.id).delete()
            MealPlan.query.filter_by(user_id=old_u.id).delete()

            UserProfile.query.filter_by(user_id=old_u.id).delete()
            db.session.delete(old_u)
            db.session.commit()

        self.user = User(
            email=self.test_email,
            password_hash=generate_password_hash('TestPassword123!')
        )
        db.session.add(self.user)
        db.session.commit()

        self.profile = UserProfile.query.filter_by(user_id=self.user.id).first()
        if not self.profile:
            self.profile = UserProfile(
                user_id=self.user.id,
                name='Custom Feature Tester',
                age=21,
                gender='male',
                height=175.0,
                weight=72.0,
                fitness_goal='Muscle Gain',
                fitness_level='Intermediate',
                dietary_preference='Non-Vegetarian',
                workout_days_per_week=4,
                workout_environment='Gym',
                daily_food_budget=200
            )
            db.session.add(self.profile)
            db.session.commit()

        # Active workout plan
        self.plan = WorkoutPlan(user_id=self.user.id, is_active=True)
        db.session.add(self.plan)
        db.session.commit()

        today_name = datetime.now().strftime('%A')
        self.today_day = WorkoutDay(
            workout_plan_id=self.plan.id,
            day_name=today_name,
            day_number=1,
            focus='Full Body',
            duration_minutes=45,
            is_rest_day=False,
            status='upcoming'
        )
        db.session.add(self.today_day)

        # Active meal plan
        self.meal_plan = MealPlan(
            user_id=self.user.id,
            date=datetime.now().strftime('%Y-%m-%d'),
            total_calories=2000,
            total_protein=120.0,
            total_carbs=220.0,
            total_fat=60.0,
            total_cost=150
        )
        db.session.add(self.meal_plan)
        db.session.commit()

        food = Food.query.first()
        food_id = food.id if food else 1

        self.test_meal = Meal(
            meal_plan_id=self.meal_plan.id,
            meal_type='Breakfast',
            food_id=food_id,
            food_name='Oatmeal with Milk',
            serving_size_g=150,
            calories=300,
            protein=12.0,
            carbs=45.0,
            fat=6.0,
            cost=25,
            common_unit='1 bowl'
        )
        db.session.add(self.test_meal)
        db.session.commit()

    def tearDown(self):
        # Selective cleanup of only this test user
        if hasattr(self, 'user') and self.user:
            u = User.query.filter_by(email=self.test_email).first()
            if u:
                CustomFood.query.filter_by(user_id=u.id).delete()
                plans = WorkoutPlan.query.filter_by(user_id=u.id).all()
                for p in plans:
                    for d in p.days:
                        WorkoutExercise.query.filter_by(workout_day_id=d.id).delete()
                    WorkoutDay.query.filter_by(workout_plan_id=p.id).delete()
                WorkoutPlan.query.filter_by(user_id=u.id).delete()

                meal_plans = MealPlan.query.filter_by(user_id=u.id).all()
                for mp in meal_plans:
                    Meal.query.filter_by(meal_plan_id=mp.id).delete()
                MealPlan.query.filter_by(user_id=u.id).delete()

                UserProfile.query.filter_by(user_id=u.id).delete()
                db.session.delete(u)
                db.session.commit()

        self.ctx.pop()

    def _login(self):
        with self.client.session_transaction() as sess:
            sess['user_id'] = self.user.id
            sess['_fresh'] = True

    def test_single_muscle_biceps_filter(self):
        """Test that single muscle focus filtering returns biceps-targeted exercises."""
        all_ex = [
            {'id': 1, 'name': 'Barbell Bicep Curl', 'category': 'Arms', 'primary_muscles': ['Biceps'], 'equipment': 'Barbell'},
            {'id': 2, 'name': 'Bench Press', 'category': 'Chest', 'primary_muscles': ['Pectorals'], 'equipment': 'Barbell'},
            {'id': 3, 'name': 'Hammer Curl', 'category': 'Arms', 'primary_muscles': ['Biceps', 'Brachialis'], 'equipment': 'Dumbbells'},
            {'id': 4, 'name': 'Barbell Squat', 'category': 'Legs', 'primary_muscles': ['Quadriceps'], 'equipment': 'Barbell'},
            {'id': 5, 'name': 'Concentration Curl', 'category': 'Arms', 'primary_muscles': ['Biceps'], 'equipment': 'Dumbbells'},
        ]
        biceps_ex = filter_exercises_for_focus(all_ex, 'Biceps')
        self.assertTrue(len(biceps_ex) >= 2)
        names = [e['name'] for e in biceps_ex]
        self.assertIn('Barbell Bicep Curl', names)
        self.assertIn('Hammer Curl', names)
        self.assertNotIn('Barbell Squat', names)

    def test_single_muscle_chest_filter(self):
        """Test single muscle focus filtering for Chest."""
        all_ex = [
            {'id': 1, 'name': 'Incline Dumbbell Press', 'category': 'Chest', 'primary_muscles': ['Pectorals'], 'equipment': 'Dumbbells'},
            {'id': 2, 'name': 'Lat Pulldown', 'category': 'Back', 'primary_muscles': ['Latissimus Dorsi'], 'equipment': 'Cable Machine'},
            {'id': 3, 'name': 'Dumbbell Fly', 'category': 'Chest', 'primary_muscles': ['Pectorals'], 'equipment': 'Dumbbells'}
        ]
        chest_ex = filter_exercises_for_focus(all_ex, 'Chest')
        names = [e['name'] for e in chest_ex]
        self.assertIn('Incline Dumbbell Press', names)
        self.assertIn('Dumbbell Fly', names)
        self.assertNotIn('Lat Pulldown', names)

    def test_api_generate_custom_today_workout(self):
        """Test POST /api/workout/generate-custom-today endpoint."""
        self._login()
        res = self.client.post('/api/workout/generate-custom-today', json={
            'focus': 'Biceps',
            'duration_mins': 30,
            'environment': 'Gym'
        })
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['focus'], 'Biceps')
        self.assertEqual(data['duration_minutes'], 30)
        self.assertTrue(len(data['exercises']) >= 1)

        # Verify DB updated
        today_name = datetime.now().strftime('%A')
        w_day = WorkoutDay.query.filter_by(workout_plan_id=self.plan.id, day_name=today_name).first()
        self.assertEqual(w_day.focus, 'Biceps')
        self.assertFalse(w_day.is_rest_day)

    def test_api_get_available_foods(self):
        """Test GET /api/nutrition/available-foods returns food list."""
        self._login()
        res = self.client.get('/api/nutrition/available-foods')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data['status'], 'success')
        self.assertTrue(data['total'] > 0)
        self.assertTrue(isinstance(data['foods'], list))

    def test_api_select_food_for_meal(self):
        """Test POST /api/nutrition/select-food-for-meal updates meal and recalculates macros."""
        self._login()
        food = Food.query.first()
        if not food:
            food = Food(name='Boiled Eggs', category='Dairy', calories=155, protein=13.0, carbs=1.1, fat=11.0, serving_size_g=100)
            db.session.add(food)
            db.session.commit()

        res = self.client.post('/api/nutrition/select-food-for-meal', json={
            'meal_id': self.test_meal.id,
            'food_name': food.name,
            'serving_size_g': 100
        })
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['meal']['food_name'], food.name)

        db.session.refresh(self.test_meal)
        self.assertEqual(self.test_meal.food_name, food.name)

    def test_theme_css_definitions(self):
        """Test that style.css contains light theme and dark theme root tokens."""
        with open('static/css/style.css', 'r', encoding='utf-8') as f:
            css = f.read()

        self.assertIn('[data-theme="light"]', css)
        self.assertIn('body.theme-light', css)
        self.assertIn('.hud-card', css)
        self.assertIn('.tab-pill', css)


if __name__ == '__main__':
    unittest.main()
