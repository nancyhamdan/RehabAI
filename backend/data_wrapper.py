from sqlalchemy import exists
from database import SessionLocal, Base, engine
from models import Exercise


def get_exercises_data():
    """Exercise Table [Database needs to be created first]"""
    exercises_data = [
        {
            "id": "1",
            "exercise_id": "Es1",
            "name": "Exercise 1",
            "description": "....",
            "image_url": "/E_ID15_Es1.png",
            "video_url": "/E_ID15_Es1.mp4",
            "csv": "/E_ID15_Es1.csv",
        },
        {
            "id": "2",
            "exercise_id": "Es2",
            "name": "Exercise 2",
            "description": "....",
            "image_url": "/E_ID12_Es2.png",
            "video_url": "/E_ID12_Es2.mp4",
            "csv": "/E_ID12_Es2.csv",
        },
        {
            "id": "3",
            "exercise_id": "Es3",
            "name": "Exercise 3",
            "description": "....",
            "image_url": "/E_ID12_Es3.png",
            "video_url": "/E_ID12_Es3.mp4",
            "csv": "/E_ID12_Es3.csv",
        },
        {
            "id": "4",
            "exercise_id": "Es4",
            "name": "Exercise 4",
            "description": "....",
            "image_url": "/E_ID1_Es4.png",
            "video_url": "/E_ID1_Es4.mp4",
            "csv": "/E_ID1_Es4.csv",
        },
        {
            "id": "5",
            "exercise_id": "Es5",
            "name": "Exercise 5",
            "description": "....",
            "image_url": "/E_ID1_Es5.png",
            "video_url": "/E_ID1_Es5.mp4",
            "csv": "/E_ID1_Es5.csv",
        },
    ]
    return exercises_data


def initialize_db():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)

    # Start a new session
    session = SessionLocal()

    # Get the exercises data
    exercises_data = get_exercises_data()

    for exercise_data in exercises_data:
        # Check if the exercise already exists
        exercise_exists = session.query(
            exists().where(Exercise.exercise_id == exercise_data["exercise_id"])
        ).scalar()

        # If the exercise does not exist, add it to the database
        if not exercise_exists:
            exercise = Exercise(**exercise_data)
            session.add(exercise)

    # Commit the session
    session.commit()

    # Close the session
    session.close()


if __name__ == "__main__":
    initialize_db()
