from datetime import datetime, timedelta
from typing import List
from app.models.schedule import ScheduleTask

def generate_ics_calendar(tasks: List[ScheduleTask], schedule_title: str) -> str:
    """
    Generates standard iCalendar (.ics) content from a list of study tasks.
    """
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//StudyOrbit//Student Study Companion//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        f"X-WR-CALNAME:{schedule_title}",
    ]

    now_str = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")

    for task in tasks:
        # Default study start time: 10:00 AM on scheduled_date
        task_date = task.scheduled_date
        start_dt = datetime.combine(task_date, datetime.min.time()).replace(hour=10, minute=0)
        end_dt = start_dt + timedelta(minutes=task.estimated_minutes or 45)
        
        dtstart = start_dt.strftime("%Y%m%dT%H%M%SZ")
        dtend = end_dt.strftime("%Y%m%dT%H%M%SZ")
        uid = f"task-{task.id}@studyorbit.local"

        summary = f"[{'REVISION' if task.is_revision else 'STUDY'}] {task.chapter_title}: {task.topic_title}"
        pages_info = f" (Pages {task.page_start}-{task.page_end})" if task.page_start else ""
        description = f"Study Block: {task.topic_title}{pages_info}\\nEstimated duration: {task.estimated_minutes} min\\nStatus: {task.status}"

        lines.extend([
            "BEGIN:VEVENT",
            f"UID:{uid}",
            f"DTSTAMP:{now_str}",
            f"DTSTART:{dtstart}",
            f"DTEND:{dtend}",
            f"SUMMARY:{summary}",
            f"DESCRIPTION:{description}",
            "STATUS:CONFIRMED",
            "END:VEVENT"
        ])

    lines.append("END:VCALENDAR")
    return "\r\n".join(lines)
