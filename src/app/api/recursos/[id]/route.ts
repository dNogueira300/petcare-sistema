import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  nombre: z.string().min(2).max(150).optional(),
  descripcion: z.string().optional(),
  capacidad: z.number().int().positive().optional(),
  ubicacion: z.string().optional().nullable(),
  notas_mantenimiento: z.string().optional().nullable(),
  activo: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session || session.rol !== "administrador") {
    return NextResponse.json(
      { error: "Solo el administrador puede editar recursos" },
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
    .from("recursos")
    .update(parsed.data)
    .eq("id_recurso", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const { data, error } = await createAdminClient()
    .from("recursos")
    .select("*, recurso_disponibilidad(*)")
    .eq("id_recurso", id)
    .single();

  if (error || !data)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ data });
}
