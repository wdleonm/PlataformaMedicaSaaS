@echo off
echo Limpiando puerto 3000 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do taskkill /f /pid %%a 2>nul
echo.
echo Arrancando Frontend de VitalNexus...
cd frontend
npm run dev
pause
