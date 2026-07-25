-- PlataformaMedicaSaaS - Script 028: Depuración y Limpieza de Secciones de Historias Clínicas por Especialidad
-- Este script elimina relaciones obsoletas / genéricas heredadas del script 016,
-- garantizando que cada especialidad médica solo muestre sus secciones verdaderamente relevantes.

SET search_path TO sys_config, public;

-- 1. Eliminar asignaciones obsoletas de CONSULTA, ANTECEDENTES y ACTIVIDADES
-- para especialidades que tienen su propio flujo clínico dedicado (ej: Medicina General, Psicología).
-- Medicina General: Solo debe tener EXAMEN_FUNCIONAL e IMPRESION_DIAGNOSTICA.
DELETE FROM sys_config.especialidad_hc_secciones
WHERE especialidad_id = (SELECT id FROM sys_config.especialidades WHERE nombre = 'Medicina General')
  AND hc_seccion_id IN (
      SELECT id FROM sys_config.hc_secciones WHERE codigo IN ('CONSULTA', 'ANTECEDENTES', 'ACTIVIDADES')
  );

-- Psicología: Solo debe tener HISTORIA_BIOGRAFICA, EXAMEN_MENTAL y PRUEBAS_PSICOMETRICAS.
DELETE FROM sys_config.especialidad_hc_secciones
WHERE especialidad_id = (SELECT id FROM sys_config.especialidades WHERE nombre = 'Psicologia')
  AND hc_seccion_id IN (
      SELECT id FROM sys_config.hc_secciones WHERE codigo IN ('CONSULTA', 'ANTECEDENTES', 'ACTIVIDADES')
  );

-- 2. Re-ordenar las secciones dinámicas para garantizar secuencia limpia (1, 2, 3, ...)

-- Medicina General
UPDATE sys_config.especialidad_hc_secciones
SET orden = 1
WHERE especialidad_id = (SELECT id FROM sys_config.especialidades WHERE nombre = 'Medicina General')
  AND hc_seccion_id = (SELECT id FROM sys_config.hc_secciones WHERE codigo = 'EXAMEN_FUNCIONAL');

UPDATE sys_config.especialidad_hc_secciones
SET orden = 2
WHERE especialidad_id = (SELECT id FROM sys_config.especialidades WHERE nombre = 'Medicina General')
  AND hc_seccion_id = (SELECT id FROM sys_config.hc_secciones WHERE codigo = 'IMPRESION_DIAGNOSTICA');

-- Medicina Interna
UPDATE sys_config.especialidad_hc_secciones
SET orden = 3
WHERE especialidad_id = (SELECT id FROM sys_config.especialidades WHERE nombre = 'Medicina Interna')
  AND hc_seccion_id = (SELECT id FROM sys_config.hc_secciones WHERE codigo = 'EXAMEN_FUNCIONAL');

UPDATE sys_config.especialidad_hc_secciones
SET orden = 4
WHERE especialidad_id = (SELECT id FROM sys_config.especialidades WHERE nombre = 'Medicina Interna')
  AND hc_seccion_id = (SELECT id FROM sys_config.hc_secciones WHERE codigo = 'IMPRESION_DIAGNOSTICA');

-- Pediatría
UPDATE sys_config.especialidad_hc_secciones
SET orden = 3
WHERE especialidad_id = (SELECT id FROM sys_config.especialidades WHERE nombre = 'Pediatría')
  AND hc_seccion_id = (SELECT id FROM sys_config.hc_secciones WHERE codigo = 'ANT_PERINATALES');

UPDATE sys_config.especialidad_hc_secciones
SET orden = 4
WHERE especialidad_id = (SELECT id FROM sys_config.especialidades WHERE nombre = 'Pediatría')
  AND hc_seccion_id = (SELECT id FROM sys_config.hc_secciones WHERE codigo = 'DESARROLLO_PSICOMOTOR');

UPDATE sys_config.especialidad_hc_secciones
SET orden = 5
WHERE especialidad_id = (SELECT id FROM sys_config.especialidades WHERE nombre = 'Pediatría')
  AND hc_seccion_id = (SELECT id FROM sys_config.hc_secciones WHERE codigo = 'INMUNIZACIONES');

UPDATE sys_config.especialidad_hc_secciones
SET orden = 6
WHERE especialidad_id = (SELECT id FROM sys_config.especialidades WHERE nombre = 'Pediatría')
  AND hc_seccion_id = (SELECT id FROM sys_config.hc_secciones WHERE codigo = 'ANTROPOMETRIA');

UPDATE sys_config.especialidad_hc_secciones
SET orden = 7
WHERE especialidad_id = (SELECT id FROM sys_config.especialidades WHERE nombre = 'Pediatría')
  AND hc_seccion_id = (SELECT id FROM sys_config.hc_secciones WHERE codigo = 'IMPRESION_DIAGNOSTICA');

-- Ginecología
UPDATE sys_config.especialidad_hc_secciones
SET orden = 3
WHERE especialidad_id = (SELECT id FROM sys_config.especialidades WHERE nombre = 'Ginecología')
  AND hc_seccion_id = (SELECT id FROM sys_config.hc_secciones WHERE codigo = 'ANT_GINECOBSTETRICOS');

UPDATE sys_config.especialidad_hc_secciones
SET orden = 4
WHERE especialidad_id = (SELECT id FROM sys_config.especialidades WHERE nombre = 'Ginecología')
  AND hc_seccion_id = (SELECT id FROM sys_config.hc_secciones WHERE codigo = 'EXAMEN_GINECOLOGICO');

UPDATE sys_config.especialidad_hc_secciones
SET orden = 5
WHERE especialidad_id = (SELECT id FROM sys_config.especialidades WHERE nombre = 'Ginecología')
  AND hc_seccion_id = (SELECT id FROM sys_config.hc_secciones WHERE codigo = 'IMPRESION_DIAGNOSTICA');

-- Traumatología
UPDATE sys_config.especialidad_hc_secciones
SET orden = 3
WHERE especialidad_id = (SELECT id FROM sys_config.especialidades WHERE nombre = 'Traumatología')
  AND hc_seccion_id = (SELECT id FROM sys_config.hc_secciones WHERE codigo = 'MECANISMO_TRAUMA');

UPDATE sys_config.especialidad_hc_secciones
SET orden = 4
WHERE especialidad_id = (SELECT id FROM sys_config.especialidades WHERE nombre = 'Traumatología')
  AND hc_seccion_id = (SELECT id FROM sys_config.hc_secciones WHERE codigo = 'EXAMEN_OSTEOMUSCULAR');

UPDATE sys_config.especialidad_hc_secciones
SET orden = 5
WHERE especialidad_id = (SELECT id FROM sys_config.especialidades WHERE nombre = 'Traumatología')
  AND hc_seccion_id = (SELECT id FROM sys_config.hc_secciones WHERE codigo = 'IMPRESION_DIAGNOSTICA');

-- Psicología
UPDATE sys_config.especialidad_hc_secciones
SET orden = 1
WHERE especialidad_id = (SELECT id FROM sys_config.especialidades WHERE nombre = 'Psicologia')
  AND hc_seccion_id = (SELECT id FROM sys_config.hc_secciones WHERE codigo = 'HISTORIA_BIOGRAFICA');

UPDATE sys_config.especialidad_hc_secciones
SET orden = 2
WHERE especialidad_id = (SELECT id FROM sys_config.especialidades WHERE nombre = 'Psicologia')
  AND hc_seccion_id = (SELECT id FROM sys_config.hc_secciones WHERE codigo = 'EXAMEN_MENTAL');

UPDATE sys_config.especialidad_hc_secciones
SET orden = 3
WHERE especialidad_id = (SELECT id FROM sys_config.especialidades WHERE nombre = 'Psicologia')
  AND hc_seccion_id = (SELECT id FROM sys_config.hc_secciones WHERE codigo = 'PRUEBAS_PSICOMETRICAS');
