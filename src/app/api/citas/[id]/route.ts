import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { hoyCimaFecha } from "@/utils/datetime";
import { slotsDisponiblesVet } from "@/lib/horarios";

const updateSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  hora: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
});

const estadoSchema = z.object({
  estado: z.enum(["pendiente", "confirmada", "cancelada", "atendida"]),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;

  const { data, error } = await createAdminClient()
    .from("citas")
    .select("*, mascotas(nombre, especie), veterinarios(usuarios(nombre, apellido))")
    .eq("id_cita", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const allowed = ["administrador", "recepcionista", "cliente"];
  if (!allowed.includes(session.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.fecha < hoyCimaFecha()) {
    return NextResponse.json({ error: "No se pueden mover citas a fechas pasadas" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: current } = await admin
    .from("citas")
    .select("id_cita, id_veterinario, fecha, hora, estado, mascotas(id_mascota, id_cliente)")
    .eq("id_cita", id)
    .single();

  if (!current) return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });

  // Verificar propiedad si es cliente
  if (session.rol === "cliente") {
    const { data: clienteData } = await admin
      .from("clientes")
      .select("id_cliente")
      .eq("id_usuario", session.id_usuario)
      .single();

    const mascota = current.mascotas as unknown as { id_mascota: number; id_cliente: number } | null;
    if (!clienteData || !mascota || mascota.id_cliente !== clienteData.id_cliente) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    if (!["pendiente", "confirmada"].includes(current.estado)) {
      return NextResponse.json(
        { error: "Solo puedes reprogramar citas pendientes o confirmadas" },
        { status: 400 }
      );
    }
  }

  if (current.estado === "cancelada") {
    return NextResponse.json({ error: "No se puede editar una cita cancelada" }, { status: 400 });
  }

  // No-op: misma fecha y hora
  const horaActual = (current.hora as string).slice(0, 5);
  if (!(current.fecha === parsed.data.fecha && horaActual === parsed.data.hora)) {
    const slots = await slotsDisponiblesVet(admin, current.id_veterinario as number, parsed.data.fecha);
    if (slots.length === 0) {
      return NextResponse.json({ error: "El veterinario no atiende ese día" }, { status: 400 });
    }
    if (!slots.includes(parsed.data.hora)) {
      return NextResponse.json({ error: "El horario seleccionado no está disponible" }, { status: 409 });
    }
  }

  const { data, error } = await admin
    .from("citas")
    .update({ fecha: parsed.data.fecha, hora: parsed.data.hora })
    .eq("id_cita", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = estadoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  if (session.rol === "cliente" && !["cancelada", "confirmada"].includes(parsed.data.estado)) {
    return NextResponse.json({ error: "Solo puedes cancelar o confirmar tus propias citas" }, { status: 403 });
  }

  const admin = createAdminClient();

  // El cliente solo puede confirmar citas en estado pendiente
  if (session.rol === "cliente" && parsed.data.estado === "confirmada") {
    const { data: citaCheck } = await admin
      .from("citas").select("estado").eq("id_cita", id).single();
    if (citaCheck && citaCheck.estado !== "pendiente") {
      return NextResponse.json({ error: "Solo puedes confirmar citas pendientes" }, { status: 400 });
    }
  }

  if (parsed.data.estado === "atendida") {
    const { data: citaInfo } = await admin
      .from("citas")
      .select("fecha")
      .eq("id_cita", id)
      .single();

    if (citaInfo && citaInfo.fecha >= hoyCimaFecha()) {
      return NextResponse.json(
        { error: "La cita aún no ha ocurrido. Solo se puede marcar como atendida después de la fecha programada." },
        { status: 400 }
      );
    }

    const { data: historia } = await admin
      .from("historia_clinica")
      .select("id_historia")
      .eq("id_cita", id)
      .maybeSingle();

    if (!historia) {
      return NextResponse.json(
        { error: "Debe registrar la historia clínica antes de marcar la cita como atendida." },
        { status: 400 }
      );
    }
  }

  // Obtener datos de la cita SIN depender de id_atencion_clinica
  // (esa columna puede no existir si la migración no se ejecutó aún)
  const { data: citaActual } = await admin
    .from("citas")
    .select("id_mascota, id_veterinario, motivo")
    .eq("id_cita", id)
    .single();

  const { data, error } = await admin
    .from("citas")
    .update({ estado: parsed.data.estado })
    .eq("id_cita", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ── Sincronizar atención clínica ──────────────────────────────────────────
  // Consulta directa a atenciones_clinicas por id_cita — no depende de la columna
  // id_atencion_clinica en citas (puede no existir si la migración no corrió).
  if (citaActual) {
    try {
      const { data: atencionExistente } = await admin
        .from("atenciones_clinicas")
        .select("id_atencion, estado_actual")
        .eq("id_cita", Number(id))
        .maybeSingle();

      if (parsed.data.estado === "confirmada" && !atencionExistente) {
        // Crear atención clínica al confirmar si no existe
        const { data: nueva } = await admin
          .from("atenciones_clinicas")
          .insert({
            id_cita:         Number(id),
            id_mascota:      citaActual.id_mascota,
            id_veterinario:  citaActual.id_veterinario,
            estado_actual:   "confirmada",
            motivo_consulta: citaActual.motivo ?? null,
            prioridad:       "normal",
          })
          .select("id_atencion")
          .single();

        if (nueva) {
          // Intentar vincular cita → atención (puede fallar si columna no existe)
          await admin
            .from("citas")
            .update({ id_atencion_clinica: nueva.id_atencion })
            .eq("id_cita", id);

          await admin.from("transiciones_estado").insert({
            id_atencion:     nueva.id_atencion,
            estado_anterior: "reservada",
            estado_nuevo:    "confirmada",
            id_usuario:      session.id_usuario,
            razon:           "Cita confirmada",
          });
        }
      } else if (parsed.data.estado === "cancelada" && atencionExistente) {
        // Cancelar la atención vinculada si no está ya en estado terminal
        if (!["finalizado","cancelada","no_asistio"].includes(atencionExistente.estado_actual)) {
          await admin
            .from("atenciones_clinicas")
            .update({ estado_actual: "cancelada", fecha_estado_actual: new Date().toISOString() })
            .eq("id_atencion", atencionExistente.id_atencion);

          await admin.from("transiciones_estado").insert({
            id_atencion:     atencionExistente.id_atencion,
            estado_anterior: atencionExistente.estado_actual,
            estado_nuevo:    "cancelada",
            id_usuario:      session.id_usuario,
            razon:           "Cita cancelada",
          });
        }
      }
    } catch {
      // La tabla atenciones_clinicas no existe aún (migración pendiente).
      // No bloquear el cambio de estado de la cita por esto.
    }
  }

  return NextResponse.json({ data });
}
