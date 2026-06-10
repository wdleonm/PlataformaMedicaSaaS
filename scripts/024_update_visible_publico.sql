-- Agregar columna visible_publico a la tabla servicios si no existe (Útil para producción)
ALTER TABLE sys_config.servicios 
ADD COLUMN IF NOT EXISTS visible_publico BOOLEAN DEFAULT TRUE;

-- Inicializar visible_publico en true para todos los servicios existentes
UPDATE sys_config.servicios 
SET visible_publico = true 
WHERE visible_publico IS NULL;
