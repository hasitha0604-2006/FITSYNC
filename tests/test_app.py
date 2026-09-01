import json
import unittest
from datetime import datetime, timedelta
from app import app, db, User, UserProfile, UserEquipment, UserFoodPreference, NutritionTarget, WorkoutPlan, WorkoutDay, WorkoutExercise, MealPlan, Meal, ProgressRecord, seed_database
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
        seed_database()

    def tearDown(self):
        try:
            User.query.filter(User.email.in_([
                'newstudent@fitsync.ai', 'persistent_user@fitsync.ai', 'scheduler@fitsync.ai',
                'budgettest@fitsync.ai', 'customfood@fitsync.ai', 'aidiet@fitsync.ai',
                'workout_test_user@fitsync.ai', 'coach_user@fitsync.ai', 'casetest@fitsync.ai',
                'dup@fitsync.ai', 'usera@fitsync.ai', 'userb@fitsync.ai'
            ])).delete()
            db.session.commit()
        except Exception:
            db.session.rollback()
        db.session.remove()
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

    def test_onboarding_persistence_and_login_redirection(self):
        # 1. Register a new user
        self.app.post('/register', data={
            'email': 'persistent_user@fitsync.ai',
            'password': 'password123'
        }, follow_redirects=True)

        user = User.query.filter_by(email='persistent_user@fitsync.ai').first()
        self.assertIsNotNone(user)

        # 2. Complete Onboarding via POST
        payload = {
            "name": "Alex Smith",
            "age": 22,
            "gender": "Male",
            "height": 178.0,
            "weight": 74.0,
            "fitness_goal": "Muscle Gain",
            "fitness_level": "Intermediate",
            "workout_days_per_week": 4,
            "workout_duration_mins": 45,
            "workout_environment": "Gym",
            "dietary_preference": "Non-Vegetarian",
            "budget_preference": "₹200",
            "daily_food_budget": 200,
            "equipments": ["Dumbbells", "Barbell"],
            "food_preferences": []
        }

        res = self.app.post('/onboarding', json=payload)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["status"], "success")

        # 3. Verify profile details were saved to database
        db_profile = UserProfile.query.filter_by(user_id=user.id).first()
        self.assertIsNotNone(db_profile)
        self.assertEqual(db_profile.name, "Alex Smith")
        self.assertEqual(db_profile.age, 22)
        self.assertEqual(db_profile.height, 178.0)
        self.assertEqual(db_profile.weight, 74.0)
        self.assertTrue(db_profile.onboarding_completed)

        # 4. Logout
        self.app.get('/logout', follow_redirects=True)

        # 5. Login again -> should go directly to dashboard (location ending with /dashboard)
        resp_login = self.app.post('/login', data={
            'email': 'persistent_user@fitsync.ai',
            'password': 'password123'
        }, follow_redirects=False)
        self.assertEqual(resp_login.status_code, 302)
        self.assertTrue(resp_login.location.endswith('/dashboard'))

        # 6. Trying to access GET /onboarding when already onboarded -> redirects to /dashboard
        with self.app.session_transaction() as sess:
            sess['user_id'] = user.id

        resp_onboarding = self.app.get('/onboarding', follow_redirects=False)
        self.assertEqual(resp_onboarding.status_code, 302)
        self.assertTrue(resp_onboarding.location.endswith('/dashboard'))

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

    def test_workout_data_contract_and_type_safety(self):
        # 1. Test generate_weekly_workout with string params and None equipment
        class StringProfile:
            workout_days_per_week = "3"
            workout_duration_mins = "30"
            fitness_level = "Beginner"
            fitness_goal = "Muscle Gain"
            
        mock_ex = [
            {"id": 1, "name": "Push-up", "category": "Chest", "equipment": "No Equipment", "default_sets": "3", "default_reps": "12-15", "default_rest": "60", "instructions": ["Plank."], "beginner_suitability": True}
        ]
        
        plan = generate_weekly_workout(StringProfile(), None, mock_ex)
        self.assertEqual(len(plan), 7)
        monday = next(d for d in plan if d["day_name"] == "Monday")
        self.assertEqual(monday["day_number"], 1)
        self.assertFalse(monday["is_rest_day"])
        
        ex = monday["exercises"][0]
        self.assertEqual(ex["reps_min"], 12)
        self.assertEqual(ex["reps_max"], 15)
        self.assertIsInstance(ex["sets"], int)
        self.assertIsInstance(ex["rest_seconds"], int)

        # 2. Test database columns existence via SQLAlchemy
        with app.app_context():
            u_prof = UserProfile(name="A", age=20, gender="M", height=170, weight=60, fitness_goal="Gain", fitness_level="Beg", workout_days_per_week=4, workout_duration_mins=45, workout_environment="Home", dietary_preference="Veg")
            self.assertEqual(u_prof.workout_environment, "Home")
            
            w_day = WorkoutDay(day_name="Monday", day_number=1, focus="Chest")
            self.assertEqual(w_day.day_number, 1)
            
            w_ex = WorkoutExercise(exercise_id=1, name="Pushup", category="Chest", sets=3, reps="10", reps_min=10, reps_max=12, rest_seconds=60)
            self.assertEqual(w_ex.reps_min, 10)
            self.assertEqual(w_ex.reps_max, 12)

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

    def test_complete_workout_system_apis(self):
        with self.app as c:
            # Register and onboard test user
            c.post('/register', data={'email': 'workout_test_user@fitsync.ai', 'password': 'Password123'}, follow_redirects=True)
            c.post('/onboarding', json={
                "name": "Workout Tester",
                "age": 22,
                "gender": "Male",
                "height": 175,
                "weight": 70,
                "fitness_goal": "Muscle Gain",
                "fitness_level": "Beginner",
                "workout_days_per_week": 4,
                "workout_duration_mins": 45,
                "workout_environment": "Gym",
                "dietary_preference": "Non-Vegetarian",
                "equipments": ["Dumbbells", "Full Gym"],
                "food_preferences": []
            })

            # 1. GET /workout-plan
            resp_wp = c.get('/workout-plan', follow_redirects=True)
            self.assertEqual(resp_wp.status_code, 200)
            self.assertIn(b"Weekly Workout Plan", resp_wp.data)

            # 2. GET /today-workout
            resp_tw = c.get('/today-workout', follow_redirects=True)
            self.assertEqual(resp_tw.status_code, 200)
            self.assertIn(b"Today's Workout Plan", resp_tw.data)

            # Get user's workout plan day IDs
            with app.app_context():
                user = User.query.filter_by(email='workout_test_user@fitsync.ai').first()
                plan = WorkoutPlan.query.filter_by(user_id=user.id, is_active=True).first()
                self.assertIsNotNone(plan)
                days = plan.days
                self.assertGreater(len(days), 0)
                first_day = days[0]
                second_day = days[1] if len(days) > 1 else days[0]

            # 3. POST /api/workout/skip
            resp_skip = c.post('/api/workout/skip', json={'day_id': first_day.id})
            self.assertIn(resp_skip.status_code, [200, 400])

            # 4. POST /api/workout/move
            resp_move = c.post('/api/workout/move', json={'from_day_id': first_day.id, 'to_day_id': second_day.id})
            self.assertIn(resp_move.status_code, [200, 400])

            # 5. GET /api/workout/history
            resp_hist = c.get('/api/workout/history')
            self.assertEqual(resp_hist.status_code, 200)
            data_hist = resp_hist.get_json()
            self.assertEqual(data_hist["status"], "success")
            self.assertIn("history", data_hist)
            self.assertIn("plan_summary", data_hist)

            # 6. POST /api/workout/ai-query
            resp_ai = c.post('/api/workout/ai-query', json={'query': 'What is progressive overload?'})
            self.assertEqual(resp_ai.status_code, 200)
            data_ai = resp_ai.get_json()
            self.assertEqual(data_ai["status"], "success")

            # 7. POST /api/workout/regenerate
            resp_regen = c.post('/api/workout/regenerate', json={})
            self.assertEqual(resp_regen.status_code, 200)
            data_regen = resp_regen.get_json()
            self.assertEqual(data_regen["status"], "success")

    def test_ai_coach_conversational_features(self):
        with self.app as c:
            # Register and onboard test user
            c.post('/register', data={'email': 'coach_user@fitsync.ai', 'password': 'Password123'}, follow_redirects=True)
            c.post('/onboarding', json={
                "name": "Coach Tester",
                "age": 22,
                "gender": "Male",
                "height": 175,
                "weight": 70,
                "fitness_goal": "Muscle Gain",
                "fitness_level": "Intermediate",
                "workout_days_per_week": 4,
                "workout_duration_mins": 45,
                "workout_environment": "Gym",
                "dietary_preference": "Eggetarian",
                "daily_food_budget": 150,
                "equipments": ["Dumbbells", "Full Gym"],
                "food_preferences": []
            })

            # 1. AI Coach Chat Command ("I want to train chest today")
            resp_coach1 = c.post('/api/ai/coach', json={'prompt': 'I want to train chest today'})
            self.assertEqual(resp_coach1.status_code, 200)
            data1 = resp_coach1.get_json()
            self.assertEqual(data1["status"], "success")
            self.assertIn("chest", data1["coach_reply"].lower())

            # 2. AI Coach Equipment Command ("I only have dumbbells today")
            resp_coach2 = c.post('/api/ai/coach', json={'prompt': 'I only have dumbbells today'})
            self.assertEqual(resp_coach2.status_code, 200)
            data2 = resp_coach2.get_json()
            self.assertEqual(data2["status"], "success")

            # 3. API Change Focus directly
            resp_focus = c.post('/api/workout/change-focus', json={'focus': 'Legs'})
            self.assertEqual(resp_focus.status_code, 200)
            data_f = resp_focus.get_json()
            self.assertEqual(data_f["status"], "success")

            # 4. API Adjust Duration (30 mins)
            resp_dur = c.post('/api/workout/adjust-duration', json={'duration_minutes': 30})
            self.assertEqual(resp_dur.status_code, 200)
            data_d = resp_dur.get_json()
            self.assertEqual(data_d["status"], "success")

            # 5. API Adjust Difficulty (easier)
            resp_diff = c.post('/api/workout/adjust-difficulty', json={'direction': 'easier'})
            self.assertEqual(resp_diff.status_code, 200)
            data_diff = resp_diff.get_json()
            self.assertEqual(data_diff["status"], "success")

    def test_full_authentication_persistence_lifecycle(self):
        """Verify new user registration -> onboarding -> logout -> login again restores complete user data."""
        with self.app as c:
            email = "persistent_user@fitsync.ai"
            pwd = "Password123!"

            # 1. Register
            r_reg = c.post('/register', data={'email': email, 'password': pwd}, follow_redirects=False)
            self.assertEqual(r_reg.status_code, 302)
            self.assertTrue(r_reg.location.endswith('/onboarding'))

            # 2. Onboard
            r_onb = c.post('/onboarding', json={
                "name": "Persistent Hero",
                "age": 23,
                "gender": "Female",
                "height": 168.0,
                "weight": 58.0,
                "fitness_goal": "Fat Loss",
                "fitness_level": "Intermediate",
                "workout_days_per_week": 4,
                "workout_duration_mins": 45,
                "workout_environment": "Gym",
                "dietary_preference": "Vegetarian",
                "daily_food_budget": 160,
                "equipments": ["Dumbbells"],
                "food_preferences": []
            })
            self.assertEqual(r_onb.status_code, 200)

            # Verify Database State after Onboarding
            with app.app_context():
                user_in_db = User.query.filter_by(email=email).first()
                self.assertIsNotNone(user_in_db)
                self.assertIsNotNone(user_in_db.profile)
                self.assertEqual(user_in_db.profile.name, "Persistent Hero")
                self.assertTrue(user_in_db.profile.onboarding_completed)

            # 3. Logout
            r_logout = c.get('/logout', follow_redirects=False)
            self.assertEqual(r_logout.status_code, 302)
            self.assertTrue(r_logout.location.endswith('/login'))

            # Verify DB state is COMPLETELY INTACT post-logout
            with app.app_context():
                user_after_logout = User.query.filter_by(email=email).first()
                self.assertIsNotNone(user_after_logout)
                self.assertEqual(user_after_logout.profile.name, "Persistent Hero")

            # 4. Login Again with SAME Credentials
            r_login = c.post('/login', data={'email': email, 'password': pwd}, follow_redirects=False)
            self.assertEqual(r_login.status_code, 302)
            # MUST redirect directly to /dashboard without asking to re-register or onboard!
            self.assertTrue(r_login.location.endswith('/dashboard'))

            # 5. Access Dashboard
            r_dash = c.get('/dashboard')
            self.assertEqual(r_dash.status_code, 200)
            self.assertIn(b"Persistent Hero", r_dash.data)

    def test_email_case_insensitivity_and_whitespace_normalization(self):
        """Verify uppercase and whitespace variants during registration/login find the same account."""
        with self.app as c:
            # Register with mixed case and spaces
            c.post('/register', data={'email': ' CaseTest@FitSync.AI ', 'password': 'Password123!'}, follow_redirects=True)
            c.post('/onboarding', json={
                "name": "Case User",
                "age": 20,
                "gender": "Male",
                "height": 175,
                "weight": 70,
                "fitness_goal": "Muscle Gain",
                "fitness_level": "Beginner",
                "workout_days_per_week": 3,
                "workout_duration_mins": 45,
                "dietary_preference": "Non-Vegetarian",
                "equipments": ["Dumbbells"],
                "food_preferences": []
            })
            c.get('/logout')

            # Login with lowercase version
            r_login = c.post('/login', data={'email': 'casetest@fitsync.ai', 'password': 'Password123!'}, follow_redirects=False)
            self.assertEqual(r_login.status_code, 302)
            self.assertTrue(r_login.location.endswith('/dashboard'))

    def test_duplicate_email_prevention(self):
        """Verify attempting to register existing email redirects cleanly to login."""
        with self.app as c:
            c.post('/register', data={'email': 'dup@fitsync.ai', 'password': 'Password123!'}, follow_redirects=True)
            c.get('/logout')

            # Attempt to register again
            r_dup = c.post('/register', data={'email': 'DUP@FITSYNC.AI', 'password': 'Password123!'}, follow_redirects=False)
            self.assertEqual(r_dup.status_code, 302)
            self.assertTrue(r_dup.location.endswith('/login'))

    def test_exercise_and_food_db_tables(self):
        """Verify Exercise and Food database tables are seeded and queried from SQLite DB."""
        with app.app_context():
            from app import Exercise, Food, get_exercises_data, get_foods_data
            ex_db_count = Exercise.query.count()
            food_db_count = Food.query.count()
            self.assertGreaterEqual(ex_db_count, 40)
            self.assertGreaterEqual(food_db_count, 20)

            ex_data = get_exercises_data()
            self.assertEqual(len(ex_data), ex_db_count)

            food_data = get_foods_data()
            self.assertEqual(len(food_data), food_db_count)

    def test_two_user_data_isolation(self):
        """Mandatory Test: User A and User B cannot see each other's profiles, custom foods, workouts, or meals."""
        with self.app as c:
            # 1. Register User A
            c.post('/register', data={'email': 'usera@fitsync.ai', 'password': 'Password123!'}, follow_redirects=True)
            c.post('/onboarding', json={
                "name": "User Alpha",
                "age": 22,
                "gender": "Female",
                "height": 165,
                "weight": 60,
                "fitness_goal": "Fat Loss",
                "fitness_level": "Beginner",
                "workout_days_per_week": 4,
                "workout_duration_mins": 45,
                "dietary_preference": "Vegetarian",
                "daily_food_budget": 200,
                "equipments": ["Dumbbells"],
                "food_preferences": []
            })
            c.post('/api/custom-foods', json={
                "name": "User Alpha Special Shake",
                "category": "Shake",
                "serving_size_g": 250,
                "calories": 300,
                "protein": 25.0,
                "carbs": 30.0,
                "fat": 5.0,
                "cost": 60
            })
            c.get('/logout')

            # 2. Register User B
            c.post('/register', data={'email': 'userb@fitsync.ai', 'password': 'Password123!'}, follow_redirects=True)
            c.post('/onboarding', json={
                "name": "User Beta",
                "age": 25,
                "gender": "Male",
                "height": 180,
                "weight": 80,
                "fitness_goal": "Muscle Gain",
                "fitness_level": "Advanced",
                "workout_days_per_week": 5,
                "workout_duration_mins": 60,
                "dietary_preference": "Non-Vegetarian",
                "daily_food_budget": 100,
                "equipments": ["Full Gym"],
                "food_preferences": []
            })
            c.post('/api/custom-foods', json={
                "name": "User Beta Power Oats",
                "category": "Breakfast",
                "serving_size_g": 200,
                "calories": 450,
                "protein": 30.0,
                "carbs": 50.0,
                "fat": 10.0,
                "cost": 40
            })

            # Verify User B's dashboard & custom foods DO NOT contain User Alpha data
            r_dash_b = c.get('/dashboard')
            self.assertIn(b"User Beta", r_dash_b.data)
            self.assertNotIn(b"User Alpha", r_dash_b.data)

            r_cf_b = c.get('/api/custom-foods')
            cf_b_data = r_cf_b.get_json()
            cf_b_list = cf_b_data.get("custom_foods", []) if isinstance(cf_b_data, dict) else cf_b_data
            cf_b_names = [f["name"] for f in cf_b_list]
            self.assertIn("User Beta Power Oats", cf_b_names)
            self.assertNotIn("User Alpha Special Shake", cf_b_names)

            c.get('/logout')

            # 3. Log back in as User A
            c.post('/login', data={'email': 'usera@fitsync.ai', 'password': 'Password123!'}, follow_redirects=True)
            r_dash_a = c.get('/dashboard')
            self.assertIn(b"User Alpha", r_dash_a.data)
            self.assertNotIn(b"User Beta", r_dash_a.data)

            r_cf_a = c.get('/api/custom-foods')
            cf_a_data = r_cf_a.get_json()
            cf_a_list = cf_a_data.get("custom_foods", []) if isinstance(cf_a_data, dict) else cf_a_data
            cf_a_names = [f["name"] for f in cf_a_list]
            self.assertIn("User Alpha Special Shake", cf_a_names)
            self.assertNotIn("User Beta Power Oats", cf_a_names)

if __name__ == '__main__':
    unittest.main()
