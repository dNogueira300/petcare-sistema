"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, PawPrint, CheckCircle } from "lucide-react";

const schema = z.object({
  correo: z.string().email("Correo inválido"),
});
type FormData = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error del servidor");
      setDone(true);
    } catch {
      setServerError("Error de conexión. Inténtalo nuevamente.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: "24px 16px",
      }}
    >
      {/* Decorative paws */}
      {[
        { top: "8%", left: "6%", size: 64, opacity: 0.1 },
        { top: "75%", left: "80%", size: 80, opacity: 0.08 },
        { top: "55%", left: "4%", size: 48, opacity: 0.12 },
      ].map((p, i) => (
        <div
          key={i}
          style={{ position: "fixed", top: p.top, left: p.left, pointerEvents: "none" }}
        >
          <PawPrint
            size={p.size}
            style={{ color: "#3d845b", opacity: p.opacity }}
          />
        </div>
      ))}

      <div
        className="animate-fade-up"
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#fff",
          borderRadius: "20px",
          padding: "40px 36px",
          boxShadow: "0 8px 32px rgba(26,18,8,0.10), 0 0 0 1px var(--card-border)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "32px" }}>
          <Image
            src="/logo/logo_h.png"
            alt="PetCare"
            width={120}
            height={32}
            style={{ height: "auto" }}
            priority
          />
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
                fontFamily: "var(--font-fraunces)",
                fontSize: "1.5rem", fontWeight: 600, fontStyle: "italic",
                color: "#1a1208", margin: "0 0 12px",
              }}
            >
              Revisa tu correo
            </h2>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "0.88rem", color: "#8a7a60",
                lineHeight: 1.7, margin: "0 0 28px",
              }}
            >
              Si el correo está registrado, recibirás un enlace para restablecer
              tu contraseña en los próximos minutos.
            </p>
            <Link
              href="/login"
              style={{
                display: "inline-block",
                background: "#0a1a11", color: "#f2e8d5",
                textDecoration: "none", padding: "12px 32px",
                borderRadius: "10px", fontFamily: "var(--font-dm-sans)",
                fontSize: "0.88rem", fontWeight: 600,
              }}
            >
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          /* FORM */
          <>
            <h2
              style={{
                fontFamily: "var(--font-fraunces)",
                fontSize: "1.75rem", fontWeight: 500, fontStyle: "italic",
                color: "#1a1208", letterSpacing: "-0.02em",
                lineHeight: 1.2, margin: "0 0 8px",
              }}
            >
              Recuperar contraseña
            </h2>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "0.85rem", color: "#8a7a60",
                margin: "0 0 28px", lineHeight: 1.6,
              }}
            >
              Ingresa tu correo y te enviaremos un enlace para restablecerla.
            </p>

            {serverError && (
              <div
                style={{
                  background: "#fff5f5", border: "1px solid #fecaca",
                  borderRadius: "10px", padding: "10px 14px",
                  marginBottom: "16px", display: "flex", gap: "8px",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "0.82rem", color: "#991b1b",
                  }}
                >
                  {serverError}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label
                  style={{
                    display: "block", marginBottom: "6px",
                    fontSize: "0.78rem", fontWeight: 600,
                    letterSpacing: "0.04em", textTransform: "uppercase",
                    color: "#6b5c44", fontFamily: "var(--font-dm-sans)",
                  }}
                >
                  Correo electrónico
                </label>
                <div style={{ position: "relative" }}>
                  <Mail
                    style={{
                      position: "absolute", left: "13px", top: "50%",
                      transform: "translateY(-50%)",
                      width: "15px", height: "15px",
                      color: "#a89a80", pointerEvents: "none",
                    }}
                  />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="usuario@petcare.pe"
                    style={{
                      width: "100%", height: "46px",
                      padding: "0 14px 0 38px",
                      background: "var(--input-bg)",
                      border: errors.correo ? "1.5px solid #f87171" : "1.5px solid var(--input-border)",
                      borderRadius: "var(--radius)",
                      fontSize: "0.9rem", color: "#1a1208",
                      fontFamily: "var(--font-dm-sans)", outline: "none",
                      boxSizing: "border-box",
                    }}
                    className="login-input"
                    {...register("correo")}
                  />
                </div>
                {errors.correo && (
                  <p style={{ marginTop: "4px", fontSize: "0.75rem", color: "#dc2626", fontFamily: "var(--font-dm-sans)" }}>
                    {errors.correo.message}
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
                    Enviando…
                  </>
                ) : (
                  "Enviar enlace"
                )}
              </button>

              <Link
                href="/login"
                style={{
                  textAlign: "center",
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "0.82rem", color: "#8a7a60",
                  textDecoration: "none",
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
