"""
FitSync Conversational AI Coach Engine
Parses natural language coach commands, interprets user intent, executes dynamic backend adaptations across workouts, schedules, equipment, and nutrition, and returns a human-like coach rationale response.
"""

import re
import random
from datetime import datetime
from services.fitness_engine import generate_weekly_workout, find_alternative_exercise, switch_today_focus, scale_workout_duration, scale_workout_difficulty
from services.adaptation_engine import rebuild_remaining_week_logic, move_workout_logic
from services.nutrition_engine import get_food_alternative

def process_coach_command(user, prompt_text, app_context=None):
    """
    Core Conversational Coach Entry Point.
    Accepts user model instance and natural text input.
    Returns structured dict:
    {
        "status": "success",
        "action": action_type,
        "coach_reply": natural_text_response,
        "explanation": rationale_banner_text,
        "redirect_url": optional_url
    }
    """
    if not prompt_text or not prompt_text.strip():
        return {
            "status": "success",
            "action": "greeting",
            "coach_reply": f"Hey {user.profile.name if user.profile else 'there'}! I'm your FitSync AI Coach. What are we planning to train or eat today?",
            "explanation": "Ask me anything like 'I want to train chest today', 'I have 30 minutes', or 'Swap my lunch'."
        }

    q = prompt_text.strip().lower()
    from app import db, WorkoutPlan, WorkoutDay, WorkoutExercise, MealPlan, Meal, NutritionTarget, ProgressRecord, UserEquipment, UserProfile, get_all_user_foods, get_exercises_data

    # 1. CHANGE TODAY'S WORKOUT FOCUS ("I want to train chest today", "Switch to legs", "Let's do shoulders")
    muscle_focus_map = {
        "chest": ["chest", "pecs", "chest + triceps", "push"],
        "back": ["back", "lats", "back + biceps", "pull"],
        "legs": ["legs", "quads", "glutes", "hamstrings", "leg day"],
        "shoulders": ["shoulders", "delts", "shoulder", "shoulders + core"],
        "arms": ["arms", "biceps", "triceps", "arm day"],
        "core": ["core", "abs", "stomach"],
        "full body": ["full body", "total body", "everything"]
    }

    target_focus = None
    if any(k in q for k in ["train", "do", "switch", "change", "focus", "today", "want"]):
        for focus_name, keywords in muscle_focus_map.items():
            if any(re.search(r'\b' + re.escape(kw) + r'\b', q) for kw in keywords):
                target_focus = focus_name.title()
                break

    if target_focus and user.profile:
        plan = WorkoutPlan.query.filter_by(user_id=user.id, is_active=True).first()
        if plan:
            today_name = datetime.now().strftime("%A")
            all_ex = get_exercises_data()
            success, msg, orig_focus = switch_today_focus(plan, today_name, target_focus, user.profile, user.equipments, all_ex, db.session, WorkoutDay, WorkoutExercise)
            if success:
                reply = f"Awesome! I've updated today's workout to **{target_focus}**. "
                if orig_focus and orig_focus.lower() != target_focus.lower():
                    reply += f"I also rebalanced your remaining week schedule so you don't overload **{orig_focus}**."
                else:
                    reply += "Your weekly split has been rebalanced for optimal muscle recovery."
                return {
                    "status": "success",
                    "action": "workout_focus_changed",
                    "coach_reply": reply,
                    "explanation": f"I've switched today's focus to {target_focus} and rebalanced your rest days.",
                    "redirect_url": "/today-workout"
                }

    # 2. DURATION ADJUSTMENT ("I have 30 minutes", "Make workout 30 mins", "60 minute workout")
    dur_match = re.search(r'(\d+)\s*(min|mins|minute|minutes)', q)
    if ("time" in q or "durat" in q or "quick" in q or dur_match or "express" in q) and user.profile:
        target_mins = 30
        if dur_match:
            target_mins = int(dur_match.group(1))
        elif "60" in q or "hour" in q:
            target_mins = 60
        elif "45" in q:
            target_mins = 45

        plan = WorkoutPlan.query.filter_by(user_id=user.id, is_active=True).first()
        if plan:
            today_name = datetime.now().strftime("%A")
            today_w = WorkoutDay.query.filter_by(workout_plan_id=plan.id, day_name=today_name).first()
            if today_w and not today_w.is_rest_day:
                scale_workout_duration(today_w, target_mins, db.session, WorkoutExercise)
                user.profile.workout_duration_mins = target_mins
                db.session.commit()
                return {
                    "status": "success",
                    "action": "duration_adjusted",
                    "coach_reply": f"Got it! I've adjusted today's **{today_w.focus}** session to ~**{target_mins} minutes** so you can get a great workout without rushing.",
                    "explanation": f"Reduced workout density to ~{target_mins} minutes based on your available time.",
                    "redirect_url": "/today-workout"
                }

    # 3. DIFFICULTY SCALING ("Make today's workout easier", "Make it harder", "Too tough", "Too easy")
    if any(k in q for k in ["easier", "harder", "too tough", "too easy", "light", "heavy", "intense"]) and user.profile:
        direction = "easier" if any(k in q for k in ["easier", "too tough", "light", "less"]) else "harder"
        plan = WorkoutPlan.query.filter_by(user_id=user.id, is_active=True).first()
        if plan:
            today_name = datetime.now().strftime("%A")
            today_w = WorkoutDay.query.filter_by(workout_plan_id=plan.id, day_name=today_name).first()
            if today_w and not today_w.is_rest_day:
                scale_workout_difficulty(today_w, direction, db.session)
                return {
                    "status": "success",
                    "action": "difficulty_adjusted",
                    "coach_reply": f"No problem! I've adjusted today's volume to be **{direction}** (modified reps & intensity) while keeping proper target muscle activation.",
                    "explanation": f"Scaled workout intensity to be {direction} per your request.",
                    "redirect_url": "/today-workout"
                }

    # 4. EQUIPMENT CONSTRAINTS ("I only have dumbbells today", "No equipment today", "I'm at home")
    if any(k in q for k in ["dumbbell", "dumbbells", "no equipment", "home", "gym", "only have"]) and user.profile:
        env = "Gym"
        if "dumbbell" in q:
            env = "Dumbbells Only"
        elif "no equipment" in q or "bodyweight" in q or "home" in q:
            env = "Home / No Equipment"

        user.profile.workout_environment = env
        db.session.commit()

        # Regenerate current workout plan with new environment
        all_exercises = get_exercises_data()
        eq_names = [eq.equipment_name for eq in user.equipments]
        weekly_w = generate_weekly_workout(user.profile, eq_names, all_exercises)
        
        plan = WorkoutPlan.query.filter_by(user_id=user.id, is_active=True).first()
        if plan and weekly_w:
            WorkoutPlan.query.filter_by(user_id=user.id).delete()
            db.session.commit()
            new_plan = WorkoutPlan(user_id=user.id, is_active=True)
            db.session.add(new_plan)
            db.session.commit()

            for day in weekly_w:
                w_day = WorkoutDay(
                    workout_plan_id=new_plan.id,
                    day_name=day["day_name"],
                    day_number=day.get("day_number", 1),
                    focus=day["focus"],
                    is_completed=False,
                    is_rest_day=day["is_rest_day"],
                    status="rest" if day["is_rest_day"] else "upcoming",
                    duration_minutes=day.get("duration_minutes", 45)
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
                        reps_min=ex.get("reps_min", 8),
                        reps_max=ex.get("reps_max", 12),
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
            db.session.commit()

            return {
                "status": "success",
                "action": "environment_changed",
                "coach_reply": f"Understood! I've updated your training environment to **{env}** and adapted all exercises in your weekly plan accordingly.",
                "explanation": f"Replaced gym machine movements with suitable {env} alternatives.",
                "redirect_url": "/today-workout"
            }

    # 5. MEAL SWAP ("Swap my lunch", "I don't like this meal", "Cheaper meal", "High protein meal")
    if any(k in q for k in ["meal", "lunch", "dinner", "breakfast", "snack", "swap", "food", "eat", "cheaper"]) and user.profile:
        today_str = datetime.now().strftime("%Y-%m-%d")
        meal_p = MealPlan.query.filter_by(user_id=user.id, date=today_str).first()
        if meal_p and meal_p.meals:
            target_m = meal_p.meals[0]
            if "lunch" in q:
                target_m = next((m for m in meal_p.meals if "lunch" in m.meal_type.lower()), meal_p.meals[0])
            elif "breakfast" in q:
                target_m = next((m for m in meal_p.meals if "breakfast" in m.meal_type.lower()), meal_p.meals[0])
            elif "dinner" in q:
                target_m = next((m for m in meal_p.meals if "dinner" in m.meal_type.lower()), meal_p.meals[0])

            all_f = get_all_user_foods(user)
            alt = get_food_alternative(
                target_m.food_id,
                target_m.calories,
                target_m.protein,
                user.profile.dietary_preference,
                user.profile.daily_food_budget,
                all_f,
                user.food_preferences
            )

            if alt:
                orig_name = target_m.food_name
                target_m.food_id = alt["food_id"]
                target_m.food_name = alt["name"]
                target_m.serving_size_g = alt["serving_size_g"]
                target_m.calories = alt["calories"]
                target_m.protein = alt["protein"]
                target_m.carbs = alt["carbs"]
                target_m.fat = alt["fat"]
                target_m.cost = alt.get("cost", 0)
                target_m.common_unit = alt["common_unit"]
                db.session.commit()

                return {
                    "status": "success",
                    "action": "meal_swapped",
                    "coach_reply": f"Sure thing! I've swapped **{orig_name}** with **{alt['name']}** ({alt['calories']} kcal, {alt['protein']}g protein) for your {target_m.meal_type}. It fits right inside your ₹{user.profile.daily_food_budget} daily food budget!",
                    "explanation": f"Swapped {target_m.meal_type} to {alt['name']} while preserving macro targets.",
                    "redirect_url": "/nutrition"
                }

    # 6. MISSED WORKOUT / RESCHEDULING ("I missed yesterday's workout", "Shift missed workout", "Move to tomorrow")
    if any(k in q for k in ["missed", "reschedule", "shift", "yesterday", "tomorrow", "rebuild"]) and user.profile:
        plan = WorkoutPlan.query.filter_by(user_id=user.id, is_active=True).first()
        if plan:
            missed_d = next((d for d in plan.days if not d.is_completed and not d.is_rest_day), None)
            if missed_d:
                resched = rebuild_remaining_week_logic(plan, missed_d.id, WorkoutExercise)
                if resched:
                    db.session.commit()
                    return {
                        "status": "success",
                        "action": "workout_shifted",
                        "coach_reply": f"Don't stress about missing a day! I've rescheduled your **{missed_d.focus}** session to an upcoming rest day so your progress stays on track.",
                        "explanation": "Shifted missed workout to rest day to prevent fatigue buildup.",
                        "redirect_url": "/workout-plan"
                    }

    # 7. GENERAL FITNESS COACH ADVICE & Q&A
    from services.ai_search_engine import process_ai_gym_query
    qa_result = process_ai_gym_query(prompt_text, user_profile=user.profile if user else None)
    
    coach_reply = qa_result.get("explanation", "I'm here to coach you through workouts, nutrition, and exercise form! How can I help?")
    ex_list = qa_result.get("exercises", [])
    if ex_list:
        coach_reply += f" I recommend checking out **{ex_list[0]['name']}** ({ex_list[0]['category']})."

    return {
        "status": "success",
        "action": "general_advice",
        "coach_reply": coach_reply,
        "explanation": "Answered using FitSync Knowledge Base.",
        "exercises": ex_list[:3]
    }
