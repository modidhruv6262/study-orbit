from pydantic import BaseModel, Field
from typing import Optional

class ProfileBase(BaseModel):
    daily_weekday_hours: float = Field(default=3.0, ge=0.5, le=16.0)
    daily_weekend_hours: float = Field(default=5.0, ge=0.5, le=16.0)
    preferred_time_slot: str = Field(default="evening")  # morning, afternoon, evening, night
    study_days_per_week: int = Field(default=6, ge=1, le=7)
    revision_buffer_days: int = Field(default=5, ge=1, le=30)
    break_interval_minutes: int = Field(default=25, ge=15, le=90)
    learning_pace: str = Field(default="moderate")  # relaxed, moderate, intensive
    target_grade_goal: str = Field(default="A")
    onboarding_completed: bool = False

class ProfileUpdate(ProfileBase):
    pass

class ProfileResponse(ProfileBase):
    id: str
    user_id: str

    class Config:
        from_attributes = True
