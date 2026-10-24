import uuid
from sqlalchemy import Column, String, Float, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    
    # Study timing preferences
    daily_weekday_hours = Column(Float, default=3.0)
    daily_weekend_hours = Column(Float, default=5.0)
    preferred_time_slot = Column(String(50), default="evening")  # morning, afternoon, evening, night
    study_days_per_week = Column(Integer, default=6)             # 5, 6, or 7
    revision_buffer_days = Column(Integer, default=5)            # days reserved before exam for pure review
    break_interval_minutes = Column(Integer, default=25)         # Pomodoro interval (25 or 50)
    learning_pace = Column(String(50), default="moderate")       # relaxed, moderate, intensive
    target_grade_goal = Column(String(50), default="A")          # A, B, Top Percentile
    onboarding_completed = Column(Boolean, default=False)

    user = relationship("User", back_populates="profile")
