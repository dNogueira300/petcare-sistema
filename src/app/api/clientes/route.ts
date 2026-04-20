import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { hashPassword, getSessionUser } from "@/lib/auth";

const createSchema = z.object({
  nombre: z.string().min(2),
  apellido: z.string().min(2),
  correo: z.string().email(),
  contrasena: z.string().min(8),
  telefono: z.string().min(7),
  direccion: z.string().optional(),
});

const ALLOWED_ROLES = ["administrador", "recepcionista"];

export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session || !ALLOWED_ROLES.includes(session.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  let query = supabase
    .from("clientes")
    .select(
      "id_cliente, telefono, direccion, usuarios!inner(id_usuario, nombre, apellido, correo, activo)"
    )
    .order("id_cliente", { ascending: false });

  if (q) {
    query = query.or(
      `usuarios.nombre.ilike.%${q}%,usuarios.apellido.ilike.%${q}%,usuarios.correo.ilike.%${q}%`
    );
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

  const { contrasena, telefono, direccion, ...usuarioData } = parsed.data;
  const contrasena_hash = await hashPassword(contrasena);

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: usuario, error: uError } = await supabase
    .from("usuarios")
    .insert({ ...usuarioData, contrasena_hash, rol: "cliente" })
    .select("id_usuario")
    .single();

  if (uError) {
    if (uError.code === "23505") {
      return NextResponse.json({ error: "El correo ya está registrado" }, { status: 409 });
    }
    return NextResponse.json({ error: uError.message }, { status: 500 });
  }

  const { data, error: cError } = await supabase
    .from("clientes")
    .insert({ id_usuario: usuario.id_usuario, telefono, direccion })
    .select()
    .single();

  if (cError) return NextResponse.json({ error: cError.message }, { status: 500 });

  return NextResponse.json({ data }, { status: 201 });
}
