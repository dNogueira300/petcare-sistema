# Implementación Fases 9–10 — PetCare Sistema

**Fecha:** 28 de mayo de 2026  
**Prerequisito:** Haber ejecutado `fase1a4.sql` y `fase5a8.sql` previamente

---

## ⚠️ PASOS MANUALES REQUERIDOS EN LA BASE DE DATOS

Ejecutar **`src/database/migrations/fase9a10.sql`** en el SQL Editor de Supabase.

---

## ⚠️ CONFIGURACIÓN REQUERIDA EN SUPABASE STORAGE

El bucket **`petcare-historias`** debe existir con las siguientes configuraciones:

- **File size limit:** 50 MB
- **Allowed MIME types:** `image/jpeg`, `image/png`, `application/pdf`, `image/gif`, `image/*`
- **Acceso:** El bucket puede ser público (URL pública) o privado (URLs firmadas — ya implementado en el código)

Si el bucket no existe, crearlo en el Dashboard de Supabase → Storage → New Bucket:

- Name: `petcare-historias`
- Public bucket: opcional (el código usa URLs firmadas de 1h para descarga segura)

---

## Resumen de cambios en BD

### Fase 9 — Archivos

```sql
CREATE TABLE archivos_historia_clinica (
  id_archivo SERIAL PK,
  id_historia INT FK → historia_clinica,
  id_mascota  INT FK → mascotas,
  tipo_archivo VARCHAR(20)  -- radiografia|ecografia|fotografia|laboratorio|receta|otro
  nombre_original VARCHAR(255),
  path_storage    VARCHAR(500),   -- ruta en bucket petcare-historias
  tamano_bytes    INT,
  mime_type       VARCHAR(100),
  url_publica     VARCHAR(1000),  -- URL pública (si bucket público)
  fecha_carga     TIMESTAMPTZ,
  subido_por      INT FK → usuarios
)
-- Índices: por id_historia, por id_mascota
```

### Fase 10 — Métricas

```sql
CREATE TABLE metricas_diarias (
  fecha DATE UNIQUE,
  total_citas_agendadas, total_citas_completadas, total_citas_canceladas,
  total_clientes_nuevos, total_mascotas_nuevas,
  vacunas_aplicadas, historias_registradas,
  seguimientos_pendientes, alertas_vacunas_activas,
  calculado_en TIMESTAMPTZ
)

-- Vista SQL (no materializada, compatible con Supabase free tier):
CREATE VIEW vista_resumen_citas AS SELECT ... GROUP BY mes
CREATE VIEW vista_mascotas_por_especie AS SELECT especie, COUNT(*), ... GROUP BY especie
```

---

## Archivos Creados / Modificados

### Base de Datos

| Archivo                                | Descripción                               |
| -------------------------------------- | ----------------------------------------- |
| `src/database/migrations/fase9a10.sql` | Migración completa — ejecutar en Supabase |

### Tipos TypeScript

| Archivo              | Tipos agregados                                          |
| -------------------- | -------------------------------------------------------- |
| `src/types/index.ts` | `ArchivoHistoriaClinica`, `TipoArchivo`, `MetricaDiaria` |

### APIs Backend — Fase 9 (Archivos)

| Ruta                                  | Método | Descripción                                                                                                      |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `/api/archivos/upload`                | POST   | Subir archivo (multipart/form-data). Valida MIME, tamaño 50MB, sube a bucket `petcare-historias`, registra en BD |
| `/api/archivos/[id]`                  | DELETE | Elimina del storage Y del registro en BD. Solo quien subió o admin                                               |
| `/api/historia-clinica/[id]/archivos` | GET    | Listar archivos de una HC con URLs firmadas de 1h                                                                |

**Parámetros del endpoint upload:**

```
FormData:
  file          — File (required)
  id_historia   — string/number (required)
  id_mascota    — string/number (required)
  tipo_archivo  — "radiografia"|"ecografia"|"fotografia"|"laboratorio"|"receta"|"otro"
```

**Validaciones implementadas:**

- MIME type permitido (imágenes + PDF)
- Tamaño máximo 50 MB
- Si falla el registro en BD, se revierte el archivo del storage
- Solo veterinario y admin pueden subir/eliminar archivos

### APIs Backend — Fase 10 (Analítica)

| Ruta                                          | Método | Descripción                                                         |
| --------------------------------------------- | ------ | ------------------------------------------------------------------- |
| `/api/analitica?periodo=mes\|trimestre\|anio` | GET    | Dashboard analítico completo (solo admin)                           |
| `/api/recordatorios`                          | —      | **Actualizado:** calcula y guarda en `metricas_diarias` diariamente |

**Datos que retorna `/api/analitica`:**

- KPIs: 11 métricas clave
- Citas por estado, veterinario, especie, día de semana
- Evolución semanal (últimas 4 semanas)
- Mascotas por especie (histórico)
- Seguimientos por estado
- Triajes por urgencia

### Frontend — Fase 9

| Archivo                                         | Descripción                                                                                                                         |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/ui/archivos-clinicos.tsx`       | Panel expandible con galería, drag-and-drop upload, lightbox para imágenes, descarga de PDF. Se expande al hacer clic en "Archivos" |
| `src/app/(dashboard)/historia-clinica/page.tsx` | **Actualizado:** integra `ArchivosClinicosPanel` en el modal de detalle de HC                                                       |

**Características del componente `ArchivosClinicosPanel`:**

- Selector de tipo de archivo antes de subir
- Zona drag-and-drop con feedback visual
- Thumbnails para imágenes, iconos para PDF
- Lightbox para ver imágenes a pantalla completa
- Botón de descarga para todos los tipos
- Eliminación con confirmación
- Prop `readOnly` para recepcionistas

### Frontend — Fase 10

| Archivo                                  | Descripción                                                                 |
| ---------------------------------------- | --------------------------------------------------------------------------- |
| `src/app/(dashboard)/analitica/page.tsx` | Dashboard analítico completo con 11 KPI cards + 8 gráficos via **Chart.js** |

#### Dependencias agregadas

```bash
npm install chart.js react-chartjs-2
```

Versiones instaladas (al 28/05/2026):

- `chart.js` — librería de gráficos canvas
- `react-chartjs-2` — wrapper React para Chart.js

Registro de componentes en el módulo (necesario para tree-shaking):

```typescript
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Pie, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);
```

#### Gráficos implementados con Chart.js

| #   | Componente            | Tipo de gráfico             | Dataset                                                          |
| --- | --------------------- | --------------------------- | ---------------------------------------------------------------- |
| 1   | `<Pie>`               | Pie chart                   | Citas por estado (atendida / confirmada / pendiente / cancelada) |
| 2   | `<Doughnut>`          | Donut chart                 | Triajes por urgencia (normal / urgente / emergencia)             |
| 3   | `<Bar>`               | Barras verticales agrupadas | Evolución semanal — total, atendidas, canceladas (4 semanas)     |
| 4   | `<Bar>`               | Barras verticales apiladas  | Citas por veterinario top 6 (atendidas + canceladas)             |
| 5   | `<Bar indexAxis="y">` | Barras horizontales         | Citas por especie                                                |
| 6   | `<Bar indexAxis="y">` | Barras horizontales         | Citas por día de semana                                          |
| 7   | `<Bar indexAxis="y">` | Barras horizontales         | Seguimientos clínicos por estado                                 |
| 8   | `<Bar indexAxis="y">` | Barras horizontales         | Mascotas registradas por especie                                 |

**Nota de tipado:** Chart.js requiere `weight` como número (`700`), no como string (`"700"`). El `titleFont` en las opciones de tooltip debe usar `weight: 700`.

**Funcionalidades adicionales:**

- Selector de período: Último mes / Trimestre / Año (refetch automático)
- Exportar CSV (descarga directamente en el navegador con BOM UTF-8)
- Skeleton loading con animación shimmer
- Stagger animation en KPI cards al cargar (`animationDelay`)
- Opciones compartidas (`tooltipCfg`, `hBarOpts`, `vBarOpts`, `arcOpts`) para consistencia visual

### Archivos Modificados

| Archivo                                    | Cambio                                                                            |
| ------------------------------------------ | --------------------------------------------------------------------------------- |
| `src/lib/rbac.ts`                          | + módulo `analitica` (solo admin)                                                 |
| `src/components/layout/Sidebar.tsx`        | Reportes ahora es grupo con hijos: Reportes + Analítica                           |
| `src/app/api/recordatorios/route.ts`       | + cálculo diario de `metricas_diarias`                                            |
| `src/app/api/analitica/route.ts`           | Corrección: eliminada query `clientes` sin usar; eliminado `horaMap` sin usar     |
| `src/app/api/archivos/upload/route.ts`     | Corrección: eliminada variable `ext` sin usar                                     |
| `src/app/api/especialidades/[id]/route.ts` | Corrección: `flatten()` deprecado → `issues.map(i => i.message).join(", ")`       |
| `src/components/ui/archivos-clinicos.tsx`  | Corrección: patrón `refetchKey`+`fetched` para evitar setState síncrono en efecto |
| `package.json`                             | + `chart.js`, `react-chartjs-2`                                                   |

---

## Flujo de uso — Archivos en HC

1. Admin/Veterinario abre el detalle de una Historia Clínica
2. Hace clic en el botón **"Archivos"** → se expande el panel
3. Selecciona el tipo (Radiografía, Laboratorio, etc.)
4. Arrastra el archivo o usa el botón "Subir archivo"
5. El archivo se sube a Supabase Storage `petcare-historias`
6. El registro se guarda en `archivos_historia_clinica`
7. La galería muestra thumbnails (imágenes) o iconos (PDF)
8. Al hacer clic en imagen → se abre en lightbox
9. Botón descarga → abre URL firmada (válida 1h)

---

## Flujo de uso — Analítica

1. Admin accede a `/analitica` desde el sidebar (Reportes → Analítica)
2. Selecciona período: "Último mes", "Trimestre" o "Año"
3. Ve 11 KPI cards con métricas clave
4. Explora 8 gráficos interactivos
5. Hace clic en "Exportar CSV" para descargar los datos

---

## Permisos por Rol

| Funcionalidad       | Admin | Veterinario  | Recepcionista | Cliente |
| ------------------- | ----- | ------------ | ------------- | ------- |
| Subir archivos a HC | ✅    | ✅           | ❌ (readOnly) | ❌      |
| Ver archivos de HC  | ✅    | ✅           | ✅            | ❌      |
| Eliminar archivos   | ✅    | ✅ (propios) | ❌            | ❌      |
| Dashboard analítico | ✅    | ❌           | ❌            | ❌      |
| Exportar CSV        | ✅    | ❌           | ❌            | ❌      |

---

## Próximos Pasos Sugeridos (Fase 11+)

- **Fase 11** — Pagos Online: tabla `pagos` + integración Stripe/Mercado Pago + recibos PDF
- **Fase 12** — WhatsApp Business API: recordatorios por WhatsApp via Twilio
- **Fase 13** — App Móvil (React Native)

---

_Generado automáticamente — 28 de mayo de 2026_
