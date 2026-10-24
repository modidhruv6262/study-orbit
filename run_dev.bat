@echo off
echo Starting StudyOrbit Backend...
start "StudyOrbit Backend" cmd /k "cd backend && .venv\Scripts\python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo Starting StudyOrbit Frontend with Network Exposure...
start "StudyOrbit Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo StudyOrbit is running!
echo Local Link:   http://localhost:5173
echo Check the Frontend window for your exact Network IP Link (e.g. http://192.168.x.x:5173 or http://10.x.x.x:5173) to open on mobile.
echo.
