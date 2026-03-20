from app.database import engine
from sqlalchemy import text
import sys

def check_cola():
    try:
        with engine.connect() as conn:
            # Check last 5 messages
            msgs = conn.execute(text("SELECT id, metodo, destino, estado, ultimo_error, reintentos FROM sys_clinical.cola_mensajes ORDER BY created_at DESC LIMIT 5")).fetchall()
            print("Últimos 5 mensajes en la cola:")
            for m in msgs:
                print(f" - ID: {m[0]}, Método: {m[1]}, Destino: {m[2]}, Estado: {m[3]}, Error: {m[4]}, Intentos: {m[5]}")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    check_cola()
