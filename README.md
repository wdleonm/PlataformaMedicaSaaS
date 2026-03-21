# VitalNexus | Medical SaaS Platform 🏥

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Deployment-Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

**VitalNexus** es una plataforma SaaS (Software as a Service) de alto rendimiento diseñada específicamente para especialistas de la salud. Combina una arquitectura técnica robusta con una experiencia de usuario premium para la gestión clínica, administrativa y financiera.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
|------|-------------|
| **Backend** | Python 3.10+, FastAPI, SQLModel (Pydantic + SQLAlchemy), Alembic. |
| **Frontend** | React 18, Next.js 14 (App Router), Tailwind CSS, Framer Motion, Lucide Icons. |
| **Base de Datos** | PostgreSQL (Relacional) con Row Level Security (RLS). |
| **Infraestructura** | Docker, Docker Compose, Redis (Caché/Queue), APScheduler. |
| **Comunicaciones** | YCloud API (WhatsApp Marketing/Automations). |

---

## 🏗️ Arquitectura y Seguridad

El proyecto destaca por su enfoque en la seguridad de los datos sensibles y el aislamiento de información entre especialistas:

1. **Multi-Tenancy con RLS**: No se utiliza una base de datos por cliente. Se implementa un esquema compartido donde el **aislamiento** está garantizado a nivel de motor de base de datos mendiante **PostgreSQL Row Level Security (RLS)**. Cada transacción inyecta el `especialista_id` activo, asegurando que un doctor nunca vea datos de otro.
2. **Identificadores Únicos**: Uso de **UUID v4** en todas las llaves primarias para prevenir ataques de enumeración y facilitar migraciones futuras.
3. **Manejo de Sesión**: Autenticación asincrónica con JWT y detección de inactividad inteligente en el frontend.

---

## ✨ Características Principales

### 🦷 Odontograma Evolutivo 360°
Sistema visual único que permite reconstruir el estado dental del paciente en cualquier punto del tiempo. No sobreescribe datos; genera un histórico inmutable por pieza y cara.

### 💰 Motor de Rentabilidad Real
Cálculo automático de utilidad neta basado en el costo de insumos vs. precio de venta por servicio. Integrado con gestión de inventario en tiempo real.

### 📋 Historias Clínicas Modulares
Arquitectura dinámica que permite adaptar los campos de la historia clínica según la especialidad del médico (Odontología, Medicina Interna, etc.) cargando componentes UI de forma asíncrona.

### 💳 Gestión de Planes de Pago
Control total de presupuestos y abonos con actualización de saldo pendiente automatizada mediante triggers de base de datos.

---

## 🚀 Instalación Rápida (Entorno de Desarrollo)

### Requisitos
- Docker y Docker Compose
- Node.js 18+ (opcional para desarrollo local sin docker)

### Pasos
1. Clonar el repositorio:
   ```bash
   git clone https://github.com/wdleonm/PlataformaMedicaSaaS.git
   cd PlataformaMedicaSaaS
   ```

2. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   ```

3. Levantar servicios:
   ```bash
   docker compose -f docker/docker-compose.yml up -d
   ```

4. Acceder:
   - Frontend: `http://localhost:3000`
   - Backend Docs (Swagger): `http://localhost:8001/docs`

---

## 📂 Estructura del Proyecto

```text
PlataformaMedicaSaaS/
├── backend/            # FastAPI Project (Python)
├── frontend/           # Next.js 14 Application (TypeScript)
├── docker/             # Docker configuration and orchestration
├── scripts/            # Database migrations and helper scripts
└── MEJORAS_Y_CORRECCIONES.md  # Change log and milestones
```

---

*Desarrollado con enfoque en escalabilidad y seguridad de grado médico.* 🖖
