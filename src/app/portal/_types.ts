import type { EstadoCita, EstadoAtencion } from "@/types";

// ── Row types (API response shapes) ──────────────────────────────────────────
export interface MascotaRow {
  id_mascota: number;
  nombre: string;
  especie: string;
  raza: string | null;
  sexo: string | null;
  color: string | null;
  fecha_nacimiento: string | null;
  peso: number | null;
}

export interface CitaRow {
  id_cita: number;
  id_veterinario: number;
  fecha: string;
  hora: string;
  motivo: string;
  estado: EstadoCita;
  mascotas: { nombre: string; especie: string };
  veterinarios: { usuarios: { nombre: string; apellido: string } };
}

export interface HistoriaRow {
  id_historia: number;
  id_mascota: number;
  fecha_consulta: string;
  diagnostico: string;
  tratamiento: string;
  observaciones: string | null;
  peso_consulta: number | null;
  mascotas: { nombre: string };
  veterinarios: { usuarios: { nombre: string; apellido: string } };
}

export interface VetOption {
  id_veterinario: number;
  especialidad: string | null;   // campo legacy VARCHAR
  usuarios: { nombre: string; apellido: string };
  // Nuevas especialidades desde relación N:M (fase 3)
  veterinario_especialidad?: { especialidades: { nombre: string } | null }[];
}

/** Obtiene el texto de especialidades de un vet (N:M > legacy > vacío) */
export function vetEspecialidadLabel(v: VetOption): string {
  const esps = (v.veterinario_especialidad ?? [])
    .filter(ve => ve.especialidades)
    .map(ve => ve.especialidades!.nombre);
  if (esps.length > 0) return esps.join(", ");
  return v.especialidad ?? "";
}

export interface AlertaVacPortal {
  id_alerta: number;
  id_mascota: number;
  tipo_alerta: string;
  fecha_alerta: string;
  mascotas?: { nombre: string };
  cartilla_vacunacion?: {
    tipo_vacuna: string;
    fecha_proxima_dosis: string | null;
  };
}

export interface SeguimientoPortal {
  id_seguimiento: number;
  id_mascota: number;
  motivo_seguimiento: string;
  fecha_sugerida_control: string;
  estado: string;
  mascotas?: { nombre: string; especie: string };
  veterinarios?: { usuarios: { nombre: string; apellido: string } };
}

export interface AtencionPortal {
  id_atencion: number;
  id_mascota: number;
  estado_actual: EstadoAtencion;
  prioridad: string;
  mascotas?: { nombre: string };
}

export interface ServicioOpt {
  id_servicio: number;
  nombre: string;
  id_especialidad: number | null;
  duracion_estimada_min: number;
  precio_base: number | null;
  es_activo: boolean;
}

export interface ColaPortal {
  id_cola_espera: number;
  id_mascota: number;
  estado: string;
  mascotas?: { nombre: string; especie: string };
  fecha_registro: string;
}

// ── Tab type ──────────────────────────────────────────────────────────────────
export type Tab = "mascotas" | "citas" | "historial" | "seguimientos";

// ── Display constants ─────────────────────────────────────────────────────────
export const estadoLabels: Record<EstadoCita, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
  atendida: "Atendida",
};

export const estadoAtencionLabel: Partial<Record<EstadoAtencion, string>> = {
  espera: "En sala de espera",
  triaje: "En triaje",
  consulta: "En consulta",
  hospitalizado: "Hospitalizado",
};

export const estadoAtencionColor: Partial<Record<EstadoAtencion, string>> = {
  espera: "#d97706",
  triaje: "#7c3aed",
  consulta: "#0369a1",
  hospitalizado: "#b45309",
};

export const ESPECIE_ICONS: Record<string, string> = {
  Perro: "🐕",
  Gato: "🐈",
  Ave: "🦜",
  Conejo: "🐇",
  Reptil: "🦎",
  Otro: "🐾",
};

export const ESPECIE_OPTS = [
  "Perro",
  "Gato",
  "Ave",
  "Conejo",
  "Reptil",
  "Otro",
];

// ── Shared style factories ────────────────────────────────────────────────────
export const modalInputStyle = (): React.CSSProperties => ({
  height: "40px",
  width: "100%",
  borderRadius: "9px",
  border: "1.5px solid #d0c8b8",
  background: "#fdfaf5",
  padding: "0 12px",
  fontSize: "0.875rem",
  fontFamily: "var(--font-dm-sans)",
  color: "#1a1208",
  outline: "none",
});

export const modalLabelStyle = (): React.CSSProperties => ({
  fontSize: "0.72rem",
  fontWeight: 700,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  color: "#6b5c44",
  fontFamily: "var(--font-dm-sans)",
  display: "block",
  marginBottom: "5px",
});

// ── Helpers ───────────────────────────────────────────────────────────────────
export function calcEdad(fn: string | null): string {
  if (!fn) return "—";
  const [by, bm] = fn.split("-").map(Number);
  const now = new Date();
  let y = now.getFullYear() - by,
    m = now.getMonth() + 1 - bm;
  if (m < 0) {
    y--;
    m += 12;
  }
  return y > 0
    ? `${y} año${y !== 1 ? "s" : ""}`
    : `${m} mes${m !== 1 ? "es" : ""}`;
}

export function dateToStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
