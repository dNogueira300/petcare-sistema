import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyCredentials, EMAIL_NOT_VERIFIED } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

const schema = z.object({
  correo: z.string().email(),
  contrasena: z.string().min(6),
});

const MAX_INTENTOS = 5;
const BLOQUEO_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Correo o contraseña inválidos" },
        { status: 400 },
      );
    }

    const { correo, contrasena } = parsed.data;
    const supabase = createAdminClient();

    // Verificar bloqueo en DB
    const { data: usuarioDB } = await supabase
      .from("usuarios")
      .select("id_usuario, bloqueado_hasta, intentos_fallidos, activo")
      .eq("correo", correo)
      .single();

    if (usuarioDB?.bloqueado_hasta) {
      const bloqueadoHasta = new Date(usuarioDB.bloqueado_hasta);
      if (bloqueadoHasta > new Date()) {
        const minutos = Math.ceil((bloqueadoHasta.getTime() - Date.now()) / 60000);
        return NextResponse.json(
          { error: `Cuenta bloqueada temporalmente. Intenta en ${minutos} minuto${minutos !== 1 ? "s" : ""}.` },
          { status: 429 },
        );
      }
    }

    const resultado = await verifyCredentials(correo, contrasena);

    if (resultado && "error" in resultado) {
      return NextResponse.json(
        { error: EMAIL_NOT_VERIFIED, correo },
        { status: 403 },
      );
    }

    const usuario = resultado;

    if (!usuario) {
      if (usuarioDB) {
        const nuevosIntentos = (usuarioDB.intentos_fallidos ?? 0) + 1;
        const update: Record<string, unknown> = { intentos_fallidos: nuevosIntentos };
        if (nuevosIntentos >= MAX_INTENTOS) {
          update.bloqueado_hasta = new Date(Date.now() + BLOQUEO_MS).toISOString();
          update.intentos_fallidos = 0;
        }
        await supabase
          .from("usuarios")
          .update(update)
          .eq("id_usuario", usuarioDB.id_usuario);
      }
      return NextResponse.json(
        { error: "Correo o contraseña incorrectos" },
        { status: 401 },
      );
    }

    // Login exitoso — resetear contador
    await supabase
      .from("usuarios")
      .update({ intentos_fallidos: 0, bloqueado_hasta: null })
      .eq("id_usuario", usuario.id_usuario);

    const { contrasena_hash: _, ...safeUser } = usuario;
    const sessionValue = Buffer.from(JSON.stringify(safeUser)).toString("base64");

    const cookieStore = await cookies();
    cookieStore.set("session", sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error("[AUTH] Login error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
