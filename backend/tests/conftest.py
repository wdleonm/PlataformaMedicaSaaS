import pytest
from sqlalchemy import text, create_engine
from sqlmodel import SQLModel, Session
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_session
from app.config import settings

# Database URLs
TEST_DB_NAME = "analytics_test"
base_url = settings.database_url.rsplit("/", 1)[0]
TEST_DATABASE_URL = f"{base_url}/{TEST_DB_NAME}"
ADMIN_DATABASE_URL = f"{base_url}/postgres"

def setup_test_database():
    # 1. Crear base de datos
    admin_engine = create_engine(ADMIN_DATABASE_URL)
    with admin_engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT")
        conn.execute(text(f"""
            SELECT pg_terminate_backend(pg_stat_activity.pid)
            FROM pg_stat_activity
            WHERE pg_stat_activity.datname = '{TEST_DB_NAME}' AND pid <> pg_backend_pid();
        """))
        conn.execute(text(f"DROP DATABASE IF EXISTS {TEST_DB_NAME};"))
        conn.execute(text(f"CREATE DATABASE {TEST_DB_NAME};"))
    admin_engine.dispose()

    # 2. Conectar a test database y crear esquemas y extensiones
    test_engine = create_engine(TEST_DATABASE_URL)
    with test_engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT")
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS sys_config;"))
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS sys_clinical;"))
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"))
    
    # 3. Crear tablas usando metadata de SQLModel
    import app.models
    SQLModel.metadata.create_all(test_engine)
    
    # 4. Habilitar políticas RLS, funciones, triggers y semillas
    with test_engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT")
        
        # Habilitar RLS en tablas operativas
        rls_statements = [
            "ALTER TABLE sys_config.especialistas ENABLE ROW LEVEL SECURITY;",
            "DROP POLICY IF EXISTS especialistas_isolate ON sys_config.especialistas;",
            "CREATE POLICY especialistas_isolate ON sys_config.especialistas FOR ALL USING (id = current_setting('app.especialista_id', true)::uuid);",
            "DROP POLICY IF EXISTS especialistas_insert ON sys_config.especialistas;",
            "CREATE POLICY especialistas_insert ON sys_config.especialistas FOR INSERT WITH CHECK (true);",
            
            "ALTER TABLE sys_config.especialista_especialidades ENABLE ROW LEVEL SECURITY;",
            "DROP POLICY IF EXISTS especialista_especialidades_tenant ON sys_config.especialista_especialidades;",
            "CREATE POLICY especialista_especialidades_tenant ON sys_config.especialista_especialidades FOR ALL USING (especialista_id = current_setting('app.especialista_id', true)::uuid);",
            "DROP POLICY IF EXISTS especialista_especialidades_insert ON sys_config.especialista_especialidades;",
            "CREATE POLICY especialista_especialidades_insert ON sys_config.especialista_especialidades FOR INSERT WITH CHECK (true);",
            
            "ALTER TABLE sys_clinical.pacientes ENABLE ROW LEVEL SECURITY;",
            "DROP POLICY IF EXISTS pacientes_tenant ON sys_clinical.pacientes;",
            "CREATE POLICY pacientes_tenant ON sys_clinical.pacientes FOR ALL USING (especialista_id = current_setting('app.especialista_id', true)::uuid) WITH CHECK (especialista_id = current_setting('app.especialista_id', true)::uuid);",
            
            "ALTER TABLE sys_clinical.odontograma_registros ENABLE ROW LEVEL SECURITY;",
            "DROP POLICY IF EXISTS odontograma_registros_tenant ON sys_clinical.odontograma_registros;",
            "CREATE POLICY odontograma_registros_tenant ON sys_clinical.odontograma_registros FOR ALL USING (especialista_id = current_setting('app.especialista_id', true)::uuid) WITH CHECK (especialista_id = current_setting('app.especialista_id', true)::uuid);",
            
            "ALTER TABLE sys_clinical.historias_clinicas ENABLE ROW LEVEL SECURITY;",
            "DROP POLICY IF EXISTS historias_clinicas_tenant ON sys_clinical.historias_clinicas;",
            "CREATE POLICY historias_clinicas_tenant ON sys_clinical.historias_clinicas FOR ALL USING (especialista_id = current_setting('app.especialista_id', true)::uuid) WITH CHECK (especialista_id = current_setting('app.especialista_id', true)::uuid);",
            
            "ALTER TABLE sys_config.insumos ENABLE ROW LEVEL SECURITY;",
            "DROP POLICY IF EXISTS insumos_tenant ON sys_config.insumos;",
            "CREATE POLICY insumos_tenant ON sys_config.insumos FOR ALL USING (especialista_id = current_setting('app.especialista_id', true)::uuid) WITH CHECK (especialista_id = current_setting('app.especialista_id', true)::uuid);",
            
            "ALTER TABLE sys_config.servicios ENABLE ROW LEVEL SECURITY;",
            "DROP POLICY IF EXISTS servicios_tenant ON sys_config.servicios;",
            "CREATE POLICY servicios_tenant ON sys_config.servicios FOR ALL USING (especialista_id = current_setting('app.especialista_id', true)::uuid) WITH CHECK (especialista_id = current_setting('app.especialista_id', true)::uuid);",
            
            "ALTER TABLE sys_clinical.citas ENABLE ROW LEVEL SECURITY;",
            "DROP POLICY IF EXISTS citas_tenant ON sys_clinical.citas;",
            "CREATE POLICY citas_tenant ON sys_clinical.citas FOR ALL USING (especialista_id = current_setting('app.especialista_id', true)::uuid) WITH CHECK (especialista_id = current_setting('app.especialista_id', true)::uuid);",
            
            "ALTER TABLE sys_clinical.presupuestos ENABLE ROW LEVEL SECURITY;",
            "DROP POLICY IF EXISTS presupuestos_tenant ON sys_clinical.presupuestos;",
            "CREATE POLICY presupuestos_tenant ON sys_clinical.presupuestos FOR ALL USING (especialista_id = current_setting('app.especialista_id', true)::uuid) WITH CHECK (especialista_id = current_setting('app.especialista_id', true)::uuid);",
            
            "ALTER TABLE sys_clinical.abonos ENABLE ROW LEVEL SECURITY;",
            "DROP POLICY IF EXISTS abonos_tenant ON sys_clinical.abonos;",
            "CREATE POLICY abonos_tenant ON sys_clinical.abonos FOR ALL USING (especialista_id = current_setting('app.especialista_id', true)::uuid) WITH CHECK (especialista_id = current_setting('app.especialista_id', true)::uuid);",
            
            "ALTER TABLE sys_clinical.cola_mensajes ENABLE ROW LEVEL SECURITY;",
            "DROP POLICY IF EXISTS cola_mensajes_tenant ON sys_clinical.cola_mensajes;",
            "CREATE POLICY cola_mensajes_tenant ON sys_clinical.cola_mensajes FOR ALL USING (especialista_id = current_setting('app.especialista_id', true)::uuid) WITH CHECK (especialista_id = current_setting('app.especialista_id', true)::uuid);"
        ]
        for stmt in rls_statements:
            conn.execute(text(stmt))
            
        # Crear funciones y triggers
        conn.execute(text("""
            CREATE OR REPLACE FUNCTION sys_config.set_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = now();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        """))
        
        triggers = [
            ("especialistas_updated_at", "sys_config.especialistas"),
            ("pacientes_updated_at", "sys_clinical.pacientes"),
            ("odontograma_registros_updated_at", "sys_clinical.odontograma_registros"),
            ("historias_clinicas_updated_at", "sys_clinical.historias_clinicas"),
            ("insumos_updated_at", "sys_config.insumos"),
            ("servicios_updated_at", "sys_config.servicios"),
            ("citas_updated_at", "sys_clinical.citas"),
            ("presupuestos_updated_at", "sys_clinical.presupuestos")
        ]
        for trigger_name, table in triggers:
            conn.execute(text(f"DROP TRIGGER IF EXISTS {trigger_name} ON {table};"))
            conn.execute(text(f"""
                CREATE TRIGGER {trigger_name}
                BEFORE UPDATE ON {table}
                FOR EACH ROW EXECUTE PROCEDURE sys_config.set_updated_at();
            """))
            
        conn.execute(text("""
            CREATE OR REPLACE VIEW sys_config.v_rentabilidad_servicios AS
            SELECT
                s.id              AS servicio_id,
                s.especialista_id,
                s.nombre          AS servicio_nombre,
                s.precio          AS precio_cobrado,
                COALESCE(SUM(si.cantidad_utilizada * i.costo_unitario), 0) AS costo_insumos,
                s.precio - COALESCE(SUM(si.cantidad_utilizada * i.costo_unitario), 0) AS utilidad_neta
            FROM sys_config.servicios s
            LEFT JOIN sys_config.servicio_insumos si ON si.servicio_id = s.id
            LEFT JOIN sys_config.insumos i          ON i.id = si.insumo_id
            WHERE s.activo = true
            GROUP BY s.id, s.especialista_id, s.nombre, s.precio;
        """))

        conn.execute(text("""
            CREATE OR REPLACE FUNCTION sys_clinical.recalcular_saldo_pendiente()
            RETURNS TRIGGER AS $$
            DECLARE
                v_presupuesto_id UUID;
                v_total          NUMERIC(12,2);
                v_abonado        NUMERIC(12,2);
                v_nuevo_saldo    NUMERIC(12,2);
                v_nuevo_estado   VARCHAR(20);
            BEGIN
                IF TG_OP = 'DELETE' THEN
                    v_presupuesto_id := OLD.presupuesto_id;
                ELSE
                    v_presupuesto_id := NEW.presupuesto_id;
                END IF;

                SELECT total INTO v_total
                FROM sys_clinical.presupuestos
                WHERE id = v_presupuesto_id;

                SELECT COALESCE(SUM(monto), 0) INTO v_abonado
                FROM sys_clinical.abonos
                WHERE presupuesto_id = v_presupuesto_id;

                v_nuevo_saldo := GREATEST(v_total - v_abonado, 0);

                IF v_nuevo_saldo = 0 THEN
                    v_nuevo_estado := 'pagado';
                ELSIF v_abonado > 0 THEN
                    v_nuevo_estado := 'en_pago';
                ELSE
                    v_nuevo_estado := 'aprobado';
                END IF;

                UPDATE sys_clinical.presupuestos
                SET saldo_pendiente = v_nuevo_saldo,
                    estado          = CASE
                                        WHEN estado IN ('borrador','cancelado') THEN estado
                                        ELSE v_nuevo_estado
                                      END,
                    updated_at      = now()
                WHERE id = v_presupuesto_id;

                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;
        """))
        
        conn.execute(text("DROP TRIGGER IF EXISTS abonos_recalcular_saldo ON sys_clinical.abonos;"))
        conn.execute(text("""
            CREATE TRIGGER abonos_recalcular_saldo
            AFTER INSERT OR UPDATE OR DELETE ON sys_clinical.abonos
            FOR EACH ROW EXECUTE PROCEDURE sys_clinical.recalcular_saldo_pendiente();
        """))
        
        conn.execute(text("""
            CREATE OR REPLACE FUNCTION sys_clinical.recalcular_total_presupuesto()
            RETURNS TRIGGER AS $$
            DECLARE
                v_presupuesto_id UUID;
                v_nuevo_total    NUMERIC(12,2);
            BEGIN
                IF TG_OP = 'DELETE' THEN
                    v_presupuesto_id := OLD.presupuesto_id;
                ELSE
                    v_presupuesto_id := NEW.presupuesto_id;
                END IF;

                SELECT COALESCE(SUM(cantidad * precio_unitario), 0) INTO v_nuevo_total
                FROM sys_clinical.presupuesto_detalles
                WHERE presupuesto_id = v_presupuesto_id;

                UPDATE sys_clinical.presupuestos
                SET total           = v_nuevo_total,
                    saldo_pendiente = GREATEST(v_nuevo_total - (
                                        SELECT COALESCE(SUM(monto), 0)
                                        FROM sys_clinical.abonos
                                        WHERE presupuesto_id = v_presupuesto_id
                                      ), 0),
                    updated_at      = now()
                WHERE id = v_presupuesto_id;

                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;
        """))
        
        conn.execute(text("DROP TRIGGER IF EXISTS detalles_recalcular_total ON sys_clinical.presupuesto_detalles;"))
        conn.execute(text("""
            CREATE TRIGGER detalles_recalcular_total
            AFTER INSERT OR UPDATE OR DELETE ON sys_clinical.presupuesto_detalles
            FOR EACH ROW EXECUTE PROCEDURE sys_clinical.recalcular_total_presupuesto();
        """))
        
        # Semillas básicas para pruebas
        conn.execute(text("""
            INSERT INTO sys_config.especialidades (id, nombre, codigo, activo, created_at, updated_at) VALUES
                ('4f14ad31-7e8c-42e6-a0de-678f21723b51', 'Odontología General', 'ODO_GEN', true, now(), now())
            ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
        """))
        conn.execute(text("""
            INSERT INTO sys_config.odontograma_hallazgos (id, codigo, nombre, categoria, descripcion_visual, orden, activo, created_at, updated_at) VALUES
                ('5a14ad31-7e8c-42e6-a0de-678f21723b51', 'CARIES', 'Caries', 'patologia', 'Mancha roja.', 10, true, now(), now()),
                ('5b14ad31-7e8c-42e6-a0de-678f21723b51', 'RESINA_OBT', 'Resina', 'restauracion', 'Área azul.', 50, true, now(), now())
            ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
        """))
        conn.execute(text("""
            INSERT INTO sys_config.planes_suscripcion (id, codigo, nombre, precio_mensual, activo, incluye_whatsapp, incluye_multiusuario, soporte_prioritario, created_at, updated_at) VALUES
                ('70cb7e3f-adbb-42da-b76c-8949dcc71134', 'profesional', 'Plan Profesional', 29.99, true, false, false, false, now(), now())
            ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;
        """))

    test_engine.dispose()

@pytest.fixture(scope="session", autouse=True)
def init_db():
    setup_test_database()
    yield

@pytest.fixture(name="session")
def session_fixture():
    test_engine = create_engine(TEST_DATABASE_URL)
    connection = test_engine.connect()
    transaction = connection.begin()
    
    session = Session(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()
    test_engine.dispose()

@pytest.fixture(name="client")
def client_fixture(session):
    def get_session_override():
        yield session
        
    app.dependency_overrides[get_session] = get_session_override
    
    with TestClient(app) as client:
        yield client
        
    app.dependency_overrides.clear()

@pytest.fixture(name="test_specialist")
def test_specialist_fixture(session):
    from app.models.especialista import Especialista
    from app.api.auth import get_password_hash
    from datetime import date
    
    specialist = session.get(Especialista, "c0943115-4691-4413-97fa-1efa21723b51")
    if not specialist:
        specialist = Especialista(
            id="c0943115-4691-4413-97fa-1efa21723b51",
            email="test_doc@vitalnexus.com",
            password_hash=get_password_hash("password123"),
            nombre="Juan",
            apellido="Perez",
            activo=True,
            suscripcion_activa=True,
            fecha_vencimiento_suscripcion=date(2028, 1, 1),
            plan_suscripcion_id="70cb7e3f-adbb-42da-b76c-8949dcc71134"
        )
        session.add(specialist)
        session.commit()
        session.refresh(specialist)
    return specialist

@pytest.fixture(name="specialist_headers")
def specialist_headers_fixture(test_specialist):
    from app.api.auth import create_access_token
    token = create_access_token(
        data={"sub": str(test_specialist.id), "email": test_specialist.email, "rol": "especialista"}
    )
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(name="test_admin")
def test_admin_fixture(session):
    from app.models.admin import Admin
    from app.api.auth import get_password_hash
    
    admin = session.get(Admin, "d0943115-4691-4413-97fa-1efa21723b51")
    if not admin:
        admin = Admin(
            id="d0943115-4691-4413-97fa-1efa21723b51",
            email="admin_test@vitalnexus.com",
            password_hash=get_password_hash("admin123"),
            nombre="Admin",
            apellido="Sistema",
            activo=True
        )
        session.add(admin)
        session.commit()
        session.refresh(admin)
    return admin

@pytest.fixture(name="admin_headers")
def admin_headers_fixture(test_admin):
    from app.api.auth import create_access_token
    token = create_access_token(
        data={"sub": str(test_admin.id), "email": test_admin.email, "rol": "admin"}
    )
    return {"Authorization": f"Bearer {token}"}
