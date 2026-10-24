from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import date, datetime

class ScheduleGenerateRequest(BaseModel):
    title: Optional[str] = "Unified Master Study Plan"
    exam_ids: Optional[List[str]] = None  # if empty, includes all upcoming exams
    start_date: Optional[date] = None     # defaults to today
    daily_weekday_hours: Optional[float] = None
    daily_weekend_hours: Optional[float] = None
    revision_buffer_days: Optional[int] = None
    interleave_subjects: bool = True       # alternates between subjects for better retention

class TaskStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|completed|skipped)$")
    notes: Optional[str] = None

class ScheduleTaskResponse(BaseModel):
    id: str
    schedule_id: str
    subject_id: str
    subject_name: Optional[str] = "Subject"
    subject_color: Optional[str] = "#3B82F6"
    scheduled_date: date
    chapter_title: str
    topic_title: str
    subtopic_title: Optional[str] = None
    page_start: Optional[int] = None
    page_end: Optional[int] = None
    estimated_minutes: int
    status: str
    is_revision: bool = False
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ScheduleResponse(BaseModel):
    id: str
    title: str
    start_date: date
    target_completion_date: date
    total_hours_allocated: int
    status: str
    total_tasks: int = 0
    completed_tasks: int = 0
    progress_percentage: float = 0.0
    tasks: List[ScheduleTaskResponse] = []

    class Config:
        from_attributes = True

class DashboardOverview(BaseModel):
    closest_exam_days: Optional[int] = None
    closest_exam_title: Optional[str] = None
    total_exams_scheduled: int = 0
    today_tasks_total: int = 0
    today_tasks_completed: int = 0
    today_minutes_planned: int = 0
    today_minutes_completed: int = 0
    overall_progress_percentage: float = 0.0
    weekly_adherence_percent: float = 0.0
    active_streak_days: int = 1
