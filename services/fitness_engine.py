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
        if eq == "Home Equipment":
            allowed_equipments.update(["Dumbbells", "Resistance Bands"])
        elif eq == "Full Gym":
            allowed_equipments.update(["Dumbbells", "Resistance Bands", "Full Gym"])

    # Determine splits based on number of days
    days_count = profile.workout_days_per_week
    
    if days_count == 3:
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
            ("Wednesday", "Legs"),
            ("Thursday", "Rest Day"),
            ("Friday", "Shoulders + Core"),
            ("Saturday", "Full Body / Cardio"),
            ("Sunday", "Rest Day")
        ]
    else:  # 6 days
        splits = [
            ("Monday", "Chest + Triceps"),
            ("Tuesday", "Back + Biceps"),
            ("Wednesday", "Legs"),
            ("Thursday", "Shoulders + Core"),
            ("Friday", "Arms + Core"),
            ("Saturday", "Full Body / Cardio"),
            ("Sunday", "Rest Day")
        ]

    # Calculate exercises per focus group based on duration
    dur = profile.workout_duration_mins
    if dur <= 30:
        exercises_per_muscle = 2
    elif dur <= 50:
        exercises_per_muscle = 3
    else:
        exercises_per_muscle = 4

    weekly_plan = []

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

        muscles = [m.strip() for m in focus.split("+")]
        order = 0
        
        for muscle in muscles:
            suitable_exercises = []
            for ex in all_exercises:
                # category check
                if ex["category"].lower() != muscle.lower() and muscle.lower() not in [m.lower() for m in ex.get("secondary_muscles", [])]:
                    continue
                # equipment check
                if ex["equipment"] not in allowed_equipments:
                    continue
                
                # Suitability score
                score = 0
                if profile.fitness_level == "Beginner" and ex.get("beginner_suitability", True):
                    score += 2
                elif profile.fitness_level == "Advanced" and not ex.get("beginner_suitability", True):
                    score += 1
                
                suitable_exercises.append((ex, score))

            suitable_exercises.sort(key=lambda x: x[1], reverse=True)
            chosen_list = [item[0] for item in suitable_exercises[:exercises_per_muscle]]

            for ex in chosen_list:
                # Translate difficulty to sets adjustment
                sets = ex["default_sets"]
                reps = ex["default_reps"]
                if profile.fitness_level == "Beginner":
                    sets = max(2, sets - 1)
                elif profile.fitness_level == "Advanced":
                    sets = sets + 1

                ex_data = {
                    "exercise_id": ex["id"],
                    "name": ex["name"],
                    "category": ex["category"],
                    "sets": sets,
                    "reps": reps,
                    "rest_seconds": ex["default_rest"],
                    "instructions": "\n".join(ex["instructions"]),
                    "start_pos": ex.get("start_pos"),
                    "movement": ex.get("movement"),
                    "end_pos": ex.get("end_pos"),
                    "common_mistakes": "\n".join(ex.get("common_mistakes", [])),
                    "order_idx": order
                }
                day_data["exercises"].append(ex_data)
                order += 1

    return weekly_plan


def find_alternative_exercise(current_ex_category, current_ex_id, equipment_names, all_exercises):
    """
    Find alternative exercise targeting the same muscle group.
    """
    allowed_equipments = {"No Equipment"}
    for eq in equipment_names:
        allowed_equipments.add(eq)
        if eq == "Home Equipment":
            allowed_equipments.update(["Dumbbells", "Resistance Bands"])
        elif eq == "Full Gym":
            allowed_equipments.update(["Dumbbells", "Resistance Bands", "Full Gym"])

    # Query matching category, excluding the current ID
    pool = [
        ex for ex in all_exercises 
        if ex["category"].lower() == current_ex_category.lower() 
        and ex["id"] != current_ex_id
        and ex["equipment"] in allowed_equipments
    ]

    if not pool:
        pool = [
            ex for ex in all_exercises
            if current_ex_category.lower() in [m.lower() for m in ex.get("secondary_muscles", [])]
            and ex["id"] != current_ex_id
            and ex["equipment"] in allowed_equipments
        ]

    if not pool:
        pool = [
            ex for ex in all_exercises
            if ex["equipment"] == "No Equipment"
            and ex["id"] != current_ex_id
        ]

    if not pool:
        return None

    return random.choice(pool)
