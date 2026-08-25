import random

def generate_weekly_workout(profile, equipment_names, all_exercises):
    """
    Generate weekly workout plan split based on profile parameters.
    Returns list of dicts: [{'day_name': 'Monday', 'focus': 'Chest + Triceps', 'is_rest_day': False, 'exercises': [...]}]
    """
    if not all_exercises:
        return []

    # Determine allowed equipment
    allowed_equipments = {"No Equipment"}
    for eq in equipment_names:
        allowed_equipments.add(eq)
        if eq in ["Home Equipment", "Dumbbells", "Dumbbell"]:
            allowed_equipments.update(["Dumbbells", "Resistance Bands", "No Equipment"])
        elif eq in ["Full Gym", "Gym"]:
            allowed_equipments.update(["Dumbbells", "Resistance Bands", "Full Gym", "No Equipment"])

    # Determine splits based on number of days
    days_count = getattr(profile, 'workout_days_per_week', 4) or 4
    
    if days_count <= 3:
        splits = [
            ("Monday", "Chest + Triceps"),
            ("Tuesday", "Rest Day"),
            ("Wednesday", "Back + Biceps"),
            ("Thursday", "Rest Day"),
            ("Friday", "Legs + Shoulders + Core"),
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
        splits = [
            ("Monday", "Chest + Triceps"),
            ("Tuesday", "Back + Biceps"),
            ("Wednesday", "Legs + Core"),
            ("Thursday", "Rest Day"),
            ("Friday", "Shoulders + Core"),
            ("Saturday", "Full Body"),
            ("Sunday", "Rest Day")
        ]
    else:  # 6+ days
        splits = [
            ("Monday", "Chest + Triceps"),
            ("Tuesday", "Back + Biceps"),
            ("Wednesday", "Legs + Core"),
            ("Thursday", "Shoulders + Core"),
            ("Friday", "Biceps + Triceps"),
            ("Saturday", "Full Body"),
            ("Sunday", "Rest Day")
        ]

    # Calculate exercises per focus group based on duration
    dur = getattr(profile, 'workout_duration_mins', 45) or 45
    if dur <= 30:
        exercises_per_muscle = 2
    elif dur <= 50:
        exercises_per_muscle = 3
    else:
        exercises_per_muscle = 4

    weekly_plan = []

    # Target muscle group mapper
    muscle_group_expander = {
        "arms": ["biceps", "triceps", "forearms"],
        "legs": ["legs", "quadriceps", "hamstrings", "glutes", "calves"],
        "core": ["core", "abs", "obliques"],
        "full body": ["chest", "back", "legs", "shoulders", "biceps", "triceps"],
        "full body / cardio": ["chest", "back", "legs", "shoulders", "biceps", "triceps"],
        "cardio": ["legs", "core"]
    }

    for day_name, focus in splits:
        is_rest = "Rest Day" in focus
        day_data = {
            "day_name": day_name,
            "focus": focus,
            "is_rest_day": is_rest,
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

                # Muscle match
                muscle_match = (ex_cat == muscle or ex_prim == muscle or muscle in ex_sec)
                if not muscle_match:
                    continue

                # Equipment match
                equip_match = ex.get("equipment") in allowed_equipments or "No Equipment" in allowed_equipments
                
                score = 0
                if equip_match:
                    score += 5
                if getattr(profile, 'fitness_level', 'Beginner') == "Beginner" and ex.get("beginner_suitability", True):
                    score += 2
                elif getattr(profile, 'fitness_level', 'Beginner') == "Advanced" and not ex.get("beginner_suitability", True):
                    score += 1

                suitable_exercises.append((ex, score))

            suitable_exercises.sort(key=lambda x: x[1], reverse=True)
            chosen_list = [item[0] for item in suitable_exercises[:exercises_per_muscle]]

            for ex in chosen_list:
                added_exercise_ids.add(ex["id"])
                sets = ex.get("default_sets", 3)
                reps = str(ex.get("default_reps", "10-12"))
                
                if getattr(profile, 'fitness_level', 'Beginner') == "Beginner":
                    sets = max(2, sets - 1)
                elif getattr(profile, 'fitness_level', 'Beginner') == "Advanced":
                    sets = sets + 1

                inst_str = ex["instructions"] if isinstance(ex["instructions"], str) else "\n".join(ex.get("instructions", []))
                mistakes_str = ex.get("common_mistakes", "")
                if isinstance(mistakes_str, list):
                    mistakes_str = "\n".join(mistakes_str)

                ex_data = {
                    "exercise_id": ex["id"],
                    "name": ex["name"],
                    "category": ex["category"],
                    "primary_muscle": ex.get("primary_muscle", ex["category"]),
                    "secondary_muscles": ex.get("secondary_muscles", []),
                    "equipment": ex.get("equipment", "Bodyweight"),
                    "sets": sets,
                    "reps": reps,
                    "rest_seconds": ex.get("default_rest", 60),
                    "instructions": inst_str,
                    "start_pos": ex.get("start_pos"),
                    "movement": ex.get("movement"),
                    "end_pos": ex.get("end_pos"),
                    "common_mistakes": mistakes_str,
                    "media_path": ex.get("media_path", "/static/exercises/fallback_demo.svg"),
                    "order_idx": order
                }
                day_data["exercises"].append(ex_data)
                order += 1

        # Fallback if non-rest day ended up with 0 exercises
        if not day_data["exercises"]:
            fallback_exercises = random.sample(all_exercises, min(3, len(all_exercises)))
            for idx, ex in enumerate(fallback_exercises):
                inst_str = ex["instructions"] if isinstance(ex["instructions"], str) else "\n".join(ex.get("instructions", []))
                day_data["exercises"].append({
                    "exercise_id": ex["id"],
                    "name": ex["name"],
                    "category": ex["category"],
                    "primary_muscle": ex.get("primary_muscle", ex["category"]),
                    "secondary_muscles": ex.get("secondary_muscles", []),
                    "equipment": ex.get("equipment", "Bodyweight"),
                    "sets": 3,
                    "reps": "10-12",
                    "rest_seconds": 60,
                    "instructions": inst_str,
                    "start_pos": ex.get("start_pos"),
                    "movement": ex.get("movement"),
                    "end_pos": ex.get("end_pos"),
                    "common_mistakes": "\n".join(ex.get("common_mistakes", [])) if isinstance(ex.get("common_mistakes"), list) else ex.get("common_mistakes", ""),
                    "media_path": ex.get("media_path", "/static/exercises/fallback_demo.svg"),
                    "order_idx": idx
                })

    return weekly_plan


def find_alternative_exercise(current_ex_category, current_ex_id, equipment_names, all_exercises):
    """
    Find alternative exercise targeting the same muscle group.
    """
    allowed_equipments = {"No Equipment"}
    for eq in equipment_names:
        allowed_equipments.add(eq)
        if eq in ["Home Equipment", "Dumbbells", "Dumbbell"]:
            allowed_equipments.update(["Dumbbells", "Resistance Bands", "No Equipment"])
        elif eq in ["Full Gym", "Gym"]:
            allowed_equipments.update(["Dumbbells", "Resistance Bands", "Full Gym", "No Equipment"])

    candidates = [
        ex for ex in all_exercises
        if ex["id"] != current_ex_id and (
            ex["category"].lower() == current_ex_category.lower() or
            current_ex_category.lower() in [s.lower() for s in ex.get("secondary_muscles", [])]
        )
    ]

    if not candidates:
        candidates = [ex for ex in all_exercises if ex["id"] != current_ex_id]

    if candidates:
        return random.choice(candidates)
    return None
