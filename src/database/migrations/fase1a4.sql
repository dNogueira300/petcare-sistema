-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN FASES 1-4 — PetCare Sistema
-- Ejecutar en Supabase SQL Editor (en orden, sin omitir bloques)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- FASE 1 — Separación Cita vs. Atención Clínica
-- ─────────────────────────────────────────────────────────────────────────────

-- Máquina de estados clínicos principal
CREATE TABLE IF NOT EXISTS atenciones_clinicas (
  id_atencion      SERIAL PRIMARY KEY,
  id_cita          INT REFERENCES citas(id_cita) ON DELETE SET NULL,
  id_mascota       INT NOT NULL REFERENCES mascotas(id_mascota),
  id_veterinario   INT NOT NULL REFERENCES veterinarios(id_veterinario),
  estado_actual    VARCHAR(30) NOT NULL DEFAULT 'reservada'
                   CHECK (estado_actual IN (
                     'reservada','confirmada','espera','triaje',
                     'consulta','hospitalizado','finalizado',
                     'seguimiento','no_asistio','cancelada'
                   )),
  fecha_inicio     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_estado_actual TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  motivo_consulta  TEXT,
  observaciones    TEXT,
  prioridad        VARCHAR(10) NOT NULL DEFAULT 'normal'
                   CHECK (prioridad IN ('normal','urgente')),
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_atenciones_mascota_estado
  ON atenciones_clinicas(id_mascota, estado_actual);

CREATE INDEX IF NOT EXISTS idx_atenciones_vet_fecha
  ON atenciones_clinicas(id_veterinario, fecha_inicio);

-- Auditoría de transiciones de estado
CREATE TABLE IF NOT EXISTS transiciones_estado (
  id_transicion    SERIAL PRIMARY KEY,
  id_atencion      INT NOT NULL REFERENCES atenciones_clinicas(id_atencion) ON DELETE CASCADE,
  estado_anterior  VARCHAR(30) NOT NULL,
  estado_nuevo     VARCHAR(30) NOT NULL,
  fecha_transicion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  id_usuario       INT NOT NULL REFERENCES usuarios(id_usuario),
  razon            TEXT
);

CREATE INDEX IF NOT EXISTS idx_transiciones_atencion
  ON transiciones_estado(id_atencion, fecha_transicion DESC);

-- Vincular citas a atenciones_clinicas (opcional, no rompe flujo actual)
ALTER TABLE IF EXISTS citas
  ADD COLUMN IF NOT EXISTS id_atencion_clinica INT
  REFERENCES atenciones_clinicas(id_atencion) ON DELETE SET NULL;

-- Migrar citas existentes: cada cita confirmada/atendida obtiene su atención clínica
DO $$
DECLARE
  r RECORD;
  new_estado VARCHAR(30);
  new_id INT;
BEGIN
  FOR r IN
    SELECT c.id_cita, c.id_mascota, c.id_veterinario, c.motivo,
           c.observaciones, c.estado, c.creado_en
    FROM citas c
    WHERE c.id_atencion_clinica IS NULL
      AND c.estado IN ('confirmada','atendida','cancelada')
  LOOP
    IF r.estado = 'atendida' THEN
      new_estado := 'finalizado';
    ELSIF r.estado = 'cancelada' THEN
      new_estado := 'cancelada';
    ELSE
      new_estado := 'confirmada';
    END IF;

    INSERT INTO atenciones_clinicas
      (id_cita, id_mascota, id_veterinario, estado_actual,
       motivo_consulta, observaciones, fecha_inicio, creado_en)
    VALUES
      (r.id_cita, r.id_mascota, r.id_veterinario, new_estado,
       r.motivo, r.observaciones, r.creado_en, r.creado_en)
    RETURNING id_atencion INTO new_id;

    UPDATE citas SET id_atencion_clinica = new_id
    WHERE id_cita = r.id_cita;
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FASE 2 — Módulo Triaje
-- ─────────────────────────────────────────────────────────────────────────────

-- Rangos de referencia por especie (catálogo)
CREATE TABLE IF NOT EXISTS esquema_triaje_mascota (
  id_esquema          SERIAL PRIMARY KEY,
  especie             VARCHAR(50) NOT NULL UNIQUE,
  rango_peso_min      DECIMAL(5,2),
  rango_peso_max      DECIMAL(5,2),
  temp_normal_min     DECIMAL(4,1),
  temp_normal_max     DECIMAL(4,1),
  fc_normal_min       INT,
  fc_normal_max       INT,
  fr_normal_min       INT,
  fr_normal_max       INT,
  observaciones       TEXT
);

INSERT INTO esquema_triaje_mascota
  (especie, rango_peso_min, rango_peso_max, temp_normal_min, temp_normal_max,
   fc_normal_min, fc_normal_max, fr_normal_min, fr_normal_max, observaciones)
VALUES
  ('perro',  2.0, 80.0, 38.0, 39.2, 60,  140, 15, 30, 'Varía ampliamente según raza y tamaño'),
  ('gato',   2.5, 10.0, 38.0, 39.2, 120, 220, 20, 40, 'FC elevada es normal en gatos estresados'),
  ('conejo', 0.5,  7.0, 38.5, 39.5, 130, 325, 30, 60, 'Muy sensibles al estrés'),
  ('ave',    0.1,  2.0, 40.0, 42.0, 150, 350, 15, 35, 'Temperatura corporal más alta'),
  ('reptil', 0.1,  5.0, 26.0, 32.0, 30,   80, 4,  20, 'Temperatura depende del ambiente')
ON CONFLICT (especie) DO NOTHING;

-- Evaluación preliminar clínica
CREATE TABLE IF NOT EXISTS triaje (
  id_triaje               SERIAL PRIMARY KEY,
  id_atencion             INT NOT NULL REFERENCES atenciones_clinicas(id_atencion) ON DELETE CASCADE,
  id_mascota              INT NOT NULL REFERENCES mascotas(id_mascota),
  id_recepcionista        INT NOT NULL REFERENCES usuarios(id_usuario),
  fecha_triaje            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Signos vitales
  peso                    DECIMAL(6,3),
  temperatura             DECIMAL(4,1),
  frecuencia_cardiaca     INT,
  frecuencia_respiratoria INT,
  observaciones_iniciales TEXT,

  -- Urgencia
  nivel_urgencia          VARCHAR(15) NOT NULL DEFAULT 'normal'
                          CHECK (nivel_urgencia IN ('normal','urgente','emergencia')),
  razon_urgencia          TEXT,
  sintomas_reportados     TEXT,

  -- Metadata
  estado                  VARCHAR(15) NOT NULL DEFAULT 'completado'
                          CHECK (estado IN ('completado','incompleto','cancelado')),
  notas_medico            TEXT,
  creado_en               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_triaje_atencion
  ON triaje(id_atencion);

CREATE INDEX IF NOT EXISTS idx_triaje_mascota
  ON triaje(id_mascota);

-- ─────────────────────────────────────────────────────────────────────────────
-- FASE 3 — Desacoplamiento de Especialidades Médicas
-- ─────────────────────────────────────────────────────────────────────────────

-- Catálogo de especialidades
CREATE TABLE IF NOT EXISTS especialidades (
  id_especialidad SERIAL PRIMARY KEY,
  nombre          VARCHAR(100) NOT NULL UNIQUE,
  descripcion     TEXT,
  es_activa       BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO especialidades (nombre, descripcion) VALUES
  ('Medicina General',     'Atención primaria y medicina preventiva'),
  ('Cirugía',              'Procedimientos quirúrgicos y anestesiología'),
  ('Dermatología',         'Enfermedades de la piel, pelo y uñas'),
  ('Cardiología',          'Enfermedades del corazón y sistema cardiovascular'),
  ('Oftalmología',         'Enfermedades de los ojos'),
  ('Nutrición',            'Planes nutricionales y manejo del peso'),
  ('Oncología',            'Diagnóstico y tratamiento de cáncer'),
  ('Ortopedia',            'Huesos, articulaciones y músculos'),
  ('Odontología',          'Salud dental y bucal'),
  ('Animales Exóticos',    'Aves, reptiles, conejos y otros animales no convencionales')
ON CONFLICT (nombre) DO NOTHING;

-- Relación N:M veterinario ↔ especialidades
CREATE TABLE IF NOT EXISTS veterinario_especialidad (
  id                         SERIAL PRIMARY KEY,
  id_veterinario             INT NOT NULL REFERENCES veterinarios(id_veterinario) ON DELETE CASCADE,
  id_especialidad            INT NOT NULL REFERENCES especialidades(id_especialidad),
  es_especialidad_primaria   BOOLEAN NOT NULL DEFAULT FALSE,
  anos_experiencia           INT,
  creado_en                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_vet_especialidad UNIQUE (id_veterinario, id_especialidad)
);

CREATE INDEX IF NOT EXISTS idx_vet_especialidad_vet
  ON veterinario_especialidad(id_veterinario);

-- Migrar especialidades VARCHAR existentes a la tabla
DO $$
DECLARE
  r RECORD;
  esp_id INT;
BEGIN
  FOR r IN
    SELECT DISTINCT v.id_veterinario, v.especialidad
    FROM veterinarios v
    WHERE v.especialidad IS NOT NULL AND v.especialidad != ''
  LOOP
    -- Buscar o crear la especialidad
    SELECT id_especialidad INTO esp_id
    FROM especialidades WHERE LOWER(nombre) = LOWER(r.especialidad);

    IF esp_id IS NULL THEN
      INSERT INTO especialidades (nombre) VALUES (r.especialidad)
      RETURNING id_especialidad INTO esp_id;
    END IF;

    -- Vincular veterinario con esa especialidad
    INSERT INTO veterinario_especialidad (id_veterinario, id_especialidad, es_especialidad_primaria)
    VALUES (r.id_veterinario, esp_id, TRUE)
    ON CONFLICT (id_veterinario, id_especialidad) DO NOTHING;
  END LOOP;
END $$;

-- Catálogo de servicios médicos
CREATE TABLE IF NOT EXISTS servicios_medicos (
  id_servicio             SERIAL PRIMARY KEY,
  nombre                  VARCHAR(150) NOT NULL UNIQUE,
  id_especialidad         INT REFERENCES especialidades(id_especialidad),
  descripcion             TEXT,
  duracion_estimada_min   INT NOT NULL DEFAULT 30,
  precio_base             DECIMAL(10,2),
  es_activo               BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO servicios_medicos (nombre, id_especialidad, descripcion, duracion_estimada_min, precio_base) VALUES
  ('Consulta General',         1, 'Revisión médica general',            30,  50.00),
  ('Vacunación',               1, 'Aplicación de vacunas',              20,  35.00),
  ('Cirugía de Esterilización',2, 'Ovariohisterectomía u orquiectomía', 60, 200.00),
  ('Cirugía General',          2, 'Procedimientos quirúrgicos varios',   90, 300.00),
  ('Consulta Dermatológica',   3, 'Evaluación de problemas de piel',     40,  80.00),
  ('Ecocardiograma',           4, 'Ultrasonido cardiaco',               45, 150.00),
  ('Examen Oftalmológico',     5, 'Revisión de ojos',                   30,  70.00),
  ('Control Nutricional',      6, 'Plan nutricional personalizado',      30,  60.00),
  ('Limpieza Dental',          9, 'Profilaxis dental con anestesia',     45, 120.00),
  ('Consulta Exóticos',       10, 'Atención para animales exóticos',     40,  90.00)
ON CONFLICT (nombre) DO NOTHING;

-- Vincular servicios a citas (opcional, backward compatible)
ALTER TABLE IF EXISTS citas
  ADD COLUMN IF NOT EXISTS id_servicio    INT REFERENCES servicios_medicos(id_servicio),
  ADD COLUMN IF NOT EXISTS id_especialidad INT REFERENCES especialidades(id_especialidad);

-- ─────────────────────────────────────────────────────────────────────────────
-- FASE 4 — Auditoría Clínica Completa
-- ─────────────────────────────────────────────────────────────────────────────

-- Auditoría especializada de historia clínica
CREATE TABLE IF NOT EXISTS auditoria_historia_clinica (
  id_auditoria            SERIAL PRIMARY KEY,
  id_historia             INT NOT NULL REFERENCES historia_clinica(id_historia) ON DELETE CASCADE,
  id_usuario              INT NOT NULL REFERENCES usuarios(id_usuario),
  tipo_cambio             VARCHAR(10) NOT NULL CHECK (tipo_cambio IN ('INSERT','UPDATE')),
  timestamp_cambio        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Campos que cambiaron
  diagnostico_anterior    TEXT,
  diagnostico_nuevo       TEXT,
  tratamiento_anterior    TEXT,
  tratamiento_nuevo       TEXT,
  observaciones_anterior  TEXT,
  observaciones_nuevo     TEXT,
  peso_anterior           DECIMAL(5,2),
  peso_nuevo              DECIMAL(5,2),

  razon_cambio            TEXT
);

CREATE INDEX IF NOT EXISTS idx_auditoria_hc_historia
  ON auditoria_historia_clinica(id_historia, timestamp_cambio DESC);

CREATE INDEX IF NOT EXISTS idx_auditoria_hc_usuario
  ON auditoria_historia_clinica(id_usuario);

-- Auditoría general (todas las tablas críticas)
CREATE TABLE IF NOT EXISTS auditoria (
  id_auditoria     SERIAL PRIMARY KEY,
  tabla_afectada   VARCHAR(60) NOT NULL,
  id_registro      INT NOT NULL,
  id_usuario       INT NOT NULL REFERENCES usuarios(id_usuario),
  campo_modificado VARCHAR(100),
  valor_anterior   TEXT,
  valor_nuevo      TEXT,
  tipo_cambio      VARCHAR(10) NOT NULL CHECK (tipo_cambio IN ('INSERT','UPDATE','DELETE')),
  fecha_cambio     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  razon_cambio     TEXT
);

CREATE INDEX IF NOT EXISTS idx_auditoria_tabla_registro
  ON auditoria(tabla_afectada, id_registro, fecha_cambio DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIN DE MIGRACIÓN
-- ═══════════════════════════════════════════════════════════════════════════════
