import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  nombre:               z.string().min(2).max(150).optional(),
  id_especialidad:      z.number().int().positive().optional().nullable(),
  id_recurso_requerido: z.number().int().positive().optional().nullable(),
  descripcion:          z.string().optional(),
  duracion_estimada_min: z.number().int().positive().optional(),
  precio_base:          z.number().positive().optional().nullable(),
  es_activo:            z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session || session.rol !== "administrador") {
    return NextResponse.json(
      { error: "Solo el administrador puede editar servicios" },
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

  const { data, error } = await createAdminClient()
    .from("servicios_medicos")
    .update(parsed.data)
    .eq("id_servicio", id)
    .select("*, especialidades(nombre)")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session || session.rol !== "administrador") {
    return NextResponse.json(
      { error: "Solo el administrador puede eliminar servicios" },
      { status: 403 },
    );
  }

  const { id } = await params;
  const { error } = await createAdminClient()
    .from("servicios_medicos")
    .update({ es_activo: false })
    .eq("id_servicio", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
