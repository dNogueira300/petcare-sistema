import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { hoyCimaFecha, esDentroDeHorario } from "@/utils/datetime";

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
  if (!session || !["administrador", "recepcionista"].includes(session.rol)) {
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

  if (!esDentroDeHorario(parsed.data.fecha, parsed.data.hora)) {
    return NextResponse.json(
      { error: "Horario fuera del horario de atención (Lun–Vie 7–13h y 15–20h, Sáb 8–15h, Dom cerrado)" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Obtener la cita actual para saber el veterinario asignado
  const { data: current } = await admin
    .from("citas")
    .select("id_veterinario, estado")
    .eq("id_cita", id)
    .single();

  if (!current) return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  if (current.estado === "cancelada") {
    return NextResponse.json({ error: "No se puede editar una cita cancelada" }, { status: 400 });
  }

  // Verificar disponibilidad excluyendo esta misma cita
  const { data: conflict } = await admin
    .from("citas")
    .select("id_cita")
    .eq("id_veterinario", current.id_veterinario)
    .eq("fecha", parsed.data.fecha)
    .eq("hora", parsed.data.hora)
    .neq("estado", "cancelada")
    .neq("id_cita", id)
    .maybeSingle();

  if (conflict) {
    return NextResponse.json({ error: "El veterinario ya tiene una cita en ese horario" }, { status: 409 });
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

  if (session.rol === "cliente" && parsed.data.estado !== "cancelada") {
    return NextResponse.json({ error: "Solo puedes cancelar citas" }, { status: 403 });
  }

  const { data, error } = await createAdminClient()
    .from("citas")
    .update({ estado: parsed.data.estado })
    .eq("id_cita", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
