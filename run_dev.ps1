# StudyOrbit - Simultaneous Development Server Launcher (Windows)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Starting StudyOrbit (Backend + Frontend) " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

# Detect Local Network IP
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254*" } | Select-Object -ExpandProperty IPAddress -First 1)

# 1. Start FastAPI Backend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .venv\Scripts\python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

# 2. Start Vite Frontend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host ""
Write-Host "Local URL:   http://localhost:5173" -ForegroundColor Yellow
if ($ip) {
    Write-Host "Network URL: http://${ip}:5173 (Open this on your mobile device!)" -ForegroundColor Cyan
}
Write-Host "API Swagger: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "Both servers are now running in separate windows!" -ForegroundColor Green
