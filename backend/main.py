# Importing the necessary libraries
from datetime import datetime
from typing import Annotated
from uuid import uuid4, UUID

import pandas as pd
import os
import tensorflow as tf
from tslearn.metrics import dtw
from fastapi import (
    FastAPI,
    UploadFile,
    File,
    HTTPException,
    Depends,
    Response,
    Request,
    Cookie,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from keras_nlp.layers import TransformerEncoder
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import SessionLocal, engine
from hashing import get_hashed_password, verify_password
from ml_wrapper import prepare_data, reorder_dataframe
from data_wrapper import initialize_db
import models
from utils import is_exercise_assigned_to_user
from typing import List, Optional
from io import StringIO

# Create an instance of the FastAPI class
app = FastAPI()


# Define the SessionData model
class SessionData(BaseModel):
    username: str
    sid: str


# Define the list of allowed origins for CORS
origins = ["http://localhost:5173", "localhost:5173"]

# Add CORS middleware to the FastAPI application
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allow the defined origins
    allow_credentials=True,  # Allow cookies to be included in the requests
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)


# Define the UserCreateBase model
class UserCreateBase(BaseModel):
    username: str
    password: str


# Define the UserCreateModel model
class UserCreateModel(UserCreateBase):
    id: int

    class Config:
        orm_mode = True


# Define the UserLoginBase model
class UserLoginBase(BaseModel):
    username: str
    password: str


# Define the UserLoginModel model
class UserLoginModel(UserLoginBase):
    id: int

    class Config:
        orm_mode = True


# Define the CsvStringModel model
class CsvStringModel(BaseModel):
    csvString: Optional[str]


# Define a database dependency
def get_db():
    db = SessionLocal()  # Create a new database session
    try:
        yield db  # Yield the database session to the dependency
    finally:
        db.close()  # Close the database session


db_dependency = Annotated[Session, Depends(get_db)]

# Create all the tables in the database
models.Base.metadata.create_all(bind=engine)

initialize_db()


# Function to get the current user from the authentication token
async def get_current_user(request: Request, db: db_dependency):
    # Get the session token from the cookies
    session_id = request.cookies.get("session_token")

    # If there is no session token, raise an exception
    if not session_id:
        raise HTTPException(
            status_code=401, detail="Not authenticated. Session token not found."
        )
    # Retrieve the user with the matching session token
    user = (
        db.query(models.User)
        .filter(models.User.session_token == str(session_id))
        .first()
    )
    # If there is no user with the matching session token, raise an exception
    if not user:
        print(session_id)
        raise HTTPException(
            status_code=401, detail="Not authenticated. Invalid session token."
        )
    return user


# Endpoints


@app.post("/api/signup/", response_model=UserCreateModel)
async def signup(user: UserCreateBase, db: db_dependency):
    # Check if the username already exists
    existing_user = (
        db.query(models.User).filter(models.User.username == user.username).first()
    )
    # If the username already exists, raise an exception
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    # Hash the password
    hashed_password = get_hashed_password(user.password)

    # Generate a unique user ID
    user_count = db.query(models.User).count() + 1
    u_id = f"U{user_count}"

    # Create a new user
    db_user = models.User(
        user_id=u_id, username=user.username, password=hashed_password
    )

    # Assigning all exercises to the new user
    exercises = db.query(models.Exercise).all()
    for exercise in exercises:
        db_assigned_exercise = models.AssignedExercise(
            user_id=db_user.user_id,
            exercise_id=exercise.exercise_id,
            date=datetime.now(),
        )
        db.add(db_assigned_exercise)

    # Add the new user to the database
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


@app.post("/api/login/")
async def login(user: UserLoginBase, db: db_dependency, response: Response):
    # Check if the username exists in the database
    db_user = (
        db.query(models.User).filter(models.User.username == user.username).first()
    )
    # If the username does not exist, raise an exception
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    # If the password is incorrect, raise an exception
    if not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Incorrect password")

    # Set the session token in the response cookie
    session = uuid4()
    db_user.session_token = str(session)
    db.commit()
    db.refresh(db_user)

    response.set_cookie(key="session_token", value=session, httponly=True)
    return {"message": "Login successful", "session_id": str(session)}


@app.get("/api/exercises/")
async def get_exercises(
    db: db_dependency, current_user: models.User = Depends(get_current_user)
):
    # Get the user's assigned exercises
    assigned_exercises = (
        db.query(models.AssignedExercise)
        .filter(models.AssignedExercise.user_id == current_user.user_id)
        .all()
    )
    # Get the exercise data for each assigned exercise
    exercises = []
    for assigned_exercise in assigned_exercises:
        exercise = (
            db.query(models.Exercise)
            .filter(models.Exercise.exercise_id == assigned_exercise.exercise_id)
            .first()
        )
        exercises.append(exercise)

    return exercises


@app.post("/api/feedback/{exercise_id}")
async def get_feedback(
    exercise_id: str,
    db: db_dependency,
    referenceJointValues: List[float],
    currentJointValues: List[float],
    current_user: models.User = Depends(get_current_user),
):
    # Calculating the Dynamic Time Warping (DTW) distance between the current and reference joint values
    dtw_value = dtw(currentJointValues, referenceJointValues)
    # Preparing the result
    result = {"feedback_dtw": [dtw_value]}
    print(result["feedback_dtw"])
    return JSONResponse(content=result)


@app.post("/api/clinical_score/{exercise_id}")
async def clinical_score(
    exercise_id: str,
    db: db_dependency,
    csv_data: CsvStringModel,
    current_user: models.User = Depends(get_current_user),
):
    # Get the user's assigned exercises and check if the chosen exercise is among the exercises assigned to the user
    if not is_exercise_assigned_to_user(db, current_user.user_id, exercise_id):
        raise HTTPException(status_code=403, detail="Exercise not assigned to user")

    # Define the directory and paths for the models
    models_directory = "models/"

    model_paths = {
        "Es1": "ml_model_Es1.h5",
        "Es2": "ml_model_Es2.h5",
        "Es3": "ml_model_Es3.h5",
        "Es4": "ml_model_Es4.h5",
        "Es5": "ml_model_Es5.h5",
    }

    max_length_mapping = {
        "Es1": 1515,
        "Es2": 1668,
        "Es3": 1518,
        "Es4": 1988,
        "Es5": 1022,
    }
    # Load the model
    path = os.path.join(models_directory, model_paths[exercise_id])
    max_length = max_length_mapping.get(exercise_id, 0)
    print("starting model load")
    model = tf.keras.models.load_model(path, compile=False)
    print("finished model load")

    # Prepare the data
    csvStringIO = StringIO(
        csv_data.csvString
    )  # csvString is the string containing the csv file
    raw_data = pd.read_csv(csvStringIO, sep=",")
    raw_data_ordered = reorder_dataframe(raw_data)
    print("starting prepare data")
    prepared_data = prepare_data(raw_data_ordered, max_length, exercise_id)
    print("ending prepare data")

    # Make a prediction
    prediction = model.predict([prepared_data[0], prepared_data[1]])

    # Checking if there are previous entries for the same user and exercise
    previous_entry = (
        db.query(models.ProgressTracker)
        .filter(
            models.ProgressTracker.user_id == current_user.user_id,
            models.ProgressTracker.exercise_id == exercise_id,
        )
        .order_by(models.ProgressTracker.date.desc())
        .first()
    )

    # Update the performance count
    if previous_entry:
        performance_count = previous_entry.performance_count + 1
    else:
        performance_count = 1

    # Store the clinical score in the database
    new_clinical_score = models.ProgressTracker(
        user_id=current_user.user_id,
        exercise_id=exercise_id,
        date=datetime.now(),
        score=prediction[0],
        performance_count=performance_count,
    )
    db.add(new_clinical_score)
    db.commit()
    db.refresh(new_clinical_score)

    result = {"clinical_score": prediction.tolist()}

    return JSONResponse(content=result)


@app.post("/api/logout/")
def logout(
    response: Response,
    db: db_dependency,
    current_user: models.User = Depends(get_current_user),
):
    # Delete the session token from the response cookie
    response.delete_cookie("session_token")

    # Remove the session token from the user
    current_user.session_token = None
    db.commit()

    return {"message": "Logout successful"}
