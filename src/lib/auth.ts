import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { Usuario } from "@/types";

export async function verifyCredentials(
  correo: string,
  contrasena: string,
): Promise<Usuario | null> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Usa maybeSingle() en lugar de single() para manejar mejor los casos
    const { data: usuario, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("correo", correo)
      .eq("activo", true)
      .maybeSingle();

    if (error) {
      console.error(`[AUTH] Error querying usuario ${correo}:`, error);
      return null;
    }

    if (!usuario) {
      console.log(`[AUTH] Usuario no encontrado o inactivo para: ${correo}`);
      return null;
    }

    console.log(
      `[AUTH] Usuario encontrado: ${usuario.correo} (id: ${usuario.id_usuario})`,
    );

    const valid = await bcrypt.compare(contrasena, usuario.contrasena_hash);

    if (!valid) {
      console.log(`[AUTH] Contraseña inválida para: ${correo}`);
      return null;
    }

    console.log(`[AUTH] Login exitoso para: ${correo}`);
    return usuario as Usuario;
  } catch (error) {
    console.error("[AUTH] Error verifying credentials:", error);
    return null;
  }
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
