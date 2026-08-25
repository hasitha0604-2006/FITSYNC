import os
import json
import time
import threading
import webbrowser
from datetime import datetime, timedelta
from pathlib import Path
from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

# Path Safety
BASE_DIR = Path(__file__).resolve().parent
INSTANCE_DIR = BASE_DIR / "instance"
INSTANCE_DIR.mkdir(exist_ok=True)

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'fitsync_super_secret_sih_key_2026')
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{INSTANCE_DIR / 'fitsync.db'}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# -----------------------------------------------------------------------------
# DATABASE MODELS
# -----------------------------------------------------------------------------

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    profile = db.relationship("UserProfile", backref="user", uselist=False, cascade="all, delete-orphan")
    equipments = db.relationship("UserEquipment", backref="user", cascade="all, delete-orphan")
    food_preferences = db.relationship("UserFoodPreference", backref="user", cascade="all, delete-orphan")
    nutrition_targets = db.relationship("NutritionTarget", backref="user", cascade="all, delete-orphan")
    workout_plans = db.relationship("WorkoutPlan", backref="user", cascade="all, delete-orphan")
    meal_plans = db.relationship("MealPlan", backref="user", cascade="all, delete-orphan")
    progress_records = db.relationship("ProgressRecord", backref="user", cascade="all, delete-orphan")
    completed_workouts = db.relationship("CompletedWorkout", backref="user", cascade="all, delete-orphan")
    custom_foods = db.relationship("CustomFood", backref="user", cascade="all, delete-orphan")

class CustomFood(db.Model):
    __tablename__ = "custom_foods"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False, default="Homemade")
    serving_size_g = db.Column(db.Integer, nullable=False)
    calories = db.Column(db.Integer, nullable=False)
    protein = db.Column(db.Float, nullable=False)
    carbs = db.Column(db.Float, nullable=False)
    fat = db.Column(db.Float, nullable=False)
    fiber = db.Column(db.Float, default=0.0)
    cost = db.Column(db.Integer, nullable=False, default=0)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class UserProfile(db.Model):
    __tablename__ = "user_profiles"
    id = db.Model.metadata.tables.get("user_profiles") is not None and db.Column(db.Integer, primary_key=True) or db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.String(20), nullable=False)
    height = db.Column(db.Float, nullable=False)  # cm
    weight = db.Column(db.Float, nullable=False)  # kg
    fitness_goal = db.Column(db.String(50), nullable=False)
    fitness_level = db.Column(db.String(50), nullable=False)
    workout_days_per_week = db.Column(db.Integer, nullable=False, default=4)
    workout_duration_mins = db.Column(db.Integer, nullable=False, default=45)
    dietary_preference = db.Column(db.String(50), nullable=False)
    budget_preference = db.Column(db.String(50), nullable=True)
    daily_food_budget = db.Column(db.Integer, nullable=True, default=150)
    onboarding_completed = db.Column(db.Boolean, default=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class UserEquipment(db.Model):
    __tablename__ = "user_equipments"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"))
    equipment_name = db.Column(db.String(50), nullable=False)

class UserFoodPreference(db.Model):
    __tablename__ = "user_food_preferences"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"))
    food_name = db.Column(db.String(100), nullable=False)
    is_preferred = db.Column(db.Boolean, default=False, nullable=False)
    is_available = db.Column(db.Boolean, default=False, nullable=False)
    is_avoided = db.Column(db.Boolean, default=False, nullable=False)

class NutritionTarget(db.Model):
    __tablename__ = "nutrition_targets"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"))
    calories = db.Column(db.Integer, nullable=False)
    protein = db.Column(db.Float, nullable=False)
    carbs = db.Column(db.Float, nullable=False)
    fat = db.Column(db.Float, nullable=False)
    is_custom = db.Column(db.Boolean, default=False)

class WorkoutPlan(db.Model):
    __tablename__ = "workout_plans"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    days = db.relationship("WorkoutDay", backref="plan", cascade="all, delete-orphan")

class WorkoutDay(db.Model):
    __tablename__ = "workout_days"
    id = db.Column(db.Integer, primary_key=True)
    workout_plan_id = db.Column(db.Integer, db.ForeignKey("workout_plans.id", ondelete="CASCADE"))
    day_name = db.Column(db.String(20), nullable=False)
    focus = db.Column(db.String(100), nullable=False)
    is_completed = db.Column(db.Boolean, default=False)
    is_rest_day = db.Column(db.Boolean, default=False)
    exercises = db.relationship("WorkoutExercise", backref="workout_day", cascade="all, delete-orphan")

class WorkoutExercise(db.Model):
    __tablename__ = "workout_exercises"
    id = db.Column(db.Integer, primary_key=True)
    workout_day_id = db.Column(db.Integer, db.ForeignKey("workout_days.id", ondelete="CASCADE"))
    exercise_id = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    sets = db.Column(db.Integer, nullable=False)
    reps = db.Column(db.String(20), nullable=False)
    rest_seconds = db.Column(db.Integer, nullable=False)
    instructions = db.Column(db.Text, nullable=True)
    start_pos = db.Column(db.String(200), nullable=True)
    movement = db.Column(db.String(200), nullable=True)
    end_pos = db.Column(db.String(200), nullable=True)
    common_mistakes = db.Column(db.Text, nullable=True)
    is_completed = db.Column(db.Boolean, default=False)
    order_idx = db.Column(db.Integer, default=0)

class MealPlan(db.Model):
    __tablename__ = "meal_plans"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"))
    date = db.Column(db.String(20), nullable=False)  # YYYY-MM-DD
    total_calories = db.Column(db.Integer, default=0)
    total_protein = db.Column(db.Float, default=0.0)
    total_carbs = db.Column(db.Float, default=0.0)
    total_fat = db.Column(db.Float, default=0.0)
    total_cost = db.Column(db.Integer, default=0)
    meals = db.relationship("Meal", backref="meal_plan", cascade="all, delete-orphan")

class Meal(db.Model):
    __tablename__ = "meals"
    id = db.Column(db.Integer, primary_key=True)
    meal_plan_id = db.Column(db.Integer, db.ForeignKey("meal_plans.id", ondelete="CASCADE"))
    meal_type = db.Column(db.String(55), nullable=False)
    food_id = db.Column(db.Integer, nullable=False)
    food_name = db.Column(db.String(100), nullable=False)
    serving_size_g = db.Column(db.Integer, nullable=False)
    calories = db.Column(db.Integer, nullable=False)
    protein = db.Column(db.Float, nullable=False)
    carbs = db.Column(db.Float, nullable=False)
    fat = db.Column(db.Float, nullable=False)
    cost = db.Column(db.Integer, default=0)
    common_unit = db.Column(db.String(100), nullable=True)

class ProgressRecord(db.Model):
    __tablename__ = "progress_records"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"))
    date = db.Column(db.String(20), nullable=False)
    weight = db.Column(db.Float, nullable=True)
    workouts_completed = db.Column(db.Integer, default=0)
    calories_consumed = db.Column(db.Integer, default=0)
    protein_consumed = db.Column(db.Float, default=0.0)
    carbs_consumed = db.Column(db.Float, default=0.0)
    fat_consumed = db.Column(db.Float, default=0.0)

class CompletedWorkout(db.Model):
    __tablename__ = "completed_workouts"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"))
    date = db.Column(db.String(20), nullable=False)
    workout_name = db.Column(db.String(100), nullable=False)

# -----------------------------------------------------------------------------
# ENGINE IMPORTS (services)
# -----------------------------------------------------------------------------
from services.fitness_engine import generate_weekly_workout, find_alternative_exercise
from services.nutrition_engine import calculate_ai_targets, generate_daily_meals, get_food_alternative
from services.adaptation_engine import rebuild_remaining_week_logic
from services.form_analysis import check_exercise_form
from services.ai_diet_engine import generate_ai_diet_plan
from services.ai_search_engine import process_ai_gym_query

# Data loaders helper
def get_exercises_data():
    p = BASE_DIR / "data" / "exercises.json"
    if not p.exists(): return []
    with open(p, 'r', encoding='utf-8') as f:
        return json.load(f)

def get_foods_data():
    p = BASE_DIR / "data" / "foods.json"
    if not p.exists(): return []
    with open(p, 'r', encoding='utf-8') as f:
        return json.load(f)

def get_all_user_foods(user=None):
    base_foods = get_foods_data()
    if not user:
        return base_foods

    c_foods = CustomFood.query.filter_by(user_id=user.id).all()
    if not c_foods:
        return base_foods

    merged = list(base_foods)
    for cf in c_foods:
        merged.append({
            "id": 10000 + cf.id,
            "custom_food_id": cf.id,
            "name": cf.name,
            "category": cf.category or "Homemade",
            "serving_size_g": cf.serving_size_g,
            "calories": cf.calories,
            "protein": cf.protein,
            "carbs": cf.carbs,
            "fat": cf.fat,
            "fiber": cf.fiber or 0.0,
            "is_vegetarian": True,
            "is_vegan": False,
            "cost_approx": cf.cost,
            "common_unit": f"1 serving ({cf.serving_size_g}g)",
            "is_custom": True,
            "notes": cf.notes
        })
    return merged

def run_migrations():
    db.create_all()
    # 1. Add daily_food_budget to user_profiles
    try:
        db.session.execute(db.text("SELECT daily_food_budget FROM user_profiles LIMIT 1"))
    except Exception:
        db.session.rollback()
        print("[MIGRATION] Adding daily_food_budget to user_profiles...")
        db.session.execute(db.text("ALTER TABLE user_profiles ADD COLUMN daily_food_budget INTEGER DEFAULT 150"))
        db.session.commit()

    # 2. Add total_cost to meal_plans
    try:
        db.session.execute(db.text("SELECT total_cost FROM meal_plans LIMIT 1"))
    except Exception:
        db.session.rollback()
        print("[MIGRATION] Adding total_cost to meal_plans table...")
        db.session.execute(db.text("ALTER TABLE meal_plans ADD COLUMN total_cost INTEGER DEFAULT 0"))
        db.session.commit()

    # 3. Add cost to meals
    try:
        db.session.execute(db.text("SELECT cost FROM meals LIMIT 1"))
    except Exception:
        db.session.rollback()
        print("[MIGRATION] Adding cost to meals table...")
        db.session.execute(db.text("ALTER TABLE meals ADD COLUMN cost INTEGER DEFAULT 0"))
        db.session.commit()

    # 4. Migrate user_food_preferences table columns (is_preferred, is_available, is_avoided)
    try:
        db.session.execute(db.text("SELECT is_preferred FROM user_food_preferences LIMIT 1"))
    except Exception:
        db.session.rollback()
        print("[MIGRATION] Re-creating user_food_preferences table with boolean preference states...")
        db.session.execute(db.text("DROP TABLE IF EXISTS user_food_preferences"))
        db.session.commit()
        db.create_all()

# -----------------------------------------------------------------------------
# DATABASE SEEDER
# -----------------------------------------------------------------------------
def seed_database():
    # Verify if tables exist and are empty
    run_migrations()
    demo_email = "demo@fitsync.ai"
    user = User.query.filter_by(email=demo_email).first()
    if user:
        return

    print("[SEED] Seeding SIH Demo User...")
    try:
        # 1. User
        hashed_pwd = generate_password_hash("Demo@123")
        user = User(email=demo_email, password_hash=hashed_pwd)
        db.session.add(user)
        db.session.commit()

        # 2. Profile
        profile = UserProfile(
            user_id=user.id,
            name="Rahul Sharma",
            age=20,
            gender="Male",
            height=175.0,
            weight=72.0,
            fitness_goal="Muscle Gain",
            fitness_level="Beginner",
            workout_days_per_week=4,
            workout_duration_mins=45,
            dietary_preference="Eggetarian",
            budget_preference="₹150",
            daily_food_budget=150,
            onboarding_completed=True
        )
        db.session.add(profile)

        # 3. Equipments
        eqs = ["Dumbbells", "No Equipment"]
        for eq in eqs:
            db.session.add(UserEquipment(user_id=user.id, equipment_name=eq))

        # 4. Food Preferences
        food_prefs = [
            ("Boiled Eggs", True, True, False),
            ("Paneer (Cottage Cheese)", True, True, False),
            ("Yellow Dal (Tadka)", False, True, False),
            ("White Rice", False, True, False),
            ("Chapati (Whole Wheat Roti)", True, True, False),
            ("Peanuts", False, True, False),
            ("Roasted Chana", False, True, False),
            ("Banana", True, True, False)
        ]
        for name, pref, avail, avoid in food_prefs:
            db.session.add(UserFoodPreference(
                user_id=user.id,
                food_name=name,
                is_preferred=pref,
                is_available=avail,
                is_avoided=avoid
            ))

        # 5. AI Targets
        macros = calculate_ai_targets(profile)
        targets = NutritionTarget(
            user_id=user.id,
            calories=macros["calories"],
            protein=macros["protein"],
            carbs=macros["carbs"],
            fat=macros["fat"],
            is_custom=False
        )
        db.session.add(targets)
        db.session.commit()

        # 6. Plans
        all_exercises = get_exercises_data()
        weekly_workout = generate_weekly_workout(profile, eqs, all_exercises)
        w_plan = WorkoutPlan(user_id=user.id, is_active=True)
        db.session.add(w_plan)
        db.session.commit()

        for day in weekly_workout:
            w_day = WorkoutDay(
                workout_plan_id=w_plan.id,
                day_name=day["day_name"],
                focus=day["focus"],
                is_completed=False,
                is_rest_day=day["is_rest_day"]
            )
            db.session.add(w_day)
            db.session.commit()

            for idx, ex in enumerate(day["exercises"]):
                w_ex = WorkoutExercise(
                    workout_day_id=w_day.id,
                    exercise_id=ex["exercise_id"],
                    name=ex["name"],
                    category=ex["category"],
                    sets=ex["sets"],
                    reps=ex["reps"],
                    rest_seconds=ex["rest_seconds"],
                    instructions=ex["instructions"],
                    start_pos=ex.get("start_pos"),
                    movement=ex.get("movement"),
                    end_pos=ex.get("end_pos"),
                    common_mistakes=ex.get("common_mistakes"),
                    is_completed=False,
                    order_idx=idx
                )
                db.session.add(w_ex)
        
        # 7. Meal plan for today
        all_foods = get_foods_data()
        today_str = datetime.now().strftime("%Y-%m-%d")
        daily_meals = generate_daily_meals(profile, user.food_preferences, targets, all_foods, today_str)
        m_plan = MealPlan(
            user_id=user.id,
            date=today_str,
            total_calories=0,
            total_protein=0.0,
            total_carbs=0.0,
            total_fat=0.0
        )
        db.session.add(m_plan)
        db.session.commit()

        cals, prot, carbs, fat, cost = 0, 0.0, 0.0, 0.0, 0
        for m in daily_meals:
            meal = Meal(
                meal_plan_id=m_plan.id,
                meal_type=m["meal_type"],
                food_id=m["food_id"],
                food_name=m["food_name"],
                serving_size_g=m["serving_size_g"],
                calories=m["calories"],
                protein=m["protein"],
                carbs=m["carbs"],
                fat=m["fat"],
                cost=m.get("cost", 0),
                common_unit=m["common_unit"]
            )
            db.session.add(meal)
            cals += m["calories"]
            prot += m["protein"]
            carbs += m["carbs"]
            fat += m["fat"]
            cost += m.get("cost", 0)

        m_plan.total_calories = cals
        m_plan.total_protein = round(prot, 1)
        m_plan.total_carbs = round(carbs, 1)
        m_plan.total_fat = round(fat, 1)
        m_plan.total_cost = cost

        # 8. Seed some progress history for Chart.js
        for i in range(6, -1, -1):
            date_str = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
            p_weight = round(72.0 - (i * 0.15) + (0.1 * (i % 3 - 1)), 1)
            factor = 1.0 + (0.05 * (i % 4 - 2))
            
            rec = ProgressRecord(
                user_id=user.id,
                date=date_str,
                weight=p_weight,
                workouts_completed=max(0, 3 - (i // 2)),
                calories_consumed=int(targets.calories * factor),
                protein_consumed=round(targets.protein * factor, 1),
                carbs_consumed=round(targets.carbs * factor, 1),
                fat_consumed=round(targets.fat * factor, 1)
            )
            db.session.add(rec)

        db.session.commit()
        print("[SEED] Seed finished successfully.")
    except Exception as e:
        db.session.rollback()
        print(f"[SEED ERROR] Seeder failed: {e}")

# -----------------------------------------------------------------------------
# FLASK ROUTE AND SESSION CONTROLLER
# -----------------------------------------------------------------------------
def get_current_user():
    if 'user_id' not in session:
        return None
    return User.query.get(session['user_id'])

@app.route("/")
def index():
    if get_current_user():
        return redirect(url_for("dashboard"))
    return render_template("index.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        
        if not email or not password:
            flash("Please enter both email and password.", "error")
            return redirect(url_for("register"))

        existing = User.query.filter_by(email=email).first()
        if existing:
            flash("Email already registered.", "error")
            return redirect(url_for("register"))

        hashed = generate_password_hash(password)
        new_user = User(email=email, password_hash=hashed)
        db.session.add(new_user)
        db.session.commit()

        session['user_id'] = new_user.id
        return redirect(url_for("onboarding"))

    return render_template("register.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        
        user = User.query.filter_by(email=email).first()
        if not user or not check_password_hash(user.password_hash, password):
            flash("Incorrect email or password.", "error")
            return redirect(url_for("login"))

        session['user_id'] = user.id
        if user.profile and user.profile.onboarding_completed:
            return redirect(url_for("dashboard"))
        return redirect(url_for("onboarding"))

    return render_template("login.html")

@app.route("/logout")
def logout():
    session.pop('user_id', None)
    flash("Successfully logged out.", "success")
    return redirect(url_for("index"))

@app.route("/onboarding", methods=["GET", "POST"])
def onboarding():
    user = get_current_user()
    if not user:
        return redirect(url_for("login"))

    all_foods = get_all_user_foods(user)

    if request.method == "POST":
        try:
            data = request.json
            profile = UserProfile.query.filter_by(user_id=user.id).first()
            if not profile:
                profile = UserProfile(user_id=user.id)
                db.session.add(profile)

            profile.name = data["name"]
            profile.age = int(data["age"])
            profile.gender = data["gender"]
            profile.height = float(data["height"])
            profile.weight = float(data["weight"])
            profile.fitness_goal = data["fitness_goal"]
            profile.fitness_level = data["fitness_level"]
            profile.workout_days_per_week = int(data["workout_days_per_week"])
            profile.workout_duration_mins = int(data["workout_duration_mins"])
            profile.dietary_preference = data["dietary_preference"]
            
            # Budget preference and daily food budget parsing
            budget_str = data.get("budget_preference", "₹150")
            profile.budget_preference = budget_str
            try:
                if "daily_food_budget" in data and data["daily_food_budget"]:
                    val = int(str(data["daily_food_budget"]).strip())
                    if val <= 0:
                        return jsonify({"status": "error", "message": "Please enter a valid daily food budget (must be greater than 0)."}), 400
                    profile.daily_food_budget = val
                    profile.budget_preference = f"₹{val}"
                else:
                    digits = "".join([c for c in str(budget_str) if c.isdigit()])
                    if digits:
                        profile.daily_food_budget = int(digits)
                    else:
                        profile.daily_food_budget = 150
            except Exception:
                return jsonify({"status": "error", "message": "Please enter a valid daily food budget."}), 400

            profile.onboarding_completed = True

            # Clear old preferences
            UserEquipment.query.filter_by(user_id=user.id).delete()
            UserFoodPreference.query.filter_by(user_id=user.id).delete()

            for eq in data["equipments"]:
                db.session.add(UserEquipment(user_id=user.id, equipment_name=eq))

            for pref in data.get("food_preferences", []):
                db.session.add(UserFoodPreference(
                    user_id=user.id,
                    food_name=pref["food_name"],
                    is_preferred=pref.get("is_preferred", False),
                    is_available=pref.get("is_available", False),
                    is_avoided=pref.get("is_avoided", False)
                ))

            # AI targets
            db.session.commit() # Save profile first
            macros = calculate_ai_targets(profile)
            
            NutritionTarget.query.filter_by(user_id=user.id).delete()
            targets = NutritionTarget(
                user_id=user.id,
                calories=macros["calories"],
                protein=macros["protein"],
                carbs=macros["carbs"],
                fat=macros["fat"],
                is_custom=False
            )
            db.session.add(targets)
            db.session.commit()

            # Generate workout and nutrition
            WorkoutPlan.query.filter_by(user_id=user.id).delete()
            all_exercises = get_exercises_data()
            weekly_workout = generate_weekly_workout(profile, data["equipments"], all_exercises)
            w_plan = WorkoutPlan(user_id=user.id, is_active=True)
            db.session.add(w_plan)
            db.session.commit()

            for day in weekly_workout:
                w_day = WorkoutDay(
                    workout_plan_id=w_plan.id,
                    day_name=day["day_name"],
                    focus=day["focus"],
                    is_completed=False,
                    is_rest_day=day["is_rest_day"]
                )
                db.session.add(w_day)
                db.session.commit()

                for idx, ex in enumerate(day["exercises"]):
                    w_ex = WorkoutExercise(
                        workout_day_id=w_day.id,
                        exercise_id=ex["exercise_id"],
                        name=ex["name"],
                        category=ex["category"],
                        sets=ex["sets"],
                        reps=ex["reps"],
                        rest_seconds=ex["rest_seconds"],
                        instructions=ex["instructions"],
                        start_pos=ex.get("start_pos"),
                        movement=ex.get("movement"),
                        end_pos=ex.get("end_pos"),
                        common_mistakes=ex.get("common_mistakes"),
                        is_completed=False,
                        order_idx=idx
                    )
                    db.session.add(w_ex)

            # Generate food
            MealPlan.query.filter_by(user_id=user.id).delete()
            today_str = datetime.now().strftime("%Y-%m-%d")
            daily_meals = generate_daily_meals(profile, user.food_preferences, targets, all_foods, today_str)
            m_plan = MealPlan(
                user_id=user.id,
                date=today_str,
                total_calories=0,
                total_protein=0.0,
                total_carbs=0.0,
                total_fat=0.0,
                total_cost=0
            )
            db.session.add(m_plan)
            db.session.commit()

            cals, prot, carbs, fat, cost = 0, 0.0, 0.0, 0.0, 0
            for m in daily_meals:
                meal = Meal(
                    meal_plan_id=m_plan.id,
                    meal_type=m["meal_type"],
                    food_id=m["food_id"],
                    food_name=m["food_name"],
                    serving_size_g=m["serving_size_g"],
                    calories=m["calories"],
                    protein=m["protein"],
                    carbs=m["carbs"],
                    fat=m["fat"],
                    cost=m.get("cost", 0),
                    common_unit=m["common_unit"]
                )
                db.session.add(meal)
                cals += m["calories"]
                prot += m["protein"]
                carbs += m["carbs"]
                fat += m["fat"]
                cost += m.get("cost", 0)

            m_plan.total_calories = cals
            m_plan.total_protein = round(prot, 1)
            m_plan.total_carbs = round(carbs, 1)
            m_plan.total_fat = round(fat, 1)
            m_plan.total_cost = cost

            # Initial progress log
            ProgressRecord.query.filter_by(user_id=user.id, date=today_str).delete()
            rec = ProgressRecord(
                user_id=user.id,
                date=today_str,
                weight=profile.weight,
                workouts_completed=0,
                calories_consumed=cals,
                protein_consumed=round(prot, 1),
                carbs_consumed=round(carbs, 1),
                fat_consumed=round(fat, 1)
            )
            db.session.add(rec)
            db.session.commit()

            return jsonify({"status": "success"})
        except Exception as e:
            db.session.rollback()
            return jsonify({"status": "error", "message": str(e)}), 400

    return render_template("onboarding.html", foods=all_foods)

@app.route("/dashboard")
def dashboard():
    user = get_current_user()
    if not user or not user.profile:
        return redirect(url_for("login"))

    # Determine weekday focus
    today_name = datetime.now().strftime("%A")
    plan = WorkoutPlan.query.filter_by(user_id=user.id, is_active=True).first()
    today_workout = None
    if plan:
        today_workout = WorkoutDay.query.filter_by(workout_plan_id=plan.id, day_name=today_name).first()

    today_str = datetime.now().strftime("%Y-%m-%d")
    meal_plan = MealPlan.query.filter_by(user_id=user.id, date=today_str).first()
    targets = NutritionTarget.query.filter_by(user_id=user.id).first()

    return render_template("dashboard.html", 
                           profile=user.profile, 
                           workout_day=today_workout, 
                           meal_plan=meal_plan, 
                           targets=targets)

@app.route("/workout-plan")
def workout_plan():
    user = get_current_user()
    if not user or not user.profile:
        return redirect(url_for("login"))
    plan = WorkoutPlan.query.filter_by(user_id=user.id, is_active=True).first()
    return render_template("workout_plan.html", plan=plan)

@app.route("/today-workout")
def today_workout():
    user = get_current_user()
    if not user or not user.profile:
        return redirect(url_for("login"))
        
    day_name = request.args.get("day", datetime.now().strftime("%A"))
    plan = WorkoutPlan.query.filter_by(user_id=user.id, is_active=True).first()
    
    workout_day = None
    if plan:
        workout_day = WorkoutDay.query.filter_by(workout_plan_id=plan.id, day_name=day_name).first()
        
    return render_template("today_workout.html", workout_day=workout_day, day_name=day_name)

@app.route("/exercises")
def exercises():
    user = get_current_user()
    if not user:
        return redirect(url_for("login"))
    all_ex = get_exercises_data()
    m_path = BASE_DIR / "data" / "gym_knowledge" / "muscles.json"
    muscles = []
    if m_path.exists():
        with open(m_path, "r", encoding="utf-8") as f:
            muscles = json.load(f)
    return render_template("exercise_library.html", exercises=all_ex, muscles=muscles)

@app.route("/exercise/<int:ex_id>")
def exercise_detail(ex_id):
    user = get_current_user()
    if not user:
        return redirect(url_for("login"))
    all_ex = get_exercises_data()
    ex = next((item for item in all_ex if item["id"] == ex_id), None)
    if not ex:
        flash("Exercise not found.", "error")
        return redirect(url_for("exercises"))
    return render_template("exercise_detail.html", ex=ex)

@app.route("/meal/<int:meal_id>")
def meal_detail(meal_id):
    user = get_current_user()
    if not user:
        return redirect(url_for("login"))
    meal = Meal.query.get(meal_id)
    if not meal or meal.meal_plan.user_id != user.id:
        flash("Meal not found.", "error")
        return redirect(url_for("nutrition"))
    return render_template("meal_detail.html", meal=meal)

@app.route("/form-check")
def form_check():
    user = get_current_user()
    if not user or not user.profile:
        return redirect(url_for("login"))
    # Render full page form check
    return render_template("form_check.html")

@app.route("/nutrition", methods=["GET"])
def nutrition():
    user = get_current_user()
    if not user or not user.profile:
        return redirect(url_for("login"))
        
    today_str = datetime.now().strftime("%Y-%m-%d")
    meal_plan = MealPlan.query.filter_by(user_id=user.id, date=today_str).first()
    targets = NutritionTarget.query.filter_by(user_id=user.id).first()
    
    avail_count = len([p for p in user.food_preferences if p.is_available])
    all_foods = get_all_user_foods(user)
    custom_foods = CustomFood.query.filter_by(user_id=user.id).order_by(CustomFood.created_at.desc()).all()
    
    return render_template(
        "nutrition.html", 
        meal_plan=meal_plan, 
        targets=targets,
        daily_budget=user.profile.daily_food_budget or 150,
        total_estimated_cost=meal_plan.total_cost if meal_plan else 0,
        available_foods_count=avail_count,
        foods=all_foods,
        custom_foods=custom_foods
    )

@app.route("/progress")
def progress():
    user = get_current_user()
    if not user or not user.profile:
        return redirect(url_for("login"))
    return render_template("progress.html", profile=user.profile)

@app.route("/profile")
def profile():
    user = get_current_user()
    if not user or not user.profile:
        return redirect(url_for("login"))
        
    preferred_foods = [p.food_name for p in user.food_preferences if p.is_preferred]
    available_foods = [p.food_name for p in user.food_preferences if p.is_available]
    avoided_foods = [p.food_name for p in user.food_preferences if p.is_avoided]
    
    return render_template(
        "profile.html", 
        profile=user.profile,
        preferred_foods=preferred_foods,
        available_foods=available_foods,
        avoided_foods=avoided_foods
    )

@app.route("/settings", methods=["GET", "POST"])
def settings():
    user = get_current_user()
    if not user or not user.profile:
        return redirect(url_for("login"))
    all_foods = get_all_user_foods(user)
    user_prefs = {}
    for p in user.food_preferences:
        user_prefs[p.food_name.lower()] = {
            "is_preferred": p.is_preferred,
            "is_available": p.is_available,
            "is_avoided": p.is_avoided
        }
    return render_template("settings.html", profile=user.profile, foods=all_foods, user_prefs=user_prefs)

# -----------------------------------------------------------------------------
# CUSTOM FOODS & EXERCISE SEARCH & AI DIET API ROUTES
# -----------------------------------------------------------------------------

@app.route("/api/custom-foods", methods=["GET", "POST"])
def api_custom_foods():
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401

    if request.method == "GET":
        foods = CustomFood.query.filter_by(user_id=user.id).order_by(CustomFood.created_at.desc()).all()
        result = []
        for f in foods:
            result.append({
                "id": f.id,
                "name": f.name,
                "category": f.category,
                "serving_size_g": f.serving_size_g,
                "calories": f.calories,
                "protein": f.protein,
                "carbs": f.carbs,
                "fat": f.fat,
                "fiber": f.fiber or 0.0,
                "cost": f.cost,
                "notes": f.notes or ""
            })
        return jsonify({"status": "success", "custom_foods": result})

    # POST - Create custom food
    data = request.json or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"status": "error", "message": "Food name is required."}), 400

    try:
        serving_size_g = int(data.get("serving_size_g", 0))
        calories = int(data.get("calories", 0))
        protein = float(data.get("protein", 0.0))
        carbs = float(data.get("carbs", 0.0))
        fat = float(data.get("fat", 0.0))
        fiber = float(data.get("fiber", 0.0))
        cost = int(data.get("cost", 0))
    except (ValueError, TypeError):
        return jsonify({"status": "error", "message": "Nutrition and cost values must be valid non-negative numbers."}), 400

    if serving_size_g < 0 or calories < 0 or protein < 0 or carbs < 0 or fat < 0 or fiber < 0 or cost < 0:
        return jsonify({"status": "error", "message": "Nutrition values cannot be negative."}), 400

    c_food = CustomFood(
        user_id=user.id,
        name=name,
        category=data.get("category", "Homemade") or "Homemade",
        serving_size_g=serving_size_g,
        calories=calories,
        protein=protein,
        carbs=carbs,
        fat=fat,
        fiber=fiber,
        cost=cost,
        notes=data.get("notes", "")
    )
    db.session.add(c_food)
    db.session.commit()

    pref = UserFoodPreference.query.filter_by(user_id=user.id, food_name=name).first()
    if not pref:
        pref = UserFoodPreference(
            user_id=user.id,
            food_name=name,
            is_preferred=True,
            is_available=True,
            is_avoided=False
        )
        db.session.add(pref)
        db.session.commit()

    return jsonify({"status": "success", "message": f"Added '{name}' to your custom foods.", "id": c_food.id})


@app.route("/api/custom-foods/<int:food_id>", methods=["PUT", "DELETE"])
def api_manage_custom_food(food_id):
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401

    c_food = CustomFood.query.get(food_id)
    if not c_food or c_food.user_id != user.id:
        return jsonify({"status": "error", "message": "Custom food item not found."}), 404

    if request.method == "DELETE":
        db.session.delete(c_food)
        db.session.commit()
        return jsonify({"status": "success", "message": "Custom food deleted."})

    # PUT - Edit custom food
    data = request.json or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"status": "error", "message": "Food name cannot be empty."}), 400

    try:
        c_food.name = name
        c_food.category = data.get("category", c_food.category)
        c_food.serving_size_g = int(data.get("serving_size_g", c_food.serving_size_g))
        c_food.calories = int(data.get("calories", c_food.calories))
        c_food.protein = float(data.get("protein", c_food.protein))
        c_food.carbs = float(data.get("carbs", c_food.carbs))
        c_food.fat = float(data.get("fat", c_food.fat))
        c_food.fiber = float(data.get("fiber", c_food.fiber))
        c_food.cost = int(data.get("cost", c_food.cost))
        c_food.notes = data.get("notes", c_food.notes)
    except (ValueError, TypeError):
        return jsonify({"status": "error", "message": "Invalid numeric input."}), 400

    db.session.commit()
    return jsonify({"status": "success", "message": "Custom food updated."})


@app.route("/api/exercises/search")
def api_search_exercises():
    query = request.args.get("q", "").strip().lower()
    category = request.args.get("category", "").strip().lower()
    equipment = request.args.get("equipment", "").strip().lower()
    difficulty = request.args.get("difficulty", "").strip().lower()
    only_demo = request.args.get("demo", "").strip().lower() == "true"

    all_ex = get_exercises_data()
    filtered = []

    for ex in all_ex:
        if query:
            name_match = query in ex["name"].lower()
            cat_match = query in ex["category"].lower()
            sec_match = any(query in sec.lower() for sec in ex.get("secondary_muscles", []))
            equip_match = query in ex.get("equipment", "").lower()
            if not (name_match or cat_match or sec_match or equip_match):
                continue

        if category and category != "all":
            if ex["category"].lower() != category:
                continue

        if equipment and equipment != "all":
            if equipment == "home":
                if ex["equipment"] not in ["No Equipment", "Dumbbells", "Resistance Bands"]:
                    continue
            elif equipment == "gym":
                if ex["equipment"] != "Full Gym":
                    continue
            elif ex["equipment"].lower() != equipment:
                continue

        if difficulty and difficulty != "all":
            if ex["difficulty"].lower() != difficulty:
                continue

        if only_demo and not ex.get("supported_demo", True):
            continue

        filtered.append(ex)

    return jsonify({
        "status": "success",
        "query": query,
        "total_supported": len(all_ex),
        "count": len(filtered),
        "results": filtered
    })


@app.route("/api/ai/search", methods=["POST", "GET"])
def api_ai_search():
    user = get_current_user()
    if request.method == "POST":
        data = request.get_json() or {}
        query = data.get("query", "").strip()
    else:
        query = request.args.get("q", "").strip()

    profile = user.profile if user else None
    result = process_ai_gym_query(query, user_profile=profile)
    return jsonify(result)


@app.route("/api/diet/generate", methods=["POST"])
@app.route("/api/diet/regenerate", methods=["POST"])
def api_generate_ai_diet():
    user = get_current_user()
    if not user or not user.profile:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401

    targets = NutritionTarget.query.filter_by(user_id=user.id).first()
    if not targets:
        macros = calculate_ai_targets(user.profile)
        targets = NutritionTarget(
            user_id=user.id,
            calories=macros["calories"],
            protein=macros["protein"],
            carbs=macros["carbs"],
            fat=macros["fat"]
        )
        db.session.add(targets)
        db.session.commit()

    all_foods = get_all_user_foods(user)
    today_str = datetime.now().strftime("%Y-%m-%d")

    ai_result = generate_ai_diet_plan(user.profile, user.food_preferences, targets, all_foods, today_str)

    MealPlan.query.filter_by(user_id=user.id, date=today_str).delete()
    m_plan = MealPlan(
        user_id=user.id,
        date=today_str,
        total_calories=0,
        total_protein=0.0,
        total_carbs=0.0,
        total_fat=0.0,
        total_cost=0
    )
    db.session.add(m_plan)
    db.session.commit()

    cals, prot, carbs, fat, cost = 0, 0.0, 0.0, 0.0, 0
    for m in ai_result["meals"]:
        meal = Meal(
            meal_plan_id=m_plan.id,
            meal_type=m["meal_type"],
            food_id=m["food_id"],
            food_name=m["food_name"],
            serving_size_g=m["serving_size_g"],
            calories=m["calories"],
            protein=m["protein"],
            carbs=m["carbs"],
            fat=m["fat"],
            cost=m.get("cost", 0),
            common_unit=m["common_unit"]
        )
        db.session.add(meal)
        cals += m["calories"]
        prot += m["protein"]
        carbs += m["carbs"]
        fat += m["fat"]
        cost += m.get("cost", 0)

    m_plan.total_calories = cals
    m_plan.total_protein = round(prot, 1)
    m_plan.total_carbs = round(carbs, 1)
    m_plan.total_fat = round(fat, 1)
    m_plan.total_cost = cost
    db.session.commit()

    progress = ProgressRecord.query.filter_by(user_id=user.id, date=today_str).first()
    if progress:
        progress.calories_consumed = cals
        progress.protein_consumed = round(prot, 1)
        progress.carbs_consumed = round(carbs, 1)
        progress.fat_consumed = round(fat, 1)
        db.session.commit()

    ai_result["total_calories"] = cals
    ai_result["total_protein"] = round(prot, 1)
    ai_result["total_cost"] = cost
    return jsonify(ai_result)

# -----------------------------------------------------------------------------
# POST / ACTION ROUTES (AJAX CONTROLLERS)
# -----------------------------------------------------------------------------

@app.route("/api/workout/exercise/toggle-complete", methods=["POST"])
def api_toggle_exercise():
    user = get_current_user()
    if not user: return jsonify({"status": "error", "message": "Unauthorized"}), 401
    
    data = request.json
    ex_id = data.get("id")
    ex = WorkoutExercise.query.get(ex_id)
    if not ex or ex.workout_day.plan.user_id != user.id:
        return jsonify({"status": "error", "message": "Exercise not found"}), 404
        
    ex.is_completed = not ex.is_completed
    db.session.commit()
    
    # Recalculate day completion
    day = ex.workout_day
    all_done = all([e.is_completed for e in day.exercises])
    day.is_completed = all_done
    db.session.commit()
    
    # Sync progress record
    today_str = datetime.now().strftime("%Y-%m-%d")
    progress = ProgressRecord.query.filter_by(user_id=user.id, date=today_str).first()
    if not progress:
        progress = ProgressRecord(user_id=user.id, date=today_str)
        db.session.add(progress)
    
    completed_days_count = WorkoutDay.query.join(WorkoutPlan).filter(
        WorkoutPlan.user_id == user.id,
        WorkoutDay.is_completed == True
    ).count()
    progress.workouts_completed = completed_days_count
    db.session.commit()
    
    return jsonify({"status": "success", "is_completed": ex.is_completed, "day_completed": day.is_completed})


@app.route("/api/workout/exercise/substitute", methods=["POST"])
def api_substitute_exercise():
    user = get_current_user()
    if not user: return jsonify({"status": "error", "message": "Unauthorized"}), 401
    
    data = request.json
    ex_id = data.get("id")
    reason = data.get("reason")
    
    orig_ex = WorkoutExercise.query.get(ex_id)
    if not orig_ex or orig_ex.workout_day.plan.user_id != user.id:
        return jsonify({"status": "error", "message": "Exercise not found"}), 404

    equipments = [eq.equipment_name for eq in user.equipments]
    all_ex = get_exercises_data()
    
    alt = find_alternative_exercise(orig_ex.category, orig_ex.exercise_id, equipments, all_ex)
    if not alt:
        return jsonify({"status": "error", "message": "No suitable alternative found."}), 404

    orig_ex.exercise_id = alt["id"]
    orig_ex.name = alt["name"]
    orig_ex.category = alt["category"]
    orig_ex.instructions = "\n".join(alt["instructions"])
    orig_ex.start_pos = alt.get("start_pos")
    orig_ex.movement = alt.get("movement")
    orig_ex.end_pos = alt.get("end_pos")
    orig_ex.common_mistakes = "\n".join(alt.get("common_mistakes", []))
    orig_ex.is_completed = False
    db.session.commit()

    return jsonify({"status": "success", "replacement": alt["name"]})


@app.route("/api/workout/rebuild", methods=["POST"])
def api_rebuild_week():
    user = get_current_user()
    if not user: return jsonify({"status": "error", "message": "Unauthorized"}), 401
    
    plan = WorkoutPlan.query.filter_by(user_id=user.id, is_active=True).first()
    if not plan:
        return jsonify({"status": "error", "message": "No active plan."}), 404

    # Identify first incomplete day
    missed_day = None
    for day in plan.days:
        if not day.is_completed and not day.is_rest_day:
            missed_day = day
            break

    if not missed_day:
        return jsonify({"status": "no_change", "detail": "All workouts are already completed."})

    success = rebuild_remaining_week_logic(plan, missed_day.id, WorkoutExercise)
    if success:
        db.session.commit()
        return jsonify({"status": "success", "detail": f"Shifted missed workout from {missed_day.day_name} to a later rest day."})
    
    return jsonify({"status": "error", "message": "Could not reschedule week. Ensure you have available rest days."}), 400


@app.route("/api/profile/save", methods=["POST"])
def api_save_profile():
    user = get_current_user()
    if not user:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
        
    data = request.json
    try:
        profile = UserProfile.query.filter_by(user_id=user.id).first()
        if not profile:
            return jsonify({"status": "error", "message": "Profile not found"}), 404
            
        # Parse and validate daily food budget
        budget_val = data.get("daily_food_budget")
        if budget_val is not None:
            try:
                val = int(str(budget_val).strip())
                if val <= 0:
                    return jsonify({"status": "error", "message": "Please enter a valid daily food budget (must be greater than 0)."}), 400
                profile.daily_food_budget = val
                profile.budget_preference = f"₹{val}"
            except (ValueError, TypeError):
                return jsonify({"status": "error", "message": "Please enter a valid daily food budget."}), 400
        else:
            return jsonify({"status": "error", "message": "Daily food budget is required."}), 400

        # Save food preferences
        UserFoodPreference.query.filter_by(user_id=user.id).delete()
        for pref in data.get("food_preferences", []):
            db.session.add(UserFoodPreference(
                user_id=user.id,
                food_name=pref["food_name"],
                is_preferred=pref.get("is_preferred", False),
                is_available=pref.get("is_available", False),
                is_avoided=pref.get("is_avoided", False)
            ))
            
        db.session.commit()
        
        # Regenerate daily meal plan for today
        today_str = datetime.now().strftime("%Y-%m-%d")
        MealPlan.query.filter_by(user_id=user.id, date=today_str).delete()
        
        targets = NutritionTarget.query.filter_by(user_id=user.id).first()
        all_foods = get_all_user_foods(user)
        
        daily_meals = generate_daily_meals(profile, user.food_preferences, targets, all_foods, today_str)
        m_plan = MealPlan(
            user_id=user.id,
            date=today_str,
            total_calories=0,
            total_protein=0.0,
            total_carbs=0.0,
            total_fat=0.0,
            total_cost=0
        )
        db.session.add(m_plan)
        db.session.commit()

        cals, prot, carbs, fat, cost = 0, 0.0, 0.0, 0.0, 0
        for m in daily_meals:
            meal = Meal(
                meal_plan_id=m_plan.id,
                meal_type=m["meal_type"],
                food_id=m["food_id"],
                food_name=m["food_name"],
                serving_size_g=m["serving_size_g"],
                calories=m["calories"],
                protein=m["protein"],
                carbs=m["carbs"],
                fat=m["fat"],
                cost=m.get("cost", 0),
                common_unit=m["common_unit"]
            )
            db.session.add(meal)
            cals += m["calories"]
            prot += m["protein"]
            carbs += m["carbs"]
            fat += m["fat"]
            cost += m.get("cost", 0)

        m_plan.total_calories = cals
        m_plan.total_protein = round(prot, 1)
        m_plan.total_carbs = round(carbs, 1)
        m_plan.total_fat = round(fat, 1)
        m_plan.total_cost = cost
        
        db.session.commit()
        return jsonify({"status": "success", "message": "Food preferences saved successfully."})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": f"Unable to save food preferences. Please try again: {str(e)}"}), 500


@app.route("/api/nutrition/meal/substitute", methods=["POST"])
def api_substitute_meal():
    user = get_current_user()
    if not user or not user.profile: return jsonify({"status": "error", "message": "Unauthorized"}), 401
    
    data = request.json
    meal_id = data.get("id")
    
    meal = Meal.query.get(meal_id)
    if not meal or meal.meal_plan.user_id != user.id:
        return jsonify({"status": "error", "message": "Meal item not found"}), 404

    all_foods = get_all_user_foods(user)
    alt = get_food_alternative(
        meal.food_id,
        meal.calories,
        meal.protein,
        user.profile.dietary_preference,
        user.profile.daily_food_budget,
        all_foods,
        user.food_preferences
    )
    if not alt:
        return jsonify({"status": "error", "message": "No alternative food found matching dietary type."}), 404

    meal_plan = meal.meal_plan
    # Adjust targets and cost
    meal_plan.total_calories = int(meal_plan.total_calories - meal.calories + alt["calories"])
    meal_plan.total_protein = round(meal_plan.total_protein - meal.protein + alt["protein"], 1)
    meal_plan.total_carbs = round(meal_plan.total_carbs - meal.carbs + alt["carbs"], 1)
    meal_plan.total_fat = round(meal_plan.total_fat - meal.fat + alt["fat"], 1)
    
    old_cost = meal.cost or 0
    meal.cost = alt.get("cost", 0)
    meal_plan.total_cost = int((meal_plan.total_cost or 0) - old_cost + meal.cost)

    meal.food_id = alt["food_id"]
    meal.food_name = alt["name"]
    meal.serving_size_g = alt["serving_size_g"]
    meal.calories = alt["calories"]
    meal.protein = alt["protein"]
    meal.carbs = alt["carbs"]
    meal.fat = alt["fat"]
    meal.common_unit = alt["common_unit"]
    db.session.commit()

    # Sync progress record
    today_str = datetime.now().strftime("%Y-%m-%d")
    progress = ProgressRecord.query.filter_by(user_id=user.id, date=today_str).first()
    if progress:
        progress.calories_consumed = meal_plan.total_calories
        progress.protein_consumed = meal_plan.total_protein
        progress.carbs_consumed = meal_plan.total_carbs
        progress.fat_consumed = meal_plan.total_fat
        db.session.commit()

    return jsonify({"status": "success", "replacement": alt["name"]})


@app.route("/api/nutrition/targets", methods=["POST"])
def api_update_targets():
    user = get_current_user()
    if not user: return jsonify({"status": "error", "message": "Unauthorized"}), 401
    
    data = request.json
    targets = NutritionTarget.query.filter_by(user_id=user.id).first()
    if not targets:
        targets = NutritionTarget(user_id=user.id)
        db.session.add(targets)
        
    targets.calories = int(data.get("calories"))
    targets.protein = float(data.get("protein"))
    targets.carbs = float(data.get("carbs"))
    targets.fat = float(data.get("fat"))
    targets.is_custom = True
    db.session.commit()
    
    return jsonify({"status": "success"})


@app.route("/api/progress/log", methods=["POST"])
def api_log_progress():
    user = get_current_user()
    if not user: return jsonify({"status": "error", "message": "Unauthorized"}), 401
    
    data = request.json
    date_str = data.get("date")
    weight = data.get("weight")
    
    rec = ProgressRecord.query.filter_by(user_id=user.id, date=date_str).first()
    if not rec:
        rec = ProgressRecord(user_id=user.id, date=date_str)
        db.session.add(rec)
        
    if weight is not None:
        rec.weight = float(weight)
        if user.profile:
            user.profile.weight = float(weight)
            
    db.session.commit()
    return jsonify({"status": "success"})


@app.route("/api/progress/history")
def api_progress_history():
    user = get_current_user()
    if not user: return jsonify({"status": "error", "message": "Unauthorized"}), 401
    
    records = ProgressRecord.query.filter_by(user_id=user.id).order_by(ProgressRecord.date.asc()).all()
    history_list = []
    for r in records:
        history_list.append({
            "date": r.date,
            "weight": r.weight,
            "calories_consumed": r.calories_consumed,
            "protein_consumed": r.protein_consumed,
            "carbs_consumed": r.carbs_consumed,
            "fat_consumed": r.fat_consumed,
            "workouts_completed": r.workouts_completed
        })
    return jsonify(history_list)


@app.route("/api/form-analysis", methods=["POST"])
def api_form_analysis():
    data = request.json
    ex_name = data.get("exercise_name")
    frame = data.get("frame_base64")
    
    result = check_exercise_form(ex_name, frame)
    return jsonify(result)

# -----------------------------------------------------------------------------
# AUTO OPEN DEFAULT BROWSER
# -----------------------------------------------------------------------------
def open_browser():
    time.sleep(1.5)  # Wait for Flask to boot
    webbrowser.open("http://127.0.0.1:5000")

# -----------------------------------------------------------------------------
# MAIN START
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    with app.app_context():
        seed_database()
        
    # Start thread to open browser only once (daemon shuts down when server stops)
    threading.Thread(target=open_browser, daemon=True).start()
    app.run(debug=True, use_reloader=False)
