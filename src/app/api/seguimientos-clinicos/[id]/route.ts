import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  estado: z
    .enum([
      "pendiente",
      "sugerencia_enviada",
      "cita_agendada",
      "completado",
      "no_presentado",
      "cancelado",
    ])
    .optional(),
  observaciones: z.string().optional(),
  fecha_sugerida_control: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  id_cita_sugerida: z.number().int().positive().optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const { data, error } = await createAdminClient()
    .from("seguimientos_clinicos")
    .select(
      `
      *,
      mascotas(nombre, especie, clientes(usuarios(nombre, apellido))),
      veterinarios(usuarios(nombre, apellido)),
      historia_clinica(diagnostico, tratamiento, fecha_consulta)
    `,
    )
    .eq("id_seguimiento", id)
    .single();

  if (error || !data)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (
    !session ||
    !["administrador", "veterinario", "recepcionista"].includes(session.rol)
  ) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
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

  const { data, error } = await admin
    .from("seguimientos_clinicos")
    .update(parsed.data)
    .eq("id_seguimiento", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Si se marca como completado, actualizar HC
  if (parsed.data.estado === "completado" && data) {
    await admin
      .from("historia_clinica")
      .update({ estado_seguimiento: "seguimiento_completado" })
      .eq("id_historia", data.id_historia_clinica);
  }

  return NextResponse.json({ data });
}
