import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

const updateSchema = z.object({
  nombre: z.string().min(1).optional(),
  especie: z.string().optional(),
  raza: z.string().optional(),
  sexo: z.enum(["macho", "hembra"]).optional(),
  color: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;

  const { data, error } = await createAdminClient()
    .from("mascotas")
    .select(
      "*, clientes(id_cliente, usuarios(nombre, apellido)), historia_clinica(id_historia, fecha_consulta, diagnostico, tratamiento)"
    )
    .eq("id_mascota", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (session.rol === "cliente") {
    const { data: cliente } = await supabase
      .from("clientes")
      .select("id_cliente")
      .eq("id_usuario", session.id_usuario)
      .single();
    if (!cliente) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

    const { data: mascota } = await supabase
      .from("mascotas")
      .select("id_cliente")
      .eq("id_mascota", id)
      .single();
    if (!mascota || mascota.id_cliente !== cliente.id_cliente) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
  }

  const { data, error } = await supabase
    .from("mascotas")
    .update(parsed.data)
    .eq("id_mascota", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
