# Informe Ejecutivo — PetCare Sistema
## Transformación Digital de Clínica Veterinaria

**Proyecto:** PetCare — Plataforma de Gestión Clínica Veterinaria  
**Institución:** Universidad Nacional de la Amazonía Peruana · ASI 2026-I  
**Fecha:** Mayo 2026  
**Estado:** ✅ Sistema en producción — Fases 1 a 10 completadas

---

## Resumen Ejecutivo

PetCare evolucionó de un sistema básico de agendamiento de citas a una **plataforma clínica veterinaria completa**. Durante este período se implementaron 10 fases de desarrollo que cubren la totalidad del flujo clínico — desde que el paciente llega a la clínica hasta su seguimiento post-consulta — incluyendo un portal de autoservicio para los dueños de mascotas.

El sistema está activo, con base de datos configurada y listo para uso en producción.

---

## ¿Qué se construyó?

### Antes del proyecto

El sistema permitía únicamente:
- Registrar citas
- Ver un historial básico
- Descargar cartilla de vacunación en PDF

### Después del proyecto

El sistema ahora gestiona el **ciclo de vida médico completo** de cada paciente:

---

## Logros por área

### 🏥 Flujo Clínico Digitalizado

El proceso de atención ahora está completamente registrado en el sistema. Cuando una mascota llega a la clínica, el personal puede seguir y registrar cada etapa:

```
Cita agendada → Paciente llega → Triaje → Consulta → Finalizado
                                                    → Hospitalizado
                                                    → Seguimiento programado
```

El sistema valida que no se salten pasos y registra quién realizó cada acción y cuándo.

---

### 📋 Módulo de Triaje

Antes de que el veterinario atienda, recepción puede registrar:
- **Signos vitales**: peso, temperatura, frecuencia cardiaca y respiratoria
- **Nivel de urgencia**: Normal, Urgente o Emergencia
- **Síntomas iniciales** del paciente

El sistema avisa automáticamente si algún signo vital está fuera del rango normal para la especie. Las emergencias pueden ser priorizadas sobre otras consultas.

---

### 👨‍⚕️ Gestión de Especialidades y Servicios

- Catálogo de **10 especialidades médicas** con asignación flexible a veterinarios (un veterinario puede tener varias)
- Catálogo de **10 servicios médicos** con precio referencial, duración estimada y recurso físico requerido
- Al agendar una cita, el cliente puede seleccionar el servicio y el sistema muestra el veterinario adecuado para ese servicio

---

### 🔍 Auditoría Clínica

Cada modificación a una historia clínica queda registrada automáticamente:
- Quién la modificó y cuándo
- Qué campos cambiaron (valor anterior vs. nuevo)
- Razón del cambio (opcional pero trazable)

Esto protege la integridad de los registros médicos y da cumplimiento a estándares de documentación clínica.

---

### 🏢 Gestión de Recursos Físicos

La clínica puede registrar y administrar sus recursos:
- Consultorios, quirófanos, equipos y jaulas de hospitalización
- Cada servicio médico puede tener un recurso requerido (ej: cirugía → quirófano)
- Al ver un servicio, el sistema muestra qué recurso necesita y por cuánto tiempo

---

### 💉 Vacunación Completa y Alertas

- Registro de vacunas con control de **número de lote y fecha de vencimiento del lote**
  - El sistema bloquea registrar una vacuna con lote vencido
- **Alertas automáticas** generadas 7 días antes de cada próxima dosis
- El cliente recibe aviso en su portal cuando una vacuna de su mascota está próxima a vencer

---

### 🔄 Seguimiento Clínico Post-Consulta

El veterinario puede programar controles al finalizar una consulta:
- Se especifica el motivo y la fecha sugerida del control
- El sistema envía un recordatorio automático al cliente 3 días antes
- El módulo muestra todos los seguimientos pendientes con estado actualizable: pendiente → citado → completado

---

### ⚠️ Gestión de Excepciones Operativas

- **Indisponibilidad de veterinarios**: el administrador puede bloquear la agenda de un veterinario por enfermedad, vacaciones o capacitación. El sistema identifica automáticamente las citas afectadas.
- **Lista de espera**: cuando no hay horarios disponibles, el cliente puede inscribirse y será notificado cuando haya disponibilidad.

---

### 📁 Expediente Médico Digital

Las historias clínicas ahora pueden incluir archivos adjuntos:
- Radiografías, ecografías, fotografías de lesiones, resultados de laboratorio, recetas
- Hasta 50 MB por archivo
- Almacenado de forma segura en la nube (Supabase Storage)
- El veterinario y el cliente pueden visualizar y descargar los archivos

---

### 📊 Panel de Analítica para la Dirección

Dashboard exclusivo para administradores con datos actualizados de:
- Total de citas, tasa de asistencia, tasa de cancelación
- Veterinario más solicitado y horas pico
- Distribución por especie de pacientes
- Evolución semanal de la actividad clínica
- Estado de seguimientos y triajes por urgencia
- Exportación de datos en formato CSV para análisis externo

---

## Portal del Cliente

Los dueños de mascotas acceden a su propio espacio en `petcare.pe/portal` donde pueden:

| Acción | Descripción |
|--------|-------------|
| 📅 Agendar citas | Seleccionando servicio, veterinario y horario disponible |
| ✅ Confirmar asistencia | Desde el portal o desde el link del correo de recordatorio |
| 🔄 Reprogramar | Si necesitan cambiar fecha u hora |
| 🐾 Ver el estado de su mascota | Si está en triaje, consulta o en espera en tiempo real |
| 📋 Seguimientos pendientes | Ver y agendar controles que el veterinario programó |
| 💉 Alertas de vacunación | Notificaciones cuando una vacuna está próxima a vencer |
| 📁 Archivos médicos | Ver y descargar radiografías y resultados (solo lectura) |
| ⏳ Lista de espera | Inscribirse si no hay turnos disponibles |

### Confirmación de cita — flujo digital

```
Recordatorio llega por correo (24h antes)
    ↓
Botón "✅ Confirmar mi asistencia" en el correo
    ↓
Redirecciona al portal → cita confirmada automáticamente

También puede confirmar:
• Directamente desde "Mis citas" en el portal
• El recepcionista lo confirma cuando el cliente llega
```

---

## Estado del Proyecto

| Área | Estado |
|------|--------|
| Base de datos | ✅ Migraciones ejecutadas |
| Backend (APIs) | ✅ Operativo |
| Módulos del sistema interno | ✅ Operativo |
| Portal del cliente | ✅ Operativo |
| Almacenamiento de archivos (Storage) | ✅ Configurado |
| Correos automáticos | ✅ Activos (Brevo) |
| Recordatorios y alertas (cron diario) | ✅ Activo (Vercel) |
| Analítica | ✅ Operativo |

---

## Qué viene después

Las siguientes funcionalidades están planificadas para una próxima etapa, priorizadas por valor al negocio:

### Alta prioridad
- **Pagos en línea** — integración con Stripe o Mercado Pago para cobrar citas de forma digital, reduciendo el manejo de efectivo
- **Notificación automática de lista de espera** — avisar al cliente por correo cuando se libera un turno que le corresponde

### Media prioridad
- **Recordatorios por WhatsApp** — además del correo, notificar vía WhatsApp Business (mayor tasa de apertura)
- **Exportar analítica en PDF** — para presentar informes mensuales a directivos sin necesidad de Excel

### Largo plazo
- **App móvil** — versión nativa del portal del cliente para iOS y Android
- **IA asistida** — sugerencias de diagnóstico basadas en historial clínico y análisis de radiografías

---

## Impacto esperado en la operación

| Indicador | Antes | Después |
|-----------|-------|---------|
| Registro de atención | Manual en papel / Excel | 100% digital con trazabilidad |
| Tiempo de triaje documentado | No registrado | Registrado con signos vitales |
| Seguimiento post-consulta | Sin sistema formal | Programado y notificado automáticamente |
| Acceso del cliente a su historial | Solo en visita presencial | 24/7 desde cualquier dispositivo |
| Control de vencimiento de vacunas | Responsabilidad del dueño | Sistema alerta automáticamente |
| Reportes de gestión | Elaborados manualmente | Generados en segundos con gráficos |

---

*Informe ejecutivo — PetCare Sistema*  
*UNAP · Escuela de Sistemas · ASI 2026-I*
