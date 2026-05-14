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
  horario_fin: string;    // "HH:mm"
  usuario?: Usuario;
}

export interface Mascota {
  id_mascota: number;
  id_cliente: number;
  nombre: string;
  especie: string;
  raza: string | null;
  sexo: string | null;   // "macho" | "hembra"
  color: string | null;
  fecha_nacimiento: string | null; // "YYYY-MM-DD"
  peso: number | null;   // último peso conocido — el detalle por consulta vive en historia_clinica
  creado_en: string;
  cliente?: Cliente;
}

export interface Cita {
  id_cita: number;
  id_mascota: number;
  id_veterinario: number;
  fecha: string;       // "YYYY-MM-DD"
  hora: string;        // "HH:mm"
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
  hora_fin: string;    // "HH:mm"
}

export const DIA_SEMANA_LABEL: Record<number, string> = {
  1: "Lunes", 2: "Martes", 3: "Miércoles",
  4: "Jueves", 5: "Viernes", 6: "Sábado", 7: "Domingo",
};

// ─── A.1 — Cartilla de vacunación ────────────────────────────────────────────
export interface CartillaVacunacion {
  id: number;
  id_mascota: number;
  tipo_vacuna: string;
  fecha_aplicacion: string;        // "YYYY-MM-DD"
  fecha_proxima_dosis: string | null;
  lote: string | null;
  id_veterinario: number | null;
  observaciones: string | null;
  frecuencia: "unica" | "semanal" | "21dias" | "mensual" | "trimestral" | "semestral" | "anual" | null;
  creado_en: string;
  veterinario?: Pick<Veterinario, "id_veterinario"> & { usuario: Pick<Usuario, "nombre" | "apellido"> };
}

export interface EsquemaVacuna {
  id: number;
  nombre_vacuna: string;
  dias_refuerzo: number;
  descripcion: string | null;
}

export interface HistoriaClinica {
  id_historia: number;
  id_cita: number | null;   // las entradas de vacunación pueden no tener cita asociada
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
