import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

const assignSchema = z.object({
  id_especialidad: z.number().int().positive(),
  es_especialidad_primaria: z.boolean().optional(),
  anos_experiencia: z.number().int().min(0).optional(),
});

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const { data, error } = await createAdminClient()
    .from("veterinario_especialidad")
    .select("*, especialidades(id_especialidad, nombre, descripcion)")
    .eq("id_veterinario", id)
    .order("es_especialidad_primaria", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session || session.rol !== "administrador") {
    return NextResponse.json(
      { error: "Solo el administrador puede asignar especialidades" },
      { status: 403 },
    );
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Si se marca como primaria, quitar la primaria anterior
  if (parsed.data.es_especialidad_primaria) {
    await admin
      .from("veterinario_especialidad")
      .update({ es_especialidad_primaria: false })
      .eq("id_veterinario", id);
  }

  const { data, error } = await admin
    .from("veterinario_especialidad")
    .insert({ id_veterinario: Number(id), ...parsed.data })
    .select("*, especialidades(nombre)")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "El veterinario ya tiene esta especialidad asignada" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session || session.rol !== "administrador") {
    return NextResponse.json(
      { error: "Solo el administrador puede remover especialidades" },
      { status: 403 },
    );
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const id_especialidad = searchParams.get("id_especialidad");

  if (!id_especialidad) {
    return NextResponse.json(
      { error: "Se requiere id_especialidad" },
      { status: 400 },
    );
  }

  const { error } = await createAdminClient()
    .from("veterinario_especialidad")
    .delete()
    .eq("id_veterinario", id)
    .eq("id_especialidad", id_especialidad);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
