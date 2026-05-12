import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import {
  generarTokenVerificacion,
  expiracionTokenVerificacion,
  enviarCorreoVerificacion,
} from "@/lib/auth";

const schema = z.object({ correo: z.string().email() });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id_usuario, nombre, correo, correo_verificado, token_expira")
    .eq("correo", parsed.data.correo)
    .maybeSingle();

  // Respuesta genérica para no filtrar qué correos existen
  if (!usuario) {
    return NextResponse.json({ message: "Si la cuenta existe, enviamos un correo de verificación." });
  }

  if (usuario.correo_verificado) {
    return NextResponse.json({ message: "Tu correo ya está verificado. Puedes iniciar sesión." });
  }

  // Rate limit: bloquear si se solicitó hace menos de 5 minutos
  if (usuario.token_expira) {
    const emitidoHaceMs = 48 * 60 * 60 * 1000 - (new Date(usuario.token_expira).getTime() - Date.now());
    if (emitidoHaceMs >= 0 && emitidoHaceMs < 5 * 60 * 1000) {
      return NextResponse.json(
        { error: "Espera 5 minutos antes de solicitar otro correo." },
        { status: 429 },
      );
    }
  }

  const token = generarTokenVerificacion();
  await supabase
    .from("usuarios")
    .update({ token_verificacion: token, token_expira: expiracionTokenVerificacion() })
    .eq("id_usuario", usuario.id_usuario);

  try {
    await enviarCorreoVerificacion({ nombre: usuario.nombre, correo: usuario.correo }, token);
  } catch (err) {
    console.error("[AUTH] Error enviando correo de verificación:", err);
    return NextResponse.json({ error: "No se pudo enviar el correo. Intenta más tarde." }, { status: 500 });
  }

  return NextResponse.json({ message: "Correo de verificación enviado. Revisa tu bandeja de entrada." });
}
