import os
import json
import urllib.request
import urllib.parse
from services.nutrition_engine import generate_daily_meals, calculate_ai_targets

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

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": user_prompt}]}],
            "generationConfig": {"temperature": 0.3, "responseMimeType": "application/json"}
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
        explanation = (
            f"Your plan is protein-focused ({target_nutrition.protein}g target) to support your {profile.fitness_goal} "
            f"goal while staying strictly within your ₹{profile.daily_food_budget or 150}/day food budget."
        )
        return {
            "status": "success",
            "is_ai": False,
            "notice": f"AI planning is temporarily unavailable. We've generated your plan using FitSync's nutrition engine.",
            "explanation": explanation,
            "meals": base_meals
        }
