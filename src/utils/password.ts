import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .refine((v) => /[A-Z]/.test(v), "Al menos una letra mayúscula")
  .refine((v) => /[a-z]/.test(v), "Al menos una letra minúscula")
  .refine((v) => /[0-9]/.test(v), "Al menos un número")
  .refine((v) => /[^A-Za-z0-9]/.test(v), "Al menos un símbolo (!@#$%...)");

/** Para campos de contraseña opcionales (edición): vacío = sin cambio, no vacío = debe cumplir reglas */
export const optionalPasswordSchema = z
  .string()
  .refine(
    (v) => v === "" || passwordSchema.safeParse(v).success,
    "La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y símbolo"
  )
  .optional();

export const PASSWORD_HINT =
  "Mínimo 8 caracteres con mayúscula, minúscula, número y símbolo (!@#$%...)";
