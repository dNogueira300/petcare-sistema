import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { sendResetPassword } from "@/lib/mailer";

const schema = z.object({
  correo: z.string().email(),
});

const GENERIC_MSG = "Si el correo está registrado, recibirás un enlace en los próximos minutos.";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://petcare-sistema.vercel.app";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: GENERIC_MSG }, { status: 200 });
  }

  const { correo } = parsed.data;

  try {
    const { data: usuario } = await createAdminClient()
      .from("usuarios")
      .select("id_usuario, nombre, correo, activo")
      .eq("correo", correo)
      .maybeSingle();

    if (!usuario || !usuario.activo) {
      return NextResponse.json({ message: GENERIC_MSG }, { status: 200 });
    }

    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await createAdminClient()
      .from("usuarios")
      .update({ reset_token: token, reset_token_expires_at: expires })
      .eq("id_usuario", usuario.id_usuario);

    const resetUrl = `${APP_URL}/reset-password?token=${token}`;

    await sendResetPassword({
      nombreUsuario: usuario.nombre,
      correoUsuario: usuario.correo,
      resetUrl,
    });
  } catch (err) {
    console.error("[FORGOT-PASSWORD]", err);
  }

  return NextResponse.json({ message: GENERIC_MSG }, { status: 200 });
}
