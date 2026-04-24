import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { hashPassword, getSessionUser } from "@/lib/auth";
import { passwordSchema } from "@/utils/password";

const createSchema = z.object({
  nombre: z.string().min(2),
  apellido: z.string().min(2),
  correo: z.string().email(),
  contrasena: passwordSchema,
  rol: z.enum(["administrador", "veterinario", "recepcionista"]),
});

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.rol !== "administrador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { data, error } = await createAdminClient()
    .from("usuarios")
    .select("id_usuario, nombre, apellido, correo, rol, activo, creado_en")
    .not("rol", "eq", "cliente")
    .order("creado_en", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session || session.rol !== "administrador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { contrasena, ...rest } = parsed.data;
  const contrasena_hash = await hashPassword(contrasena);

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("usuarios")
    .insert({ ...rest, contrasena_hash })
    .select("id_usuario, nombre, apellido, correo, rol, activo, creado_en")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "El correo ya está registrado" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data.rol === "veterinario") {
    await supabase
      .from("veterinarios")
      .insert({ id_usuario: data.id_usuario, horario_inicio: "07:00", horario_fin: "20:00" });
  }

  return NextResponse.json({ data }, { status: 201 });
}
