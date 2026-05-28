import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { TRANSICIONES_VALIDAS, type EstadoAtencion } from "@/types";

type Params = { params: Promise<{ id: string }> };

const transicionSchema = z.object({
  estado_nuevo: z.enum([
    "reservada","confirmada","espera","triaje","consulta",
    "hospitalizado","finalizado","seguimiento","no_asistio","cancelada",
  ]),
  razon: z.string().optional(),
  // Campos requeridos cuando estado_nuevo = "seguimiento"
  motivo_seguimiento:     z.string().min(3).optional(),
  fecha_sugerida_control: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session || !["administrador","veterinario","recepcionista"].includes(session.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body   = await req.json();
  const parsed = transicionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map(i => i.message).join(", ") },
      { status: 400 },
    );
  }

  // Validar campos de seguimiento
  if (parsed.data.estado_nuevo === "seguimiento") {
    if (!parsed.data.motivo_seguimiento?.trim()) {
      return NextResponse.json(
        { error: "El motivo del seguimiento es requerido" },
        { status: 400 },
      );
    }
    if (!parsed.data.fecha_sugerida_control) {
      return NextResponse.json(
        { error: "La fecha de control es requerida" },
        { status: 400 },
      );
    }
    const hoy = new Date().toISOString().slice(0, 10);
    if (parsed.data.fecha_sugerida_control <= hoy) {
      return NextResponse.json(
        { error: "La fecha de control debe ser futura" },
        { status: 400 },
      );
    }
  }

  const admin = createAdminClient();

  // Obtener datos completos de la atención para crear el seguimiento
  const { data: atencion, error: fetchError } = await admin
    .from("atenciones_clinicas")
    .select("id_atencion, estado_actual, id_mascota, id_veterinario, id_cita")
    .eq("id_atencion", id)
    .single();

  if (fetchError || !atencion) {
    return NextResponse.json({ error: "Atención no encontrada" }, { status: 404 });
  }

  const estadoActual = atencion.estado_actual as EstadoAtencion;
  const estadoNuevo  = parsed.data.estado_nuevo as EstadoAtencion;

  if (!TRANSICIONES_VALIDAS[estadoActual].includes(estadoNuevo)) {
    return NextResponse.json(
      { error: `No se puede pasar de "${estadoActual}" a "${estadoNuevo}"` },
      { status: 422 },
    );
  }

  const { data: updated, error: updateError } = await admin
    .from("atenciones_clinicas")
    .update({ estado_actual: estadoNuevo, fecha_estado_actual: new Date().toISOString() })
    .eq("id_atencion", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  await admin.from("transiciones_estado").insert({
    id_atencion:     Number(id),
    estado_anterior: estadoActual,
    estado_nuevo:    estadoNuevo,
    id_usuario:      session.id_usuario,
    razon:           parsed.data.razon ?? null,
  });

  // ── Crear seguimiento clínico automáticamente ─────────────────────────────
  if (estadoNuevo === "seguimiento" && parsed.data.motivo_seguimiento && parsed.data.fecha_sugerida_control) {
    // Buscar la historia clínica asociada a esta atención (via cita)
    let id_historia: number | null = null;

    if (atencion.id_cita) {
      const { data: hc } = await admin
        .from("historia_clinica")
        .select("id_historia")
        .eq("id_cita", atencion.id_cita)
        .maybeSingle();
      id_historia = hc?.id_historia ?? null;
    }

    // Si no hay HC directa por cita, buscar la más reciente de la mascota
    if (!id_historia) {
      const { data: hcReciente } = await admin
        .from("historia_clinica")
        .select("id_historia")
        .eq("id_mascota", atencion.id_mascota)
        .order("fecha_consulta", { ascending: false })
        .limit(1)
        .maybeSingle();
      id_historia = hcReciente?.id_historia ?? null;
    }

    if (id_historia) {
      const { data: segNuevo } = await admin
        .from("seguimientos_clinicos")
        .insert({
          id_historia_clinica:            id_historia,
          id_mascota:                     atencion.id_mascota,
          id_veterinario:                 atencion.id_veterinario,
          motivo_seguimiento:             parsed.data.motivo_seguimiento,
          fecha_sugerida_control:         parsed.data.fecha_sugerida_control,
          dias_anticipacion_recordatorio: 3,
          estado:                         "pendiente",
          observaciones:                  parsed.data.razon ?? null,
        })
        .select("id_seguimiento")
        .single();

      // Marcar la HC como pendiente de seguimiento
      if (segNuevo) {
        await admin
          .from("historia_clinica")
          .update({ estado_seguimiento: "pendiente_seguimiento" })
          .eq("id_historia", id_historia);
      }
    }
  }

  return NextResponse.json({ data: updated });
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const { data, error } = await createAdminClient()
    .from("transiciones_estado")
    .select("*, usuarios(nombre, apellido)")
    .eq("id_atencion", id)
    .order("fecha_transicion", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
