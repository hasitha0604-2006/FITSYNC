"""
FitSync Conversational AI Coach Engine
Provides context-aware, human-like coaching advice by combining live user telemetry (BMR/TDEE targets, macro goals, food budget, equipment, and weekly splits) with Gemini 1.5 Flash LLM and an intelligent offline fitness knowledge engine.
Also interprets natural language action commands to execute real-time database & plan adaptations.
"""

import os
import re
import json
import random
import urllib.request
import urllib.parse
from datetime import datetime
from services.fitness_engine import generate_weekly_workout, find_alternative_exercise, switch_today_focus, scale_workout_duration, scale_workout_difficulty
from services.adaptation_engine import rebuild_remaining_week_logic, move_workout_logic
from services.nutrition_engine import get_food_alternative

def _call_gemini_coach_api(prompt_text, user_context, api_key):
    """
    Calls Google Gemini 1.5 Flash API with user telemetry context.
    Returns natural language coach response or None on failure.
    """
    try:
        user_prompt = (
            "You are FitSync AI — an expert, friendly, encouraging personal fitness and nutrition coach. "
            "Answer the user's question directly and concisely in 2-3 sentences. "
            "Use their personal telemetry data to personalize your advice.\n\n"
            f"User Profile Telemetry: {json.dumps(user_context)}\n"
            f"User Question: \"{prompt_text}\"\n\n"
            "Return valid JSON matching this schema: {\"coach_reply\": \"string\"}"
        )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": user_prompt}]}],
            "generationConfig": {"temperature": 0.4, "responseMimeType": "application/json"}
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )

        with urllib.request.urlopen(req, timeout=5) as response:
            res_body = json.loads(response.read().decode('utf-8'))
            text_content = res_body['candidates'][0]['content']['parts'][0]['text']
            parsed = json.loads(text_content)
            return parsed.get("coach_reply")
    except Exception:
        return None


def _generate_offline_coaching_reply(q, user_context, qa_exercises):
    """
    Generates intelligent, context-aware offline coaching advice using user profile telemetry.
    """
    name = user_context.get("name", "there")
    goal = user_context.get("fitness_goal", "fitness")
    cals = user_context.get("target_calories", 2000)
    prot = user_context.get("target_protein", 120)
    budget = user_context.get("daily_budget", 150)
    today_focus = user_context.get("today_focus", "Rest & Recovery")
    diet_pref = user_context.get("dietary_preference", "Eggetarian")

    # A. Nutrition & Diet Q&A
    if any(k in q for k in ["eat", "diet", "protein", "food", "calorie", "calories", "budget", "paneer", "egg", "eggs", "meal", "breakfast", "lunch", "dinner"]):
        if "protein" in q:
            if "eggetarian" in diet_pref.lower() or "egg" in q:
                reply = f"For your {prot}g daily protein target on a ₹{budget}/day budget, boiled eggs (6g protein/egg) and paneer (18g protein/100g) are your best budget powerhouses, {name}! Pair them with yellow dal for complete amino acid synthesis."
            elif "veg" in diet_pref.lower():
                reply = f"To hit your {prot}g protein target as a vegetarian, focus on Paneer (18g/100g), Roasted Chana (19g/100g), Soya chunks, and Yellow Dal Tadka. They fit easily inside your ₹{budget}/day budget!"
            else:
                reply = f"Great sources for your {prot}g protein target include eggs, chicken breast, paneer, and fish. Spread them across your 5 daily meals to keep muscle protein synthesis high for your {goal} goal!"
            return reply

        if "budget" in q or "cheap" in q:
            reply = f"FitSync AI keeps your nutrition affordable! Stick to student staples like Boiled Eggs (₹6/egg), Roasted Chana (₹20/100g), Oats (₹25/serving), and Yellow Dal. You'll hit your {cals} kcal target well under your ₹{budget}/day budget."
            return reply

        reply = f"Your personalized daily target is {cals} kcal and {prot}g protein for {goal}. Try to eat 4-5 evenly spaced meals throughout the day to support recovery from today's {today_focus} session!"
        return reply

    # B. Workout, Progressive Overload & Training Q&A
    if any(k in q for k in ["bench", "squat", "workout", "exercise", "overload", "rep", "reps", "set", "sets", "weight", "muscle", "strength", "sore", "soreness"]):
        if "overload" in q:
            reply = f"Progressive overload means gradually increasing weight, reps, or sets over time, {name}. If you complete 3 sets of 12 reps with good form, add 2.5kg next week to force your muscles to adapt for {goal}!"
            return reply

        if "sore" in q or "pain" in q:
            reply = f"Muscle soreness (DOMS) is completely normal when starting or increasing intensity! Stay hydrated, hit your {prot}g protein goal, and focus on light stretching or active recovery today."
            return reply

        if qa_exercises:
            best_ex = qa_exercises[0]
            reply = f"For your {today_focus} training, **{best_ex['name']}** ({best_ex['category']}) is an outstanding movement! Focus on controlling the 2-second negative phase and driving through with full control."
            return reply

        reply = f"To maximize your {goal} goal during today's {today_focus} session, perform 3-4 sets of 8-12 reps with a 60-90 second rest period. Focus on full range of motion over heavy weight!"
        return reply

    # C. Fat Loss & Weight Management Q&A
    if any(k in q for k in ["fat", "lose", "weight loss", "shred", "cardio", "belly"]):
        reply = f"For effective fat loss, aim for a moderate 300-500 kcal deficit while keeping your protein high at {prot}g to preserve lean muscle. Combine resistance training with 20 minutes of daily brisk walking!"
        return reply

    # Default friendly coach greeting / Q&A
    reply = f"Hey {name}! As your FitSync AI Coach, I'm tracking your {goal} plan (Target: {cals} kcal, {prot}g protein, ₹{budget}/day budget). You can ask me for meal ideas, exercise form tips, or request to change today's {today_focus} workout!"
    return reply


def process_coach_command(user, prompt_text, app_context=None):
    """
    Core Conversational Coach Entry Point.
    Parses natural language commands, executes backend adaptations, or provides intelligent Q&A advice.
    """
    from app import db, WorkoutPlan, WorkoutDay, WorkoutExercise, MealPlan, Meal, NutritionTarget, ProgressRecord, UserEquipment, UserProfile, get_all_user_foods, get_exercises_data
    from services.ai_search_engine import process_ai_gym_query

    if not prompt_text or not prompt_text.strip():
        user_name = user.profile.name if (user and user.profile) else "there"
        return {
            "status": "success",
            "action": "greeting",
            "coach_reply": f"Hey {user_name}! I'm your FitSync AI Coach. What are we planning to train or eat today?",
            "explanation": "Ask me anything like 'I want to train chest today', 'I have 30 minutes', or 'Swap my lunch'."
        }

    q = prompt_text.strip().lower()

    # Build User Telemetry Context
    user_context = {
        "name": user.profile.name if (user and user.profile) else "Student",
        "fitness_goal": user.profile.fitness_goal if (user and user.profile) else "Muscle Gain",
        "fitness_level": user.profile.fitness_level if (user and user.profile) else "Beginner",
        "dietary_preference": user.profile.dietary_preference if (user and user.profile) else "Eggetarian",
        "daily_budget": user.profile.daily_food_budget if (user and user.profile) else 150,
        "workout_environment": user.profile.workout_environment if (user and user.profile) else "Gym",
        "target_calories": 2000,
        "target_protein": 120,
        "today_focus": "Rest & Recovery"
    }

    if user:
        target = NutritionTarget.query.filter_by(user_id=user.id).first()
        if target:
            user_context["target_calories"] = target.calories
            user_context["target_protein"] = target.protein

        plan = WorkoutPlan.query.filter_by(user_id=user.id, is_active=True).first()
        if plan:
            today_name = datetime.now().strftime("%A")
            today_w = WorkoutDay.query.filter_by(workout_plan_id=plan.id, day_name=today_name).first()
            if today_w:
                user_context["today_focus"] = today_w.focus

    # 1. ACTION INTENT: CHANGE TODAY'S WORKOUT FOCUS ("I want to train chest today", "Switch to legs", "Let's do shoulders")
    muscle_focus_map = {
        "chest": ["chest", "pecs", "chest + triceps", "push day", "push"],
        "back": ["back", "lats", "back + biceps", "pull day", "pull"],
        "legs": ["legs", "quads", "glutes", "hamstrings", "leg day", "leg"],
        "shoulders": ["shoulders", "delts", "shoulder", "shoulders + core"],
        "arms": ["arms", "biceps", "triceps", "arm day"],
        "core": ["core", "abs", "stomach"],
        "full body": ["full body", "total body", "everything"]
    }

    target_focus = None
    if any(k in q for k in ["train", "do", "switch", "change", "focus", "today", "want", "let's", "lets", "day"]):
        for focus_name, keywords in muscle_focus_map.items():
            if any(re.search(r'\b' + re.escape(kw) + r'\b', q) for kw in keywords):
                target_focus = focus_name.title()
                break

    if target_focus and user and user.profile:
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

    # 2. ACTION INTENT: DURATION ADJUSTMENT ("I have 30 minutes", "Make workout 30 mins", "60 minute workout")
    dur_match = re.search(r'(\d+)\s*(min|mins|minute|minutes)', q)
    if ("time" in q or "durat" in q or "quick" in q or dur_match or "express" in q or "short" in q) and user and user.profile:
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

    # 3. ACTION INTENT: DIFFICULTY SCALING ("Make today's workout easier", "Make it harder", "Too tough", "Too easy")
    if any(k in q for k in ["easier", "harder", "too tough", "too easy", "light", "heavy", "intense", "less weight"]) and user and user.profile:
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

    # 4. ACTION INTENT: EQUIPMENT CONSTRAINTS ("I only have dumbbells today", "No equipment today", "I'm at home")
    if any(k in q for k in ["dumbbell", "dumbbells", "no equipment", "home", "gym", "only have"]) and user and user.profile:
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

    # 5. ACTION INTENT: MEAL SWAP ("Swap my lunch", "I don't like this meal", "Cheaper meal", "High protein meal")
    if (("swap" in q or "change" in q or "replace" in q or "substitute" in q) and any(k in q for k in ["lunch", "dinner", "breakfast", "snack", "meal", "food"])) and user and user.profile:
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

    # 6. ACTION INTENT: MISSED WORKOUT / RESCHEDULING ("I missed yesterday's workout", "Shift missed workout", "Move to tomorrow")
    if any(k in q for k in ["missed", "reschedule", "shift workout", "yesterday", "rebuild"]) and user and user.profile:
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

    # 7. CONVERSATIONAL COACH Q&A (GEMINI LLM WITH OFFLINE FALLBACK)
    api_key = os.getenv("AI_API_KEY") or os.getenv("GEMINI_API_KEY")
    gemini_reply = None
    if api_key:
        gemini_reply = _call_gemini_coach_api(prompt_text, user_context, api_key)

    if gemini_reply:
        return {
            "status": "success",
            "action": "ai_llm_advice",
            "coach_reply": gemini_reply,
            "explanation": "Answered by Gemini 1.5 Flash AI Coach using your live telemetry."
        }

    # Intelligent Offline Knowledge Fallback
    qa_result = process_ai_gym_query(prompt_text, user_profile=user.profile if (user and user.profile) else None)
    qa_exercises = qa_result.get("exercises", [])
    offline_reply = _generate_offline_coaching_reply(q, user_context, qa_exercises)

    return {
        "status": "success",
        "action": "offline_advice",
        "coach_reply": offline_reply,
        "explanation": "Answered by FitSync AI Knowledge Engine.",
        "exercises": qa_exercises[:3]
    }
