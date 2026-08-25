def rebuild_remaining_week_logic(plan, missed_day_id, exercise_model_class):
    """
    Shifts the missed workout focus and exercises to the next available rest day in the week.
    Returns True if successfully rescheduled, False otherwise.
    """
    missed_day = None
    for day in plan.days:
        if day.id == missed_day_id:
            missed_day = day
            break

    if not missed_day or missed_day.is_rest_day:
        return False

    target_rest_day = None
    days_list = list(plan.days)
    missed_idx = days_list.index(missed_day)

    for i in range(missed_idx + 1, len(days_list)):
        if days_list[i].is_rest_day:
            target_rest_day = days_list[i]
            break

    if not target_rest_day:
        for i in range(0, missed_idx):
            if days_list[i].is_rest_day:
                target_rest_day = days_list[i]
                break

    if target_rest_day:
        target_rest_day.focus = missed_day.focus
        target_rest_day.is_rest_day = False
        target_rest_day.is_completed = False
        target_rest_day.status = "upcoming"

        for ex in missed_day.exercises:
            new_ex = exercise_model_class(
                exercise_id=ex.exercise_id,
                name=ex.name,
                category=ex.category,
                sets=ex.sets,
                reps=ex.reps,
                reps_min=getattr(ex, 'reps_min', 8),
                reps_max=getattr(ex, 'reps_max', 12),
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

        missed_day.focus = "Rest Day (Missed Workout Shifted)"
        missed_day.is_rest_day = True
        missed_day.exercises.clear()
        missed_day.is_completed = True
        missed_day.status = "missed"
        return True

    return False


def move_workout_logic(plan, from_day_id, to_day_id, exercise_model_class):
    """
    Moves workout from one day to another.
    Validates: from_day must not be completed, to_day must not be completed.
    Swaps or assigns the workout to the target day.
    Returns (True, message) or (False, error_message).
    """
    from_day = None
    to_day = None
    for day in plan.days:
        if day.id == from_day_id:
            from_day = day
        if day.id == to_day_id:
            to_day = day

    if not from_day:
        return False, "Source day not found."
    if not to_day:
        return False, "Target day not found."
    if from_day.is_completed:
        return False, "Cannot move a workout that has already been completed."
    if to_day.is_completed:
        return False, "Cannot move to a day that has already been completed."
    if from_day_id == to_day_id:
        return False, "Source and target day are the same."

    # Save from_day info
    from_focus = from_day.focus
    from_exercises = list(from_day.exercises)

    # Save to_day info (if it has a workout, we swap)
    to_focus = to_day.focus
    to_exercises = list(to_day.exercises)
    to_was_rest = to_day.is_rest_day

    # Move from_day's workout to to_day
    to_day.focus = from_focus
    to_day.is_rest_day = False
    to_day.is_completed = False
    to_day.status = "upcoming"
    to_day.exercises.clear()

    for ex in from_exercises:
        new_ex = exercise_model_class(
            exercise_id=ex.exercise_id,
            name=ex.name,
            category=ex.category,
            sets=ex.sets,
            reps=ex.reps,
            reps_min=getattr(ex, 'reps_min', 8),
            reps_max=getattr(ex, 'reps_max', 12),
            rest_seconds=ex.rest_seconds,
            instructions=ex.instructions,
            start_pos=ex.start_pos,
            movement=ex.movement,
            end_pos=ex.end_pos,
            common_mistakes=ex.common_mistakes,
            is_completed=False,
            order_idx=ex.order_idx
        )
        to_day.exercises.append(new_ex)

    # Make from_day a rest day (or assign to_day's old workout if it existed)
    if to_was_rest:
        from_day.focus = "Rest Day"
        from_day.is_rest_day = True
        from_day.exercises.clear()
        from_day.status = "rest"
    else:
        # Swap — put to_day's workout into from_day
        from_day.focus = to_focus
        from_day.is_rest_day = False
        from_day.is_completed = False
        from_day.status = "upcoming"
        from_day.exercises.clear()

        for ex in to_exercises:
            new_ex = exercise_model_class(
                exercise_id=ex.exercise_id,
                name=ex.name,
                category=ex.category,
                sets=ex.sets,
                reps=ex.reps,
                reps_min=getattr(ex, 'reps_min', 8),
                reps_max=getattr(ex, 'reps_max', 12),
                rest_seconds=ex.rest_seconds,
                instructions=ex.instructions,
                start_pos=ex.start_pos,
                movement=ex.movement,
                end_pos=ex.end_pos,
                common_mistakes=ex.common_mistakes,
                is_completed=False,
                order_idx=ex.order_idx
            )
            from_day.exercises.append(new_ex)

    return True, f"Workout moved from {from_day.day_name} to {to_day.day_name}."


def skip_workout_logic(plan, day_id):
    """
    Marks a workout day as explicitly skipped.
    Returns (True, message) or (False, error_message).
    """
    skip_day = None
    for day in plan.days:
        if day.id == day_id:
            skip_day = day
            break

    if not skip_day:
        return False, "Day not found."
    if skip_day.is_rest_day:
        return False, "This is already a rest day."
    if skip_day.is_completed:
        return False, "This workout has already been completed."

    original_focus = skip_day.focus
    skip_day.focus = f"Skipped: {original_focus}"
    skip_day.status = "skipped"
    skip_day.is_completed = True  # Mark as done (skipped = done, but not completed)
    skip_day.exercises.clear()

    return True, f"Workout '{original_focus}' on {skip_day.day_name} has been skipped."
