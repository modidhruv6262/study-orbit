import math
from datetime import date, timedelta, datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.student_profile import StudentProfile
from app.models.subject import Subject
from app.models.document import DocumentHierarchy
from app.models.exam import Exam
from app.models.schedule import StudySchedule, ScheduleTask

class ScheduleEngine:
    @staticmethod
    def generate_schedule(
        db: Session,
        user: User,
        exam_ids: Optional[List[str]] = None,
        start_date: Optional[date] = None,
        title: str = "Master Study Plan"
    ) -> StudySchedule:
        if not start_date:
            start_date = date.today()

        profile = user.profile
        if not profile:
            profile = StudentProfile(user_id=user.id)
            db.add(profile)
            db.commit()
            db.refresh(profile)

        # 1. Fetch relevant exams
        query = db.query(Exam).filter(Exam.user_id == user.id, Exam.exam_date >= start_date)
        if exam_ids:
            query = query.filter(Exam.id.in_(exam_ids))
        exams = query.order_by(Exam.exam_date.asc()).all()

        if not exams:
            # Create a default placeholder exam 30 days ahead if user hasn't added one yet
            subject = db.query(Subject).filter(Subject.user_id == user.id).first()
            if not subject:
                subject = Subject(user_id=user.id, name="General Coursework", color_code="#3B82F6", difficulty_rating=3)
                db.add(subject)
                db.commit()
                db.refresh(subject)
            
            default_exam = Exam(
                user_id=user.id,
                subject_id=subject.id,
                title="Upcoming Midterm Exam",
                exam_date=start_date + timedelta(days=30),
                exam_type="Midterm",
                weight_priority=3
            )
            db.add(default_exam)
            db.commit()
            db.refresh(default_exam)
            exams = [default_exam]

        furthest_exam_date = max(e.exam_date for e in exams)
        target_completion = furthest_exam_date

        # Create master study schedule
        new_schedule = StudySchedule(
            user_id=user.id,
            exam_id=exams[0].id if len(exams) == 1 else None,
            title=title,
            start_date=start_date,
            target_completion_date=target_completion,
            status="active"
        )
        db.add(new_schedule)
        db.commit()
        db.refresh(new_schedule)

        # 2. Gather all units/topics that need to be studied
        tasks_pool = []
        for exam in exams:
            # Determine participating subjects for this exam
            participating_subjects = []
            if exam.subject_ids_json:
                participating_subjects = db.query(Subject).filter(
                    Subject.user_id == user.id,
                    Subject.id.in_(exam.subject_ids_json)
                ).all()
            elif exam.subject:
                participating_subjects = [exam.subject]
            else:
                participating_subjects = db.query(Subject).filter(Subject.user_id == user.id).all()

            scopes = exam.subject_scopes_json or {}

            for subject in participating_subjects:
                # Target chapters for this subject
                target_ch_nums = scopes.get(subject.id, [])
                if not target_ch_nums and exam.target_chapters_json:
                    target_ch_nums = exam.target_chapters_json

                # Check if this subject has a document hierarchy
                hierarchies = db.query(DocumentHierarchy).filter(DocumentHierarchy.subject_id == subject.id).all()
                topics_to_study = []

                if hierarchies:
                    for h in hierarchies:
                        structure = h.structure_json
                        chapters = structure.get("chapters", [])

                        for ch in chapters:
                            if not target_ch_nums or ch["chapter_number"] in target_ch_nums:
                                for top in ch.get("topics", []):
                                    topics_to_study.append({
                                        "subject_id": subject.id,
                                        "subject_name": subject.name,
                                        "chapter_title": ch["chapter_title"],
                                        "topic_title": top["title"],
                                        "subtopic_title": ", ".join(top.get("subtopics", []))[:150],
                                        "page_start": top.get("page_start"),
                                        "page_end": top.get("page_end"),
                                        "estimated_minutes": top.get("estimated_minutes", 45),
                                        "exam_date": exam.exam_date,
                                        "difficulty": subject.difficulty_rating or 3
                                    })

                # Fallback if no PDF uploaded yet
                if not topics_to_study:
                    default_count = len(target_ch_nums) if target_ch_nums else 4
                    for i in range(1, default_count + 1):
                        topics_to_study.append({
                            "subject_id": subject.id,
                            "subject_name": subject.name,
                            "chapter_title": f"Chapter {i}: Core Concepts",
                            "topic_title": f"Section {i}.1: Key Principles of {subject.name}",
                            "subtopic_title": "Formulas, Definitions, Worked Examples",
                            "page_start": (i - 1) * 20 + 1,
                            "page_end": i * 20,
                            "estimated_minutes": 50,
                            "exam_date": exam.exam_date,
                            "difficulty": subject.difficulty_rating or 3
                        })

                tasks_pool.extend(topics_to_study)

        # 3. Interleave and distribute across available calendar days
        # Sort by exam urgency, then subject difficulty
        tasks_pool.sort(key=lambda x: (x["exam_date"], -x["difficulty"]))

        curr_day = start_date
        total_tasks_count = len(tasks_pool)
        task_idx = 0
        total_allocated_minutes = 0

        created_tasks = []

        while task_idx < total_tasks_count and curr_day <= furthest_exam_date:
            # Check weekday vs weekend minutes budget
            is_weekend = curr_day.weekday() >= 5  # Sat/Sun
            hours_budget = profile.daily_weekend_hours if is_weekend else profile.daily_weekday_hours
            daily_minutes_limit = int(hours_budget * 60)
            
            # Leave one day off per week if study_days_per_week is 6
            if profile.study_days_per_week <= 6 and curr_day.weekday() == 6:  # Sunday off
                curr_day += timedelta(days=1)
                continue

            day_used_minutes = 0
            while day_used_minutes < daily_minutes_limit and task_idx < total_tasks_count:
                item = tasks_pool[task_idx]
                
                # Check if this topic's exam is in the future
                if curr_day >= item["exam_date"]:
                    task_idx += 1
                    continue

                task = ScheduleTask(
                    schedule_id=new_schedule.id,
                    user_id=user.id,
                    subject_id=item["subject_id"],
                    scheduled_date=curr_day,
                    chapter_title=item["chapter_title"],
                    topic_title=item["topic_title"],
                    subtopic_title=item["subtopic_title"],
                    page_start=item["page_start"],
                    page_end=item["page_end"],
                    estimated_minutes=item["estimated_minutes"],
                    status="pending",
                    is_revision=False
                )
                db.add(task)
                created_tasks.append(task)

                day_used_minutes += item["estimated_minutes"]
                total_allocated_minutes += item["estimated_minutes"]
                task_idx += 1

            curr_day += timedelta(days=1)

        # 4. Insert Spaced Revision blocks during buffer days before each exam
        for exam in exams:
            rev_subject_id = exam.subject_id
            if not rev_subject_id and exam.subject_ids_json:
                rev_subject_id = exam.subject_ids_json[0]
            if not rev_subject_id:
                any_s = db.query(Subject).filter(Subject.user_id == user.id).first()
                rev_subject_id = any_s.id if any_s else None

            if not rev_subject_id:
                continue

            rev_days = max(2, min(profile.revision_buffer_days, 7))
            for r in range(1, rev_days + 1):
                rev_date = exam.exam_date - timedelta(days=r)
                if rev_date >= start_date:
                    rev_task = ScheduleTask(
                        schedule_id=new_schedule.id,
                        user_id=user.id,
                        subject_id=rev_subject_id,
                        scheduled_date=rev_date,
                        chapter_title=f"Revision Phase: {exam.title}",
                        topic_title=f"Spaced Repetition & Practice Test #{r} ({exam.total_marks or 100} Marks Prep)",
                        subtopic_title="Review formula sheet, solve past questions, test recall",
                        page_start=1,
                        page_end=None,
                        estimated_minutes=60,
                        status="pending",
                        is_revision=True
                    )
                    db.add(rev_task)
                    total_allocated_minutes += 60

        new_schedule.total_hours_allocated = math.ceil(total_allocated_minutes / 60)
        db.commit()
        db.refresh(new_schedule)
        return new_schedule

    @staticmethod
    def rebalance_schedule(db: Session, schedule_id: str, user: User) -> StudySchedule:
        """
        Dynamically shifts overdue/uncompleted tasks to upcoming days.
        """
        schedule = db.query(StudySchedule).filter(
            StudySchedule.id == schedule_id,
            StudySchedule.user_id == user.id
        ).first()

        if not schedule:
            return None

        today = date.today()
        # Find all pending tasks that were scheduled prior to today
        overdue_tasks = db.query(ScheduleTask).filter(
            ScheduleTask.schedule_id == schedule_id,
            ScheduleTask.status == "pending",
            ScheduleTask.scheduled_date < today
        ).all()

        if not overdue_tasks:
            return schedule

        # Shift overdue tasks starting from today onwards
        profile = user.profile or StudentProfile(user_id=user.id)
        current_target_day = today
        
        for task in overdue_tasks:
            # Check how many tasks are already scheduled on current_target_day
            existing_count = db.query(ScheduleTask).filter(
                ScheduleTask.schedule_id == schedule_id,
                ScheduleTask.scheduled_date == current_target_day,
                ScheduleTask.status == "pending"
            ).count()

            # If current target day has more than 3 pending tasks, bump to next day
            if existing_count >= 3:
                current_target_day += timedelta(days=1)

            task.scheduled_date = min(current_target_day, schedule.target_completion_date)

        db.commit()
        db.refresh(schedule)
        return schedule
