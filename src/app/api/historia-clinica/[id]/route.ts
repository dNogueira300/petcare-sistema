import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

const updateSchema = z.object({
  fecha_consulta: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  diagnostico: z.string().min(5).optional(),
  tratamiento: z.string().min(5).optional(),
  observaciones: z.string().optional(),
  peso_consulta: z.number().positive().optional(),
  razon_cambio: z.string().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session || !["administrador", "veterinario"].includes(session.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const { data, error } = await createAdminClient()
    .from("historia_clinica")
    .select(
      "*, mascotas(*), veterinarios(usuarios(nombre, apellido)), citas(fecha, hora, motivo)",
    )
    .eq("id_historia", id)
    .single();

  if (error || !data)
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session || session.rol !== "administrador") {
    return NextResponse.json(
      { error: "Solo el administrador puede editar historias clínicas" },
      { status: 403 },
    );
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Obtener valores anteriores para la auditoría
  const { data: anterior } = await admin
    .from("historia_clinica")
    .select("diagnostico, tratamiento, observaciones, peso_consulta")
    .eq("id_historia", id)
    .single();

  const { razon_cambio, ...updateFields } = parsed.data;

  const { data, error } = await admin
    .from("historia_clinica")
    .update(updateFields)
    .eq("id_historia", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // ── FASE 4: Registrar auditoría de modificación ──────────────────────────────
  if (anterior) {
    await admin.from("auditoria_historia_clinica").insert({
      id_historia: data.id_historia,
      id_usuario: session.id_usuario,
      tipo_cambio: "UPDATE",
      diagnostico_anterior: anterior.diagnostico ?? null,
      diagnostico_nuevo: data.diagnostico ?? null,
      tratamiento_anterior: anterior.tratamiento ?? null,
      tratamiento_nuevo: data.tratamiento ?? null,
      observaciones_anterior: anterior.observaciones ?? null,
      observaciones_nuevo: data.observaciones ?? null,
      peso_anterior: anterior.peso_consulta ?? null,
      peso_nuevo: data.peso_consulta ?? null,
      razon_cambio: razon_cambio ?? null,
    });
  }

  return NextResponse.json({ data });
}
