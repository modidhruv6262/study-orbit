import uuid
from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    code = Column(String(50), nullable=True)
    color_code = Column(String(20), default="#3B82F6")
    difficulty_rating = Column(Integer, default=3)  # 1 (easiest) to 5 (most challenging)
    
    user = relationship("User", back_populates="subjects")
    documents = relationship("TextbookDocument", back_populates="subject", cascade="all, delete-orphan")
    exams = relationship("Exam", back_populates="subject", cascade="all, delete-orphan")
    tasks = relationship("ScheduleTask", back_populates="subject", cascade="all, delete-orphan")
