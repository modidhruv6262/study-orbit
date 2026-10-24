from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date

class ExamBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    exam_date: date
    exam_type: str = Field(default="Midterm")  # Midterm, Final, Unit Test, Quiz, Entrance
    total_marks: int = Field(default=100, ge=1, le=1000)
    
    # Selected list of added subjects
    subject_ids: List[str] = []
    # Scopes: e.g. { "subject_id": [1, 2, 3] }
    subject_scopes: Dict[str, Any] = {}
    
    # Legacy fields
    subject_id: Optional[str] = None
    target_chapters_json: Optional[List[int]] = []
    weight_priority: int = Field(default=3, ge=1, le=5)
    notes: Optional[str] = None

class ExamCreate(ExamBase):
    pass

class ExamUpdate(BaseModel):
    title: Optional[str] = None
    exam_date: Optional[date] = None
    exam_type: Optional[str] = None
    total_marks: Optional[int] = None
    is_completed: Optional[bool] = None
    subject_ids: Optional[List[str]] = None
    subject_scopes: Optional[Dict[str, Any]] = None
    weight_priority: Optional[int] = Field(default=None, ge=1, le=5)
    notes: Optional[str] = None

class ExamResponse(BaseModel):
    id: str
    user_id: str
    title: str
    exam_date: date
    exam_type: str
    total_marks: int = 100
    is_completed: bool = False
    days_left: int
    weight_priority: int = 3
    notes: Optional[str] = None

    # Multi-subject information
    subject_ids: List[str] = []
    subject_scopes: Dict[str, Any] = {}
    subjects_info: List[Dict[str, Any]] = []

    # Summary metrics
    total_target_chapters: int = 0
    completed_chapters: int = 0
    progress_percentage: float = 0.0

    # Backwards compatibility
    subject_id: Optional[str] = None
    subject_name: Optional[str] = None
    subject_color: Optional[str] = None
    target_chapters_json: List[int] = []

    class Config:
        from_attributes = True
