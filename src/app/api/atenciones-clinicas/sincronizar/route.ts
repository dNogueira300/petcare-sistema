import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

/**
 * POST /api/atenciones-clinicas/sincronizar
 *
 * Crea atenciones_clinicas para citas confirmadas o atendidas que aún
 * no tienen una atención asociada. Útil para migrar datos existentes
 * después de ejecutar la migración de Fase 1.
 *
 * Solo accesible para administradores.
 */
export async function POST() {
  const session = await getSessionUser();
  if (!session || session.rol !== "administrador") {
    return NextResponse.json({ error: "Solo el administrador puede sincronizar" }, { status: 403 });
  }

  const admin = createAdminClient();

  // Buscar citas sin atención clínica
  const { data: citas, error: fetchError } = await admin
    .from("citas")
    .select("id_cita, id_mascota, id_veterinario, motivo, estado, creado_en")
    .is("id_atencion_clinica", null)
    .in("estado", ["confirmada", "atendida", "cancelada"]);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!citas || citas.length === 0) {
    return NextResponse.json({ creadas: 0, mensaje: "No hay citas pendientes de sincronizar" });
  }

  let creadas = 0;
  const errores: string[] = [];

  for (const cita of citas) {
    const estadoAtencion =
      cita.estado === "atendida"  ? "finalizado" :
      cita.estado === "cancelada" ? "cancelada"  :
      "confirmada";

    const { data: nueva, error: insertError } = await admin
      .from("atenciones_clinicas")
      .insert({
        id_cita:         cita.id_cita,
        id_mascota:      cita.id_mascota,
        id_veterinario:  cita.id_veterinario,
        estado_actual:   estadoAtencion,
        motivo_consulta: cita.motivo ?? null,
        prioridad:       "normal",
        fecha_inicio:    cita.creado_en,
      })
      .select("id_atencion")
      .single();

    if (insertError || !nueva) {
      errores.push(`Cita #${cita.id_cita}: ${insertError?.message ?? "Error desconocido"}`);
      continue;
    }

    // Vincular cita → atención
    await admin
      .from("citas")
      .update({ id_atencion_clinica: nueva.id_atencion })
      .eq("id_cita", cita.id_cita);

    // Registrar transición inicial en auditoría
    await admin.from("transiciones_estado").insert({
      id_atencion:     nueva.id_atencion,
      estado_anterior: "reservada",
      estado_nuevo:    estadoAtencion,
      id_usuario:      session.id_usuario,
      razon:           "Sincronización automática desde cita existente",
    });

    creadas++;
  }

  return NextResponse.json({
    creadas,
    total_revisadas: citas.length,
    errores: errores.length > 0 ? errores : undefined,
    mensaje: `${creadas} atención(es) clínica(s) creada(s) desde citas existentes`,
  });
}
