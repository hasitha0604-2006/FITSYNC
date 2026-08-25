import json
import unittest
from datetime import datetime, timedelta
from app import app, db, User, UserProfile, UserEquipment, UserFoodPreference, NutritionTarget, WorkoutPlan, WorkoutDay, WorkoutExercise, MealPlan, Meal, ProgressRecord
from services.fitness_engine import generate_weekly_workout, find_alternative_exercise
from services.nutrition_engine import calculate_ai_targets, generate_daily_meals, get_food_alternative
from services.adaptation_engine import rebuild_remaining_week_logic

class FitSyncTestCase(unittest.TestCase):
    
    def setUp(self):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///:memory:"
        app.config['WTF_CSRF_ENABLED'] = False
        
        self.app = app.test_client()
        self.ctx = app.app_context()
        self.ctx.push()
        
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_auth_flow(self):
        # Test Register
        resp = self.app.post('/register', data={
            'email': 'newstudent@fitsync.ai',
            'password': 'password123'
        }, follow_redirects=True)
        self.assertEqual(resp.status_code, 200)
        
        u = User.query.filter_by(email='newstudent@fitsync.ai').first()
        self.assertIsNotNone(u)
        
        # Test Login
        resp = self.app.post('/login', data={
            'email': 'newstudent@fitsync.ai',
            'password': 'password123'
        }, follow_redirects=True)
        self.assertEqual(resp.status_code, 200)

    def test_onboarding_equations(self):
        profile = UserProfile(
            name="Test Student",
            age=21,
            gender="Male",
            height=180.0,
            weight=75.0,
            fitness_goal="Muscle Gain",
            fitness_level="Beginner",
            workout_days_per_week=4,
            workout_duration_mins=45,
            dietary_preference="Eggetarian"
        )
        
        macros = calculate_ai_targets(profile)
        self.assertGreater(macros["calories"], 2200)
        self.assertGreater(macros["protein"], 130)

    def test_fitness_generation(self):
        profile = UserProfile(
            name="Fitness Student",
            age=22,
            gender="Female",
            height=160.0,
            weight=55.0,
            fitness_goal="Weight Loss",
            fitness_level="Intermediate",
            workout_days_per_week=4,
            workout_duration_mins=30,
            dietary_preference="Vegetarian"
        )
        
        mock_ex = [
            {"id": 1, "name": "Push-up", "category": "Chest", "equipment": "No Equipment", "default_sets": 3, "default_reps": "12", "default_rest": 60, "instructions": ["Plank position."], "beginner_suitability": True},
            {"id": 2, "name": "Dumbbell Press", "category": "Chest", "equipment": "Dumbbells", "default_sets": 3, "default_reps": "10", "default_rest": 90, "instructions": ["Lie on bench."], "beginner_suitability": True},
            {"id": 3, "name": "Squat", "category": "Legs", "equipment": "No Equipment", "default_sets": 3, "default_reps": "15", "default_rest": 60, "instructions": ["Stand tall."], "beginner_suitability": True}
        ]
        
        equipments = ["Dumbbells", "No Equipment"]
        plan = generate_weekly_workout(profile, equipments, mock_ex)
        self.assertEqual(len(plan), 7)
        
        monday = next(d for d in plan if d["day_name"] == "Monday")
        self.assertEqual(monday["focus"], "Chest + Triceps")
        self.assertFalse(monday["is_rest_day"])
        
        has_chest = any(e["name"] in ["Push-up", "Dumbbell Press"] for e in monday["exercises"])
        self.assertTrue(has_chest)

    def test_exercise_substitutions(self):
        mock_ex = [
            {"id": 1, "name": "Bench Press", "category": "Chest", "equipment": "Full Gym", "default_sets": 3, "default_reps": "10", "default_rest": 90, "instructions": []},
            {"id": 2, "name": "Push-up", "category": "Chest", "equipment": "No Equipment", "default_sets": 3, "default_reps": "12", "default_rest": 60, "instructions": []},
            {"id": 3, "name": "Goblet Squat", "category": "Legs", "equipment": "Dumbbells", "default_sets": 3, "default_reps": "12", "default_rest": 60, "instructions": []}
        ]
        
        alt = find_alternative_exercise("Chest", 1, ["No Equipment"], mock_ex)
        self.assertIsNotNone(alt)
        self.assertEqual(alt["name"], "Push-up")

    def test_meal_generation_and_food_swaps(self):
        profile = UserProfile(
            dietary_preference="Eggetarian",
            fitness_goal="Maintain Weight",
            weight=70.0,
            daily_food_budget=150
        )
        
        targets = NutritionTarget(calories=2000, protein=100.0, carbs=250.0, fat=60.0)
        
        food_prefs = [
            {"food_name": "Boiled Eggs", "is_preferred": False, "is_available": True, "is_avoided": False},
            {"food_name": "Paneer (Cottage Cheese)", "is_preferred": True, "is_available": True, "is_avoided": False}
        ]
        
        mock_foods = [
            {"id": 1, "name": "Boiled Eggs", "category": "Breakfast", "calories": 155, "protein": 13.0, "carbs": 1.1, "fat": 11.0, "serving_size_g": 100, "common_unit": "egg", "is_vegetarian": False},
            {"id": 2, "name": "Paneer (Cottage Cheese)", "category": "Dairy", "calories": 265, "protein": 18.0, "carbs": 1.2, "fat": 20.0, "serving_size_g": 100, "common_unit": "cup", "is_vegetarian": True},
            {"id": 3, "name": "Yellow Dal (Tadka)", "category": "Legumes", "calories": 120, "protein": 8.0, "carbs": 15.0, "fat": 2.0, "serving_size_g": 100, "common_unit": "bowl", "is_vegetarian": True}
        ]
        
        meals = generate_daily_meals(profile, food_preferences_list=food_prefs, target_nutrition=targets, all_foods=mock_foods, date_str="2026-08-23")
        self.assertEqual(len(meals), 5)
        
        # Test alternative food swap
        alt = get_food_alternative(1, 155, 13.0, "Eggetarian", 150, mock_foods, food_prefs)
        self.assertIsNotNone(alt)
        self.assertEqual(alt["name"], "Paneer (Cottage Cheese)")

    def test_missed_workout_rescheduling(self):
        user = User(email="scheduler@fitsync.ai", password_hash="hash")
        db.session.add(user)
        db.session.commit()

        w_plan = WorkoutPlan(user_id=user.id, is_active=True)
        db.session.add(w_plan)
        db.session.commit()

        monday = WorkoutDay(workout_plan_id=w_plan.id, day_name="Monday", focus="Chest + Triceps", is_rest_day=False)
        db.session.add(monday)
        
        wednesday = WorkoutDay(workout_plan_id=w_plan.id, day_name="Wednesday", focus="Rest Day", is_rest_day=True)
        db.session.add(wednesday)
        db.session.commit()

        ex1 = WorkoutExercise(
            workout_day_id=monday.id,
            exercise_id=1,
            name="Bench Press",
            category="Chest",
            sets=3,
            reps="10",
            rest_seconds=90,
            order_idx=0
        )
        db.session.add(ex1)
        db.session.commit()

        db.session.refresh(monday)
        db.session.refresh(wednesday)

        success = rebuild_remaining_week_logic(w_plan, monday.id, WorkoutExercise)
        self.assertTrue(success)
        
        self.assertTrue(monday.is_rest_day)
        self.assertFalse(wednesday.is_rest_day)
        self.assertEqual(wednesday.focus, "Chest + Triceps")

    def test_budget_constraints_and_preferences(self):
        # Create test user first
        user = User(email="budgettest@fitsync.ai", password_hash="hash")
        db.session.add(user)
        db.session.commit()
        
        profile = UserProfile(
            user_id=user.id,
            name="Budget User",
            age=20,
            gender="Male",
            height=175.0,
            weight=70.0,
            fitness_goal="Muscle Gain",
            fitness_level="Beginner",
            workout_days_per_week=4,
            workout_duration_mins=45,
            dietary_preference="Vegetarian",
            daily_food_budget=150,
            onboarding_completed=True
        )
        db.session.add(profile)
        
        targets = NutritionTarget(
            user_id=user.id,
            calories=2000,
            protein=80.0,
            carbs=250.0,
            fat=60.0
        )
        db.session.add(targets)
        db.session.commit()

        # Login user session
        with self.app as c:
            with c.session_transaction() as sess:
                sess['user_id'] = user.id

            # TEST 1: User selects ₹100
            resp = c.post('/api/profile/save', json={
                "daily_food_budget": 100,
                "food_preferences": []
            })
            self.assertEqual(resp.status_code, 200)
            self.assertEqual(profile.daily_food_budget, 100)

            # TEST 2: User selects ₹150
            resp = c.post('/api/profile/save', json={
                "daily_food_budget": 150,
                "food_preferences": []
            })
            self.assertEqual(resp.status_code, 200)
            self.assertEqual(profile.daily_food_budget, 150)

            # TEST 3: User enters custom ₹135
            resp = c.post('/api/profile/save', json={
                "daily_food_budget": 135,
                "food_preferences": []
            })
            self.assertEqual(resp.status_code, 200)
            self.assertEqual(profile.daily_food_budget, 135)

            # TEST 4: Negative budget
            resp = c.post('/api/profile/save', json={
                "daily_food_budget": -50,
                "food_preferences": []
            })
            self.assertEqual(resp.status_code, 400)

            # TEST 5: Non-numeric budget
            resp = c.post('/api/profile/save', json={
                "daily_food_budget": "abc",
                "food_preferences": []
            })
            self.assertEqual(resp.status_code, 400)

            # TEST 6: No budget
            resp = c.post('/api/profile/save', json={
                "food_preferences": []
            })
            self.assertEqual(resp.status_code, 400)

            # TEST 7: Budget persists after reload
            resp = c.post('/api/profile/save', json={
                "daily_food_budget": 125,
                "food_preferences": [
                    {"food_name": "Yellow Dal (Tadka)", "is_preferred": True, "is_available": True, "is_avoided": False}
                ]
            })
            self.assertEqual(resp.status_code, 200)
            db.session.refresh(profile)
            self.assertEqual(profile.daily_food_budget, 125)
            self.assertEqual(len(user.food_preferences), 1)
            self.assertTrue(user.food_preferences[0].is_preferred)

            # TEST 8: Budget persists after logout/login
            c.get('/logout', follow_redirects=True)
            # Login again
            resp = c.post('/login', data={
                'email': 'budgettest@fitsync.ai',
                'password': 'hash' # Mock password matches in testing
            }, follow_redirects=True)
            db.session.refresh(profile)
            self.assertEqual(profile.daily_food_budget, 125)

            # TEST 9: Meal plan respects budget
            targets = NutritionTarget(calories=2000, protein=80.0, carbs=250.0, fat=60.0)
            mock_foods = [
                {"id": 1, "name": "Cheap Rice", "category": "Breakfast", "calories": 200, "protein": 4.0, "carbs": 40.0, "fat": 0.5, "serving_size_g": 100, "common_unit": "plate", "cost_approx": 5, "is_vegetarian": True},
                {"id": 2, "name": "Expensive Oats", "category": "Breakfast", "calories": 200, "protein": 6.0, "carbs": 38.0, "fat": 3.0, "serving_size_g": 100, "common_unit": "bowl", "cost_approx": 90, "is_vegetarian": True}
            ]
            # Set profile budget very low
            profile.daily_food_budget = 40
            meals = generate_daily_meals(profile, [], targets, mock_foods, "2026-08-25")
            # Should favor Cheap Rice because of the cost score penalty on Expensive Oats
            self.assertEqual(meals[0]["food_id"], 1)

            # TEST 10: Meal substitution respects remaining budget
            alt = get_food_alternative(2, 200, 6.0, "Vegetarian", 40, mock_foods, [])
            self.assertIsNotNone(alt)
            self.assertEqual(alt["food_id"], 1) # Substitutes to Cheap Rice

            # TEST 11: Available food is prioritized
            # Create a preferred but unavailable food, and a food that is available
            mock_foods_pref = [
                {"id": 1, "name": "Sprouts Salad", "category": "Breakfast", "calories": 150, "protein": 10.0, "carbs": 20.0, "fat": 1.0, "serving_size_g": 100, "common_unit": "bowl", "cost_approx": 15, "is_vegetarian": True},
                {"id": 2, "name": "Avocado Toast", "category": "Breakfast", "calories": 150, "protein": 4.0, "carbs": 22.0, "fat": 8.0, "serving_size_g": 100, "common_unit": "slice", "cost_approx": 120, "is_vegetarian": True}
            ]
            prefs = [
                {"food_name": "Sprouts Salad", "is_preferred": False, "is_available": True, "is_avoided": False},
                {"food_name": "Avocado Toast", "is_preferred": True, "is_available": False, "is_avoided": False}
            ]
            profile.daily_food_budget = 200
            meals_priority = generate_daily_meals(profile, prefs, targets, mock_foods_pref, "2026-08-25")
            # Should choose Sprouts Salad because it is available, whereas Avocado Toast is not available
            self.assertEqual(meals_priority[0]["food_id"], 1)

            # TEST 12: Avoided food is not recommended
            prefs_avoid = [
                {"food_name": "Sprouts Salad", "is_preferred": False, "is_available": True, "is_avoided": True}
            ]
            meals_avoid = generate_daily_meals(profile, prefs_avoid, targets, mock_foods_pref, "2026-08-25")
            # Should NOT contain Sprouts Salad (food_id 1)
            self.assertNotEqual(meals_avoid[0]["food_id"], 1)

            # TEST 13: Preferred food receives higher priority where practical
            prefs_love = [
                {"food_name": "Sprouts Salad", "is_preferred": True, "is_available": True, "is_avoided": False},
                {"food_name": "Avocado Toast", "is_preferred": False, "is_available": True, "is_avoided": False}
            ]
            # Both are available, but Sprouts Salad is preferred and cheaper. It should be selected.
            meals_love = generate_daily_meals(profile, prefs_love, targets, mock_foods_pref, "2026-08-25")
            self.assertEqual(meals_love[0]["food_id"], 1)

    def test_custom_food_features(self):
        user = User(email="customfood@fitsync.ai", password_hash="hash")
        db.session.add(user)
        db.session.commit()

        with self.app as c:
            with c.session_transaction() as sess:
                sess['user_id'] = user.id

            # 1. Create valid custom food
            resp = c.post('/api/custom-foods', json={
                "name": "Homemade Paneer Wrap",
                "category": "Homemade",
                "serving_size_g": 180,
                "calories": 320,
                "protein": 18.0,
                "carbs": 25.0,
                "fat": 14.0,
                "cost": 40
            })
            self.assertEqual(resp.status_code, 200)
            data = resp.get_json()
            self.assertEqual(data["status"], "success")

            # 2. Verify persistence in DB
            c_foods = c.get('/api/custom-foods').get_json()["custom_foods"]
            self.assertEqual(len(c_foods), 1)
            self.assertEqual(c_foods[0]["name"], "Homemade Paneer Wrap")

            # 3. Test validation - Empty Name
            resp_err = c.post('/api/custom-foods', json={
                "name": "  ",
                "serving_size_g": 100,
                "calories": 200
            })
            self.assertEqual(resp_err.status_code, 400)

            # 4. Test validation - Negative Calories
            resp_neg = c.post('/api/custom-foods', json={
                "name": "Negative Food",
                "serving_size_g": 100,
                "calories": -50
            })
            self.assertEqual(resp_neg.status_code, 400)

            # 5. Delete custom food
            cf_id = c_foods[0]["id"]
            del_resp = c.delete(f'/api/custom-foods/{cf_id}')
            self.assertEqual(del_resp.status_code, 200)
            self.assertEqual(len(c.get('/api/custom-foods').get_json()["custom_foods"]), 0)

    def test_exercise_search_api(self):
        with self.app as c:
            # 1. Search exact
            resp = c.get('/api/exercises/search?q=squat')
            self.assertEqual(resp.status_code, 200)
            data = resp.get_json()
            self.assertGreater(data["count"], 0)
            self.assertTrue(any("squat" in ex["name"].lower() for ex in data["results"]))

            # 2. Search by muscle category
            resp_cat = c.get('/api/exercises/search?category=chest')
            self.assertEqual(resp_cat.status_code, 200)
            data_cat = resp_cat.get_json()
            self.assertGreater(data_cat["count"], 0)
            self.assertTrue(all(ex["category"].lower() == "chest" for ex in data_cat["results"]))

            # 3. Search unsupported query
            resp_none = c.get('/api/exercises/search?q=unsupported_exercise_xyz')
            self.assertEqual(resp_none.status_code, 200)
            self.assertEqual(resp_none.get_json()["count"], 0)

    def test_ai_diet_generation_and_fallback(self):
        user = User(email="aidiet@fitsync.ai", password_hash="hash")
        db.session.add(user)
        db.session.commit()

        profile = UserProfile(
            user_id=user.id,
            name="AI Diet User",
            age=22,
            gender="Male",
            height=178.0,
            weight=74.0,
            fitness_goal="Muscle Gain",
            fitness_level="Intermediate",
            workout_days_per_week=4,
            workout_duration_mins=45,
            dietary_preference="Eggetarian",
            daily_food_budget=150,
            onboarding_completed=True
        )
        db.session.add(profile)
        db.session.commit()

        with self.app as c:
            with c.session_transaction() as sess:
                sess['user_id'] = user.id

            resp = c.post('/api/diet/generate')
            self.assertEqual(resp.status_code, 200)
            data = resp.get_json()
            # TEST 13: Preferred food receives higher priority where practical
            prefs_love = [
                {"food_name": "Sprouts Salad", "is_preferred": True, "is_available": True, "is_avoided": False},
                {"food_name": "Avocado Toast", "is_preferred": False, "is_available": True, "is_avoided": False}
            ]
            # Both are available, but Sprouts Salad is preferred and cheaper. It should be selected.
            meals_love = generate_daily_meals(profile, prefs_love, targets, mock_foods_pref, "2026-08-25")
            self.assertEqual(meals_love[0]["food_id"], 1)

    def test_custom_food_features(self):
        user = User(email="customfood@fitsync.ai", password_hash="hash")
        db.session.add(user)
        db.session.commit()

        with self.app as c:
            with c.session_transaction() as sess:
                sess['user_id'] = user.id

            # 1. Create valid custom food
            resp = c.post('/api/custom-foods', json={
                "name": "Homemade Paneer Wrap",
                "category": "Homemade",
                "serving_size_g": 180,
                "calories": 320,
                "protein": 18.0,
                "carbs": 25.0,
                "fat": 14.0,
                "cost": 40
            })
            self.assertEqual(resp.status_code, 200)
            data = resp.get_json()
            self.assertEqual(data["status"], "success")

            # 2. Verify persistence in DB
            c_foods = c.get('/api/custom-foods').get_json()["custom_foods"]
            self.assertEqual(len(c_foods), 1)
            self.assertEqual(c_foods[0]["name"], "Homemade Paneer Wrap")

            # 3. Test validation - Empty Name
            resp_err = c.post('/api/custom-foods', json={
                "name": "  ",
                "serving_size_g": 100,
                "calories": 200
            })
            self.assertEqual(resp_err.status_code, 400)

            # 4. Test validation - Negative Calories
            resp_neg = c.post('/api/custom-foods', json={
                "name": "Negative Food",
                "serving_size_g": 100,
                "calories": -50
            })
            self.assertEqual(resp_neg.status_code, 400)

            # 5. Delete custom food
            cf_id = c_foods[0]["id"]
            del_resp = c.delete(f'/api/custom-foods/{cf_id}')
            self.assertEqual(del_resp.status_code, 200)
            self.assertEqual(len(c.get('/api/custom-foods').get_json()["custom_foods"]), 0)

    def test_exercise_search_api(self):
        with self.app as c:
            # 1. Search exact
            resp = c.get('/api/exercises/search?q=squat')
            self.assertEqual(resp.status_code, 200)
            data = resp.get_json()
            self.assertGreater(data["count"], 0)
            self.assertTrue(any("squat" in ex["name"].lower() for ex in data["results"]))

            # 2. Search by muscle category
            resp_cat = c.get('/api/exercises/search?category=chest')
            self.assertEqual(resp_cat.status_code, 200)
            data_cat = resp_cat.get_json()
            self.assertGreater(data_cat["count"], 0)
            self.assertTrue(all(ex["category"].lower() == "chest" for ex in data_cat["results"]))

            # 3. Search unsupported query
            resp_none = c.get('/api/exercises/search?q=unsupported_exercise_xyz')
            self.assertEqual(resp_none.status_code, 200)
            self.assertEqual(resp_none.get_json()["count"], 0)

    def test_ai_diet_generation_and_fallback(self):
        user = User(email="aidiet@fitsync.ai", password_hash="hash")
        db.session.add(user)
        db.session.commit()

        profile = UserProfile(
            user_id=user.id,
            name="AI Diet User",
            age=22,
            gender="Male",
            height=178.0,
            weight=74.0,
            fitness_goal="Muscle Gain",
            fitness_level="Intermediate",
            workout_days_per_week=4,
            workout_duration_mins=45,
            dietary_preference="Eggetarian",
            daily_food_budget=150,
            onboarding_completed=True
        )
        db.session.add(profile)
        db.session.commit()

        with self.app as c:
            with c.session_transaction() as sess:
                sess['user_id'] = user.id

            resp = c.post('/api/diet/generate')
            self.assertEqual(resp.status_code, 200)
            data = resp.get_json()
            self.assertEqual(data["status"], "success")
            self.assertTrue("meals" in data)
            self.assertEqual(len(data["meals"]), 5)
            self.assertTrue("explanation" in data)

    def test_workout_graphics_assets(self):
        with self.app as c:
            resp = c.get('/api/exercises/search')
            all_ex = resp.get_json()["results"]
            self.assertGreaterEqual(len(all_ex), 40)
            for ex in all_ex:
                self.assertIn("media_path", ex)
                self.assertIn("supported_demo", ex)

    def test_ai_gym_search_api(self):
        with self.app as c:
            # 1. Biceps Gym Search
            resp = c.post('/api/ai/search', json={"query": "biceps workout at gym"})
            self.assertEqual(resp.status_code, 200)
            data = resp.get_json()
            self.assertEqual(data["status"], "success")
            self.assertEqual(data["category"], "discovery")
            self.assertIn("biceps", data["intent"]["target_muscles"])
            self.assertTrue(data["intent"]["is_gym"])
            self.assertGreater(len(data["exercises"]), 0)

            # 2. Dumbbell Shoulder Search
            resp_sh = c.post('/api/ai/search', json={"query": "shoulder exercises with dumbbells"})
            self.assertEqual(resp_sh.status_code, 200)
            data_sh = resp_sh.get_json()
            self.assertEqual(data_sh["status"], "success")
            self.assertIn("shoulders", data_sh["intent"]["target_muscles"])

            # 3. Exercise Replacement Search
            resp_alt = c.post('/api/ai/search', json={"query": "replace bench press"})
            self.assertEqual(resp_alt.status_code, 200)
            data_alt = resp_alt.get_json()
            self.assertEqual(data_alt["category"], "alternative")
            self.assertGreater(len(data_alt["exercises"]), 0)

            # 4. Injury / Pain Safety Disclaimer
            resp_safe = c.post('/api/ai/search', json={"query": "knee pain during squat"})
            self.assertEqual(resp_safe.status_code, 200)
            data_safe = resp_safe.get_json()
            self.assertEqual(data_safe["category"], "safety")
            self.assertIn("Safety First", data_safe["explanation"])

            # 5. Unsupported Query Fallback
            resp_unk = c.post('/api/ai/search', json={"query": "xyz_unknown_exercise_99"})
            self.assertEqual(resp_unk.status_code, 200)
            data_unk = resp_unk.get_json()
            self.assertEqual(data_unk["category"], "unsupported")

    def test_gym_knowledge_base_files(self):
        import os
        base_path = "data/gym_knowledge"
        required_files = ["muscles.json", "equipment.json", "workout_types.json", "fitness_goals.json", "exercise_aliases.json", "common_questions.json"]
        for f in required_files:
            full_p = os.path.join(base_path, f)
            self.assertTrue(os.path.exists(full_p), f"Missing knowledge base file: {full_p}")

    def test_exercise_catalog_expansion(self):
        with self.app as c:
            resp = c.get('/api/exercises/search')
            all_ex = resp.get_json()["results"]
            self.assertGreaterEqual(len(all_ex), 45)
            categories = {ex["category"] for ex in all_ex}
            expected_cats = {"Chest", "Back", "Shoulders", "Biceps", "Triceps", "Forearms", "Core", "Glutes", "Legs"}
            for ec in expected_cats:
                self.assertIn(ec, categories)

if __name__ == '__main__':
    unittest.main()
