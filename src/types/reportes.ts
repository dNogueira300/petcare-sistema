import type { EstadoCita } from "@/types";

export interface ReportFilters {
  desde: string;
  hasta: string;
  estado: string;
  id_veterinario: string;
}

export interface Resumen {
  total: number;
  por_estado: Record<string, number>;
  total_clientes: number;
  total_mascotas: number;
}

export interface VetRow {
  nombre: string;
  total: number;
  atendidas: number;
  canceladas: number;
}

export interface DiaRow { dia: string; cantidad: number; }
export interface EspecieRow { especie: string; cantidad: number; }

export interface CitaDetalle {
  id_cita: number;
  fecha: string;
  hora: string;
  motivo: string;
  estado: EstadoCita;
  mascotas: {
    nombre: string;
    especie: string;
    clientes: { usuarios: { nombre: string; apellido: string } } | null;
  } | null;
  veterinarios: { usuarios: { nombre: string; apellido: string } } | null;
}

export interface OrigenRow { origen: string; cantidad: number; }

export interface ReportData {
  resumen: Resumen;
  por_veterinario: VetRow[];
  por_dia: DiaRow[];
  por_especie: EspecieRow[];
  por_origen: OrigenRow[];
  citas: CitaDetalle[];
}

export interface VetOption {
  id_veterinario: number;
  usuarios: { nombre: string; apellido: string };
}
