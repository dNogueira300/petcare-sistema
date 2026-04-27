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
  fecha_nacimiento: string | null; // "YYYY-MM-DD"
  peso: number | null;
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
  id_cita: number;
  canal: "email" | "whatsapp";
  enviado_en: string;
  estado: "enviado" | "fallido";
  detalle: string | null;
}

export interface HistoriaClinica {
  id_historia: number;
  id_cita: number;
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
  fecha_nacimiento?: string;
  peso?: number;
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
