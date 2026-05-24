-- PlataformaMedicaSaaS - Semillas de Producción (Datos Maestros)
-- Generado automáticamente desde base de datos local de desarrollo
SET search_path TO sys_config, sys_clinical, public;

-- Semillas para sys_config.planes_suscripcion
INSERT INTO sys_config.planes_suscripcion (id, codigo, nombre, precio_mensual, max_pacientes, max_citas_mes, incluye_whatsapp, incluye_multiusuario, activo, soporte_prioritario) VALUES ('17733c64-a5bc-4a6e-bd9e-3b82bf270293', 'basico', 'Plan Básico', '14.99', 100, 200, FALSE, FALSE, TRUE, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.planes_suscripcion (id, codigo, nombre, precio_mensual, max_pacientes, max_citas_mes, incluye_whatsapp, incluye_multiusuario, activo, soporte_prioritario) VALUES ('f9edda2d-2ad9-4205-a844-132e9e46f918', 'profesional', 'Plan Profesional', '29.99', 500, NULL, TRUE, FALSE, TRUE, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.planes_suscripcion (id, codigo, nombre, precio_mensual, max_pacientes, max_citas_mes, incluye_whatsapp, incluye_multiusuario, activo, soporte_prioritario) VALUES ('70cb7e3f-adbb-42da-b76c-8949dcc71134', 'enterprise', 'Plan Enterprise', '44.99', NULL, NULL, TRUE, TRUE, TRUE, TRUE) ON CONFLICT DO NOTHING;

-- Semillas para sys_config.especialidades
INSERT INTO sys_config.especialidades (id, nombre, codigo, activo) VALUES ('8f5c9b60-0725-4cd4-bbcc-6c5ffc04e258', 'Odontología General', 'ODO_GEN', TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidades (id, nombre, codigo, activo) VALUES ('f8fd8b1b-0e3d-4dfc-abf2-9b02fc56b278', 'Cirugía Maxilofacial', 'ODO_MAX', TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidades (id, nombre, codigo, activo) VALUES ('5fff054c-1866-4b9d-9b5d-0b7682f8251c', 'Endodoncia', 'ODO_END', TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidades (id, nombre, codigo, activo) VALUES ('3d04eae0-8b21-49f5-9493-d8e1297c5be2', 'Ortodoncia', 'ODO_ORT', TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidades (id, nombre, codigo, activo) VALUES ('2691bfe1-afeb-4bfd-a68b-59243d4727d9', 'Medicina General', 'MED_GEN', TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidades (id, nombre, codigo, activo) VALUES ('9acbd1b3-34bb-40ff-8aca-f906c5c3070d', 'Traumatología', 'MED_TRA', TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidades (id, nombre, codigo, activo) VALUES ('e64cb7c3-5955-4bda-9d1c-f99dade9ccf3', 'Ginecología', 'MED_GIN', TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidades (id, nombre, codigo, activo) VALUES ('e4914aed-5751-4769-9cb4-20806d2d604a', 'Toxicología', 'MED_TOX', TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidades (id, nombre, codigo, activo) VALUES ('32bf7ef4-d0dd-49d2-99e1-03aae44d47c0', 'Pediatría', 'MED_PED', TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidades (id, nombre, codigo, activo) VALUES ('8b15db12-54d6-4862-9e39-a10e6b1dd4d1', 'Medicina Interna', 'MED_INT', TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidades (id, nombre, codigo, activo) VALUES ('10ecc282-f464-4849-a631-9b202df7a3e2', 'Psicologia', 'PSI_GEN', TRUE) ON CONFLICT DO NOTHING;

-- Semillas para sys_config.hc_secciones
INSERT INTO sys_config.hc_secciones (id, codigo, nombre, descripcion, componente_frontend, activo) VALUES ('2e859d91-d047-4cfa-a1d8-822265f868f8', 'CONSULTA', 'Consulta Inicial', 'Motivo de consulta y enfermedad actual', 'ConsultaStep', TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.hc_secciones (id, codigo, nombre, descripcion, componente_frontend, activo) VALUES ('1ac91de5-b37c-4705-91d3-71c86558b221', 'ANTECEDENTES', 'Antecedentes', 'Antecedentes médicos, familiares y hábitos', 'AntecedentesStep', TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.hc_secciones (id, codigo, nombre, descripcion, componente_frontend, activo) VALUES ('cecc96e2-7850-4749-84a6-5189f9d1f8c1', 'EXAMEN_FISICO', 'Examen Físico', 'Signos vitales y exploración física general', 'ExamenFisicoStep', TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.hc_secciones (id, codigo, nombre, descripcion, componente_frontend, activo) VALUES ('bf83292a-a3c6-4e36-9545-d20ac2dd918b', 'ODONTOGRAMA', 'Odontograma', 'Registro visual del estado dental actual', 'OdontogramaStep', TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.hc_secciones (id, codigo, nombre, descripcion, componente_frontend, activo) VALUES ('87c2e008-bac7-4bbc-94da-c1c106fb41fe', 'PLAN', 'Plan de Tratamiento', 'Diagnóstico y plan de acción a seguir', 'PlanStep', TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.hc_secciones (id, codigo, nombre, descripcion, componente_frontend, activo) VALUES ('57defd56-ba1c-4d0e-a53d-4d1a9062a092', 'ACTIVIDADES', 'Actividades Realizadas', NULL, 'ActividadesStep', TRUE) ON CONFLICT DO NOTHING;

-- Semillas para sys_config.especialidad_hc_secciones
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('8b15db12-54d6-4862-9e39-a10e6b1dd4d1', '2e859d91-d047-4cfa-a1d8-822265f868f8', 1, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('8b15db12-54d6-4862-9e39-a10e6b1dd4d1', '1ac91de5-b37c-4705-91d3-71c86558b221', 2, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('8b15db12-54d6-4862-9e39-a10e6b1dd4d1', 'cecc96e2-7850-4749-84a6-5189f9d1f8c1', 3, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('8b15db12-54d6-4862-9e39-a10e6b1dd4d1', '87c2e008-bac7-4bbc-94da-c1c106fb41fe', 4, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('9acbd1b3-34bb-40ff-8aca-f906c5c3070d', '2e859d91-d047-4cfa-a1d8-822265f868f8', 1, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('9acbd1b3-34bb-40ff-8aca-f906c5c3070d', '1ac91de5-b37c-4705-91d3-71c86558b221', 2, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('9acbd1b3-34bb-40ff-8aca-f906c5c3070d', 'cecc96e2-7850-4749-84a6-5189f9d1f8c1', 3, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('9acbd1b3-34bb-40ff-8aca-f906c5c3070d', '87c2e008-bac7-4bbc-94da-c1c106fb41fe', 4, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('e64cb7c3-5955-4bda-9d1c-f99dade9ccf3', '2e859d91-d047-4cfa-a1d8-822265f868f8', 1, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('e64cb7c3-5955-4bda-9d1c-f99dade9ccf3', '1ac91de5-b37c-4705-91d3-71c86558b221', 2, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('e64cb7c3-5955-4bda-9d1c-f99dade9ccf3', 'cecc96e2-7850-4749-84a6-5189f9d1f8c1', 3, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('e64cb7c3-5955-4bda-9d1c-f99dade9ccf3', '87c2e008-bac7-4bbc-94da-c1c106fb41fe', 4, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('e4914aed-5751-4769-9cb4-20806d2d604a', '2e859d91-d047-4cfa-a1d8-822265f868f8', 1, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('e4914aed-5751-4769-9cb4-20806d2d604a', '1ac91de5-b37c-4705-91d3-71c86558b221', 2, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('e4914aed-5751-4769-9cb4-20806d2d604a', 'cecc96e2-7850-4749-84a6-5189f9d1f8c1', 3, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('e4914aed-5751-4769-9cb4-20806d2d604a', '87c2e008-bac7-4bbc-94da-c1c106fb41fe', 4, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('32bf7ef4-d0dd-49d2-99e1-03aae44d47c0', '2e859d91-d047-4cfa-a1d8-822265f868f8', 1, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('32bf7ef4-d0dd-49d2-99e1-03aae44d47c0', '1ac91de5-b37c-4705-91d3-71c86558b221', 2, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('32bf7ef4-d0dd-49d2-99e1-03aae44d47c0', 'cecc96e2-7850-4749-84a6-5189f9d1f8c1', 3, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('32bf7ef4-d0dd-49d2-99e1-03aae44d47c0', '87c2e008-bac7-4bbc-94da-c1c106fb41fe', 4, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('2691bfe1-afeb-4bfd-a68b-59243d4727d9', '57defd56-ba1c-4d0e-a53d-4d1a9062a092', 6, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('9acbd1b3-34bb-40ff-8aca-f906c5c3070d', '57defd56-ba1c-4d0e-a53d-4d1a9062a092', 6, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('e64cb7c3-5955-4bda-9d1c-f99dade9ccf3', '57defd56-ba1c-4d0e-a53d-4d1a9062a092', 6, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('e4914aed-5751-4769-9cb4-20806d2d604a', '57defd56-ba1c-4d0e-a53d-4d1a9062a092', 6, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('32bf7ef4-d0dd-49d2-99e1-03aae44d47c0', '57defd56-ba1c-4d0e-a53d-4d1a9062a092', 6, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('8b15db12-54d6-4862-9e39-a10e6b1dd4d1', '57defd56-ba1c-4d0e-a53d-4d1a9062a092', 6, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('8f5c9b60-0725-4cd4-bbcc-6c5ffc04e258', '2e859d91-d047-4cfa-a1d8-822265f868f8', 1, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('8f5c9b60-0725-4cd4-bbcc-6c5ffc04e258', '1ac91de5-b37c-4705-91d3-71c86558b221', 2, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('8f5c9b60-0725-4cd4-bbcc-6c5ffc04e258', 'cecc96e2-7850-4749-84a6-5189f9d1f8c1', 3, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('8f5c9b60-0725-4cd4-bbcc-6c5ffc04e258', 'bf83292a-a3c6-4e36-9545-d20ac2dd918b', 4, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('8f5c9b60-0725-4cd4-bbcc-6c5ffc04e258', '87c2e008-bac7-4bbc-94da-c1c106fb41fe', 5, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('8f5c9b60-0725-4cd4-bbcc-6c5ffc04e258', '57defd56-ba1c-4d0e-a53d-4d1a9062a092', 6, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('f8fd8b1b-0e3d-4dfc-abf2-9b02fc56b278', '2e859d91-d047-4cfa-a1d8-822265f868f8', 1, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('f8fd8b1b-0e3d-4dfc-abf2-9b02fc56b278', '1ac91de5-b37c-4705-91d3-71c86558b221', 2, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('f8fd8b1b-0e3d-4dfc-abf2-9b02fc56b278', 'cecc96e2-7850-4749-84a6-5189f9d1f8c1', 3, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('f8fd8b1b-0e3d-4dfc-abf2-9b02fc56b278', 'bf83292a-a3c6-4e36-9545-d20ac2dd918b', 4, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('f8fd8b1b-0e3d-4dfc-abf2-9b02fc56b278', '87c2e008-bac7-4bbc-94da-c1c106fb41fe', 5, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('f8fd8b1b-0e3d-4dfc-abf2-9b02fc56b278', '57defd56-ba1c-4d0e-a53d-4d1a9062a092', 6, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('5fff054c-1866-4b9d-9b5d-0b7682f8251c', '2e859d91-d047-4cfa-a1d8-822265f868f8', 1, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('5fff054c-1866-4b9d-9b5d-0b7682f8251c', '1ac91de5-b37c-4705-91d3-71c86558b221', 2, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('5fff054c-1866-4b9d-9b5d-0b7682f8251c', 'cecc96e2-7850-4749-84a6-5189f9d1f8c1', 3, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('5fff054c-1866-4b9d-9b5d-0b7682f8251c', 'bf83292a-a3c6-4e36-9545-d20ac2dd918b', 4, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('5fff054c-1866-4b9d-9b5d-0b7682f8251c', '87c2e008-bac7-4bbc-94da-c1c106fb41fe', 5, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('5fff054c-1866-4b9d-9b5d-0b7682f8251c', '57defd56-ba1c-4d0e-a53d-4d1a9062a092', 6, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('3d04eae0-8b21-49f5-9493-d8e1297c5be2', '2e859d91-d047-4cfa-a1d8-822265f868f8', 1, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('3d04eae0-8b21-49f5-9493-d8e1297c5be2', '1ac91de5-b37c-4705-91d3-71c86558b221', 2, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('3d04eae0-8b21-49f5-9493-d8e1297c5be2', 'cecc96e2-7850-4749-84a6-5189f9d1f8c1', 3, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('3d04eae0-8b21-49f5-9493-d8e1297c5be2', 'bf83292a-a3c6-4e36-9545-d20ac2dd918b', 4, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('3d04eae0-8b21-49f5-9493-d8e1297c5be2', '87c2e008-bac7-4bbc-94da-c1c106fb41fe', 5, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO sys_config.especialidad_hc_secciones (especialidad_id, hc_seccion_id, orden, obligatoria) VALUES ('3d04eae0-8b21-49f5-9493-d8e1297c5be2', '57defd56-ba1c-4d0e-a53d-4d1a9062a092', 6, TRUE) ON CONFLICT DO NOTHING;

-- Administradores registrados
INSERT INTO sys_config.administradores (id, email, password_hash, nombre, apellido, activo) VALUES ('499abe1f-fac0-4b48-9559-ce826898ef0e', 'smartlift1608@gmail.com', '$2b$12$avhqoyJlV8INY/FcQZf7sO5TgABeTuO/mOLFB6MrMJOcRIY0VOKU.', 'William', 'Leon', TRUE) ON CONFLICT (email) DO NOTHING;