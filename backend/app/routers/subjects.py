from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.subject import Subject
from app.models.document import DocumentHierarchy
from app.schemas.subject import SubjectCreate, SubjectUpdate, SubjectResponse
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/subjects", tags=["Subjects"])

@router.get("", response_model=List[SubjectResponse])
def get_subjects(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    subjects = db.query(Subject).filter(Subject.user_id == current_user.id).all()
    results = []
    for s in subjects:
        has_doc = len(s.documents) > 0
        total_ch = 0
        if has_doc and s.documents[0].hierarchy:
            total_ch = s.documents[0].hierarchy.total_chapters
        
        results.append(SubjectResponse(
            id=s.id,
            user_id=s.user_id,
            name=s.name,
            code=s.code,
            color_code=s.color_code,
            difficulty_rating=s.difficulty_rating,
            has_textbook=has_doc,
            total_chapters=total_ch
        ))
    return results

@router.post("", response_model=SubjectResponse)
def create_subject(
    subj_data: SubjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subject = Subject(
        user_id=current_user.id,
        name=subj_data.name,
        code=subj_data.code,
        color_code=subj_data.color_code,
        difficulty_rating=subj_data.difficulty_rating
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return SubjectResponse(
        id=subject.id,
        user_id=subject.user_id,
        name=subject.name,
        code=subject.code,
        color_code=subject.color_code,
        difficulty_rating=subject.difficulty_rating,
        has_textbook=False,
        total_chapters=0
    )

@router.put("/{subject_id}", response_model=SubjectResponse)
def update_subject(
    subject_id: str,
    subj_data: SubjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    if subj_data.name is not None:
        subject.name = subj_data.name
    if subj_data.code is not None:
        subject.code = subj_data.code
    if subj_data.color_code is not None:
        subject.color_code = subj_data.color_code
    if subj_data.difficulty_rating is not None:
        subject.difficulty_rating = subj_data.difficulty_rating

    db.commit()
    db.refresh(subject)
    has_doc = len(subject.documents) > 0
    total_ch = 0
    if has_doc and subject.documents[0].hierarchy:
        total_ch = subject.documents[0].hierarchy.total_chapters

    return SubjectResponse(
        id=subject.id,
        user_id=subject.user_id,
        name=subject.name,
        code=subject.code,
        color_code=subject.color_code,
        difficulty_rating=subject.difficulty_rating,
        has_textbook=has_doc,
        total_chapters=total_ch
    )

@router.delete("/{subject_id}")
def delete_subject(
    subject_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    db.delete(subject)
    db.commit()
    return {"message": "Subject deleted successfully"}
