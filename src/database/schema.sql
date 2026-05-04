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
  fecha_nacimiento DATE,
  peso             DECIMAL(5,2),
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
  id_cita     INTEGER NOT NULL REFERENCES citas(id_cita) ON DELETE CASCADE,
  canal       VARCHAR(20) NOT NULL DEFAULT 'email',
  enviado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estado      VARCHAR(20) NOT NULL DEFAULT 'enviado',
  detalle     TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_recordatorio_unico ON recordatorios_enviados(id_cita, canal);

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

-- ─── DATOS INICIALES: usuario administrador ─────────────────────────────────
-- Contraseña: Admin2026* (bcrypt hash generado previamente)
INSERT INTO usuarios (nombre, apellido, correo, contrasena_hash, rol)
VALUES (
  'Admin', 'PetCare',
  'admin@petcare.pe',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBP.W1Vhx09d9W',
  'administrador'
) ON CONFLICT (correo) DO NOTHING;
