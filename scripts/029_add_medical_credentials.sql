ALTER TABLE sys_config.especialistas ADD COLUMN IF NOT EXISTS codigo_colegio_medico VARCHAR(50) DEFAULT NULL;
ALTER TABLE sys_config.especialistas ADD COLUMN IF NOT EXISTS codigo_mpps VARCHAR(50) DEFAULT NULL;
ALTER TABLE sys_config.especialistas ADD COLUMN IF NOT EXISTS codigo_regional VARCHAR(50) DEFAULT NULL;
