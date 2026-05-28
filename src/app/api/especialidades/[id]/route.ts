import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  nombre: z.string().min(2).max(100).optional(),
  descripcion: z.string().optional(),
  es_activa: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session || session.rol !== "administrador") {
    return NextResponse.json(
      { error: "Solo el administrador puede editar especialidades" },
      { status: 403 },
    );
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map(i => i.message).join(", ") },
      { status: 400 },
    );
  }

  const { data, error } = await createAdminClient()
    .from("especialidades")
    .update(parsed.data)
    .eq("id_especialidad", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session || session.rol !== "administrador") {
    return NextResponse.json(
      { error: "Solo el administrador puede eliminar especialidades" },
      { status: 403 },
    );
  }

  const { id } = await params;

  // Verificar que no haya veterinarios asociados
  const { count } = await createAdminClient()
    .from("veterinario_especialidad")
    .select("id", { count: "exact", head: true })
    .eq("id_especialidad", id);

  if (count && count > 0) {
    return NextResponse.json(
      {
        error:
          "No se puede eliminar: hay veterinarios con esta especialidad asignada",
      },
      { status: 409 },
    );
  }

  const { error } = await createAdminClient()
    .from("especialidades")
    .delete()
    .eq("id_especialidad", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
