import sys
from sqlmodel import create_engine, text
from app.config import settings

def run_sql_script(file_path):
    print(f"Connecting to: {settings.database_url}")
    engine = create_engine(settings.database_url)
    
    with open(file_path, 'r', encoding='utf-8') as f:
        sql = f.read()
        
    with engine.begin() as conn:
        print(f"Executing script: {file_path}")
        conn.execute(text(sql))
        
    print("Execution successful!")
    engine.dispose()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python run_sql.py <script.sql>")
        sys.exit(1)
    run_sql_script(sys.argv[1])
