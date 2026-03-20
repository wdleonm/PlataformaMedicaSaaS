SELECT id, metodo, destino, estado, ultimo_error, reintentos FROM sys_clinical.cola_mensajes ORDER BY created_at DESC LIMIT 5;
