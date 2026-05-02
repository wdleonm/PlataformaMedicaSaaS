@echo off
echo Limpiando puerto 8001 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8001') do taskkill /f /pid %%a 2>nul
echo.
echo Arrancando Backend de VitalNexus...
cd backend
.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
pause
