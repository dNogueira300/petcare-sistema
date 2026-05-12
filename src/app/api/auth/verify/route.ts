import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://petcare-sistema.vercel.app";

// Forzamos runtime Node (createAdminClient usa el SDK de Supabase con la service key).
export const runtime = "nodejs";

function redirectTo(path: string): NextResponse {
  return NextResponse.redirect(new URL(path, APP_URL));
}

export async function GET(req: NextRequest) {
  try {
    const token = new URL(req.url).searchParams.get("token");
    if (!token) return redirectTo("/login?verified=0");

    const supabase = createAdminClient();

    const { data: usuario, error: selErr } = await supabase
      .from("usuarios")
      .select("id_usuario, token_expira, correo_verificado, activo")
      .eq("token_verificacion", token)
      .maybeSingle();

    if (selErr) {
      console.error("[VERIFY] error consultando usuario:", selErr);
      return redirectTo("/login?verified=0");
    }
    if (!usuario) return redirectTo("/login?verified=0");

    if (!usuario.correo_verificado) {
      if (!usuario.token_expira || new Date(usuario.token_expira) < new Date()) {
        return redirectTo("/login?verified=0");
      }
    }

    const { data: actualizado, error: updErr } = await supabase
      .from("usuarios")
      .update({ correo_verificado: true, token_verificacion: null, token_expira: null })
      .eq("id_usuario", usuario.id_usuario)
      .select("id_usuario, nombre, apellido, correo, rol, activo, creado_en, correo_verificado")
      .single();

    if (updErr || !actualizado) {
      console.error("[VERIFY] error actualizando usuario:", updErr);
      // El correo quedó verificado; que inicie sesión manualmente.
      return redirectTo("/login?verified=1");
    }

    if (!actualizado.activo) return redirectTo("/login?verified=1");

    // Auto-login: dejamos la cookie de sesión en la respuesta de redirección y abrimos el portal.
    const sessionValue = Buffer.from(JSON.stringify(actualizado)).toString("base64");
    const dest = actualizado.rol === "cliente" ? "/portal?verified=1" : "/dashboard?verified=1";
    const res = redirectTo(dest);
    res.cookies.set("session", sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return res;
  } catch (err) {
    console.error("[VERIFY] error inesperado:", err);
    return redirectTo("/login?verified=0");
  }
}
