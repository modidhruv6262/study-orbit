from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.subject import Subject
from app.models.exam import Exam
from app.models.schedule import ScheduleTask
from app.schemas.exam import ExamCreate, ExamUpdate, ExamResponse
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/exams", tags=["Exams"])

def _build_exam_response(exam: Exam, current_user_id: str, db: Session) -> ExamResponse:
    today = date.today()
    days_left = (exam.exam_date - today).days

    # Identify all participating subjects
    subject_ids = list(exam.subject_ids_json or [])
    if exam.subject_id and exam.subject_id not in subject_ids:
        subject_ids.append(exam.subject_id)

    subjects = db.query(Subject).filter(
        Subject.user_id == current_user_id,
        Subject.id.in_(subject_ids)
    ).all() if subject_ids else []

    scopes = exam.subject_scopes_json or {}
    subjects_info = []
    total_chapters = 0

    for s in subjects:
        ch_list = scopes.get(s.id, [])
        if not ch_list and exam.subject_id == s.id and exam.target_chapters_json:
            ch_list = exam.target_chapters_json
        total_chapters += len(ch_list) if ch_list else 1
        subjects_info.append({
            "id": s.id,
            "name": s.name,
            "code": s.code,
            "color": s.color_code,
            "target_chapters": ch_list
        })

    # Calculate completion percentage across tasks belonging to these subjects
    total_tasks = 0
    completed_tasks = 0
    if subject_ids:
        total_tasks = db.query(ScheduleTask).filter(
            ScheduleTask.user_id == current_user_id,
            ScheduleTask.subject_id.in_(subject_ids)
        ).count()
        completed_tasks = db.query(ScheduleTask).filter(
            ScheduleTask.user_id == current_user_id,
            ScheduleTask.subject_id.in_(subject_ids),
            ScheduleTask.status == "completed"
        ).count()

    prog_pct = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0.0

    primary_subj = subjects[0] if subjects else None

    return ExamResponse(
        id=exam.id,
        user_id=exam.user_id,
        title=exam.title,
        exam_date=exam.exam_date,
        exam_type=exam.exam_type,
        total_marks=exam.total_marks or 100,
        is_completed=bool(exam.is_completed),
        days_left=days_left,
        weight_priority=exam.weight_priority or 3,
        notes=exam.notes,
        subject_ids=subject_ids,
        subject_scopes=scopes,
        subjects_info=subjects_info,
        total_target_chapters=total_chapters,
        completed_chapters=completed_tasks,
        progress_percentage=prog_pct,
        subject_id=primary_subj.id if primary_subj else None,
        subject_name=primary_subj.name if primary_subj else "General Exam",
        subject_color=primary_subj.color_code if primary_subj else "#3B82F6",
        target_chapters_json=exam.target_chapters_json or []
    )

@router.get("", response_model=List[ExamResponse])
def get_exams(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    exams = db.query(Exam).filter(Exam.user_id == current_user.id).order_by(Exam.exam_date.asc()).all()
    return [_build_exam_response(e, current_user.id, db) for e in exams]

@router.post("", response_model=ExamResponse)
def create_exam(
    exam_data: ExamCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Collect subjects
    subject_ids = list(exam_data.subject_ids or [])
    if exam_data.subject_id and exam_data.subject_id not in subject_ids:
        subject_ids.append(exam_data.subject_id)

    # Verify that subjects belong to the current user
    if subject_ids:
        user_subjects = db.query(Subject).filter(
            Subject.user_id == current_user.id,
            Subject.id.in_(subject_ids)
        ).all()
        if not user_subjects:
            raise HTTPException(status_code=400, detail="Selected subjects not found for user")
        primary_id = user_subjects[0].id
    else:
        primary_id = None

    new_exam = Exam(
        user_id=current_user.id,
        subject_id=primary_id,
        title=exam_data.title,
        exam_date=exam_data.exam_date,
        exam_type=exam_data.exam_type,
        total_marks=exam_data.total_marks or 100,
        subject_ids_json=subject_ids,
        subject_scopes_json=exam_data.subject_scopes or {},
        target_chapters_json=exam_data.target_chapters_json or [],
        weight_priority=exam_data.weight_priority or 3,
        notes=exam_data.notes
    )
    db.add(new_exam)
    db.commit()
    db.refresh(new_exam)

    return _build_exam_response(new_exam, current_user.id, db)

@router.put("/{exam_id}", response_model=ExamResponse)
def update_exam(
    exam_id: str,
    exam_data: ExamUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.user_id == current_user.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    if exam_data.title is not None:
        exam.title = exam_data.title
    if exam_data.exam_date is not None:
        exam.exam_date = exam_data.exam_date
    if exam_data.exam_type is not None:
        exam.exam_type = exam_data.exam_type
    if exam_data.total_marks is not None:
        exam.total_marks = exam_data.total_marks
    if exam_data.is_completed is not None:
        exam.is_completed = exam_data.is_completed
    if exam_data.subject_ids is not None:
        exam.subject_ids_json = exam_data.subject_ids
        if exam_data.subject_ids:
            exam.subject_id = exam_data.subject_ids[0]
    if exam_data.subject_scopes is not None:
        exam.subject_scopes_json = exam_data.subject_scopes
    if exam_data.weight_priority is not None:
        exam.weight_priority = exam_data.weight_priority
    if exam_data.notes is not None:
        exam.notes = exam_data.notes

    db.commit()
    db.refresh(exam)
    return _build_exam_response(exam, current_user.id, db)

@router.patch("/{exam_id}/complete", response_model=ExamResponse)
def toggle_exam_complete(
    exam_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.user_id == current_user.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    exam.is_completed = not bool(exam.is_completed)
    db.commit()
    db.refresh(exam)
    return _build_exam_response(exam, current_user.id, db)

@router.delete("/{exam_id}")
def delete_exam(
    exam_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.user_id == current_user.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    db.delete(exam)
    db.commit()
    return {"message": "Exam deleted successfully"}
