import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { hashPassword } from "@/lib/auth";
import { passwordSchema } from "@/utils/password";

const schema = z.object({
  nombre: z.string().min(2),
  apellido: z.string().min(2),
  correo: z.string().email(),
  contrasena: passwordSchema,
  telefono: z.string().min(7),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstIssue?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { contrasena, telefono, ...userData } = parsed.data;
  const contrasena_hash = await hashPassword(contrasena);
  const supabase = createAdminClient();

  const { data: usuario, error: uError } = await supabase
    .from("usuarios")
    .insert({ ...userData, contrasena_hash, rol: "cliente" })
    .select("id_usuario")
    .single();

  if (uError) {
    if (uError.code === "23505") {
      return NextResponse.json({ error: "El correo ya está registrado" }, { status: 409 });
    }
    return NextResponse.json({ error: uError.message }, { status: 500 });
  }

  const { error: cError } = await supabase
    .from("clientes")
    .insert({ id_usuario: usuario.id_usuario, telefono });

  if (cError) return NextResponse.json({ error: cError.message }, { status: 500 });

  return NextResponse.json({ ok: true }, { status: 201 });
}
