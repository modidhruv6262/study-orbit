import logging
from datetime import date, timedelta
from app.database import SessionLocal
from app.models.user import User
from app.models.student_profile import StudentProfile
from app.models.subject import Subject
from app.models.document import TextbookDocument, DocumentHierarchy
from app.models.exam import Exam
from app.services.auth_service import hash_password
from app.services.schedule_engine import ScheduleEngine

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
