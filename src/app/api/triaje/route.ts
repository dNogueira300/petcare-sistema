import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

const createSchema = z.object({
  id_atencion: z.number().int().positive(),
  id_mascota: z.number().int().positive(),
  peso: z.number().positive().optional(),
  temperatura: z.number().optional(),
  frecuencia_cardiaca: z.number().int().positive().optional(),
  frecuencia_respiratoria: z.number().int().positive().optional(),
  observaciones_iniciales: z.string().optional(),
  nivel_urgencia: z.enum(["normal", "urgente", "emergencia"]).default("normal"),
  razon_urgencia: z.string().optional(),
  sintomas_reportados: z.string().optional(),
  estado: z
    .enum(["completado", "incompleto", "cancelado"])
    .default("completado"),
});

const TRIAJE_ROLES = ["administrador", "recepcionista", "veterinario"];

export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id_atencion = searchParams.get("id_atencion");
  const id_mascota = searchParams.get("id_mascota");

  const supabase = createAdminClient();
  let query = supabase
    .from("triaje")
    .select("*, usuarios!triaje_id_recepcionista_fkey(nombre, apellido), mascotas(nombre, especie)")
    .order("fecha_triaje", { ascending: false });

  if (id_atencion) query = query.eq("id_atencion", id_atencion);
  if (id_mascota) query = query.eq("id_mascota", id_mascota);

  const { data, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session || !TRIAJE_ROLES.includes(session.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Verificar que la atención exista y esté en estado "triaje"
  const { data: atencion } = await admin
    .from("atenciones_clinicas")
    .select("estado_actual")
    .eq("id_atencion", parsed.data.id_atencion)
    .single();

  if (!atencion || !["espera", "triaje"].includes(atencion.estado_actual)) {
    return NextResponse.json(
      {
        error:
          "Solo se puede registrar triaje cuando la atención está en estado 'espera' o 'triaje'",
      },
      { status: 400 },
    );
  }

  const { data, error } = await admin
    .from("triaje")
    .insert({ ...parsed.data, id_recepcionista: session.id_usuario })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ya existe un triaje para esta atención" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Avanzar estado de atención a "triaje" si aún está en "espera"
  if (atencion.estado_actual === "espera") {
    await admin
      .from("atenciones_clinicas")
      .update({
        estado_actual: "triaje",
        fecha_estado_actual: new Date().toISOString(),
      })
      .eq("id_atencion", parsed.data.id_atencion);

    await admin.from("transiciones_estado").insert({
      id_atencion: parsed.data.id_atencion,
      estado_anterior: "espera",
      estado_nuevo: "triaje",
      id_usuario: session.id_usuario,
      razon: "Triaje registrado",
    });
  }

  return NextResponse.json({ data }, { status: 201 });
}
