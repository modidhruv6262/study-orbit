from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime

class SubtopicItem(BaseModel):
    title: str
    page_start: Optional[int] = None
    page_end: Optional[int] = None

class TopicItem(BaseModel):
    topic_id: str
    title: str
    page_start: int
    page_end: int
    subtopics: List[str] = []
    key_terms: List[str] = []
    estimated_minutes: int = 45

class ChapterItem(BaseModel):
    chapter_number: int
    chapter_title: str
    page_start: int
    page_end: int
    estimated_study_minutes: int = 180
    topics: List[TopicItem] = []

class DocumentHierarchyStructure(BaseModel):
    subject: str
    total_chapters: int
    chapters: List[ChapterItem]

class DocumentResponse(BaseModel):
    id: str
    subject_id: str
    file_name: str
    file_size: int
    total_pages: int
    upload_date: datetime
    status: str
    has_hierarchy: bool = False

    class Config:
        from_attributes = True

class HierarchyResponse(BaseModel):
    id: str
    document_id: str
    subject_id: str
    structure_json: Dict[str, Any]
    summary_markdown: Optional[str] = None
    total_chapters: int
    total_topics: int

    class Config:
        from_attributes = True
