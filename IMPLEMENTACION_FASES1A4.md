# Implementación Fases 1–4 — PetCare Sistema

**Fecha:** 28 de mayo de 2026  
**Versión del plan:** PLAN_DESARROLLO_V2_PetCare.md

---

## Resumen Ejecutivo

Se implementaron las cuatro fases críticas del Plan de Desarrollo V2. El sistema evolucionó de un gestor básico de citas a una plataforma clínica con máquina de estados, triaje, especialidades desacopladas y auditoría completa.

---

## ⚠️ PASOS MANUALES REQUERIDOS EN LA BASE DE DATOS

> **IMPORTANTE:** Ejecutar el siguiente script en el SQL Editor de Supabase **antes de usar las nuevas funcionalidades**.
> El archivo completo está en: `src/database/migrations/fase1a4.sql`

### Orden de ejecución

Ejecutar `src/database/migrations/fase1a4.sql` completo en Supabase. El script está diseñado para ser idempotente (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`).

### Qué hace el script

#### Fase 1 — Tablas nuevas

```sql
-- Tabla principal de la máquina de estados clínicos
CREATE TABLE IF NOT EXISTS atenciones_clinicas (...)

-- Auditoría de cada cambio de estado
CREATE TABLE IF NOT EXISTS transiciones_estado (...)

-- Nueva columna en citas
ALTER TABLE citas ADD COLUMN IF NOT EXISTS id_atencion_clinica INT ...

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_atenciones_mascota_estado ...
CREATE INDEX IF NOT EXISTS idx_atenciones_vet_fecha ...
CREATE INDEX IF NOT EXISTS idx_transiciones_atencion ...
```

#### Fase 1 — Migración de datos existentes

```sql
-- Migra citas confirmadas/atendidas/canceladas a atenciones_clinicas automáticamente
DO $$ ... $$;
```

#### Fase 2 — Tablas nuevas

```sql
CREATE TABLE IF NOT EXISTS esquema_triaje_mascota (...)  -- Rangos por especie
CREATE TABLE IF NOT EXISTS triaje (...)                   -- Evaluación preliminar

-- Datos iniciales de rangos normales (perro, gato, conejo, ave, reptil)
INSERT INTO esquema_triaje_mascota ...

-- Índices
CREATE UNIQUE INDEX IF NOT EXISTS idx_triaje_atencion ...
CREATE INDEX IF NOT EXISTS idx_triaje_mascota ...
```

#### Fase 3 — Tablas nuevas

```sql
CREATE TABLE IF NOT EXISTS especialidades (...)             -- Catálogo
CREATE TABLE IF NOT EXISTS veterinario_especialidad (...)   -- Relación N:M
CREATE TABLE IF NOT EXISTS servicios_medicos (...)          -- Catálogo de servicios

-- Datos iniciales: 10 especialidades + 10 servicios base
INSERT INTO especialidades ...
INSERT INTO servicios_medicos ...

-- Migración: convierte especialidad VARCHAR existente a la nueva tabla
DO $$ ... $$;

-- Columnas opcionales en citas
ALTER TABLE citas ADD COLUMN IF NOT EXISTS id_servicio INT ...
ALTER TABLE citas ADD COLUMN IF NOT EXISTS id_especialidad INT ...

-- Índices
CREATE INDEX IF NOT EXISTS idx_vet_especialidad_vet ...
```

#### Fase 4 — Tablas de auditoría

```sql
CREATE TABLE IF NOT EXISTS auditoria_historia_clinica (...)  -- Auditoría especializada HC
CREATE TABLE IF NOT EXISTS auditoria (...)                    -- Auditoría general

-- Índices
CREATE INDEX IF NOT EXISTS idx_auditoria_hc_historia ...
CREATE INDEX IF NOT EXISTS idx_auditoria_hc_usuario ...
CREATE INDEX IF NOT EXISTS idx_auditoria_tabla_registro ...
```

---

## Archivos Creados / Modificados

### Base de Datos

| Archivo                               | Descripción                                               |
| ------------------------------------- | --------------------------------------------------------- |
| `src/database/migrations/fase1a4.sql` | **Migración completa** — ejecutar manualmente en Supabase |

### Tipos TypeScript

| Archivo              | Cambio                                                                                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/types/index.ts` | + `EstadoAtencion`, `AtencionClinica`, `TransicionEstado`, `TRANSICIONES_VALIDAS`, `Triaje`, `EsquemaTriajeMascota`, `Especialidad`, `VeterinarioEspecialidad`, `ServicioMedico`, `AuditoriaHistoriaClinica` |

### APIs Backend — Fase 1

| Ruta                                       | Método | Descripción                                             |
| ------------------------------------------ | ------ | ------------------------------------------------------- |
| `/api/atenciones-clinicas`                 | GET    | Listar con filtros (estado, id_mascota, id_veterinario) |
| `/api/atenciones-clinicas`                 | POST   | Crear atención clínica (opcionalmente desde cita)       |
| `/api/atenciones-clinicas/[id]`            | GET    | Detalle completo                                        |
| `/api/atenciones-clinicas/[id]`            | PATCH  | Actualizar observaciones/prioridad                      |
| `/api/atenciones-clinicas/[id]/transicion` | PATCH  | Cambiar estado (con validación de transiciones)         |
| `/api/atenciones-clinicas/[id]/transicion` | GET    | Historial de transiciones                               |

### APIs Backend — Fase 2

| Ruta               | Método | Descripción                                             |
| ------------------ | ------ | ------------------------------------------------------- |
| `/api/triaje`      | GET    | Listar triajes (filtrable por id_atencion, id_mascota)  |
| `/api/triaje`      | POST   | Crear triaje + avanzar atención a estado "triaje"       |
| `/api/triaje/[id]` | GET    | Detalle del triaje                                      |
| `/api/triaje/[id]` | PATCH  | Actualizar triaje (notas_medico, incompleto→completado) |

### APIs Backend — Fase 3

| Ruta                                    | Método | Descripción                                 |
| --------------------------------------- | ------ | ------------------------------------------- |
| `/api/especialidades`                   | GET    | Catálogo de especialidades                  |
| `/api/especialidades`                   | POST   | Crear especialidad (admin)                  |
| `/api/especialidades/[id]`              | PATCH  | Editar especialidad (admin)                 |
| `/api/especialidades/[id]`              | DELETE | Eliminar si no tiene veterinarios (admin)   |
| `/api/veterinarios/[id]/especialidades` | GET    | Especialidades de un veterinario            |
| `/api/veterinarios/[id]/especialidades` | POST   | Asignar especialidad a veterinario (admin)  |
| `/api/veterinarios/[id]/especialidades` | DELETE | Remover especialidad de veterinario (admin) |
| `/api/servicios-medicos`                | GET    | Catálogo de servicios con especialidad      |
| `/api/servicios-medicos`                | POST   | Crear servicio (admin)                      |
| `/api/servicios-medicos/[id]`           | PATCH  | Editar/activar/desactivar (admin)           |
| `/api/servicios-medicos/[id]`           | DELETE | Desactivar soft-delete (admin)              |

### APIs Backend — Fase 4

| Ruta                                   | Método | Descripción                                         |
| -------------------------------------- | ------ | --------------------------------------------------- |
| `/api/auditoria/historia-clinica/[id]` | GET    | Historial de cambios de una HC                      |
| `/api/historia-clinica` (POST)         | —      | **Actualizado:** registra auditoría INSERT          |
| `/api/historia-clinica/[id]` (PUT)     | —      | **Actualizado:** registra auditoría UPDATE con diff |

### Frontend

| Archivo                                            | Descripción                                                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/app/(dashboard)/atenciones-clinicas/page.tsx` | **Kanban** de atenciones por estado (4 columnas) + tabla historial del día + modal de transición |
| `src/app/(dashboard)/triaje/page.tsx`              | Lista de espera + formulario de triaje con validación de vitales + panel de triajes del día      |
| `src/app/(dashboard)/especialidades/page.tsx`      | Catálogo CRUD + asignación de especialidades a veterinarios                                      |
| `src/app/(dashboard)/servicios-medicos/page.tsx`   | Catálogo de servicios con filtro por especialidad                                                |
| `src/components/ui/auditoria-timeline.tsx`         | Timeline expandible de cambios en historia clínica                                               |

### Archivos Modificados

| Archivo                                         | Cambio                                                                                 |
| ----------------------------------------------- | -------------------------------------------------------------------------------------- |
| `src/lib/rbac.ts`                               | + módulos `atenciones-clinicas`, `triaje`, `especialidades`, `servicios-medicos`       |
| `src/components/layout/Sidebar.tsx`             | + sección "Clínica" (Atenciones, Triaje) y "Configuración" (Especialidades, Servicios) |
| `src/app/(dashboard)/historia-clinica/page.tsx` | + `AuditoriaTimeline` en modal de detalle                                              |

---

## Lógica de Negocio Implementada

### Máquina de Estados (Fase 1)

Las transiciones válidas están definidas en `TRANSICIONES_VALIDAS` en `src/types/index.ts` y se validan en el servidor antes de aplicar cada cambio. Cualquier transición inválida retorna HTTP 422.

```
reservada → confirmada | cancelada
confirmada → espera | no_asistio | cancelada
espera → triaje | cancelada
triaje → consulta | cancelada
consulta → finalizado | hospitalizado | seguimiento | cancelada
hospitalizado → finalizado | seguimiento | cancelada
seguimiento → finalizado | cancelada
finalizado → (terminal)
no_asistio → (terminal)
cancelada → (terminal)
```

### Triaje (Fase 2)

- Solo se puede crear triaje si la atención está en estado `espera` o `triaje`
- Al crear triaje exitosamente, la atención avanza automáticamente a estado `triaje`
- Rangos de referencia por especie están en tabla `esquema_triaje_mascota`
- El frontend valida visualmente los valores fuera de rango antes de enviar

### Especialidades (Fase 3)

- Migración automática: las especialidades VARCHAR de veterinarios existentes se migran a `veterinario_especialidad`
- El atributo `especialidad` en la tabla `veterinarios` se mantiene por backward compatibility
- Un veterinario puede tener N especialidades; una se marca como primaria

### Auditoría (Fase 4)

- Cada `POST /api/historia-clinica` inserta automáticamente en `auditoria_historia_clinica` (tipo INSERT)
- Cada `PUT /api/historia-clinica/[id]` captura los valores anteriores y registra el diff (tipo UPDATE)
- El campo `razon_cambio` puede incluirse en el body del PUT para documentar por qué se editó
- La auditoría es inmutable (no hay endpoint de DELETE)

---

## Permisos por Rol

| Módulo                      | Admin | Veterinario | Recepcionista | Cliente |
| --------------------------- | ----- | ----------- | ------------- | ------- |
| Atenciones clínicas         | ✅     | ✅           | ✅             | ❌       |
| Triaje                      | ✅     | ✅           | ✅             | ❌       |
| Especialidades (lectura)    | ✅     | ✅           | ✅             | ❌       |
| Especialidades (CRUD)       | ✅     | ❌           | ❌             | ❌       |
| Servicios médicos (lectura) | ✅     | ✅           | ✅             | ❌       |
| Servicios médicos (CRUD)    | ✅     | ❌           | ❌             | ❌       |
| Auditoría HC                | ✅     | ✅           | ❌             | ❌       |

---

## Próximos Pasos Sugeridos (Fases 5–8)

Con las bases de las fases 1–4 implementadas, las siguientes fases pueden construirse sobre ellas:

- **Fase 5** — Gestión de Recursos (consultorios, quirófanos): vincular recursos a `atenciones_clinicas`
- **Fase 6** — Cartilla de Vacunación completa: añadir lote, vencimiento de lote, alertas automáticas
- **Fase 7** — Seguimiento Clínico: crear tabla `seguimientos_clinicos` vinculada a `historia_clinica`
- **Fase 8** — Manejo de Excepciones: tabla `indisponibilidades` y cola de espera

---

*Generado automáticamente — 28 de mayo de 2026*
