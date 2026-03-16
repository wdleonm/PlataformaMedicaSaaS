# 🚀 Guía de Sincronización y Arranque Local

Para evitar que el backend falle al cambiar de equipo o después de un `git pull`, sigue estos pasos:

## 1. Sincronización (Solo si hay cambios)
Cada vez que cambies de equipo o descargues cambios nuevos, asegúrate de que las librerías estén al día:
1. Abre una terminal en la carpeta raíz del proyecto.
2. Si ves que el archivo `backend/requirements.txt` ha cambiado, ejecuta:
   ```powershell
   cd backend
   ..\.venv\Scripts\python -m pip install -r requirements.txt
   ```

## 2. Arranque Rápido
He creado dos archivos de automatización (`.bat`) en la raíz del proyecto para que no tengas que escribir comandos:

*   **Backend**: Haz doble clic en `run_backend.bat`. 
    *   *Usa automáticamente el entorno virtual y el puerto 8001.*
*   **Frontend**: Haz doble clic en `run_frontend.bat`.
    *   *Levanta el servidor de Next.js.*

---

## 💡 Notas Importantes
*   **Entorno Virtual**: No necesitas activar el entorno manualmente (`activate`), los scripts `.bat` ya apuntan directamente al Python de la carpeta `.venv`.
*   **Puerto**: El backend está configurado para correr en el puerto **8001** para evitar conflictos con otros servicios locales (como XAMPP).
*   **Librerías**: Si agregas una librería nueva en un equipo, recuerda hacer `pip freeze > requirements.txt` y subir ese archivo al repositorio.
