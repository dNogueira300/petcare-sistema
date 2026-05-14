import { getISODay } from "date-fns";
import type { createAdminClient } from "@/utils/supabase/server";
import { slotsDisponibles as slotsPorDefecto } from "@/utils/datetime";

type Admin = ReturnType<typeof createAdminClient>;

function genFranja(inicio: string, fin: string): string[] {
  const [sh, sm] = inicio.slice(0, 5).split(":").map(Number);
  const [eh, em] = fin.slice(0, 5).split(":").map(Number);
  const out: string[] = [];
  let h = sh, m = sm;
  // El slot dura 30 min — sólo emite la hora de inicio si la cita cabe completa dentro de la franja.
  while (h < eh || (h === eh && m < em)) {
    out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += 30;
    if (m >= 60) { h++; m -= 60; }
  }
  return out;
}

/**
 * Slots disponibles (30 min) para un veterinario en una fecha "YYYY-MM-DD".
 * - Usa la tabla horarios_veterinario (turnos partidos soportados).
 * - Si el veterinario no tiene NINGÚN horario configurado, usa el horario por defecto.
 * - Si tiene horarios pero ninguno para ese día → [] (día libre).
 * - Excluye las horas con citas no canceladas.
 */
export async function slotsDisponiblesVet(
  supabase: Admin,
  idVeterinario: number,
  fecha: string,
): Promise<string[]> {
  const [y, mo, d] = fecha.split("-").map(Number);
  const diaSemana = getISODay(new Date(y, mo - 1, d)); // 1=Lunes … 7=Domingo

  const { data: horarios } = await supabase
    .from("horarios_veterinario")
    .select("dia_semana, hora_inicio, hora_fin")
    .eq("id_veterinario", idVeterinario);

  let base: string[];
  if (!horarios || horarios.length === 0) {
    base = slotsPorDefecto(fecha);
  } else {
    const delDia = horarios
      .filter((h: { dia_semana: number }) => h.dia_semana === diaSemana)
      .sort((a: { hora_inicio: string }, b: { hora_inicio: string }) => a.hora_inicio.localeCompare(b.hora_inicio));
    base = delDia.flatMap((h: { hora_inicio: string; hora_fin: string }) => genFranja(h.hora_inicio, h.hora_fin));
    base = Array.from(new Set(base)).sort();
  }

  if (base.length === 0) return [];

  const { data: citas } = await supabase
    .from("citas")
    .select("hora")
    .eq("id_veterinario", idVeterinario)
    .eq("fecha", fecha)
    .neq("estado", "cancelada");
  const ocupadas = new Set((citas ?? []).map((c: { hora: string }) => c.hora.slice(0, 5)));

  return base.filter((s) => !ocupadas.has(s));
}
