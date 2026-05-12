import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://petcare-sistema.vercel.app";

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  const fail = () => NextResponse.redirect(new URL("/login?verified=0", APP_URL));

  if (!token) return fail();

  const supabase = createAdminClient();

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id_usuario, token_expira, correo_verificado")
    .eq("token_verificacion", token)
    .maybeSingle();

  if (!usuario) return fail();

  if (!usuario.correo_verificado) {
    if (!usuario.token_expira || new Date(usuario.token_expira) < new Date()) {
      return fail();
    }
  }

  await supabase
    .from("usuarios")
    .update({ correo_verificado: true, token_verificacion: null, token_expira: null })
    .eq("id_usuario", usuario.id_usuario);

  return NextResponse.redirect(new URL("/login?verified=1", APP_URL));
}
