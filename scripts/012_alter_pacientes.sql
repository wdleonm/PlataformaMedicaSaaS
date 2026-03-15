ALTER TABLE sys_clinical.pacientes ADD COLUMN IF NOT EXISTS alergias TEXT;
ALTER TABLE sys_clinical.pacientes ADD COLUMN IF NOT EXISTS patologias_cronicas TEXT;
ALTER TABLE sys_clinical.pacientes ADD COLUMN IF NOT EXISTS medicacion_frecuente TEXT;
