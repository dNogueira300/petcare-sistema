# Implementación — Portal del Cliente (Nuevas Funcionalidades)

**Fecha:** 28 de mayo de 2026  
**Basado en:** Fases 1-10 ya implementadas

---

## Resumen Ejecutivo

Se extendió el portal del cliente con 7 nuevas funcionalidades derivadas de las fases 1-10. No se rompió ninguna funcionalidad existente.

---

## Nuevas Funcionalidades Implementadas

### 1. Banner de Alertas Inteligente

Aparece automáticamente en la parte superior del portal cuando hay:

- **Atención en curso**: muestra el estado actual (`En sala`, `En triaje`, `En consulta`) de una mascota que está siendo atendida en tiempo real.
- **Alertas de vacunación**: vacunas próximas a vencer o vencidas, con link directo a la cartilla.
- **Controles médicos pendientes**: seguimientos solicitados por el veterinario, con acceso directo a la tab "Seguimientos".
- El cliente puede cerrar el banner temporalmente.

### 2. Tab "Seguimientos" con Contador en Tiempo Real

Nueva pestaña en el portal con badge rojo indicando cuántos controles médicos tiene pendientes. Muestra:

- Mascota, motivo del seguimiento y fecha de control sugerida
- Veterinario que lo solicitó
- Indicador rojo si la fecha ya venció
- Botón **"Agendar control"** que abre el modal de cita pre-rellenado con el motivo y la mascota correcta

### 3. Estado en Tiempo Real por Mascota

Cada tarjeta de mascota en "Mis mascotas" muestra automáticamente si tiene una atención clínica activa:

- Badge de color con el estado: `En sala de espera` (ámbar), `En triaje` (morado), `En consulta` (azul), `Hospitalizado` (naranja)
- Borde del card con el color correspondiente al estado

### 4. Archivos Médicos (Solo Lectura)

- En la tab "Historial clínico" (portal/page.tsx): link a página completa de HC con archivos
- En la página `/portal/mascotas/[id]/historia-clinica`: integrado `ArchivosClinicosPanel` con `readOnly=true`
- El cliente puede **ver** thumbnails de imágenes y **descargar** radiografías, resultados de laboratorio, recetas (PDF e imágenes)
- **No puede** subir ni eliminar archivos (solo los veterinarios y admin pueden hacerlo)

### 5. Catálogo de Servicios al Agendar Cita

El modal "Agendar cita" ahora incluye:

- Selector de **servicio médico** (opcional) con precio referencial y duración estimada
- Los veterinarios muestran su **especialidad** en el selector
- Si se selecciona un servicio, el cliente puede elegir al veterinario más apropiado
- El `id_servicio` se envía junto a la cita al confirmar

### 6. Lista de Espera (Cola de Espera)

- En "Mis citas": botón `¿No encuentras horario? Unirme a lista de espera` visible siempre
- Si no hay citas registradas, el botón aparece como CTA principal
- Modal dedicado con: selector de mascota, motivo (mínimo 5 caracteres), fecha preferida (opcional)
- El sistema valida que la mascota no esté ya en la cola activa
- El cliente ve un banner si tiene mascotas en lista de espera activa
- Al registrarse, recepción ve la solicitud en `/cola-espera` del dashboard

### 7. Especialidad del Veterinario Visible

En el selector de veterinario al agendar cita, cada opción muestra `Nombre Apellido — Especialidad`, ayudando al cliente a elegir el más adecuado para su consulta.

---

## Archivos Modificados / Creados

### APIs

| Archivo                                               | Tipo       | Descripción                                                                                               |
| ----------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `src/app/api/historia-clinica/[id]/archivos/route.ts` | Modificado | + acceso de cliente con verificación de propiedad de mascota                                              |
| `src/app/api/seguimientos-clinicos/route.ts`          | Modificado | + filtro por mascotas del cliente cuando `rol === "cliente"`                                              |
| `src/app/api/portal/cola-espera/route.ts`             | **Nuevo**  | POST: inscribirse a lista de espera (auto-obtiene `id_cliente` de sesión). GET: ver colas activas propias |

### Frontend

| Archivo                                                  | Tipo                        | Descripción                                                    |
| -------------------------------------------------------- | --------------------------- | -------------------------------------------------------------- |
| `src/app/portal/page.tsx`                                | Refactorizado (~400 líneas) | Componente principal limpio; importa todos los sub-componentes |
| `src/app/portal/_types.ts`                               | **Nuevo**                   | Tipos, constantes, helpers y factories de estilos compartidos  |
| `src/app/portal/_components/MascotaCard.tsx`             | **Nuevo**                   | Tarjeta de mascota con badge de atención activa                |
| `src/app/portal/_components/AlertBanner.tsx`             | **Nuevo**                   | Banner de alertas (vacunas, seguimientos, atención en curso)   |
| `src/app/portal/_components/SeguimientosTab.tsx`         | **Nuevo**                   | Tab de controles médicos pendientes                            |
| `src/app/portal/_components/ColaEsperaModal.tsx`         | **Nuevo**                   | Modal para unirse a lista de espera                            |
| `src/app/portal/_components/RegisterMascotaModal.tsx`    | **Nuevo**                   | Modal registrar mascota                                        |
| `src/app/portal/_components/EditMascotaModal.tsx`        | **Nuevo**                   | Modal editar mascota                                           |
| `src/app/portal/_components/ProfileModal.tsx`            | **Nuevo**                   | Modal perfil + cambiar contraseña                              |
| `src/app/portal/_components/RescheduleCitaModal.tsx`     | **Nuevo**                   | Modal reprogramar cita                                         |
| `src/app/portal/_components/BookingModal.tsx`            | **Nuevo**                   | Modal agendar cita (con servicios + especialidades de vet)     |
| `src/app/portal/mascotas/[id]/historia-clinica/page.tsx` | Modificado                  | + `ArchivosClinicosPanel readOnly` en cada entrada de HC       |

---

## Flujos de Usuario

### Flujo 1: Cliente ve atención en tiempo real

1. Su mascota llega a la clínica y la recepción la registra en el sistema (Kanban de atenciones)
2. El cliente abre su portal
3. Ve el banner: _"Atención en curso: Max - En triaje"_
4. En la tarjeta de Max aparece el badge morado _"En triaje"_

### Flujo 2: Cliente agenda un control de seguimiento

1. El veterinario registra en HC: _"Control en 7 días"_
2. El portal del cliente muestra badge rojo `1` en tab "Seguimientos"
3. Cliente hace clic → ve el control pendiente con fecha y motivo
4. Hace clic en _"Agendar control"_ → abre modal pre-rellenado con el motivo
5. Selecciona fecha, veterinario, hora y confirma

### Flujo 3: Cliente ve sus archivos médicos

1. Cliente va a "Historial clínico"
2. Hace clic en "Ver historial completo y archivos adjuntos"
3. En la página de HC, cada entrada muestra el botón "Archivos"
4. Al hacer clic, se expanden los archivos de esa consulta
5. Puede ver imágenes en lightbox o descargar PDFs

### Flujo 4: Cliente se inscribe a lista de espera

1. No hay horarios disponibles que le convengan
2. Hace clic en _"¿No encuentras horario? Unirme a lista de espera"_
3. Selecciona mascota, describe el motivo, elige fecha preferida opcional
4. Sistema valida que no esté ya en cola activa
5. Recibe confirmación, ve el banner de _"X mascotas en lista de espera"_
6. Recepción ve la solicitud en su panel `/cola-espera`

---

## Permisos en el Portal

| Acción                                | Cliente                           |
| ------------------------------------- | --------------------------------- |
| Ver estado de atención en tiempo real | ✅ (solo sus mascotas)            |
| Ver alertas de vacunación             | ✅ (solo sus mascotas)            |
| Ver seguimientos pendientes           | ✅ (solo sus mascotas)            |
| Agendar control de seguimiento        | ✅                                |
| Ver archivos médicos (HC)             | ✅ (solo sus mascotas, read-only) |
| Subir archivos                        | ❌ (solo veterinarios/admin)      |
| Eliminar archivos                     | ❌                                |
| Ver catálogo de servicios             | ✅                                |
| Seleccionar servicio al agendar       | ✅                                |
| Inscribirse a lista de espera         | ✅                                |
| Ver su posición en lista              | ✅                                |
| Cancelar su posición en lista         | ❌ (debe contactar a recepción)   |

---

## Notas Técnicas

- **`ArchivosClinicosPanel` con `readOnly=true`**: el prop `readOnly` ya existía en el componente de las fases 9-10. Solo se pasó desde el portal; el servidor valida la propiedad de la mascota antes de devolver URLs firmadas.
- **Estado de atención en tiempo real**: se carga vía `/api/atenciones-clinicas` que ya filtraba por mascotas del cliente. No requirió cambios en el backend.
- **Seguimientos**: se agregó el branch `else if (session.rol === "cliente")` en la ruta GET para filtrar por mascotas propias.
- **Cola de espera**: nueva ruta `/api/portal/cola-espera` que auto-resuelve `id_cliente` desde la sesión, evitando que el cliente deba conocer su propio ID.
- **BookingModal actualizado**: carga `servicios_medicos` en paralelo con `veterinarios`. El `id_servicio` se envía en el body del POST a `/api/citas` (columna ya existe desde Fase 3).

---

## Refactorización del Portal (segunda iteración)

### Problema

El archivo `portal/page.tsx` había crecido a ~4900 líneas tras el reformateo del linter, con dos bugs activos:

1. `LogOut` (ícono de lucide-react) eliminado por el linter del import → error de compilación.
2. `useEffect(() => { loadTab(tab); }, [tab, loadTab])` donde `loadTab` llamaba `setLoadingTab(true)` síncronamente → violación de la regla del React Compiler.

### Solución aplicada

**Bug 1 — `LogOut`:** restaurado en el import de `lucide-react` en `page.tsx`.

**Bug 2 — `useEffect` con setState síncrono:**

- Se removió `setLoadingTab(true)` del cuerpo de `loadTab`
- `loadingTab` arranca en `true` vía `useState(true)` (carga inicial cubierta)
- Solo `setLoadingTab(false)` se llama en el bloque `finally {}` (callback async — válido)
- `handleTabChange` (handler de evento del usuario) llama `setLoadingTab(true)` antes de cambiar tab — válido en handlers de evento

**Refactorización de mantenibilidad:**
El archivo se dividió en 10 módulos siguiendo la convención Next.js `_carpeta/` (excluida del routing):

```
src/app/portal/
├── page.tsx                            ← ~400 líneas (vs. ~4900 antes)
├── _types.ts                           ← tipos, constantes, helpers, style factories
└── _components/
    ├── MascotaCard.tsx
    ├── AlertBanner.tsx
    ├── SeguimientosTab.tsx
    ├── ColaEsperaModal.tsx
    ├── RegisterMascotaModal.tsx
    ├── EditMascotaModal.tsx
    ├── ProfileModal.tsx
    ├── RescheduleCitaModal.tsx
    └── BookingModal.tsx
```

**Cada archivo tiene una responsabilidad única** y sus propios imports, sin estado compartido entre componentes (comunicación solo por props). TypeScript compila sin errores.

---

_Generado automáticamente — 28 de mayo de 2026_
