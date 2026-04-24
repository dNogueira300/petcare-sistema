import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export const LIMA_TZ = "America/Lima";

export function toLimaTime(date: Date | string): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  return toZonedTime(d, LIMA_TZ);
}

export function formatLima(
  date: Date | string,
  formatStr: string = "dd/MM/yyyy HH:mm"
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(toZonedTime(d, LIMA_TZ), formatStr);
}

export function hoyCimaFecha(): string {
  return format(toZonedTime(new Date(), LIMA_TZ), "yyyy-MM-dd");
}

export function ahoraLimaHora(): string {
  return format(toZonedTime(new Date(), LIMA_TZ), "HH:mm");
}

/**
 * Horario de atención:
 *   Lunes–Viernes: 07:00–13:00 y 15:00–20:00
 *   Sábado: 08:00–15:00
 *   Domingo: cerrado
 * Retorna todos los slots de 30 min para la fecha dada (yyyy-MM-dd).
 */
export function slotsDisponibles(fecha: string): string[] {
  const [y, mo, d] = fecha.split("-").map(Number);
  const dow = new Date(y, mo - 1, d).getDay(); // 0=Dom … 6=Sáb
  if (dow === 0) return [];

  const slots: string[] = [];
  const addRange = (sh: number, sm: number, eh: number, em: number) => {
    let h = sh, m = sm;
    while (h < eh || (h === eh && m <= em)) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      m += 30;
      if (m >= 60) { h++; m -= 60; }
    }
  };

  if (dow >= 1 && dow <= 5) {
    addRange(7, 0, 13, 0);
    addRange(15, 0, 20, 0);
  } else {
    addRange(8, 0, 15, 0);
  }
  return slots;
}

export function esDentroDeHorario(fecha: string, hora: string): boolean {
  return slotsDisponibles(fecha).includes(hora);
}
