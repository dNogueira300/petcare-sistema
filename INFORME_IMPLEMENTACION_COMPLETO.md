# Informe de Implementación — PetCare Sistema
## Evolución de Microempresa a Plataforma Clínica Escalable

**Proyecto:** PetCare — Sistema de Gestión Veterinaria  
**Institución:** UNAP · ASI 2026-I  
**Período:** Mayo 2026  
**Estado general:** Fases 1–10 implementadas + Portal del Cliente extendido  

---

## Tabla de Contenidos

1. [Prerrequisitos y acciones manuales](#1-prerrequisitos-y-acciones-manuales)
2. [Fase 1 — Atención Clínica y Máquina de Estados](#2-fase-1--atención-clínica-y-máquina-de-estados)
3. [Fase 2 — Módulo de Triaje](#3-fase-2--módulo-de-triaje)
4. [Fase 3 — Especialidades y Servicios Médicos](#4-fase-3--especialidades-y-servicios-médicos)
5. [Fase 4 — Auditoría Clínica](#5-fase-4--auditoría-clínica)
6. [Fase 5 — Gestión de Recursos](#6-fase-5--gestión-de-recursos)
7. [Fase 6 — Cartilla de Vacunación Completa](#7-fase-6--cartilla-de-vacunación-completa)
8. [Fase 7 — Seguimiento Clínico Automatizado](#8-fase-7--seguimiento-clínico-automatizado)
9. [Fase 8 — Manejo de Excepciones](#9-fase-8--manejo-de-excepciones)
10. [Fase 9 — Archivos en Historia Clínica](#10-fase-9--archivos-en-historia-clínica)
11. [Fase 10 — Analítica Operacional](#11-fase-10--analítica-operacional)
12. [Portal del Cliente — Extensiones](#12-portal-del-cliente--extensiones)
13. [Correcciones y Mejoras Transversales](#13-correcciones-y-mejoras-transversales)
14. [Pendiente](#14-pendiente)
15. [Arquitectura General](#15-arquitectura-general)

---

## 1. Prerrequisitos y Acciones Manuales

> **IMPORTANTE:** Las siguientes acciones deben ejecutarse manualmente en Supabase antes de usar el sistema.

### Migraciones SQL (en orden)

| Archivo | Descripción | Estado |
|---------|-------------|--------|
| `src/database/migrations/fase1a4.sql` | Tablas: atenciones_clinicas, transiciones_estado, triaje, especialidades, veterinario_especialidad, servicios_medicos, auditoria_historia_clinica | ⚠️ Pendiente de ejecución |
| `src/database/migrations/fase5a8.sql` | Tablas: recursos, recurso_disponibilidad, cita_recursos, alertas_vacunacion, seguimientos_clinicos, indisponibilidades, colas_espera, excepciones_citas | ⚠️ Pendiente de ejecución |
| `src/database/migrations/fase9a10.sql` | Tablas: archivos_historia_clinica, metricas_diarias. Vistas SQL. | ⚠️ Pendiente de ejecución |
| `src/database/migrations/patch_seguimientos_nullable.sql` | Hace nullable `id_historia_clinica` en seguimientos_clinicos | ⚠️ Ejecutar después de fase5a8.sql |

### Configuración de Supabase Storage

Crear bucket manualmente en el Dashboard de Supabase:
- **Nombre:** `petcare-historias`
- **File size limit:** 50 MB
- **Allowed MIME types:** `image/jpeg`, `image/png`, `application/pdf`, `image/gif`, `image/*`

### Endpoint de Sincronización (una sola vez)

Para citas ya confirmadas antes de la implementación de la Fase 1:
```bash
curl -X POST http://localhost:3000/api/atenciones-clinicas/sincronizar \
  -H "Cookie: {sesión de admin}"
```

---

## 2. Fase 1 — Atención Clínica y Máquina de Estados

### Objetivo
Separar el concepto de **cita** (reserva) del de **atención clínica** (proceso médico), implementando una máquina de estados con 10 estados posibles.

### Máquina de estados

```
reservada → confirmada → espera → triaje → consulta → finalizado
                                                     → hospitalizado → finalizado
                                                     → seguimiento
confirmada → no_asistio
cualquier estado → cancelada (excepto terminales)
```

### Tablas creadas
- `atenciones_clinicas` — estado actual, prioridad, motivo, timestamps
- `transiciones_estado` — auditoría de cada cambio con usuario y razón

### APIs implementadas
| Ruta | Descripción |
|------|-------------|
| `GET /api/atenciones-clinicas` | Listado con filtros (estado, mascota, vet) |
| `POST /api/atenciones-clinicas` | Crear atención (manual o desde cita) |
| `PATCH /api/atenciones-clinicas/[id]/transicion` | Cambiar estado con validación |
| `GET /api/atenciones-clinicas/[id]/transicion` | Historial de transiciones |
| `POST /api/atenciones-clinicas/sincronizar` | Migrar citas existentes (admin, una vez) |

### Frontend
- **Kanban** en `/atenciones-clinicas` con 3 columnas: Pendientes / En Sala / Consulta
- Tabla de historial del día (estados terminales)
- Modal de transición con razón opcional
- Transición a **"seguimiento"**: pide motivo y fecha de control — crea automáticamente un registro en `seguimientos_clinicos`
- Transición a **"hospitalizado"**: motivo obligatorio
- Filtros por prioridad (urgente/normal)
- Estadísticas en tiempo real (pills de conteo)

### Automatización
Al confirmar una cita (`PATCH /api/citas/[id]`), se crea automáticamente la atención clínica con estado `confirmada`. Al cancelar, la atención se sincroniza también a `cancelada`.

---

## 3. Fase 2 — Módulo de Triaje

### Objetivo
Registrar la evaluación preliminar del paciente antes de pasar al veterinario.

### Tablas creadas
- `triaje` — signos vitales, urgencia, síntomas, observaciones
- `esquema_triaje_mascota` — rangos normales por especie (perro, gato, conejo, ave, reptil)

### APIs implementadas
| Ruta | Descripción |
|------|-------------|
| `GET /api/triaje` | Listar triajes (filtros: id_atencion, id_mascota) |
| `POST /api/triaje` | Registrar triaje + avanza atención a "triaje" |
| `GET/PATCH /api/triaje/[id]` | Detalle y actualización |

### Frontend
- Página `/triaje` con:
  - Lista de atenciones en estado `espera` o `triaje` **que no tienen triaje registrado aún**
  - Modal de registro con campos: peso, temperatura, FC, FR, urgencia, síntomas
  - **Validación visual en tiempo real** — alerta roja si signo vital fuera de rango por especie
  - Si urgencia = `urgente` o `emergencia`: razón obligatoria
  - Panel de triajes del día con signos vitales (rojos = fuera de rango)

### Lógica
Al registrar el triaje, la atención avanza automáticamente de `espera` a `triaje`.

---

## 4. Fase 3 — Especialidades y Servicios Médicos

### Objetivo
Desacoplar `veterinarios.especialidad` (VARCHAR) hacia una relación N:M con catálogo propio, y crear un catálogo de servicios médicos con vinculación a especialidades y recursos.

### Tablas creadas
- `especialidades` — catálogo con 10 especialidades base
- `veterinario_especialidad` — relación N:M vet ↔ especialidades
- `servicios_medicos` — catálogo con 10 servicios base, precio, duración

### APIs implementadas
| Ruta | Descripción |
|------|-------------|
| `GET/POST /api/especialidades` | Catálogo |
| `PATCH/DELETE /api/especialidades/[id]` | Editar / eliminar (admin) |
| `GET/POST/DELETE /api/veterinarios/[id]/especialidades` | Gestión N:M |
| `GET/POST /api/servicios-medicos` | Catálogo con join recurso y especialidad |
| `PATCH /api/servicios-medicos/[id]` | Editar (incluye id_recurso_requerido) |

### Frontend
- `/especialidades`: dos columnas — catálogo izquierda, veterinarios derecha
  - Cards de vets muestran especialidades del N:M (no el VARCHAR legacy)
  - Modal de asignación: botones Asignar/Remover por especialidad
  - Modal de eliminación con confirmación personalizada (no `confirm()` nativo)
- `/servicios-medicos`: grid con filtro por especialidad
  - Badge morado indicando el recurso requerido por cada servicio
  - Modal de edición incluye selector de recurso requerido

---

## 5. Fase 4 — Auditoría Clínica

### Objetivo
Registrar cada modificación a historias clínicas (quién, cuándo, qué cambió).

### Tablas creadas
- `auditoria_historia_clinica` — diff campo a campo en cada INSERT/UPDATE
- `auditoria` — tabla general (extensible a otras entidades)

### APIs implementadas
| Ruta | Descripción |
|------|-------------|
| `GET /api/auditoria/historia-clinica/[id]` | Historial de cambios de una HC |

### Frontend
- Componente `AuditoriaTimeline` — botón azul expandible en el modal de detalle de HC
- Timeline con dot colorido, badge INSERT/UPDATE, diff visual (tachado rojo → verde nuevo)
- Se muestra junto al botón "Archivos" (verde), lado a lado

### Automatización
- Al crear HC (`POST /api/historia-clinica`): inserta en auditoría tipo `INSERT`
- Al editar HC (`PUT /api/historia-clinica/[id]`): inserta en auditoría tipo `UPDATE` con diff y razón del cambio

---

## 6. Fase 5 — Gestión de Recursos

### Objetivo
Administrar recursos físicos de la clínica (consultorios, quirófanos, equipos) y vincularlos a servicios médicos.

### Tablas creadas
- `recursos` — tipo, capacidad, ubicación, estado activo/inactivo
- `recurso_disponibilidad` — horarios por recurso y día (concepto eliminado de UI — innecesario)
- `cita_recursos` — N:M cita ↔ recurso

### Datos iniciales
6 recursos precargados: Consultorio 1, Consultorio 2, Quirófano Principal, Sala de Recuperación, Equipo Rayos X, Ecógrafo.

### APIs implementadas
| Ruta | Descripción |
|------|-------------|
| `GET/POST /api/recursos` | Listado y creación |
| `GET/PATCH /api/recursos/[id]` | Detalle y edición |

### Frontend
- `/recursos`: grid de 2 columnas con cards por recurso
  - Badge de tipo (color diferenciado: azul/morado/azul/naranja)
  - Toggle de activar/desactivar (tamaño `size-6`)
  - Sección **"Servicios que lo requieren"** en cada card (chips verdes)
  - Modal sin sección de disponibilidad horaria (concepto eliminado)
  - Nota orientando a vincular recursos desde Servicios Médicos

---

## 7. Fase 6 — Cartilla de Vacunación Completa

### Objetivo
Agregar control de lotes, vencimiento, alertas automáticas y multidosis al módulo de vacunación existente.

### Cambios en BD
Columnas nuevas en `cartilla_vacunacion`:
- `fecha_vencimiento_lote` — validación de lote vencido
- `dosis_numero`, `va_completado`, `tipo_vacuna_categoria`

### Tabla nueva
- `alertas_vacunacion` — alerta automática cuando hay próxima dosis programada

### APIs actualizadas
- `POST /api/vacunas`: valida lote vencido, crea alerta automática (7 días antes de próxima dosis)
- `GET/PATCH /api/alertas-vacunacion`: gestión de alertas

### Frontend
- `VacunaForm.tsx`: nuevo campo **"Vencimiento del lote"** con validación visual en tiempo real
  - Rojo + advertencia si la fecha es pasada
  - Verde + "Lote vigente" si es futura
- La API bloquea el registro si el lote está vencido (HTTP 400)

### Automatización (cron diario)
- `POST /api/recordatorios`: procesa alertas con `fecha_alerta = hoy` y las marca como `enviada`

---

## 8. Fase 7 — Seguimiento Clínico Automatizado

### Objetivo
Registrar controles post-consulta, enviar recordatorios automáticos y mostrar seguimientos al cliente en el portal.

### Cambios en BD
- `seguimientos_clinicos` (tabla nueva) — motivo, fecha control, estado, días de anticipación
- `historia_clinica.estado_seguimiento` (columna nueva) — sin_seguimiento / pendiente_seguimiento / seguimiento_completado

### APIs implementadas
| Ruta | Descripción |
|------|-------------|
| `GET/POST /api/seguimientos-clinicos` | Listado (filtros: pendientes, estado, mascota, vet) + crear |
| `GET/PATCH /api/seguimientos-clinicos/[id]` | Detalle y cambio de estado |

### Frontend
- `/seguimientos-clinicos`: tabla con filtros (Pendientes, Con cita, Completados, No presentados, Cancelados)
  - Alerta roja si la fecha de control ya venció
  - Modal de gestión: botones Cita agendada / Completado / No se presentó
  - **Sección extra**: atenciones en estado "seguimiento" sin registro formal (orientación al usuario)

### Automatización
- Al transicionar una atención a "seguimiento": el modal pide motivo y fecha → crea el registro automáticamente en `seguimientos_clinicos` y marca la HC como `pendiente_seguimiento`
- Cron diario: detecta seguimientos cuya fecha de aviso = hoy → avanza a `sugerencia_enviada`

---

## 9. Fase 8 — Manejo de Excepciones

### Objetivo
Gestionar escenarios críticos: veterinario indisponible, colas de espera, cancelaciones masivas.

### Tablas creadas
- `indisponibilidades` — bloqueos por veterinario con razón y rango de fechas
- `colas_espera` — lista de espera FIFO por mascota/cliente
- `excepciones_citas` — registro de citas afectadas por indisponibilidad

### APIs implementadas
| Ruta | Descripción |
|------|-------------|
| `GET/POST /api/indisponibilidades` | Registrar bloqueo (crea excepciones automáticamente) |
| `PATCH/DELETE /api/indisponibilidades/[id]` | Editar/eliminar |
| `GET/POST /api/colas-espera` | Gestión FIFO |
| `PATCH /api/colas-espera/[id]` | Cambiar estado |
| `GET/POST /api/portal/cola-espera` | Versión simplificada para clientes |

### Frontend
- `/indisponibilidades`: tabla de bloqueos + modal de registro con resultado de citas afectadas
- `/cola-espera`: tabla FIFO con filtros y gestión de estados

### Automatización
Al registrar una indisponibilidad, se buscan automáticamente todas las citas del veterinario en ese rango y se crean registros en `excepciones_citas` (tipo `veterinario_inactivo`).

---

## 10. Fase 9 — Archivos en Historia Clínica

### Objetivo
Adjuntar radiografías, resultados de laboratorio, fotos y recetas a las historias clínicas usando Supabase Storage.

### Tabla creada
- `archivos_historia_clinica` — ruta en storage, tipo, MIME, tamaño, quién subió

### Storage
- **Bucket:** `petcare-historias` (50 MB, image/* + application/pdf)
- URLs firmadas con expiración de 1 hora para descarga segura

### APIs implementadas
| Ruta | Descripción |
|------|-------------|
| `POST /api/archivos/upload` | Subir archivo (multipart/form-data, valida MIME y 50 MB) |
| `DELETE /api/archivos/[id]` | Eliminar del storage Y de la BD |
| `GET /api/historia-clinica/[id]/archivos` | Listado con URLs firmadas (acceso para cliente propio) |

### Frontend
- Componente `ArchivosClinicosPanel` — botón verde expandible en el modal de detalle HC
  - Zona drag-and-drop con selector de tipo (Radiografía, Ecografía, etc.)
  - Galería: thumbnails para imágenes, iconos tipados para PDF
  - Lightbox para imágenes a pantalla completa
  - Descarga y eliminación con confirmación
  - `readOnly=true` para recepcionistas y clientes (solo ver/descargar)

---

## 11. Fase 10 — Analítica Operacional

### Objetivo
Dashboard con KPIs empresariales, gráficos interactivos y exportación de datos.

### Tablas creadas
- `metricas_diarias` — snapshot diario (calculado por el cron)
- Vistas SQL: `vista_resumen_citas`, `vista_mascotas_por_especie`

### APIs implementadas
| Ruta | Descripción |
|------|-------------|
| `GET /api/analitica?periodo=mes\|trimestre\|anio` | 11 KPIs + 8 datasets (solo admin) |

### Frontend — `/analitica`
- **11 KPI cards** con animación stagger al cargar
- **8 gráficos con Chart.js** (`chart.js` + `react-chartjs-2`):
  1. Pie — Citas por estado
  2. Doughnut — Triajes por urgencia
  3. Bar vertical agrupado — Evolución semanal
  4. Bar vertical apilado — Por veterinario (top 6)
  5. Bar horizontal — Por especie
  6. Bar horizontal — Por día de semana
  7. Bar horizontal — Seguimientos por estado
  8. Bar horizontal — Mascotas por especie
- Selector de período (Último mes / Trimestre / Año)
- **Exportar CSV** con BOM UTF-8

### Automatización (cron diario)
El endpoint `/api/recordatorios` calcula y guarda en `metricas_diarias` las métricas del día actual.

---

## 12. Portal del Cliente — Extensiones

### Layout renovado
Layout de **dos columnas**: contenedor principal (tabs) + **sidebar de alertas** fijo a la derecha con `position: sticky`.

### Componente `AlertsSidebar`
Sidebar permanente con secciones color-coded:
- 🔵 **Atención en curso** — estado en tiempo real de la mascota (espera/triaje/consulta/hospitalizado)
- 🔴 **Alertas de vacunación** — vacunas próximas a vencer con link a la cartilla
- 🟡 **Seguimientos pendientes** — controles solicitados por el vet, botón "Agendar control"
- 🟣 **Cola de espera** — mascotas inscritas con su estado
- Botón siempre visible: "Unirse a lista de espera"

### Nuevas funcionalidades en el portal

| # | Funcionalidad | Descripción |
|---|---------------|-------------|
| 1 | **Estado en tiempo real** | Badge en cada tarjeta de mascota mostrando estado de atención clínica activa |
| 2 | **Tab "Seguimientos"** | Lista de controles médicos pendientes con botón "Agendar control" (pre-rellena el modal de cita) |
| 3 | **Archivos médicos (read-only)** | `ArchivosClinicosPanel` integrado en la página de HC del portal — solo ver/descargar |
| 4 | **Servicios al agendar** | Selector de servicio con precio y duración; vets muestran especialidad del N:M |
| 5 | **Lista de espera** | Modal `ColaEsperaModal` — valida duplicados y muestra estado en sidebar |
| 6 | **Confirmar asistencia** | Botón verde "✓ Confirmar asistencia" para citas pendientes |
| 7 | **Confirmación por email** | El recordatorio incluye botón "✅ Confirmar mi asistencia" con link `?confirmar={id_cita}` |

### Confirmación de cita — flujo completo

```
Cliente recibe email 24h antes
  ├─ Clic en "Confirmar asistencia" → portal?confirmar=N → auto-confirma
  ├─ Accede al portal → "Mis citas" → botón "✓ Confirmar asistencia"
  └─ Llega a la clínica → Recepcionista confirma desde /citas (dashboard)
```

### Refactorización del portal

El archivo `portal/page.tsx` fue refactorizado de ~4900 líneas a ~400 líneas mediante extracción a componentes:

```
src/app/portal/
├── page.tsx                    (~400 líneas)
├── _types.ts                   (tipos, constantes, helpers)
└── _components/
    ├── AlertBanner.tsx
    ├── AlertsSidebar.tsx       (nuevo)
    ├── BookingModal.tsx        (con servicios y especialidades)
    ├── ColaEsperaModal.tsx
    ├── EditMascotaModal.tsx
    ├── MascotaCard.tsx
    ├── ProfileModal.tsx
    ├── RegisterMascotaModal.tsx
    ├── RescheduleCitaModal.tsx
    └── SeguimientosTab.tsx
```

---

## 13. Correcciones y Mejoras Transversales

### Correcciones de bugs críticos

| Archivo | Bug | Corrección |
|---------|-----|------------|
| `api/atenciones-clinicas/route.ts` | FK ambigua entre `citas` ↔ `atenciones_clinicas` → HTTP 500 | Join con hint explícito `!atenciones_clinicas_id_cita_fkey` |
| `api/citas/[id]/route.ts` | Confirmar cita no creaba atención clínica | PATCH ahora crea atención automáticamente |
| `api/citas/[id]/route.ts` | `citaActual` era null si columna `id_atencion_clinica` no existía | Consulta directa a `atenciones_clinicas` por `id_cita` |
| `atenciones-clinicas/page.tsx` | Hora mostraba timestamp de creación (01:39) en vez de la hora agendada | Usa `citas?.hora` del join (hora real de la cita) |
| `triaje/page.tsx` | Solo mostraba atenciones en `espera`, no las ya en estado `triaje` | Fetch sin filtro de estado; frontend filtra ambos |
| `triaje/page.tsx` | Atención seguía en la lista después de registrar triaje | Excluye atenciones con triaje ya registrado usando un Set |
| `triaje/route.ts` | Tarjetas de triaje no mostraban nombre de mascota | Agrega join `mascotas(nombre, especie)` al select |
| `especialidades/page.tsx` | Vets mostraban "Vet #N" | `VetRow.usuario` → `VetRow.usuarios` (plural, Supabase) |
| `indisponibilidades/page.tsx` | Idem | `VetRow.usuario` → `VetRow.usuarios` |
| `auditoria-timeline.tsx` | Error React "key prop" en lista | `diffItem` (función helper) → `DiffRow` (componente React) |
| `vacunas/route.ts` + `VacunaForm.tsx` | Validación de lote vencido nunca se activaba | Agrega campo `fecha_vencimiento_lote` al formulario |
| `portal/_types.ts` `BookingModal.tsx` | Especialidades del vet mostraban vacío | `VetOption` incluye `veterinario_especialidad[]`, función `vetEspecialidadLabel()` |
| `seguimientos-clinicos/page.tsx` | Atenciones en estado "seguimiento" no aparecían | Página también consulta `atenciones-clinicas?estado=seguimiento` |
| `transicion/route.ts` | Transición a "seguimiento" no creaba registro en BD | Al hacer transición: pide motivo + fecha y crea `seguimientos_clinicos` automáticamente |
| `modal.tsx` | Botones pegados al borde inferior | `pb-0` → `pb-6` en contenedor del modal |
| `servicios-medicos/route.ts` | Zod `flatten()` deprecado | Reemplazado por `error.issues.map(i => i.message).join(", ")` |

### Correcciones de patrón `useEffect` + setState síncrono

Patrón aplicado consistentemente en todos los módulos nuevos: `loading` se inicializa en `true` vía `useState(true)` y solo se llama `setLoading(false)` en callbacks `.then()`/`.catch()` — nunca síncronamente en el efecto.

### Mejoras de UX

| Módulo | Mejora |
|--------|--------|
| Recursos | Grid 2 columnas, toggle `size-6`, sin "disponibilidad horaria" (concepto eliminado) |
| Especialidades | Modal de eliminación con `AlertTriangle` y confirmación (no `window.confirm`) |
| Servicios Médicos | Toggle `size-5`; badge morado mostrando recurso requerido |
| HC — Archivos y Auditoría | Botones lado a lado: verde (Archivos) + azul (Auditoría) |
| Atenciones — Modal transición | Hospitalización: motivo obligatorio; Seguimiento: campos extra de programación |

---

## 14. Pendiente

### ⚠️ Acciones manuales inmediatas (requieren acceso a Supabase)

1. **Ejecutar migraciones** en orden en Supabase SQL Editor:
   ```
   fase1a4.sql → fase5a8.sql → fase9a10.sql → patch_seguimientos_nullable.sql
   ```
2. **Crear bucket** `petcare-historias` en Supabase Storage (50 MB, image/* + PDF)
3. **Ejecutar sincronización** de citas existentes una sola vez:
   `POST /api/atenciones-clinicas/sincronizar` (admin autenticado)

### 🟡 Funcionalidades incompletas / no implementadas

| # | Funcionalidad | Estado | Notas |
|---|---------------|--------|-------|
| 1 | **Validación de recurso en agendamiento** | Parcial | La tabla `cita_recursos` existe pero `/api/citas` no valida disponibilidad del recurso al crear la cita |
| 2 | **Notificación real por seguimientos** | Parcial | El cron marca seguimientos como `sugerencia_enviada` en BD pero no envía email al cliente (no hay template de mailer para seguimientos) |
| 3 | **Notificación lista de espera** | Parcial | La cola de espera existe pero no hay mecanismo automático que notifique al cliente cuando hay disponibilidad |
| 4 | **Recetas digitales en HC** | Parcial | El tipo de archivo "receta" está en el catálogo pero no hay generación de PDF de receta estructurada |
| 5 | **Caché Redis para analítica** | No implementado | La analítica recalcula en cada request; para producción se recomienda Redis con TTL de 1h |
| 6 | **Exportar PDF en analítica** | No implementado | Solo se exporta CSV; PDF requeriría librería adicional (jsPDF ya está instalado) |
| 7 | **Cancelar posición en cola de espera** | No implementado | El cliente no puede cancelar su posición directamente desde el portal |
| 8 | **Esquema multidosis en vacunación** | No implementado | `dosis_numero` existe en BD pero la UI no gestiona el flujo multidosis |

### 🔵 Fases 11-14 (planificadas, no iniciadas)

| Fase | Descripción | Complejidad |
|------|-------------|-------------|
| **Fase 11** | Pagos online (Stripe / Mercado Pago) + recibos PDF | Media-Alta |
| **Fase 12** | WhatsApp Business API (Twilio) para recordatorios | Media |
| **Fase 13** | App móvil nativa (React Native) | Alta |
| **Fase 14** | IA para diagnóstico asistido y recomendaciones | Muy Alta |

---

## 15. Arquitectura General

### Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16 (App Router) · TypeScript · Tailwind CSS |
| Backend | Next.js API Routes (serverless) |
| Base de datos | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Autenticación | JWT personalizado + httpOnly cookies |
| Email | Brevo SMTP (SDK `@getbrevo/brevo`) |
| Gráficos | Chart.js + react-chartjs-2 |
| PDF | jsPDF + jsPDF-AutoTable |
| Fechas | date-fns + date-fns-tz (zona Lima/Perú) |
| Validación | Zod 4.x |

### Estructura de carpetas relevante

```
src/
├── app/
│   ├── (dashboard)/          ← Módulos del sistema (admin/vet/recepcionista)
│   │   ├── atenciones-clinicas/
│   │   ├── triaje/
│   │   ├── especialidades/
│   │   ├── servicios-medicos/
│   │   ├── recursos/
│   │   ├── seguimientos-clinicos/
│   │   ├── indisponibilidades/
│   │   ├── cola-espera/
│   │   └── analitica/
│   ├── api/                  ← Backend REST
│   │   ├── atenciones-clinicas/
│   │   ├── triaje/
│   │   ├── especialidades/
│   │   ├── servicios-medicos/
│   │   ├── recursos/
│   │   ├── seguimientos-clinicos/
│   │   ├── alertas-vacunacion/
│   │   ├── indisponibilidades/
│   │   ├── colas-espera/
│   │   ├── archivos/
│   │   ├── auditoria/
│   │   └── analitica/
│   └── portal/               ← Portal del cliente
│       ├── _types.ts
│       └── _components/      (9 componentes)
├── components/ui/
│   ├── archivos-clinicos.tsx
│   └── auditoria-timeline.tsx
├── database/migrations/
│   ├── fase1a4.sql
│   ├── fase5a8.sql
│   ├── fase9a10.sql
│   └── patch_seguimientos_nullable.sql
└── lib/
    ├── mailer.ts             (Brevo + template con confirmación)
    ├── rbac.ts               (15 módulos protegidos)
    └── vacunas.ts
```

### Permisos por módulo

| Módulo | Admin | Vet | Recepcionista | Cliente |
|--------|-------|-----|---------------|---------|
| Atenciones clínicas | ✅ | ✅ | ✅ | ❌ |
| Triaje | ✅ | ✅ | ✅ | ❌ |
| Especialidades (CRUD) | ✅ | ❌ | ❌ | ❌ |
| Servicios Médicos (CRUD) | ✅ | ❌ | ❌ | ❌ |
| Recursos | ✅ | ❌ | ❌ | ❌ |
| Seguimientos | ✅ | ✅ | ✅ | Portal |
| Indisponibilidades | ✅ | ❌ | Lectura | ❌ |
| Cola de espera | ✅ | ❌ | ✅ | Portal |
| Archivos HC (subir) | ✅ | ✅ | ❌ | ❌ |
| Archivos HC (ver) | ✅ | ✅ | ✅ | Portal (propios) |
| Analítica | ✅ | ❌ | ❌ | ❌ |
| Auditoría HC | ✅ | ✅ | ❌ | ❌ |

---

*Informe generado el 28 de mayo de 2026*  
*PetCare Sistema · UNAP ASI 2026-I*
