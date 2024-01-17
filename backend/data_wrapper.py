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
            "image_url": "../public/E_ID15_ES1.png",
            "video_url": "../public/E_ID15_ES1.mp4",
            "csv": "../public/E_ID15_ES1.csv",
        },
        {
            "id": "2",
            "exercise_id": "Es2",
            "name": "Exercise 2",
            "description": "....",
            "image_url": "../public/E_ID12_ES2.png",
            "video_url": "../public/E_ID12_ES2.mp4",
            "csv": "../public/E_ID12_ES2.csv",
        },
        {
            "id": "3",
            "exercise_id": "Es3",
            "name": "Exercise 3",
            "description": "....",
            "image_url": "../public/E_ID12_ES3.png",
            "video_url": "../public/E_ID12_ES3.mp4",
            "csv": "../public/E_ID12_ES3.csv",
        },
        {
            "id": "4",
            "exercise_id": "Es4",
            "name": "Exercise 4",
            "description": "....",
            "image_url": "../public/E_ID1_ES4.png",
            "video_url": "../public/E_ID1_ES4.mp4",
            "csv": "../public/E_ID1_ES4.csv",
        },
        {
            "id": "5",
            "exercise_id": "Es5",
            "name": "Exercise 5",
            "description": "....",
            "image_url": "../public/E_ID1_ES5.png",
            "video_url": "../public/E_ID1_ES5.mp4",
            "csv": "../public/E_ID1_ES5.csv",
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
