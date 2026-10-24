import logging
from datetime import date, timedelta
from app.database import SessionLocal
from app.models.user import User
from app.models.student_profile import StudentProfile
from app.models.subject import Subject
from app.models.document import TextbookDocument, DocumentHierarchy
from app.models.exam import Exam
from app.models.schedule import StudySchedule, ScheduleTask
from app.models.chat import ChatSession, ChatMessage
from app.services.auth_service import hash_password
from app.services.schedule_engine import ScheduleEngine
import json
import os
from datetime import datetime, date

logger = logging.getLogger(__name__)

def seed_demo_user():
    db = SessionLocal()
    try:
        demo_email = "student@example.com"
        existing = db.query(User).filter(User.email == demo_email).first()
        if existing:
            return  # Already seeded

        logger.info("Seeding demo student account...")
        # 1. Create User
        user = User(
            email=demo_email,
            hashed_password=hash_password("student123"),
            full_name="Alex Rivera"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # 2. Student Profile
        profile = StudentProfile(
            user_id=user.id,
            daily_weekday_hours=3.0,
            daily_weekend_hours=5.0,
            preferred_time_slot="evening",
            study_days_per_week=6,
            revision_buffer_days=5,
            break_interval_minutes=25,
            learning_pace="moderate",
            target_grade_goal="A",
            onboarding_completed=True
        )
        db.add(profile)

        # 3. Subjects
        physics = Subject(
            user_id=user.id,
            name="Physics",
            code="PHY101",
            color_code="#3B82F6",
            difficulty_rating=4
        )
        maths = Subject(
            user_id=user.id,
            name="Mathematics",
            code="MTH201",
            color_code="#8B5CF6",
            difficulty_rating=4
        )
        chemistry = Subject(
            user_id=user.id,
            name="Chemistry",
            code="CHM102",
            color_code="#10B981",
            difficulty_rating=3
        )
        db.add_all([physics, maths, chemistry])
        db.commit()
        db.refresh(physics)
        db.refresh(maths)
        db.refresh(chemistry)

        # 4. Sample Document & Hierarchical Syllabus for Physics
        physics_hierarchy = {
            "subject": "Physics",
            "total_chapters": 3,
            "total_topics": 6,
            "total_pages": 110,
            "chapters": [
                {
                    "chapter_number": 1,
                    "chapter_title": "Electric Charges and Fields",
                    "page_start": 1,
                    "page_end": 35,
                    "estimated_study_minutes": 180,
                    "topics": [
                        {
                            "topic_id": "1.1",
                            "title": "Coulomb's Law & Electric Fields",
                            "page_start": 1,
                            "page_end": 18,
                            "subtopics": ["Electric Charge Properties", "Superposition Principle"],
                            "estimated_minutes": 50
                        },
                        {
                            "topic_id": "1.2",
                            "title": "Gauss's Law and Flux",
                            "page_start": 19,
                            "page_end": 35,
                            "subtopics": ["Electric Flux", "Gaussian Surfaces & Applications"],
                            "estimated_minutes": 55
                        }
                    ]
                },
                {
                    "chapter_number": 2,
                    "chapter_title": "Electrostatic Potential & Capacitance",
                    "page_start": 36,
                    "page_end": 70,
                    "estimated_study_minutes": 180,
                    "topics": [
                        {
                            "topic_id": "2.1",
                            "title": "Equipotential Surfaces & Potential Energy",
                            "page_start": 36,
                            "page_end": 52,
                            "subtopics": ["Potential due to Point Charges", "Dipole in External Field"],
                            "estimated_minutes": 45
                        },
                        {
                            "topic_id": "2.2",
                            "title": "Capacitors & Dielectrics",
                            "page_start": 53,
                            "page_end": 70,
                            "subtopics": ["Parallel Plate Capacitor", "Energy Stored in Capacitor"],
                            "estimated_minutes": 50
                        }
                    ]
                },
                {
                    "chapter_number": 3,
                    "chapter_title": "Current Electricity & Circuits",
                    "page_start": 71,
                    "page_end": 110,
                    "estimated_study_minutes": 200,
                    "topics": [
                        {
                            "topic_id": "3.1",
                            "title": "Ohm's Law, Drift Velocity & Resistance",
                            "page_start": 71,
                            "page_end": 90,
                            "subtopics": ["Resistivity & Temperature Dependence", "Color Code"],
                            "estimated_minutes": 45
                        },
                        {
                            "topic_id": "3.2",
                            "title": "Kirchhoff's Rules & Bridge Circuits",
                            "page_start": 91,
                            "page_end": 110,
                            "subtopics": ["Wheatstone Bridge", "Potentiometer Principles"],
                            "estimated_minutes": 55
                        }
                    ]
                }
            ],
            "summary_markdown": "# Physics Coursework Index\n- Chapter 1: Electric Charges and Fields (pp. 1-35)\n- Chapter 2: Electrostatic Potential (pp. 36-70)\n- Chapter 3: Current Electricity (pp. 71-110)"
        }

        doc = TextbookDocument(
            subject_id=physics.id,
            file_name="Physics_Coursework_Textbook.pdf",
            file_path="uploads/demo_physics.pdf",
            file_size=1024 * 1024 * 8, # 8 MB
            total_pages=110,
            status="ready"
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        h_record = DocumentHierarchy(
            document_id=doc.id,
            subject_id=physics.id,
            structure_json=physics_hierarchy,
            summary_markdown=physics_hierarchy["summary_markdown"],
            total_chapters=3,
            total_topics=6
        )
        db.add(h_record)
        db.commit()

        # 5. Upcoming Exams
        today = date.today()
        exam1 = Exam(
            user_id=user.id,
            subject_id=physics.id,
            title="Physics Midterm Examination",
            exam_date=today + timedelta(days=12),
            exam_type="Midterm",
            total_marks=60,
            subject_ids_json=[physics.id],
            subject_scopes_json={physics.id: [1, 2, 3]},
            target_chapters_json=[1, 2, 3],
            weight_priority=4,
            notes="Chapters 1-3 on syllabus"
        )
        exam2 = Exam(
            user_id=user.id,
            subject_id=maths.id,
            title="Combined STEM Term Finals",
            exam_date=today + timedelta(days=26),
            exam_type="Final",
            total_marks=100,
            subject_ids_json=[maths.id, chemistry.id],
            subject_scopes_json={maths.id: [1, 2, 3], chemistry.id: [1, 2]},
            target_chapters_json=[1, 2, 3, 4],
            weight_priority=5,
            notes="Comprehensive finals across Maths & Chemistry"
        )
        db.add_all([exam1, exam2])
        db.commit()

        # 6. Generate Initial Study Schedule
        ScheduleEngine.generate_schedule(
            db=db,
            user=user,
            title="Alex's Midterm Master Plan"
        )
        logger.info("Demo student account successfully seeded!")
    except Exception as e:
        logger.error(f"Error seeding demo user: {e}")
        db.rollback()
    finally:
        db.close()

def parse_dt(v):
    if not v:
        return None
    if isinstance(v, datetime):
        return v
    try:
        return datetime.fromisoformat(v)
    except Exception:
        return None

def parse_d(v):
    if not v:
        return None
    if isinstance(v, date):
        return v
    try:
        return date.fromisoformat(v)
    except Exception:
        return None

def seed_dhruv_users():
    seed_file = os.path.join(os.path.dirname(__file__), "seed_dhruv_data.json")
    if not os.path.exists(seed_file):
        logger.warning(f"Seed file not found: {seed_file}")
        return

    db = SessionLocal()
    try:
        with open(seed_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        # 1. Users
        for u in data.get("users", []):
            if not db.query(User).filter(User.id == u["id"]).first():
                db.add(User(
                    id=u["id"],
                    email=u["email"],
                    hashed_password=u["hashed_password"],
                    full_name=u["full_name"],
                    created_at=parse_dt(u.get("created_at")) or datetime.utcnow()
                ))
        db.commit()

        # 2. Profiles
        for p in data.get("student_profiles", []):
            if not db.query(StudentProfile).filter(StudentProfile.id == p["id"]).first():
                db.add(StudentProfile(
                    id=p["id"],
                    user_id=p["user_id"],
                    daily_weekday_hours=p.get("daily_weekday_hours", 3.0),
                    daily_weekend_hours=p.get("daily_weekend_hours", 5.0),
                    preferred_time_slot=p.get("preferred_time_slot", "evening"),
                    study_days_per_week=p.get("study_days_per_week", 6),
                    revision_buffer_days=p.get("revision_buffer_days", 5),
                    break_interval_minutes=p.get("break_interval_minutes", 25),
                    learning_pace=p.get("learning_pace", "moderate"),
                    target_grade_goal=p.get("target_grade_goal", "A"),
                    onboarding_completed=bool(p.get("onboarding_completed", True))
                ))
        db.commit()

        # 3. Subjects
        for s in data.get("subjects", []):
            if not db.query(Subject).filter(Subject.id == s["id"]).first():
                db.add(Subject(
                    id=s["id"],
                    user_id=s["user_id"],
                    name=s["name"],
                    code=s.get("code", ""),
                    color_code=s.get("color_code", "#3B82F6"),
                    difficulty_rating=s.get("difficulty_rating", 3)
                ))
        db.commit()

        # 4. Exams
        for e in data.get("exams", []):
            if not db.query(Exam).filter(Exam.id == e["id"]).first():
                db.add(Exam(
                    id=e["id"],
                    user_id=e["user_id"],
                    subject_id=e.get("subject_id"),
                    title=e["title"],
                    exam_date=parse_d(e.get("exam_date")),
                    exam_type=e.get("exam_type", "Final"),
                    total_marks=e.get("total_marks", 100),
                    subject_ids_json=e.get("subject_ids_json", []),
                    subject_scopes_json=e.get("subject_scopes_json", {}),
                    target_chapters_json=e.get("target_chapters_json", []),
                    weight_priority=e.get("weight_priority", 3),
                    notes=e.get("notes"),
                    is_completed=bool(e.get("is_completed", False))
                ))
        db.commit()

        # 5. Documents
        for d in data.get("textbook_documents", []):
            if not db.query(TextbookDocument).filter(TextbookDocument.id == d["id"]).first():
                db.add(TextbookDocument(
                    id=d["id"],
                    subject_id=d["subject_id"],
                    file_name=d["file_name"],
                    file_path=d.get("file_path", ""),
                    file_size=d.get("file_size", 0),
                    total_pages=d.get("total_pages", 0),
                    upload_date=parse_dt(d.get("upload_date")) or datetime.utcnow(),
                    status=d.get("status", "ready")
                ))
        db.commit()

        # 6. Hierarchies
        for h in data.get("document_hierarchies", []):
            if not db.query(DocumentHierarchy).filter(DocumentHierarchy.id == h["id"]).first():
                db.add(DocumentHierarchy(
                    id=h["id"],
                    document_id=h["document_id"],
                    subject_id=h["subject_id"],
                    structure_json=h["structure_json"],
                    summary_markdown=h.get("summary_markdown", ""),
                    total_chapters=h.get("total_chapters", 0),
                    total_topics=h.get("total_topics", 0)
                ))
        db.commit()

        # 7. Schedules
        for sc in data.get("study_schedules", []):
            if not db.query(StudySchedule).filter(StudySchedule.id == sc["id"]).first():
                db.add(StudySchedule(
                    id=sc["id"],
                    user_id=sc["user_id"],
                    exam_id=sc.get("exam_id"),
                    title=sc["title"],
                    start_date=parse_d(sc.get("start_date")),
                    target_completion_date=parse_d(sc.get("target_completion_date")),
                    total_hours_allocated=sc.get("total_hours_allocated", 0.0),
                    status=sc.get("status", "active"),
                    created_at=parse_dt(sc.get("created_at")) or datetime.utcnow()
                ))
        db.commit()

        # 8. Schedule Tasks
        for t in data.get("schedule_tasks", []):
            if not db.query(ScheduleTask).filter(ScheduleTask.id == t["id"]).first():
                db.add(ScheduleTask(
                    id=t["id"],
                    schedule_id=t["schedule_id"],
                    user_id=t["user_id"],
                    subject_id=t["subject_id"],
                    scheduled_date=parse_d(t.get("scheduled_date")),
                    chapter_title=t.get("chapter_title", ""),
                    topic_title=t.get("topic_title", ""),
                    subtopic_title=t.get("subtopic_title"),
                    page_start=t.get("page_start"),
                    page_end=t.get("page_end"),
                    estimated_minutes=t.get("estimated_minutes", 30),
                    status=t.get("status", "pending"),
                    is_revision=bool(t.get("is_revision", False)),
                    completed_at=parse_dt(t.get("completed_at")),
                    notes=t.get("notes")
                ))
        db.commit()

        # 9. Chat Sessions
        for cs in data.get("chat_sessions", []):
            if not db.query(ChatSession).filter(ChatSession.id == cs["id"]).first():
                db.add(ChatSession(
                    id=cs["id"],
                    user_id=cs["user_id"],
                    title=cs.get("title", "Study Guidance"),
                    created_at=parse_dt(cs.get("created_at")) or datetime.utcnow()
                ))
        db.commit()

        # 10. Chat Messages
        for cm in data.get("chat_messages", []):
            if not db.query(ChatMessage).filter(ChatMessage.id == cm["id"]).first():
                db.add(ChatMessage(
                    id=cm["id"],
                    session_id=cm["session_id"],
                    role=cm["role"],
                    content=cm["content"],
                    citations=cm.get("citations", []),
                    created_at=parse_dt(cm.get("created_at")) or datetime.utcnow()
                ))
        db.commit()
        logger.info("Direct push of dhruvmodi accounts successfully completed!")
    except Exception as e:
        logger.error(f"Error seeding dhruv accounts: {e}")
        db.rollback()
    finally:
        db.close()
