import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { sendVerificacionCorreo } from "@/lib/mailer";
import type { Usuario } from "@/types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://petcare-sistema.vercel.app";

export const EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED" as const;

export type VerifyCredentialsResult =
  | Usuario
  | { error: typeof EMAIL_NOT_VERIFIED }
  | null;

export async function verifyCredentials(
  correo: string,
  contrasena: string,
): Promise<VerifyCredentialsResult> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

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

    const valid = await bcrypt.compare(contrasena, usuario.contrasena_hash);
    if (!valid) {
      console.log(`[AUTH] Contraseña inválida para: ${correo}`);
      return null;
    }

    if (usuario.correo_verificado === false) {
      console.log(`[AUTH] Correo no verificado para: ${correo}`);
      return { error: EMAIL_NOT_VERIFIED };
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

/* ─── A.3 — Verificación de correo ────────────────────────────────────────── */

/** Token aleatorio de 64 bytes en hexadecimal (128 chars). */
export function generarTokenVerificacion(): string {
  return randomBytes(64).toString("hex");
}

/** Fecha de expiración (ISO) a 48 h a partir de ahora. */
export function expiracionTokenVerificacion(): string {
  return new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
}

export async function enviarCorreoVerificacion(
  usuario: { nombre: string; correo: string },
  token: string,
): Promise<void> {
  const verifyUrl = `${APP_URL}/api/auth/verify?token=${encodeURIComponent(token)}`;
  await sendVerificacionCorreo({
    correoUsuario: usuario.correo,
    nombreUsuario: usuario.nombre,
    verifyUrl,
  });
}
