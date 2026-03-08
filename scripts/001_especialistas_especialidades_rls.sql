-- Odonto-Focus | Fase 1: Especialidades, Especialistas y RLS
-- Ejecutar como superusuario o dueño de la base de datos.
-- Requiere extensión uuid-ossp (habitualmente ya disponible).

-- Database: analytics

-- DROP DATABASE IF EXISTS analytics;

CREATE DATABASE analytics
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'es-ES'
    LC_CTYPE = 'es-ES'
    LOCALE_PROVIDER = 'libc'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1
    IS_TEMPLATE = False;

-- 1. Crear el esquema
CREATE SCHEMA IF NOT EXISTS sys_config AUTHORIZATION postgres;

-- 2. Asegurar que las extensiones se creen en el esquema público (recomendado) 
-- o especificar la ruta en las funciones.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ajustar el search_path para que todo se cree en sys_config por defecto en esta sesión
SET search_path TO sys_config, public;

-- =============================================================================
-- 1. Tabla: especialidades
-- =============================================================================
CREATE TABLE IF NOT EXISTS sys_config.especialidades (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre      VARCHAR(120) NOT NULL,
    codigo      VARCHAR(20) NOT NULL UNIQUE,
    descripcion TEXT,
    activo      BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 2. Tabla: especialistas (RLS activo)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sys_config.especialistas (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    nombre         VARCHAR(120) NOT NULL,
    apellido       VARCHAR(120) NOT NULL,
    activo         BOOLEAN NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sys_config.especialistas ENABLE ROW LEVEL SECURITY;

-- Políticas corregidas especificando el esquema
CREATE POLICY especialistas_isolate ON sys_config.especialistas
    FOR ALL USING (id = current_setting('app.especialista_id', true)::uuid);

CREATE POLICY especialistas_insert ON sys_config.especialistas
    FOR INSERT WITH CHECK (true);

-- =============================================================================
-- 3. Tabla: especialista_especialidades (N:N)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sys_config.especialista_especialidades (
    especialista_id  UUID NOT NULL REFERENCES sys_config.especialistas(id) ON DELETE CASCADE,
    especialidad_id UUID NOT NULL REFERENCES sys_config.especialidades(id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (especialista_id, especialidad_id)
);

ALTER TABLE sys_config.especialista_especialidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY especialista_especialidades_tenant ON sys_config.especialista_especialidades
    FOR ALL USING (especialista_id = current_setting('app.especialista_id', true)::uuid);

CREATE POLICY especialista_especialidades_insert ON sys_config.especialista_especialidades
    FOR INSERT WITH CHECK (true);

-- =============================================================================
-- 4. Función de Trigger (dentro de sys_config)
-- =============================================================================
CREATE OR REPLACE FUNCTION sys_config.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Asignación de Triggers
CREATE TRIGGER especialistas_updated_at
    BEFORE UPDATE ON sys_config.especialistas
    FOR EACH ROW EXECUTE PROCEDURE sys_config.set_updated_at();

CREATE TRIGGER especialidades_updated_at
    BEFORE UPDATE ON sys_config.especialidades
    FOR EACH ROW EXECUTE PROCEDURE sys_config.set_updated_at();

-- =============================================================================
-- 5. Tabla: odontograma_hallazgos
-- =============================================================================
CREATE TABLE IF NOT EXISTS sys_config.odontograma_hallazgos (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo              VARCHAR(30) NOT NULL UNIQUE,
    nombre              VARCHAR(80) NOT NULL,
    categoria           VARCHAR(20) NOT NULL CHECK (categoria IN ('patologia', 'restauracion', 'estado')),
    descripcion_visual  VARCHAR(200),
    activo              BOOLEAN NOT NULL DEFAULT true,
    orden               SMALLINT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_odontograma_hallazgos_categoria ON sys_config.odontograma_hallazgos (categoria);

CREATE TRIGGER odontograma_hallazgos_updated_at
    BEFORE UPDATE ON sys_config.odontograma_hallazgos
    FOR EACH ROW EXECUTE PROCEDURE sys_config.set_updated_at();

-- =============================================================================
-- 6. Inserción de Datos (Data Seeding)
-- =============================================================================
INSERT INTO sys_config.especialidades (nombre, codigo, descripcion) VALUES
    ('Odontología General', 'ODO_GEN', 'Prevención y diagnóstico.'),
    ('Cirugía Maxilofacial', 'ODO_MAX', 'Cirugías de cara y boca.'),
    ('Endodoncia', 'ODO_END', 'Tratamientos de conducto.'),
    ('Ortodoncia', 'ODO_ORT', 'Corrección dental.'),
    ('Medicina General', 'MED_GEN', 'Consulta primaria.')
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;

INSERT INTO sys_config.odontograma_hallazgos (codigo, nombre, categoria, descripcion_visual, orden) VALUES
    ('SANO', 'Sano', 'estado', 'Sin marcas.', 0),
    ('CARIES', 'Caries', 'patologia', 'Mancha roja.', 10),
    ('RESINA_OBT', 'Resina', 'restauracion', 'Área azul.', 50)
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
