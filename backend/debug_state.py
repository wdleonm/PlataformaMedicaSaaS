from app.database import engine
from sqlalchemy import text
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

with engine.connect() as conn:
    res = conn.execute(text("""
        SELECT email, activo, suscripcion_activa, forzar_cambio_password_proximo_acceso, 
               exigir_cambio_password, intervalo_cambio_password, fecha_ultimo_cambio_password,
               password_hash
        FROM sys_config.especialistas 
        WHERE email = 'danielaaleonr@gmail.com'
    """))
    row = res.first()
    if row:
        print(f"Email: {row[0]}")
        print(f"Activo: {row[1]}")
        print(f"Suscripción Activa: {row[2]}")
        print(f"Forzar cambio: {row[3]}")
        print(f"Exigir cambio: {row[4]}")
        print(f"Intervalo: {row[5]}")
        print(f"Último cambio: {row[6]}")
        print(f"Verifica '1234': {pwd_context.verify('1234', row[7])}")
    else:
        print("NO ENCONTRADA")
