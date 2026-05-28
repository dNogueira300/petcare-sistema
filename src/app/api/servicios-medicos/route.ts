import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

const createSchema = z.object({
  nombre:                z.string().min(2).max(150),
  id_especialidad:       z.number().int().positive().optional(),
  id_recurso_requerido:  z.number().int().positive().optional().nullable(),
  descripcion:           z.string().optional(),
  duracion_estimada_min: z.number().int().positive().default(30),
  precio_base:           z.number().positive().optional(),
  es_activo:             z.boolean().optional(),
});

const SEL = "*, especialidades(nombre), recursos!servicios_medicos_id_recurso_requerido_fkey(nombre, tipo_recurso)";

export async function GET() {
  const session = await getSessionUser();
  if (!session)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data, error } = await createAdminClient()
    .from("servicios_medicos")
    .select(SEL)
    .order("nombre");

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session || session.rol !== "administrador") {
    return NextResponse.json(
      { error: "Solo el administrador puede crear servicios" },
      { status: 403 },
    );
  }

  const body   = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map(i => i.message).join(", ") },
      { status: 400 },
    );
  }

  const { data, error } = await createAdminClient()
    .from("servicios_medicos")
    .insert(parsed.data)
    .select(SEL)
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ya existe un servicio con ese nombre" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data }, { status: 201 });
}
