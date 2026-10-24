import uuid
from datetime import date
from sqlalchemy import Column, String, Date, Integer, ForeignKey, JSON, Text, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class Exam(Base):
    __tablename__ = "exams"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    # Optional single subject for backwards-compatibility
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=True)
    
    title = Column(String(150), nullable=False)
    exam_date = Column(Date, nullable=False)
    exam_type = Column(String(50), default="Midterm")  # Midterm, Final, Unit Test, Quiz, Entrance
    total_marks = Column(Integer, default=100)        # e.g. 20, 50, 60, 100 marks
    is_completed = Column(Boolean, default=False)     # True when marked finished by student
    
    # Selectable list of added subjects and their scopes for this exam
    subject_ids_json = Column(JSON, default=list)      # ["subject_id_1", "subject_id_2"]
    subject_scopes_json = Column(JSON, default=dict)   # {"subject_id_1": [1, 2], "subject_id_2": [1, 2, 3]}
    
    target_chapters_json = Column(JSON, default=list)  # Legacy single-subject target chapters
    weight_priority = Column(Integer, default=3)      # 1 (low) to 5 (critical)
    notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="exams")
    subject = relationship("Subject", back_populates="exams")
    schedules = relationship("StudySchedule", back_populates="exam", cascade="all, delete-orphan")
