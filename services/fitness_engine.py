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

    scored.sort(key=lambda x: x[1], reverse=True)

    if scored:
        top = scored[:3]
        return random.choice(top)[0]
    return None


def switch_today_focus(plan, today_day_name, new_focus, user_profile, equipments, all_exercises, db_session, WorkoutDayModel, WorkoutExerciseModel):
    """
    Switches today's workout focus dynamically and rebalances the rest of the week
    to avoid consecutive high-fatigue training on the same muscle group.
    """
    today_day = None
    for d in plan.days:
        if d.day_name.lower() == today_day_name.lower():
            today_day = d
            break

    if not today_day:
        return False, "Today's workout day not found in plan.", None

    orig_focus = today_day.focus

    # Select exercises for new focus
    allowed_eq = _get_allowed_equipment([eq.equipment_name for eq in equipments] if equipments else [], user_profile.workout_environment)
    matching = [
        ex for ex in all_exercises
        if new_focus.lower() in ex["category"].lower() or
        any(new_focus.lower() in sec.lower() for sec in ex.get("secondary_muscles", []))
    ]
    if not matching:
        matching = [ex for ex in all_exercises if ex.get("equipment", "No Equipment") in allowed_eq]

    matching = matching[:5]

    # Update today's workout
    today_day.focus = new_focus
    today_day.is_rest_day = False
    today_day.status = "upcoming"
    today_day.exercises.clear()
    db_session.commit()

    for idx, ex in enumerate(matching):
        inst_str = ex["instructions"] if isinstance(ex["instructions"], str) else "\n".join(ex.get("instructions", []))
        reps_min_v, reps_max_v = parse_reps_range(ex.get("default_reps", "10-12"))
        w_ex = WorkoutExerciseModel(
            workout_day_id=today_day.id,
            exercise_id=int(ex["id"]),
            name=ex["name"],
            category=ex["category"],
            sets=int(ex.get("default_sets", 3)),
            reps=str(ex.get("default_reps", "10-12")),
            reps_min=int(reps_min_v),
            reps_max=int(reps_max_v),
            rest_seconds=int(ex.get("default_rest", 60)),
            instructions=inst_str,
            start_pos=ex.get("start_pos"),
            movement=ex.get("movement"),
            end_pos=ex.get("end_pos"),
            common_mistakes="\n".join(ex.get("common_mistakes", [])) if isinstance(ex.get("common_mistakes"), list) else ex.get("common_mistakes", ""),
            is_completed=False,
            order_idx=idx
        )
        db_session.add(w_ex)

    # Rebalance future days: if another day in the plan had `new_focus`, swap it with `orig_focus`
    for d in plan.days:
        if d.id != today_day.id and d.focus.lower() == new_focus.lower():
            if orig_focus and "rest" not in orig_focus.lower():
                d.focus = orig_focus
            else:
                d.focus = "Rest Day"
                d.is_rest_day = True
                d.exercises.clear()

    db_session.commit()
    return True, f"Successfully switched today's workout to {new_focus}.", orig_focus


EXACT_TODAYS_WORKOUT_OPTIONS = {
    "chest_only": {"title": "Chest Only", "groups": ["chest"], "combined": False},
    "chest_triceps": {"title": "Chest + Triceps", "groups": ["chest", "triceps"], "combined": True},
    "triceps_only": {"title": "Triceps Only", "groups": ["triceps"], "combined": False},
    "back_only": {"title": "Back Only", "groups": ["back"], "combined": False},
    "back_biceps": {"title": "Back + Biceps", "groups": ["back", "biceps"], "combined": True},
    "biceps_only": {"title": "Biceps Only", "groups": ["biceps"], "combined": False},
    "legs_only": {"title": "Legs Only", "groups": ["legs"], "combined": False},
    "legs_shoulders": {"title": "Legs + Shoulders", "groups": ["legs", "shoulders"], "combined": True},
    "shoulders_only": {"title": "Shoulders Only", "groups": ["shoulders"], "combined": False},
    "cardio": {"title": "Cardio", "groups": ["cardio"], "combined": False, "is_cardio": True}
}

def _normalize_option_key(focus_str):
    s = (focus_str or "").strip().lower().replace(" + ", "_").replace(" ", "_").replace("-", "_")
    if s in EXACT_TODAYS_WORKOUT_OPTIONS:
        return s
    for key, cfg in EXACT_TODAYS_WORKOUT_OPTIONS.items():
        if key == s or cfg["title"].lower() == focus_str.strip().lower() or key.replace("_only", "") == s:
            return key
    return "chest_only"

def _matches_muscle_group(ex, group_name):
    g = group_name.lower().strip()
    cat = (ex.get("category") or "").lower().strip()
    ex_name = (ex.get("name") or "").lower().strip()

    primary_list = ex.get("primary_muscles", [])
    if isinstance(primary_list, str):
        try:
            import json
            primary_list = json.loads(primary_list)
        except:
            primary_list = [primary_list]
    primary_str = " ".join([str(p).lower() for p in primary_list])

    if g == "chest":
        return cat == "chest" or any(w in primary_str for w in ["chest", "pectoral", "pectoralis"])
    elif g == "triceps":
        return cat == "triceps" or any(w in primary_str for w in ["triceps", "tricep"])
    elif g == "back":
        return cat == "back" or any(w in primary_str for w in ["back", "lat", "latissimus", "rhomboid", "trapezius"])
    elif g == "biceps":
        return cat == "biceps" or any(w in primary_str for w in ["biceps", "bicep", "brachialis"])
    elif g == "legs":
        return cat in ["legs", "quadriceps", "quads", "hamstrings", "glutes", "calves"] or any(w in primary_str for w in ["quad", "quadriceps", "hamstring", "glute", "calf", "calves", "thigh"])
    elif g == "shoulders":
        return cat in ["shoulders", "deltoids"] or any(w in primary_str for w in ["shoulder", "deltoid", "deltoids"])
    elif g == "cardio":
        return cat == "cardio" or "cardio" in primary_str
    return False

def filter_exercises_for_focus(all_exercises, focus_str, allowed_equipment=None):
    """
    Selects exercises specifically targeting the chosen single muscle, combined split, or cardio.
    Strictly respects muscle classification and primary targets.
    """
    opt_key = _normalize_option_key(focus_str)
    cfg = EXACT_TODAYS_WORKOUT_OPTIONS.get(opt_key, EXACT_TODAYS_WORKOUT_OPTIONS["chest_only"])
    groups = cfg["groups"]

    matching = []
    for ex in all_exercises:
        ex_eq = ex.get("equipment", "No Equipment")
        if allowed_equipment and ex_eq not in allowed_equipment and "No Equipment" not in allowed_equipment:
            continue

        if any(_matches_muscle_group(ex, g) for g in groups):
            matching.append(ex)

    if not matching and allowed_equipment:
        # Retry without equipment constraint if empty
        for ex in all_exercises:
            if any(_matches_muscle_group(ex, g) for g in groups):
                matching.append(ex)

    # Deduplicate while preserving order
    seen = set()
    deduped = []
    for ex in matching:
        ex_id = ex.get("id") or ex.get("name")
        if ex_id not in seen:
            seen.add(ex_id)
            deduped.append(ex)

    return deduped


def generate_custom_today_workout(plan, today_day_name, focus_str, duration_mins, env_override, user_profile, equipments, all_exercises, db_session, WorkoutDayModel, WorkoutExerciseModel):
    """
    Dynamically generates today's workout for one of the EXACT 10 workout selections:
    1. Chest Only
    2. Chest + Triceps
    3. Triceps Only
    4. Back Only
    5. Back + Biceps
    6. Biceps Only
    7. Legs Only
    8. Legs + Shoulders
    9. Shoulders Only
    10. Cardio
    """
    opt_key = _normalize_option_key(focus_str)
    cfg = EXACT_TODAYS_WORKOUT_OPTIONS.get(opt_key, EXACT_TODAYS_WORKOUT_OPTIONS["chest_only"])
    raw_str = (focus_str or "").strip()
    if raw_str.lower() in [cfg["title"].lower(), opt_key]:
        canonical_title = cfg["title"]
    else:
        canonical_title = raw_str.title()

    today_day = WorkoutDayModel.query.filter_by(workout_plan_id=plan.id, day_name=today_day_name).first()
    if not today_day:
        for d in plan.days:
            if d.day_name.lower() == today_day_name.lower():
                today_day = d
                break

    if not today_day:
        today_day = WorkoutDayModel(
            workout_plan_id=plan.id,
            day_name=today_day_name,
            day_number=1,
            focus=canonical_title,
            duration_minutes=int(duration_mins or 45),
            is_rest_day=False,
            status="upcoming"
        )
        db_session.add(today_day)
        db_session.commit()

    target_env = env_override or user_profile.workout_environment or "Gym"
    allowed_eq = _get_allowed_equipment([eq.equipment_name for eq in equipments] if equipments else [], target_env)

    mins = int(duration_mins) if duration_mins else 45
    if mins <= 20:
        count = 3
        default_sets = 3
    elif mins <= 35:
        count = 4
        default_sets = 3
    elif mins <= 50:
        count = 5
        default_sets = 4
    else:
        count = 6
        default_sets = 4

    selected_exercises = []
    groups = cfg["groups"]

    if cfg.get("combined") and len(groups) == 2:
        g1, g2 = groups[0], groups[1]
        c1 = [ex for ex in all_exercises if _matches_muscle_group(ex, g1) and (not allowed_eq or ex.get("equipment") in allowed_eq or ex.get("equipment") == "No Equipment")]
        if not c1:
            c1 = [ex for ex in all_exercises if _matches_muscle_group(ex, g1)]
        
        c2 = [ex for ex in all_exercises if _matches_muscle_group(ex, g2) and (not allowed_eq or ex.get("equipment") in allowed_eq or ex.get("equipment") == "No Equipment")]
        if not c2:
            c2 = [ex for ex in all_exercises if _matches_muscle_group(ex, g2)]

        count_g1 = (count + 1) // 2
        count_g2 = count - count_g1

        seen_ids = set()
        for ex in c1[:count_g1]:
            ex_id = ex.get("id") or ex.get("name")
            if ex_id not in seen_ids:
                seen_ids.add(ex_id)
                selected_exercises.append(ex)

        for ex in c2[:count_g2]:
            ex_id = ex.get("id") or ex.get("name")
            if ex_id not in seen_ids:
                seen_ids.add(ex_id)
                selected_exercises.append(ex)
    else:
        g = groups[0]
        candidates = [ex for ex in all_exercises if _matches_muscle_group(ex, g) and (not allowed_eq or ex.get("equipment") in allowed_eq or ex.get("equipment") == "No Equipment")]
        if not candidates:
            candidates = [ex for ex in all_exercises if _matches_muscle_group(ex, g)]
        
        seen_ids = set()
        for ex in candidates[:count]:
            ex_id = ex.get("id") or ex.get("name")
            if ex_id not in seen_ids:
                seen_ids.add(ex_id)
                selected_exercises.append(ex)

    status_msg = f"Successfully generated custom {canonical_title} workout ({mins} mins)."
    if not selected_exercises:
        status_msg = f"Not enough exercises are currently available for {canonical_title}."

    today_day.focus = canonical_title
    today_day.is_rest_day = False
    today_day.status = "upcoming"
    today_day.duration_minutes = mins
    today_day.exercises.clear()
    db_session.commit()

    created_exercises_data = []

    for idx, ex in enumerate(selected_exercises):
        inst_str = ex["instructions"] if isinstance(ex["instructions"], str) else "\n".join(ex.get("instructions", []))
        reps_min_v, reps_max_v = parse_reps_range(ex.get("default_reps", "10-12"))
        
        w_ex = WorkoutExerciseModel(
            workout_day_id=today_day.id,
            exercise_id=int(ex["id"]),
            name=ex["name"],
            category=ex.get("category", "General"),
            sets=int(ex.get("default_sets", default_sets)),
            reps=str(ex.get("default_reps", "10-12")),
            reps_min=int(reps_min_v),
            reps_max=int(reps_max_v),
            rest_seconds=int(ex.get("default_rest", 60)),
            instructions=inst_str,
            start_pos=ex.get("start_pos"),
            movement=ex.get("movement"),
            end_pos=ex.get("end_pos"),
            common_mistakes="\n".join(ex.get("common_mistakes", [])) if isinstance(ex.get("common_mistakes"), list) else ex.get("common_mistakes", ""),
            is_completed=False,
            order_idx=idx
        )
        db_session.add(w_ex)
        created_exercises_data.append({
            "exercise_id": int(ex["id"]),
            "name": ex["name"],
            "category": ex.get("category", "General"),
            "sets": int(ex.get("default_sets", default_sets)),
            "reps": str(ex.get("default_reps", "10-12")),
            "rest_seconds": int(ex.get("default_rest", 60)),
            "instructions": inst_str
        })

    db_session.commit()
    return True, status_msg, created_exercises_data


def scale_workout_duration(workout_day, target_mins, db_session, WorkoutExerciseModel):
    """Adjusts set counts and exercise list density for 30m, 45m, or 60m targets."""
    workout_day.duration_minutes = target_mins
    ex_list = list(workout_day.exercises)
    
    if target_mins <= 30:
        # Scale to 3-4 key exercises, 3 sets each
        if len(ex_list) > 4:
            for ex in ex_list[4:]:
                db_session.delete(ex)
        for ex in workout_day.exercises:
            ex.sets = 3
    elif target_mins >= 60:
        # Scale to 5-6 exercises, 4 sets each
        for ex in workout_day.exercises:
            ex.sets = 4

    db_session.commit()
    return True


def scale_workout_difficulty(workout_day, direction, db_session):
    """Modifies rep ranges and rest periods to make session easier or harder."""
    for ex in workout_day.exercises:
        if direction == "easier":
            ex.sets = max(2, ex.sets - 1)
            ex.reps_min = max(6, ex.reps_min - 2)
            ex.reps_max = max(8, ex.reps_max - 2)
            ex.reps = f"{ex.reps_min}-{ex.reps_max}"
            ex.rest_seconds = min(120, ex.rest_seconds + 30)
        else:
            ex.sets = min(5, ex.sets + 1)
            ex.reps_min = ex.reps_min + 2
            ex.reps_max = ex.reps_max + 2
            ex.reps = f"{ex.reps_min}-{ex.reps_max}"
            ex.rest_seconds = max(30, ex.rest_seconds - 15)

    db_session.commit()
    return True


