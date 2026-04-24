import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

const updateSchema = z.object({
  nombre: z.string().min(2).optional(),
  apellido: z.string().min(2).optional(),
  correo: z.string().email().optional(),
  rol: z.enum(["administrador", "veterinario", "recepcionista"]).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session || session.rol !== "administrador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const { data, error } = await createAdminClient()
    .from("usuarios")
    .select("id_usuario, nombre, apellido, correo, rol, activo, creado_en")
    .eq("id_usuario", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session || session.rol !== "administrador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await createAdminClient()
    .from("usuarios")
    .update(parsed.data)
    .eq("id_usuario", id)
    .select("id_usuario, nombre, apellido, correo, rol, activo, creado_en")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session || session.rol !== "administrador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const { activo } = await req.json();

  const { data, error } = await createAdminClient()
    .from("usuarios")
    .update({ activo })
    .eq("id_usuario", id)
    .select("id_usuario, nombre, apellido, correo, rol, activo")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
