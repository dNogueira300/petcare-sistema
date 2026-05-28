# Guía de Testing Manual — PetCare Sistema
## Fases 1 a 10 + Portal del Cliente

**Versión:** 1.0 — 28 de mayo de 2026  
**Entorno:** Localhost (`http://localhost:3000`) o dominio de staging  
**Credenciales de prueba:** `admin@petcare.pe` / `Admin2026*`

---

## ⚠️ Prerrequisitos

Antes de iniciar cualquier prueba, verificar que:

- [ ] `src/database/migrations/fase1a4.sql` ejecutado en Supabase
- [ ] `src/database/migrations/fase5a8.sql` ejecutado en Supabase
- [ ] `src/database/migrations/fase9a10.sql` ejecutado en Supabase
- [ ] Bucket `petcare-historias` creado en Supabase Storage (50 MB, MIME: `image/*`, `application/pdf`)
- [ ] Al menos 1 veterinario, 1 cliente y 1 mascota registrados en el sistema
- [ ] Al menos 1 cita existente en estado `confirmada`

---

## FASE 1 — Atenciones Clínicas y Máquina de Estados

**Ruta:** `/atenciones-clinicas` (Sidebar → Clínica → Atenciones)  
**Roles:** Administrador, Veterinario, Recepcionista

### 1.1 Crear una atención clínica desde cita

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Ir a `/citas` y confirmar una cita pendiente | Cita pasa a estado `confirmada` |
| 2 | Ir a `/atenciones-clinicas` | Aparece un Kanban con columnas: Pendientes / En Sala / Consulta |
| 3 | Verificar que la cita confirmada genera una atención | Debe aparecer una tarjeta en la columna "Pendientes" con estado `confirmada` |

### 1.2 Transiciones de estado válidas

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | En la tarjeta de atención, hacer clic en **"A Sala"** | Modal aparece mostrando flujo `confirmada → espera` |
| 2 | Confirmar la transición (razón opcional) | Tarjeta se mueve a columna "En Sala", badge ámbar |
| 3 | Hacer clic en **"Triaje"** | Transición `espera → triaje`, tarjeta permanece en "En Sala" |
| 4 | Hacer clic en **"A Consulta"** | Transición `triaje → consulta`, tarjeta se mueve a "Consulta" |
| 5 | Hacer clic en **"Finalizar"** | Atención pasa a `finalizado`, aparece en tabla historial inferior |

### 1.3 Transición inválida (debe fallar)

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Intentar pasar directamente de `reservada` a `finalizado` vía API: `PATCH /api/atenciones-clinicas/{id}/transicion` con `{ "estado_nuevo": "finalizado" }` | Respuesta 422: _"No se puede pasar de 'reservada' a 'finalizado'"_ |

### 1.4 Historial de transiciones

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Realizar 2-3 transiciones en una atención | En el historial inferior aparece la atención finalizada |
| 2 | Llamar `GET /api/atenciones-clinicas/{id}/transicion` | Responde con array de transiciones con usuario, fecha y razón |

---

## FASE 2 — Módulo Triaje

**Ruta:** `/triaje` (Sidebar → Clínica → Triaje)  
**Roles:** Administrador, Veterinario, Recepcionista

### 2.1 Registrar triaje con datos normales

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Ir a `/triaje` | Ver tabla de atenciones en estado `espera` o `triaje` |
| 2 | Clic en **"Registrar triaje"** de una atención | Abre modal con campos de signos vitales |
| 3 | Ingresar: Peso `8.5`, Temp `38.5`, FC `80`, FR `20` | Indicadores verdes "Dentro del rango normal" para todos |
| 4 | Seleccionar urgencia: **Normal**, ingresar síntomas | Sin campo de razón de urgencia visible |
| 5 | Enviar formulario | Toast: "Triaje registrado correctamente", atención avanza a estado `triaje` |

### 2.2 Validación visual fuera de rango

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | En el modal de triaje (mascota = perro), ingresar Temp `42.0` | Alerta roja: "Fuera de rango normal (38.0–39.2 °C)" |
| 2 | Ingresar FC `200` | Alerta roja: "Fuera de rango normal (60–140 lat/min)" |
| 3 | Valores normales vuelven a verde al corregirlos | Indicador cambia a verde con check |

### 2.3 Urgencia con razón obligatoria

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Seleccionar nivel **"Emergencia"** | Aparece campo de texto para razón obligatoria |
| 2 | Intentar enviar sin razón | Toast de error: "Debe indicar la razón de urgencia" |
| 3 | Llenar la razón y enviar | Triaje guardado correctamente |

### 2.4 Panel de triajes del día

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Después de registrar triajes, ver la sección inferior | Cards con signos vitales; valores fuera de rango en rojo |

---

## FASE 3 — Especialidades y Servicios Médicos

**Ruta:** `/especialidades` · `/servicios-medicos`  
**Rol:** Administrador

### 3.1 Catálogo de especialidades

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Ir a `/especialidades` | Ver lista de especialidades preexistentes (10 por defecto) |
| 2 | Clic en **"Nueva especialidad"** | Abre modal con campos Nombre + Descripción |
| 3 | Crear especialidad `Neurología` con descripción | Aparece en la lista izquierda |
| 4 | Intentar crear otra con el mismo nombre | Error 409: "Ya existe una especialidad con ese nombre" |
| 5 | Editar la especialidad creada | Cambios reflejados inmediatamente |
| 6 | Eliminar especialidad sin veterinarios | Eliminada correctamente |
| 7 | Intentar eliminar especialidad con veterinarios asignados | Error: "Hay veterinarios con esta especialidad asignada" |

### 3.2 Asignar especialidades a veterinarios

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | En la sección derecha, hacer clic en la card de un veterinario | Abre modal con lista de especialidades |
| 2 | Clic en **"Asignar"** junto a `Medicina General` | Badge cambia a "Remover", fondo verde |
| 3 | Asignar una segunda especialidad | Veterinario tiene 2 especialidades asignadas |
| 4 | Clic en **"Remover"** | Especialidad desvinculada del veterinario |

### 3.3 Catálogo de servicios

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Ir a `/servicios-medicos` | Grid de tarjetas con servicios (10 por defecto) |
| 2 | Crear nuevo servicio: `Electrocardiograma`, especialidad `Cardiología`, precio `S/ 120`, 30 min | Aparece en grid |
| 3 | Usar filtro de especialidad | Solo muestra servicios de esa especialidad |
| 4 | Desactivar un servicio (ícono toggle) | Tarjeta aparece con opacidad reducida, badge "Inactivo" |

---

## FASE 4 — Auditoría Clínica

**Ruta:** Modal de detalle en `/historia-clinica`  
**Roles:** Administrador, Veterinario

### 4.1 Auditoría en creación de HC

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Ir a `/citas` y registrar historia clínica de una cita confirmada | HC creada, cita pasa a `atendida` |
| 2 | Ir a `/historia-clinica` y abrir la HC recién creada (ícono ojo) | Modal de detalle con botón **"Auditoría"** |
| 3 | Hacer clic en **"Auditoría"** | Se expande panel con 1 registro tipo `INSERT` |
| 4 | Verificar campos en el registro | Muestra: usuario, fecha/hora, tipo "Creación", campos nuevos (diagnóstico, tratamiento) |

### 4.2 Auditoría en edición de HC

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Editar la HC como administrador (ícono lápiz en `/historia-clinica`) | Modal de edición |
| 2 | Cambiar el diagnóstico y agregar razón: _"Corrección tipográfica"_ | HC actualizada |
| 3 | Abrir detalle y ver Auditoría | Aparece nuevo registro tipo `UPDATE` con diff: diagnóstico anterior (tachado rojo) → nuevo (verde) |
| 4 | Verificar que la razón del cambio aparece en el registro | Texto _"Corrección tipográfica"_ visible |

---

## FASE 5 — Gestión de Recursos

**Ruta:** `/recursos` (Sidebar → Configuración → Recursos)  
**Rol:** Administrador

### 5.1 Ver recursos existentes

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Ir a `/recursos` | Grid agrupado por tipo: Consultorios, Quirófanos, Equipos, Jaulas |
| 2 | Verificar que existen 6 recursos por defecto | Consultorio 1, Consultorio 2, Quirófano Principal, Sala de Recuperación, Equipo Rayos X, Ecógrafo |
| 3 | Expandir la disponibilidad de un recurso | Badges con días y horarios (Lun-Sáb 07:00-20:00) |

### 5.2 Crear y gestionar recurso

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Clic en **"Nuevo recurso"** | Abre modal con campos nombre, tipo, capacidad, ubicación |
| 2 | Crear `Consultorio 3`, tipo `consultorio`, capacidad `1`, ubicación `Piso 2` | Aparece en la sección Consultorios |
| 3 | Editar el recurso: cambiar ubicación | Cambio reflejado en la tarjeta |
| 4 | Desactivar el recurso | Tarjeta con opacidad reducida |

### 5.3 Verificar recurso vinculado a servicio

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Ir a `/servicios-medicos` | El servicio `Cirugía de Esterilización` debe mostrar el recurso vinculado |
| 2 | Llamar `GET /api/servicios-medicos` | Respuesta incluye `id_recurso_requerido` para servicios de cirugía |

---

## FASE 6 — Cartilla de Vacunación Completa

**Ruta:** `/mascotas/{id}/cartilla` · `/vacunas`  
**Roles:** Administrador, Veterinario, Recepcionista

### 6.1 Validación de lote vencido

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Registrar vacuna en una mascota con `fecha_vencimiento_lote` = ayer (fecha pasada) | Error 400: "El lote de la vacuna está vencido" |
| 2 | Registrar con `fecha_vencimiento_lote` = mañana (fecha futura) | Vacuna registrada correctamente |

### 6.2 Creación automática de alerta

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Registrar vacuna con `frecuencia = "anual"` y `fecha_aplicacion = hoy` | Vacuna creada con `fecha_proxima_dosis` = hoy + 365 días |
| 2 | Llamar `GET /api/alertas-vacunacion?id_mascota={id}` | Responde con 1 alerta `tipo_alerta: "proximo_refuerzo"`, `estado: "activa"`, `fecha_alerta` = próxima dosis - 7 días |
| 3 | Verificar en el portal del cliente: `/portal` | Banner ámbar de alertas de vacunación aparece (si la alerta ya es vigente) |

### 6.3 Marcar alerta como completada

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Llamar `PATCH /api/alertas-vacunacion/{id}` con `{ "estado": "completada" }` | Alerta actualizada, ya no aparece en filtro `estado=activa` |

---

## FASE 7 — Seguimiento Clínico Automatizado

**Ruta:** `/seguimientos-clinicos` (Sidebar → Operaciones → Seguimientos)  
**Roles:** Administrador, Veterinario, Recepcionista

### 7.1 Crear seguimiento desde historia clínica

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Llamar `POST /api/seguimientos-clinicos` con: `id_historia_clinica`, `id_mascota`, `id_veterinario`, `motivo_seguimiento: "Control de herida"`, `fecha_sugerida_control` = hoy + 7 días | Seguimiento creado con `estado: "pendiente"` |
| 2 | Verificar en `GET /api/historia-clinica` el campo `estado_seguimiento` de esa HC | Debe ser `"pendiente_seguimiento"` |

### 7.2 Panel de seguimientos

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Ir a `/seguimientos-clinicos` | Tab activo "Pendientes", muestra el seguimiento recién creado |
| 2 | Verificar que la fecha es futura y no aparece como vencida | Texto normal (no rojo) |
| 3 | Cambiar filtro a "Con cita" | Lista vacía (aún no se agendó) |
| 4 | Clic en **"Gestionar"** del seguimiento | Modal con datos del seguimiento y botones de acción |
| 5 | Clic en **"Cita agendada"** | Estado cambia a `cita_agendada` |
| 6 | Clic en **"Marcar completado"** | Estado cambia a `completado`, HC pasa a `seguimiento_completado` |

### 7.3 Seguimiento vencido

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Crear seguimiento con `fecha_sugerida_control` = ayer | Badge `VENCIDO` en rojo en la lista |
| 2 | Alerta roja en la parte superior de la página | _"X seguimiento(s) vencido(s)"_ |

---

## FASE 8 — Manejo de Excepciones

**Ruta:** `/indisponibilidades` · `/cola-espera`  
**Rol:** Administrador (indisponibilidades) · Administrador + Recepcionista (cola)

### 8.1 Registrar indisponibilidad de veterinario

**Prerrequisito:** Tener al menos 1 cita activa (`pendiente` o `confirmada`) para el veterinario a bloquear.

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Ir a `/indisponibilidades` | Tabla vacía o con bloqueos existentes |
| 2 | Clic en **"Registrar bloqueo"** | Modal con campos: veterinario, desde, hasta, razón, justificación |
| 3 | Seleccionar veterinario, establecer rango que incluya la fecha de la cita activa, razón: **Enfermedad** | Al confirmar: modal muestra resultado con el número de citas afectadas |
| 4 | Verificar resultado | Toast + mensaje en modal: _"Se registraron X excepciones por citas afectadas"_ |
| 5 | Llamar `GET /api/citas` | Las citas del rango siguen existentes pero tienen registro en `excepciones_citas` |

### 8.2 Cola de espera

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Ir a `/cola-espera` | Lista filtrada por estado (por defecto: "En espera") |
| 2 | Agregar mascota a cola: seleccionar mascota, motivo, fecha preferida | Registro creado, aparece en tabla |
| 3 | Clic en ✓ (check verde) de la fila | Estado cambia a `Horario ofrecido` |
| 4 | Clic en **"Confirmar agendado"** | Estado cambia a `Cita agendada` |
| 5 | Cambiar filtro a "Cancelados" | Lista vacía (ninguno cancelado aún) |

---

## FASE 9 — Archivos en Historia Clínica

**Ruta:** Modal de detalle HC en `/historia-clinica`  
**Roles:** Administrador, Veterinario (subir/eliminar) · Recepcionista + Cliente (solo ver)

### 9.1 Subir archivo válido

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Ir a `/historia-clinica` y abrir el detalle de una HC | Modal con botón **"Archivos"** |
| 2 | Hacer clic en **"Archivos"** | Panel se expande mostrando zona drag-and-drop |
| 3 | Seleccionar tipo: **"Radiografía"** | Badge morado en selector |
| 4 | Arrastrar imagen JPG o PNG al área indicada | Indicador de carga, luego thumbnail aparece en la galería |
| 5 | Subir un PDF (laboratorio) | Icono de laboratorio con nombre del archivo |

### 9.2 Ver y descargar

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Hacer clic en una imagen de la galería | Lightbox abre la imagen a pantalla completa |
| 2 | Clic en botón de descarga de un PDF | Se inicia descarga del archivo |
| 3 | Verificar la URL firmada | La URL tiene parámetro de expiración (1h desde la creación) |

### 9.3 Validaciones de rechazo

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Intentar subir un `.exe` o `.zip` | Error: "Tipo de archivo no permitido" |
| 2 | Intentar subir imagen > 50 MB | Error: "El archivo supera el límite de 50 MB" |

### 9.4 Eliminación

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Como admin, hacer clic en el ícono de eliminación de un archivo | Confirm dialog |
| 2 | Confirmar | Archivo eliminado de la galería Y del bucket de Supabase Storage |
| 3 | Como recepcionista (solo lectura), verificar que no aparece botón de eliminar | Correcto: solo botones Ver y Descargar |

---

## FASE 10 — Analítica Operacional

**Ruta:** `/analitica` (Sidebar → Reportes → Analítica)  
**Rol:** Administrador

### 10.1 Dashboard de KPIs

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Ir a `/analitica` | 11 KPI cards con skeleton loading, luego datos reales |
| 2 | Verificar cards: Total citas, Citas atendidas, Tasa cancelación, Vacunas, etc. | Valores consistentes con los datos en BD |
| 3 | Si otro rol intenta acceder | Mensaje: "Solo accesible para administradores" |

### 10.2 Cambio de período

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Clic en **"Trimestre"** | KPIs y gráficos se recargan con datos del último trimestre |
| 2 | Clic en **"Año"** | Datos del último año, evolución semanal muestra más variación |
| 3 | Clic en **"Actualizar"** | Datos se refrescan (ícono gira durante la carga) |

### 10.3 Gráficos Chart.js

| # | Gráfico | Verificar |
|---|---------|-----------|
| 1 | Pie chart — Estado de citas | 4 sectores de color (verde, azul, ámbar, rojo) con porcentajes en tooltip |
| 2 | Donut — Triajes por urgencia | 3 sectores (normal/urgente/emergencia) + tarjetas de resumen a la derecha |
| 3 | Bar vertical — Evolución semanal | 3 barras por semana (total, atendidas, canceladas) con leyenda |
| 4 | Bar apilado — Por veterinario | Barras de atendidas + canceladas por vet (top 6) |
| 5 | Bar horizontal — Por especie | Barras de longitud proporcional al número de citas |
| 6 | Bar horizontal — Por día de semana | Identifica día pico de la clínica |
| 7 | Bar horizontal — Seguimientos | 4 estados con colores semánticos |
| 8 | Bar horizontal — Mascotas por especie | Refleja el historial completo, no solo el período |

### 10.4 Exportar CSV

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Clic en **"Exportar CSV"** | Descarga archivo `petcare-analitica-{fecha}.csv` |
| 2 | Abrir el CSV en Excel o similar | Datos tabulados: KPIs, por estado, por veterinario, por especie |
| 3 | Verificar codificación UTF-8 | Acentos y caracteres especiales correctos |

---

## PORTAL DEL CLIENTE

**Ruta:** `/portal`  
**Rol:** Cliente (registrado y con correo verificado)

### P.1 Banner de alertas inteligente

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Ingresar como cliente con mascotas que tengan alertas de vacunas | Banner rojo/ámbar visible en la parte superior |
| 2 | Clic en **"Ver"** del banner de vacunas | Navega a la cartilla de la mascota afectada |
| 3 | Clic en **"Ver"** del banner de seguimientos | Cambia a tab "Seguimientos" |
| 4 | Clic en **"Cerrar avisos"** | Banner desaparece en esa sesión |

### P.2 Tab "Seguimientos" con badge

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Si hay seguimientos pendientes | Badge rojo con número en tab "Seguimientos" |
| 2 | Clic en tab "Seguimientos" | Lista de controles con fecha, motivo, veterinario |
| 3 | Clic en **"Agendar control"** | Abre modal BookingModal con motivo pre-rellenado |
| 4 | Completar la cita | Toast de confirmación, cita creada |

### P.3 Estado en tiempo real en tarjeta de mascota

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | (Desde el dashboard admin) Avanzar una atención a estado `triaje` para una mascota | Estado guardado en BD |
| 2 | Ingresar al portal como cliente dueño de esa mascota | Badge morado "En triaje" en la tarjeta de la mascota |
| 3 | Borde del card de la mascota | Borde morado/violeta visible |

### P.4 Archivos médicos (solo lectura)

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Ir a tab "Historial clínico" en el portal | En cada HC aparece link "Ver historial completo y archivos adjuntos" |
| 2 | Hacer clic en el link | Navega a `/portal/mascotas/{id}/historia-clinica` |
| 3 | En cada entrada de HC, clic en **"Archivos"** | Panel expandible muestra archivos (si los hay) |
| 4 | Verificar que NO aparecen los botones de subida ni eliminación | Solo botones "Ver" (para imágenes) y "Descargar" |
| 5 | Clic en imagen | Lightbox de solo lectura |
| 6 | Intentar acceder a `POST /api/archivos/upload` como cliente | Error 403: "No autorizado" |

### P.5 Servicios al agendar cita

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Clic en **"Agendar cita"** | Modal con selector de servicio (opcional) |
| 2 | Abrir dropdown de servicios | Lista de servicios activos con precio y duración |
| 3 | Seleccionar `Cirugía de Esterilización` | Aparece nota: "Precio referencial: S/ 200.00 · Duración estimada: 60 minutos" |
| 4 | Seleccionar fecha y luego veterinario | Dropdown muestra nombre + especialidad del vet |
| 5 | Completar la cita | Cita creada con `id_servicio` vinculado |

### P.6 Lista de espera

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | En tab "Mis citas" (vacío o con citas), clic en **"¿No encuentras horario? Unirme a lista de espera"** | Abre modal `ColaEsperaModal` |
| 2 | Seleccionar mascota, ingresar motivo (mín. 5 caracteres) | Formulario válido |
| 3 | Clic en **"Unirme a la lista"** | Toast/modal de confirmación |
| 4 | Volver al portal | Banner morado: "1 mascota en lista de espera" |
| 5 | Intentar unirse nuevamente con la misma mascota | Error: "Esta mascota ya está en la lista de espera" |
| 6 | Desde el dashboard admin (`/cola-espera`), ver la solicitud del cliente | Aparece en estado "En espera" |

---

## Pruebas de Seguridad y Permisos

### S.1 Restricciones por rol

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Como `veterinario`, intentar acceder a `/especialidades` | Módulo no visible en sidebar, ruta protegida |
| 2 | Como `cliente`, intentar `GET /api/seguimientos-clinicos` | Solo devuelve seguimientos de sus mascotas |
| 3 | Como `cliente`, intentar `DELETE /api/archivos/{id_de_otro_cliente}` | Error 403 |
| 4 | Como `cliente`, intentar `GET /api/analitica` | Error 403: "No autorizado" |
| 5 | Como `recepcionista`, intentar `POST /api/especialidades` | Error 403: "Solo el administrador puede crear especialidades" |

### S.2 Validación de propiedad (cliente)

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Como cliente A, intentar ver archivos de HC de un cliente B: `GET /api/historia-clinica/{id_historia_ajena}/archivos` | Error 403: "No autorizado" |
| 2 | Como cliente, intentar inscribir a la lista de espera una mascota que no le pertenece | Error 403: "Mascota no encontrada o no te pertenece" |

---

## Prueba del Cron de Recordatorios

**Endpoint:** `POST /api/recordatorios` (requiere header `x-cron-secret` o `Authorization: Bearer {CRON_SECRET}`)

| # | Acción | Resultado esperado |
|---|--------|--------------------|
| 1 | Crear una cita para mañana (fecha = hoy + 1 día) | Cita en estado `pendiente` o `confirmada` |
| 2 | Llamar `POST /api/recordatorios` con el secret correcto | Respuesta JSON con `citas_enviadas: 1` (o `citas_omitidas` si ya fue enviado) |
| 3 | Verificar tabla `recordatorios_enviados` en Supabase | Registro con `tipo: "cita"`, `estado: "enviado"` |
| 4 | Crear alerta de vacuna con `fecha_alerta = hoy` y llamar el cron | `alertas_vacunas_procesadas: 1` |
| 5 | Crear seguimiento con `fecha_sugerida_control - dias_anticipacion = hoy` y llamar cron | `seguimientos_procesados: 1`, seguimiento pasa a `sugerencia_enviada` |
| 6 | Revisar la tabla `metricas_diarias` después del cron | Registro del día de hoy con datos agregados de citas y vacunas |

---

## Notas para el Tester

1. **Orden de migración:** Las migraciones deben ejecutarse en orden: `fase1a4.sql` → `fase5a8.sql` → `fase9a10.sql`. Cada una depende de la anterior.

2. **Datos de prueba mínimos:**
   - 2 veterinarios con especialidades distintas
   - 2 clientes con al menos 1 mascota cada uno
   - 3 citas en distintos estados (pendiente, confirmada, atendida)

3. **Storage bucket:** El bucket `petcare-historias` debe crearse manualmente en Supabase antes de las pruebas de la Fase 9. Si no existe, el upload falla con error de Supabase Storage.

4. **Cron en local:** Para probar el cron localmente sin Vercel, ejecutar directamente:
   ```bash
   curl -X POST http://localhost:3000/api/recordatorios \
     -H "x-cron-secret: {CRON_SECRET_del_.env}"
   ```

5. **Analítica sin datos:** Si la BD está vacía, los gráficos aparecen "Sin datos". Crear al menos 5-10 citas en distintos estados para ver los gráficos poblados.

6. **Portal del cliente:** Registrar un cliente via `/register` (o `/api/public/register`), verificar el correo desde la BD (token en `usuarios.token_verificacion`), luego ingresar a `/portal`.

---

*Guía generada el 28 de mayo de 2026 — PetCare Sistema*
