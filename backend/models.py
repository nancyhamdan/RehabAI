## tables for sqlite application

# Importing necessary libraries
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


# Define the User table
class User(Base):
    __tablename__ = "users"  # Name of the table in the database

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )
    user_id = Column(String, unique=True)  # Unique user ID
    username = Column(String, unique=True)  # Unique username
    password = Column(String)  # Password (should be hashed before storage)
    session_token = Column(
        "session_token", String, unique=True
    )  # Unique session token for user authentication


# Define the Exercise table
class Exercise(Base):
    __tablename__ = "exercises"  # Name of the table in the database

    id = Column(Integer, primary_key=True, index=True)
    exercise_id = Column(Integer, unique=True)  # ID of the exercise
    name = Column(String, unique=True)  # Name of the exercise
    description = Column(String)  # Description of the exercise
    image_url = Column(String)  # URL of the image
    video_url = Column(String)  # URL of the video
    csv = Column(String)  # csv file of ground truth


# Define the Assigned Exercises table
class AssignedExercise(Base):
    __tablename__ = "assigned_exercises"  # Name of the table in the database

    id = Column(Integer, primary_key=True, index=True)  # unique ID
    user_id = Column(
        Integer, ForeignKey("users.user_id")
    )  # Foreign key referencing the 'user_id' column of the 'users' table
    exercise_id = Column(
        Integer, ForeignKey("exercises.name")
    )  # Foreign key referencing the 'name' column of the 'exercises' table
    date = Column(
        DateTime, default=datetime.now()
    )  # Date when the exercise was assigned


# Define the Progress Tracker table
class ProgressTracker(Base):
    __tablename__ = "progress_tracker"  # Name of the table in the database

    id = Column(Integer, primary_key=True, index=True)  # unique ID
    user_id = Column(
        Integer, ForeignKey("users.user_id")
    )  # Foreign key referencing the 'user_id' column of the 'users' table
    exercise_id = Column(
        Integer, ForeignKey("exercises.name")
    )  # Foreign key referencing the 'name' column of the 'exercises' table
    date = Column(
        DateTime, default=datetime.now()
    )  # Date when the exercise was performed
    score = Column(Float)  # Score of the exercise
    performance_count = Column(
        Integer, default=0
    )  # Number of times the exercise has been performed
