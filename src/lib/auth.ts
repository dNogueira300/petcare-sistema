import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { Usuario } from "@/types";

export async function verifyCredentials(
  correo: string,
  contrasena: string
): Promise<Usuario | null> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("*")
    .eq("correo", correo)
    .eq("activo", true)
    .single();

  if (!usuario) return null;

  const valid = await bcrypt.compare(contrasena, usuario.contrasena_hash);
  return valid ? (usuario as Usuario) : null;
}

export async function hashPassword(contrasena: string): Promise<string> {
  return bcrypt.hash(contrasena, 12);
}

export async function getSessionUser(): Promise<Usuario | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("session")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf-8")) as Usuario;
  } catch {
    return null;
  }
}
