-- ─── TABLA BASE: usuarios ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario      SERIAL PRIMARY KEY,
  nombre          VARCHAR(100) NOT NULL,
  apellido        VARCHAR(100) NOT NULL,
  correo          VARCHAR(150) UNIQUE NOT NULL,
  contrasena_hash VARCHAR(255) NOT NULL,
  rol             VARCHAR(20)  NOT NULL CHECK (rol IN ('administrador','veterinario','recepcionista','cliente')),
  activo          BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

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
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Restricción: un veterinario no puede tener dos citas al mismo tiempo
  CONSTRAINT uq_cita_veterinario_fecha_hora UNIQUE (id_veterinario, fecha, hora)
);

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

-- ─── DATOS INICIALES: usuario administrador ─────────────────────────────────
-- Contraseña: Admin2026* (bcrypt hash generado previamente)
INSERT INTO usuarios (nombre, apellido, correo, contrasena_hash, rol)
VALUES (
  'Admin', 'PetCare',
  'admin@petcare.pe',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBP.W1Vhx09d9W',
  'administrador'
) ON CONFLICT (correo) DO NOTHING;
