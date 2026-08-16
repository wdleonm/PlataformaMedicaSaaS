-- 030_recipes_medicos.sql
-- Fase: Récipes e Indicaciones Médicas
-- Crea la tabla para almacenar récipes ligados al paciente y la evolución.

CREATE TABLE IF NOT EXISTS sys_clinical.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    especialista_id UUID NOT NULL REFERENCES sys_config.especialistas(id),
    paciente_id UUID NOT NULL REFERENCES sys_clinical.pacientes(id),
    historia_clinica_id UUID REFERENCES sys_clinical.historias_clinicas(id),
    fecha_emision TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    medicamentos TEXT,
    indicaciones TEXT,
    notas_adicionales TEXT,
    qr_token VARCHAR(100) UNIQUE NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_recipes_especialista ON sys_clinical.recipes(especialista_id);
CREATE INDEX IF NOT EXISTS idx_recipes_paciente ON sys_clinical.recipes(paciente_id);
CREATE INDEX IF NOT EXISTS idx_recipes_historia ON sys_clinical.recipes(historia_clinica_id);
CREATE INDEX IF NOT EXISTS idx_recipes_qr ON sys_clinical.recipes(qr_token);

-- Configuración de Row Level Security (RLS)
ALTER TABLE sys_clinical.recipes ENABLE ROW LEVEL SECURITY;

-- Política para que el Especialista vea y administre solo los récipes de sus pacientes
-- Política para que el Especialista vea y administre solo los récipes de sus pacientes
DROP POLICY IF EXISTS recipes_especialista_policy ON sys_clinical.recipes;
CREATE POLICY recipes_especialista_policy 
    ON sys_clinical.recipes 
    FOR ALL 
    USING (
        especialista_id = current_setting('app.especialista_id', true)::uuid
    )
    WITH CHECK (
        especialista_id = current_setting('app.especialista_id', true)::uuid
    );


