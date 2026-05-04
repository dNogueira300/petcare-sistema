"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, PawPrint, CheckCircle } from "lucide-react";
import { PasswordStrength } from "@/components/ui/password-strength";
import { passwordSchema } from "@/utils/password";

const schema = z
  .object({
    contrasena: passwordSchema,
    confirmar: z.string().min(1, "Confirma la contraseña"),
  })
  .refine((d) => d.contrasena === d.confirmar, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar"],
  });

type FormData = z.infer<typeof schema>;

export function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token");

  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const contrasenaValue = watch("contrasena") ?? "";

  const onSubmit = async (data: FormData) => {
    if (!token) return;
    setServerError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, contrasena: data.contrasena }),
      });
      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error ?? "Error al restablecer la contraseña");
        return;
      }
      setDone(true);
    } catch {
      setServerError("Error de conexión. Inténtalo nuevamente.");
    }
  };

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg)",
    padding: "24px 16px",
  };

  const cardStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: "420px",
    background: "#fff",
    borderRadius: "20px",
    padding: "40px 36px",
    boxShadow: "0 8px 32px rgba(26,18,8,0.10), 0 0 0 1px var(--card-border)",
    position: "relative",
    zIndex: 1,
  };

  /* Token inválido / ausente */
  if (!token) {
    return (
      <div style={containerStyle}>
        <div className="animate-fade-up" style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "32px" }}>
            <Image src="/logo/logo_h.png" alt="PetCare" width={120} height={32} style={{ height: "auto" }} priority />
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-fraunces)", fontSize: "1.4rem", fontWeight: 600, fontStyle: "italic", color: "#1a1208", margin: "0 0 12px" }}>
              Enlace inválido
            </p>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.88rem", color: "#8a7a60", lineHeight: 1.7, margin: "0 0 24px" }}>
              Este enlace no es válido o ha expirado. Solicita uno nuevo.
            </p>
            <Link
              href="/forgot-password"
              style={{
                display: "inline-block", background: "#0a1a11", color: "#f2e8d5",
                textDecoration: "none", padding: "12px 28px", borderRadius: "10px",
                fontFamily: "var(--font-dm-sans)", fontSize: "0.88rem", fontWeight: 600,
              }}
            >
              Solicitar nuevo enlace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Decorative paws */}
      {[
        { top: "10%", left: "7%", size: 60, opacity: 0.1 },
        { top: "70%", left: "82%", size: 76, opacity: 0.08 },
      ].map((p, i) => (
        <div key={i} style={{ position: "fixed", top: p.top, left: p.left, pointerEvents: "none" }}>
          <PawPrint size={p.size} style={{ color: "#3d845b", opacity: p.opacity }} />
        </div>
      ))}

      <div className="animate-fade-up" style={cardStyle}>
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "32px" }}>
          <Image src="/logo/logo_h.png" alt="PetCare" width={120} height={32} style={{ height: "auto" }} priority />
        </div>

        {done ? (
          /* SUCCESS */
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "68px", height: "68px", borderRadius: "50%",
                background: "linear-gradient(135deg,#f0fdf4,#dcfce7)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
                boxShadow: "0 6px 20px rgba(22,163,74,0.18)",
              }}
            >
              <CheckCircle size={32} color="#16a34a" />
            </div>
            <h2
              style={{
                fontFamily: "var(--font-fraunces)", fontSize: "1.5rem",
                fontWeight: 600, fontStyle: "italic", color: "#1a1208",
                margin: "0 0 12px",
              }}
            >
              ¡Contraseña actualizada!
            </h2>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)", fontSize: "0.88rem",
                color: "#8a7a60", lineHeight: 1.7, margin: "0 0 28px",
              }}
            >
              Tu contraseña fue restablecida con éxito. Ya puedes iniciar sesión.
            </p>
            <Link
              href="/login"
              style={{
                display: "inline-block", background: "#0a1a11", color: "#f2e8d5",
                textDecoration: "none", padding: "12px 32px", borderRadius: "10px",
                fontFamily: "var(--font-dm-sans)", fontSize: "0.88rem", fontWeight: 600,
              }}
            >
              Iniciar sesión
            </Link>
          </div>
        ) : (
          /* FORM */
          <>
            <h2
              style={{
                fontFamily: "var(--font-fraunces)", fontSize: "1.75rem",
                fontWeight: 500, fontStyle: "italic", color: "#1a1208",
                letterSpacing: "-0.02em", lineHeight: 1.2, margin: "0 0 8px",
              }}
            >
              Nueva contraseña
            </h2>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)", fontSize: "0.85rem",
                color: "#8a7a60", margin: "0 0 28px", lineHeight: 1.6,
              }}
            >
              Elige una contraseña segura para tu cuenta.
            </p>

            {serverError && (
              <div
                style={{
                  background: "#fff5f5", border: "1px solid #fecaca",
                  borderRadius: "10px", padding: "10px 14px",
                  marginBottom: "16px",
                }}
              >
                <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.82rem", color: "#991b1b" }}>
                  {serverError}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Nueva contraseña */}
              <div>
                <label
                  style={{
                    display: "block", marginBottom: "6px",
                    fontSize: "0.78rem", fontWeight: 600,
                    letterSpacing: "0.04em", textTransform: "uppercase",
                    color: "#6b5c44", fontFamily: "var(--font-dm-sans)",
                  }}
                >
                  Nueva contraseña
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showNew ? "text" : "password"}
                    placeholder="••••••••"
                    style={{
                      width: "100%", height: "46px",
                      padding: "0 44px 0 14px",
                      background: "var(--input-bg)",
                      border: errors.contrasena ? "1.5px solid #f87171" : "1.5px solid var(--input-border)",
                      borderRadius: "var(--radius)",
                      fontSize: "0.9rem", color: "#1a1208",
                      fontFamily: "var(--font-dm-sans)", outline: "none",
                      boxSizing: "border-box",
                    }}
                    className="login-input"
                    {...register("contrasena")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    tabIndex={-1}
                    style={{
                      position: "absolute", right: "13px", top: "50%",
                      transform: "translateY(-50%)", background: "none",
                      border: "none", cursor: "pointer", color: "#a89a80",
                      display: "flex", padding: 0,
                    }}
                  >
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.contrasena && (
                  <p style={{ marginTop: "4px", fontSize: "0.75rem", color: "#dc2626", fontFamily: "var(--font-dm-sans)" }}>
                    {errors.contrasena.message}
                  </p>
                )}
                <PasswordStrength value={contrasenaValue} />
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label
                  style={{
                    display: "block", marginBottom: "6px",
                    fontSize: "0.78rem", fontWeight: 600,
                    letterSpacing: "0.04em", textTransform: "uppercase",
                    color: "#6b5c44", fontFamily: "var(--font-dm-sans)",
                  }}
                >
                  Confirmar contraseña
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    style={{
                      width: "100%", height: "46px",
                      padding: "0 44px 0 14px",
                      background: "var(--input-bg)",
                      border: errors.confirmar ? "1.5px solid #f87171" : "1.5px solid var(--input-border)",
                      borderRadius: "var(--radius)",
                      fontSize: "0.9rem", color: "#1a1208",
                      fontFamily: "var(--font-dm-sans)", outline: "none",
                      boxSizing: "border-box",
                    }}
                    className="login-input"
                    {...register("confirmar")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    tabIndex={-1}
                    style={{
                      position: "absolute", right: "13px", top: "50%",
                      transform: "translateY(-50%)", background: "none",
                      border: "none", cursor: "pointer", color: "#a89a80",
                      display: "flex", padding: 0,
                    }}
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.confirmar && (
                  <p style={{ marginTop: "4px", fontSize: "0.75rem", color: "#dc2626", fontFamily: "var(--font-dm-sans)" }}>
                    {errors.confirmar.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: "100%", height: "48px",
                  background: isSubmitting ? "#285238" : "#0a1a11",
                  color: "#f2e8d5", border: "none",
                  borderRadius: "var(--radius)",
                  fontSize: "0.88rem", fontWeight: 600,
                  fontFamily: "var(--font-dm-sans)",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  transition: "background 0.2s",
                  boxShadow: "0 4px 14px rgba(10,26,17,0.22)",
                  marginTop: "4px",
                }}
              >
                {isSubmitting ? (
                  <>
                    <span
                      style={{
                        width: "15px", height: "15px",
                        border: "2px solid rgba(242,232,213,0.3)",
                        borderTopColor: "#f2e8d5", borderRadius: "50%",
                        display: "inline-block",
                        animation: "spin 0.7s linear infinite",
                      }}
                    />
                    Guardando…
                  </>
                ) : (
                  "Restablecer contraseña"
                )}
              </button>

              <Link
                href="/login"
                style={{
                  textAlign: "center", fontFamily: "var(--font-dm-sans)",
                  fontSize: "0.82rem", color: "#8a7a60", textDecoration: "none",
                }}
              >
                ← Volver al inicio de sesión
              </Link>
            </form>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .login-input:focus {
          border-color: #c48c34 !important;
          box-shadow: 0 0 0 3px rgba(196,140,52,0.14);
        }
      `}</style>
    </div>
  );
}
