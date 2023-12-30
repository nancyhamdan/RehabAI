import models


def is_exercise_assigned_to_user(db, user_id, exercise_id):
    # Get the user's assigned exercises
    assigned_exercises = (
        db.query(models.AssignedExercise)
        .filter(models.AssignedExercise.user_id == user_id)
        .all()
    )

    # Check if the chosen exercise is among the exercises assigned to the user
    for assigned_exercise in assigned_exercises:
        if assigned_exercise.exercise_id == exercise_id:
            return True

    return False
