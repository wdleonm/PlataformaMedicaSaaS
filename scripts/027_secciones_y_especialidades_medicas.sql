-- PlataformaMedicaSaaS - Registro de secciones de historias clínicas y mapeo de especialidades

-- 1. Insertar las secciones de historias clínicas (sin columna updated_at)
INSERT INTO sys_config.hc_secciones (id, codigo, nombre, descripcion, componente_frontend, created_at) 
VALUES 
-- Secciones transversales (Medicina General / Interna)
('1a2b3c4d-0001-4000-8000-000000000001', 'EXAMEN_FUNCIONAL', 'Examen Funcional', 'Interrogatorio por aparatos y sistemas', 'ExamenFuncionalStep', '2026-07-25 10:24:00'),
('1a2b3c4d-0002-4000-8000-000000000002', 'IMPRESION_DIAGNOSTICA', 'Impresión Diagnóstica', 'Diagnósticos presuntivos o definitivos con codificación CIE-10', 'DiagnosticoStep', '2026-07-25 10:24:00'),

-- Secciones para Pediatría
('1a2b3c4d-0003-4000-8000-000000000003', 'ANT_PERINATALES', 'Antecedentes Perinatales', 'Datos del embarazo, parto y periodo neonatal', 'AntPerinatalesStep', '2026-07-25 10:24:00'),
('1a2b3c4d-0004-4000-8000-000000000004', 'DESARROLLO_PSICOMOTOR', 'Desarrollo Psicomotor', 'Hitos del desarrollo según edad', 'PsicomotorStep', '2026-07-25 10:24:00'),
('1a2b3c4d-0005-4000-8000-000000000005', 'INMUNIZACIONES', 'Inmunizaciones', 'Esquema de vacunación (PAI Venezuela)', 'VacunasStep', '2026-07-25 10:24:00'),
('1a2b3c4d-0006-4000-8000-000000000006', 'ANTROPOMETRIA', 'Antropometría', 'Registro de peso, talla, CC y percentiles', 'AntropometriaStep', '2026-07-25 10:24:00'),

-- Secciones para Ginecología
('1a2b3c4d-0007-4000-8000-000000000007', 'ANT_GINECOBSTETRICOS', 'Antecedentes Gineco-Obstétricos', 'Fórmula obstétrica, FUM, métodos anticonceptivos', 'AntGinecoStep', '2026-07-25 10:24:00'),
('1a2b3c4d-0008-4000-8000-000000000008', 'EXAMEN_GINECOLOGICO', 'Examen Ginecológico', 'Examen de mamas, especuloscopia y tacto vaginal', 'ExamenGinecoStep', '2026-07-25 10:24:00'),

-- Secciones para Traumatología
('1a2b3c4d-0009-4000-8000-000000000009', 'MECANISMO_TRAUMA', 'Mecanismo de Trauma', 'Descripción detallada de la cinemática del trauma', 'TraumaStep', '2026-07-25 10:24:00'),
('1a2b3c4d-0010-4000-8000-000000000010', 'EXAMEN_OSTEOMUSCULAR', 'Examen Osteomuscular', 'ROM, fuerza muscular y pruebas ortopédicas', 'OsteomuscularStep', '2026-07-25 10:24:00'),

-- Secciones para Psicología
('1a2b3c4d-0011-4000-8000-000000000011', 'HISTORIA_BIOGRAFICA', 'Historia Biográfica', 'Genograma y antecedentes psicosociales', 'BiograficaStep', '2026-07-25 10:24:00'),
('1a2b3c4d-0012-4000-8000-000000000012', 'EXAMEN_MENTAL', 'Examen Mental', 'Evaluación de funciones mentales superiores', 'ExamenMentalStep', '2026-07-25 10:24:00'),
('1a2b3c4d-0013-4000-8000-000000000013', 'PRUEBAS_PSICOMETRICAS', 'Pruebas Psicométricas', 'Registro de tests aplicados y resultados', 'PsicometriaStep', '2026-07-25 10:24:00')
ON CONFLICT (id) DO UPDATE SET
  codigo = EXCLUDED.codigo,
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  componente_frontend = EXCLUDED.componente_frontend;

-- 2. Asociar secciones con especialidades médicas
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) 
VALUES
-- Medicina General (ID: 2691bfe1-afeb-4bfd-a68b-59243d4727d9)
('2691bfe1-afeb-4bfd-a68b-59243d4727d9', '1a2b3c4d-0001-4000-8000-000000000001', 7, true), -- Examen Funcional
('2691bfe1-afeb-4bfd-a68b-59243d4727d9', '1a2b3c4d-0002-4000-8000-000000000002', 8, true), -- Impresión Diagnóstica

-- Medicina Interna (ID: 8b15db12-54d6-4862-9e39-a10e6b1dd4d1)
('8b15db12-54d6-4862-9e39-a10e6b1dd4d1', '1a2b3c4d-0001-4000-8000-000000000001', 7, true), -- Examen Funcional
('8b15db12-54d6-4862-9e39-a10e6b1dd4d1', '1a2b3c4d-0002-4000-8000-000000000002', 8, true), -- Impresión Diagnóstica

-- Pediatría (ID: 32bf7ef4-d0dd-49d2-99e1-03aae44d47c0)
('32bf7ef4-d0dd-49d2-99e1-03aae44d47c0', '1a2b3c4d-0003-4000-8000-000000000003', 7, true), -- Ant Perinatales
('32bf7ef4-d0dd-49d2-99e1-03aae44d47c0', '1a2b3c4d-0004-4000-8000-000000000004', 8, true), -- Des Psicomotor
('32bf7ef4-d0dd-49d2-99e1-03aae44d47c0', '1a2b3c4d-0005-4000-8000-000000000005', 9, true), -- Inmunizaciones
('32bf7ef4-d0dd-49d2-99e1-03aae44d47c0', '1a2b3c4d-0006-4000-8000-000000000006', 10, true), -- Antropometría
('32bf7ef4-d0dd-49d2-99e1-03aae44d47c0', '1a2b3c4d-0002-4000-8000-000000000002', 11, true), -- Impresión Diagnóstica

-- Ginecología (ID: e64cb7c3-5955-4bda-9d1c-f99dade9ccf3)
('e64cb7c3-5955-4bda-9d1c-f99dade9ccf3', '1a2b3c4d-0007-4000-8000-000000000007', 7, true), -- Ant Gineco-obstétricos
('e64cb7c3-5955-4bda-9d1c-f99dade9ccf3', '1a2b3c4d-0008-4000-8000-000000000008', 8, true), -- Examen Ginecológico
('e64cb7c3-5955-4bda-9d1c-f99dade9ccf3', '1a2b3c4d-0002-4000-8000-000000000002', 9, true), -- Impresión Diagnóstica

-- Traumatología (ID: 9acbd1b3-34bb-40ff-8aca-f906c5c3070d)
('9acbd1b3-34bb-40ff-8aca-f906c5c3070d', '1a2b3c4d-0009-4000-8000-000000000009', 7, true), -- Mecanismo Trauma
('9acbd1b3-34bb-40ff-8aca-f906c5c3070d', '1a2b3c4d-0010-4000-8000-000000000010', 8, true), -- Examen Osteomuscular
('9acbd1b3-34bb-40ff-8aca-f906c5c3070d', '1a2b3c4d-0002-4000-8000-000000000002', 9, true), -- Impresión Diagnóstica

-- Psicología (ID: 10ecc282-f464-4849-a631-9b202df7a3e2)
('10ecc282-f464-4849-a631-9b202df7a3e2', '1a2b3c4d-0011-4000-8000-000000000011', 7, true), -- Historia Biográfica
('10ecc282-f464-4849-a631-9b202df7a3e2', '1a2b3c4d-0012-4000-8000-000000000012', 8, true), -- Examen Mental
('10ecc282-f464-4849-a631-9b202df7a3e2', '1a2b3c4d-0013-4000-8000-000000000013', 9, false) -- Pruebas Psicométricas
ON CONFLICT (especialidad_id, hc_seccion_id) DO UPDATE SET
  orden = EXCLUDED.orden,
  obligatoria = EXCLUDED.obligatoria;
