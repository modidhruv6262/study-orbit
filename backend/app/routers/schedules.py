from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.user import User
from app.models.subject import Subject
from app.models.schedule import StudySchedule, ScheduleTask
from app.schemas.schedule import (
    ScheduleGenerateRequest,
    ScheduleResponse,
    ScheduleTaskResponse,
    TaskStatusUpdate
)
from app.services.auth_service import get_current_user
from app.services.schedule_engine import ScheduleEngine
from app.services.ics_exporter import generate_ics_calendar

router = APIRouter(prefix="/api/schedules", tags=["Study Schedules & Tasks"])

def _build_task_response(task: ScheduleTask) -> ScheduleTaskResponse:
    return ScheduleTaskResponse(
        id=task.id,
        schedule_id=task.schedule_id,
        subject_id=task.subject_id,
        subject_name=task.subject.name if task.subject else "Subject",
        subject_color=task.subject.color_code if task.subject else "#3B82F6",
        scheduled_date=task.scheduled_date,
        chapter_title=task.chapter_title,
        topic_title=task.topic_title,
        subtopic_title=task.subtopic_title,
        page_start=task.page_start,
        page_end=task.page_end,
        estimated_minutes=task.estimated_minutes,
        status=task.status,
        is_revision=task.is_revision,
        completed_at=task.completed_at
    )

@router.post("/generate", response_model=ScheduleResponse)
def generate_schedule(
    request: ScheduleGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    schedule = ScheduleEngine.generate_schedule(
        db=db,
        user=current_user,
        exam_ids=request.exam_ids,
        start_date=request.start_date or date.today(),
        title=request.title or "Master Study Plan"
    )

    tasks = db.query(ScheduleTask).filter(ScheduleTask.schedule_id == schedule.id).order_by(ScheduleTask.scheduled_date.asc()).all()
    completed = sum(1 for t in tasks if t.status == "completed")
    prog_pct = round((completed / len(tasks) * 100), 1) if tasks else 0.0

    return ScheduleResponse(
        id=schedule.id,
        title=schedule.title,
        start_date=schedule.start_date,
        target_completion_date=schedule.target_completion_date,
        total_hours_allocated=schedule.total_hours_allocated,
        status=schedule.status,
        total_tasks=len(tasks),
        completed_tasks=completed,
        progress_percentage=prog_pct,
        tasks=[_build_task_response(t) for t in tasks]
    )

@router.get("/active", response_model=Optional[ScheduleResponse])
def get_active_schedule(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    schedule = db.query(StudySchedule).filter(
        StudySchedule.user_id == current_user.id,
        StudySchedule.status == "active"
    ).order_by(StudySchedule.created_at.desc()).first()

    if not schedule:
        return None

    tasks = db.query(ScheduleTask).filter(ScheduleTask.schedule_id == schedule.id).order_by(ScheduleTask.scheduled_date.asc()).all()
    completed = sum(1 for t in tasks if t.status == "completed")
    prog_pct = round((completed / len(tasks) * 100), 1) if tasks else 0.0

    return ScheduleResponse(
        id=schedule.id,
        title=schedule.title,
        start_date=schedule.start_date,
        target_completion_date=schedule.target_completion_date,
        total_hours_allocated=schedule.total_hours_allocated,
        status=schedule.status,
        total_tasks=len(tasks),
        completed_tasks=completed,
        progress_percentage=prog_pct,
        tasks=[_build_task_response(t) for t in tasks]
    )

@router.get("/today", response_model=List[ScheduleTaskResponse])
def get_today_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    tasks = db.query(ScheduleTask).filter(
        ScheduleTask.user_id == current_user.id,
        ScheduleTask.scheduled_date == today
    ).all()
    return [_build_task_response(t) for t in tasks]

@router.patch("/tasks/{task_id}", response_model=ScheduleTaskResponse)
def update_task_status(
    task_id: str,
    update_data: TaskStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(ScheduleTask).filter(
        ScheduleTask.id == task_id,
        ScheduleTask.user_id == current_user.id
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.status = update_data.status
    if update_data.status == "completed":
        task.completed_at = datetime.utcnow()
    else:
        task.completed_at = None

    if update_data.notes:
        task.notes = update_data.notes

    db.commit()
    db.refresh(task)
    return _build_task_response(task)

@router.post("/rebalance", response_model=ScheduleResponse)
def rebalance_schedule(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    active_sched = db.query(StudySchedule).filter(
        StudySchedule.user_id == current_user.id,
        StudySchedule.status == "active"
    ).order_by(StudySchedule.created_at.desc()).first()

    if not active_sched:
        raise HTTPException(status_code=404, detail="No active study schedule found to rebalance")

    rebalanced = ScheduleEngine.rebalance_schedule(db, active_sched.id, current_user)
    
    tasks = db.query(ScheduleTask).filter(ScheduleTask.schedule_id == rebalanced.id).order_by(ScheduleTask.scheduled_date.asc()).all()
    completed = sum(1 for t in tasks if t.status == "completed")
    prog_pct = round((completed / len(tasks) * 100), 1) if tasks else 0.0

    return ScheduleResponse(
        id=rebalanced.id,
        title=rebalanced.title,
        start_date=rebalanced.start_date,
        target_completion_date=rebalanced.target_completion_date,
        total_hours_allocated=rebalanced.total_hours_allocated,
        status=rebalanced.status,
        total_tasks=len(tasks),
        completed_tasks=completed,
        progress_percentage=prog_pct,
        tasks=[_build_task_response(t) for t in tasks]
    )

@router.get("/{schedule_id}/export.ics")
def export_ics(
    schedule_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    schedule = db.query(StudySchedule).filter(
        StudySchedule.id == schedule_id,
        StudySchedule.user_id == current_user.id
    ).first()

    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    tasks = db.query(ScheduleTask).filter(ScheduleTask.schedule_id == schedule.id).all()
    ics_text = generate_ics_calendar(tasks, schedule.title)

    return Response(
        content=ics_text,
        media_type="text/calendar",
        headers={"Content-Disposition": f"attachment; filename=study_schedule_{schedule_id}.ics"}
    )
