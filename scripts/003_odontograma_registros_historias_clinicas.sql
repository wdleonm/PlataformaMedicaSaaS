-- Odonto-Focus | Fase 2.3 + 2.4: Odontograma Registros e Historias Clínicas
-- Ejecutar sobre la base de datos: analytics
-- Requiere que 001_especialistas_especialidades_rls.sql y 002_pacientes.sql hayan sido ejecutados previamente.

SET search_path TO sys_clinical, sys_config, public;

-- =============================================================================
-- 1. Tabla: odontograma_registros  (Fase 2.3 — Regla de Oro 3.1)
-- SOLO INSERT: nunca se actualiza un registro existente.
-- El estado del odontograma se reconstruye por fecha filtrando el último
-- registro por (paciente_id, numero_diente, cara_diente) hasta la fecha dada.
-- =============================================================================
CREATE TABLE IF NOT EXISTS sys_clinical.odontograma_registros (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    especialista_id  UUID NOT NULL REFERENCES sys_config.especialistas(id) ON DELETE CASCADE,
    paciente_id      UUID NOT NULL REFERENCES sys_clinical.pacientes(id)   ON DELETE CASCADE,
    -- FDI: dientes permanentes 11-18, 21-28, 31-38, 41-48
    -- dientes temporales 51-55, 61-65, 71-75, 81-85
    numero_diente    SMALLINT NOT NULL
                         CHECK (
                             (numero_diente BETWEEN 11 AND 18) OR
                             (numero_diente BETWEEN 21 AND 28) OR
                             (numero_diente BETWEEN 31 AND 38) OR
                             (numero_diente BETWEEN 41 AND 48) OR
                             (numero_diente BETWEEN 51 AND 55) OR
                             (numero_diente BETWEEN 61 AND 65) OR
                             (numero_diente BETWEEN 71 AND 75) OR
                             (numero_diente BETWEEN 81 AND 85)
                         ),
    -- Caras según convención FDI
    cara_diente      VARCHAR(2) NOT NULL
                         CHECK (cara_diente IN ('O','M','D','V','L','R')),
    hallazgo_id      UUID NOT NULL REFERENCES sys_config.odontograma_hallazgos(id) ON DELETE RESTRICT,
    fecha_registro   DATE NOT NULL DEFAULT CURRENT_DATE,
    notas            TEXT,
    -- Vínculo opcional a historia clínica (se puede agregar después)
    historia_clinica_id UUID,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  sys_clinical.odontograma_registros IS
    'Registros evolutivos de odontograma. Solo INSERT: cada cambio de hallazgo genera una nueva fila. '
    'El estado en una fecha dada se obtiene tomando el último registro por (paciente_id, numero_diente, cara_diente) <= fecha.';
COMMENT ON COLUMN sys_clinical.odontograma_registros.cara_diente IS
    'O=Oclusal, M=Mesial, D=Distal, V=Vestibular, L=Lingual, R=Raíz';
COMMENT ON COLUMN sys_clinical.odontograma_registros.numero_diente IS
    'Notación FDI. Permanentes: 11-18, 21-28, 31-38, 41-48. Temporales: 51-55, 61-65, 71-75, 81-85.';

-- Restricción FK diferida para historia_clinica_id (se crea después de la tabla historias_clinicas)
-- Se añade al final de este script.

-- RLS
ALTER TABLE sys_clinical.odontograma_registros ENABLE ROW LEVEL SECURITY;

CREATE POLICY odontograma_registros_tenant ON sys_clinical.odontograma_registros
    FOR ALL
    USING   (especialista_id = current_setting('app.especialista_id', true)::uuid)
    WITH CHECK (especialista_id = current_setting('app.especialista_id', true)::uuid);

-- Índices
CREATE INDEX IF NOT EXISTS idx_odon_reg_especialista  ON sys_clinical.odontograma_registros (especialista_id);
CREATE INDEX IF NOT EXISTS idx_odon_reg_paciente       ON sys_clinical.odontograma_registros (paciente_id);
CREATE INDEX IF NOT EXISTS idx_odon_reg_diente_cara    ON sys_clinical.odontograma_registros (paciente_id, numero_diente, cara_diente);
CREATE INDEX IF NOT EXISTS idx_odon_reg_fecha           ON sys_clinical.odontograma_registros (fecha_registro);

-- =============================================================================
-- 2. Tabla: historias_clinicas  (Fase 2.4)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sys_clinical.historias_clinicas (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    especialista_id    UUID NOT NULL REFERENCES sys_config.especialistas(id) ON DELETE CASCADE,
    paciente_id        UUID NOT NULL REFERENCES sys_clinical.pacientes(id)   ON DELETE CASCADE,
    fecha_apertura     DATE NOT NULL DEFAULT CURRENT_DATE,
    motivo_consulta    TEXT,
    diagnostico        TEXT,
    plan_tratamiento   TEXT,
    notas              TEXT,
    activo             BOOLEAN NOT NULL DEFAULT true,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE sys_clinical.historias_clinicas IS
    'Historia clínica por paciente. Puede tener múltiples entradas (episodios). '
    'Cada apertura representa una consulta o episodio de atención.';

-- RLS
ALTER TABLE sys_clinical.historias_clinicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY historias_clinicas_tenant ON sys_clinical.historias_clinicas
    FOR ALL
    USING   (especialista_id = current_setting('app.especialista_id', true)::uuid)
    WITH CHECK (especialista_id = current_setting('app.especialista_id', true)::uuid);

-- Trigger updated_at
DROP TRIGGER IF EXISTS historias_clinicas_updated_at ON sys_clinical.historias_clinicas;
CREATE TRIGGER historias_clinicas_updated_at
    BEFORE UPDATE ON sys_clinical.historias_clinicas
    FOR EACH ROW EXECUTE PROCEDURE sys_config.set_updated_at();

-- Índices
CREATE INDEX IF NOT EXISTS idx_hist_clinicas_especialista ON sys_clinical.historias_clinicas (especialista_id);
CREATE INDEX IF NOT EXISTS idx_hist_clinicas_paciente      ON sys_clinical.historias_clinicas (paciente_id);
CREATE INDEX IF NOT EXISTS idx_hist_clinicas_fecha         ON sys_clinical.historias_clinicas (fecha_apertura DESC);

-- =============================================================================
-- 3. FK diferida: vincular odontograma_registros → historias_clinicas
-- =============================================================================
ALTER TABLE sys_clinical.odontograma_registros
    ADD CONSTRAINT fk_odon_reg_historia_clinica
    FOREIGN KEY (historia_clinica_id)
    REFERENCES sys_clinical.historias_clinicas(id)
    ON DELETE SET NULL;
