import { addDays, format, parseISO } from "date-fns";

export type Frecuencia =
  | "unica"
  | "semanal"
  | "21dias"
  | "mensual"
  | "trimestral"
  | "semestral"
  | "anual";

export const FRECUENCIA_DIAS: Record<Exclude<Frecuencia, "unica">, number> = {
  semanal: 7,
  "21dias": 21,
  mensual: 30,
  trimestral: 90,
  semestral: 180,
  anual: 365,
};

export const FRECUENCIA_LABEL: Record<Frecuencia, string> = {
  unica: "Única",
  semanal: "Semanal",
  "21dias": "Cada 21 días",
  mensual: "Mensual",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

export const FRECUENCIA_OPTIONS: { value: Frecuencia; label: string }[] = (
  Object.keys(FRECUENCIA_LABEL) as Frecuencia[]
).map((v) => ({ value: v, label: FRECUENCIA_LABEL[v] }));

/**
 * Próxima dosis según frecuencia. null si es "única" o no hay frecuencia.
 */
export function proximaDosisDesdeFrecuencia(
  fechaAplicacion: string,
  frecuencia: Frecuencia | null | undefined,
): string | null {
  if (!frecuencia || frecuencia === "unica") return null;
  const dias = FRECUENCIA_DIAS[frecuencia];
  return format(addDays(parseISO(fechaAplicacion), dias), "yyyy-MM-dd");
}
