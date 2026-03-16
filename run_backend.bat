@echo off
echo Arrancando Backend de Odonto-Focus...
cd backend
..\.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
pause
