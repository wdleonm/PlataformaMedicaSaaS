# Guía de Inicio del Proyecto (Local)

Este documento detalla los pasos para levantar el proyecto localmente con tu instalación de PostgreSQL física.

## Orden de Arranque
1. **Base de Datos** (Asegúrate de que el servicio PostgreSQL esté corriendo).
2. **Backend** (FastAPI).
3. **Frontend** (Next.js).
---

## Paso 1: Verificar la Base de Datos
Asegúrate de que tu PostgreSQL local está activo:
- Abre el "Administrador de Tareas" -> pestaña "Servicios" y busca `postgresql-x64-16` (o tu versión). Debe estar en estado "En ejecución".
- O simplemente abre **pgAdmin 4** para verificar que puedes conectar.
---


## Pasos resumidos para reiniciar el proyecto:

# Primero validemos los puertos ocupados 
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Segundo liberamos 
taskkill /F /PID 21404
taskkill /F /PID 6036


# Backend:
Abre una terminal en la raíz del proyecto. Activa el entorno: 
C:\xampp\htdocs\github\PlataformaMedicaSaaS\backend>
ejecuta= python -m uvicorn app.main:app --host 127.0.0.1 --port 8001

# Frontend:
Abre otra terminal en C:\xampp\htdocs\github\PlataformaMedicaSaaS\frontend
ejecuta = npm run dev