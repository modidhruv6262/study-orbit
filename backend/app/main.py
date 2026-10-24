from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
import app.models  # Ensure all SQLAlchemy models are registered

# Create database tables
Base.metadata.create_all(bind=engine)

# Auto-seed demo user account if not present
from app.seed import seed_demo_user, seed_dhruv_users
seed_demo_user()
seed_dhruv_users()

app = FastAPI(
    title=settings.APP_NAME,
    description="Intelligent Study Planner, Hierarchical PDF Syllabus Indexer, and Guardrailed Academic Guide Bot",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
from app.routers import auth, profile, subjects, documents, exams, schedules, dashboard, chat

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(subjects.router)
app.include_router(documents.router)
app.include_router(exams.router)
app.include_router(schedules.router)
app.include_router(dashboard.router)
app.include_router(chat.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "docs_url": "/docs",
        "version": "1.0.0"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
