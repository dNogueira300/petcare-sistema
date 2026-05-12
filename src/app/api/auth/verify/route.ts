import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/utils/supabase/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://petcare-sistema.vercel.app";

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  const fail = () => NextResponse.redirect(new URL("/login?verified=0", APP_URL));

  if (!token) return fail();

  const supabase = createAdminClient();

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id_usuario, token_expira, correo_verificado, activo")
    .eq("token_verificacion", token)
    .maybeSingle();

  if (!usuario) return fail();

  if (!usuario.correo_verificado) {
    if (!usuario.token_expira || new Date(usuario.token_expira) < new Date()) {
      return fail();
    }
  }

  const { data: actualizado } = await supabase
    .from("usuarios")
    .update({ correo_verificado: true, token_verificacion: null, token_expira: null })
    .eq("id_usuario", usuario.id_usuario)
    .select("id_usuario, nombre, apellido, correo, rol, activo, creado_en, correo_verificado")
    .single();

  // Iniciar sesión automáticamente: dejamos la cookie de sesión y abrimos el portal.
  if (actualizado && actualizado.activo) {
    const sessionValue = Buffer.from(JSON.stringify(actualizado)).toString("base64");
    const cookieStore = await cookies();
    cookieStore.set("session", sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    const dest = actualizado.rol === "cliente" ? "/portal?verified=1" : "/dashboard?verified=1";
    return NextResponse.redirect(new URL(dest, APP_URL));
  }

  return NextResponse.redirect(new URL("/login?verified=1", APP_URL));
}
