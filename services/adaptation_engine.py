def rebuild_remaining_week_logic(plan, missed_day_id, exercise_model_class):
    """
    Shifts the missed workout focus and exercises to the next available rest day in the week.
    Returns True if successfully rescheduled, False otherwise.
    """
    # Find the missed day
    missed_day = None
    for day in plan.days:
        if day.id == missed_day_id:
            missed_day = day
            break

    if not missed_day or missed_day.is_rest_day:
        return False

    # Shift this missed day's focus to the next available Rest Day in the week
    target_rest_day = None
    days_list = list(plan.days)
    missed_idx = days_list.index(missed_day)

    # Search for the next rest day chronologically
    for i in range(missed_idx + 1, len(days_list)):
        if days_list[i].is_rest_day:
            target_rest_day = days_list[i]
            break

    # If no rest day later in the week, rotate to find one earlier
    if not target_rest_day:
        for i in range(0, missed_idx):
            if days_list[i].is_rest_day:
                target_rest_day = days_list[i]
                break

    if target_rest_day:
        # Swap the schedules!
        # Make the target rest day a workout day with the missed exercises
        target_rest_day.focus = missed_day.focus
        target_rest_day.is_rest_day = False
        target_rest_day.is_completed = False
        
        # Copy exercises to target day
        for ex in missed_day.exercises:
            new_ex = exercise_model_class(
                exercise_id=ex.exercise_id,
                name=ex.name,
                category=ex.category,
                sets=ex.sets,
                reps=ex.reps,
                rest_seconds=ex.rest_seconds,
                instructions=ex.instructions,
                start_pos=ex.start_pos,
                movement=ex.movement,
                end_pos=ex.end_pos,
                common_mistakes=ex.common_mistakes,
                is_completed=False,
                order_idx=ex.order_idx
            )
            target_rest_day.exercises.append(new_ex)

        # Clear missed day's exercises and mark it as a Rest Day (or marked as skipped)
        missed_day.focus = "Rest Day (Missed Workout Shifted)"
        missed_day.is_rest_day = True
        missed_day.exercises.clear()
        missed_day.is_completed = True
        return True

    return False
