import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

const createSchema = z.object({
  id_mascota: z.number().int().positive(),
  id_cliente: z.number().int().positive(),
  motivo: z.string().min(5),
  preferencia_fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  preferencia_veterinario: z.number().int().positive().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const estado = searchParams.get("estado") ?? "activa";

  const supabase = createAdminClient();
  let query = supabase
    .from("colas_espera")
    .select(
      `
      *,
      mascotas(nombre, especie),
      clientes(usuarios(nombre, apellido))
    `,
    )
    .order("fecha_registro", { ascending: true });

  if (estado !== "todas") query = query.eq("estado", estado);

  if (session.rol === "cliente") {
    const { data: clienteData } = await supabase
      .from("clientes")
      .select("id_cliente")
      .eq("id_usuario", session.id_usuario)
      .single();
    if (clienteData) query = query.eq("id_cliente", clienteData.id_cliente);
  }

  const { data, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data, error } = await createAdminClient()
    .from("colas_espera")
    .insert(parsed.data)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
