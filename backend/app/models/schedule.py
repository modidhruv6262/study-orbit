import uuid
from datetime import date, datetime
from sqlalchemy import Column, String, Date, DateTime, Integer, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class StudySchedule(Base):
    __tablename__ = "study_schedules"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    exam_id = Column(String(36), ForeignKey("exams.id"), nullable=True)
    
    title = Column(String(150), default="Primary Study Plan")
    start_date = Column(Date, default=date.today)
    target_completion_date = Column(Date, nullable=False)
    total_hours_allocated = Column(Integer, default=0)
    status = Column(String(50), default="active")  # active, completed, archived
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="schedules")
    exam = relationship("Exam", back_populates="schedules")
    tasks = relationship("ScheduleTask", back_populates="schedule", cascade="all, delete-orphan", order_by="ScheduleTask.scheduled_date")

class ScheduleTask(Base):
    __tablename__ = "schedule_tasks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    schedule_id = Column(String(36), ForeignKey("study_schedules.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=False)
    
    scheduled_date = Column(Date, nullable=False)
    chapter_title = Column(String(150), nullable=False)
    topic_title = Column(String(200), nullable=False)
    subtopic_title = Column(String(200), nullable=True)
    page_start = Column(Integer, nullable=True)
    page_end = Column(Integer, nullable=True)
    estimated_minutes = Column(Integer, default=45)
    
    status = Column(String(50), default="pending")  # pending, completed, skipped
    is_revision = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

    schedule = relationship("StudySchedule", back_populates="tasks")
    subject = relationship("Subject", back_populates="tasks")
