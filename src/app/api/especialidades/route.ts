import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

const createSchema = z.object({
  nombre: z.string().min(2).max(100),
  descripcion: z.string().optional(),
  es_activa: z.boolean().optional(),
});

export async function GET() {
  const session = await getSessionUser();
  if (!session)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data, error } = await createAdminClient()
    .from("especialidades")
    .select("*")
    .order("nombre");

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session || session.rol !== "administrador") {
    return NextResponse.json(
      { error: "Solo el administrador puede crear especialidades" },
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

  const { data, error } = await createAdminClient()
    .from("especialidades")
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ya existe una especialidad con ese nombre" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data }, { status: 201 });
}
