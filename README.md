# StudyOrbit — Student Study Companion & Paced Scheduling Platform

> An intelligent, student-centric academic planner, hierarchical PDF syllabus indexer, and guardrailed study navigation companion.

---

## 🌟 Key Features

1. **User Authentication & Profiles**:
   - Secure student registration, login, JWT session handling, and hashed passwords.
   - Comprehensive student onboarding: weekday vs. weekend study hours, preferred time slots (Morning, Afternoon, Evening, Night), study days per week, and revision buffer days.

2. **Anti-Hallucination Coursework PDF Ingestion**:
   - Upload full-length multi-hundred page textbook PDFs.
   - Fast parser extracts Table of Contents and builds a **Canonical Hierarchical Index** (`Subject` $\rightarrow$ `Chapters` $\rightarrow$ `Topics` $\rightarrow$ `Subtopics` $\rightarrow$ `Exact Page Numbers` & `Estimated Study Minutes`).
   - The LLM and scheduling engine prioritize this structured summary layer as ground truth to eliminate hallucinations.

3. **Adaptive Exam Scheduling & Pacing Engine**:
   - Computes daily study blocks between today and your exam date.
   - Interleaves multiple subjects so students avoid fatigue and memory decay.
   - Reserves dedicated **Revision Buffer Days** before exams for practice tests and formula review.
   - **1-Click Dynamic Rebalance**: If you fall behind or miss a day, the engine seamlessly recalibrates remaining days without dropping topics.

4. **Guiding Study Companion Bot (Strict Guardrails)**:
   - **Policy**: Strictly refuses to explain academic concepts or solve homework equations directly.
   - Instead, guides the student by citing the exact chapter, topic, and page range in their textbook, recommending active study habits (Feynman technique, active recall, Cornell notes), and managing their schedule.

5. **First-Page Dashboard Overview**:
   - Exam countdown cards ("X Days Left" with urgency color-coding and syllabus progress bars).
   - Today's actionable checklist with page ranges, estimated minutes, and instant completion toggles.
   - Overall syllabus progress (%) and 7-day study adherence rate.
   - Built-in Focus / Pomodoro Study Timer (25m / 50m modes with celebratory confetti on completion).
   - Export timetable to standard iCalendar (`.ics`) for Google Calendar / Apple Calendar.

---

## 🚀 Quick Start Guide

### Option 1: One-Click Launch (Windows)
Double-click `run_dev.bat` or run in PowerShell:
```powershell
.\run_dev.ps1
```
This opens both the FastAPI backend and the Vite React frontend in separate windows.

### Option 2: Manual Launch

#### 1. Backend Setup:
```bash
cd backend
# Create virtual environment if not already created
uv venv .venv
# Activate virtual environment:
.venv\Scripts\activate
# Install requirements:
uv pip install -r requirements.txt
# Run FastAPI server:
python run.py
```
- API is running at: `http://localhost:8000`
- Interactive Swagger documentation: `http://localhost:8000/docs`

#### 2. Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```
- Open browser at: `http://localhost:5173`

---

## 🧪 Testing the Anti-Hallucination Guardrail & System

Run the automated integration test suite:
```bash
cd backend
.venv\Scripts\python test_suite.py
```
This runs 9 end-to-end tests verifying:
- Authentication & profile updates
- Subject creation & PDF TOC extraction
- Upcoming exam countdown calculations
- Study schedule generation & task completion
- **Strict Guardrail Bot Verification**: Confirms the bot refuses direct explanation when asked *"Explain Electric Charges and Coulomb's Law in detail"* and redirects to the exact textbook chapter & page numbers.
- iCalendar (.ics) export.
