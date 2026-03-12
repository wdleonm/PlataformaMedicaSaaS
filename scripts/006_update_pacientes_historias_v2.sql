-- Migración: Actualización de Pacientes e Historias Clínicas para Ficha Dental Completa

-- 1. Actualizar Tabla Pacientes
ALTER TABLE sys_clinical.pacientes 
ADD COLUMN IF NOT EXISTS sexo VARCHAR(2),
ADD COLUMN IF NOT EXISTS direccion TEXT,
ADD COLUMN IF NOT EXISTS lugar_nacimiento VARCHAR(100),
ADD COLUMN IF NOT EXISTS estado_civil VARCHAR(50),
ADD COLUMN IF NOT EXISTS ocupacion VARCHAR(100),
ADD COLUMN IF NOT EXISTS contacto_emergencia_nombre VARCHAR(120),
ADD COLUMN IF NOT EXISTS contacto_emergencia_telefono VARCHAR(50),
ADD COLUMN IF NOT EXISTS contacto_emergencia_parentesco VARCHAR(50);

-- 2. Actualizar Tabla Historias Clínicas
ALTER TABLE sys_clinical.historias_clinicas
ADD COLUMN IF NOT EXISTS enfermedad_actual TEXT,
ADD COLUMN IF NOT EXISTS antecedentes_familiares JSONB,
ADD COLUMN IF NOT EXISTS antecedentes_personales JSONB,
ADD COLUMN IF NOT EXISTS examen_clinico JSONB,
ADD COLUMN IF NOT EXISTS estudios_complementarios JSONB;

-- Comentarios para documentación
COMMENT ON COLUMN sys_clinical.pacientes.sexo IS 'M=Masculino, F=Femenino';
COMMENT ON COLUMN sys_clinical.historias_clinicas.antecedentes_familiares IS 'JSONB con info de salud de madre y padre';
COMMENT ON COLUMN sys_clinical.historias_clinicas.antecedentes_personales IS 'JSONB con patologías previas y medicamentos';
COMMENT ON COLUMN sys_clinical.historias_clinicas.examen_clinico IS 'JSONB con inspección de encías, lengua, paladar, etc.';
COMMENT ON COLUMN sys_clinical.historias_clinicas.estudios_complementarios IS 'JSONB con resultados de rayos X y laboratorio';
