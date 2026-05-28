// ─── Roles del sistema ───────────────────────────────────────────────────────
export type Rol = "administrador" | "veterinario" | "recepcionista" | "cliente";

export type EstadoCita = "pendiente" | "confirmada" | "cancelada" | "atendida";
export type OrigenCita = "interno" | "portal";

// ─── Entidades base ──────────────────────────────────────────────────────────
export interface Usuario {
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  contrasena_hash: string;
  rol: Rol;
  activo: boolean;
  creado_en: string; // ISO string — siempre convertir a Lima/Perú al mostrar
  correo_verificado: boolean;
  token_verificacion?: string | null;
  token_expira?: string | null;
}

export interface Cliente {
  id_cliente: number;
  id_usuario: number;
  telefono: string;
  direccion: string | null;
  usuario?: Usuario;
}

export interface Veterinario {
  id_veterinario: number;
  id_usuario: number;
  especialidad: string | null;
  horario_inicio: string; // "HH:mm"
  horario_fin: string; // "HH:mm"
  usuario?: Usuario;
}

export interface Mascota {
  id_mascota: number;
  id_cliente: number;
  nombre: string;
  especie: string;
  raza: string | null;
  sexo: string | null; // "macho" | "hembra"
  color: string | null;
  fecha_nacimiento: string | null; // "YYYY-MM-DD"
  peso: number | null; // último peso conocido — el detalle por consulta vive en historia_clinica
  creado_en: string;
  cliente?: Cliente;
}

export interface Cita {
  id_cita: number;
  id_mascota: number;
  id_veterinario: number;
  fecha: string; // "YYYY-MM-DD"
  hora: string; // "HH:mm"
  motivo: string;
  estado: EstadoCita;
  origen: OrigenCita;
  observaciones: string | null;
  creado_en: string;
  mascota?: Mascota;
  veterinario?: Veterinario;
}

export interface RecordatorioEnviado {
  id: number;
  id_cita: number | null;
  canal: "email" | "whatsapp";
  enviado_en: string;
  estado: "enviado" | "fallido";
  detalle: string | null;
  tipo: "cita" | "vacuna" | "seguimiento";
  id_vacuna?: number | null;
}

// ─── A.2 — Horarios semanales por veterinario ────────────────────────────────
export type DiaSemana = 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1=Lunes … 7=Domingo

export interface HorarioVeterinario {
  id: number;
  id_veterinario: number;
  dia_semana: DiaSemana;
  hora_inicio: string; // "HH:mm"
  hora_fin: string; // "HH:mm"
}

export const DIA_SEMANA_LABEL: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

// ─── A.1 — Cartilla de vacunación ────────────────────────────────────────────
export interface CartillaVacunacion {
  id: number;
  id_mascota: number;
  tipo_vacuna: string;
  fecha_aplicacion: string; // "YYYY-MM-DD"
  fecha_proxima_dosis: string | null;
  lote: string | null;
  id_veterinario: number | null;
  observaciones: string | null;
  frecuencia:
    | "unica"
    | "semanal"
    | "21dias"
    | "mensual"
    | "trimestral"
    | "semestral"
    | "anual"
    | null;
  creado_en: string;
  veterinario?: Pick<Veterinario, "id_veterinario"> & {
    usuario: Pick<Usuario, "nombre" | "apellido">;
  };
}

export interface EsquemaVacuna {
  id: number;
  nombre_vacuna: string;
  dias_refuerzo: number;
  descripcion: string | null;
}

export interface HistoriaClinica {
  id_historia: number;
  id_cita: number | null; // las entradas de vacunación pueden no tener cita asociada
  id_mascota: number;
  id_veterinario: number;
  fecha_consulta: string; // "YYYY-MM-DD"
  diagnostico: string;
  tratamiento: string;
  observaciones: string | null;
  peso_consulta: number | null;
  mascota?: Mascota;
  veterinario?: Veterinario;
  cita?: Cita;
}

// ─────────────────────────────────────────────────────────────────────────────
// FASE 1 — Atención Clínica y Máquina de Estados
// ─────────────────────────────────────────────────────────────────────────────
export type EstadoAtencion =
  | "reservada"
  | "confirmada"
  | "espera"
  | "triaje"
  | "consulta"
  | "hospitalizado"
  | "finalizado"
  | "seguimiento"
  | "no_asistio"
  | "cancelada";

export type PrioridadAtencion = "normal" | "urgente";

export interface AtencionClinica {
  id_atencion: number;
  id_cita: number | null;
  id_mascota: number;
  id_veterinario: number;
  estado_actual: EstadoAtencion;
  fecha_inicio: string;
  fecha_estado_actual: string;
  motivo_consulta: string | null;
  observaciones: string | null;
  prioridad: PrioridadAtencion;
  creado_en: string;
  // Supabase join fields — los nombres coinciden con las tablas (plural)
  mascotas?: {
    nombre: string;
    especie: string;
    clientes?: { usuarios?: { nombre: string; apellido: string } };
  };
  veterinarios?: { usuarios?: { nombre: string; apellido: string } };
  // join via atenciones_clinicas_id_cita_fkey — hora = hora agendada de la cita
  citas?: { fecha: string; hora: string; motivo: string } | null;
}

export interface TransicionEstado {
  id_transicion: number;
  id_atencion: number;
  estado_anterior: EstadoAtencion;
  estado_nuevo: EstadoAtencion;
  fecha_transicion: string;
  id_usuario: number;
  razon: string | null;
  usuario?: Pick<Usuario, "nombre" | "apellido">;
}

/** Transiciones válidas por estado */
export const TRANSICIONES_VALIDAS: Record<EstadoAtencion, EstadoAtencion[]> = {
  reservada: ["confirmada", "cancelada"],
  confirmada: ["espera", "no_asistio", "cancelada"],
  espera: ["triaje", "cancelada"],
  triaje: ["consulta", "cancelada"],
  consulta: ["finalizado", "hospitalizado", "seguimiento", "cancelada"],
  hospitalizado: ["finalizado", "seguimiento", "cancelada"],
  seguimiento: ["finalizado", "cancelada"],
  finalizado: [],
  no_asistio: [],
  cancelada: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// FASE 2 — Módulo Triaje
// ─────────────────────────────────────────────────────────────────────────────
export type NivelUrgencia = "normal" | "urgente" | "emergencia";
export type EstadoTriaje = "completado" | "incompleto" | "cancelado";

export interface Triaje {
  id_triaje: number;
  id_atencion: number;
  id_mascota: number;
  id_recepcionista: number;
  fecha_triaje: string;
  peso: number | null;
  temperatura: number | null;
  frecuencia_cardiaca: number | null;
  frecuencia_respiratoria: number | null;
  observaciones_iniciales: string | null;
  nivel_urgencia: NivelUrgencia;
  razon_urgencia: string | null;
  sintomas_reportados: string | null;
  estado: EstadoTriaje;
  notas_medico: string | null;
  creado_en: string;
  recepcionista?: Pick<Usuario, "nombre" | "apellido">;
}

export interface EsquemaTriajeMascota {
  id_esquema: number;
  especie: string;
  rango_peso_min: number | null;
  rango_peso_max: number | null;
  temp_normal_min: number | null;
  temp_normal_max: number | null;
  fc_normal_min: number | null;
  fc_normal_max: number | null;
  fr_normal_min: number | null;
  fr_normal_max: number | null;
  observaciones: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// FASE 3 — Especialidades y Servicios Médicos
// ─────────────────────────────────────────────────────────────────────────────
export interface Especialidad {
  id_especialidad: number;
  nombre: string;
  descripcion: string | null;
  es_activa: boolean;
  creado_en: string;
}

export interface VeterinarioEspecialidad {
  id: number;
  id_veterinario: number;
  id_especialidad: number;
  es_especialidad_primaria: boolean;
  anos_experiencia: number | null;
  creado_en: string;
  especialidad?: Especialidad;
}

export interface ServicioMedico {
  id_servicio: number;
  nombre: string;
  id_especialidad: number | null;
  id_recurso_requerido: number | null;
  descripcion: string | null;
  duracion_estimada_min: number;
  precio_base: number | null;
  es_activo: boolean;
  creado_en: string;
  especialidad?: Especialidad;
  recurso?: { nombre: string; tipo_recurso: string } | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// FASE 4 — Auditoría Clínica
// ─────────────────────────────────────────────────────────────────────────────
export interface AuditoriaHistoriaClinica {
  id_auditoria: number;
  id_historia: number;
  id_usuario: number;
  tipo_cambio: "INSERT" | "UPDATE";
  timestamp_cambio: string;
  diagnostico_anterior: string | null;
  diagnostico_nuevo: string | null;
  tratamiento_anterior: string | null;
  tratamiento_nuevo: string | null;
  observaciones_anterior: string | null;
  observaciones_nuevo: string | null;
  peso_anterior: number | null;
  peso_nuevo: number | null;
  razon_cambio: string | null;
  usuario?: Pick<Usuario, "nombre" | "apellido" | "rol">;
}

// ─────────────────────────────────────────────────────────────────────────────
// FASE 5 — Gestión de Recursos
// ─────────────────────────────────────────────────────────────────────────────
export type TipoRecurso =
  | "consultorio"
  | "quirofano"
  | "equipo"
  | "jaula_hospitalizacion";

export interface Recurso {
  id_recurso: number;
  nombre: string;
  tipo_recurso: TipoRecurso;
  descripcion: string | null;
  capacidad: number;
  ubicacion: string | null;
  notas_mantenimiento: string | null;
  activo: boolean;
  creado_en: string;
}

export interface RecursoDisponibilidad {
  id_disponibilidad: number;
  id_recurso: number;
  dia_semana: DiaSemana;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
}

export interface CitaRecurso {
  id_cita_recurso: number;
  id_cita: number;
  id_recurso: number;
  duracion_reserva_minutos: number;
  creado_en: string;
  recurso?: Recurso;
}

// ─────────────────────────────────────────────────────────────────────────────
// FASE 6 — Cartilla de Vacunación Completa
// ─────────────────────────────────────────────────────────────────────────────
export type TipoAlertaVacunacion =
  | "vencida"
  | "proximo_refuerzo"
  | "incompleta";
export type EstadoAlertaVacunacion =
  | "activa"
  | "enviada"
  | "completada"
  | "ignorada";
export type CategoriaVacuna = "obligatoria" | "recomendada" | "opcional";

export interface AlertaVacunacion {
  id_alerta: number;
  id_mascota: number;
  id_vacuna: number;
  tipo_alerta: TipoAlertaVacunacion;
  fecha_alerta: string;
  dias_anticipacion: number;
  estado: EstadoAlertaVacunacion;
  creado_en: string;
  mascotas?: {
    nombre: string;
    especie: string;
    clientes?: {
      usuarios?: { nombre: string; apellido: string; correo: string };
    };
  };
  cartilla_vacunacion?: {
    tipo_vacuna: string;
    fecha_proxima_dosis: string | null;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// FASE 7 — Seguimiento Clínico
// ─────────────────────────────────────────────────────────────────────────────
export type EstadoSeguimiento =
  | "pendiente"
  | "sugerencia_enviada"
  | "cita_agendada"
  | "completado"
  | "no_presentado"
  | "cancelado";

export type EstadoSeguimientoHC =
  | "sin_seguimiento"
  | "pendiente_seguimiento"
  | "seguimiento_completado";

export interface SeguimientoClinico {
  id_seguimiento: number;
  id_historia_clinica: number;
  id_mascota: number;
  id_veterinario: number;
  motivo_seguimiento: string;
  fecha_sugerida_control: string;
  dias_anticipacion_recordatorio: number;
  estado: EstadoSeguimiento;
  observaciones: string | null;
  id_cita_sugerida: number | null;
  creado_en: string;
  mascotas?: {
    nombre: string;
    especie: string;
    clientes?: { usuarios?: { nombre: string; apellido: string } };
  };
  veterinarios?: { usuarios?: { nombre: string; apellido: string } };
  historia_clinica?: { diagnostico: string; fecha_consulta: string };
}

// ─────────────────────────────────────────────────────────────────────────────
// FASE 8 — Manejo de Excepciones
// ─────────────────────────────────────────────────────────────────────────────
export type RazonIndisponibilidad =
  | "enfermedad"
  | "vacaciones"
  | "capacitacion"
  | "emergencia"
  | "otro";

export interface Indisponibilidad {
  id_indisponibilidad: number;
  id_veterinario: number;
  fecha_inicio: string;
  fecha_fin: string;
  razon: RazonIndisponibilidad;
  justificacion: string | null;
  creado_por: number;
  notificaciones_enviadas: boolean;
  creado_en: string;
  veterinarios?: { usuarios?: { nombre: string; apellido: string } };
  citasAfectadas?: number;
}

export type EstadoColaEspera =
  | "activa"
  | "oferecido_horario"
  | "agendada"
  | "cancelada";

export interface ColaEspera {
  id_cola_espera: number;
  id_mascota: number;
  id_cliente: number;
  motivo: string;
  fecha_registro: string;
  preferencia_fecha: string | null;
  preferencia_veterinario: number | null;
  estado: EstadoColaEspera;
  creado_en: string;
  mascotas?: { nombre: string; especie: string };
  clientes?: { usuarios?: { nombre: string; apellido: string } };
}

export type TipoExcepcionCita =
  | "veterinario_inactivo"
  | "cliente_inactivo"
  | "emergencia"
  | "reprogramacion"
  | "cancelacion_cliente";

export interface ExcepcionCita {
  id_excepcion: number;
  id_cita: number;
  tipo_excepcion: TipoExcepcionCita;
  razon: string;
  id_cita_nueva: number | null;
  estado_notificacion: "pendiente" | "enviada" | "cliente_acepto";
  creado_por: number;
  creado_en: string;
  citas?: { fecha: string; hora: string; motivo: string };
}

// ─────────────────────────────────────────────────────────────────────────────
// FASE 9 — Archivos en Historia Clínica
// ─────────────────────────────────────────────────────────────────────────────
export type TipoArchivo =
  | "radiografia"
  | "ecografia"
  | "fotografia"
  | "laboratorio"
  | "receta"
  | "otro";

export interface ArchivoHistoriaClinica {
  id_archivo: number;
  id_historia: number;
  id_mascota: number;
  tipo_archivo: TipoArchivo;
  nombre_original: string;
  path_storage: string;
  tamano_bytes: number;
  mime_type: string;
  url_publica: string | null;
  fecha_carga: string;
  subido_por: number;
  usuario?: Pick<Usuario, "nombre" | "apellido">;
}

// ─────────────────────────────────────────────────────────────────────────────
// FASE 10 — Analítica Operacional
// ─────────────────────────────────────────────────────────────────────────────
export interface MetricaDiaria {
  id_metrica: number;
  fecha: string;
  total_citas_agendadas: number;
  total_citas_completadas: number;
  total_citas_canceladas: number;
  total_citas_no_asistio: number;
  total_clientes_nuevos: number;
  total_mascotas_nuevas: number;
  promedio_tiempo_atencion: number | null;
  veterinario_mas_solicitado: string | null;
  hora_pico: string | null;
  vacunas_aplicadas: number;
  historias_registradas: number;
  seguimientos_pendientes: number;
  alertas_vacunas_activas: number;
  calculado_en: string;
}

// ─── DTOs para formularios ───────────────────────────────────────────────────
export interface LoginDTO {
  correo: string;
  contrasena: string;
}

export interface CrearCitaDTO {
  id_mascota: number;
  id_veterinario: number;
  fecha: string;
  hora: string;
  motivo: string;
  observaciones?: string;
}

export interface CrearClienteDTO {
  nombre: string;
  apellido: string;
  correo: string;
  contrasena: string;
  telefono: string;
  direccion?: string;
}

export interface CrearMascotaDTO {
  id_cliente: number;
  nombre: string;
  especie: string;
  raza?: string;
  sexo?: "macho" | "hembra";
  color?: string;
  fecha_nacimiento?: string;
}

export interface CrearHistoriaClinicaDTO {
  id_cita: number;
  id_mascota: number;
  id_veterinario: number;
  fecha_consulta: string;
  diagnostico: string;
  tratamiento: string;
  observaciones?: string;
  peso_consulta?: number;
}
