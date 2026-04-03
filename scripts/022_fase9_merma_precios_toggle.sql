-- Fase 9.1 + 9.2: Merma en servicios y toggle de precios en portal
-- Ejecutar en la base de datos PostgreSQL

-- 9.1: Agregar columna merma_porcentaje a servicios
ALTER TABLE sys_config.servicios 
ADD COLUMN IF NOT EXISTS merma_porcentaje FLOAT DEFAULT 0.0;

-- 9.2: Agregar columna mostrar_precios_portal a especialistas
ALTER TABLE sys_config.especialistas 
ADD COLUMN IF NOT EXISTS mostrar_precios_portal BOOLEAN DEFAULT FALSE;
