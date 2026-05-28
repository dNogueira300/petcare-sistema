# Implementación Fases 5–8 — PetCare Sistema

**Fecha:** 28 de mayo de 2026  
**Prerequisito:** Haber ejecutado previamente `src/database/migrations/fase1a4.sql`

---

## ⚠️ PASOS MANUALES REQUERIDOS EN LA BASE DE DATOS

Ejecutar **`src/database/migrations/fase5a8.sql`** en el SQL Editor de Supabase. Script idempotente, seguro de re-ejecutar.

### Resumen de cambios en BD

#### Fase 5 — Recursos

```sql
-- Tablas nuevas
CREATE TABLE recursos (id_recurso, nombre, tipo_recurso, capacidad, ubicacion, activo...)
CREATE TABLE recurso_disponibilidad (id_recurso, dia_semana, hora_inicio, hora_fin, activo)
CREATE TABLE cita_recursos (id_cita, id_recurso, duracion_reserva_minutos)

-- Datos iniciales: 6 recursos (2 consultorios, 1 quirófano, 1 sala recuperación, 2 equipos)
-- Disponibilidad por defecto: Lun-Sáb 07:00-20:00

-- Columna nueva en servicios_medicos:
ALTER TABLE servicios_medicos ADD COLUMN id_recurso_requerido INT REFERENCES recursos
-- Quirófano asignado a Cirugía de Esterilización, Cirugía General, Limpieza Dental
```

#### Fase 6 — Vacunación

```sql
-- Columnas nuevas en cartilla_vacunacion:
ALTER TABLE cartilla_vacunacion
  ADD COLUMN fecha_vencimiento_lote DATE,
  ADD COLUMN dosis_numero INT,
  ADD COLUMN va_completado BOOLEAN DEFAULT FALSE,
  ADD COLUMN tipo_vacuna_categoria VARCHAR(20)  -- obligatoria/recomendada/opcional

-- Tabla nueva:
CREATE TABLE alertas_vacunacion (id_alerta, id_mascota, id_vacuna, tipo_alerta, fecha_alerta, estado...)
-- tipo_alerta: vencida | proximo_refuerzo | incompleta
-- estado: activa | enviada | completada | ignorada
```

#### Fase 7 — Seguimientos

```sql
-- Columna nueva en historia_clinica:
ALTER TABLE historia_clinica ADD COLUMN estado_seguimiento VARCHAR(25)
  CHECK (estado_seguimiento IN ('sin_seguimiento','pendiente_seguimiento','seguimiento_completado'))

-- Tabla nueva:
CREATE TABLE seguimientos_clinicos (
  id_seguimiento, id_historia_clinica, id_mascota, id_veterinario,
  motivo_seguimiento, fecha_sugerida_control, dias_anticipacion_recordatorio,
  estado, observaciones, id_cita_sugerida
)
-- estados: pendiente | sugerencia_enviada | cita_agendada | completado | no_presentado | cancelado
```

#### Fase 8 — Excepciones

```sql
CREATE TABLE indisponibilidades (id_veterinario, fecha_inicio, fecha_fin, razon, justificacion...)
-- razones: enfermedad | vacaciones | capacitacion | emergencia | otro

CREATE TABLE colas_espera (id_mascota, id_cliente, motivo, preferencia_fecha, estado...)
-- estados: activa | oferecido_horario | agendada | cancelada

CREATE TABLE excepciones_citas (id_cita, tipo_excepcion, razon, id_cita_nueva, estado_notificacion...)
-- tipo: veterinario_inactivo | cliente_inactivo | emergencia | reprogramacion | cancelacion_cliente
```

---

## Archivos Creados / Modificados

### Base de Datos

| Archivo                               | Descripción                               |
| ------------------------------------- | ----------------------------------------- |
| `src/database/migrations/fase5a8.sql` | Migración completa — ejecutar en Supabase |

### Tipos TypeScript

| Archivo              | Tipos agregados                                                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/types/index.ts` | `Recurso`, `RecursoDisponibilidad`, `CitaRecurso`, `AlertaVacunacion`, `SeguimientoClinico`, `Indisponibilidad`, `ColaEspera`, `ExcepcionCita` y sus tipos asociados |

### APIs Backend — Fase 5 (Recursos)

| Ruta                                | Método | Descripción                           |
| ----------------------------------- | ------ | ------------------------------------- |
| `/api/recursos`                     | GET    | Listar recursos con disponibilidad    |
| `/api/recursos`                     | POST   | Crear recurso (admin)                 |
| `/api/recursos/[id]`                | GET    | Detalle del recurso                   |
| `/api/recursos/[id]`                | PATCH  | Editar / activar / desactivar (admin) |
| `/api/recursos/[id]/disponibilidad` | GET    | Horarios del recurso                  |
| `/api/recursos/[id]/disponibilidad` | POST   | Agregar horario (admin)               |

### APIs Backend — Fase 6 (Vacunación)

| Ruta                           | Método | Descripción                                                                          |
| ------------------------------ | ------ | ------------------------------------------------------------------------------------ |
| `/api/alertas-vacunacion`      | GET    | Listar alertas (filtrable por mascota, estado)                                       |
| `/api/alertas-vacunacion/[id]` | PATCH  | Cambiar estado de alerta                                                             |
| `/api/vacunas` (POST)          | —      | **Actualizado:** valida lote vencido, crea alerta automática                         |
| `/api/vacunas` (POST)          | —      | **Nuevos campos:** `fecha_vencimiento_lote`, `dosis_numero`, `tipo_vacuna_categoria` |

### APIs Backend — Fase 7 (Seguimientos)

| Ruta                              | Método | Descripción                                                                               |
| --------------------------------- | ------ | ----------------------------------------------------------------------------------------- |
| `/api/seguimientos-clinicos`      | GET    | Listar seguimientos (filtros: estado, mascota, veterinario, pendientes)                   |
| `/api/seguimientos-clinicos`      | POST   | Crear seguimiento + actualiza `historia_clinica.estado_seguimiento`                       |
| `/api/seguimientos-clinicos/[id]` | GET    | Detalle del seguimiento                                                                   |
| `/api/seguimientos-clinicos/[id]` | PATCH  | Actualizar estado (completado marca HC como seguimiento_completado)                       |
| `/api/recordatorios`              | —      | **Actualizado:** procesa seguimientos pendientes + marca alertas vacunacion como enviadas |

### APIs Backend — Fase 8 (Excepciones)

| Ruta                           | Método | Descripción                                                   |
| ------------------------------ | ------ | ------------------------------------------------------------- |
| `/api/indisponibilidades`      | GET    | Listar bloqueos de agenda (admin/recepcionista)               |
| `/api/indisponibilidades`      | POST   | Registrar + crea excepciones para citas afectadas en el rango |
| `/api/indisponibilidades/[id]` | PATCH  | Actualizar justificación / marcar notificaciones enviadas     |
| `/api/indisponibilidades/[id]` | DELETE | Eliminar bloqueo (admin)                                      |
| `/api/colas-espera`            | GET    | Listar cola (filtrable por estado)                            |
| `/api/colas-espera`            | POST   | Agregar cliente a cola                                        |
| `/api/colas-espera/[id]`       | PATCH  | Cambiar estado (activa → oferecido_horario → agendada)        |

### Frontend

| Archivo                                              | Descripción                                                            |
| ---------------------------------------------------- | ---------------------------------------------------------------------- |
| `src/app/(dashboard)/recursos/page.tsx`              | Grid por tipo de recurso con disponibilidad + CRUD modal               |
| `src/app/(dashboard)/seguimientos-clinicos/page.tsx` | Tabla con filtros, alertas de vencidos, modal de gestión               |
| `src/app/(dashboard)/indisponibilidades/page.tsx`    | Tabla de bloqueos + modal de registro con resultado de citas afectadas |
| `src/app/(dashboard)/cola-espera/page.tsx`           | Tabla FIFO con filtros + agregar a cola modal                          |

### Archivos Modificados

| Archivo                              | Cambio                                                                                                    |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `src/lib/rbac.ts`                    | + módulos `recursos`, `seguimientos-clinicos`, `indisponibilidades`, `cola-espera`                        |
| `src/components/layout/Sidebar.tsx`  | + sección "Operaciones" (Seguimientos, Indisponibilidades, Cola de Espera); + Recursos en "Configuración" |
| `src/app/api/vacunas/route.ts`       | + validación de lote vencido + creación automática de alerta                                              |
| `src/app/api/recordatorios/route.ts` | + procesamiento de seguimientos + marcado de alertas vacunacion                                           |

---

## Lógica de Negocio Implementada

### Fase 5 — Recursos

Los recursos (consultorios, quirófanos, equipos) son configurables. Cada servicio médico puede requerir un recurso específico. Al asignar una cita a un servicio que requiere recurso, el sistema puede verificar disponibilidad del recurso mediante `cita_recursos`. La validación completa en el agendamiento (verificar recurso disponible en tiempo real) queda como extensión natural de la API de citas.

### Fase 6 — Alertas de Vacunación

Al registrar una vacuna con `fecha_proxima_dosis`, el sistema **automáticamente crea** una alerta en `alertas_vacunacion` con 7 días de anticipación. El cron diario (`/api/recordatorios`) marca las alertas que llegaron a su `fecha_alerta` como "enviadas". Se valida que el lote no esté vencido (`fecha_vencimiento_lote < fecha_actual`).

### Fase 7 — Seguimientos Clínicos

Al crear un seguimiento, `historia_clinica.estado_seguimiento` pasa a `pendiente_seguimiento`. Al marcarlo como "completado", la HC pasa a `seguimiento_completado`. El cron calcula si `fecha_sugerida_control - dias_anticipacion_recordatorio = hoy` para enviar el aviso y avanzar a `sugerencia_enviada`.

### Fase 8 — Indisponibilidades

Al registrar una indisponibilidad, el sistema **automáticamente busca** todas las citas del veterinario en ese rango con estado `pendiente` o `confirmada`, y crea un registro en `excepciones_citas` (tipo `veterinario_inactivo`) para cada una. El admin ve cuántas citas fueron afectadas en la respuesta inmediata. Las excepciones quedan en estado `pendiente` de notificación.

---

## Permisos por Rol

| Módulo             | Admin | Veterinario | Recepcionista | Cliente          |
| ------------------ | ----- | ----------- | ------------- | ---------------- |
| Recursos (lectura) | ✅     | —           | —             | —                |
| Recursos (CRUD)    | ✅     | ❌           | ❌             | ❌                |
| Alertas vacunación | ✅     | ✅           | ✅             | ✅ (solo propias) |
| Seguimientos       | ✅     | ✅           | ✅             | ❌                |
| Indisponibilidades | ✅     | ❌           | ✅ (lectura)   | ❌                |
| Cola de espera     | ✅     | ❌           | ✅             | ❌                |

---

## Próximos Pasos Sugeridos (Fases 9-11)

- **Fase 9** — Almacenamiento de Archivos en HC: bucket Supabase + upload drag-and-drop
- **Fase 10** — Analítica Avanzada: vista materializada `metricas_diarias` + dashboard con gráficos
- **Fase 11** — Pagos Online: tabla `pagos` + integración Stripe/Mercado Pago

---

*Generado automáticamente — 28 de mayo de 2026*
