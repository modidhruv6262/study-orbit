from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.schemas.chat import ChatMessageRequest, ChatMessageResponse, ChatSessionResponse
from app.services.auth_service import get_current_user
from app.services.chatbot_service import ChatbotService

router = APIRouter(prefix="/api/chat", tags=["Guiding Study Companion Bot"])

@router.post("/message", response_model=ChatMessageResponse)
async def send_chat_message(
    request: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    bot_msg = await ChatbotService.process_message(
        db=db,
        user=current_user,
        message_text=request.message,
        session_id=request.session_id
    )

    return ChatMessageResponse(
        id=bot_msg.id,
        session_id=bot_msg.session_id,
        role=bot_msg.role,
        content=bot_msg.content,
        citations=bot_msg.citations,
        created_at=bot_msg.created_at
    )

@router.get("/sessions", response_model=List[ChatSessionResponse])
def get_chat_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id
    ).order_by(ChatSession.created_at.desc()).limit(15).all()

    results = []
    for s in sessions:
        msgs = db.query(ChatMessage).filter(ChatMessage.session_id == s.id).order_by(ChatMessage.created_at.asc()).all()
        results.append(ChatSessionResponse(
            id=s.id,
            title=s.title,
            created_at=s.created_at,
            messages=[
                ChatMessageResponse(
                    id=m.id,
                    session_id=m.session_id,
                    role=m.role,
                    content=m.content,
                    citations=m.citations,
                    created_at=m.created_at
                ) for m in msgs
            ]
        ))
    return results

@router.delete("/session/{session_id}")
def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    db.delete(session)
    db.commit()
    return {"message": "Chat session deleted"}
