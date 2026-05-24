import sys
import os
import json

# Añadir backend al PATH para importar configuración
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from sqlmodel import create_engine, text
from app.config import settings

def escape_sql_val(val):
    if val is None:
        return "NULL"
    if isinstance(val, bool):
        return "TRUE" if val else "FALSE"
    if isinstance(val, (int, float)):
        return str(val)
    # Escapar comillas simples
    escaped = str(val).replace("'", "''")
    return f"'{escaped}'"

def dump_table_to_inserts(conn, table_name, columns):
    col_str = ", ".join(columns)
    res = conn.execute(text(f"SELECT {col_str} FROM {table_name}"))
    rows = res.fetchall()
    
    inserts = []
    if not rows:
        return inserts
        
    inserts.append(f"-- Semillas para {table_name}")
    for row in rows:
        vals = [escape_sql_val(val) for val in row]
        vals_str = ", ".join(vals)
        inserts.append(f"INSERT INTO {table_name} ({col_str}) VALUES ({vals_str}) ON CONFLICT DO NOTHING;")
    inserts.append("") # Línea en blanco
    return inserts

def main():
    print(f"Conectando a base de datos: {settings.database_url}")
    engine = create_engine(settings.database_url)
    
    output_lines = [
        "-- PlataformaMedicaSaaS - Semillas de Producción (Datos Maestros)",
        "-- Generado automáticamente desde base de datos local de desarrollo",
        "SET search_path TO sys_config, sys_clinical, public;",
        ""
    ]
    
    with engine.connect() as conn:
        # 1. Planes de Suscripción
        output_lines.extend(dump_table_to_inserts(conn, "sys_config.planes_suscripcion", [
            "id", "codigo", "nombre", "precio_mensual", "max_pacientes", 
            "max_citas_mes", "incluye_whatsapp", "incluye_multiusuario", 
            "activo", "soporte_prioritario"
        ]))
        
        # 2. Especialidades
        output_lines.extend(dump_table_to_inserts(conn, "sys_config.especialidades", [
            "id", "nombre", "codigo", "activo"
        ]))
        
        # 3. Secciones de Historia Clínica
        output_lines.extend(dump_table_to_inserts(conn, "sys_config.hc_secciones", [
            "id", "codigo", "nombre", "descripcion", "componente_frontend", "activo"
        ]))
        
        # 4. Mapeo Especialidad <-> Secciones
        output_lines.extend(dump_table_to_inserts(conn, "sys_config.especialidad_hc_secciones", [
            "especialidad_id", "hc_seccion_id", "orden", "obligatoria"
        ]))
        
        # 5. Administrador por defecto
        # Haremos un select de los administradores actuales para ver si hay alguno.
        # Si no hay, o queremos asegurar uno limpio, añadiremos uno por defecto.
        admin_res = conn.execute(text("SELECT id, email, password_hash, nombre, apellido, activo FROM sys_config.administradores")).fetchall()
        if admin_res:
            output_lines.append("-- Administradores registrados")
            for admin in admin_res:
                vals = [escape_sql_val(val) for val in admin]
                vals_str = ", ".join(vals)
                output_lines.append(
                    f"INSERT INTO sys_config.administradores (id, email, password_hash, nombre, apellido, activo) "
                    f"VALUES ({vals_str}) ON CONFLICT (email) DO NOTHING;"
                )
        else:
            # Insertar administrador por defecto: admin@vitalnexus.com / pbkdf2 contrasenna hash (e.g. 12345678 o similar)
            # Clave: pbkdf2:sha256:600000$.... o similar de pwd_context. Usaremos un hash bcrypt / pbkdf2
            # Como usa passlib pwd_context, generemos el hash de 'admin1234' para que el admin pueda entrar.
            # Encriptaremos admin1234
            output_lines.append("-- Administrador por defecto (Contraseña: admin1234)")
            # Hash precalculado de 'admin1234' usando passlib (bcrypt o pbkdf2_sha256 según se use)
            # Para estar 100% seguros de que use el formateador correcto del backend, podemos usar pwd_context.hash('admin1234')
            from passlib.context import CryptContext
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            hash_val = pwd_context.hash("admin1234")
            
            import uuid
            admin_id = str(uuid.uuid4())
            output_lines.append(
                f"INSERT INTO sys_config.administradores (id, email, password_hash, nombre, apellido, activo) "
                f"VALUES ('{admin_id}', 'admin@vitalnexus.com', '{hash_val}', 'Administrador', 'Sistema', TRUE) ON CONFLICT (email) DO NOTHING;"
            )
            
    output_path = "BD/seed_production.sql"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(output_lines))
        
    print(f"Semillas exportadas exitosamente a: {output_path}")

if __name__ == "__main__":
    main()
