import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { hashPassword } from "@/lib/auth";
import { passwordSchema } from "@/utils/password";

const schema = z.object({
  token: z.string().uuid(),
  contrasena: passwordSchema,
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { token, contrasena } = parsed.data;

  const { data: usuario } = await createAdminClient()
    .from("usuarios")
    .select("id_usuario, reset_token_expires_at")
    .eq("reset_token", token)
    .eq("activo", true)
    .maybeSingle();

  if (!usuario) {
    return NextResponse.json(
      { error: "Token inválido o expirado" },
      { status: 400 }
    );
  }

  if (new Date(usuario.reset_token_expires_at) < new Date()) {
    return NextResponse.json(
      { error: "Token inválido o expirado" },
      { status: 400 }
    );
  }

  const contrasena_hash = await hashPassword(contrasena);

  const { error } = await createAdminClient()
    .from("usuarios")
    .update({
      contrasena_hash,
      reset_token: null,
      reset_token_expires_at: null,
      intentos_fallidos: 0,
      bloqueado_hasta: null,
    })
    .eq("id_usuario", usuario.id_usuario);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Contraseña actualizada correctamente" });
}
