import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  observaciones: z.string().optional(),
  prioridad: z.enum(["normal", "urgente"]).optional(),
  motivo_consulta: z.string().optional(),
});

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const { data, error } = await createAdminClient()
    .from("atenciones_clinicas")
    .select(
      `
      *,
      mascotas(*, clientes(usuarios(nombre, apellido, correo), telefono)),
      veterinarios(usuarios(nombre, apellido)),
      citas(fecha, hora, motivo, observaciones)
    `,
    )
    .eq("id_atencion", id)
    .single();

  if (error || !data)
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
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
    .from("atenciones_clinicas")
    .update({ ...parsed.data })
    .eq("id_atencion", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
