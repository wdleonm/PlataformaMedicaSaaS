
import sqlite3
import os

db_path = r'c:\xampp\htdocs\github\PlataformaMedicaSaaS\backend\database.db'
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- ESPECIALIDADES DENTALES ---")
cursor.execute("SELECT id, codigo, nombre FROM especialidad WHERE codigo LIKE 'ODO_%'")
for row in cursor.fetchall():
    print(row)

print("\n--- HC SECCIONES ---")
cursor.execute("SELECT id, codigo, nombre FROM hcseccion")
for row in cursor.fetchall():
    print(row)

conn.close()
