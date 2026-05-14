import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { passwordSchema } from "@/utils/password";

const updateSchema = z.object({
  telefono: z.string().min(7, "Teléfono inválido").optional(),
  direccion: z.string().optional(),
});

const passwordChangeSchema = z.object({
  contrasena_actual: z.string().min(1, "Contraseña actual requerida"),
  contrasena: passwordSchema,
});

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.rol !== "cliente") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("clientes")
    .select(
      "id_cliente, telefono, direccion, usuarios!inner(id_usuario, nombre, apellido, correo)"
    )
    .eq("id_usuario", session.id_usuario)
    .single();

  if (error || !data) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.rol !== "cliente") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("clientes")
    .update(parsed.data)
    .eq("id_usuario", session.id_usuario)
    .select("id_cliente, telefono, direccion")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.rol !== "cliente") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = passwordChangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { data: usuario, error: uErr } = await supabase
    .from("usuarios")
    .select("contrasena_hash")
    .eq("id_usuario", session.id_usuario)
    .single();

  if (uErr || !usuario) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const ok = await bcrypt.compare(parsed.data.contrasena_actual, usuario.contrasena_hash);
  if (!ok) {
    return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 400 });
  }

  const nuevoHash = await hashPassword(parsed.data.contrasena);
  const { error } = await supabase
    .from("usuarios")
    .update({ contrasena_hash: nuevoHash })
    .eq("id_usuario", session.id_usuario);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
