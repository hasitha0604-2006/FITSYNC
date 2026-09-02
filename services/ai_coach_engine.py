"""
FitSync Conversational AI Coach Engine
Provides context-aware, human-like coaching advice by combining live user telemetry
(BMR/TDEE targets, macro goals, food budget, equipment, and weekly splits)
with Gemini 1.5 Flash LLM and an intelligent offline fitness knowledge engine.
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

def _clean_and_parse_json(text_content):
    """
    Cleans markdown code fences and parses JSON payload safely.
    """
    if not text_content:
        return None
    cleaned = text_content.strip()
    cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s*```$', '', cleaned)
    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except Exception:
        match = re.search(r'(\{.*\})', cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except Exception:
                pass
        return None


def _call_gemini_coach_api(prompt_text, user_context, api_key, history=None):
    """
    Calls Google Gemini API with user telemetry context and recent conversation history.
    Returns natural language coach response or None on failure.
    """
    try:
        hist_str = ""
        if history:
            recent_turns = history[-4:]
            hist_str = "Recent Conversation Context:\n" + "\n".join([f"- {h.get('role', 'user')}: {h.get('message', '')}" for h in recent_turns]) + "\n\n"

        user_prompt = (
            "You are FitSync AI — an expert, friendly, encouraging personal fitness, sports, and nutrition coach. "
            "Your domain is strictly FITNESS, SPORTS, EXERCISE, and FITNESS NUTRITION. "
            "Answer the user's question directly and concisely in 2-4 sentences using markdown formatting. "
            "Use their personal telemetry data and recent conversation history to resolve follow-up queries and personalize advice.\n\n"
            f"{hist_str}"
            f"User Profile Telemetry: {json.dumps(user_context)}\n"
            f"User Question: \"{prompt_text}\"\n\n"
            "Return valid JSON matching this schema: {\"coach_reply\": \"string\", \"intent\": \"string\"}"
        )

        model_name = os.getenv("GEMINI_MODEL", "gemini-flash-latest")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": user_prompt}]}],
            "generationConfig": {"temperature": 0.4, "responseMimeType": "application/json"}
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )

        with urllib.request.urlopen(req, timeout=6) as response:
            res_body = json.loads(response.read().decode('utf-8'))
            candidates = res_body.get('candidates', [])
            if candidates and 'content' in candidates[0] and 'parts' in candidates[0]['content']:
                text_content = candidates[0]['content']['parts'][0].get('text', '')
                parsed = _clean_and_parse_json(text_content)
                if parsed and isinstance(parsed, dict) and "coach_reply" in parsed:
                    return parsed
        return None
    except Exception as e:
        print(f"[AI COACH WARNING] Gemini API call skipped/failed: {e}")
        return None


def _is_off_topic(q):
    """
    Checks if a query is clearly unrelated to fitness, exercise, sports, or nutrition.
    """
    off_topic_keywords = [
        "python", "javascript", "code", "programming", "software", "bug", "html", "css",
        "capital of", "president", "prime minister", "movie", "song", "weather",
        "stock market", "crypto", "bitcoin", "politics", "essay", "homework", "math problem"
    ]
    return any(re.search(r'\b' + re.escape(kw) + r'\b', q) for kw in off_topic_keywords)


def _check_safety(q):
    """
    Checks for medical diagnoses, medication requests, steroids, or unsafe practices.
    """
    medical_med_keywords = [
        "medication", "medicine", "pill", "prescription", "steroid", "steroids", "anavar", "dianabol", "trent",
        "chest pain", "severe pain", "broken bone", "dislocated", "diagnose", "starvation", "starve", "vomit", "anorexia"
    ]
    if any(k in q for k in medical_med_keywords):
        return {
            "is_safety_issue": True,
            "reply": (
                "⚠️ **Safety Alert**: FitSync AI provides general fitness guidance but cannot diagnose medical conditions, "
                "prescribe medication, or recommend anabolic steroids or extreme starvation protocols. "
                "If you are experiencing severe pain, injury, or severe symptoms, please stop exercising immediately "
                "and consult a qualified healthcare professional."
            ),
            "intent": "SAFETY_SENSITIVE"
        }

    injury_keywords = ["hurt", "pain", "injury", "sprain", "strain", "sore knee", "back pain"]
    if any(k in q for k in injury_keywords):
        return {
            "is_safety_issue": True,
            "reply": (
                "⚠️ **Injury Caution**: If an exercise causes active or sharp pain, stop that movement immediately. "
                "I recommend substituting the exercise with a low-impact alternative or resting the joint. "
                "For severe or persistent discomfort, please get evaluated by a sports physician or physiotherapist."
            ),
            "intent": "SAFETY_SENSITIVE"
        }

    return {"is_safety_issue": False}


def _get_sports_routine(q):
    """
    Generates structured sports warm-up & conditioning guidance.
    """
    sport_map = {
        "football": "Football / Soccer",
        "soccer": "Football / Soccer",
        "cricket": "Cricket",
        "basketball": "Basketball",
        "running": "Running / Sprinting",
        "runner": "Running",
        "badminton": "Badminton / Tennis",
        "tennis": "Tennis"
    }

    detected_sport = None
    for k, v in sport_map.items():
        if k in q:
            detected_sport = v
            break

    if not detected_sport:
        detected_sport = "Athletic Sports"

    reply = (
        f"🏃 **Dynamic Warm-Up for {detected_sport}** (10 Mins):\n\n"
        "1. **Light Jog & High Knees** — 2 mins (Elevate heart rate & blood flow)\n"
        "2. **Leg Swings & Arm Circles** — 10 reps each direction (Dynamic joint mobility)\n"
        "3. **Walking Lunges with Torso Twist** — 8 reps per side (Hip flexor & core activation)\n"
        "4. **Lateral Shuffles & Carioca** — 2 x 15m (Groin & lateral movement prep)\n"
        "5. **Short Acceleration Sprints** — 3 x 20m building up to 85% speed\n\n"
        "This pre-session routine primes your central nervous system and reduces muscle strain risks!"
    )
    return reply, "SPORTS_WARMUP"


def _generate_offline_coaching_reply(q, user_context, qa_exercises, user_foods=None):
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

    # Progress Q&A
    if any(k in q for k in ["progress", "how am i doing", "stats", "history"]):
        reply = (
            f"📊 **Progress Check for {name}**:\n"
            f"• **Goal**: {goal}\n"
            f"• **Daily Targets**: {cals} kcal | {prot}g Protein | ₹{budget} Budget\n"
            f"• **Current Split Focus**: Today is **{today_focus}**\n\n"
            "Keep hitting your daily protein targets and staying consistent with your scheduled workouts to drive steady gains!"
        )
        return reply, "PROGRESS"

    # Nutrition & Diet Q&A
    if any(k in q for k in ["eat", "diet", "protein", "food", "calorie", "calories", "budget", "paneer", "egg", "eggs", "meal", "dinner", "lunch", "breakfast"]):
        if "protein" in q or "high protein" in q:
            if "eggetarian" in diet_pref.lower() or "egg" in q:
                reply = f"For your {prot}g daily protein target on a ₹{budget}/day budget, boiled eggs (6g protein/egg) and paneer (18g protein/100g) are your best budget powerhouses, {name}! Pair them with yellow dal for complete amino acid synthesis."
            elif "veg" in diet_pref.lower():
                reply = f"To hit your {prot}g protein target as a vegetarian, focus on Paneer (18g/100g), Roasted Chana (19g/100g), Soya chunks, and Yellow Dal Tadka. They fit easily inside your ₹{budget}/day budget!"
            else:
                reply = f"Great sources for your {prot}g protein target include eggs, chicken breast, paneer, and fish. Spread them across your meals to keep muscle protein synthesis high for your {goal} goal!"
            return reply, "NUTRITION"

        if "budget" in q or "cheap" in q:
            reply = f"FitSync AI keeps your nutrition affordable! Stick to student staples like Boiled Eggs (₹6/egg), Roasted Chana (₹20/100g), Oats (₹25/serving), and Yellow Dal. You'll hit your {cals} kcal target well under your ₹{budget}/day budget."
            return reply, "BUDGET_NUTRITION"

        reply = f"Your personalized daily target is {cals} kcal and {prot}g protein for {goal}. Try to eat 4-5 evenly spaced meals throughout the day to support recovery from today's {today_focus} session!"
        return reply, "NUTRITION"

    # Workout, Progressive Overload & Training Q&A
    if any(k in q for k in ["bench", "squat", "workout", "exercise", "overload", "rep", "reps", "set", "sets", "weight", "muscle", "strength", "sore", "soreness"]):
        if "overload" in q:
            reply = f"Progressive overload means gradually increasing weight, reps, or sets over time, {name}. If you complete 3 sets of 12 reps with good form, add 2.5kg next week to force your muscles to adapt for {goal}!"
            return reply, "EXERCISE_TECHNIQUE"

        if "sore" in q:
            reply = f"Muscle soreness (DOMS) is completely normal when starting or increasing intensity! Stay hydrated, hit your {prot}g protein goal, and focus on light stretching or active recovery today."
            return reply, "RECOVERY"

        if qa_exercises:
            best_ex = qa_exercises[0]
            reply = f"For your **{today_focus}** training, **{best_ex['name']}** ({best_ex['category']}) is an outstanding movement! Focus on controlling the 2-second negative phase and driving through with full control."
            return reply, "EXERCISE_EXPLANATION"

        reply = f"To maximize your {goal} goal during today's {today_focus} session, perform 3-4 sets of 8-12 reps with a 60-90 second rest period. Focus on full range of motion over heavy weight!"
        return reply, "WORKOUT_EXPLANATION"

    # Fat Loss & Weight Management Q&A
    if any(k in q for k in ["fat", "lose", "weight loss", "shred", "cardio", "belly"]):
        reply = f"For effective fat loss, aim for a moderate 300-500 kcal deficit while keeping your protein high at {prot}g to preserve lean muscle. Combine resistance training with 20 minutes of daily brisk walking!"
        return reply, "GENERAL_FITNESS"

    # Default friendly coach greeting / Q&A
    reply = f"Hey {name}! As your FitSync AI Coach, I'm tracking your {goal} plan (Target: {cals} kcal, {prot}g protein, ₹{budget}/day budget). You can ask me for meal ideas, exercise form tips, or request to change today's {today_focus} workout!"
    return reply, "GENERAL_FITNESS"


def process_coach_command(user, prompt_text, app_context=None, history=None, db_session=None):
    """
    Core Conversational Coach Entry Point.
    Parses natural language commands, resolves follow-ups, and returns structured Action Cards for user confirmation.
    """
    from flask import has_app_context
    if app_context and not has_app_context():
        with app_context.app_context():
            return _process_coach_command_inner(user, prompt_text, app_context=app_context, history=history, db_session=db_session)
    return _process_coach_command_inner(user, prompt_text, app_context=app_context, history=history, db_session=db_session)

def _process_coach_command_inner(user, prompt_text, app_context=None, history=None, db_session=None):
    from app import db, WorkoutPlan, WorkoutDay, WorkoutExercise, MealPlan, Meal, NutritionTarget, ProgressRecord, UserEquipment, UserProfile, get_all_user_foods, get_exercises_data
    from services.ai_search_engine import process_ai_gym_query

    session = db_session or db.session

    if not prompt_text or not prompt_text.strip():
        user_name = user.profile.name if (user and user.profile) else "there"
        return {
            "status": "success",
            "action": "greeting",
            "intent": "GENERAL_FITNESS",
            "coach_reply": f"👋 Hey {user_name}! I'm your FitSync AI Coach. I know your goals, workouts, equipment and nutrition preferences. How can I help today?",
            "explanation": "Ask me anything like 'Explain today's workout', 'I only have dumbbells today', or 'Suggest a high-protein dinner'."
        }

    q = prompt_text.strip().lower()

    # 1. Off-Topic Check
    if _is_off_topic(q):
        return {
            "status": "success",
            "action": "off_topic",
            "intent": "UNSUPPORTED",
            "coach_reply": "I'm your FitSync personal fitness coach! I specialize in workouts, exercise techniques, sports training, and fitness nutrition. What fitness goal or workout can I help you with today?",
            "explanation": "Query is outside FitSync's fitness, sports, and nutrition scope."
        }

    # 2. Safety Check
    safety_res = _check_safety(q)
    if safety_res.get("is_safety_issue"):
        return {
            "status": "success",
            "action": "safety_alert",
            "intent": safety_res["intent"],
            "coach_reply": safety_res["reply"],
            "explanation": "FitSync Safety System Disclaimer."
        }

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
        target = session.query(NutritionTarget).filter_by(user_id=user.id).first()
        if target:
            user_context["target_calories"] = target.calories
            user_context["target_protein"] = target.protein

        plan = session.query(WorkoutPlan).filter_by(user_id=user.id, is_active=True).first()
        if plan:
            today_name = datetime.now().strftime("%A")
            today_w = session.query(WorkoutDay).filter_by(workout_plan_id=plan.id, day_name=today_name).first()
            if today_w:
                user_context["today_focus"] = today_w.focus

    # 3. ACTION INTENT: DURATION ADJUSTMENT ("I have 30 minutes", "Make workout 30 mins", "60 minute workout")
    dur_match = re.search(r'(\d+)\s*(min|mins|minute|minutes)', q)
    if ("time" in q or "durat" in q or "quick" in q or dur_match or "express" in q or "short" in q) and user and user.profile:
        target_mins = 30
        if dur_match:
            target_mins = int(dur_match.group(1))
        elif "60" in q or "hour" in q:
            target_mins = 60
        elif "45" in q:
            target_mins = 45

        plan = session.query(WorkoutPlan).filter_by(user_id=user.id, is_active=True).first()
        if plan:
            today_name = datetime.now().strftime("%A")
            today_w = session.query(WorkoutDay).filter_by(workout_plan_id=plan.id, day_name=today_name).first()
            if not today_w or today_w.is_rest_day:
                today_w = next((d for d in plan.days if not d.is_rest_day), plan.days[0] if plan.days else None)

            if today_w:
                curr_dur = today_w.duration_minutes or 45
                return {
                    "status": "success",
                    "action": "duration_adjustment_proposal",
                    "intent": "WORKOUT_ADJUSTMENT",
                    "coach_reply": f"I can adjust your **{today_w.focus}** session from {curr_dur} mins to ~**{target_mins} minutes** so you can get a great workout without rushing.",
                    "explanation": f"Propose reducing workout density to ~{target_mins} minutes based on your available time.",
                    "proposed_action": {
                        "type": "ADJUST_DURATION",
                        "title": "Shorten Workout Duration",
                        "current": f"{curr_dur} minutes",
                        "proposed": f"{target_mins} minutes",
                        "reason": f"You mentioned having {target_mins} minutes available today.",
                        "endpoint": "/api/workout/adjust-duration",
                        "payload": {"duration_mins": target_mins}
                    },
                    "redirect_url": "/today-workout"
                }

    # 4. ACTION INTENT: DIFFICULTY SCALING ("Make today's workout easier", "Make it harder", "Too tough", "Too easy")
    if any(k in q for k in ["easier", "harder", "too tough", "too easy", "light", "heavy", "intense", "less weight"]) and user and user.profile:
        direction = "easier" if any(k in q for k in ["easier", "too tough", "light", "less"]) else "harder"
        plan = session.query(WorkoutPlan).filter_by(user_id=user.id, is_active=True).first()
        if plan:
            today_name = datetime.now().strftime("%A")
            today_w = session.query(WorkoutDay).filter_by(workout_plan_id=plan.id, day_name=today_name).first()
            if not today_w or today_w.is_rest_day:
                today_w = next((d for d in plan.days if not d.is_rest_day), plan.days[0] if plan.days else None)

            if today_w:
                return {
                    "status": "success",
                    "action": "difficulty_adjustment_proposal",
                    "intent": "WORKOUT_ADJUSTMENT",
                    "coach_reply": f"I can adjust your **{today_w.focus}** session volume to be **{direction}** (modifying rep ranges & rest intervals) while preserving muscle activation.",
                    "explanation": f"Propose scaling workout intensity to be {direction} per your request.",
                    "proposed_action": {
                        "type": "ADJUST_DIFFICULTY",
                        "title": f"Make Workout {direction.title()}",
                        "current": "Standard Volume",
                        "proposed": f"{direction.title()} Intensity & Reps",
                        "reason": f"Scaled workout intensity to be {direction}.",
                        "endpoint": "/api/workout/adjust-difficulty",
                        "payload": {"direction": direction}
                    },
                    "redirect_url": "/today-workout"
                }

    # 5. ACTION INTENT: EXPLAIN TODAY'S WORKOUT
    if any(k in q for k in ["explain today", "today's workout", "todays workout", "my workout today", "what is today"]):
        if user and user.profile:
            plan = session.query(WorkoutPlan).filter_by(user_id=user.id, is_active=True).first()
            if plan:
                today_name = datetime.now().strftime("%A")
                today_w = session.query(WorkoutDay).filter_by(workout_plan_id=plan.id, day_name=today_name).first()
                if today_w:
                    if today_w.is_rest_day:
                        reply = f"Today ({today_name}) is scheduled as a **Rest & Recovery Day**. Use today to hydrate, get 8 hours of sleep, and hit your protein target of {user_context['target_protein']}g!"
                        return {
                            "status": "success",
                            "action": "workout_explained",
                            "intent": "WORKOUT_EXPLANATION",
                            "coach_reply": reply,
                            "explanation": "Today is a rest day."
                        }
                    else:
                        ex_list = [ex.to_dict() for ex in today_w.exercises]
                        ex_names = ", ".join([e["name"] for e in ex_list[:4]])
                        reply = (
                            f"🏋️ **Today's Workout: {today_w.focus}** (~{today_w.duration_minutes or 45} mins)\n\n"
                            f"Your session consists of **{len(ex_list)} exercises**, featuring **{ex_names}**. "
                            f"Focus on hitting {user.profile.fitness_goal}-specific tempo and resting 60-90 seconds between sets!"
                        )
                        return {
                            "status": "success",
                            "action": "workout_explained",
                            "intent": "WORKOUT_EXPLANATION",
                            "coach_reply": reply,
                            "exercises": ex_list,
                            "explanation": f"Retrieved today's {today_w.focus} workout."
                        }

    # 4. ACTION INTENT: SPORTS WARM-UP / TRAINING
    if any(k in q for k in ["sport", "football", "cricket", "basketball", "soccer", "running", "warmup", "warm-up", "agility"]):
        sports_reply, sports_intent = _get_sports_routine(q)
        return {
            "status": "success",
            "action": "sports_routine",
            "intent": sports_intent,
            "coach_reply": sports_reply,
            "explanation": "Generated sports dynamic warm-up routine."
        }

    # 5. ACTION INTENT: CHANGE TODAY'S WORKOUT FOCUS ("I want to train chest today", "Switch to legs", "Let's do shoulders")
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
        plan = session.query(WorkoutPlan).filter_by(user_id=user.id, is_active=True).first()
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
                    "intent": "WORKOUT_ADJUSTMENT",
                    "coach_reply": reply,
                    "explanation": f"Switched today's focus to {target_focus} and rebalanced your rest days.",
                    "redirect_url": "/today-workout"
                }

    # 8. ACTION INTENT: EQUIPMENT CONSTRAINTS ("I only have dumbbells today", "No equipment today", "I'm at home")
    if any(k in q for k in ["dumbbell", "dumbbells", "no equipment", "home", "gym", "only have"]) and user and user.profile:
        env = "Gym"
        if "dumbbell" in q:
            env = "Dumbbells Only"
        elif "no equipment" in q or "bodyweight" in q or "home" in q:
            env = "Home / No Equipment"

        return {
            "status": "success",
            "action": "environment_proposal",
            "intent": "EQUIPMENT_ALTERNATIVE",
            "coach_reply": f"I can adapt your weekly training split to **{env}** and update exercise selections accordingly.",
            "explanation": f"Adapt workout split to {env}.",
            "proposed_action": {
                "type": "CHANGE_ENVIRONMENT",
                "title": f"Adapt Environment to {env}",
                "current": user.profile.workout_environment or "Standard Gym",
                "proposed": env,
                "reason": f"Adapt plan to use {env} exercises.",
                "endpoint": "/api/workout/regenerate",
                "payload": {}
            },
            "redirect_url": "/today-workout"
        }

    # 9. ACTION INTENT: MEAL SWAP ("Swap my lunch", "I don't like this meal", "Cheaper meal", "High protein meal", "I don't have chicken")
    if (("swap" in q or "change" in q or "replace" in q or "substitute" in q or "don't have" in q or "dont have" in q) and any(k in q for k in ["lunch", "dinner", "breakfast", "snack", "meal", "food", "chicken", "paneer", "egg", "eggs"])) and user and user.profile:
        today_str = datetime.now().strftime("%Y-%m-%d")
        meal_p = session.query(MealPlan).filter_by(user_id=user.id, date=today_str).first()
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
                return {
                    "status": "success",
                    "action": "meal_swap_proposal",
                    "intent": "MEAL_SWAP",
                    "coach_reply": f"I found a great alternative: **{alt['name']}** ({alt['calories']} kcal, {alt['protein']}g protein) for your {target_m.meal_type}. It fits right inside your ₹{user.profile.daily_food_budget} daily food budget!",
                    "explanation": f"High-protein meal alternative for {target_m.meal_type}.",
                    "foods": [alt],
                    "proposed_action": {
                        "type": "SWAP_MEAL",
                        "title": f"Swap {target_m.meal_type}",
                        "current": orig_name,
                        "proposed": f"{alt['name']} ({alt['calories']} kcal, {alt['protein']}g protein)",
                        "reason": f"High-protein alternative fitting your ₹{user.profile.daily_food_budget} budget",
                        "endpoint": "/api/nutrition/meal/substitute",
                        "payload": {"meal_id": target_m.id, "new_food_id": alt["food_id"]}
                    },
                    "redirect_url": "/nutrition"
                }

    # 10. ACTION INTENT: MISSED WORKOUT / RESCHEDULING ("I missed yesterday's workout", "Shift missed workout", "Move to tomorrow")
    if any(k in q for k in ["missed", "reschedule", "shift workout", "yesterday", "rebuild"]) and user and user.profile:
        plan = session.query(WorkoutPlan).filter_by(user_id=user.id, is_active=True).first()
        if plan:
            missed_d = next((d for d in plan.days if not d.is_completed and not d.is_rest_day), None)
            if missed_d:
                return {
                    "status": "success",
                    "action": "reschedule_proposal",
                    "intent": "WORKOUT_ADJUSTMENT",
                    "coach_reply": f"I can reschedule your missed **{missed_d.focus}** session to an upcoming rest day so your progress stays on track.",
                    "explanation": "Shift missed workout to upcoming rest day.",
                    "proposed_action": {
                        "type": "RESCHEDULE_WEEK",
                        "title": "Reschedule Missed Workout",
                        "current": f"{missed_d.day_name}: {missed_d.focus}",
                        "proposed": "Shift to upcoming Rest Day",
                        "reason": "Prevents fatigue buildup while maintaining weekly volume.",
                        "endpoint": "/api/workout/rebuild",
                        "payload": {}
                    },
                    "redirect_url": "/workout-plan"
                }

    # 11. CONVERSATIONAL COACH Q&A (GEMINI LLM WITH OFFLINE FALLBACK)
    api_key = os.getenv("AI_API_KEY") or os.getenv("GEMINI_API_KEY")
    gemini_res = None
    if api_key:
        gemini_res = _call_gemini_coach_api(prompt_text, user_context, api_key, history=history)

    qa_result = process_ai_gym_query(prompt_text, user_profile=user.profile if (user and user.profile) else None)
    qa_exercises = qa_result.get("exercises", [])

    if gemini_res and gemini_res.get("coach_reply"):
        return {
            "status": "success",
            "action": "ai_llm_advice",
            "intent": gemini_res.get("intent", "GENERAL_FITNESS"),
            "coach_reply": gemini_res.get("coach_reply"),
            "explanation": "Answered by Gemini AI Coach using your live telemetry.",
            "exercises": qa_exercises[:3]
        }

    # Intelligent Offline Knowledge Fallback
    all_user_foods = get_all_user_foods(user) if user else []
    offline_reply, intent_type = _generate_offline_coaching_reply(q, user_context, qa_exercises, all_user_foods)

    return {
        "status": "success",
        "action": "offline_advice",
        "intent": intent_type,
        "coach_reply": offline_reply,
        "explanation": "Answered by FitSync AI Knowledge Engine.",
        "exercises": qa_exercises[:3]
    }
