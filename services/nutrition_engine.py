import random

def calculate_ai_targets(profile):
    """
    Calculate BMR, TDEE and daily macronutrient targets.
    """
    # BMR (Harris-Benedict Equation)
    if profile.gender.lower() == "male":
        bmr = 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age)
    else:
        bmr = 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age)

    # Assume lightly active (1.375 activity factor)
    tdee = bmr * 1.375

    # Goal adjustment
    goal = profile.fitness_goal.lower()
    if "loss" in goal or "cut" in goal:
        calories = int(tdee - 400)
        min_cals = 1500 if profile.gender.lower() == "male" else 1200
        calories = max(min_cals, calories)
        protein = profile.weight * 1.8
        fat = (calories * 0.20) / 9
        carbs = (calories - (protein * 4) - (fat * 9)) / 4
    elif "gain" in goal or "bulk" in goal:
        calories = int(tdee + 300)
        protein = profile.weight * 2.0
        fat = (calories * 0.25) / 9
        carbs = (calories - (protein * 4) - (fat * 9)) / 4
    else: # Maintenance, general fitness
        calories = int(tdee)
        protein = profile.weight * 1.5
        fat = (calories * 0.25) / 9
        carbs = (calories - (protein * 4) - (fat * 9)) / 4

    return {
        "calories": int(calories),
        "protein": round(protein, 1),
        "carbs": round(carbs, 1),
        "fat": round(fat, 1)
    }


def generate_daily_meals(profile, food_preferences_list, target_nutrition, all_foods, date_str):
    """
    Generate a 5-meal daily plan respecting preferences, availability, and budgets.
    """
    if not all_foods:
        return []

    # Map food preferences
    preferred_set = set()
    available_set = set()
    avoid_set = set()
    
    for p in food_preferences_list:
        if hasattr(p, 'food_name'):
            name_lower = p.food_name.lower()
            pref = getattr(p, 'is_preferred', False)
            avail = getattr(p, 'is_available', False)
            avoid = getattr(p, 'is_avoided', False)
        else:
            name_lower = p.get('food_name', '').lower()
            pref = p.get('is_preferred', False)
            avail = p.get('is_available', False)
            avoid = p.get('is_avoided', False)
            
        if pref:
            preferred_set.add(name_lower)
        if avail:
            available_set.add(name_lower)
        if avoid:
            avoid_set.add(name_lower)

    diet = profile.dietary_preference.lower()
    
    # Parse budget limit
    budget_limit = 150
    if hasattr(profile, 'daily_food_budget') and profile.daily_food_budget:
        budget_limit = int(profile.daily_food_budget)
    elif profile.budget_preference:
        try:
            digits = "".join([c for c in profile.budget_preference if c.isdigit()])
            if digits:
                budget_limit = int(digits)
        except:
            pass

    filtered_foods = []
    for food in all_foods:
        # Avoided foods are strictly excluded
        if food["name"].lower() in avoid_set:
            continue
            
        if diet == "vegan" and not food.get("is_vegan", False):
            continue
            
        if diet == "vegetarian" and not food.get("is_vegetarian", True):
            continue
            
        if diet == "eggetarian":
            if not food.get("is_vegetarian", True) and "egg" not in food["name"].lower():
                continue

        filtered_foods.append(food)

    breakfast_pool = [f for f in filtered_foods if f["category"] in ["Breakfast", "Dairy", "Fruits"]]
    lunch_dinner_pool = [f for f in filtered_foods if f["category"] in ["Grains", "Legumes", "Dairy", "Meat", "Vegetables"]]
    snack_pool = [f for f in filtered_foods if f["category"] in ["Snacks", "Fruits", "Dairy"]]

    if not breakfast_pool: breakfast_pool = filtered_foods
    if not lunch_dinner_pool: lunch_dinner_pool = filtered_foods
    if not snack_pool: snack_pool = filtered_foods

    meal_allocations = [
        ("Breakfast", 0.25, breakfast_pool),
        ("Mid-morning Snack", 0.10, snack_pool),
        ("Lunch", 0.35, lunch_dinner_pool),
        ("Evening Snack", 0.10, snack_pool),
        ("Dinner", 0.20, lunch_dinner_pool)
    ]

    generated_meals = []
    
    for meal_type, percent, pool in meal_allocations:
        meal_cal_target = target_nutrition.calories * percent
        
        # Check priorities:
        # 1. Preferred and Available
        # 2. Available only
        # 3. Preferred only
        # 4. Others
        avail_pref = [f for f in pool if f["name"].lower() in available_set and f["name"].lower() in preferred_set]
        avail_only = [f for f in pool if f["name"].lower() in available_set]
        pref_only = [f for f in pool if f["name"].lower() in preferred_set]
        
        is_alternative = False
        if avail_pref:
            active_pool = avail_pref
        elif avail_only:
            active_pool = avail_only
        elif pref_only:
            active_pool = pref_only
        else:
            active_pool = pool
            is_alternative = True

        # Calculate cost for all candidate options scaled to calorie target
        candidates_with_score = []
        for f in active_pool:
            ratio = meal_cal_target / f["calories"]
            scaled_g = int(f["serving_size_g"] * ratio)
            scaled_g = max(30, min(scaled_g, 400))
            calc_ratio = scaled_g / f["serving_size_g"]
            scaled_cost = f.get("cost_approx", 15) * calc_ratio
            
            # Penalty if it exceeds budget allocation for this meal slot
            target_slot_cost = budget_limit * percent
            penalty = 0
            if scaled_cost > target_slot_cost:
                factor = 5.0 if budget_limit <= 120 else 2.0
                penalty = (scaled_cost - target_slot_cost) * factor
                
            score = scaled_cost + penalty
            candidates_with_score.append((f, score, calc_ratio, scaled_g, scaled_cost))

        if not candidates_with_score:
            primary_food = random.choice(all_foods)
            ratio = meal_cal_target / primary_food["calories"]
            scaled_g = max(30, min(int(primary_food["serving_size_g"] * ratio), 400))
            calc_ratio = scaled_g / primary_food["serving_size_g"]
            scaled_cost = primary_food.get("cost_approx", 15) * calc_ratio
        else:
            # Pick from top candidates (sort by score ascending)
            candidates_with_score.sort(key=lambda x: x[1])
            limit = 1 if budget_limit <= 100 else min(3, len(candidates_with_score))
            chosen = random.choice(candidates_with_score[:limit])
            primary_food, _, calc_ratio, scaled_g, scaled_cost = chosen

        cals = int(primary_food["calories"] * calc_ratio)
        prot = round(primary_food["protein"] * calc_ratio, 1)
        carb = round(primary_food["carbs"] * calc_ratio, 1)
        fat = round(primary_food["fat"] * calc_ratio, 1)

        unit_str = f"{round(calc_ratio, 1)}x {primary_food['common_unit']}"
        if is_alternative:
            unit_str += " (Alternative suggestion)"

        meal_item = {
            "meal_type": meal_type,
            "food_id": primary_food["id"],
            "food_name": primary_food["name"],
            "serving_size_g": scaled_g,
            "calories": cals,
            "protein": prot,
            "carbs": carb,
            "fat": fat,
            "cost": int(scaled_cost),
            "common_unit": unit_str
        }
        generated_meals.append(meal_item)

    return generated_meals


def get_food_alternative(current_meal_food_id, current_meal_calories, current_meal_protein, dietary_preference, budget_preference, all_foods, food_preferences_list=[]):
    """
    Find substitute food item of similar category, respecting dietary preference, avoiding avoided items,
    prioritizing available/preferred, and meeting targets within budget.
    """
    diet = dietary_preference.lower()

    # Parse budget limit
    budget_limit = 150
    if budget_preference:
        try:
            if isinstance(budget_preference, (int, float)):
                budget_limit = int(budget_preference)
            else:
                digits = "".join([c for c in str(budget_preference) if c.isdigit()])
                if digits:
                    budget_limit = int(digits)
        except:
            pass

    # Map preferences
    preferred_set = set()
    available_set = set()
    avoid_set = set()
    
    for p in food_preferences_list:
        if hasattr(p, 'food_name'):
            name_lower = p.food_name.lower()
            pref = getattr(p, 'is_preferred', False)
            avail = getattr(p, 'is_available', False)
            avoid = getattr(p, 'is_avoided', False)
        else:
            name_lower = p.get('food_name', '').lower()
            pref = p.get('is_preferred', False)
            avail = p.get('is_available', False)
            avoid = p.get('is_avoided', False)
            
        if pref:
            preferred_set.add(name_lower)
        if avail:
            available_set.add(name_lower)
        if avoid:
            avoid_set.add(name_lower)

    filtered_foods = []
    for food in all_foods:
        if food["id"] == current_meal_food_id:
            continue
        if food["name"].lower() in avoid_set:
            continue
        if diet == "vegan" and not food.get("is_vegan", False):
            continue
        if diet == "vegetarian" and not food.get("is_vegetarian", True):
            continue
        if diet == "eggetarian":
            if not food.get("is_vegetarian", True) and "egg" not in food["name"].lower():
                continue
        filtered_foods.append(food)

    if not filtered_foods:
        return None

    # Try to find foods in the same category
    orig_food = next((f for f in all_foods if f["id"] == current_meal_food_id), None)
    orig_category = orig_food["category"] if orig_food else "Grains"

    same_cat_foods = [f for f in filtered_foods if f["category"] == orig_category]
    candidates = same_cat_foods if same_cat_foods else filtered_foods

    best_candidate = None
    min_score = float("inf")

    for f in candidates:
        cal_ratio = current_meal_calories / f["calories"]
        cand_protein = f["protein"] * cal_ratio
        cand_cost = f.get("cost_approx", 15) * cal_ratio
        
        # Match protein, penalize excessive cost if budget is tight
        protein_diff = abs(cand_protein - current_meal_protein)
        
        cost_penalty = 0
        if budget_limit <= 120 and cand_cost > (budget_limit * 0.3):
            cost_penalty = (cand_cost - (budget_limit * 0.3)) * 2.0
            
        # Preference bonus logic
        pref_bonus = 0
        name_lower = f["name"].lower()
        if name_lower in available_set and name_lower in preferred_set:
            pref_bonus = 8
        elif name_lower in available_set:
            pref_bonus = 5
        elif name_lower in preferred_set:
            pref_bonus = 2
            
        score = protein_diff + cost_penalty - pref_bonus
        
        if score < min_score:
            min_score = score
            best_candidate = {
                "food_id": f["id"],
                "name": f["name"],
                "serving_size_g": int(f["serving_size_g"] * cal_ratio),
                "calories": current_meal_calories,
                "protein": round(cand_protein, 1),
                "carbs": round(f["carbs"] * cal_ratio, 1),
                "fat": round(f["fat"] * cal_ratio, 1),
                "cost": int(cand_cost),
                "common_unit": f"{round(cal_ratio, 1)}x {f['common_unit']}"
            }

    return best_candidate
