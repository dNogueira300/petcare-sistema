import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

const createSchema = z.object({
  dia_semana: z.number().int().min(1).max(7),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}$/),
  hora_fin: z.string().regex(/^\d{2}:\d{2}$/),
  activo: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const { data, error } = await createAdminClient()
    .from("recurso_disponibilidad")
    .select("*")
    .eq("id_recurso", id)
    .order("dia_semana")
    .order("hora_inicio");

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session || session.rol !== "administrador") {
    return NextResponse.json(
      { error: "Solo el administrador puede configurar disponibilidad" },
      { status: 403 },
    );
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (parsed.data.hora_fin <= parsed.data.hora_inicio) {
    return NextResponse.json(
      { error: "hora_fin debe ser mayor que hora_inicio" },
      { status: 400 },
    );
  }

  const { data, error } = await createAdminClient()
    .from("recurso_disponibilidad")
    .insert({ id_recurso: Number(id), ...parsed.data })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
