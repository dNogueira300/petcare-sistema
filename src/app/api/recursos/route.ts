import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

const createSchema = z.object({
  nombre: z.string().min(2).max(150),
  tipo_recurso: z.enum([
    "consultorio",
    "quirofano",
    "equipo",
    "jaula_hospitalizacion",
  ]),
  descripcion: z.string().optional(),
  capacidad: z.number().int().positive().default(1),
  ubicacion: z.string().optional(),
  notas_mantenimiento: z.string().optional(),
});

export async function GET() {
  const session = await getSessionUser();
  if (!session)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data, error } = await createAdminClient()
    .from("recursos")
    .select("*")
    .order("tipo_recurso")
    .order("nombre");

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session || session.rol !== "administrador") {
    return NextResponse.json(
      { error: "Solo el administrador puede crear recursos" },
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
    .from("recursos")
    .insert(parsed.data)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
