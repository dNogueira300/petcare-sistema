-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN FASES 5-8 — PetCare Sistema
-- Ejecutar en Supabase SQL Editor (en orden, idempotente)
-- Prerequisito: Haber ejecutado fase1a4.sql previamente
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- FASE 5 — Gestión de Capacidad Operativa (Recursos)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recursos (
  id_recurso          SERIAL PRIMARY KEY,
  nombre              VARCHAR(150) NOT NULL,
  tipo_recurso        VARCHAR(30)  NOT NULL
                      CHECK (tipo_recurso IN ('consultorio','quirofano','equipo','jaula_hospitalizacion')),
  descripcion         TEXT,
  capacidad           INT NOT NULL DEFAULT 1,
  ubicacion           VARCHAR(100),
  notas_mantenimiento TEXT,
  activo              BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO recursos (nombre, tipo_recurso, descripcion, capacidad) VALUES
  ('Consultorio 1',          'consultorio',         'Consultorio de medicina general',    1),
  ('Consultorio 2',          'consultorio',         'Consultorio de especialidades',      1),
  ('Quirófano Principal',    'quirofano',           'Sala quirúrgica principal',           1),
  ('Sala de Recuperación',   'jaula_hospitalizacion','Sala con 4 jaulas de internamiento', 4),
  ('Equipo de Rayos X',      'equipo',              'Equipo de radiografía digital',      1),
  ('Ecógrafo',               'equipo',              'Equipo de ultrasonido',              1)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS recurso_disponibilidad (
  id_disponibilidad SERIAL PRIMARY KEY,
  id_recurso        INT NOT NULL REFERENCES recursos(id_recurso) ON DELETE CASCADE,
  dia_semana        SMALLINT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
  hora_inicio       TIME NOT NULL,
  hora_fin          TIME NOT NULL,
  activo            BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT chk_recurso_horas CHECK (hora_fin > hora_inicio)
);

CREATE INDEX IF NOT EXISTS idx_recurso_disp
  ON recurso_disponibilidad(id_recurso, dia_semana);

-- Disponibilidad por defecto: lunes-sábado 07:00-20:00
INSERT INTO recurso_disponibilidad (id_recurso, dia_semana, hora_inicio, hora_fin)
SELECT r.id_recurso, d.dia, '07:00', '20:00'
FROM recursos r
CROSS JOIN (VALUES (1),(2),(3),(4),(5),(6)) AS d(dia)
WHERE r.nombre IN ('Consultorio 1','Consultorio 2','Quirófano Principal','Sala de Recuperación','Equipo de Rayos X','Ecógrafo')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS cita_recursos (
  id_cita_recurso         SERIAL PRIMARY KEY,
  id_cita                 INT NOT NULL REFERENCES citas(id_cita) ON DELETE CASCADE,
  id_recurso              INT NOT NULL REFERENCES recursos(id_recurso),
  duracion_reserva_minutos INT NOT NULL DEFAULT 30,
  creado_en               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cita_recursos_cita
  ON cita_recursos(id_cita);

CREATE INDEX IF NOT EXISTS idx_cita_recursos_recurso
  ON cita_recursos(id_recurso);

-- Vincular recursos requeridos a servicios médicos
ALTER TABLE IF EXISTS servicios_medicos
  ADD COLUMN IF NOT EXISTS id_recurso_requerido INT REFERENCES recursos(id_recurso);

-- Asignar recursos por defecto a los servicios existentes
UPDATE servicios_medicos SET id_recurso_requerido = (
  SELECT id_recurso FROM recursos WHERE nombre = 'Quirófano Principal' LIMIT 1
) WHERE nombre IN ('Cirugía de Esterilización','Cirugía General','Limpieza Dental')
  AND id_recurso_requerido IS NULL;

UPDATE servicios_medicos SET id_recurso_requerido = (
  SELECT id_recurso FROM recursos WHERE nombre = 'Equipo de Rayos X' LIMIT 1
) WHERE nombre IN ('Ecocardiograma')
  AND id_recurso_requerido IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- FASE 6 — Cartilla de Vacunación Digital Completa
-- ─────────────────────────────────────────────────────────────────────────────

-- Nuevas columnas en cartilla_vacunacion
ALTER TABLE IF EXISTS cartilla_vacunacion
  ADD COLUMN IF NOT EXISTS fecha_vencimiento_lote DATE,
  ADD COLUMN IF NOT EXISTS dosis_numero           INT,
  ADD COLUMN IF NOT EXISTS va_completado          BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tipo_vacuna_categoria  VARCHAR(20) DEFAULT 'recomendada'
                           CHECK (tipo_vacuna_categoria IN ('obligatoria','recomendada','opcional'));

-- Alertas de vacunación
CREATE TABLE IF NOT EXISTS alertas_vacunacion (
  id_alerta       SERIAL PRIMARY KEY,
  id_mascota      INT NOT NULL REFERENCES mascotas(id_mascota) ON DELETE CASCADE,
  id_vacuna       INT NOT NULL REFERENCES cartilla_vacunacion(id) ON DELETE CASCADE,
  tipo_alerta     VARCHAR(20) NOT NULL
                  CHECK (tipo_alerta IN ('vencida','proximo_refuerzo','incompleta')),
  fecha_alerta    DATE NOT NULL,
  dias_anticipacion INT NOT NULL DEFAULT 7,
  estado          VARCHAR(15) NOT NULL DEFAULT 'activa'
                  CHECK (estado IN ('activa','enviada','completada','ignorada')),
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alertas_vac_mascota
  ON alertas_vacunacion(id_mascota, estado);

CREATE INDEX IF NOT EXISTS idx_alertas_vac_fecha
  ON alertas_vacunacion(fecha_alerta, estado);

-- ─────────────────────────────────────────────────────────────────────────────
-- FASE 7 — Seguimiento Clínico Automatizado
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS historia_clinica
  ADD COLUMN IF NOT EXISTS estado_seguimiento VARCHAR(25) NOT NULL DEFAULT 'sin_seguimiento'
  CHECK (estado_seguimiento IN ('sin_seguimiento','pendiente_seguimiento','seguimiento_completado'));

-- Hacer id_historia_clinica nullable (permite seguimientos sin HC previa)
ALTER TABLE IF EXISTS seguimientos_clinicos
  ALTER COLUMN id_historia_clinica DROP NOT NULL;

CREATE TABLE IF NOT EXISTS seguimientos_clinicos (
  id_seguimiento               SERIAL PRIMARY KEY,
  id_historia_clinica          INT REFERENCES historia_clinica(id_historia) ON DELETE SET NULL,
  id_mascota                   INT NOT NULL REFERENCES mascotas(id_mascota),
  id_veterinario               INT NOT NULL REFERENCES veterinarios(id_veterinario),
  motivo_seguimiento           VARCHAR(200) NOT NULL,
  fecha_sugerida_control       DATE NOT NULL,
  dias_anticipacion_recordatorio INT NOT NULL DEFAULT 3,
  estado                       VARCHAR(25) NOT NULL DEFAULT 'pendiente'
                               CHECK (estado IN ('pendiente','sugerencia_enviada','cita_agendada',
                                                  'completado','no_presentado','cancelado')),
  observaciones                TEXT,
  id_cita_sugerida             INT REFERENCES citas(id_cita) ON DELETE SET NULL,
  creado_en                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seguimiento_mascota
  ON seguimientos_clinicos(id_mascota, estado);

CREATE INDEX IF NOT EXISTS idx_seguimiento_fecha
  ON seguimientos_clinicos(fecha_sugerida_control, estado);

CREATE INDEX IF NOT EXISTS idx_seguimiento_vet
  ON seguimientos_clinicos(id_veterinario, estado);

-- ─────────────────────────────────────────────────────────────────────────────
-- FASE 8 — Manejo de Escenarios Críticos y Excepciones
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS indisponibilidades (
  id_indisponibilidad   SERIAL PRIMARY KEY,
  id_veterinario        INT NOT NULL REFERENCES veterinarios(id_veterinario),
  fecha_inicio          DATE NOT NULL,
  fecha_fin             DATE NOT NULL,
  razon                 VARCHAR(20) NOT NULL
                        CHECK (razon IN ('enfermedad','vacaciones','capacitacion','emergencia','otro')),
  justificacion         TEXT,
  creado_por            INT NOT NULL REFERENCES usuarios(id_usuario),
  notificaciones_enviadas BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_fechas_indisponibilidad CHECK (fecha_fin >= fecha_inicio)
);

CREATE INDEX IF NOT EXISTS idx_indisponibilidades_vet
  ON indisponibilidades(id_veterinario, fecha_inicio, fecha_fin);

CREATE TABLE IF NOT EXISTS colas_espera (
  id_cola_espera            SERIAL PRIMARY KEY,
  id_mascota                INT NOT NULL REFERENCES mascotas(id_mascota),
  id_cliente                INT NOT NULL REFERENCES clientes(id_cliente),
  motivo                    TEXT NOT NULL,
  fecha_registro            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  preferencia_fecha         DATE,
  preferencia_veterinario   INT REFERENCES veterinarios(id_veterinario),
  estado                    VARCHAR(20) NOT NULL DEFAULT 'activa'
                            CHECK (estado IN ('activa','oferecido_horario','agendada','cancelada')),
  creado_en                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cola_espera_estado
  ON colas_espera(estado, fecha_registro);

CREATE TABLE IF NOT EXISTS excepciones_citas (
  id_excepcion         SERIAL PRIMARY KEY,
  id_cita              INT NOT NULL REFERENCES citas(id_cita) ON DELETE CASCADE,
  tipo_excepcion       VARCHAR(25) NOT NULL
                       CHECK (tipo_excepcion IN ('veterinario_inactivo','cliente_inactivo',
                                                  'emergencia','reprogramacion','cancelacion_cliente')),
  razon                TEXT NOT NULL,
  id_cita_nueva        INT REFERENCES citas(id_cita) ON DELETE SET NULL,
  estado_notificacion  VARCHAR(15) NOT NULL DEFAULT 'pendiente'
                       CHECK (estado_notificacion IN ('pendiente','enviada','cliente_acepto')),
  creado_por           INT NOT NULL REFERENCES usuarios(id_usuario),
  creado_en            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_excepciones_cita
  ON excepciones_citas(id_cita);

CREATE INDEX IF NOT EXISTS idx_excepciones_notificacion
  ON excepciones_citas(estado_notificacion);

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIN DE MIGRACIÓN FASES 5-8
-- ═══════════════════════════════════════════════════════════════════════════════
