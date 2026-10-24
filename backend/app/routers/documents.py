import os
import shutil
import uuid
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
import pymupdf

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.subject import Subject
from app.models.document import TextbookDocument, DocumentHierarchy
from app.schemas.document import DocumentResponse, HierarchyResponse
from app.services.auth_service import get_current_user
from app.services.pdf_processor import PDFProcessorService

router = APIRouter(prefix="/api/documents", tags=["Textbooks & Coursework Documents"])

@router.post("/upload", response_model=DocumentResponse)
async def upload_textbook(
    subject_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    # Generate safe unique filename
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)

    # Read PDF metadata
    try:
        doc = pymupdf.open(file_path)
        total_pages = len(doc)
        doc.close()
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail=f"Invalid or corrupted PDF file: {str(e)}")

    # Create Document record
    textbook = TextbookDocument(
        subject_id=subject.id,
        file_name=file.filename,
        file_path=file_path,
        file_size=file_size,
        total_pages=total_pages,
        status="processing"
    )
    db.add(textbook)
    db.commit()
    db.refresh(textbook)

    # Process Hierarchical Index immediately
    try:
        hierarchy_data = PDFProcessorService.extract_document_hierarchy(file_path, subject.name)
        
        doc_hierarchy = DocumentHierarchy(
            document_id=textbook.id,
            subject_id=subject.id,
            structure_json=hierarchy_data,
            summary_markdown=hierarchy_data.get("summary_markdown", ""),
            total_chapters=hierarchy_data.get("total_chapters", 0),
            total_topics=hierarchy_data.get("total_topics", 0)
        )
        db.add(doc_hierarchy)
        textbook.status = "ready"
        db.commit()
    except Exception as e:
        textbook.status = "error"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Failed to process document hierarchy: {str(e)}")

    return DocumentResponse(
        id=textbook.id,
        subject_id=textbook.subject_id,
        file_name=textbook.file_name,
        file_size=textbook.file_size,
        total_pages=textbook.total_pages,
        upload_date=textbook.upload_date,
        status=textbook.status,
        has_hierarchy=True
    )

@router.get("/subject/{subject_id}/hierarchy", response_model=HierarchyResponse)
def get_subject_hierarchy(
    subject_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    hierarchy = db.query(DocumentHierarchy).filter(DocumentHierarchy.subject_id == subject_id).first()
    if not hierarchy:
        raise HTTPException(status_code=404, detail="No syllabus hierarchy processed yet for this subject")

    return hierarchy

@router.put("/subject/{subject_id}/hierarchy", response_model=HierarchyResponse)
def update_subject_hierarchy(
    subject_id: str,
    data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    hierarchy = db.query(DocumentHierarchy).filter(DocumentHierarchy.subject_id == subject_id).first()
    chapters = data.get("chapters", [])
    total_ch = len(chapters)
    total_top = sum(len(c.get("topics", [])) for c in chapters)
    summary_md = PDFProcessorService._build_summary_markdown(subject.name, chapters)

    if not hierarchy:
        hierarchy = DocumentHierarchy(
            subject_id=subject.id,
            structure_json=data,
            summary_markdown=summary_md,
            total_chapters=total_ch,
            total_topics=total_top
        )
        db.add(hierarchy)
    else:
        hierarchy.structure_json = data
        hierarchy.summary_markdown = summary_md
        hierarchy.total_chapters = total_ch
        hierarchy.total_topics = total_top

    db.commit()
    db.refresh(hierarchy)
    return hierarchy

@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(TextbookDocument).join(Subject).filter(
        TextbookDocument.id == document_id,
        Subject.user_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except OSError:
            pass

    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully"}
