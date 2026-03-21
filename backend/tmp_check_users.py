from app.database import engine
from sqlalchemy import text

def check():
    try:
        with engine.connect() as conn:
            # Check specialists
            res = conn.execute(text('SELECT count(*) from sys_config.especialistas'))
            count = res.scalar()
            print(f"Total Specialists: {count}")
            
            # Check admins
            res = conn.execute(text('SELECT count(*) from sys_config.administradores'))
            count_admin = res.scalar()
            print(f"Total Admins: {count_admin}")
            
            if count > 0:
                res = conn.execute(text('SELECT email from sys_config.especialistas'))
                emails = [r[0] for r in res]
                print(f"Specialist emails: {emails}")

            if count_admin > 0:
                res = conn.execute(text('SELECT email from sys_config.administradores'))
                emails_admin = [r[0] for r in res]
                print(f"Admin emails: {emails_admin}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check()
