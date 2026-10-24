from pydantic import BaseModel, Field
from typing import Optional, List

class SubjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    code: Optional[str] = None
    color_code: Optional[str] = "#3B82F6"
    difficulty_rating: int = Field(default=3, ge=1, le=5)

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    color_code: Optional[str] = None
    difficulty_rating: Optional[int] = Field(default=None, ge=1, le=5)

class SubjectResponse(SubjectBase):
    id: str
    user_id: str
    has_textbook: bool = False
    total_chapters: int = 0

    class Config:
        from_attributes = True
