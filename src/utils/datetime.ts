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
