--
-- PostgreSQL database dump
--

\restrict XzTmvCeOATzuMqUDeoHhAQH1qh9kW7a9JDvGsWJes8LBHn8kRKORZaYJOV48ZKB

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: sys_clinical; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA sys_clinical;


--
-- Name: sys_config; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA sys_config;


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


--
-- Name: recalcular_saldo_pendiente(); Type: FUNCTION; Schema: sys_clinical; Owner: -
--

CREATE FUNCTION sys_clinical.recalcular_saldo_pendiente() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_presupuesto_id UUID;
    v_total          NUMERIC(12,2);
    v_abonado        NUMERIC(12,2);
    v_nuevo_saldo    NUMERIC(12,2);
    v_nuevo_estado   VARCHAR(20);
BEGIN
    -- Determinar qué presupuesto afecta
    IF TG_OP = 'DELETE' THEN
        v_presupuesto_id := OLD.presupuesto_id;
    ELSE
        v_presupuesto_id := NEW.presupuesto_id;
    END IF;

    -- Leer total del presupuesto
    SELECT total INTO v_total
    FROM sys_clinical.presupuestos
    WHERE id = v_presupuesto_id;

    -- Sumar todos los abonos vigentes
    SELECT COALESCE(SUM(monto), 0) INTO v_abonado
    FROM sys_clinical.abonos
    WHERE presupuesto_id = v_presupuesto_id;

    v_nuevo_saldo := GREATEST(v_total - v_abonado, 0);

    -- Actualizar estado según saldo
    IF v_nuevo_saldo = 0 THEN
        v_nuevo_estado := 'pagado';
    ELSIF v_abonado > 0 THEN
        v_nuevo_estado := 'en_pago';
    ELSE
        v_nuevo_estado := 'aprobado';    -- vuelve a aprobado si se revierte el último abono
    END IF;

    UPDATE sys_clinical.presupuestos
    SET saldo_pendiente = v_nuevo_saldo,
        estado          = CASE
                            WHEN estado IN ('borrador','cancelado') THEN estado   -- no cambiar si está borrador o cancelado
                            ELSE v_nuevo_estado
                          END,
        updated_at      = now()
    WHERE id = v_presupuesto_id;

    RETURN NULL;   -- AFTER trigger, valor de retorno ignorado
END;
$$;


--
-- Name: recalcular_total_presupuesto(); Type: FUNCTION; Schema: sys_clinical; Owner: -
--

CREATE FUNCTION sys_clinical.recalcular_total_presupuesto() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_presupuesto_id UUID;
    v_nuevo_total    NUMERIC(12,2);
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_presupuesto_id := OLD.presupuesto_id;
    ELSE
        v_presupuesto_id := NEW.presupuesto_id;
    END IF;

    SELECT COALESCE(SUM(subtotal), 0) INTO v_nuevo_total
    FROM sys_clinical.presupuesto_detalles
    WHERE presupuesto_id = v_presupuesto_id;

    -- Actualizar total y recalcular saldo_pendiente en consecuencia
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
$$;


--
-- Name: fn_seed_especialista_inventory(); Type: FUNCTION; Schema: sys_config; Owner: -
--

CREATE FUNCTION sys_config.fn_seed_especialista_inventory() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM sys_config.servicios WHERE especialista_id = NEW.id AND codigo = 'S-0001') THEN
                INSERT INTO sys_config.servicios (especialista_id, nombre, codigo, precio, duracion_estimada_min)
                VALUES 
                    (NEW.id, 'Consulta de Primera Vez', 'S-0001', 0, 30),
                    (NEW.id, 'Consulta Sucesiva o Control', 'S-0002', 0, 20);
            END IF;

            IF NOT EXISTS (SELECT 1 FROM sys_config.insumos WHERE especialista_id = NEW.id AND codigo = 'I-0001') THEN
                INSERT INTO sys_config.insumos (especialista_id, nombre, codigo, unidad, stock_actual, stock_minimo)
                VALUES 
                    (NEW.id, 'Guantes', 'I-0001', 'par', 0, 10),
                    (NEW.id, 'Tapa Bocas', 'I-0002', 'unidad', 0, 10);
            END IF;

            RETURN NEW;
        END;
        $$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: sys_config; Owner: -
--

CREATE FUNCTION sys_config.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: abonos; Type: TABLE; Schema: sys_clinical; Owner: -
--

CREATE TABLE sys_clinical.abonos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    especialista_id uuid NOT NULL,
    presupuesto_id uuid NOT NULL,
    monto numeric(12,2) NOT NULL,
    fecha_abono date DEFAULT CURRENT_DATE NOT NULL,
    metodo_pago character varying(30) DEFAULT 'efectivo'::character varying NOT NULL,
    notas text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    referencia_pago character varying(100),
    medio_pago character varying(50),
    cita_id uuid,
    CONSTRAINT abonos_metodo_pago_check CHECK (((metodo_pago)::text = ANY (ARRAY[('efectivo'::character varying)::text, ('transferencia'::character varying)::text, ('tarjeta_debito'::character varying)::text, ('tarjeta_credito'::character varying)::text, ('cheque'::character varying)::text, ('otro'::character varying)::text]))),
    CONSTRAINT abonos_monto_check CHECK ((monto > (0)::numeric))
);


--
-- Name: TABLE abonos; Type: COMMENT; Schema: sys_clinical; Owner: -
--

COMMENT ON TABLE sys_clinical.abonos IS 'Pagos parciales o totales de un presupuesto. Cada INSERT dispara el trigger que actualiza presupuestos.saldo_pendiente.';


--
-- Name: categorias_gastos; Type: TABLE; Schema: sys_clinical; Owner: -
--

CREATE TABLE sys_clinical.categorias_gastos (
    id uuid NOT NULL,
    especialista_id uuid,
    nombre character varying(100) NOT NULL,
    descripcion character varying,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: citas; Type: TABLE; Schema: sys_clinical; Owner: -
--

CREATE TABLE sys_clinical.citas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    especialista_id uuid NOT NULL,
    paciente_id uuid NOT NULL,
    servicio_id uuid,
    fecha_hora timestamp with time zone NOT NULL,
    duracion_min smallint,
    estado character varying(20) DEFAULT 'programada'::character varying NOT NULL,
    monto_cobrado numeric(12,2),
    costo_insumos numeric(12,2),
    utilidad_neta numeric(12,2),
    notas text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    presupuesto_id uuid,
    abono_id uuid,
    costo_merma double precision,
    CONSTRAINT citas_costo_insumos_check CHECK ((costo_insumos >= (0)::numeric)),
    CONSTRAINT citas_duracion_min_check CHECK ((duracion_min > 0)),
    CONSTRAINT citas_estado_check CHECK (((estado)::text = ANY (ARRAY[('programada'::character varying)::text, ('confirmada'::character varying)::text, ('en_curso'::character varying)::text, ('completada'::character varying)::text, ('cancelada'::character varying)::text, ('no_asistio'::character varying)::text]))),
    CONSTRAINT citas_monto_cobrado_check CHECK ((monto_cobrado >= (0)::numeric))
);


--
-- Name: TABLE citas; Type: COMMENT; Schema: sys_clinical; Owner: -
--

COMMENT ON TABLE sys_clinical.citas IS 'Agenda de citas/consultas. Al completar una cita se registran monto_cobrado, costo_insumos y utilidad_neta para trazabilidad de rentabilidad (Regla de Oro 3.2).';


--
-- Name: COLUMN citas.estado; Type: COMMENT; Schema: sys_clinical; Owner: -
--

COMMENT ON COLUMN sys_clinical.citas.estado IS 'programada→confirmada→en_curso→completada | cancelada | no_asistio';


--
-- Name: cola_mensajes; Type: TABLE; Schema: sys_clinical; Owner: -
--

CREATE TABLE sys_clinical.cola_mensajes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    especialista_id uuid NOT NULL,
    tipo character varying(40) NOT NULL,
    destino character varying(255) NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    estado character varying(15) DEFAULT 'pendiente'::character varying NOT NULL,
    reintentos smallint DEFAULT 0 NOT NULL,
    max_reintentos smallint DEFAULT 3 NOT NULL,
    ultimo_error text,
    abono_id uuid,
    cita_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    enviado_at timestamp with time zone,
    leido_at timestamp with time zone,
    proximo_intento timestamp with time zone DEFAULT now(),
    metodo character varying(15) DEFAULT 'whatsapp'::character varying,
    CONSTRAINT cola_mensajes_estado_check CHECK (((estado)::text = ANY (ARRAY[('pendiente'::character varying)::text, ('enviado'::character varying)::text, ('leido'::character varying)::text, ('fallido'::character varying)::text, ('cancelado'::character varying)::text]))),
    CONSTRAINT cola_mensajes_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('abono_confirmacion'::character varying)::text, ('recordatorio_cita'::character varying)::text, ('presupuesto_aprobado'::character varying)::text, ('cita_cancelada'::character varying)::text, ('personalizado'::character varying)::text])))
);


--
-- Name: TABLE cola_mensajes; Type: COMMENT; Schema: sys_clinical; Owner: -
--

COMMENT ON TABLE sys_clinical.cola_mensajes IS 'Cola persistente de mensajes WhatsApp vía YCloud API (Regla de Oro 3.4). Un worker procesa las filas con estado=pendiente y reintentos < max_reintentos.';


--
-- Name: COLUMN cola_mensajes.destino; Type: COMMENT; Schema: sys_clinical; Owner: -
--

COMMENT ON COLUMN sys_clinical.cola_mensajes.destino IS 'Número en formato E.164 sin +. Ejemplo: 58414XXXXXXX para Venezuela.';


--
-- Name: COLUMN cola_mensajes.payload; Type: COMMENT; Schema: sys_clinical; Owner: -
--

COMMENT ON COLUMN sys_clinical.cola_mensajes.payload IS 'Variables del mensaje como JSON. Depende del campo tipo.';


--
-- Name: COLUMN cola_mensajes.proximo_intento; Type: COMMENT; Schema: sys_clinical; Owner: -
--

COMMENT ON COLUMN sys_clinical.cola_mensajes.proximo_intento IS 'El worker solo procesa filas donde proximo_intento <= now(). Al fallar se incrementa con backoff exponencial (1min, 2min, 4min…).';


--
-- Name: gastos_fijos; Type: TABLE; Schema: sys_clinical; Owner: -
--

CREATE TABLE sys_clinical.gastos_fijos (
    id uuid NOT NULL,
    especialista_id uuid NOT NULL,
    categoria_id uuid NOT NULL,
    descripcion character varying,
    monto double precision NOT NULL,
    fecha_pago date NOT NULL,
    periodo_mes integer NOT NULL,
    periodo_anio integer NOT NULL,
    es_recurrente boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: historias_clinicas; Type: TABLE; Schema: sys_clinical; Owner: -
--

CREATE TABLE sys_clinical.historias_clinicas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    especialista_id uuid NOT NULL,
    paciente_id uuid NOT NULL,
    fecha_apertura date DEFAULT CURRENT_DATE NOT NULL,
    motivo_consulta text,
    diagnostico text,
    plan_tratamiento text,
    notas text,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    enfermedad_actual text,
    antecedentes_familiares jsonb,
    antecedentes_personales jsonb,
    examen_clinico jsonb,
    estudios_complementarios jsonb,
    especialidad_id uuid,
    actividades_realizadas character varying
);


--
-- Name: TABLE historias_clinicas; Type: COMMENT; Schema: sys_clinical; Owner: -
--

COMMENT ON TABLE sys_clinical.historias_clinicas IS 'Historia clínica por paciente. Puede tener múltiples entradas (episodios). Cada apertura representa una consulta o episodio de atención.';


--
-- Name: COLUMN historias_clinicas.antecedentes_familiares; Type: COMMENT; Schema: sys_clinical; Owner: -
--

COMMENT ON COLUMN sys_clinical.historias_clinicas.antecedentes_familiares IS 'JSONB con info de salud de madre y padre';


--
-- Name: COLUMN historias_clinicas.antecedentes_personales; Type: COMMENT; Schema: sys_clinical; Owner: -
--

COMMENT ON COLUMN sys_clinical.historias_clinicas.antecedentes_personales IS 'JSONB con patologías previas y medicamentos';


--
-- Name: COLUMN historias_clinicas.examen_clinico; Type: COMMENT; Schema: sys_clinical; Owner: -
--

COMMENT ON COLUMN sys_clinical.historias_clinicas.examen_clinico IS 'JSONB con inspección de encías, lengua, paladar, etc.';


--
-- Name: COLUMN historias_clinicas.estudios_complementarios; Type: COMMENT; Schema: sys_clinical; Owner: -
--

COMMENT ON COLUMN sys_clinical.historias_clinicas.estudios_complementarios IS 'JSONB con resultados de rayos X y laboratorio';


--
-- Name: historias_clinicas_adjuntos; Type: TABLE; Schema: sys_clinical; Owner: -
--

CREATE TABLE sys_clinical.historias_clinicas_adjuntos (
    id uuid NOT NULL,
    historia_id uuid NOT NULL,
    nombre_archivo character varying(255) NOT NULL,
    ruta_archivo character varying(500) NOT NULL,
    tipo_mime character varying(100) NOT NULL,
    tamano integer NOT NULL,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: odontograma_registros; Type: TABLE; Schema: sys_clinical; Owner: -
--

CREATE TABLE sys_clinical.odontograma_registros (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    especialista_id uuid NOT NULL,
    paciente_id uuid NOT NULL,
    numero_diente smallint NOT NULL,
    cara_diente character varying(2) NOT NULL,
    hallazgo_id uuid NOT NULL,
    fecha_registro date DEFAULT CURRENT_DATE NOT NULL,
    notas text,
    historia_clinica_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT odontograma_registros_cara_diente_check CHECK (((cara_diente)::text = ANY (ARRAY[('O'::character varying)::text, ('M'::character varying)::text, ('D'::character varying)::text, ('V'::character varying)::text, ('L'::character varying)::text, ('R'::character varying)::text]))),
    CONSTRAINT odontograma_registros_numero_diente_check CHECK ((((numero_diente >= 11) AND (numero_diente <= 18)) OR ((numero_diente >= 21) AND (numero_diente <= 28)) OR ((numero_diente >= 31) AND (numero_diente <= 38)) OR ((numero_diente >= 41) AND (numero_diente <= 48)) OR ((numero_diente >= 51) AND (numero_diente <= 55)) OR ((numero_diente >= 61) AND (numero_diente <= 65)) OR ((numero_diente >= 71) AND (numero_diente <= 75)) OR ((numero_diente >= 81) AND (numero_diente <= 85))))
);


--
-- Name: TABLE odontograma_registros; Type: COMMENT; Schema: sys_clinical; Owner: -
--

COMMENT ON TABLE sys_clinical.odontograma_registros IS 'Registros evolutivos de odontograma. Solo INSERT: cada cambio de hallazgo genera una nueva fila. El estado en una fecha dada se obtiene tomando el último registro por (paciente_id, numero_diente, cara_diente) <= fecha.';


--
-- Name: COLUMN odontograma_registros.numero_diente; Type: COMMENT; Schema: sys_clinical; Owner: -
--

COMMENT ON COLUMN sys_clinical.odontograma_registros.numero_diente IS 'Notación FDI. Permanentes: 11-18, 21-28, 31-38, 41-48. Temporales: 51-55, 61-65, 71-75, 81-85.';


--
-- Name: COLUMN odontograma_registros.cara_diente; Type: COMMENT; Schema: sys_clinical; Owner: -
--

COMMENT ON COLUMN sys_clinical.odontograma_registros.cara_diente IS 'O=Oclusal, M=Mesial, D=Distal, V=Vestibular, L=Lingual, R=Raíz';


--
-- Name: pacientes; Type: TABLE; Schema: sys_clinical; Owner: -
--

CREATE TABLE sys_clinical.pacientes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    especialista_id uuid NOT NULL,
    nombre character varying(120) NOT NULL,
    apellido character varying(120) NOT NULL,
    documento character varying(50),
    telefono character varying(50),
    email character varying(255),
    fecha_nacimiento date,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    sexo character varying(2),
    direccion text,
    lugar_nacimiento character varying(100),
    estado_civil character varying(50),
    ocupacion character varying(100),
    contacto_emergencia_nombre character varying(120),
    contacto_emergencia_telefono character varying(50),
    contacto_emergencia_parentesco character varying(50),
    origen_registro character varying(20) DEFAULT 'interno'::character varying,
    alergias text,
    patologias_cronicas text,
    medicacion_frecuente text
);


--
-- Name: TABLE pacientes; Type: COMMENT; Schema: sys_clinical; Owner: -
--

COMMENT ON TABLE sys_clinical.pacientes IS 'Pacientes asociados a un especialista (tenant).';


--
-- Name: COLUMN pacientes.especialista_id; Type: COMMENT; Schema: sys_clinical; Owner: -
--

COMMENT ON COLUMN sys_clinical.pacientes.especialista_id IS 'Tenant owner; se usa para RLS.';


--
-- Name: COLUMN pacientes.sexo; Type: COMMENT; Schema: sys_clinical; Owner: -
--

COMMENT ON COLUMN sys_clinical.pacientes.sexo IS 'M=Masculino, F=Femenino';


--
-- Name: presupuesto_detalles; Type: TABLE; Schema: sys_clinical; Owner: -
--

CREATE TABLE sys_clinical.presupuesto_detalles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    presupuesto_id uuid NOT NULL,
    servicio_id uuid,
    descripcion character varying(200),
    cantidad numeric(8,2) DEFAULT 1 NOT NULL,
    precio_unitario numeric(12,2) DEFAULT 0 NOT NULL,
    subtotal numeric(12,2) GENERATED ALWAYS AS ((cantidad * precio_unitario)) STORED,
    CONSTRAINT presupuesto_detalles_cantidad_check CHECK ((cantidad > (0)::numeric))
);


--
-- Name: TABLE presupuesto_detalles; Type: COMMENT; Schema: sys_clinical; Owner: -
--

COMMENT ON TABLE sys_clinical.presupuesto_detalles IS 'Líneas del presupuesto. subtotal es calculado automáticamente por la BD.';


--
-- Name: presupuestos; Type: TABLE; Schema: sys_clinical; Owner: -
--

CREATE TABLE sys_clinical.presupuestos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    especialista_id uuid NOT NULL,
    paciente_id uuid NOT NULL,
    fecha date DEFAULT CURRENT_DATE NOT NULL,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    saldo_pendiente numeric(12,2) DEFAULT 0 NOT NULL,
    estado character varying(20) DEFAULT 'borrador'::character varying NOT NULL,
    validez_fecha date,
    notas text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT presupuestos_estado_check CHECK (((estado)::text = ANY (ARRAY[('borrador'::character varying)::text, ('aprobado'::character varying)::text, ('en_pago'::character varying)::text, ('pagado'::character varying)::text, ('cancelado'::character varying)::text]))),
    CONSTRAINT presupuestos_saldo_pendiente_check CHECK ((saldo_pendiente >= (0)::numeric)),
    CONSTRAINT presupuestos_total_check CHECK ((total >= (0)::numeric))
);


--
-- Name: TABLE presupuestos; Type: COMMENT; Schema: sys_clinical; Owner: -
--

COMMENT ON TABLE sys_clinical.presupuestos IS 'Presupuesto de tratamiento. saldo_pendiente se actualiza automáticamente vía trigger al insertar/modificar abonos (Regla de Oro 3.3).';


--
-- Name: administradores; Type: TABLE; Schema: sys_config; Owner: -
--

CREATE TABLE sys_config.administradores (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    nombre character varying(120) NOT NULL,
    apellido character varying(120) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    rol character varying(20) DEFAULT 'master'::character varying NOT NULL,
    pin_seguridad_hash character varying(255)
);


--
-- Name: TABLE administradores; Type: COMMENT; Schema: sys_config; Owner: -
--

COMMENT ON TABLE sys_config.administradores IS 'Usuarios con privilegios administrativos para gestionar especialistas y planes.';


--
-- Name: COLUMN administradores.rol; Type: COMMENT; Schema: sys_config; Owner: -
--

COMMENT ON COLUMN sys_config.administradores.rol IS 'Rol del administrador: master (acceso total), solo_lectura (auditoría).';


--
-- Name: bcv_tasas_historial; Type: TABLE; Schema: sys_config; Owner: -
--

CREATE TABLE sys_config.bcv_tasas_historial (
    id uuid NOT NULL,
    fecha timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    tasa_usd double precision NOT NULL,
    tasa_eur double precision NOT NULL,
    fuente character varying(20) DEFAULT 'BCV'::character varying
);


--
-- Name: catalogo_insumos; Type: TABLE; Schema: sys_config; Owner: -
--

CREATE TABLE sys_config.catalogo_insumos (
    id uuid NOT NULL,
    sku character varying(50),
    nombre character varying(200) NOT NULL,
    categoria character varying(100),
    descripcion character varying,
    precio_usd double precision NOT NULL,
    imagen_url character varying(500),
    enlace_origen character varying(500),
    activo boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    unidades integer DEFAULT 1
);


--
-- Name: configuracion_global; Type: TABLE; Schema: sys_config; Owner: -
--

CREATE TABLE sys_config.configuracion_global (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    moneda_nombre character varying(50) DEFAULT 'Bolívar'::character varying NOT NULL,
    moneda_simbolo character varying(10) DEFAULT 'Bs.'::character varying NOT NULL,
    tasa_usd numeric(15,4) DEFAULT 1.0 NOT NULL,
    tasa_eur numeric(15,4) DEFAULT 1.0 NOT NULL,
    iva_porcentaje numeric(5,2) DEFAULT 16.0 NOT NULL,
    bcv_modo_automatico boolean DEFAULT true NOT NULL,
    bcv_ultima_sincronizacion timestamp with time zone,
    ycloud_api_key text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    ycloud_whatsapp_number character varying(50)
);


--
-- Name: especialidad_hc_secciones; Type: TABLE; Schema: sys_config; Owner: -
--

CREATE TABLE sys_config.especialidad_hc_secciones (
    especialidad_id uuid NOT NULL,
    hc_seccion_id uuid NOT NULL,
    orden integer DEFAULT 0 NOT NULL,
    obligatoria boolean DEFAULT false
);


--
-- Name: TABLE especialidad_hc_secciones; Type: COMMENT; Schema: sys_config; Owner: -
--

COMMENT ON TABLE sys_config.especialidad_hc_secciones IS 'Configura las secciones de la Historia Clínica para cada especialidad. orden define el tab position; obligatoria indica si la sección es requerida.';


--
-- Name: especialidades; Type: TABLE; Schema: sys_config; Owner: -
--

CREATE TABLE sys_config.especialidades (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nombre character varying(120) NOT NULL,
    codigo character varying(20) NOT NULL,
    descripcion text,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: especialista_especialidades; Type: TABLE; Schema: sys_config; Owner: -
--

CREATE TABLE sys_config.especialista_especialidades (
    especialista_id uuid NOT NULL,
    especialidad_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: especialistas; Type: TABLE; Schema: sys_config; Owner: -
--

CREATE TABLE sys_config.especialistas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    nombre character varying(120) NOT NULL,
    apellido character varying(120) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    plan_suscripcion_id uuid,
    suscripcion_activa boolean DEFAULT true NOT NULL,
    fecha_vencimiento_suscripcion date,
    notas_admin text,
    slug_url character varying(100),
    portal_visible boolean DEFAULT false,
    descripcion_perfil text,
    horario_atencion jsonb,
    exigir_cambio_password boolean DEFAULT false,
    intervalo_cambio_password integer,
    fecha_ultimo_cambio_password timestamp without time zone DEFAULT now(),
    redes_sociales jsonb DEFAULT '{}'::jsonb,
    clinica_nombre character varying(200),
    clinica_logo_url character varying(500),
    clinica_direccion text,
    forzar_cambio_password_proximo_acceso boolean DEFAULT false,
    mostrar_precios_portal boolean DEFAULT false
);


--
-- Name: COLUMN especialistas.plan_suscripcion_id; Type: COMMENT; Schema: sys_config; Owner: -
--

COMMENT ON COLUMN sys_config.especialistas.plan_suscripcion_id IS 'Plan contratado actualmente por el especialista.';


--
-- Name: COLUMN especialistas.suscripcion_activa; Type: COMMENT; Schema: sys_config; Owner: -
--

COMMENT ON COLUMN sys_config.especialistas.suscripcion_activa IS 'Flag para bloqueo rápido de acceso por pagos o términos.';


--
-- Name: COLUMN especialistas.slug_url; Type: COMMENT; Schema: sys_config; Owner: -
--

COMMENT ON COLUMN sys_config.especialistas.slug_url IS 'URL amigable para el portal de pacientes (ej: dr-perez)';


--
-- Name: COLUMN especialistas.horario_atencion; Type: COMMENT; Schema: sys_config; Owner: -
--

COMMENT ON COLUMN sys_config.especialistas.horario_atencion IS 'Configuración de disponibilidad para auto-agendamiento';


--
-- Name: COLUMN especialistas.redes_sociales; Type: COMMENT; Schema: sys_config; Owner: -
--

COMMENT ON COLUMN sys_config.especialistas.redes_sociales IS 'Diccionario con links a RRSS (Instagram, Facebook, etc).';


--
-- Name: COLUMN especialistas.clinica_nombre; Type: COMMENT; Schema: sys_config; Owner: -
--

COMMENT ON COLUMN sys_config.especialistas.clinica_nombre IS 'Nombre comercial del consultorio o clínica.';


--
-- Name: COLUMN especialistas.clinica_direccion; Type: COMMENT; Schema: sys_config; Owner: -
--

COMMENT ON COLUMN sys_config.especialistas.clinica_direccion IS 'Dirección física detallada para mostrar en recibos.';


--
-- Name: hc_secciones; Type: TABLE; Schema: sys_config; Owner: -
--

CREATE TABLE sys_config.hc_secciones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo character varying(50) NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    componente_frontend character varying(100) NOT NULL,
    activo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE hc_secciones; Type: COMMENT; Schema: sys_config; Owner: -
--

COMMENT ON TABLE sys_config.hc_secciones IS 'Catálogo global de secciones disponibles para Historias Clínicas. componente_frontend contiene el nombre del componente React (switch renderer en el modal).';


--
-- Name: insumos; Type: TABLE; Schema: sys_config; Owner: -
--

CREATE TABLE sys_config.insumos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    especialista_id uuid NOT NULL,
    nombre character varying(150) NOT NULL,
    codigo character varying(40),
    unidad character varying(30) DEFAULT 'unidad'::character varying NOT NULL,
    costo_unitario numeric(12,4) DEFAULT 0 NOT NULL,
    stock_actual numeric(12,4) DEFAULT 0 NOT NULL,
    stock_minimo numeric(12,4) DEFAULT 0 NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    unidades_por_paquete integer DEFAULT 1,
    imagen_url character varying(500),
    CONSTRAINT insumos_costo_unitario_check CHECK ((costo_unitario >= (0)::numeric)),
    CONSTRAINT insumos_stock_actual_check CHECK ((stock_actual >= (0)::numeric)),
    CONSTRAINT insumos_stock_minimo_check CHECK ((stock_minimo >= (0)::numeric))
);


--
-- Name: TABLE insumos; Type: COMMENT; Schema: sys_config; Owner: -
--

COMMENT ON TABLE sys_config.insumos IS 'Inventario de insumos/materiales por especialista (tenant). costo_unitario se usa para calcular la rentabilidad de servicios (Regla de Oro 3.2).';


--
-- Name: inventario_movimientos; Type: TABLE; Schema: sys_config; Owner: -
--

CREATE TABLE sys_config.inventario_movimientos (
    id uuid NOT NULL,
    especialista_id uuid NOT NULL,
    insumo_id uuid NOT NULL,
    tipo character varying(20) NOT NULL,
    cantidad double precision NOT NULL,
    costo_unitario_historico double precision NOT NULL,
    motivo_o_referencia character varying,
    fecha timestamp without time zone NOT NULL
);


--
-- Name: log_suscripciones; Type: TABLE; Schema: sys_config; Owner: -
--

CREATE TABLE sys_config.log_suscripciones (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    especialista_id uuid NOT NULL,
    admin_id uuid,
    cambio jsonb NOT NULL,
    motivo text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: odontograma_hallazgos; Type: TABLE; Schema: sys_config; Owner: -
--

CREATE TABLE sys_config.odontograma_hallazgos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    codigo character varying(30) NOT NULL,
    nombre character varying(80) NOT NULL,
    categoria character varying(20) NOT NULL,
    descripcion_visual character varying(200),
    activo boolean DEFAULT true NOT NULL,
    orden smallint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT odontograma_hallazgos_categoria_check CHECK (((categoria)::text = ANY (ARRAY[('patologia'::character varying)::text, ('restauracion'::character varying)::text, ('estado'::character varying)::text])))
);


--
-- Name: planes_suscripcion; Type: TABLE; Schema: sys_config; Owner: -
--

CREATE TABLE sys_config.planes_suscripcion (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    codigo character varying(30) NOT NULL,
    nombre character varying(100) NOT NULL,
    precio_mensual numeric(12,2) DEFAULT 0 NOT NULL,
    max_pacientes integer,
    max_citas_mes integer,
    incluye_whatsapp boolean DEFAULT false NOT NULL,
    incluye_multiusuario boolean DEFAULT false NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    soporte_prioritario boolean DEFAULT false
);


--
-- Name: TABLE planes_suscripcion; Type: COMMENT; Schema: sys_config; Owner: -
--

COMMENT ON TABLE sys_config.planes_suscripcion IS 'Catálogo de planes de suscripción ofrecidos por la plataforma.';


--
-- Name: servicio_insumos; Type: TABLE; Schema: sys_config; Owner: -
--

CREATE TABLE sys_config.servicio_insumos (
    servicio_id uuid NOT NULL,
    insumo_id uuid NOT NULL,
    cantidad_utilizada numeric(12,4) DEFAULT 1 NOT NULL,
    CONSTRAINT servicio_insumos_cantidad_utilizada_check CHECK ((cantidad_utilizada > (0)::numeric))
);


--
-- Name: TABLE servicio_insumos; Type: COMMENT; Schema: sys_config; Owner: -
--

COMMENT ON TABLE sys_config.servicio_insumos IS 'Receta de insumos por servicio. Permite calcular el costo de materiales y la utilidad neta.';


--
-- Name: servicios; Type: TABLE; Schema: sys_config; Owner: -
--

CREATE TABLE sys_config.servicios (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    especialista_id uuid NOT NULL,
    nombre character varying(150) NOT NULL,
    codigo character varying(40),
    precio numeric(12,2) DEFAULT 0 NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    visible_publico boolean DEFAULT true,
    duracion_estimada_min integer DEFAULT 30,
    merma_porcentaje double precision DEFAULT 0.0,
    categoria character varying(100),
    descripcion text,
    CONSTRAINT servicios_precio_check CHECK ((precio >= (0)::numeric))
);


--
-- Name: TABLE servicios; Type: COMMENT; Schema: sys_config; Owner: -
--

COMMENT ON TABLE sys_config.servicios IS 'Catálogo de servicios ofrecidos por el especialista. El precio es la tarifa cobrada al paciente. El costo se calcula vía servicio_insumos.';


--
-- Name: COLUMN servicios.duracion_estimada_min; Type: COMMENT; Schema: sys_config; Owner: -
--

COMMENT ON COLUMN sys_config.servicios.duracion_estimada_min IS 'Duración en minutos para el bloqueo de agenda automático';


--
-- Name: v_rentabilidad_servicios; Type: VIEW; Schema: sys_config; Owner: -
--

CREATE VIEW sys_config.v_rentabilidad_servicios AS
 SELECT s.id AS servicio_id,
    s.especialista_id,
    s.nombre AS servicio_nombre,
    s.precio AS precio_cobrado,
    COALESCE(sum((si.cantidad_utilizada * i.costo_unitario)), (0)::numeric) AS costo_insumos,
    (s.precio - COALESCE(sum((si.cantidad_utilizada * i.costo_unitario)), (0)::numeric)) AS utilidad_neta
   FROM ((sys_config.servicios s
     LEFT JOIN sys_config.servicio_insumos si ON ((si.servicio_id = s.id)))
     LEFT JOIN sys_config.insumos i ON ((i.id = si.insumo_id)))
  WHERE (s.activo = true)
  GROUP BY s.id, s.especialista_id, s.nombre, s.precio;


--
-- Name: VIEW v_rentabilidad_servicios; Type: COMMENT; Schema: sys_config; Owner: -
--

COMMENT ON VIEW sys_config.v_rentabilidad_servicios IS 'Rentabilidad estimada por servicio: Utilidad_Neta = precio - Σ(cantidad × costo_unitario insumo).';


--
-- Name: abonos abonos_pkey; Type: CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.abonos
    ADD CONSTRAINT abonos_pkey PRIMARY KEY (id);


--
-- Name: categorias_gastos categorias_gastos_pkey; Type: CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.categorias_gastos
    ADD CONSTRAINT categorias_gastos_pkey PRIMARY KEY (id);


--
-- Name: citas citas_pkey; Type: CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.citas
    ADD CONSTRAINT citas_pkey PRIMARY KEY (id);


--
-- Name: cola_mensajes cola_mensajes_pkey; Type: CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.cola_mensajes
    ADD CONSTRAINT cola_mensajes_pkey PRIMARY KEY (id);


--
-- Name: gastos_fijos gastos_fijos_pkey; Type: CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.gastos_fijos
    ADD CONSTRAINT gastos_fijos_pkey PRIMARY KEY (id);


--
-- Name: historias_clinicas_adjuntos historias_clinicas_adjuntos_pkey; Type: CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.historias_clinicas_adjuntos
    ADD CONSTRAINT historias_clinicas_adjuntos_pkey PRIMARY KEY (id);


--
-- Name: historias_clinicas historias_clinicas_pkey; Type: CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.historias_clinicas
    ADD CONSTRAINT historias_clinicas_pkey PRIMARY KEY (id);


--
-- Name: odontograma_registros odontograma_registros_pkey; Type: CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.odontograma_registros
    ADD CONSTRAINT odontograma_registros_pkey PRIMARY KEY (id);


--
-- Name: pacientes pacientes_pkey; Type: CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.pacientes
    ADD CONSTRAINT pacientes_pkey PRIMARY KEY (id);


--
-- Name: presupuesto_detalles presupuesto_detalles_pkey; Type: CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.presupuesto_detalles
    ADD CONSTRAINT presupuesto_detalles_pkey PRIMARY KEY (id);


--
-- Name: presupuestos presupuestos_pkey; Type: CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.presupuestos
    ADD CONSTRAINT presupuestos_pkey PRIMARY KEY (id);


--
-- Name: administradores administradores_email_key; Type: CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.administradores
    ADD CONSTRAINT administradores_email_key UNIQUE (email);


--
-- Name: administradores administradores_pkey; Type: CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.administradores
    ADD CONSTRAINT administradores_pkey PRIMARY KEY (id);


--
-- Name: bcv_tasas_historial bcv_tasas_historial_pkey; Type: CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.bcv_tasas_historial
    ADD CONSTRAINT bcv_tasas_historial_pkey PRIMARY KEY (id);


--
-- Name: catalogo_insumos catalogo_insumos_pkey; Type: CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.catalogo_insumos
    ADD CONSTRAINT catalogo_insumos_pkey PRIMARY KEY (id);


--
-- Name: configuracion_global configuracion_global_pkey; Type: CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.configuracion_global
    ADD CONSTRAINT configuracion_global_pkey PRIMARY KEY (id);


--
-- Name: especialidad_hc_secciones especialidad_hc_secciones_pkey; Type: CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.especialidad_hc_secciones
    ADD CONSTRAINT especialidad_hc_secciones_pkey PRIMARY KEY (especialidad_id, hc_seccion_id);


--
-- Name: especialidades especialidades_codigo_key; Type: CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.especialidades
    ADD CONSTRAINT especialidades_codigo_key UNIQUE (codigo);


--
-- Name: especialidades especialidades_pkey; Type: CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.especialidades
    ADD CONSTRAINT especialidades_pkey PRIMARY KEY (id);


--
-- Name: especialista_especialidades especialista_especialidades_pkey; Type: CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.especialista_especialidades
    ADD CONSTRAINT especialista_especialidades_pkey PRIMARY KEY (especialista_id, especialidad_id);


--
-- Name: especialistas especialistas_email_key; Type: CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.especialistas
    ADD CONSTRAINT especialistas_email_key UNIQUE (email);


--
-- Name: especialistas especialistas_pkey; Type: CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.especialistas
    ADD CONSTRAINT especialistas_pkey PRIMARY KEY (id);


--
-- Name: especialistas especialistas_slug_url_key; Type: CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.especialistas
    ADD CONSTRAINT especialistas_slug_url_key UNIQUE (slug_url);


--
-- Name: hc_secciones hc_secciones_codigo_key; Type: CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.hc_secciones
    ADD CONSTRAINT hc_secciones_codigo_key UNIQUE (codigo);


--
-- Name: hc_secciones hc_secciones_pkey; Type: CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.hc_secciones
    ADD CONSTRAINT hc_secciones_pkey PRIMARY KEY (id);


--
-- Name: insumos insumos_pkey; Type: CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.insumos
    ADD CONSTRAINT insumos_pkey PRIMARY KEY (id);


--
-- Name: inventario_movimientos inventario_movimientos_pkey; Type: CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.inventario_movimientos
    ADD CONSTRAINT inventario_movimientos_pkey PRIMARY KEY (id);


--
-- Name: log_suscripciones log_suscripciones_pkey; Type: CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.log_suscripciones
    ADD CONSTRAINT log_suscripciones_pkey PRIMARY KEY (id);


--
-- Name: odontograma_hallazgos odontograma_hallazgos_codigo_key; Type: CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.odontograma_hallazgos
    ADD CONSTRAINT odontograma_hallazgos_codigo_key UNIQUE (codigo);


--
-- Name: odontograma_hallazgos odontograma_hallazgos_pkey; Type: CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.odontograma_hallazgos
    ADD CONSTRAINT odontograma_hallazgos_pkey PRIMARY KEY (id);


--
-- Name: planes_suscripcion planes_suscripcion_codigo_key; Type: CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.planes_suscripcion
    ADD CONSTRAINT planes_suscripcion_codigo_key UNIQUE (codigo);


--
-- Name: planes_suscripcion planes_suscripcion_pkey; Type: CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.planes_suscripcion
    ADD CONSTRAINT planes_suscripcion_pkey PRIMARY KEY (id);


--
-- Name: servicio_insumos servicio_insumos_pkey; Type: CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.servicio_insumos
    ADD CONSTRAINT servicio_insumos_pkey PRIMARY KEY (servicio_id, insumo_id);


--
-- Name: servicios servicios_pkey; Type: CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.servicios
    ADD CONSTRAINT servicios_pkey PRIMARY KEY (id);


--
-- Name: idx_abonos_especialista; Type: INDEX; Schema: sys_clinical; Owner: -
--

CREATE INDEX idx_abonos_especialista ON sys_clinical.abonos USING btree (especialista_id);


--
-- Name: idx_abonos_fecha; Type: INDEX; Schema: sys_clinical; Owner: -
--

CREATE INDEX idx_abonos_fecha ON sys_clinical.abonos USING btree (fecha_abono DESC);


--
-- Name: idx_abonos_presupuesto; Type: INDEX; Schema: sys_clinical; Owner: -
--

CREATE INDEX idx_abonos_presupuesto ON sys_clinical.abonos USING btree (presupuesto_id);


--
-- Name: idx_citas_especialista; Type: INDEX; Schema: sys_clinical; Owner: -
--

CREATE INDEX idx_citas_especialista ON sys_clinical.citas USING btree (especialista_id);


--
-- Name: idx_citas_estado; Type: INDEX; Schema: sys_clinical; Owner: -
--

CREATE INDEX idx_citas_estado ON sys_clinical.citas USING btree (especialista_id, estado);


--
-- Name: idx_citas_fecha; Type: INDEX; Schema: sys_clinical; Owner: -
--

CREATE INDEX idx_citas_fecha ON sys_clinical.citas USING btree (especialista_id, fecha_hora);


--
-- Name: idx_citas_paciente; Type: INDEX; Schema: sys_clinical; Owner: -
--

CREATE INDEX idx_citas_paciente ON sys_clinical.citas USING btree (paciente_id);


--
-- Name: idx_cola_abono; Type: INDEX; Schema: sys_clinical; Owner: -
--

CREATE INDEX idx_cola_abono ON sys_clinical.cola_mensajes USING btree (abono_id) WHERE (abono_id IS NOT NULL);


--
-- Name: idx_cola_cita; Type: INDEX; Schema: sys_clinical; Owner: -
--

CREATE INDEX idx_cola_cita ON sys_clinical.cola_mensajes USING btree (cita_id) WHERE (cita_id IS NOT NULL);


--
-- Name: idx_cola_especialista; Type: INDEX; Schema: sys_clinical; Owner: -
--

CREATE INDEX idx_cola_especialista ON sys_clinical.cola_mensajes USING btree (especialista_id);


--
-- Name: idx_cola_estado_intento; Type: INDEX; Schema: sys_clinical; Owner: -
--

CREATE INDEX idx_cola_estado_intento ON sys_clinical.cola_mensajes USING btree (estado, proximo_intento) WHERE ((estado)::text = ANY (ARRAY[('pendiente'::character varying)::text, ('fallido'::character varying)::text]));


--
-- Name: idx_cola_tipo; Type: INDEX; Schema: sys_clinical; Owner: -
--

CREATE INDEX idx_cola_tipo ON sys_clinical.cola_mensajes USING btree (tipo);


--
-- Name: idx_hist_clinicas_especialista; Type: INDEX; Schema: sys_clinical; Owner: -
--

CREATE INDEX idx_hist_clinicas_especialista ON sys_clinical.historias_clinicas USING btree (especialista_id);


--
-- Name: idx_hist_clinicas_fecha; Type: INDEX; Schema: sys_clinical; Owner: -
--

CREATE INDEX idx_hist_clinicas_fecha ON sys_clinical.historias_clinicas USING btree (fecha_apertura DESC);


--
-- Name: idx_hist_clinicas_paciente; Type: INDEX; Schema: sys_clinical; Owner: -
--

CREATE INDEX idx_hist_clinicas_paciente ON sys_clinical.historias_clinicas USING btree (paciente_id);


--
-- Name: idx_odon_reg_diente_cara; Type: INDEX; Schema: sys_clinical; Owner: -
--

CREATE INDEX idx_odon_reg_diente_cara ON sys_clinical.odontograma_registros USING btree (paciente_id, numero_diente, cara_diente);


--
-- Name: idx_odon_reg_especialista; Type: INDEX; Schema: sys_clinical; Owner: -
--

CREATE INDEX idx_odon_reg_especialista ON sys_clinical.odontograma_registros USING btree (especialista_id);


--
-- Name: idx_odon_reg_fecha; Type: INDEX; Schema: sys_clinical; Owner: -
--

CREATE INDEX idx_odon_reg_fecha ON sys_clinical.odontograma_registros USING btree (fecha_registro);


--
-- Name: idx_odon_reg_paciente; Type: INDEX; Schema: sys_clinical; Owner: -
--

CREATE INDEX idx_odon_reg_paciente ON sys_clinical.odontograma_registros USING btree (paciente_id);


--
-- Name: idx_pacientes_documento; Type: INDEX; Schema: sys_clinical; Owner: -
--

CREATE INDEX idx_pacientes_documento ON sys_clinical.pacientes USING btree (documento);


--
-- Name: idx_pacientes_especialista; Type: INDEX; Schema: sys_clinical; Owner: -
--

CREATE INDEX idx_pacientes_especialista ON sys_clinical.pacientes USING btree (especialista_id);


--
-- Name: idx_pacientes_nombre; Type: INDEX; Schema: sys_clinical; Owner: -
--

CREATE INDEX idx_pacientes_nombre ON sys_clinical.pacientes USING btree (nombre, apellido);


--
-- Name: idx_presup_det_presupuesto; Type: INDEX; Schema: sys_clinical; Owner: -
--

CREATE INDEX idx_presup_det_presupuesto ON sys_clinical.presupuesto_detalles USING btree (presupuesto_id);


--
-- Name: idx_presupuestos_especialista; Type: INDEX; Schema: sys_clinical; Owner: -
--

CREATE INDEX idx_presupuestos_especialista ON sys_clinical.presupuestos USING btree (especialista_id);


--
-- Name: idx_presupuestos_estado; Type: INDEX; Schema: sys_clinical; Owner: -
--

CREATE INDEX idx_presupuestos_estado ON sys_clinical.presupuestos USING btree (especialista_id, estado);


--
-- Name: idx_presupuestos_paciente; Type: INDEX; Schema: sys_clinical; Owner: -
--

CREATE INDEX idx_presupuestos_paciente ON sys_clinical.presupuestos USING btree (paciente_id);


--
-- Name: ix_sys_clinical_categorias_gastos_especialista_id; Type: INDEX; Schema: sys_clinical; Owner: -
--

CREATE INDEX ix_sys_clinical_categorias_gastos_especialista_id ON sys_clinical.categorias_gastos USING btree (especialista_id);


--
-- Name: ix_sys_clinical_gastos_fijos_especialista_id; Type: INDEX; Schema: sys_clinical; Owner: -
--

CREATE INDEX ix_sys_clinical_gastos_fijos_especialista_id ON sys_clinical.gastos_fijos USING btree (especialista_id);


--
-- Name: ix_sys_clinical_historias_clinicas_adjuntos_historia_id; Type: INDEX; Schema: sys_clinical; Owner: -
--

CREATE INDEX ix_sys_clinical_historias_clinicas_adjuntos_historia_id ON sys_clinical.historias_clinicas_adjuntos USING btree (historia_id);


--
-- Name: idx_bcv_historial_fecha; Type: INDEX; Schema: sys_config; Owner: -
--

CREATE INDEX idx_bcv_historial_fecha ON sys_config.bcv_tasas_historial USING btree (fecha);


--
-- Name: idx_esp_hc_sec_especialidad; Type: INDEX; Schema: sys_config; Owner: -
--

CREATE INDEX idx_esp_hc_sec_especialidad ON sys_config.especialidad_hc_secciones USING btree (especialidad_id);


--
-- Name: idx_esp_hc_sec_orden; Type: INDEX; Schema: sys_config; Owner: -
--

CREATE INDEX idx_esp_hc_sec_orden ON sys_config.especialidad_hc_secciones USING btree (especialidad_id, orden);


--
-- Name: idx_hc_secciones_activo; Type: INDEX; Schema: sys_config; Owner: -
--

CREATE INDEX idx_hc_secciones_activo ON sys_config.hc_secciones USING btree (activo);


--
-- Name: idx_hc_secciones_codigo; Type: INDEX; Schema: sys_config; Owner: -
--

CREATE INDEX idx_hc_secciones_codigo ON sys_config.hc_secciones USING btree (codigo);


--
-- Name: idx_insumos_especialista; Type: INDEX; Schema: sys_config; Owner: -
--

CREATE INDEX idx_insumos_especialista ON sys_config.insumos USING btree (especialista_id);


--
-- Name: idx_insumos_nombre; Type: INDEX; Schema: sys_config; Owner: -
--

CREATE INDEX idx_insumos_nombre ON sys_config.insumos USING btree (especialista_id, nombre);


--
-- Name: idx_insumos_stock_bajo; Type: INDEX; Schema: sys_config; Owner: -
--

CREATE INDEX idx_insumos_stock_bajo ON sys_config.insumos USING btree (especialista_id) WHERE ((stock_actual <= stock_minimo) AND (activo = true));


--
-- Name: idx_log_susc_especialista; Type: INDEX; Schema: sys_config; Owner: -
--

CREATE INDEX idx_log_susc_especialista ON sys_config.log_suscripciones USING btree (especialista_id);


--
-- Name: idx_odontograma_hallazgos_categoria; Type: INDEX; Schema: sys_config; Owner: -
--

CREATE INDEX idx_odontograma_hallazgos_categoria ON sys_config.odontograma_hallazgos USING btree (categoria);


--
-- Name: idx_serv_insumos_insumo; Type: INDEX; Schema: sys_config; Owner: -
--

CREATE INDEX idx_serv_insumos_insumo ON sys_config.servicio_insumos USING btree (insumo_id);


--
-- Name: idx_serv_insumos_servicio; Type: INDEX; Schema: sys_config; Owner: -
--

CREATE INDEX idx_serv_insumos_servicio ON sys_config.servicio_insumos USING btree (servicio_id);


--
-- Name: idx_servicios_especialista; Type: INDEX; Schema: sys_config; Owner: -
--

CREATE INDEX idx_servicios_especialista ON sys_config.servicios USING btree (especialista_id);


--
-- Name: ix_sys_config_catalogo_insumos_nombre; Type: INDEX; Schema: sys_config; Owner: -
--

CREATE INDEX ix_sys_config_catalogo_insumos_nombre ON sys_config.catalogo_insumos USING btree (nombre);


--
-- Name: ix_sys_config_catalogo_insumos_sku; Type: INDEX; Schema: sys_config; Owner: -
--

CREATE INDEX ix_sys_config_catalogo_insumos_sku ON sys_config.catalogo_insumos USING btree (sku);


--
-- Name: ix_sys_config_inventario_movimientos_especialista_id; Type: INDEX; Schema: sys_config; Owner: -
--

CREATE INDEX ix_sys_config_inventario_movimientos_especialista_id ON sys_config.inventario_movimientos USING btree (especialista_id);


--
-- Name: ix_sys_config_inventario_movimientos_insumo_id; Type: INDEX; Schema: sys_config; Owner: -
--

CREATE INDEX ix_sys_config_inventario_movimientos_insumo_id ON sys_config.inventario_movimientos USING btree (insumo_id);


--
-- Name: abonos abonos_recalcular_saldo; Type: TRIGGER; Schema: sys_clinical; Owner: -
--

CREATE TRIGGER abonos_recalcular_saldo AFTER INSERT OR DELETE OR UPDATE ON sys_clinical.abonos FOR EACH ROW EXECUTE FUNCTION sys_clinical.recalcular_saldo_pendiente();


--
-- Name: citas citas_updated_at; Type: TRIGGER; Schema: sys_clinical; Owner: -
--

CREATE TRIGGER citas_updated_at BEFORE UPDATE ON sys_clinical.citas FOR EACH ROW EXECUTE FUNCTION sys_config.set_updated_at();


--
-- Name: presupuesto_detalles detalles_recalcular_total; Type: TRIGGER; Schema: sys_clinical; Owner: -
--

CREATE TRIGGER detalles_recalcular_total AFTER INSERT OR DELETE OR UPDATE ON sys_clinical.presupuesto_detalles FOR EACH ROW EXECUTE FUNCTION sys_clinical.recalcular_total_presupuesto();


--
-- Name: historias_clinicas historias_clinicas_updated_at; Type: TRIGGER; Schema: sys_clinical; Owner: -
--

CREATE TRIGGER historias_clinicas_updated_at BEFORE UPDATE ON sys_clinical.historias_clinicas FOR EACH ROW EXECUTE FUNCTION sys_config.set_updated_at();


--
-- Name: pacientes pacientes_updated_at; Type: TRIGGER; Schema: sys_clinical; Owner: -
--

CREATE TRIGGER pacientes_updated_at BEFORE UPDATE ON sys_clinical.pacientes FOR EACH ROW EXECUTE FUNCTION sys_config.set_updated_at();


--
-- Name: presupuestos presupuestos_updated_at; Type: TRIGGER; Schema: sys_clinical; Owner: -
--

CREATE TRIGGER presupuestos_updated_at BEFORE UPDATE ON sys_clinical.presupuestos FOR EACH ROW EXECUTE FUNCTION sys_config.set_updated_at();


--
-- Name: administradores administradores_updated_at; Type: TRIGGER; Schema: sys_config; Owner: -
--

CREATE TRIGGER administradores_updated_at BEFORE UPDATE ON sys_config.administradores FOR EACH ROW EXECUTE FUNCTION sys_config.set_updated_at();


--
-- Name: configuracion_global configuracion_global_updated_at; Type: TRIGGER; Schema: sys_config; Owner: -
--

CREATE TRIGGER configuracion_global_updated_at BEFORE UPDATE ON sys_config.configuracion_global FOR EACH ROW EXECUTE FUNCTION sys_config.set_updated_at();


--
-- Name: especialidades especialidades_updated_at; Type: TRIGGER; Schema: sys_config; Owner: -
--

CREATE TRIGGER especialidades_updated_at BEFORE UPDATE ON sys_config.especialidades FOR EACH ROW EXECUTE FUNCTION sys_config.set_updated_at();


--
-- Name: especialistas especialistas_updated_at; Type: TRIGGER; Schema: sys_config; Owner: -
--

CREATE TRIGGER especialistas_updated_at BEFORE UPDATE ON sys_config.especialistas FOR EACH ROW EXECUTE FUNCTION sys_config.set_updated_at();


--
-- Name: insumos insumos_updated_at; Type: TRIGGER; Schema: sys_config; Owner: -
--

CREATE TRIGGER insumos_updated_at BEFORE UPDATE ON sys_config.insumos FOR EACH ROW EXECUTE FUNCTION sys_config.set_updated_at();


--
-- Name: odontograma_hallazgos odontograma_hallazgos_updated_at; Type: TRIGGER; Schema: sys_config; Owner: -
--

CREATE TRIGGER odontograma_hallazgos_updated_at BEFORE UPDATE ON sys_config.odontograma_hallazgos FOR EACH ROW EXECUTE FUNCTION sys_config.set_updated_at();


--
-- Name: planes_suscripcion planes_suscripcion_updated_at; Type: TRIGGER; Schema: sys_config; Owner: -
--

CREATE TRIGGER planes_suscripcion_updated_at BEFORE UPDATE ON sys_config.planes_suscripcion FOR EACH ROW EXECUTE FUNCTION sys_config.set_updated_at();


--
-- Name: servicios servicios_updated_at; Type: TRIGGER; Schema: sys_config; Owner: -
--

CREATE TRIGGER servicios_updated_at BEFORE UPDATE ON sys_config.servicios FOR EACH ROW EXECUTE FUNCTION sys_config.set_updated_at();


--
-- Name: especialistas trg_seed_inventory; Type: TRIGGER; Schema: sys_config; Owner: -
--

CREATE TRIGGER trg_seed_inventory AFTER INSERT ON sys_config.especialistas FOR EACH ROW EXECUTE FUNCTION sys_config.fn_seed_especialista_inventory();


--
-- Name: abonos abonos_cita_id_fkey; Type: FK CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.abonos
    ADD CONSTRAINT abonos_cita_id_fkey FOREIGN KEY (cita_id) REFERENCES sys_clinical.citas(id);


--
-- Name: abonos abonos_especialista_id_fkey; Type: FK CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.abonos
    ADD CONSTRAINT abonos_especialista_id_fkey FOREIGN KEY (especialista_id) REFERENCES sys_config.especialistas(id) ON DELETE CASCADE;


--
-- Name: abonos abonos_presupuesto_id_fkey; Type: FK CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.abonos
    ADD CONSTRAINT abonos_presupuesto_id_fkey FOREIGN KEY (presupuesto_id) REFERENCES sys_clinical.presupuestos(id) ON DELETE CASCADE;


--
-- Name: categorias_gastos categorias_gastos_especialista_id_fkey; Type: FK CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.categorias_gastos
    ADD CONSTRAINT categorias_gastos_especialista_id_fkey FOREIGN KEY (especialista_id) REFERENCES sys_config.especialistas(id);


--
-- Name: citas citas_abono_id_fkey; Type: FK CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.citas
    ADD CONSTRAINT citas_abono_id_fkey FOREIGN KEY (abono_id) REFERENCES sys_clinical.abonos(id);


--
-- Name: citas citas_especialista_id_fkey; Type: FK CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.citas
    ADD CONSTRAINT citas_especialista_id_fkey FOREIGN KEY (especialista_id) REFERENCES sys_config.especialistas(id) ON DELETE CASCADE;


--
-- Name: citas citas_paciente_id_fkey; Type: FK CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.citas
    ADD CONSTRAINT citas_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES sys_clinical.pacientes(id) ON DELETE CASCADE;


--
-- Name: citas citas_presupuesto_id_fkey; Type: FK CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.citas
    ADD CONSTRAINT citas_presupuesto_id_fkey FOREIGN KEY (presupuesto_id) REFERENCES sys_clinical.presupuestos(id);


--
-- Name: citas citas_servicio_id_fkey; Type: FK CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.citas
    ADD CONSTRAINT citas_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES sys_config.servicios(id) ON DELETE SET NULL;


--
-- Name: cola_mensajes cola_mensajes_abono_id_fkey; Type: FK CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.cola_mensajes
    ADD CONSTRAINT cola_mensajes_abono_id_fkey FOREIGN KEY (abono_id) REFERENCES sys_clinical.abonos(id) ON DELETE SET NULL;


--
-- Name: cola_mensajes cola_mensajes_cita_id_fkey; Type: FK CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.cola_mensajes
    ADD CONSTRAINT cola_mensajes_cita_id_fkey FOREIGN KEY (cita_id) REFERENCES sys_clinical.citas(id) ON DELETE SET NULL;


--
-- Name: cola_mensajes cola_mensajes_especialista_id_fkey; Type: FK CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.cola_mensajes
    ADD CONSTRAINT cola_mensajes_especialista_id_fkey FOREIGN KEY (especialista_id) REFERENCES sys_config.especialistas(id) ON DELETE CASCADE;


--
-- Name: odontograma_registros fk_odon_reg_historia_clinica; Type: FK CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.odontograma_registros
    ADD CONSTRAINT fk_odon_reg_historia_clinica FOREIGN KEY (historia_clinica_id) REFERENCES sys_clinical.historias_clinicas(id) ON DELETE SET NULL;


--
-- Name: gastos_fijos gastos_fijos_categoria_id_fkey; Type: FK CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.gastos_fijos
    ADD CONSTRAINT gastos_fijos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES sys_clinical.categorias_gastos(id);


--
-- Name: gastos_fijos gastos_fijos_especialista_id_fkey; Type: FK CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.gastos_fijos
    ADD CONSTRAINT gastos_fijos_especialista_id_fkey FOREIGN KEY (especialista_id) REFERENCES sys_config.especialistas(id);


--
-- Name: historias_clinicas_adjuntos historias_clinicas_adjuntos_historia_id_fkey; Type: FK CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.historias_clinicas_adjuntos
    ADD CONSTRAINT historias_clinicas_adjuntos_historia_id_fkey FOREIGN KEY (historia_id) REFERENCES sys_clinical.historias_clinicas(id);


--
-- Name: historias_clinicas historias_clinicas_especialidad_id_fkey; Type: FK CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.historias_clinicas
    ADD CONSTRAINT historias_clinicas_especialidad_id_fkey FOREIGN KEY (especialidad_id) REFERENCES sys_config.especialidades(id);


--
-- Name: historias_clinicas historias_clinicas_especialista_id_fkey; Type: FK CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.historias_clinicas
    ADD CONSTRAINT historias_clinicas_especialista_id_fkey FOREIGN KEY (especialista_id) REFERENCES sys_config.especialistas(id) ON DELETE CASCADE;


--
-- Name: historias_clinicas historias_clinicas_paciente_id_fkey; Type: FK CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.historias_clinicas
    ADD CONSTRAINT historias_clinicas_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES sys_clinical.pacientes(id) ON DELETE CASCADE;


--
-- Name: odontograma_registros odontograma_registros_especialista_id_fkey; Type: FK CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.odontograma_registros
    ADD CONSTRAINT odontograma_registros_especialista_id_fkey FOREIGN KEY (especialista_id) REFERENCES sys_config.especialistas(id) ON DELETE CASCADE;


--
-- Name: odontograma_registros odontograma_registros_hallazgo_id_fkey; Type: FK CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.odontograma_registros
    ADD CONSTRAINT odontograma_registros_hallazgo_id_fkey FOREIGN KEY (hallazgo_id) REFERENCES sys_config.odontograma_hallazgos(id) ON DELETE RESTRICT;


--
-- Name: odontograma_registros odontograma_registros_paciente_id_fkey; Type: FK CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.odontograma_registros
    ADD CONSTRAINT odontograma_registros_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES sys_clinical.pacientes(id) ON DELETE CASCADE;


--
-- Name: pacientes pacientes_especialista_id_fkey; Type: FK CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.pacientes
    ADD CONSTRAINT pacientes_especialista_id_fkey FOREIGN KEY (especialista_id) REFERENCES sys_config.especialistas(id) ON DELETE CASCADE;


--
-- Name: presupuesto_detalles presupuesto_detalles_presupuesto_id_fkey; Type: FK CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.presupuesto_detalles
    ADD CONSTRAINT presupuesto_detalles_presupuesto_id_fkey FOREIGN KEY (presupuesto_id) REFERENCES sys_clinical.presupuestos(id) ON DELETE CASCADE;


--
-- Name: presupuesto_detalles presupuesto_detalles_servicio_id_fkey; Type: FK CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.presupuesto_detalles
    ADD CONSTRAINT presupuesto_detalles_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES sys_config.servicios(id) ON DELETE SET NULL;


--
-- Name: presupuestos presupuestos_especialista_id_fkey; Type: FK CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.presupuestos
    ADD CONSTRAINT presupuestos_especialista_id_fkey FOREIGN KEY (especialista_id) REFERENCES sys_config.especialistas(id) ON DELETE CASCADE;


--
-- Name: presupuestos presupuestos_paciente_id_fkey; Type: FK CONSTRAINT; Schema: sys_clinical; Owner: -
--

ALTER TABLE ONLY sys_clinical.presupuestos
    ADD CONSTRAINT presupuestos_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES sys_clinical.pacientes(id) ON DELETE CASCADE;


--
-- Name: especialidad_hc_secciones especialidad_hc_secciones_especialidad_id_fkey; Type: FK CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.especialidad_hc_secciones
    ADD CONSTRAINT especialidad_hc_secciones_especialidad_id_fkey FOREIGN KEY (especialidad_id) REFERENCES sys_config.especialidades(id) ON DELETE CASCADE;


--
-- Name: especialidad_hc_secciones especialidad_hc_secciones_hc_seccion_id_fkey; Type: FK CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.especialidad_hc_secciones
    ADD CONSTRAINT especialidad_hc_secciones_hc_seccion_id_fkey FOREIGN KEY (hc_seccion_id) REFERENCES sys_config.hc_secciones(id) ON DELETE CASCADE;


--
-- Name: especialista_especialidades especialista_especialidades_especialidad_id_fkey; Type: FK CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.especialista_especialidades
    ADD CONSTRAINT especialista_especialidades_especialidad_id_fkey FOREIGN KEY (especialidad_id) REFERENCES sys_config.especialidades(id) ON DELETE RESTRICT;


--
-- Name: especialista_especialidades especialista_especialidades_especialista_id_fkey; Type: FK CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.especialista_especialidades
    ADD CONSTRAINT especialista_especialidades_especialista_id_fkey FOREIGN KEY (especialista_id) REFERENCES sys_config.especialistas(id) ON DELETE CASCADE;


--
-- Name: especialistas especialistas_plan_suscripcion_id_fkey; Type: FK CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.especialistas
    ADD CONSTRAINT especialistas_plan_suscripcion_id_fkey FOREIGN KEY (plan_suscripcion_id) REFERENCES sys_config.planes_suscripcion(id);


--
-- Name: insumos insumos_especialista_id_fkey; Type: FK CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.insumos
    ADD CONSTRAINT insumos_especialista_id_fkey FOREIGN KEY (especialista_id) REFERENCES sys_config.especialistas(id) ON DELETE CASCADE;


--
-- Name: inventario_movimientos inventario_movimientos_especialista_id_fkey; Type: FK CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.inventario_movimientos
    ADD CONSTRAINT inventario_movimientos_especialista_id_fkey FOREIGN KEY (especialista_id) REFERENCES sys_config.especialistas(id);


--
-- Name: inventario_movimientos inventario_movimientos_insumo_id_fkey; Type: FK CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.inventario_movimientos
    ADD CONSTRAINT inventario_movimientos_insumo_id_fkey FOREIGN KEY (insumo_id) REFERENCES sys_config.insumos(id);


--
-- Name: log_suscripciones log_suscripciones_admin_id_fkey; Type: FK CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.log_suscripciones
    ADD CONSTRAINT log_suscripciones_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES sys_config.administradores(id);


--
-- Name: log_suscripciones log_suscripciones_especialista_id_fkey; Type: FK CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.log_suscripciones
    ADD CONSTRAINT log_suscripciones_especialista_id_fkey FOREIGN KEY (especialista_id) REFERENCES sys_config.especialistas(id);


--
-- Name: servicio_insumos servicio_insumos_insumo_id_fkey; Type: FK CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.servicio_insumos
    ADD CONSTRAINT servicio_insumos_insumo_id_fkey FOREIGN KEY (insumo_id) REFERENCES sys_config.insumos(id) ON DELETE RESTRICT;


--
-- Name: servicio_insumos servicio_insumos_servicio_id_fkey; Type: FK CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.servicio_insumos
    ADD CONSTRAINT servicio_insumos_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES sys_config.servicios(id) ON DELETE CASCADE;


--
-- Name: servicios servicios_especialista_id_fkey; Type: FK CONSTRAINT; Schema: sys_config; Owner: -
--

ALTER TABLE ONLY sys_config.servicios
    ADD CONSTRAINT servicios_especialista_id_fkey FOREIGN KEY (especialista_id) REFERENCES sys_config.especialistas(id) ON DELETE CASCADE;


--
-- Name: abonos; Type: ROW SECURITY; Schema: sys_clinical; Owner: -
--

ALTER TABLE sys_clinical.abonos ENABLE ROW LEVEL SECURITY;

--
-- Name: abonos abonos_tenant; Type: POLICY; Schema: sys_clinical; Owner: -
--

CREATE POLICY abonos_tenant ON sys_clinical.abonos USING ((especialista_id = (current_setting('app.especialista_id'::text, true))::uuid)) WITH CHECK ((especialista_id = (current_setting('app.especialista_id'::text, true))::uuid));


--
-- Name: citas; Type: ROW SECURITY; Schema: sys_clinical; Owner: -
--

ALTER TABLE sys_clinical.citas ENABLE ROW LEVEL SECURITY;

--
-- Name: citas citas_public_insert; Type: POLICY; Schema: sys_clinical; Owner: -
--

CREATE POLICY citas_public_insert ON sys_clinical.citas FOR INSERT WITH CHECK (true);


--
-- Name: citas citas_tenant; Type: POLICY; Schema: sys_clinical; Owner: -
--

CREATE POLICY citas_tenant ON sys_clinical.citas USING ((especialista_id = (current_setting('app.especialista_id'::text, true))::uuid)) WITH CHECK ((especialista_id = (current_setting('app.especialista_id'::text, true))::uuid));


--
-- Name: cola_mensajes; Type: ROW SECURITY; Schema: sys_clinical; Owner: -
--

ALTER TABLE sys_clinical.cola_mensajes ENABLE ROW LEVEL SECURITY;

--
-- Name: cola_mensajes cola_mensajes_tenant; Type: POLICY; Schema: sys_clinical; Owner: -
--

CREATE POLICY cola_mensajes_tenant ON sys_clinical.cola_mensajes USING ((especialista_id = (current_setting('app.especialista_id'::text, true))::uuid)) WITH CHECK ((especialista_id = (current_setting('app.especialista_id'::text, true))::uuid));


--
-- Name: historias_clinicas; Type: ROW SECURITY; Schema: sys_clinical; Owner: -
--

ALTER TABLE sys_clinical.historias_clinicas ENABLE ROW LEVEL SECURITY;

--
-- Name: historias_clinicas historias_clinicas_tenant; Type: POLICY; Schema: sys_clinical; Owner: -
--

CREATE POLICY historias_clinicas_tenant ON sys_clinical.historias_clinicas USING ((especialista_id = (current_setting('app.especialista_id'::text, true))::uuid)) WITH CHECK ((especialista_id = (current_setting('app.especialista_id'::text, true))::uuid));


--
-- Name: odontograma_registros; Type: ROW SECURITY; Schema: sys_clinical; Owner: -
--

ALTER TABLE sys_clinical.odontograma_registros ENABLE ROW LEVEL SECURITY;

--
-- Name: odontograma_registros odontograma_registros_tenant; Type: POLICY; Schema: sys_clinical; Owner: -
--

CREATE POLICY odontograma_registros_tenant ON sys_clinical.odontograma_registros USING ((especialista_id = (current_setting('app.especialista_id'::text, true))::uuid)) WITH CHECK ((especialista_id = (current_setting('app.especialista_id'::text, true))::uuid));


--
-- Name: pacientes; Type: ROW SECURITY; Schema: sys_clinical; Owner: -
--

ALTER TABLE sys_clinical.pacientes ENABLE ROW LEVEL SECURITY;

--
-- Name: pacientes pacientes_public_insert; Type: POLICY; Schema: sys_clinical; Owner: -
--

CREATE POLICY pacientes_public_insert ON sys_clinical.pacientes FOR INSERT WITH CHECK (((origen_registro)::text = 'portal_publico'::text));


--
-- Name: pacientes pacientes_tenant; Type: POLICY; Schema: sys_clinical; Owner: -
--

CREATE POLICY pacientes_tenant ON sys_clinical.pacientes USING ((especialista_id = (current_setting('app.especialista_id'::text, true))::uuid)) WITH CHECK ((especialista_id = (current_setting('app.especialista_id'::text, true))::uuid));


--
-- Name: presupuestos; Type: ROW SECURITY; Schema: sys_clinical; Owner: -
--

ALTER TABLE sys_clinical.presupuestos ENABLE ROW LEVEL SECURITY;

--
-- Name: presupuestos presupuestos_tenant; Type: POLICY; Schema: sys_clinical; Owner: -
--

CREATE POLICY presupuestos_tenant ON sys_clinical.presupuestos USING ((especialista_id = (current_setting('app.especialista_id'::text, true))::uuid)) WITH CHECK ((especialista_id = (current_setting('app.especialista_id'::text, true))::uuid));


--
-- Name: especialista_especialidades; Type: ROW SECURITY; Schema: sys_config; Owner: -
--

ALTER TABLE sys_config.especialista_especialidades ENABLE ROW LEVEL SECURITY;

--
-- Name: especialista_especialidades especialista_especialidades_insert; Type: POLICY; Schema: sys_config; Owner: -
--

CREATE POLICY especialista_especialidades_insert ON sys_config.especialista_especialidades FOR INSERT WITH CHECK (true);


--
-- Name: especialista_especialidades especialista_especialidades_tenant; Type: POLICY; Schema: sys_config; Owner: -
--

CREATE POLICY especialista_especialidades_tenant ON sys_config.especialista_especialidades USING ((especialista_id = (current_setting('app.especialista_id'::text, true))::uuid));


--
-- Name: especialistas; Type: ROW SECURITY; Schema: sys_config; Owner: -
--

ALTER TABLE sys_config.especialistas ENABLE ROW LEVEL SECURITY;

--
-- Name: especialistas especialistas_insert; Type: POLICY; Schema: sys_config; Owner: -
--

CREATE POLICY especialistas_insert ON sys_config.especialistas FOR INSERT WITH CHECK (true);


--
-- Name: especialistas especialistas_isolate; Type: POLICY; Schema: sys_config; Owner: -
--

CREATE POLICY especialistas_isolate ON sys_config.especialistas USING ((id = (current_setting('app.especialista_id'::text, true))::uuid));


--
-- Name: especialistas especialistas_public_select; Type: POLICY; Schema: sys_config; Owner: -
--

CREATE POLICY especialistas_public_select ON sys_config.especialistas FOR SELECT USING ((portal_visible = true));


--
-- Name: insumos; Type: ROW SECURITY; Schema: sys_config; Owner: -
--

ALTER TABLE sys_config.insumos ENABLE ROW LEVEL SECURITY;

--
-- Name: insumos insumos_tenant; Type: POLICY; Schema: sys_config; Owner: -
--

CREATE POLICY insumos_tenant ON sys_config.insumos USING ((especialista_id = (current_setting('app.especialista_id'::text, true))::uuid)) WITH CHECK ((especialista_id = (current_setting('app.especialista_id'::text, true))::uuid));


--
-- Name: servicios; Type: ROW SECURITY; Schema: sys_config; Owner: -
--

ALTER TABLE sys_config.servicios ENABLE ROW LEVEL SECURITY;

--
-- Name: servicios servicios_public_select; Type: POLICY; Schema: sys_config; Owner: -
--

CREATE POLICY servicios_public_select ON sys_config.servicios FOR SELECT USING (((visible_publico = true) AND (EXISTS ( SELECT 1
   FROM sys_config.especialistas e
  WHERE ((e.id = servicios.especialista_id) AND (e.portal_visible = true))))));


--
-- Name: servicios servicios_tenant; Type: POLICY; Schema: sys_config; Owner: -
--

CREATE POLICY servicios_tenant ON sys_config.servicios USING ((especialista_id = (current_setting('app.especialista_id'::text, true))::uuid)) WITH CHECK ((especialista_id = (current_setting('app.especialista_id'::text, true))::uuid));


--
-- PostgreSQL database dump complete
--

\unrestrict XzTmvCeOATzuMqUDeoHhAQH1qh9kW7a9JDvGsWJes8LBHn8kRKORZaYJOV48ZKB

