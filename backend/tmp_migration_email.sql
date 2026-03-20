ALTER TABLE sys_clinical.cola_mensajes ADD COLUMN metodo VARCHAR(15) DEFAULT 'whatsapp';
ALTER TABLE sys_clinical.cola_mensajes ALTER COLUMN destino TYPE VARCHAR(255);
