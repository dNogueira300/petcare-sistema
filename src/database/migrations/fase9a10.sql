-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN FASES 9-10 — PetCare Sistema
-- Ejecutar en Supabase SQL Editor (idempotente)
-- Prerequisito: fase1a4.sql y fase5a8.sql ejecutados previamente
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- FASE 9 — Almacenamiento de Archivos en Historia Clínica
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS archivos_historia_clinica (
  id_archivo      SERIAL PRIMARY KEY,
  id_historia     INT NOT NULL REFERENCES historia_clinica(id_historia) ON DELETE CASCADE,
  id_mascota      INT NOT NULL REFERENCES mascotas(id_mascota),
  tipo_archivo    VARCHAR(20) NOT NULL DEFAULT 'otro'
                  CHECK (tipo_archivo IN ('radiografia','ecografia','fotografia','laboratorio','receta','otro')),
  nombre_original VARCHAR(255) NOT NULL,
  path_storage    VARCHAR(500) NOT NULL,
  tamano_bytes    INT NOT NULL,
  mime_type       VARCHAR(100) NOT NULL,
  url_publica     VARCHAR(1000),
  fecha_carga     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subido_por      INT NOT NULL REFERENCES usuarios(id_usuario)
);

CREATE INDEX IF NOT EXISTS idx_archivos_historia
  ON archivos_historia_clinica(id_historia);

CREATE INDEX IF NOT EXISTS idx_archivos_mascota
  ON archivos_historia_clinica(id_mascota);

-- ─────────────────────────────────────────────────────────────────────────────
-- FASE 10 — Analítica Operacional Avanzada
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS metricas_diarias (
  id_metrica                  SERIAL PRIMARY KEY,
  fecha                       DATE NOT NULL UNIQUE,
  total_citas_agendadas       INT NOT NULL DEFAULT 0,
  total_citas_completadas     INT NOT NULL DEFAULT 0,
  total_citas_canceladas      INT NOT NULL DEFAULT 0,
  total_citas_no_asistio      INT NOT NULL DEFAULT 0,
  total_clientes_nuevos       INT NOT NULL DEFAULT 0,
  total_mascotas_nuevas       INT NOT NULL DEFAULT 0,
  promedio_tiempo_atencion    INT,          -- minutos (para futuro uso)
  veterinario_mas_solicitado  VARCHAR(200),
  hora_pico                   TIME,
  vacunas_aplicadas           INT NOT NULL DEFAULT 0,
  historias_registradas       INT NOT NULL DEFAULT 0,
  seguimientos_pendientes     INT NOT NULL DEFAULT 0,
  alertas_vacunas_activas     INT NOT NULL DEFAULT 0,
  calculado_en                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metricas_fecha
  ON metricas_diarias(fecha DESC);

-- Vista para métricas agregadas rápidas (sin materializar — Supabase no soporta REFRESH CONCURRENTLY en plan free)
CREATE OR REPLACE VIEW vista_resumen_citas AS
SELECT
  DATE_TRUNC('month', fecha) AS mes,
  COUNT(*)                                              AS total,
  COUNT(*) FILTER (WHERE estado = 'atendida')           AS atendidas,
  COUNT(*) FILTER (WHERE estado = 'cancelada')          AS canceladas,
  COUNT(*) FILTER (WHERE estado = 'pendiente')          AS pendientes,
  COUNT(*) FILTER (WHERE estado = 'confirmada')         AS confirmadas,
  COUNT(*) FILTER (WHERE origen  = 'portal')            AS desde_portal
FROM citas
GROUP BY DATE_TRUNC('month', fecha)
ORDER BY mes DESC;

CREATE OR REPLACE VIEW vista_mascotas_por_especie AS
SELECT
  especie,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE sexo = 'macho')  AS machos,
  COUNT(*) FILTER (WHERE sexo = 'hembra') AS hembras
FROM mascotas
GROUP BY especie
ORDER BY total DESC;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIN DE MIGRACIÓN FASES 9-10
-- ═══════════════════════════════════════════════════════════════════════════════
