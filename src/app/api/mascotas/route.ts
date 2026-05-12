import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

const ALLOWED_ROLES = ["administrador", "veterinario", "recepcionista", "cliente"];

const createSchema = z.object({
  id_cliente: z.number().int().positive().optional(),
  nombre: z.string().min(1),
  especie: z.string().min(1),
  raza: z.string().optional(),
  sexo: z.enum(["macho", "hembra"]).optional(),
  color: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id_cliente = searchParams.get("id_cliente");

  const supabase = createAdminClient();

  let query = supabase
    .from("mascotas")
    .select(
      "id_mascota, nombre, especie, raza, sexo, color, fecha_nacimiento, peso, creado_en, clientes(id_cliente, usuarios(nombre, apellido))"
    )
    .order("creado_en", { ascending: false });

  if (session.rol === "cliente") {
    const { data: clienteData } = await supabase
      .from("clientes")
      .select("id_cliente")
      .eq("id_usuario", session.id_usuario)
      .single();
    if (clienteData) query = query.eq("id_cliente", clienteData.id_cliente);
    else return NextResponse.json({ data: [] });
  } else if (id_cliente) {
    query = query.eq("id_cliente", id_cliente);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session || !ALLOWED_ROLES.includes(session.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createAdminClient();
  let id_cliente = parsed.data.id_cliente;

  if (session.rol === "cliente") {
    const { data: clienteData } = await supabase
      .from("clientes")
      .select("id_cliente")
      .eq("id_usuario", session.id_usuario)
      .single();
    if (!clienteData) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    id_cliente = clienteData.id_cliente;
  }

  if (!id_cliente) {
    return NextResponse.json({ error: "Se requiere id_cliente" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("mascotas")
    .insert({ ...parsed.data, id_cliente })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
