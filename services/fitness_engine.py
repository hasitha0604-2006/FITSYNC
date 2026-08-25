import random
import re

def parse_reps_range(reps_str):
    if not reps_str:
        return 8, 12
    nums = [int(s) for s in re.findall(r'\d+', str(reps_str))]
    if len(nums) >= 2:
        return nums[0], nums[1]
    elif len(nums) == 1:
        return nums[0], nums[0]
    return 8, 12


def _score_exercise_for_goal(ex, goal, fitness_level):
    """Returns a relevance score modifier based on user's fitness goal and level."""
    score = 0
    reps_min, reps_max = parse_reps_range(str(ex.get("default_reps", "10-12")))
    name_lower = ex["name"].lower()

    compound_keywords = ["squat", "deadlift", "bench press", "barbell row", "overhead press",
                         "pull-up", "chin-up", "dip", "hip thrust", "romanian", "lunge",
                         "push-up", "row", "press", "clean", "snatch"]
    is_compound = any(k.lower() in name_lower for k in compound_keywords)
    is_high_rep = (reps_min >= 12)
    is_low_rep = (reps_max <= 8)

    goal_lower = (goal or "general fitness").lower()

    if "muscle gain" in goal_lower or "hypertrophy" in goal_lower:
        if is_compound:
            score += 3
        if 6 <= reps_min <= 12:
            score += 2
        if ex.get("difficulty", "").lower() in ["intermediate", "advanced"]:
            score += 1
    elif "fat loss" in goal_lower or "weight loss" in goal_lower:
        if is_high_rep:
            score += 3
        if ex.get("equipment", "") in ["No Equipment", "Dumbbells", "Resistance Bands"]:
            score += 2
        if reps_min >= 15:
            score += 1
    elif "strength" in goal_lower:
        if is_compound:
            score += 4
        if is_low_rep:
            score += 3
        if ex.get("difficulty", "").lower() == "advanced":
            score += 1
    elif "endurance" in goal_lower:
        if is_high_rep:
            score += 3
        if ex.get("equipment", "") == "No Equipment":
            score += 2
        if reps_min >= 15:
            score += 2
    else:  # General Fitness
        if is_compound:
            score += 1
        score += 1

    level_lower = (fitness_level or "beginner").lower()
    if level_lower == "beginner":
        if ex.get("beginner_suitability", True):
            score += 2
        if ex.get("difficulty", "").lower() == "advanced":
            score -= 3
    elif level_lower == "advanced":
        if ex.get("difficulty", "").lower() == "advanced":
            score += 2
        if ex.get("difficulty", "").lower() == "beginner":
            score -= 1

    return score


def _get_allowed_equipment(equipment_names, workout_environment=None):
    """Build the set of allowed equipment based on user's equipment list and environment."""
    if equipment_names is None:
        equipment_names = []
    elif isinstance(equipment_names, str):
        equipment_names = [equipment_names]

    env_lower = (workout_environment or "gym").lower()
    allowed = {"No Equipment"}

    if "home" in env_lower and "gym" not in env_lower:
        allowed.update(["Dumbbells", "Resistance Bands"])
    elif "gym" in env_lower:
        allowed.update(["Dumbbells", "Resistance Bands", "Full Gym", "Barbell",
                         "Cable Machine", "Pull-up Bar", "Kettlebell", "Smith Machine"])

    for eq in equipment_names:
        eq = (eq or "").strip()
        if not eq:
            continue
        allowed.add(eq)
        if eq in ["Home Equipment", "Dumbbells", "Dumbbell"]:
            allowed.update(["Dumbbells", "Resistance Bands"])
        elif eq in ["Full Gym", "Gym"]:
            allowed.update(["Dumbbells", "Resistance Bands", "Full Gym", "Barbell",
                             "Cable Machine", "Pull-up Bar", "Kettlebell", "Smith Machine"])
        elif eq == "Resistance Bands":
            allowed.add("Resistance Bands")
        elif eq == "Kettlebell":
            allowed.add("Kettlebell")

    return allowed


def _estimate_duration(exercises, time_per_set=45):
    """Estimate total workout duration in minutes from exercises list."""
    if not exercises:
        return 0
    total_seconds = 0
    for ex in exercises:
        sets = ex.get("sets", 3)
        rest = ex.get("rest_seconds", 60)
        total_seconds += (sets * time_per_set) + (sets * rest)
    total_seconds += 300  # warm-up / cool-down buffer
    return max(15, round(total_seconds / 60))


def generate_weekly_workout(profile, equipment_names, all_exercises):
    """
    Generate weekly workout plan split based on profile parameters.
    Returns list of dicts:
    [{'day_name': 'Monday', 'day_number': 1, 'focus': 'Chest + Triceps',
      'is_rest_day': False, 'duration_minutes': 45, 'exercises': [...]}]
    """
    if not all_exercises:
        return []

    goal = getattr(profile, 'fitness_goal', 'General Fitness') or 'General Fitness'
    fitness_level = getattr(profile, 'fitness_level', 'Beginner') or 'Beginner'
    workout_environment = getattr(profile, 'workout_environment', 'Gym') or 'Gym'

    allowed_equipments = _get_allowed_equipment(equipment_names, workout_environment)

    days_count = getattr(profile, 'workout_days_per_week', 4) or 4
    try:
        days_count = int(days_count)
    except (ValueError, TypeError):
        days_count = 4

    goal_lower = goal.lower()
    is_strength = "strength" in goal_lower
    is_endurance = "endurance" in goal_lower
    is_fat_loss = "fat loss" in goal_lower or "weight loss" in goal_lower

    if days_count <= 3:
        if is_strength:
            splits = [
                ("Monday", "Lower Body + Core"),
                ("Tuesday", "Rest Day"),
                ("Wednesday", "Upper Body Push"),
                ("Thursday", "Rest Day"),
                ("Friday", "Upper Body Pull"),
                ("Saturday", "Rest Day"),
                ("Sunday", "Rest Day")
            ]
        elif is_fat_loss:
            splits = [
                ("Monday", "Full Body Circuit"),
                ("Tuesday", "Rest Day"),
                ("Wednesday", "Full Body Circuit"),
                ("Thursday", "Rest Day"),
                ("Friday", "Full Body Circuit"),
                ("Saturday", "Rest Day"),
                ("Sunday", "Rest Day")
            ]
        else:
            splits = [
                ("Monday", "Chest + Triceps"),
                ("Tuesday", "Rest Day"),
                ("Wednesday", "Back + Biceps"),
                ("Thursday", "Rest Day"),
                ("Friday", "Legs + Shoulders"),
                ("Saturday", "Rest Day"),
                ("Sunday", "Rest Day")
            ]
    elif days_count == 4:
        splits = [
            ("Monday", "Chest + Triceps"),
            ("Tuesday", "Back + Biceps"),
            ("Wednesday", "Rest Day"),
            ("Thursday", "Legs + Core"),
            ("Friday", "Shoulders + Core"),
            ("Saturday", "Rest Day"),
            ("Sunday", "Rest Day")
        ]
    elif days_count == 5:
        if is_strength:
            splits = [
                ("Monday", "Lower Body"),
                ("Tuesday", "Upper Body Push"),
                ("Wednesday", "Upper Body Pull"),
                ("Thursday", "Rest Day"),
                ("Friday", "Lower Body"),
                ("Saturday", "Full Body"),
                ("Sunday", "Rest Day")
            ]
        elif is_fat_loss:
            splits = [
                ("Monday", "Full Body Circuit"),
                ("Tuesday", "Legs + Core"),
                ("Wednesday", "Upper Body Circuit"),
                ("Thursday", "Rest Day"),
                ("Friday", "Full Body Circuit"),
                ("Saturday", "Shoulders + Core"),
                ("Sunday", "Rest Day")
            ]
        else:
            splits = [
                ("Monday", "Chest + Triceps"),
                ("Tuesday", "Back + Biceps"),
                ("Wednesday", "Legs + Core"),
                ("Thursday", "Rest Day"),
                ("Friday", "Shoulders + Core"),
                ("Saturday", "Full Body"),
                ("Sunday", "Rest Day")
            ]
    else:  # 6 or 7 days
        splits = [
            ("Monday", "Chest + Triceps"),
            ("Tuesday", "Back + Biceps"),
            ("Wednesday", "Legs + Core"),
            ("Thursday", "Shoulders + Core"),
            ("Friday", "Arms + Core"),
            ("Saturday", "Full Body"),
            ("Sunday", "Rest Day" if days_count == 6 else "Active Recovery")
        ]

    dur = getattr(profile, 'workout_duration_mins', 45) or 45
    try:
        dur = int(dur)
    except (ValueError, TypeError):
        dur = 45

    if dur <= 30:
        exercises_per_muscle = 2
    elif dur <= 50:
        exercises_per_muscle = 3
    else:
        exercises_per_muscle = 4

    weekly_plan = []
    day_numbers = {"Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4,
                   "Friday": 5, "Saturday": 6, "Sunday": 7}

    muscle_group_expander = {
        "arms": ["biceps", "triceps", "forearms"],
        "legs": ["legs", "quadriceps", "hamstrings", "glutes", "calves"],
        "core": ["core", "abs", "obliques"],
        "lower body": ["legs", "quadriceps", "hamstrings", "glutes", "calves"],
        "upper body push": ["chest", "shoulders", "triceps"],
        "upper body pull": ["back", "biceps"],
        "upper body circuit": ["chest", "back", "shoulders", "biceps", "triceps"],
        "full body": ["chest", "back", "legs", "shoulders", "biceps", "triceps"],
        "full body circuit": ["chest", "back", "legs", "shoulders", "core"],
        "active recovery": ["legs", "core"],
        "cardio": ["legs", "core"]
    }

    for day_name, focus in splits:
        is_rest = "Rest Day" in focus or "Active Recovery" in focus
        day_data = {
            "day_name": day_name,
            "day_number": day_numbers.get(day_name, 1),
            "focus": focus,
            "is_rest_day": is_rest,
            "duration_minutes": 0,
            "exercises": []
        }
        weekly_plan.append(day_data)

        if is_rest:
            continue

        raw_muscles = [m.strip().lower() for m in focus.replace(" / ", "+").split("+")]
        target_categories = []
        for rm in raw_muscles:
            if rm in muscle_group_expander:
                target_categories.extend(muscle_group_expander[rm])
            else:
                target_categories.append(rm)

        order = 0
        added_exercise_ids = set()

        for muscle in target_categories:
            suitable_exercises = []
            for ex in all_exercises:
                if ex["id"] in added_exercise_ids:
                    continue

                ex_cat = ex["category"].lower()
                ex_prim = ex.get("primary_muscle", "").lower()
                ex_sec = [s.lower() for s in ex.get("secondary_muscles", [])]

                muscle_match = (ex_cat == muscle or ex_prim == muscle or muscle in ex_sec)
                if not muscle_match:
                    continue

                ex_equip = ex.get("equipment", "No Equipment")
                equip_ok = (ex_equip in allowed_equipments or
                            ex_equip == "No Equipment" or
                            "Full Gym" in allowed_equipments)

                base_score = 0
                if equip_ok:
                    base_score += 5
                else:
                    env_lower = workout_environment.lower()
                    if "home" in env_lower and "gym" not in env_lower:
                        continue

                goal_score = _score_exercise_for_goal(ex, goal, fitness_level)
                total_score = base_score + goal_score
                suitable_exercises.append((ex, total_score))

            suitable_exercises.sort(key=lambda x: x[1], reverse=True)
            chosen_list = [item[0] for item in suitable_exercises[:exercises_per_muscle]]

            for ex in chosen_list:
                added_exercise_ids.add(ex["id"])

                sets_val = ex.get("default_sets", 3)
                try:
                    sets_val = int(sets_val)
                except (ValueError, TypeError):
                    sets_val = 3

                level_lower = fitness_level.lower()
                if level_lower == "beginner":
                    sets_val = max(2, sets_val - 1)
                elif level_lower == "advanced":
                    sets_val = sets_val + 1

                if "strength" in goal_lower and sets_val < 5:
                    sets_val = min(6, sets_val + 1)
                elif "fat loss" in goal_lower:
                    sets_val = max(3, sets_val)

                reps = str(ex.get("default_reps", "10-12"))
                reps_min, reps_max = parse_reps_range(reps)

                rest_val = ex.get("default_rest", 60)
                try:
                    rest_val = int(rest_val)
                except (ValueError, TypeError):
                    rest_val = 60

                if "strength" in goal_lower:
                    rest_val = max(120, rest_val)
                elif "fat loss" in goal_lower or "endurance" in goal_lower:
                    rest_val = min(60, rest_val)

                inst_str = ex["instructions"] if isinstance(ex["instructions"], str) else "\n".join(ex.get("instructions", []))
                mistakes_str = ex.get("common_mistakes", "")
                if isinstance(mistakes_str, list):
                    mistakes_str = "\n".join(mistakes_str)

                ex_data = {
                    "exercise_id": int(ex["id"]),
                    "name": ex["name"],
                    "category": ex["category"],
                    "primary_muscle": ex.get("primary_muscle", ex["category"]),
                    "secondary_muscles": ex.get("secondary_muscles", []),
                    "equipment": ex.get("equipment", "No Equipment"),
                    "difficulty": ex.get("difficulty", "Beginner"),
                    "sets": int(sets_val),
                    "reps": reps,
                    "reps_min": int(reps_min),
                    "reps_max": int(reps_max),
                    "rest_seconds": int(rest_val),
                    "instructions": inst_str,
                    "start_pos": ex.get("start_pos"),
                    "movement": ex.get("movement"),
                    "end_pos": ex.get("end_pos"),
                    "common_mistakes": mistakes_str,
                    "safety_notes": ex.get("safety_notes", ""),
                    "media_path": ex.get("media_path", "/static/exercises/fallback_demo.svg"),
                    "supported_demo": ex.get("supported_demo", False),
                    "slug": ex.get("slug", ex["name"].lower().replace(" ", "_").replace("-", "_")),
                    "alternatives": ex.get("alternatives", []),
                    "order_idx": int(order)
                }
                day_data["exercises"].append(ex_data)
                order += 1

        if not day_data["exercises"]:
            fallback_pool = [ex for ex in all_exercises
                             if ex.get("equipment", "No Equipment") in allowed_equipments
                             or ex.get("equipment") == "No Equipment"]
            if not fallback_pool:
                fallback_pool = all_exercises
            fallback_exercises = random.sample(fallback_pool, min(3, len(fallback_pool)))
            for idx, ex in enumerate(fallback_exercises):
                inst_str = ex["instructions"] if isinstance(ex["instructions"], str) else "\n".join(ex.get("instructions", []))
                reps = "10-12"
                reps_min_v, reps_max_v = parse_reps_range(reps)
                day_data["exercises"].append({
                    "exercise_id": int(ex["id"]),
                    "name": ex["name"],
                    "category": ex["category"],
                    "primary_muscle": ex.get("primary_muscle", ex["category"]),
                    "secondary_muscles": ex.get("secondary_muscles", []),
                    "equipment": ex.get("equipment", "No Equipment"),
                    "difficulty": ex.get("difficulty", "Beginner"),
                    "sets": 3,
                    "reps": reps,
                    "reps_min": int(reps_min_v),
                    "reps_max": int(reps_max_v),
                    "rest_seconds": 60,
                    "instructions": inst_str,
                    "start_pos": ex.get("start_pos"),
                    "movement": ex.get("movement"),
                    "end_pos": ex.get("end_pos"),
                    "common_mistakes": "\n".join(ex.get("common_mistakes", [])) if isinstance(ex.get("common_mistakes"), list) else ex.get("common_mistakes", ""),
                    "safety_notes": ex.get("safety_notes", ""),
                    "media_path": ex.get("media_path", "/static/exercises/fallback_demo.svg"),
                    "supported_demo": ex.get("supported_demo", False),
                    "slug": ex.get("slug", ex["name"].lower().replace(" ", "_").replace("-", "_")),
                    "alternatives": ex.get("alternatives", []),
                    "order_idx": int(idx)
                })

        day_data["duration_minutes"] = _estimate_duration(day_data["exercises"])

    return weekly_plan


def find_alternative_exercise(current_ex_category, current_ex_id, equipment_names, all_exercises,
                               goal=None, fitness_level=None, workout_environment=None):
    """
    Find alternative exercise targeting the same muscle group.
    Respects goal, level, and equipment constraints.
    """
    allowed_equipments = _get_allowed_equipment(equipment_names, workout_environment)

    candidates = [
        ex for ex in all_exercises
        if ex["id"] != current_ex_id and (
            ex["category"].lower() == current_ex_category.lower() or
            current_ex_category.lower() in [s.lower() for s in ex.get("secondary_muscles", [])]
        )
    ]

    if not candidates:
        candidates = [ex for ex in all_exercises if ex["id"] != current_ex_id]

    scored = []
    for ex in candidates:
        equip_ok = (ex.get("equipment", "No Equipment") in allowed_equipments or
                    ex.get("equipment") == "No Equipment")
        base = 5 if equip_ok else 0
        goal_score = _score_exercise_for_goal(ex, goal or "General Fitness", fitness_level or "Beginner")
        scored.append((ex, base + goal_score))

    scored.sort(key=lambda x: x[1], reverse=True)

    if scored:
        top = scored[:3]
        return random.choice(top)[0]
    return None
