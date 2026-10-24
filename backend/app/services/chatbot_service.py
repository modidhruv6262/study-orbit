import re
import os
import json
import logging
from typing import Dict, Any, List, Optional
import httpx
from sqlalchemy.orm import Session
import pymupdf

from app.config import settings
from app.models.user import User
from app.models.subject import Subject
from app.models.document import DocumentHierarchy, TextbookDocument
from app.models.chat import ChatSession, ChatMessage
from app.models.schedule import ScheduleTask

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are "StudyOrbit AI", an elite, highly knowledgeable academic tutor and study companion.

CORE MISSION & CAPABILITIES:
1. UNRESTRICTED KNOWLEDGE: You answer ANY academic question, homework problem, mathematical equation, concept explanation, coding task, or study planning query the student asks. You NEVER refuse to explain, solve, or teach.
2. ACCURACY & RIGOR: Provide clear, accurate, step-by-step explanations. Include formulas, definitions, intuitive examples, and practice advice.
3. GROUNDED IN TEXTBOOKS: When provided with excerpts or citations from the student's uploaded textbooks, ground your explanation directly in their course curriculum and cite the specific Chapter and Page Numbers.
4. COMPREHENSIVE & CLEAR: Use clean GitHub markdown. Format math with KaTeX/LaTeX ($...$ for inline, $$...$$ for block). Use bolding and structured bullet points to make complex topics effortless to grasp."""

class ChatbotService:
    @staticmethod
    async def process_message(
        db: Session,
        user: User,
        message_text: str,
        session_id: Optional[str] = None
    ) -> ChatMessage:
        # 1. Fetch or create chat session
        session = None
        if session_id:
            session = db.query(ChatSession).filter(
                ChatSession.id == session_id,
                ChatSession.user_id == user.id
            ).first()
        
        if not session:
            title_text = message_text.strip().split("\n")[0][:45]
            session = ChatSession(
                user_id=user.id,
                title=title_text + ("..." if len(message_text) > 45 else "")
            )
            db.add(session)
            db.commit()
            db.refresh(session)

        # Record user message
        user_msg = ChatMessage(
            session_id=session.id,
            role="user",
            content=message_text
        )
        db.add(user_msg)
        db.commit()

        # 2. Gather syllabus context & find matching chapters/topics
        hierarchies = db.query(DocumentHierarchy).join(Subject).filter(Subject.user_id == user.id).all()
        syllabus_context = []
        matching_citations = []
        target_subject_ids = set()

        query_tokens = [w.lower() for w in re.findall(r'\b\w{3,}\b', message_text)]

        for h in hierarchies:
            subject = db.query(Subject).filter(Subject.id == h.subject_id).first()
            subj_name = subject.name if subject else "Course"
            syllabus_context.append(f"=== {subj_name} Course Outline ===")
            
            chapters = h.structure_json.get("chapters", [])
            for ch in chapters:
                ch_title = ch.get("chapter_title", "")
                p_start, p_end = ch.get("page_start", 1), ch.get("page_end", 1)
                syllabus_context.append(f"Chapter {ch.get('chapter_number')}: {ch_title} (pp. {p_start}-{p_end})")
                
                for top in ch.get("topics", []):
                    top_title = top.get("title", "")
                    tp_start, tp_end = top.get("page_start", p_start), top.get("page_end", p_end)
                    subtopics = top.get("subtopics", [])
                    
                    # Check token match for citation lookup
                    combined_text = f"{subj_name} {ch_title} {top_title} {' '.join(subtopics)}".lower()
                    if any(t in combined_text for t in query_tokens):
                        matching_citations.append({
                            "subject": subj_name,
                            "subject_id": str(h.subject_id),
                            "chapter": ch_title,
                            "topic": top_title,
                            "page_start": tp_start,
                            "page_end": tp_end,
                            "pages": f"{tp_start}–{tp_end}"
                        })
                        target_subject_ids.add(h.subject_id)

        full_context_str = "\n".join(syllabus_context) if syllabus_context else "No course textbooks uploaded yet."

        # 3. Retrieve relevant full-text excerpts from uploaded PDFs (RAG for Big Documents)
        document_excerpts = ChatbotService._retrieve_pdf_excerpts(db, user.id, matching_citations, query_tokens)

        # 4. Generate intelligent AI response via Groq (GPT-OSS-120B) or Gemini
        bot_response_text = ""
        citations_data = {"matches": matching_citations[:4]}

        if settings.GROQ_API_KEY:
            try:
                bot_response_text = await ChatbotService._call_groq_api(
                    message_text=message_text,
                    syllabus_context=full_context_str,
                    document_excerpts=document_excerpts,
                    citations=matching_citations
                )
            except Exception as e:
                logger.error(f"Error calling Groq API: {e}")
                bot_response_text = await ChatbotService._fallback_llm_response(
                    message_text=message_text,
                    syllabus_context=full_context_str,
                    document_excerpts=document_excerpts,
                    citations=matching_citations,
                    user=user
                )
        elif settings.GEMINI_API_KEY:
            try:
                bot_response_text = await ChatbotService._call_gemini_api(
                    message_text=message_text,
                    syllabus_context=full_context_str,
                    document_excerpts=document_excerpts
                )
            except Exception as e:
                logger.error(f"Error calling Gemini API: {e}")
                bot_response_text = ChatbotService._smart_local_response(
                    message_text, matching_citations, document_excerpts
                )
        else:
            bot_response_text = ChatbotService._smart_local_response(
                message_text, matching_citations, document_excerpts
            )

        # Save assistant message
        bot_msg = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=bot_response_text,
            citations=citations_data
        )
        db.add(bot_msg)
        db.commit()
        db.refresh(bot_msg)

        return bot_msg

    @staticmethod
    def _retrieve_pdf_excerpts(
        db: Session,
        user_id: str,
        citations: List[Dict[str, Any]],
        query_tokens: List[str]
    ) -> str:
        """
        Extracts relevant full-text paragraphs from the user's uploaded textbook PDFs
        to provide grounded, accurate answers on documents of any size.
        """
        excerpts = []
        chars_collected = 0
        max_chars = 3500

        # Look up documents for the user
        docs = db.query(TextbookDocument).join(Subject).filter(Subject.user_id == user_id).all()
        if not docs:
            return ""

        for doc_item in docs:
            if not doc_item.file_path or not os.path.exists(doc_item.file_path):
                continue

            try:
                doc = pymupdf.open(doc_item.file_path)
                total_pages = len(doc)

                # Prioritize pages from matching citations first
                target_pages = set()
                for c in citations:
                    p_start = c.get("page_start", 1)
                    p_end = c.get("page_end", p_start)
                    # Sample 3-5 pages around the cited topic
                    for p in range(max(0, p_start - 1), min(total_pages, p_end)):
                        target_pages.add(p)
                        if len(target_pages) >= 5:
                            break

                # If no citations matched, scan for query keywords
                if not target_pages and query_tokens:
                    # Search for prominent keywords
                    for tok in query_tokens[:3]:
                        if len(tok) < 4:
                            continue
                        for p_idx in range(min(total_pages, 100)):
                            page_text = doc[p_idx].get_text("text")
                            if tok in page_text.lower():
                                target_pages.add(p_idx)
                                if len(target_pages) >= 3:
                                    break
                        if target_pages:
                            break

                # Extract and clean text from target pages
                for p_idx in sorted(list(target_pages))[:4]:
                    if chars_collected >= max_chars:
                        break
                    p_text = doc[p_idx].get_text("text")
                    cleaned = re.sub(r'\s+', ' ', p_text).strip()
                    if cleaned and len(cleaned) > 50:
                        snippet = cleaned[:900]
                        excerpts.append(f"--- [Textbook: {doc_item.file_name} | Page {p_idx + 1}] ---\n{snippet}\n")
                        chars_collected += len(snippet)

                doc.close()
            except Exception as e:
                logger.warning(f"Error extracting PDF excerpts from {doc_item.file_name}: {e}")

        return "\n".join(excerpts)

    @staticmethod
    async def _call_groq_api(
        message_text: str,
        syllabus_context: str,
        document_excerpts: str,
        citations: List[Dict[str, Any]]
    ) -> str:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        user_prompt_parts = []
        if document_excerpts:
            user_prompt_parts.append(f"[RELEVANT TEXTBOOK EXCERPTS FROM STUDENT DOCUMENTS]:\n{document_excerpts}\n")
        
        user_prompt_parts.append(f"[STUDENT COURSEWORK SYLLABUS OUTLINE]:\n{syllabus_context}\n")
        user_prompt_parts.append(f"[STUDENT QUESTION / PROMPT]:\n{message_text}\n")
        user_prompt_parts.append(
            "Instructions:\n"
            "1. Provide a comprehensive, accurate, and deeply clear explanation or solution.\n"
            "2. If relevant to the student's textbook or syllabus, cite the specific subject, chapter, and page numbers.\n"
            "3. Answer thoroughly without artificially restricting or withholding information."
        )

        user_prompt = "\n".join(user_prompt_parts)

        payload = {
            "model": settings.GROQ_MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            "max_tokens": 1500,
            "temperature": 0.3
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            choice = data["choices"][0]["message"]
            content = choice.get("content")
            if not content:
                content = choice.get("reasoning", "")
            return content.strip()

    @staticmethod
    async def _call_gemini_api(
        message_text: str,
        syllabus_context: str,
        document_excerpts: str
    ) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={settings.GEMINI_API_KEY}"
        
        prompt_content = f"""{SYSTEM_PROMPT}

[RELEVANT TEXTBOOK EXCERPTS]:
{document_excerpts or "No direct page excerpts available."}

[COURSEWORK SYLLABUS OUTLINE]:
{syllabus_context}

[STUDENT QUESTION]:
{message_text}

Provide an accurate, detailed, and pedagogically clear response. Cite chapters and page numbers if applicable."""

        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt_content}]
                }
            ],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 1500
            }
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()

    @staticmethod
    async def _fallback_llm_response(
        message_text: str,
        syllabus_context: str,
        document_excerpts: str,
        citations: List[Dict[str, Any]],
        user: User
    ) -> str:
        """Fallback to Gemini if Groq encountered a transient rate limit or error"""
        if settings.GEMINI_API_KEY:
            try:
                return await ChatbotService._call_gemini_api(message_text, syllabus_context, document_excerpts)
            except Exception as e:
                logger.error(f"Fallback to Gemini also failed: {e}")
        
        return ChatbotService._smart_local_response(message_text, citations, document_excerpts)

    @staticmethod
    def _smart_local_response(
        message_text: str,
        citations: List[Dict[str, Any]],
        document_excerpts: str
    ) -> str:
        """
        Grounded local response when offline or before API response resolves.
        """
        response_parts = []
        if citations:
            c = citations[0]
            response_parts.append(f"### 📖 Coursework Citation: {c['subject']}\n")
            response_parts.append(f"This concept is located in **{c['chapter']}** $\\rightarrow$ **{c['topic']}** (Pages **{c['pages']}**).\n\n")

        if document_excerpts:
            clean_excerpt = document_excerpts.split("---")[1].strip() if "---" in document_excerpts else document_excerpts[:400]
            response_parts.append(f"**From your Textbook:**\n> {clean_excerpt[:350]}...\n\n")

        response_parts.append(
            "**Key Insights & Study Steps:**\n"
            "1. **Core Concept**: Review the formal definitions and formulas in this section.\n"
            "2. **Worked Examples**: Re-derive the first solved problem step-by-step on scratch paper.\n"
            "3. **Active Practice**: Solve the end-of-section conceptual questions to verify retention.\n\n"
            "Would you like me to allocate a focused study block for this topic in your timetable today?"
        )
        return "".join(response_parts)
