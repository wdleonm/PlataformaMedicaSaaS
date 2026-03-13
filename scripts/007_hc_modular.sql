-- Odonto-Focus | Fase 6: Historia Clínica Modular por Especialidad
-- Ejecutar sobre la base de datos: analytics
-- Requiere scripts 001, 002, 003, 004 y 005 aplicados previamente.
--
-- Esquemas usados:
--   sys_config  → tablas maestras (hc_secciones, especialidad_hc_secciones)
--   sys_clinical → columna especialidad_id en historias_clinicas

SET search_path TO sys_clinical, sys_config, public;

-- =============================================================================
-- 6.1a Tabla: hc_secciones (catálogo global de secciones disponibles)
-- Sin RLS — es un catálogo compartido entre todos los tenants.
-- =============================================================================
CREATE TABLE IF NOT EXISTS sys_config.hc_secciones (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo              VARCHAR(50) NOT NULL UNIQUE,       -- ej: 'ODONTOGRAMA', 'ECG', 'CONSULTA'
    nombre              VARCHAR(100) NOT NULL,
    descripcion         TEXT,
    componente_frontend VARCHAR(100) NOT NULL,             -- nombre del componente React a renderizar
    activo              BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE sys_config.hc_secciones IS
    'Catálogo global de secciones disponibles para Historias Clínicas. '
    'componente_frontend contiene el nombre del componente React (switch renderer en el modal).';

CREATE INDEX IF NOT EXISTS idx_hc_secciones_codigo  ON sys_config.hc_secciones (codigo);
CREATE INDEX IF NOT EXISTS idx_hc_secciones_activo  ON sys_config.hc_secciones (activo);

-- =============================================================================
-- 6.1b Tabla: especialidad_hc_secciones (N:N — especialidad ↔ secciones)
-- Define qué secciones pertenecen a cada especialidad y en qué orden aparecen.
-- Sin RLS — configuración global del sistema.
-- =============================================================================
CREATE TABLE IF NOT EXISTS sys_config.especialidad_hc_secciones (
    especialidad_id UUID NOT NULL REFERENCES sys_config.especialidades(id) ON DELETE CASCADE,
    hc_seccion_id   UUID NOT NULL REFERENCES sys_config.hc_secciones(id)   ON DELETE CASCADE,
    orden           SMALLINT NOT NULL DEFAULT 0,            -- posición del tab en el modal (1-based)
    obligatoria     BOOLEAN NOT NULL DEFAULT false,         -- si true, no puede omitirse al guardar
    PRIMARY KEY (especialidad_id, hc_seccion_id)
);

COMMENT ON TABLE sys_config.especialidad_hc_secciones IS
    'Configura las secciones de la Historia Clínica para cada especialidad. '
    'orden define el tab position; obligatoria indica si la sección es requerida.';

CREATE INDEX IF NOT EXISTS idx_esp_hc_sec_especialidad ON sys_config.especialidad_hc_secciones (especialidad_id);
CREATE INDEX IF NOT EXISTS idx_esp_hc_sec_orden        ON sys_config.especialidad_hc_secciones (especialidad_id, orden);

-- =============================================================================
-- 6.1c Columna especialidad_id en historias_clinicas (si no existe aún)
-- Registra a qué especialidad pertenece cada historia clínica.
-- =============================================================================
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'sys_clinical'
          AND table_name   = 'historias_clinicas'
          AND column_name  = 'especialidad_id'
    ) THEN
        ALTER TABLE sys_clinical.historias_clinicas
            ADD COLUMN especialidad_id UUID REFERENCES sys_config.especialidades(id) ON DELETE SET NULL;

        COMMENT ON COLUMN sys_clinical.historias_clinicas.especialidad_id IS
            'Especialidad bajo la que se creó esta historia clínica. '
            'Permite filtrar y reconstruir el modal dinámicamente.';

        CREATE INDEX IF NOT EXISTS idx_hc_especialidad
            ON sys_clinical.historias_clinicas (especialidad_id);
    END IF;
END $$;

-- =============================================================================
-- 6.2 Seed: secciones para odontología (primer seed del sistema)
-- Estas 5 secciones corresponden al flujo actual hardcodeado → ahora son datos.
-- =============================================================================

-- Insertar secciones del catálogo global (idempotente con ON CONFLICT DO NOTHING)
INSERT INTO sys_config.hc_secciones (id, codigo, nombre, descripcion, componente_frontend, activo)
VALUES
    (uuid_generate_v4(), 'CONSULTA',      'Consulta',      'Motivo de consulta y enfermedad actual',              'ConsultaStep',      true),
    (uuid_generate_v4(), 'ANTECEDENTES',  'Antecedentes',  'Antecedentes familiares y personales patológicos',   'AntecedentesStep',  true),
    (uuid_generate_v4(), 'EXAMEN_FISICO', 'Examen Físico', 'Examen clínico intraoral y estudios complementarios','ExamenFisicoStep',  true),
    (uuid_generate_v4(), 'ODONTOGRAMA',   'Odontograma',   'Odontograma evolutivo FDI integrado vía iframe',     'OdontogramaStep',   true),
    (uuid_generate_v4(), 'PLAN',          'Plan',          'Diagnóstico, plan de tratamiento y notas internas',  'PlanStep',          true)
ON CONFLICT (codigo) DO NOTHING;

-- Asociar las 5 secciones a la especialidad de Odontología.
-- Nota: se asume que la especialidad de odontología tiene codigo = 'ODONTOLOGIA'.
-- Si el código difiere en tu BD, ajusta el WHERE.
DO $$
DECLARE
    v_especialidad_id UUID;
BEGIN
    -- Buscar la especialidad de odontología (busca por codigo o nombre, lo que exista)
    SELECT id INTO v_especialidad_id
    FROM sys_config.especialidades
    WHERE codigo ILIKE '%odonto%' OR nombre ILIKE '%odonto%'
    ORDER BY activo DESC
    LIMIT 1;

    IF v_especialidad_id IS NULL THEN
        RAISE NOTICE 'No se encontró especialidad de Odontología. El seed de especialidad_hc_secciones NO se ejecutó.';
        RETURN;
    END IF;

    -- Insertar relaciones (idempotente)
    INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria)
    SELECT
        v_especialidad_id,
        s.id,
        s.orden,
        s.obligatoria
    FROM (
        SELECT id, 1 AS orden, true  AS obligatoria FROM sys_config.hc_secciones WHERE codigo = 'CONSULTA'
        UNION ALL
        SELECT id, 2 AS orden, false AS obligatoria FROM sys_config.hc_secciones WHERE codigo = 'ANTECEDENTES'
        UNION ALL
        SELECT id, 3 AS orden, false AS obligatoria FROM sys_config.hc_secciones WHERE codigo = 'EXAMEN_FISICO'
        UNION ALL
        SELECT id, 4 AS orden, false AS obligatoria FROM sys_config.hc_secciones WHERE codigo = 'ODONTOGRAMA'
        UNION ALL
        SELECT id, 5 AS orden, false AS obligatoria FROM sys_config.hc_secciones WHERE codigo = 'PLAN'
    ) s
    ON CONFLICT (especialidad_id, hc_seccion_id) DO NOTHING;

    RAISE NOTICE 'Seed odontología completado para especialidad_id = %', v_especialidad_id;
END $$;

-- =============================================================================
-- 6.3 Migrar historias_clinicas existentes: asignar la especialidad de odontología
-- (solo si la columna fue recién creada y hay historias sin especialidad_id)
-- =============================================================================
DO $$
DECLARE
    v_especialidad_id UUID;
BEGIN
    SELECT id INTO v_especialidad_id
    FROM sys_config.especialidades
    WHERE codigo ILIKE '%odonto%' OR nombre ILIKE '%odonto%'
    ORDER BY activo DESC
    LIMIT 1;

    IF v_especialidad_id IS NOT NULL THEN
        UPDATE sys_clinical.historias_clinicas
        SET especialidad_id = v_especialidad_id
        WHERE especialidad_id IS NULL;

        RAISE NOTICE 'Migración: historias_clinicas existentes asignadas a especialidad %', v_especialidad_id;
    END IF;
END $$;
