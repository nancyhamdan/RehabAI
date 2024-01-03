from datetime import datetime
from typing import Annotated
from uuid import uuid4, UUID

import pandas as pd
import os
import tensorflow as tf
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
from ml_wrapper import prepare_data
import models
from utils import is_exercise_assigned_to_user


app = FastAPI()


class SessionData(BaseModel):
    username: str
    sid: str

origins = ["http://localhost:5173", "localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UserCreateBase(BaseModel):
    username: str
    password: str


class UserCreateModel(UserCreateBase):
    id: int

    class Config:
        orm_mode = True


class UserLoginBase(BaseModel):
    username: str
    password: str


class UserLoginModel(UserLoginBase):
    id: int

    class Config:
        orm_mode = True


# database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]

models.Base.metadata.create_all(bind=engine)


# Function to get the current user from the authentication token
async def get_current_user(request: Request, db: db_dependency):
    session_id = request.cookies.get('session_token')
    
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
    if not user:
        print(session_id)
        raise HTTPException(
            status_code=401, detail="Not authenticated. Invalid session token."
        )
    return user


# Endpoints
@app.post("/api/signup/", response_model=UserCreateModel)
async def signup(user: UserCreateBase, db: db_dependency):
    existing_user = (
        db.query(models.User).filter(models.User.username == user.username).first()
    )
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    hashed_password = get_hashed_password(user.password)

    user_count = db.query(models.User).count() + 1
    u_id = f"U{user_count}"

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

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


@app.post("/api/login/")
async def login(user: UserLoginBase, db: db_dependency, response: Response):
    db_user = (
        db.query(models.User).filter(models.User.username == user.username).first()
    )
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
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


@app.post("/api/clinical_score/{exercise_id}")
async def clinical_score(
    exercise_id: str,
    db: db_dependency,
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
):
    # Get the user's assigned exercises and check if the chosen exercise is among the exercises assigned to the user
    if not is_exercise_assigned_to_user(db, current_user.user_id, exercise_id):
        raise HTTPException(status_code=403, detail="Exercise not assigned to user")

    models_directory = "DNN/"

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

    path = os.path.join(models_directory, model_paths[exercise_id])
    max_length = max_length_mapping.get(exercise_id, 0)

    # Model loading
    model = tf.keras.models.load_model(path)

    #csvStringIO = StringIO(csvString) #csvString is the string containing the csv file
    #df = pd.read_csv(csvStringIO, sep=",", header=None)

    raw_data = pd.read_csv(file.file)
    prepared_data = prepare_data(raw_data, max_length)
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
    response.delete_cookie("session_token")

    current_user.session_token = None
    db.commit()

    return {"message": "Logout successful"}
