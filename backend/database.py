# Import necessary modules from SQLAlchemy
from sqlalchemy import create_engine  
from sqlalchemy.orm import sessionmaker 
from sqlalchemy.ext.declarative import declarative_base 

import os

# Use data directory if it exists (Docker), otherwise current directory (local)
DB_DIR = "/app/data" if os.path.exists("/app/data") else "."
URL_DATABASE = f"sqlite:///{DB_DIR}/RehabAI.db"

# Create a new engine instance
# connect_args={"check_same_thread": False} is used to allow the engine to be used in a multithreaded environment
engine = create_engine(URL_DATABASE, connect_args={"check_same_thread": False})

# Create a session factory bound to this engine
# autocommit=False means the session will not commit unless explicitly told to
# autoflush=False means the session will not flush unless explicitly told to
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a base class for all your models to inherit from
Base = declarative_base()
