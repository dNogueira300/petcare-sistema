import { addDays, format, parseISO } from "date-fns";
import type { createAdminClient } from "@/utils/supabase/server";

/**
 * Calcula fecha_proxima_dosis sumando dias_refuerzo del esquema correspondiente.
 * Devuelve null si no existe un esquema para ese tipo de vacuna.
 */
export async function calcularProximaDosis(
  supabase: ReturnType<typeof createAdminClient>,
  tipoVacuna: string,
  fechaAplicacion: string,
): Promise<string | null> {
  const { data: esquema } = await supabase
    .from("esquemas_vacuna")
    .select("dias_refuerzo")
    .ilike("nombre_vacuna", tipoVacuna)
    .maybeSingle();
  if (!esquema) return null;
  return format(addDays(parseISO(fechaAplicacion), esquema.dias_refuerzo), "yyyy-MM-dd");
}
