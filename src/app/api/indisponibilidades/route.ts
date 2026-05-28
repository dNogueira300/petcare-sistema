import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

const createSchema = z.object({
  id_veterinario: z.number().int().positive(),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  razon: z.enum([
    "enfermedad",
    "vacaciones",
    "capacitacion",
    "emergencia",
    "otro",
  ]),
  justificacion: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session || !["administrador", "recepcionista"].includes(session.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id_veterinario = searchParams.get("id_veterinario");

  let query = createAdminClient()
    .from("indisponibilidades")
    .select("*, veterinarios(usuarios(nombre, apellido))")
    .order("fecha_inicio", { ascending: false });

  if (id_veterinario) query = query.eq("id_veterinario", id_veterinario);

  const { data, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session || session.rol !== "administrador") {
    return NextResponse.json(
      { error: "Solo el administrador puede registrar indisponibilidades" },
      { status: 403 },
    );
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (parsed.data.fecha_fin < parsed.data.fecha_inicio) {
    return NextResponse.json(
      { error: "fecha_fin debe ser mayor o igual a fecha_inicio" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("indisponibilidades")
    .insert({ ...parsed.data, creado_por: session.id_usuario })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Buscar citas afectadas en el rango
  const { data: citasAfectadas } = await admin
    .from("citas")
    .select(
      "id_cita, fecha, hora, id_mascota, mascotas(clientes(usuarios(correo)))",
    )
    .eq("id_veterinario", parsed.data.id_veterinario)
    .gte("fecha", parsed.data.fecha_inicio)
    .lte("fecha", parsed.data.fecha_fin)
    .in("estado", ["pendiente", "confirmada"]);

  // Registrar excepciones para cada cita afectada
  if (citasAfectadas && citasAfectadas.length > 0) {
    const excepciones = citasAfectadas.map((c: { id_cita: number }) => ({
      id_cita: c.id_cita,
      tipo_excepcion: "veterinario_inactivo" as const,
      razon:
        `Veterinario indisponible: ${parsed.data.razon}. ${parsed.data.justificacion ?? ""}`.trim(),
      estado_notificacion: "pendiente" as const,
      creado_por: session.id_usuario,
    }));
    await admin.from("excepciones_citas").insert(excepciones);
  }

  return NextResponse.json(
    {
      data,
      citas_afectadas: citasAfectadas?.length ?? 0,
      mensaje:
        citasAfectadas && citasAfectadas.length > 0
          ? `Se registraron ${citasAfectadas.length} excepciones por citas afectadas`
          : "Sin citas afectadas en ese rango",
    },
    { status: 201 },
  );
}
