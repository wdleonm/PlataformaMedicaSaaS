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



Este sistema por ahora solo será usando por odontologos o medicos con esta especialidas, los maxilofacilaesy ortodoncistas etc , pero claramente para un mediatra, un medico general, un cardiologo o un traumatologo la historia clinica pueden coincidir en los datos basicos pero no en los detalles propios como el odontograma que seguro no le sería util puede que coincidan algunas titulos como los antecdentes pero seguro no se evaluaran los mismos. Eneste sentido por ahora lo que tenemos es solo para odontologos, pero quiero que sea escalable para que en un futuro se pueda adaptar a otras especialidades, por lo que la historia clinica debe ser modular, es decir, que se pueda agregar o quitar secciones segun la especialidad, por ejemplo, si es un cardiologo, se le debe agregar la sección de electrocardiograma, si es un traumatologo, se le debe agregar la sección de radiografias, etc. creo que para ellos cuando se registre un médico en el sistema se le debe especificar la especuialidad y a las historias y datos que esmos diagramados hasta ahora tambien poder identificar que son para odontologos.

  Por otra parte yo sere el administrador del sistema, quien registrara los especialistas a los cuales les venda una subscr5ipción por el uso de este sistema, y para ello necesito un menu de administración donde yo pueda registrar a estos medicos y probablemente tener algunas opción de mantenimeinto sobre el mismo sistema, para ello se neecsita desarrollar este menu y se me ocurre que las tablas relacionadas a estas opciones pueden estar en un esquema aparte como sun sys_admin, sys_... algo o un nombre que prefieras pero que sea donde se guarden los datos  de las tablas que  neecsite, claro se que los especialisas se guardan en  sys_config.especialistas y esto esta bien pero no se si requieras otra cosa y se debe separar en un esquema o lo dejamos en ese mismo es solo para ordenar las cosas de la menjor manera 