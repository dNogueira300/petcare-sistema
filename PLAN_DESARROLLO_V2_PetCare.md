# 🏗️ PLAN DE DESARROLLO V2 — PetCare Sistema

## Evolución desde Microempresa hacia Plataforma Clínica Escalable

**Documento:** Plan de Desarrollo de Fases  
**Versión:** 2.0  
**Fecha:** 28 de mayo de 2026  
**Estado:** En Planificación  
**Priorización:** Por criticidad operativa y arquitectónica

---

## 📊 Matriz de Criticidad

| Nivel          | Impacto                          | Complejidad | Justificación                                   |
| -------------- | -------------------------------- | ----------- | ----------------------------------------------- |
| 🔴 **Crítico** | Alto en operación clínica        | Media-Alta  | Requerido para profesionalizar el flujo médico  |
| 🟠 **Alto**    | Alto en decisiones empresariales | Media       | Fundamental para la continuidad y escalabilidad |
| 🟡 **Medio**   | Moderado en operación            | Baja-Media  | Mejora experiencia pero no paraliza el negocio  |
| 🟢 **Bajo**    | Bajo en operación                | Baja        | Mejoras futuras, no críticas actualmente        |

---

## 🔴 FASE 1: SEPARACIÓN DE CONCEPTOS — Cita vs. Atención Clínica

**Criticidad:** 🔴 **CRÍTICA**  
**Impacto:** Alto en trazabilidad médica y operación clínica  
**Complejidad:** Alta

### 📋 Descripción

Actualmente, la entidad `citas` es el único eje central del sistema. Una cita es:

- Registrada
- Confirmada
- Completada

Pero en una clínica real, una cita pasa por múltiples estados clínicos antes de finalizar. Esta fase introduce una **máquina de estados clínicos completa** que desacopla el concepto de "reserva" del de "atención médica".

### 🎯 Objetivos

1. Crear tabla `atenciones_clinicas` que represente el ciclo de vida médico real
2. Desacoplar `citas` (reserva) de `atenciones_clinicas` (proceso clínico)
3. Implementar máquina de estados con transiciones validadas
4. Mantener trazabilidad completa de cada estado
5. Habilitar flujos clínicos más complejos (triaje, hospitalización, seguimiento)

### 📐 Arquitectura de Datos

#### Nuevas Entidades

**Tabla: `atenciones_clinicas`**

```sql
id_atencion (PK)
id_cita (FK → citas.id_cita) — Nullable (cita que inició este proceso)
id_mascota (FK → mascotas.id_mascota)
id_veterinario (FK → veterinarios.id_veterinario)
estado_actual (ENUM: reservada, confirmada, espera, triaje, consulta, 
               hospitalizado, finalizado, seguimiento, no_asistio)
fecha_inicio (TIMESTAMP)
fecha_estado_actual (TIMESTAMP)
motivo_consulta (TEXT)
observaciones (TEXT)
prioridad (ENUM: normal, urgente)
```

**Tabla: `transiciones_estado` (Auditoría)**

```sql
id_transicion (PK)
id_atencion (FK → atenciones_clinicas.id_atencion)
estado_anterior (VARCHAR)
estado_nuevo (VARCHAR)
fecha_transicion (TIMESTAMP)
id_usuario (FK → usuarios.id_usuario) — Quién cambió el estado
razon (TEXT) — Por qué se cambió
```

#### Cambios en Entidades Existentes

**Tabla `citas` — Refactor:**

```sql
-- Agregar: relación clara a atencion_clinica
id_cita (PK)
id_atencion (FK → atenciones_clinicas.id_atencion) — NULLABLE
id_mascota (FK → mascotas.id_mascota)
id_veterinario (FK → veterinarios.id_veterinario)
fecha (DATE)
hora (TIME)
motivo (TEXT)
estado (ENUM: pendiente, confirmada, cancelada)
-- NUEVO: distinto de estado_clinico
estado_clinico (VARCHAR) — Referencia de lectura a atencion_clinica.estado_actual
observaciones (TEXT)
creado_en (TIMESTAMP)
```

### 🔄 Flujo de Estados Validados

```
reservada
    ↓ (Confirmación)
confirmada
    ↓ (Paciente llega)
espera
    ↓ (Evaluación preliminar)
triaje [*Nuevo módulo requerido*]
    ↓ (Pasa a médico)
consulta
    ├→ finalizado (Fin de consulta)
    ├→ hospitalizado (Requiere ingreso)
    └→ seguimiento (Control posterior)
         ↓
         seguimiento_pendiente

[Flujos alternos]
confirmada →→ no_asistio (No llega)
reservada →→ cancelada
cualquier_estado →→ cancelada (Cancelación excepcional)
```

### 🛠️ Componentes a Desarrollar

1. **Backend - API de Atenciones Clínicas**
   
   - POST `/api/atenciones-clinicas/` — Crear atención (de cita o manual)
   - GET `/api/atenciones-clinicas/:id` — Detalle completo
   - PATCH `/api/atenciones-clinicas/:id/transicion` — Cambiar estado (validación)
   - GET `/api/atenciones-clinicas/auditoria/:id` — Historial de transiciones

2. **Frontend - Panel de Control de Estados**
   
   - Kanban de atenciones por estado
   - Botones de transición contextuales (solo estados válidos permitidos)
   - Timeline visual de cambios de estado
   - Auditoría visible para cada transición

3. **Validaciones de Negocio**
   
   - No permitir transiciones inválidas (ej: no pasar de espera a finalizado sin triaje)
   - Bloquear transiciones sin justificación (razon requerida)
   - Registrar siempre quién y cuándo cambió estado

### 📊 Beneficios Esperados

| Beneficio                 | Descripción                                                     |
| ------------------------- | --------------------------------------------------------------- |
| **Trazabilidad real**     | Saber exactamente dónde está cada mascota en el proceso clínico |
| **Auditoría médica**      | Registro completo de quién hizo qué y cuándo                    |
| **Flujos hospitalizados** | Soporte para mascotas hospitalizadas varios días                |
| **Seguimiento médico**    | Integración natural de controles posteriores a la consulta      |
| **Escalabilidad clínica** | Base sólida para triaje y atención de urgencias                 |

### ⚙️ Consideraciones Técnicas

- **Backward compatibility:** Las citas existentes migran automáticamente a atenciones_clinicas
- **Transiciones:** Usar tabla de transiciones_estado para validación (no hardcoded)
- **RLS:** Políticas de seguridad por rol en tabla atenciones_clinicas
- **Índices:** Crear índices en (id_mascota, estado_actual) para búsquedas rápidas

---

## 🔴 FASE 2: MÓDULO TRIAJE — Evaluación Preliminar Clínica

**Criticidad:** 🔴 **CRÍTICA**  
**Impacto:** Alto en calidad médica, fundamental para urgencias  
**Complejidad:** Media-Alta

### 📋 Descripción

En una clínica veterinaria real, antes de que el veterinario atienda, existe un **triaje** donde:

- Se registran signos vitales básicos
- Se evalúa urgencia
- Se documenta síntomas iniciales
- El veterinario tiene contexto antes de iniciar consulta

Actualmente, el veterinario atiende "a ciegas" sin evaluación preliminar. Este módulo coloca una etapa intermedia crítica entre recepción y consulta.

### 🎯 Objetivos

1. Crear entidad de triaje vinculada a atencion_clinica
2. Capturar signos vitales: peso, temperatura, FC, síntomas
3. Clasificar urgencia (normal/urgente/emergencia)
4. Mostrar evaluación preliminar en historia clínica del veterinario
5. Habilitar priorización de citas por urgencia

### 📐 Arquitectura de Datos

**Tabla: `triaje`**

```sql
id_triaje (PK)
id_atencion (FK → atenciones_clinicas.id_atencion)
id_mascota (FK → mascotas.id_mascota)
id_recepcionista (FK → usuarios.id_usuario) — Quién realizó triaje
fecha_triaje (TIMESTAMP)

-- Signos vitales
peso (DECIMAL) — kg
temperatura (DECIMAL) — °C
frecuencia_cardiaca (INT) — lat/min
frecuencia_respiratoria (INT) — resp/min
observaciones_iniciales (TEXT)

-- Urgencia
nivel_urgencia (ENUM: normal, urgente, emergencia)
razon_urgencia (TEXT) — Justificación de urgencia/emergencia
sintomas_reportados (TEXT) — Lista de síntomas iniciales

-- Metadata
duracion_triaje (INT) — minutos
estado (ENUM: completado, incompleto, cancelado)
notas_medico (TEXT) — Si el médico necesita anotar algo sobre triaje
creado_en (TIMESTAMP)
```

**Tabla: `esquema_triaje_mascota` (Catálogo por especie)**

```sql
id_esquema (PK)
especie (VARCHAR) — perro, gato, ave, etc.
rango_peso_min (DECIMAL)
rango_peso_max (DECIMAL)
temp_normal_min (DECIMAL)
temp_normal_max (DECIMAL)
fc_normal_min (INT)
fc_normal_max (INT)
fr_normal_min (INT)
fr_normal_max (INT)
observaciones (TEXT)
```

### 🔄 Integración con Máquina de Estados

```
confirmada
    ↓ (Paciente llega a recepción)
espera
    ↓ (Recepcionista inicia triaje)
triaje [EVALUACIÓN PRELIMINAR AQUÍ]
    ↓ (Triaje completado)
consulta
    ↓ (Veterinario atiende con contexto)
```

### 🛠️ Componentes a Desarrollar

1. **Backend - API de Triaje**
   
   - POST `/api/triaje/` — Crear evaluación
   - GET `/api/triaje/:id` — Obtener evaluación
   - PATCH `/api/triaje/:id` — Actualizar (si incompleto)
   - GET `/api/triaje/por-atencion/:id_atencion` — Ver triaje de cita

2. **Frontend - Formulario de Triaje**
   
   - Pantalla dedicada para recepcionista
   - Campos dinámicos según especie (rangos normales precargados)
   - Alerta visual si signo vital fuera de rango
   - Selector de urgencia con justificación obligatoria
   - Validación de campos completos

3. **Frontend - Contexto en Historia Clínica**
   
   - Veterinario ve triaje resumido antes de iniciar consulta
   - Timeline visual de signos vitales
   - Alertas destacadas si hay hallazgos anormales
   - Opción de comentar sobre triaje (notas_medico)

### 🧪 Validaciones de Negocio

1. **Triaje obligatorio** antes de pasar a estado "consulta"
2. **Campos requeridos:** peso, temperatura, nivel de urgencia
3. **Rangos normales:** Validar signos vitales contra esquema_triaje_mascota
4. **Alerta de emergencia:** Si nivel_urgencia = emergencia, priorizar en cola

### 📊 Beneficios Esperados

| Beneficio                | Descripción                                    |
| ------------------------ | ---------------------------------------------- |
| **Contexto médico**      | Veterinario no atiende a ciegas                |
| **Gestión de urgencias** | Emergencias pueden saltar cola                 |
| **Diagnóstico mejorado** | Síntomas iniciales documentados                |
| **Datos basales**        | Peso y vitales en cada visita para seguimiento |
| **Escalabilidad**        | Base para futuro soporte de teleconsulta       |

### ⚙️ Consideraciones Técnicas

- **Esquema por especie:** Permitir configuración flexible de rangos normales
- **Validación frontend:** Alertas visuales de valores fuera de rango
- **Incompleto:** Permitir guardar parcialmente, pero bloquear avance sin signos vitales
- **Opcional:** Peso y FC pueden dejarse en blanco si mascota agresiva (con justificación)

---

## 🔴 FASE 3: DESACOPLAMIENTO DE ESPECIALIDADES MÉDICAS

**Criticidad:** 🔴 **CRÍTICA**  
**Impacto:** Alto en escalabilidad y flexibilidad operativa  
**Complejidad:** Media

### 📋 Descripción

Actualmente, `veterinarios.especialidad` es un simple VARCHAR. Esto limita:

- Un veterinario no puede tener múltiples especialidades
- Los servicios no se pueden vincular a especialidades
- Las citas no validan que el veterinario tenga la especialidad requerida

Esta fase desacopla especialidades en una tabla propia y crea relación N:M entre veterinarios y especialidades.

### 🎯 Objetivos

1. Crear tabla `especialidades` como catálogo
2. Crear tabla intermedia `veterinario_especialidad` (N:M)
3. Refactor de datos: migrar especialidades actuales
4. Vincular servicios a especialidades (futuro)
5. Validar en citas que veterinario tenga especialidad del servicio

### 📐 Arquitectura de Datos

**Tabla: `especialidades` (Catálogo)**

```sql
id_especialidad (PK)
nombre (VARCHAR UNIQUE) — Ej: "Medicina General", "Cirugía", "Dermatología"
descripcion (TEXT)
es_activa (BOOLEAN DEFAULT TRUE)
creado_en (TIMESTAMP)
```

**Tabla: `veterinario_especialidad` (Relación N:M)**

```sql
id_veterinario_especialidad (PK)
id_veterinario (FK → veterinarios.id_veterinario)
id_especialidad (FK → especialidades.id_especialidad)
es_especialista_primario (BOOLEAN) — Flag para indicar especialidad principal
años_experiencia (INT) — Opcional
certificaciones (TEXT) — Opcional
creado_en (TIMESTAMP)
UNIQUE(id_veterinario, id_especialidad) — No duplicar
```

**Tabla: `servicios_medicos` (Catálogo de servicios)**

```sql
id_servicio (PK)
nombre (VARCHAR) — Ej: "Vacunación", "Cirugía de esterilización"
id_especialidad (FK → especialidades.id_especialidad) — Especialidad requerida
descripcion (TEXT)
duracion_estimada_minutos (INT)
precio_base (DECIMAL)
es_activo (BOOLEAN DEFAULT TRUE)
creado_en (TIMESTAMP)
```

#### Refactor de Tabla `citas`

```sql
-- AGREGAR:
id_servicio (FK → servicios_medicos.id_servicio) NULLABLE
id_especialidad (FK → especialidades.id_especialidad) NULLABLE — Specialty requerida

-- REMOVER:
especialidad VARCHAR (se infiere del servicio)
```

### 🔄 Validaciones de Negocio

1. Al agendar cita:
   
   - Si se especifica un servicio, validar que veterinario tenga esa especialidad
   - Si se especifica especialidad, mostrar solo veterinarios con esa especialidad

2. Al registrar veterinario:
   
   - Permitir múltiples especialidades
   - Una debe marcarse como primaria (es_especialista_primario)

3. RLS Security:
   
   - Veterinario solo ve sus propias especialidades
   - Recepcionista ve especialidades de todos

### 🛠️ Componentes a Desarrollar

1. **Backend - API de Especialidades**
   
   - GET `/api/especialidades/` — Listar catálogo
   - POST `/api/veterinarios/:id/especialidades` — Agregar al veterinario
   - DELETE `/api/veterinarios/:id/especialidades/:id_esp` — Remover
   - PATCH `/api/veterinarios/:id/especialidades/:id_esp` — Actualizar (años, cert.)

2. **Frontend - Gestión de Especialidades (Admin)**
   
   - Pantalla para administrar catálogo de especialidades
   - Formulario para asignar múltiples especialidades a veterinario
   - Checkbox para marcar especialidad primaria

3. **Frontend - Validación en Citas**
   
   - Al seleccionar especialidad/servicio, filtrar veterinarios válidos
   - Mostrar especialidades de cada veterinario disponible

### 📊 Beneficios Esperados

| Beneficio             | Descripción                                                         |
| --------------------- | ------------------------------------------------------------------- |
| **Escalabilidad**     | Veterinario puede tener N especialidades                            |
| **Validación real**   | Sistema evita citas inválidas (ej: cirugía con veterinario general) |
| **Catálogo flexible** | Fácil agregar nuevas especialidades                                 |
| **Futuro: Servicios** | Base para vínculo servicios → especialidades → precios              |
| **Reportes**          | Análisis por especialidad más fácil                                 |

### ⚙️ Consideraciones Técnicas

- **Migración:** Script para migrar especialidades_varchar → especialidades tabla
- **Defaults:** Crear especialidades básicas en seed (Medicina General, Cirugía, etc.)
- **Índices:** Crear índice en (id_veterinario, id_especialidad) para búsquedas rápidas
- **Backward compat:** Veterinario sin especialidades en tabla intermedia = general

---

## 🔴 FASE 4: AUDITORÍA CLÍNICA COMPLETA

**Criticidad:** 🔴 **CRÍTICA**  
**Impacto:** Alto en integridad médica y conformidad regulatoria  
**Complejidad:** Media-Alta

### 📋 Descripción

Actualmente, el sistema guarda información pero no registra **quién modificó qué y cuándo**. En un entorno clínico real, la auditoría es fundamental:

- Protege integridad médica
- Cumple con regulaciones de salud animal
- Facilita investigaciones si hay quejas
- Profesionaliza la plataforma

Esta fase implementa una **auditoría completa** en todos los registros críticos: historia clínica, triaje, tratamientos, diagnósticos.

### 🎯 Objetivos

1. Crear tabla `auditoria` con registro exhaustivo de cambios
2. Rastrear quién editó diagnóstico, tratamiento, observaciones
3. Mantener historial de valores anteriores → nuevos
4. Registrar timestamp preciso de cada cambio
5. Implementar vista de auditoría por historia clínica

### 📐 Arquitectura de Datos

**Tabla: `auditoria`**

```sql
id_auditoria (PK)
tabla_afectada (VARCHAR) — ej: "historia_clinica", "triaje", "citas"
id_registro (INT) — FK genérico a tabla_afectada
id_usuario (FK → usuarios.id_usuario) — Quién hizo el cambio
campo_modificado (VARCHAR) — ej: "diagnostico", "tratamiento"
valor_anterior (TEXT)
valor_nuevo (TEXT)
tipo_cambio (ENUM: INSERT, UPDATE, DELETE)
fecha_cambio (TIMESTAMP DEFAULT NOW())
direccion_ip (VARCHAR NULLABLE) — De dónde se hizo el cambio (si web)
razon_cambio (TEXT NULLABLE) — Opcional: por qué se cambió
```

**Tabla: `auditoria_historia_clinica` (Especializada, más detallada)**

```sql
id_auditoria_hc (PK)
id_historia (FK → historia_clinica.id_historia)
id_usuario (FK → usuarios.id_usuario)
timestamp_cambio (TIMESTAMP)
-- Campos de HC que cambiaron
diagnostico_anterior (TEXT NULLABLE)
diagnostico_nuevo (TEXT NULLABLE)
tratamiento_anterior (TEXT NULLABLE)
tratamiento_nuevo (TEXT NULLABLE)
observaciones_anterior (TEXT NULLABLE)
observaciones_nuevo (TEXT NULLABLE)
peso_anterior (DECIMAL NULLABLE)
peso_nuevo (DECIMAL NULLABLE)
razon_cambio (TEXT)
```

### 🔄 Disparadores en BD (Triggers)

```sql
-- Trigger en historia_clinica para cada UPDATE
CREATE TRIGGER audit_historia_clinica_update
AFTER UPDATE ON historia_clinica
FOR EACH ROW
  INSERT INTO auditoria_historia_clinica (...)
  VALUES (NEW.id_historia, current_user_id(), NOW(),
          OLD.diagnostico, NEW.diagnostico,
          OLD.tratamiento, NEW.tratamiento, ...);

-- Similar para triaje, citas, etc.
```

### 🛠️ Componentes a Desarrollar

1. **Backend - API de Auditoría**
   
   - GET `/api/auditoria/:tabla/:id_registro` — Historial de cambios
   - GET `/api/historia-clinica/:id/auditoria` — Auditoría de HC específica
   - POST `/api/auditoria/` — Registrar (interno, llamado por triggers)

2. **Frontend - Vista de Auditoría**
   
   - Panel lateral o modal en historia clínica
   - Timeline visual: quién cambió qué, cuándo
   - Diff visual: valor anterior vs. nuevo
   - Justificación de cambio (si aplica)
   - Filtrar por usuario, fecha, tipo de cambio

3. **Backend - RLS para Auditoría**
   
   - Veterinario ve auditoría de sus historias
   - Admin ve auditoría global
   - No se puede eliminar registro de auditoría

### 📊 Beneficios Esperados

| Beneficio             | Descripción                                          |
| --------------------- | ---------------------------------------------------- |
| **Integridad médica** | Imposible cambiar diagnóstico sin registro           |
| **Conformidad legal** | Cumple reglamentos de salud animal                   |
| **Investigación**     | Si hay queja, se puede rastrear exactamente qué pasó |
| **Confianza**         | Clientes ven que datos están protegidos              |
| **Profesionalismo**   | Diferenciar de "software casero"                     |

### ⚙️ Consideraciones Técnicas

- **Triggers:** Crear en Supabase para INSERT, UPDATE, DELETE
- **Performance:** Tabla auditoria crece rápido → índices en (tabla_afectada, id_registro)
- **Compresión:** Para datos históricos, considerar archivado
- **Razon_cambio:** Campo recomendado pero opcional (ej: "Error tipográfico", "Diagnóstico adicional")

---

## 🟠 FASE 5: GESTIÓN DE CAPACIDAD OPERATIVA — Consultorios, Salas Quirúrgicas, Equipos

**Criticidad:** 🟠 **ALTA**  
**Impacto:** Alto en escalabilidad de operación  
**Complejidad:** Media-Alta

### 📋 Descripción

Actualmente, la disponibilidad de citas depende **solo del veterinario y la hora**. Pero en una clínica real existen recursos físicos limitados:

- Consultorios (limitados)
- Salas quirúrgicas
- Equipos especializados
- Jaulas de hospitalización

Aunque un veterinario esté libre, **no puede agendar una cirugía si la sala quirúrgica está ocupada**. Esta fase implementa gestión de capacidad multirecurso.

### 🎯 Objetivos

1. Crear tabla `recursos` (consultorios, quirófanos, equipos)
2. Crear tabla `recurso_disponibilidad` con horarios por recurso
3. Crear tabla `cita_recursos` (relación: qué recursos usa cada cita)
4. Validar en agendamiento que todos los recursos estén disponibles
5. Dashboard de ocupación de recursos

### 📐 Arquitectura de Datos

**Tabla: `recursos`**

```sql
id_recurso (PK)
nombre (VARCHAR) — Ej: "Consultorio 1", "Quirófano", "Máquina ECG"
tipo_recurso (ENUM: consultorio, quirofano, equipo, jaula_hospitalizacion)
descripcion (TEXT)
capacidad (INT) — 1 para consultorios, 1 para quirófanos, N para equipos
ubicacion (VARCHAR)
notas_mantenimiento (TEXT)
activo (BOOLEAN DEFAULT TRUE)
creado_en (TIMESTAMP)
```

**Tabla: `recurso_disponibilidad`**

```sql
id_disponibilidad (PK)
id_recurso (FK → recursos.id_recurso)
dia_semana (INT) — 1=lunes, 7=domingo
hora_inicio (TIME)
hora_fin (TIME)
activo (BOOLEAN DEFAULT TRUE)
```

**Tabla: `cita_recursos` (Relación N:M)**

```sql
id_cita_recurso (PK)
id_cita (FK → citas.id_cita)
id_recurso (FK → recursos.id_recurso)
duracion_reserva_minutos (INT) — Ej: cirugía usa quirófano 60 min
creado_en (TIMESTAMP)
```

**Tabla: `servicios_medicos` — Ampliación**

```sql
-- AGREGAR:
id_recurso_requerido (FK → recursos.id_recurso) NULLABLE
duracion_estimada_minutos (INT)
-- Ej: "Cirugía de esterilización" requiere "Quirófano", 60 minutos
```

### 🔄 Validaciones de Negocio

Al agendar cita:

1. Validar veterinario disponible (como ahora)
2. Validar especialidad si requiere
3. **NUEVO:** Validar que recurso_requerido esté disponible en esa hora
4. Si no hay recurso, mostrar "No disponible en esta fecha"
5. Al confirmar, **reservar tanto veterinario como recurso**

Ejemplo:

```
Cirugía de esterilización
  Requiere: Quirófano
  Requiere: Veterinario con especialidad "Cirugía"
  Duración: 60 minutos

Validación:
  ✅ Vet cirujano disponible 2-3 PM
  ❌ Quirófano ocupado 1:30 PM - 2:30 PM
  → Sugerir horarios donde ambos están libres
```

### 🛠️ Componentes a Desarrollar

1. **Backend - API de Recursos**
   
   - POST `/api/recursos/` — Crear recurso
   - GET `/api/recursos/` — Listar con disponibilidad
   - PATCH `/api/recursos/:id` — Editar (mantenimiento, etc.)
   - GET `/api/recursos/:id/disponibilidad` — Horarios

2. **Backend - Validación de Citas**
   
   - Refactor `/api/citas/crear` para validar recursos además de veterinario
   - POST `/api/citas/horarios-disponibles` — Retornar solo horas donde vet + recurso libres

3. **Frontend - Agendamiento Mejorado**
   
   - Mostrar recurso requerido (ej: "Requiere Quirófano")
   - Mostrar disponibilidad de ambos (vet + recurso) en tiempo real
   - Sugerir horarios que cumplan ambas condiciones

4. **Frontend - Dashboard de Recursos (Admin)**
   
   - Heatmap de ocupación por recurso
   - Calendario por recurso
   - Identificar cuellos de botella (ej: quirófano siempre lleno)

### 📊 Beneficios Esperados

| Beneficio              | Descripción                                       |
| ---------------------- | ------------------------------------------------- |
| **Realismo operativo** | Reflejar limitaciones reales de clínica           |
| **Eficiencia**         | Optimizar uso de recursos caros (quirófano)       |
| **Escalabilidad**      | Fácil agregar nuevos recursos                     |
| **Reportes**           | Saber qué recurso es cuello de botella            |
| **Futuro**             | Base para gestión de equipamiento y mantenimiento |

### ⚙️ Consideraciones Técnicas

- **Duraciones dinámicas:** Servicios pueden tener duraciones diferentes
- **Over-booking:** Decidir si permitir (ej: 2 consultas en mismo consultorio si son cortas)
- **Reserva automática:** Al confirmar cita, decrementar capacidad del recurso
- **Índices:** (id_recurso, dia_semana, hora_inicio) para búsquedas rápidas

---

## 🟠 FASE 6: CARTILLA DE VACUNACIÓN DIGITAL COMPLETA

**Criticidad:** 🟠 **ALTA**  
**Impacto:** Alto en diferenciación comercial y salud animal  
**Complejidad:** Media

### 📋 Descripción

Actualmente existe tabla `cartilla_vacunacion` básica. Esta fase la transforma en un **módulo especializado profesional** que:

- Registra vacunas con control de lotes
- Calcula automáticamente próximos refuerzos
- Genera alertas de vacunación vencida
- Exporta cartilla PDF firmable
- Integra con sistema de recordatorios

### 🎯 Objetivos

1. Expandir `cartilla_vacunacion` con campos críticos (lote, vencimiento)
2. Crear tabla `esquemas_vacunacion` con refuerzos automáticos
3. Implementar lógica de cálculo de próximas dosis
4. Generar alertas y recordatorios automáticos
5. Exportar cartilla PDF con sello veterinario

### 📐 Arquitectura de Datos

**Tabla: `cartilla_vacunacion` — Refactor completo**

```sql
id_vacuna (PK)
id_mascota (FK → mascotas.id_mascota)
id_veterinario (FK → veterinarios.id_veterinario)
id_historia_clinica (FK → historia_clinica.id_historia) — Opcional
nombre_vacuna (VARCHAR) — Ej: "Polivalente + Rabia"
tipo_vacuna (VARCHAR) — Categoría: obligatoria, recomendada, opcional
fecha_aplicacion (DATE)
lote (VARCHAR)
fecha_vencimiento_lote (DATE) — Validar que vacuna no esté vencida
proxima_dosis (DATE) — Calculada automáticamente
dosis_numero (INT) — 1, 2, 3... (para esquemas multidosis)
va_completado (BOOLEAN) — Si completó esquema
observaciones (TEXT)
creado_en (TIMESTAMP)
```

**Tabla: `esquemas_vacunacion` (Catálogo por especie)**

```sql
id_esquema (PK)
nombre_vacuna (VARCHAR UNIQUE)
tipo_especie (VARCHAR) — perro, gato, ave, etc.
dias_hasta_refuerzo (INT) — Ej: 30, 365
dosis_totales_recomendadas (INT) — Ej: 3 (primarias) + 1 (refuerzo anual)
edad_minima_aplicacion_dias (INT) — Ej: 42 días para primaria
orden_aplicacion_con_otras (TEXT) — Ej: "Aplicar 2 semanas después de XXX"
descripcion (TEXT)
obligatoria (BOOLEAN) — Flag para cumplimiento regulatorio
vigencia_minima_dias (INT) — Si vacuna expira, recordar
creado_en (TIMESTAMP)
```

**Tabla: `alertas_vacunacion` (Nuevas)**

```sql
id_alerta (PK)
id_mascota (FK → mascotas.id_mascota)
id_vacuna (FK → cartilla_vacunacion.id_vacuna)
tipo_alerta (ENUM: vencida, proximo_refuerzo, incompleta)
fecha_alerta (DATE) — Cuándo se debe alertar
dias_anticipacion (INT) — Ej: 7 días antes
estado (ENUM: activa, enviada, completada, ignorada)
creado_en (TIMESTAMP)
```

### 🔄 Lógica Automatizada

**Cálculo de próxima dosis:**

```
Al aplicar vacuna:
1. Buscar esquema_vacunacion por nombre + especie
2. Calcular próxima dosis = fecha_aplicacion + dias_hasta_refuerzo
3. Guardar en cartilla_vacunacion.proxima_dosis
4. Crear alerta 7 días antes (configurable)
5. Generar recordatorio automático en tabla recordatorios_enviados
```

**Validaciones:**

```
✅ No permitir aplicar vacuna si lote vencido
✅ Bloquear aplicación fuera de edad mínima
✅ Advertencia si se saltaron pasos previos (ej: refuerzo sin primaria)
✅ Crear alerta si no se completa esquema en tiempo esperado
```

### 🛠️ Componentes a Desarrollar

1. **Backend - API de Vacunas**
   
   - POST `/api/cartilla-vacunacion/` — Registrar aplicación
   - GET `/api/cartilla-vacunacion/:id_mascota` — Historial completo
   - GET `/api/alertas-vacunacion/` — Alertas pendientes
   - PATCH `/api/alertas-vacunacion/:id` — Marcar como enviada

2. **Backend - Cron Job de Recordatorios de Vacunas**
   
   - Similar al cron de citas actual
   - Ejecutar diariamente
   - Buscar alertas con fecha_alerta = hoy
   - Enviar correo de recordatorio

3. **Frontend - Panel de Vacunación (Veterinario)**
   
   - Formulario para registrar vacuna aplicada
   - Validación de lote vencido
   - Auto-cálculo de próxima dosis
   - Cartilla visual por mascota

4. **Frontend - Exportar Cartilla PDF**
   
   - Diseño profesional con sello veterinario
   - Incluir: mascota, dueño, vacunas, próximas fechas
   - QR opcional con información de verificación
   - Descargable e imprimible

5. **Frontend - Alertas para Cliente**
   
   - En portal: "Vacuna de Fifi vence en 7 días"
   - Botón para agendar cita de refuerzo
   - Recordatorio automático por correo

### 📊 Beneficios Esperados

| Beneficio                    | Descripción                                     |
| ---------------------------- | ----------------------------------------------- |
| **Diferenciador comercial**  | Sistema profesional de vacunación = confianza   |
| **Cumplimiento regulatorio** | Registro comprobable para autoridades           |
| **Salud animal**             | No se pierden refuerzos, mascotas protegidas    |
| **Clientes satisfechos**     | Cartilla digital descargable, PDF profesional   |
| **Automatización**           | Recordatorios automáticos reducen inasistencias |
| **Datos**                    | Métricas de cobertura de vacunación             |

### ⚙️ Consideraciones Técnicas

- **Lote vencido:** Validar fecha_vencimiento_lote <= fecha_actual
- **Alertas anticipadas:** Configurables (default: 7 días antes)
- **Multidosis:** Soportar esquemas donde requiere 3 inyecciones
- **RLS:** Veterinario solo ve/edita vacunas que él aplicó

---

## 🟠 FASE 7: SEGUIMIENTO CLÍNICO AUTOMATIZADO Y CONTINUIDAD MÉDICA

**Criticidad:** 🟠 **ALTA**  
**Impacto:** Alto en calidad médica y fidelización de clientes  
**Complejidad:** Media

### 📋 Descripción

Actualmente, una atención termina cuando se registra historia clínica. Pero en una clínica real, la **continuidad médica es fundamental**. El veterinario debería poder indicar:

- "Control en 7 días"
- "Revisión de herida en 3 días"
- "Análisis de laboratorio en 5 días"

Y el sistema automáticamente:

- Genera sugerencia de cita
- Envía recordatorio al cliente
- Marca caso en seguimiento
- Facilita clínica de calidad superior

### 🎯 Objetivos

1. Crear tabla `seguimientos_clinicos` con plan de control
2. Implementar lógica de sugerencia automática de citas
3. Generar recordatorios por correo (3 días antes)
4. Marcar historias en estado de "pendiente de seguimiento"
5. Dashboard de seguimientos vencidos

### 📐 Arquitectura de Datos

**Tabla: `seguimientos_clinicos`**

```sql
id_seguimiento (PK)
id_historia_clinica (FK → historia_clinica.id_historia)
id_mascota (FK → mascotas.id_mascota)
id_veterinario (FK → veterinarios.id_veterinario)
motivo_seguimiento (VARCHAR) — Ej: "Control de herida", "Revisión de droga"
fecha_sugerida_control (DATE) — Cuándo el vet sugiere el próximo control
dias_anticipacion_recordatorio (INT DEFAULT 3) — Avisar 3 días antes
estado (ENUM: pendiente, sugerencia_enviada, cita_agendada, completado, 
         no_presentado, cancelado)
observaciones (TEXT) — Ej: "Cambio de vendaje", "Análisis de seguimiento"
cita_sugerida (FK → citas.id_cita) NULLABLE — Cita auto-generada si aplica
creado_en (TIMESTAMP)
```

**Tabla: `historia_clinica` — Ampliación**

```sql
-- AGREGAR:
estado_seguimiento (ENUM: sin_seguimiento, pendiente_seguimiento, 
                         seguimiento_completado)
```

### 🔄 Flujo Automatizado

**Caso 1: Veterinario sugiere control**

```
Veterinario registra historia clínica
  ↓
Indica "Control en 7 días" (fecha_sugerida_control)
  ↓
Sistema crea seguimiento_clinico con estado="pendiente"
  ↓
3 días antes (7-3=4): Envía recordatorio al cliente
  ↓
Cliente puede agendar cita directamente desde recordatorio
  ↓
Si cliente agenda: estado="cita_agendada"
  ↓
Si cliente no agenda: recordatorio final 1 día antes
  ↓
Fecha control pasa: Si no hay cita, estado="no_presentado"
```

**Caso 2: Seguimiento completado**

```
Cliente llega a control → Se registra nueva historia_clinica
  ↓
Sistema detecta que es seguimiento y marca seguimiento_clinico.estado="completado"
  ↓
Si nuevo control requerido: Crear nuevo seguimiento
  ↓
Historia anterior: estado_seguimiento="seguimiento_completado"
```

### 🛠️ Componentes a Desarrollar

1. **Backend - API de Seguimientos**
   
   - POST `/api/seguimientos-clinicos/` — Crear al registrar HC
   - GET `/api/seguimientos-clinicos/pendientes` — Listar no agendadas
   - PATCH `/api/seguimientos-clinicos/:id` — Marcar como completado
   - GET `/api/mascotas/:id/seguimientos` — Ver todos para mascota

2. **Backend - Sugerencia Automática de Cita**
   
   - Al crear seguimiento, generar cita_sugerida con estado="pendiente"
   - Cita sugerida NO bloqueante, solo para cliente (puede cambiar fecha)
   - Enviar link directo para aceptar sugerencia

3. **Backend - Cron Job de Recordatorios de Seguimiento**
   
   - Similar a recordatorios de citas
   - Ejecutar diariamente
   - Buscar seguimientos donde (fecha_sugerida - dias_anticipacion) = hoy
   - Enviar correo: "Control sugerido en X días. Agendar ahora"

4. **Frontend - Panel de Seguimientos (Admin)**
   
   - Vista de todos los seguimientos pendientes
   - Filtrar por estado, veterinario, mascota
   - Alertas visuales para vencidos
   - Opción de "Reasignar" si cliente no presenta

5. **Frontend - Formulario de HC**
   
   - Campo nuevo: "¿Requiere control de seguimiento?"
   - Selector de fecha sugerida (dropdown: 3, 7, 14, 30 días)
   - Textarea de motivo

### 📊 Beneficios Esperados

| Beneficio          | Descripción                                          |
| ------------------ | ---------------------------------------------------- |
| **Calidad médica** | Continuidad de cuidado, no abandono post-consulta    |
| **Fidelización**   | Cliente ve que clínica se preocupa por seguimiento   |
| **Ingresos**       | Genera nuevas citas automáticamente                  |
| **Automatización** | Recordatorios automáticos, no requiere acción manual |
| **Datos**          | Métricas de adherencia a seguimiento médico          |

### ⚙️ Consideraciones Técnicas

- **Cita sugerida:** No es obligatoria, cliente puede elegir otra fecha
- **Cambio de fecha:** Si cliente agenda diferente, actualizar cita_sugerida
- **Múltiples seguimientos:** Una HC puede tener varios (control + lab + xray)
- **Estado:** Usar máquina de estados para validar transiciones

---

## 🟠 FASE 8: MANEJO DE ESCENARIOS CRÍTICOS Y EXCEPCIONES

**Criticidad:** 🟠 **ALTA**  
**Impacto:** Alto en continuidad operativa  
**Complejidad:** Media-Alta

### 📋 Descripción

El sistema actual no contempla escenarios reales de crisis:

- ¿Qué pasa si un veterinario falta?
- ¿Qué pasa si llega una emergencia?
- ¿Qué pasa si una cita debe posponerse masivamente?

Esta fase implementa lógica para gestionar excepciones reales.

### 🎯 Objetivos

1. Implementar bloqueo automático de agenda si veterinario inactivo
2. Reprogramación automática de citas afectadas
3. Notificaciones a clientes si cita cancela
4. Sistema de colas de espera (waitlist)
5. Priorización de emergencias
6. Justificación de cambios

### 📐 Nuevas Entidades

**Tabla: `indisponibilidades` (Bloques de tiempo)**

```sql
id_indisponibilidad (PK)
id_veterinario (FK → veterinarios.id_veterinario)
fecha_inicio (DATE)
fecha_fin (DATE)
razon (ENUM: enfermedad, vacaciones, capacitacion, emergencia)
justificacion (TEXT)
creado_por (FK → usuarios.id_usuario)
notificaciones_enviadas (BOOLEAN DEFAULT FALSE)
creado_en (TIMESTAMP)
```

**Tabla: `colas_espera` (Waitlist)**

```sql
id_cola_espera (PK)
id_mascota (FK → mascotas.id_mascota)
id_cliente (FK → clientes.id_cliente)
motivo (TEXT)
fecha_registro (TIMESTAMP)
preferencia_fecha (DATE) NULLABLE
preferencia_veterinario (FK → veterinarios.id_veterinario) NULLABLE
estado (ENUM: activa, oferecido_horario, agendada, cancelada)
creado_en (TIMESTAMP)
```

**Tabla: `excepciones_citas` (Registro de cancelaciones)**

```sql
id_excepcion (PK)
id_cita (FK → citas.id_cita)
tipo_excepcion (ENUM: veterinario_inactivo, cliente_inactivo, 
                     emergencia, reprogramacion, cancelacion_cliente)
razon (TEXT)
cita_nueva_propuesta (FK → citas.id_cita) NULLABLE
estado_notificacion (ENUM: pendiente, enviada, cliente_acepto)
creado_por (FK → usuarios.id_usuario)
creado_en (TIMESTAMP)
```

### 🔄 Lógica Automática

**Caso 1: Veterinario enfermedad**

```
Admin marca veterinario como indisponible (dates = hoy a X días)
  ↓
Sistema busca todas citas de ese vet en ese rango
  ↓
Para cada cita:
  - Crear registro en excepciones_citas
  - Generar sugerencia de nueva cita (otro vet, mismo día)
  - Si otra cita disponible: cita_nueva_propuesta
  - Enviar correo a cliente: "Tu vet está indisponible. Te proponemos..."

Cliente responde: "Acepto" o "Prefiero reprogramar"
  ↓
Si "Acepto": nueva cita confirmada
Si "Prefiero": Cliente entra a cola_espera
```

**Caso 2: Emergencia entra**

```
Recepcionista marca cita como "emergencia"
  ↓
Sistema asigna prioridad=urgente en máquina de estados
  ↓
Busca primer horario disponible de cualquier vet + recurso
  ↓
Si no hay slot: mueve citas no-críticas a cola_espera (con notificación)
  ↓
Emergencia toma ese slot
```

### 🛠️ Componentes a Desarrollar

1. **Backend - API de Excepciones**
   
   - POST `/api/indisponibilidades/` — Marcar vet como no disponible
   - GET `/api/citas/afectadas-por-indisponibilidad/:id_vet` — Listar citas a reprogramar
   - PATCH `/api/excepciones-citas/:id` — Procesar respuesta del cliente
   - POST `/api/colas-espera/` — Agregar a lista de espera

2. **Backend - Lógica Automática de Reprogramación**
   
   - Al crear indisponibilidad, buscar veterinario substituto
   - Validar que substituto tenga misma especialidad
   - Proponer nueva cita (mismo día si es posible)

3. **Frontend - Gestión de Indisponibilidades (Admin)**
   
   - Calendario con bloqueos de veterinarios
   - Formulario para marcar como indisponible
   - Vista previa de citas afectadas
   - Botón para auto-reprogramar todas

4. **Frontend - Cola de Espera**
   
   - Panel de clientes en lista de espera
   - Avisar cuando haya horario disponible
   - Link para aceptar/rechazar oferta

### 📊 Beneficios Esperados

| Beneficio                | Descripción                                 |
| ------------------------ | ------------------------------------------- |
| **Continuidad**          | Clínica no colapsa si vet se enferma        |
| **Profesionalismo**      | Manejo ordenado de excepciones              |
| **Clientes satisfechos** | Notificados proactivamente, opciones claras |
| **Emergencias**          | Pueden ser priorizadas sobre rutina         |
| **Datos**                | Análisis de impacto de indisponibilidades   |

### ⚙️ Consideraciones Técnicas

- **Cascada:** Al marcar indisponibilidad, procesar todas citas antes de guardar
- **Notificaciones:** Usar cron job para enviar notificaciones masivas
- **Veterinario substituto:** Permitir admin elegir manualmente si no hay automático
- **Cola de espera:** Ordenar por antigüedad (FIFO)

---

## 🟡 FASE 9: ALMACENAMIENTO DE ARCHIVOS EN HISTORIA CLÍNICA

**Criticidad:** 🟡 **MEDIA**  
**Impacto:** Medio en completitud de información médica  
**Complejidad:** Media

### 📋 Descripción

Actualmente, historia clínica solo almacena texto. Pero en una clínica real, se necesita:

- Radiografías
- Ecografías
- Fotografías (lesiones)
- Análisis de laboratorio (PDFs)
- Recetas digitales

Esta fase implementa almacenamiento de archivos vinculado a historias clínicas.

### 🎯 Objetivos

1. Crear tabla `archivos_historia_clinica` con referencias
2. Integrar storage de Supabase para archivos
3. Implementar upload de archivos en formulario de HC
4. Validar tipos MIME (imágenes, PDFs)
5. Generar miniaturas para previsualización

### 📐 Arquitectura de Datos

**Tabla: `archivos_historia_clinica`**

```sql
id_archivo (PK)
id_historia (FK → historia_clinica.id_historia)
id_mascota (FK → mascotas.id_mascota)
tipo_archivo (ENUM: radiografia, ecografia, fotografia, laboratorio, 
                    receta, otro)
nombre_original (VARCHAR)
path_storage (VARCHAR) — Ruta en Supabase Storage
tamaño_bytes (INT)
mime_type (VARCHAR) — image/jpeg, application/pdf, etc.
url_publica (VARCHAR) — URL para descargar/ver
fecha_carga (TIMESTAMP)
subido_por (FK → usuarios.id_usuario)
```

### 🛠️ Componentes a Desarrollar

1. **Backend - API de Archivos**
   
   - POST `/api/archivos/upload` — Subir archivo a storage
   - GET `/api/historia-clinica/:id/archivos` — Listar archivos
   - DELETE `/api/archivos/:id` — Eliminar (solo quien subió)
   - GET `/api/archivos/:id/download` — Descargar

2. **Frontend - Upload en Formulario de HC**
   
   - Drag-and-drop de archivos
   - Validación de tipo MIME (jpg, png, pdf, gif)
   - Límite de tamaño (ej: 20MB por archivo)
   - Preview de imágenes
   - Indicador de progreso de carga

3. **Frontend - Galería en HC**
   
   - Visor de imágenes (lightbox)
   - Descarga de PDFs
   - Clasificación por tipo
   - Eliminar (si admin o creador)

### 📊 Beneficios Esperados

| Beneficio                | Descripción                              |
| ------------------------ | ---------------------------------------- |
| **Información completa** | Radiografías junto a diagnóstico         |
| **Diagnóstico mejorado** | Futuros controles tienen contexto visual |
| **Documentación legal**  | Evidencia de procedimientos              |
| **Futuro: IA**           | Base para análisis asistido por IA       |

### ⚙️ Consideraciones Técnicas

- **Storage:** Usar bucket de Supabase con nombre `petcare-historias`
- **RLS:** Solo vet y admin pueden descargar
- **Compresión:** Auto-comprimir imágenes (ImageMagick o similar)
- **Antivirus:** Considerar scan de archivos en producción

---

## 🟡 FASE 10: ANALÍTICA OPERACIONAL AVANZADA

**Criticidad:** 🟡 **MEDIA**  
**Impacto:** Medio en toma de decisiones estratégicas  
**Complejidad:** Media

### 📋 Descripción

Actualmente hay reportes básicos. Esta fase implementa **analítica operacional avanzada** con KPIs empresariales reales:

- Tiempo promedio de atención
- Tasa de cancelación
- Horas pico
- Veterinario más solicitado
- Ingresos por servicio (futuro)
- Frecuencia de vacunación
- Clientes recurrentes
- Mascotas por especie
- Tasa de no-presentación

### 🎯 Objetivos

1. Crear vista materializada para agregaciones rápidas
2. Calcular métricas diarias/semanales/mensuales
3. Dashboard con gráficos de tendencias
4. Reportes exportables (PDF, CSV)
5. Comparativas año-a-año

### 📐 Arquitectura de Datos

**Tabla: `metricas_diarias` (Materializada)**

```sql
id_metrica (PK)
fecha (DATE)
total_citas_agendadas (INT)
total_citas_completadas (INT)
total_citas_canceladas (INT)
total_citas_no_asistio (INT)
total_clientes_nuevos (INT)
total_mascotas_nuevas (INT)
promedio_tiempo_atencion (INT) — minutos
veterinario_mas_solicitado (VARCHAR)
hora_pico (TIME)
vacunas_aplicadas (INT)
historias_registradas (INT)
```

### 🛠️ Componentes a Desarrollar

1. **Backend - Cálculo de Métricas**
   
   - Cron job diario que calcula metricas_diarias
   - Vistas SQL para agregaciones
   - Caché en Redis para dashboard rápido

2. **Frontend - Dashboard Analítico**
   
   - Gráficos: Líneas (tendencias), Barras (comparativas), Pie (distribución)
   - Tarjetas de KPIs: Total citas, Tasa de no-presentación, Ingreso
   - Período seleccionable (semana, mes, año)
   - Filtros por veterinario, servicio, especie

3. **Frontend - Reportes Exportables**
   
   - Botón "Descargar PDF"
   - Botón "Exportar CSV"
   - Incluir gráficos en PDF
   - Marca de tiempo y firma digital

### 📊 Beneficios Esperados

| Beneficio                          | Descripción                                |
| ---------------------------------- | ------------------------------------------ |
| **Decisiones informadas**          | Director ve datos reales, no intuición     |
| **Identificar cuellos de botella** | Saber qué vet está sobrecargado            |
| **Optimizar recursos**             | Asignar más horarios a horas pico          |
| **Crecimiento**                    | Proyectar ingresos, identificar tendencias |
| **Competitividad**                 | Métricas comparables con otras clínicas    |

### ⚙️ Consideraciones Técnicas

- **Vistas materializadas:** Precalcular en BD, no en cada query
- **Caché:** Redis para dashboard (TTL 1 hora)
- **Histórico:** Guardar metricas_diarias para análisis histórico
- **Índices:** (fecha) en metricas_diarias para búsquedas rápidas

---

## 🟡 FASE 11: INTEGRACIONES EXTERNAS Y PAGOS ONLINE

**Criticidad:** 🟡 **MEDIA**  
**Impacto:** Medio en modelo de negocio  
**Complejidad:** Media-Alta

### 📋 Descripción

Actualmente no hay integración de pagos. Esta fase permite:

- Pagos online de citas (Stripe, Mercado Pago)
- Generación de recibos/facturas
- Integración con SUNAT (futuro)
- Historial de pagos

### 🎯 Objetivos

1. Integrar gateway de pagos (Stripe o Mercado Pago)
2. Crear tabla `pagos` con estado
3. Generar recibos digitales
4. Preparar para integración SUNAT
5. Dashboard de ingresos

### 📐 Nuevas Entidades

**Tabla: `pagos`**

```sql
id_pago (PK)
id_cita (FK → citas.id_cita)
id_cliente (FK → clientes.id_cliente)
monto (DECIMAL)
moneda (VARCHAR DEFAULT 'PEN')
estado (ENUM: pendiente, procesando, completado, fallido, reembolsado)
metodo_pago (ENUM: tarjeta, transferencia, efectivo, stripe, mp)
referencia_transaccion (VARCHAR UNIQUE)
fecha_pago (TIMESTAMP)
creado_en (TIMESTAMP)
```

### 🛠️ Componentes a Desarrollar

1. **Backend - Integración Stripe/Mercado Pago**
   
   - POST `/api/pagos/crear-sesion` — Iniciar pago
   - POST `/api/pagos/webhook` — Recibir confirmación
   - GET `/api/pagos/:id` — Estado del pago

2. **Frontend - Checkout**
   
   - Modal de pago al agendar cita
   - Opción de pagar ahora o después
   - Integración de formulario de pago seguro

3. **Backend - Generación de Recibos**
   
   - PDF con número de comprobante
   - Datos de cliente, servicio, monto

### 📊 Beneficios Esperados

- **Ingresos digitales:** Cobrar online reduce tiempo manual
- **Seguridad:** No manejo físico de efectivo
- **Histórico:** Registro completo de pagos

---

## 🟢 FASE 12: AUTOMATIZACIÓN CON WHATSAPP Y WEBHOOKS

**Criticidad:** 🟢 **BAJA**  
**Impacto:** Bajo en operación, alto en UX  
**Complejidad:** Media

### 📋 Descripción

Integración con WhatsApp Business API para:

- Enviar recordatorios por WhatsApp (no solo correo)
- Chatbot para agendar citas
- Confirmaciones de cita por WhatsApp
- Notificaciones de seguimiento

### 🎯 Objetivos

1. Integrar Twilio o WhatsApp Business API
2. Enviar recordatorios por WhatsApp
3. Crear chatbot básico para citas
4. Reemplazar email en algunos casos

### ⚙️ Consideraciones Técnicas

- **Costo:** Twilio cobra por mensajes
- **Regulatorio:** Consentimiento del cliente para WhatsApp
- **Alternativa:** Mantener email como canal principal

---

## 🟢 FASE 13: APLICACIÓN MÓVIL NATIVA (iOS/Android)

**Criticidad:** 🟢 **BAJA**  
**Impacto:** Bajo inicialmente, futuro  
**Complejidad:** Alta

### 📋 Descripción

App nativa para clientes y staff para acceder al sistema desde móvil.

**Nota:** No es crítica mientras web sea responsive.

---

## 🟢 FASE 14: INTELIGENCIA ARTIFICIAL Y RECOMENDACIONES

**Criticidad:** 🟢 **BAJA**  
**Impacto:** Bajo inicialmente  
**Complejidad:** Alta

### 📋 Descripción

Futuro: IA para análisis de radiografías, recomendaciones de vacunación basadas en historial, predicción de demanda.

---

## 📊 RESUMEN DE CRITICIDAD

| Orden | Fase                             | Criticidad | Impacto | Completar por |
| ----- | -------------------------------- | ---------- | ------- | ------------- |
| 1     | Separación Cita vs. Atención     | 🔴 CRÍTICA | Alto    | Mes 2         |
| 2     | Módulo Triaje                    | 🔴 CRÍTICA | Alto    | Mes 2         |
| 3     | Desacoplamiento Especialidades   | 🔴 CRÍTICA | Alto    | Mes 2         |
| 4     | Auditoría Clínica                | 🔴 CRÍTICA | Alto    | Mes 3         |
| 5     | Gestión de Capacidad Recursos    | 🟠 ALTA    | Alto    | Mes 3         |
| 6     | Cartilla Vacunación Completa     | 🟠 ALTA    | Alto    | Mes 3         |
| 7     | Seguimiento Clínico Automatizado | 🟠 ALTA    | Alto    | Mes 4         |
| 8     | Manejo de Excepciones            | 🟠 ALTA    | Alto    | Mes 4         |
| 9     | Almacenamiento de Archivos       | 🟡 MEDIA   | Medio   | Mes 5         |
| 10    | Analítica Avanzada               | 🟡 MEDIA   | Medio   | Mes 5         |
| 11    | Integraciones y Pagos            | 🟡 MEDIA   | Medio   | Mes 6         |
| 12    | WhatsApp y Webhooks              | 🟢 BAJA    | Bajo    | Mes 7+        |
| 13    | App Móvil Nativa                 | 🟢 BAJA    | Bajo    | Año 2+        |
| 14    | IA y Recomendaciones             | 🟢 BAJA    | Bajo    | Año 2+        |

---

## 🎯 VISIÓN FINAL DEL SISTEMA

Después de completar estas 14 fases, **PetCare** habrá evolucionado de:

### **De:** Sistema básico de citas

- Registro manual de información
- Sin trazabilidad
- Sin capacidad de gestionar complejidad médica real
- Monolítico, difícil de escalar

### **A:** Plataforma clínica profesional escalable

- **Trazabilidad completa** desde cita hasta seguimiento
- **Auditoría clínica** de todos los cambios médicos
- **Máquina de estados** clínicos real
- **Gestión de capacidad** multirecurso
- **Cartilla digital** profesional
- **Analítica empresarial** para decisiones informadas
- **Automatización** de flujos repetitivos
- **Integración** con sistemas externos (SUNAT, pagos, WhatsApp)
- **Escalable** a múltiples sedes y especialidades
- **Preparada** para futuras integraciones (IA, teleconsuita, ecommerce)

---

## 📝 Notas Importantes

### No Incluidas en Este Plan (Futuro Lejano)

Las siguientes mejoras fueron **excluidas deliberadamente** porque requieren arquitectura completa diferente:

- ✋ Separación completa frontend/backend en microservicios
- ✋ Soporte multi-sucursal desde BD (requiere refactor completo)
- ✋ Ecommerce veterinario
- ✋ Teleconsulta / Videoconsultas
- ✋ Farmacia integrada

Estas serán consideradas en la **Fase de Evolución a Microservicios**.

---

**Documento generado:** 25 de mayo de 2026  
**Para:** Proyecto PetCare - UNAP ASI 2026-I  
**Versión:** 2.0 — Plan de Evolución a Plataforma Escalable
