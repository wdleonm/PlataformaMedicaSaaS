SELECT * FROM sys_clinical.pacientes;

SELECT * FROM sys_clinical.historias_clinicas;

SELECT * FROM sys_clinical.historias_clinicas_adjuntos;

SELECT * FROM sys_clinical.odontograma_registros;

SELECT * FROM sys_clinical.citas;

SELECT * FROM sys_clinical.presupuestos;

SELECT * FROM sys_clinical.presupuesto_detalles;

SELECT * FROM sys_clinical.categorias_gastos;

SELECT * FROM sys_config.administradores;

SELECT * FROM sys_config.insumos;

SELECT * FROM sys_config.servicios;

SELECT * FROM sys_config.catalogo_insumos;

--delete from sys_config.insumos;

SELECT * FROM sys_config.servicio_insumos;

SELECT * FROM sys_config.especialistas;

SELECT * FROM sys_config.especialidades;

SELECT * from sys_config.hc_secciones;

SELECT * from sys_config.especialidad_hc_secciones;

SELECT * from sys_config.bcv_tasas_historial ;



ALTER TABLE sys_clinical.historias_clinicas ADD COLUMN actividades_realizadas VARCHAR;
ALTER TABLE sys_config.insumos ADD COLUMN imagen_url VARCHAR(500);



-- Script CORREGIDO para asociar especialidades dentales con sus secciones obligatorias
-- Garantiza que las 4 especialidades (ODO_GEN, ODO_MAX, ODO_END, ODO_ORT) tengan las 6 secciones
-- Todas las secciones (incluyendo ACTIVIDADES) se marcan como OBLIGATORIAS.


