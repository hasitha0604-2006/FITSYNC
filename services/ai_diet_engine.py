import os
import json
import re
import urllib.request
import urllib.parse
from services.nutrition_engine import generate_daily_meals, calculate_ai_targets

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

def generate_ai_diet_plan(profile, food_preferences_list, target_nutrition, all_foods, date_str):
    """
    Generates an AI-assisted diet plan based on user profile, preferences, budget, and custom foods.
    If an external AI API key (AI_API_KEY / GEMINI_API_KEY) is available, it uses AI to structure & explain
    the meal plan while ensuring strict nutritional adherence.
    Falls back gracefully to FitSync's local nutrition engine if AI is unreachable or unconfigured.
    """
    api_key = os.getenv("AI_API_KEY") or os.getenv("GEMINI_API_KEY")
    
    # 1. Generate candidate base meals via local engine to ensure valid foods, macros, and cost safety
    base_meals = generate_daily_meals(profile, food_preferences_list, target_nutrition, all_foods, date_str)
    
    if not api_key:
        explanation = (
            f"Your plan is protein-focused ({target_nutrition.protein}g target) to support your {profile.fitness_goal} "
            f"goal while staying strictly within your ₹{profile.daily_food_budget or 150}/day food budget."
        )
        return {
            "status": "success",
            "is_ai": False,
            "notice": "AI planning key not configured. We've generated your optimal plan using FitSync's nutrition engine.",
            "explanation": explanation,
            "meals": base_meals
        }

    try:
        # Construct prompt for Gemini API
        prompt_data = {
            "goal": profile.fitness_goal,
            "dietary_preference": profile.dietary_preference,
            "daily_budget_inr": profile.daily_food_budget or 150,
            "target_calories": target_nutrition.calories,
            "target_protein_g": target_nutrition.protein,
            "base_suggested_meals": [
                {
                    "meal_type": m["meal_type"],
                    "food_name": m["food_name"],
                    "calories": m["calories"],
                    "protein": m["protein"],
                    "cost": m["cost"]
                }
                for m in base_meals
            ]
        }

        user_prompt = (
            "You are FitSync AI's nutrition assistant. Provide a brief 2-sentence explanation "
            "for why this 5-meal plan fits the student's fitness goal and daily budget. "
            "Return valid JSON matching this schema: {\"explanation\": \"string\"}.\n"
            f"Data: {json.dumps(prompt_data)}"
        )

        model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": user_prompt}]}],
            "generationConfig": {"temperature": 0.3, "responseMimeType": "application/json"}
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        
        with urllib.request.urlopen(req, timeout=6) as response:
            res_body = json.loads(response.read().decode('utf-8'))
            candidates = res_body.get('candidates', [])
            explanation = ""
            if candidates and 'content' in candidates[0] and 'parts' in candidates[0]['content']:
                text_content = candidates[0]['content']['parts'][0].get('text', '')
                parsed = _clean_and_parse_json(text_content)
                if parsed and isinstance(parsed, dict):
                    explanation = parsed.get("explanation", "")

        if not explanation:
            explanation = (
                f"Your 5-meal plan delivers ~{target_nutrition.protein}g protein aligned with your {profile.fitness_goal} "
                f"goal while maintaining your ₹{profile.daily_food_budget or 150}/day daily budget."
            )

        return {
            "status": "success",
            "is_ai": True,
            "explanation": explanation,
            "meals": base_meals
        }

    except Exception as e:
        print(f"[AI DIET WARNING] Gemini API call skipped/failed: {e}")
        explanation = (
            f"Your plan is protein-focused ({target_nutrition.protein}g target) to support your {profile.fitness_goal} "
            f"goal while staying strictly within your ₹{profile.daily_food_budget or 150}/day food budget."
        )
        return {
            "status": "success",
            "is_ai": False,
            "notice": "AI planning is temporarily unavailable. We've generated your plan using FitSync's nutrition engine.",
            "explanation": explanation,
            "meals": base_meals
        }


def generate_ai_grocery_list(profile, active_meals):
    """
    Generates a 7-day categorized hostel grocery & canteen shopping list with estimated INR budget totals.
    Uses Gemini AI if available or structured local aggregation as fallback.
    """
    api_key = os.getenv("AI_API_KEY") or os.getenv("GEMINI_API_KEY")
    daily_budget = profile.daily_food_budget or 150
    weekly_budget = daily_budget * 7

    # Aggregated items from 5-meal plan
    items_map = {}
    for m in active_meals:
        fn = m.get("food_name", "Staple Item")
        cost = m.get("cost", 10) * 7
        if fn in items_map:
            items_map[fn]["weekly_cost"] += cost
            items_map[fn]["servings"] += 7
        else:
            items_map[fn] = {
                "name": fn,
                "weekly_cost": cost,
                "servings": 7,
                "category": m.get("category", "Staples")
            }

    grocery_items = list(items_map.values())
    total_est_cost = sum(i["weekly_cost"] for i in grocery_items)

    if api_key:
        try:
            model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            prompt = (
                "You are FitSync AI's budget nutrition expert. Create a concise 7-day hostel grocery list summary "
                f"for a college student with a ₹{weekly_budget} weekly food budget based on these foods: {json.dumps(grocery_items)}. "
                "Return JSON matching: {\"summary\": \"string\", \"tip\": \"string\"}"
            )
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.3, "responseMimeType": "application/json"}
            }
            req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(req, timeout=6) as response:
                res_body = json.loads(response.read().decode('utf-8'))
                candidates = res_body.get('candidates', [])
                if candidates and 'content' in candidates[0] and 'parts' in candidates[0]['content']:
                    text_content = candidates[0]['content']['parts'][0].get('text', '')
                    parsed = _clean_and_parse_json(text_content)
                    if parsed and isinstance(parsed, dict):
                        return {
                            "status": "success",
                            "is_ai": True,
                            "weekly_budget": weekly_budget,
                            "total_est_cost": total_est_cost,
                            "summary": parsed.get("summary", f"7-day grocery list tailored to your ₹{weekly_budget} budget."),
                            "pro_tip": parsed.get("tip", "Buy dry staples (chana, peanuts, lentils) in bulk to save ~15% weekly!"),
                            "items": grocery_items
                        }
        except Exception as e:
            print(f"[AI GROCERY WARNING] Gemini API call skipped/failed: {e}")

    return {
        "status": "success",
        "is_ai": False,
        "weekly_budget": weekly_budget,
        "total_est_cost": total_est_cost,
        "summary": f"7-day hostel grocery list optimized for your ₹{weekly_budget}/week budget.",
        "pro_tip": "Buy dry staples like roasted chana, peanuts, and dal in bulk at local markets to maximize protein per Rupee!",
        "items": grocery_items
    }

