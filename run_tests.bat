@echo off
echo ==========================================
echo Ejecutando Pruebas Unitarias - VitalNexus
echo ==========================================
echo.
cd backend
.venv\Scripts\pytest --cov=app tests/ -v
echo.
pause
