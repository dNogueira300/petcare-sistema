import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  peso: z.number().positive().optional(),
  temperatura: z.number().optional(),
  frecuencia_cardiaca: z.number().int().positive().optional(),
  frecuencia_respiratoria: z.number().int().positive().optional(),
  observaciones_iniciales: z.string().optional(),
  nivel_urgencia: z.enum(["normal", "urgente", "emergencia"]).optional(),
  razon_urgencia: z.string().optional(),
  sintomas_reportados: z.string().optional(),
  estado: z.enum(["completado", "incompleto", "cancelado"]).optional(),
  notas_medico: z.string().optional(),
});

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const { data, error } = await createAdminClient()
    .from("triaje")
    .select(
      "*, usuarios!triaje_id_recepcionista_fkey(nombre, apellido), mascotas(nombre, especie)",
    )
    .eq("id_triaje", id)
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

  const { data, error } = await createAdminClient()
    .from("triaje")
    .update(parsed.data)
    .eq("id_triaje", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
