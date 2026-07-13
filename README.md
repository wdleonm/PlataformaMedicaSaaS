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
├── .ai-dlc/            # Archivos de control y estado de la metodología AI-DLC
├── backend/            # API REST construida con FastAPI (Python)
├── frontend/           # Aplicación web construida con Next.js 14 (TypeScript)
├── docker/             # Orquestación y archivos de configuración de Docker
├── scripts/            # Migraciones de base de datos SQL y herramientas auxiliares
├── VITALNEXUS_FUNCIONALIDADES.md  # Documentación funcional completa y detalle de módulos
├── VITALNEXUS_NOTEBOOKLM_PACK.md  # Pack de recursos comerciales y guión de demostración
└── MEJORAS_Y_CORRECCIONES.md      # Historial de cambios y metas alcanzadas
```

---

## 🤖 Metodología de Desarrollo (AI-DLC)

Este proyecto se desarrolla y optimiza bajo el marco metodológico **AI-DLC (Artificial Intelligence Development Life Cycle)**, estructurado de la siguiente forma:
- **Inception:** Requerimientos validados en `requerimientos/` y diagramas de base de datos.
- **Construction (Refactoring):** Completada la fusión de la estética *Stitch Clinical Precision* (Modo Claro/Oscuro, Glassmorphism, micro-interacciones avanzadas) directamente a la rama principal `main`.
- **Operations:** Automatización del despliegue en EasyPanel (VPS) y configuración de observabilidad/telemetría.

El archivo de control de estado local para agentes y desarrolladores se ubica en [`.ai-dlc/aidlc-state.md`](file:///.ai-dlc/aidlc-state.md).

---

## 📚 Documentación Comercial y Demos
Si buscas información sobre las funcionalidades de la plataforma para presentaciones, demos o marketing, consulta:
- [Documentación Completa de Funcionalidades](./VITALNEXUS_FUNCIONALIDADES.md)
- [Pack Complementario para NotebookLM](./VITALNEXUS_NOTEBOOKLM_PACK.md)

---

*Desarrollado con enfoque en escalabilidad, seguridad de grado médico y metodologías ágiles asistidas por IA.* 🏥🖖
