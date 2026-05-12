-- ─── TABLA BASE: usuarios ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario         SERIAL PRIMARY KEY,
  nombre             VARCHAR(100) NOT NULL,
  apellido           VARCHAR(100) NOT NULL,
  correo             VARCHAR(150) UNIQUE NOT NULL,
  contrasena_hash    VARCHAR(255) NOT NULL,
  rol                VARCHAR(20)  NOT NULL CHECK (rol IN ('administrador','veterinario','recepcionista','cliente')),
  activo             BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  intentos_fallidos  INTEGER      NOT NULL DEFAULT 0,
  bloqueado_hasta    TIMESTAMPTZ
);
-- Migración si la tabla ya existe:
ALTER TABLE IF EXISTS usuarios ADD COLUMN IF NOT EXISTS intentos_fallidos INTEGER NOT NULL DEFAULT 0;
ALTER TABLE IF EXISTS usuarios ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMPTZ;

-- ─── SUBCLASE: clientes ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
  id_cliente  SERIAL PRIMARY KEY,
  id_usuario  INT UNIQUE NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  telefono    VARCHAR(20) NOT NULL,
  direccion   TEXT
);

-- ─── SUBCLASE: veterinarios ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS veterinarios (
  id_veterinario  SERIAL PRIMARY KEY,
  id_usuario      INT UNIQUE NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  especialidad    VARCHAR(100),
  horario_inicio  TIME NOT NULL,
  horario_fin     TIME NOT NULL
);

-- ─── ENTIDAD: mascotas ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mascotas (
  id_mascota       SERIAL PRIMARY KEY,
  id_cliente       INT NOT NULL REFERENCES clientes(id_cliente) ON DELETE CASCADE,
  nombre           VARCHAR(100) NOT NULL,
  especie          VARCHAR(50)  NOT NULL,
  raza             VARCHAR(100),
  sexo             VARCHAR(10),                 -- 'macho' | 'hembra'
  color            VARCHAR(60),
  fecha_nacimiento DATE,
  peso             DECIMAL(5,2),                -- último peso conocido; el detalle por consulta vive en historia_clinica
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Migración si la tabla ya existe:
ALTER TABLE IF EXISTS mascotas ADD COLUMN IF NOT EXISTS sexo  VARCHAR(10);
ALTER TABLE IF EXISTS mascotas ADD COLUMN IF NOT EXISTS color VARCHAR(60);

-- ─── ENTIDAD: citas ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS citas (
  id_cita        SERIAL PRIMARY KEY,
  id_mascota     INT NOT NULL REFERENCES mascotas(id_mascota) ON DELETE CASCADE,
  id_veterinario INT NOT NULL REFERENCES veterinarios(id_veterinario),
  fecha          DATE        NOT NULL,
  hora           TIME        NOT NULL,
  motivo         TEXT        NOT NULL,
  estado         VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                 CHECK (estado IN ('pendiente','confirmada','cancelada','atendida')),
  observaciones  TEXT,
  origen         VARCHAR(20) NOT NULL DEFAULT 'interno'
                 CHECK (origen IN ('interno','portal')),
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Restricción: un veterinario no puede tener dos citas al mismo tiempo
  CONSTRAINT uq_cita_veterinario_fecha_hora UNIQUE (id_veterinario, fecha, hora)
);
-- Migración si la tabla ya existe:
ALTER TABLE IF EXISTS citas ADD COLUMN IF NOT EXISTS origen VARCHAR(20) NOT NULL DEFAULT 'interno';

-- ─── ENTIDAD: recordatorios_enviados ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recordatorios_enviados (
  id          SERIAL PRIMARY KEY,
  id_cita     INTEGER REFERENCES citas(id_cita) ON DELETE CASCADE,
  canal       VARCHAR(20) NOT NULL DEFAULT 'email',
  enviado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estado      VARCHAR(20) NOT NULL DEFAULT 'enviado',
  detalle     TEXT,
  tipo        VARCHAR(20) NOT NULL DEFAULT 'cita',   -- 'cita' | 'vacuna' | 'seguimiento'
  id_vacuna   INTEGER                                 -- FK añadida tras crear cartilla_vacunacion
);
-- Migración A.4 — recordatorios ampliados (citas + vacunas):
ALTER TABLE IF EXISTS recordatorios_enviados ALTER COLUMN id_cita DROP NOT NULL;
ALTER TABLE IF EXISTS recordatorios_enviados ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) NOT NULL DEFAULT 'cita';
ALTER TABLE IF EXISTS recordatorios_enviados ADD COLUMN IF NOT EXISTS id_vacuna INTEGER;
DROP INDEX IF EXISTS idx_recordatorio_unico;
CREATE UNIQUE INDEX IF NOT EXISTS idx_recordatorio_unico
  ON recordatorios_enviados(id_cita, canal, tipo) WHERE id_cita IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_recordatorio_vacuna_unico
  ON recordatorios_enviados(id_vacuna, canal) WHERE id_vacuna IS NOT NULL;

-- ─── ENTIDAD: historia_clinica ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS historia_clinica (
  id_historia    SERIAL PRIMARY KEY,
  id_cita        INT UNIQUE NOT NULL REFERENCES citas(id_cita) ON DELETE CASCADE,
  id_mascota     INT        NOT NULL REFERENCES mascotas(id_mascota),
  id_veterinario INT        NOT NULL REFERENCES veterinarios(id_veterinario),
  fecha_consulta DATE        NOT NULL,
  diagnostico    TEXT        NOT NULL,
  tratamiento    TEXT        NOT NULL,
  observaciones  TEXT,
  peso_consulta  DECIMAL(5,2)
);

-- ─── MIGRACIÓN: reset de contraseña por token ───────────────────────────────
ALTER TABLE IF EXISTS usuarios
  ADD COLUMN IF NOT EXISTS reset_token           VARCHAR(36),
  ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_reset_token
  ON usuarios(reset_token) WHERE reset_token IS NOT NULL;

-- ════════════════════════════════════════════════════════════════════════════
-- A.3 — Verificación de correo electrónico
-- ════════════════════════════════════════════════════════════════════════════
ALTER TABLE IF EXISTS usuarios
  ADD COLUMN IF NOT EXISTS correo_verificado  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS token_verificacion VARCHAR(128),
  ADD COLUMN IF NOT EXISTS token_expira       TIMESTAMPTZ;

-- El staff (creado por el admin) no requiere verificación de correo
UPDATE usuarios SET correo_verificado = TRUE
WHERE rol IN ('administrador', 'veterinario', 'recepcionista');

CREATE INDEX IF NOT EXISTS idx_usuarios_token_verificacion
  ON usuarios(token_verificacion) WHERE token_verificacion IS NOT NULL;

-- ════════════════════════════════════════════════════════════════════════════
-- A.2 — Horarios de atención semanales por veterinario
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS horarios_veterinario (
  id             SERIAL PRIMARY KEY,
  id_veterinario INT NOT NULL REFERENCES veterinarios(id_veterinario) ON DELETE CASCADE,
  dia_semana     SMALLINT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),  -- 1=Lunes … 7=Domingo
  hora_inicio    TIME NOT NULL,
  hora_fin       TIME NOT NULL,
  CONSTRAINT chk_horas CHECK (hora_fin > hora_inicio)
);
CREATE INDEX IF NOT EXISTS idx_horarios_vet_dia
  ON horarios_veterinario(id_veterinario, dia_semana);

-- ════════════════════════════════════════════════════════════════════════════
-- A.1 — Cartilla de vacunación digital
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS esquemas_vacuna (
  id            SERIAL PRIMARY KEY,
  nombre_vacuna VARCHAR(150) NOT NULL UNIQUE,
  dias_refuerzo INT NOT NULL,
  descripcion   TEXT
);

INSERT INTO esquemas_vacuna (nombre_vacuna, dias_refuerzo, descripcion) VALUES
  ('Antirrábica',     365, 'Refuerzo anual obligatorio'),
  ('Parvovirus',      365, 'Refuerzo anual'),
  ('Moquillo',        365, 'Refuerzo anual'),
  ('Triple Felina',    21, 'Segunda dosis a los 21 días, luego anual'),
  ('Leucemia Felina', 365, 'Refuerzo anual'),
  ('Bordetella',      180, 'Refuerzo semestral')
ON CONFLICT (nombre_vacuna) DO NOTHING;

CREATE TABLE IF NOT EXISTS cartilla_vacunacion (
  id                  SERIAL PRIMARY KEY,
  id_mascota          INT NOT NULL REFERENCES mascotas(id_mascota) ON DELETE CASCADE,
  tipo_vacuna         VARCHAR(150) NOT NULL,
  fecha_aplicacion    DATE NOT NULL,
  fecha_proxima_dosis DATE,
  lote                VARCHAR(100),
  id_veterinario      INT REFERENCES veterinarios(id_veterinario),
  observaciones       TEXT,
  creado_en           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cartilla_mascota ON cartilla_vacunacion(id_mascota);
CREATE INDEX IF NOT EXISTS idx_cartilla_proxima ON cartilla_vacunacion(fecha_proxima_dosis);

-- FK de recordatorios_enviados.id_vacuna → cartilla_vacunacion(id)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_recordatorio_vacuna') THEN
    ALTER TABLE recordatorios_enviados
      ADD CONSTRAINT fk_recordatorio_vacuna
      FOREIGN KEY (id_vacuna) REFERENCES cartilla_vacunacion(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ─── DATOS INICIALES: usuario administrador ─────────────────────────────────
-- Contraseña: Admin2026* (bcrypt hash generado previamente)
INSERT INTO usuarios (nombre, apellido, correo, contrasena_hash, rol)
VALUES (
  'Admin', 'PetCare',
  'admin@petcare.pe',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBP.W1Vhx09d9W',
  'administrador'
) ON CONFLICT (correo) DO NOTHING;
