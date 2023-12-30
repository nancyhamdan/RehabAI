## tables for sqlite application
from datetime import datetime
from database import Base
from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    Float,
    DateTime,
)
from database import SessionLocal


class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )
    user_id = Column(String, unique=True)
    username = Column(String, unique=True)
    password = Column(String)
    session_token = Column("session_token", String, unique=True)


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    exercise_id = Column(Integer, unique=True)  # ID of the exercise
    name = Column(String, unique=True)  # Name of the exercise
    description = Column(String)  # Description of the exercise
    image_url = Column(String)  # URL of the image
    video_url = Column(String)  # URL of the video
    csv = Column(String)  # csv file of ground truth


class AssignedExercise(Base):
    __tablename__ = "assigned_exercises"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    exercise_id = Column(Integer, ForeignKey("exercises.name"))
    date = Column(DateTime, default=datetime.now())


class ProgressTracker(Base):
    __tablename__ = "progress_tracker"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    exercise_id = Column(Integer, ForeignKey("exercises.name"))
    date = Column(DateTime, default=datetime.now())
    score = Column(Float)
    performance_count = Column(
        Integer, default=0
    )  # Number of times the exercise has been performed


# ''' Exercise Table [Database needs to be created first]'''
# exercises_data = [
#     {
#         "id": "1",
#         "exercise_id": "Es1",
#         "name": "Exercise 1",
#         "description": "....",
#         "image_url": "../public/E_ID15_ES1.png",
#         "video_url": "../public/E_ID15_ES1.mp4",
#         "csv": "../public/E_ID15_ES1.csv",
#     },
#     {
#         "id": "2",
#         "exercise_id": "Es2",
#         "name": "Exercise 2",
#         "description": "....",
#         "image_url": "../public/E_ID12_ES2.png",
#         "video_url": "../public/E_ID12_ES2.mp4",
#         "csv": "../public/E_ID12_ES2.csv",
#     },
#     {
#         "id": "3",
#         "exercise_id": "Es3",
#         "name": "Exercise 3",
#         "description": "....",
#         "image_url": "../public/E_ID12_ES3.png",
#         "video_url": "../public/E_ID12_ES3.mp4",
#         "csv": "../public/E_ID12_ES3.csv",
#     },
#     {
#         "id": "4",
#         "exercise_id": "Es4",
#         "name": "Exercise 4",
#         "description": "....",
#         "image_url": "../public/E_ID1_ES4.png",
#         "video_url": "../public/E_ID1_ES4.mp4",
#         "csv": "../public/E_ID1_ES4.csv",
#     },
#     {
#         "id": "5",
#         "exercise_id": "Es5",
#         "name": "Exercise 5",
#         "description": "....",
#         "image_url": "../public/E_ID1_ES5.png",
#         "video_url": "../public/E_ID1_ES5.mp4",
#         "csv": "../public/E_ID1_ES5.csv",
#     },
# ]

# # Create a session and add exercises to the database
# with SessionLocal() as session:
#     for ex_data in exercises_data:
#         exercise_data_instance = Exercise(**ex_data)
#         session.add(exercise_data_instance)

#     # Commit the changes
#     session.commit()
