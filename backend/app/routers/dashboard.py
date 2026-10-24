from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.exam import Exam
from app.models.schedule import StudySchedule, ScheduleTask
from app.schemas.schedule import DashboardOverview
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard Overview"])

@router.get("/overview", response_model=DashboardOverview)
def get_dashboard_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    
    # Closest upcoming exam
    closest_exam = db.query(Exam).filter(
        Exam.user_id == current_user.id,
        Exam.exam_date >= today
    ).order_by(Exam.exam_date.asc()).first()

    closest_days = (closest_exam.exam_date - today).days if closest_exam else None
    closest_title = closest_exam.title if closest_exam else None

    total_exams = db.query(Exam).filter(Exam.user_id == current_user.id).count()

    # Today's tasks
    today_tasks = db.query(ScheduleTask).filter(
        ScheduleTask.user_id == current_user.id,
        ScheduleTask.scheduled_date == today
    ).all()

    today_total = len(today_tasks)
    today_completed = sum(1 for t in today_tasks if t.status == "completed")
    today_min_planned = sum(t.estimated_minutes for t in today_tasks)
    today_min_completed = sum(t.estimated_minutes for t in today_tasks if t.status == "completed")

    # Overall active schedule progress
    active_sched = db.query(StudySchedule).filter(
        StudySchedule.user_id == current_user.id,
        StudySchedule.status == "active"
    ).order_by(StudySchedule.created_at.desc()).first()

    overall_prog = 0.0
    if active_sched:
        all_tasks = db.query(ScheduleTask).filter(ScheduleTask.schedule_id == active_sched.id).all()
        if all_tasks:
            done = sum(1 for t in all_tasks if t.status == "completed")
            overall_prog = round((done / len(all_tasks)) * 100, 1)

    # 7-day adherence
    seven_days_ago = today - timedelta(days=7)
    past_week_tasks = db.query(ScheduleTask).filter(
        ScheduleTask.user_id == current_user.id,
        ScheduleTask.scheduled_date >= seven_days_ago,
        ScheduleTask.scheduled_date <= today
    ).all()

    if past_week_tasks:
        week_done = sum(1 for t in past_week_tasks if t.status == "completed")
        adherence = round((week_done / len(past_week_tasks)) * 100, 1)
    else:
        adherence = 100.0 if today_completed > 0 else 0.0

    # True Streak calculation based on completed tasks
    today_has_completed = db.query(ScheduleTask).filter(
        ScheduleTask.user_id == current_user.id,
        ScheduleTask.scheduled_date == today,
        ScheduleTask.status == "completed"
    ).first() is not None

    if today_has_completed:
        streak = 1
        check_day = today - timedelta(days=1)
    else:
        yesterday_completed = db.query(ScheduleTask).filter(
            ScheduleTask.user_id == current_user.id,
            ScheduleTask.scheduled_date == today - timedelta(days=1),
            ScheduleTask.status == "completed"
        ).first() is not None
        if yesterday_completed:
            streak = 1
            check_day = today - timedelta(days=2)
        else:
            streak = 0
            check_day = None

    if check_day:
        while True:
            had_completed = db.query(ScheduleTask).filter(
                ScheduleTask.user_id == current_user.id,
                ScheduleTask.scheduled_date == check_day,
                ScheduleTask.status == "completed"
            ).first()
            if had_completed:
                streak += 1
                check_day -= timedelta(days=1)
            else:
                break

    return DashboardOverview(
        closest_exam_days=closest_days,
        closest_exam_title=closest_title,
        total_exams_scheduled=total_exams,
        today_tasks_total=today_total,
        today_tasks_completed=today_completed,
        today_minutes_planned=today_min_planned,
        today_minutes_completed=today_min_completed,
        overall_progress_percentage=overall_prog,
        weekly_adherence_percent=adherence,
        active_streak_days=streak
    )
