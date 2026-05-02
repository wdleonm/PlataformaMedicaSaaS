# Requisitos de Instalación para PlataformaMédicaSaaS

Este documento detalla las herramientas, lenguajes, librerías y extensiones necesarias para configurar y ejecutar el proyecto en una máquina nueva. El proyecto se divide en dos partes principales: un **Backend** (Python/FastAPI) que corre en el puerto 8001, y un **Frontend** (Node.js/Next.js) que corre en el puerto 3000.

---

## 1. Herramientas Base del Sistema Operativo

Para que todo el entorno funcione adecuadamente en Windows, debes instalar el siguiente software base:

- **Git**: Necesario para el control de versiones y, eventualmente, la descarga de repositorios.
- **Visual Studio Code (Recomendado)**: El editor de código ideal para este stack.
  - **Extensiones Sugeridas para VS Code**:
    - _Python_ (de Microsoft): Para el soporte de Python en el backend.
    - _Pylance_ (de Microsoft): Para autocompletado y análisis de código en Python.
    - _ESLint_ (de Microsoft): Para el análisis de código estático del Frontend.
    - _Tailwind CSS IntelliSense_: Para autocompletado de clases Tailwind en el Frontend.
    - _Prettier - Code formatter_: Para el formateo automático del código.

> [!WARNING]
> **Error de Políticas de Ejecución en PowerShell (Windows)**
> Si al intentar ejecutar `npm install` o activar el entorno virtual de Python recibes un error en rojo que dice: _"No se puede cargar el archivo... porque la ejecución de scripts está deshabilitada en este sistema"_, debes habilitar la ejecución de scripts.
>
> **Solución rápida:**
> Abre PowerShell como Administrador y ejecuta este comando:
> `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`
> Escribe `S` (o `Y`) y presiona Enter para confirmar. Luego cierra esa terminal e inténtalo de nuevo en tu terminal habitual.

---

## 2. Requisitos del Backend (Puerto 8001)

El backend está desarrollado en **Python** utilizando **FastAPI** y se conecta a una base de datos relacional.

### Software a instalar:

- **Python**: Versión 3.10 o superior. _(IMPORTANTE: Asegúrate de marcar la casilla "Add Python to PATH" durante la instalación)._
- **PostgreSQL**: Motor de base de datos (se deduce por el uso de la librería `psycopg2-binary`).

### Librerías de Python requeridas:

Estas librerías se instalarán automáticamente en un entorno virtual (`.venv`) a través del archivo `requirements.txt`. Las principales son:

- `fastapi` (>=0.109.0) y `uvicorn[standard]` (>=0.27.0): Para crear y correr la API REST.
- `pydantic` (>=2.5.0): Para la validación de datos.
- `sqlmodel` (>=0.0.14) y `alembic` (>=1.13.0): Para el ORM y las migraciones de base de datos.
- `psycopg2-binary` (>=2.9.9): Adaptador para conectar Python a PostgreSQL.
- Otras librerías auxiliares: `python-jose`, `passlib`, `bcrypt`, `httpx`, `apscheduler`, `beautifulsoup4`.

---

## 3. Requisitos del Frontend (Puerto 3000)

El frontend está desarrollado en **React** utilizando el framework **Next.js** y **TypeScript**.

### Software a instalar:

- **Node.js**: Se recomienda la versión LTS actual (v18.17.0 o superior, por ejemplo v20.x). Esto instalará automáticamente el gestor de paquetes `npm`.

### Librerías de Node / Dependencias:

Estas se definen en el archivo `package.json` y se instalan automáticamente mediante `npm`. Las principales son:

- `next` (v14.2.0)
- `react` y `react-dom` (v18.2.0)
- `tailwindcss` (v3.4.0) y `framer-motion`: Para estilos y animaciones.
- `axios` (v1.13.6): Para la comunicación con el Backend.
- `typescript` (v5.x): Para el tipado del código.

---

## 4. Pasos para la Primera Ejecución en la Máquina Nueva

Dado que el código ya existe, en tu nueva máquina solo necesitas restablecer las dependencias antes de usar tus `.bat`. Abre una terminal en la raíz del proyecto (`PlataformaMedicaSaaS`) y ejecuta los siguientes pasos:

### Para el Backend:

```cmd
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

_(No olvides configurar tu base de datos PostgreSQL y las credenciales en el archivo `.env` del backend basándote en el archivo `.env.example` si es la primera vez que configuras la BD)._

### Para el Frontend:

```cmd
cd frontend
npm install
```

### Ejecución habitual:

Una vez realizados estos pasos de instalación inicial por primera (y única) vez, ya podrás hacer doble clic en `run_backend.bat` y `run_frontend.bat` de forma habitual para iniciar los servicios en los puertos 8001 y 3000, respectivamente.

---

## 5. Implementación de Autenticación con Google (Próximos Pasos)

Si deseas implementar el inicio de sesión con Google, necesitarás instalar librerías adicionales tanto en el Backend como en el Frontend para manejar el protocolo OAuth2 y verificar los tokens de forma segura.

### Para el Frontend (Next.js):

La forma más sencilla de integrar el botón de Google y obtener el token es usando la librería oficial para React.

```cmd
cd frontend
npm install @react-oauth/google
```

_(Alternativamente, podrías usar `next-auth`, pero si tu backend principal está en FastAPI, `@react-oauth/google` es mucho más directo para enviarle el token al backend)._

### Para el Backend (FastAPI):

Una vez que el Frontend recibe el token de Google, se lo envía al Backend. El Backend necesita verificar matemáticamente que ese token fue realmente emitido por Google y no ha sido alterado.

```cmd
cd backend
.venv\Scripts\activate
pip install google-auth
```

_(Esta librería te permitirá usar la función `id_token.verify_oauth2_token` de Google para validar la identidad del usuario)._
