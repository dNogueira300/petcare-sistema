import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { sendResetPassword } from "@/lib/mailer";

const schema = z.object({
  correo: z.string().email(),
});

const GENERIC_MSG = "Si el correo está registrado, recibirás un enlace en los próximos minutos.";

/** Deriva la URL base del servidor desde los headers de la request.
 *  Funciona correctamente en localhost, Vercel y cualquier otro host. */
function getAppUrl(req: NextRequest): string {
  // Vercel y proxies populares pasan estos headers
  const forwardedHost  = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const host           = req.headers.get("host");

  const resolvedHost  = forwardedHost ?? host ?? "localhost:3000";
  const resolvedProto = forwardedProto?.split(",")[0].trim()
    ?? (resolvedHost.startsWith("localhost") ? "http" : "https");

  return `${resolvedProto}://${resolvedHost}`;
}

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

    const resetUrl = `${getAppUrl(req)}/reset-password?token=${token}`;

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
