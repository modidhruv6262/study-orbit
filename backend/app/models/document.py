import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class TextbookDocument(Base):
    __tablename__ = "textbook_documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    total_pages = Column(Integer, default=0)
    upload_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="ready")  # uploaded, processing, ready, error

    subject = relationship("Subject", back_populates="documents")
    hierarchy = relationship("DocumentHierarchy", back_populates="document", uselist=False, cascade="all, delete-orphan")

class DocumentHierarchy(Base):
    __tablename__ = "document_hierarchies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("textbook_documents.id"), unique=True, nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=False)
    
    # Hierarchical tree: chapters -> topics -> subtopics -> page ranges
    structure_json = Column(JSON, nullable=False)
    # Compact text outline summary for quick LLM ingestion
    summary_markdown = Column(Text, nullable=True)
    total_chapters = Column(Integer, default=0)
    total_topics = Column(Integer, default=0)

    document = relationship("TextbookDocument", back_populates="hierarchy")
