# RehabAI

RehabAI is an AI-powered web application for remote physical therapy. Instead of relying on expensive RGB-D cameras (most commonly used for human action evaluation in telerehabilitation), RehabAI uses the built-in RGB camera from a patient’s webcam. A patient performs an exercise in front of the webcam, and a pose-estimation model extracts body joint positions from the video frames. This time series joint-position data is then used to predict a clinical score for exercise performance using a transformer-encoder based model. The extracted joint positions are also used to provide live feedback via Dynamic Time Warping (DTW) to help the patient improve their form. The system is demonstrated using the [KiMORE](https://ieeexplore.ieee.org/document/8736767) dataset, which targets patients with lower back pain.

> **Disclaimer**: RehabAI is a system prototype created for a graduation project. It has **not** been clinically validated or evaluated by medical professionals. Do not use it in real-world clinical or patient-care settings without appropriate medical oversight.

## Model Files (Required)

The trained clinical-score prediction models are **not** stored in this GitHub repository. Download them from [here](https://drive.google.com/drive/folders/1OFv4JI1P_0NYPB8CieeXskRIcFljhT6D?usp=sharing) and place the files in `backend/models/` without changing their names.

## Quick Start (Docker)

```bash
docker-compose up --build
```

- RehabAI: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Docker Commands

```bash
# Start in background
docker-compose up -d --build

# Stop
docker-compose down

# View logs
docker-compose logs -f

# Rebuild without cache (if you get build errors)
docker builder prune -f
docker-compose build --no-cache
docker-compose up
```

## Manual Setup

### Backend

Requires **Python 3.11**

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install --no-deps keras-nlp==0.5.2
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

Requires **Node.js 20+**

```bash
cd frontend
npm install
npm run dev
```

- RehabAI: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
