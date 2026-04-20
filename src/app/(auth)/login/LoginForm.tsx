"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  correo: z.string().email("Correo inválido"),
  contrasena: z.string().min(6, "Mínimo 6 caracteres"),
});
type FormData = z.infer<typeof schema>;

/* ── Inline SVG leaf decoration ── */
function LeafDecor({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M60 155 C60 155 10 110 10 65 C10 30 35 5 60 5 C85 5 110 30 110 65 C110 110 60 155 60 155Z"
        fill="currentColor"
        opacity="0.12"
      />
      <path
        d="M60 155 L60 30"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.2"
        strokeLinecap="round"
      />
      <path
        d="M60 80 C60 80 30 65 25 50"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.15"
        strokeLinecap="round"
      />
      <path
        d="M60 95 C60 95 85 78 92 60"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.15"
        strokeLinecap="round"
      />
      <path
        d="M60 110 C60 110 38 98 32 84"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.12"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError(null);
    const err = await login(data.correo, data.contrasena);
    if (err) { setError(err); return; }
    router.push(params.get("next") ?? "/dashboard");
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden">

      {/* ── LEFT — Dark forest panel ── */}
      <div
        className="noise relative hidden md:flex md:w-[52%] flex-col justify-between overflow-hidden"
        style={{ background: "linear-gradient(160deg, #050e0a 0%, #0a1a11 45%, #0f2318 100%)" }}
      >
        {/* Radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 30% 55%, rgba(61,132,91,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Decorative leaves */}
        <LeafDecor className="absolute -right-8 top-[-20px] w-48 text-forest-300 rotate-12" />
        <LeafDecor className="absolute -left-12 bottom-20 w-56 text-forest-200 -rotate-20" />
        <LeafDecor className="absolute right-16 bottom-[-40px] w-32 text-gold-400 rotate-45" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full px-14 py-14">
          {/* Logo */}
          <div>
            <Image
              src="/logo/logo_h.png"
              alt="PetCare"
              width={140}
              height={38}
              className="object-contain brightness-[1.4] saturate-0 invert opacity-80"
              priority
            />
          </div>

          {/* Hero text */}
          <div className="space-y-6">
            <div>
              <p
                className="text-xs tracking-[0.2em] uppercase mb-4"
                style={{ color: "#3d845b", fontFamily: "var(--font-dm-sans)" }}
              >
                Veterinaria PetCare · UNAP 2026
              </p>
              <h1
                style={{
                  fontFamily: "var(--font-fraunces)",
                  fontSize: "clamp(2.6rem, 5vw, 4rem)",
                  fontWeight: 600,
                  fontStyle: "italic",
                  color: "#f2e8d5",
                  lineHeight: 1.1,
                  letterSpacing: "-0.03em",
                }}
              >
                Cuidado
                <br />
                <span style={{ color: "#c48c34" }}>excepcional</span>
                <br />
                para cada
                <br />
                paciente.
              </h1>
            </div>

            <p style={{ color: "#8a7a60", fontFamily: "var(--font-dm-sans)", fontSize: "0.9rem", maxWidth: "26ch", lineHeight: 1.7 }}>
              Sistema integral de gestión de citas, historias clínicas y seguimiento veterinario.
            </p>

            {/* Feature list */}
            <ul className="space-y-3">
              {[
                "Citas con verificación de disponibilidad",
                "Historias clínicas por veterinario",
                "Dashboard con métricas en tiempo real",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(61,132,91,0.25)", border: "1px solid rgba(61,132,91,0.4)" }}
                  >
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3.5 6L8 1" stroke="#55a876" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span style={{ color: "#a89a80", fontSize: "0.82rem", fontFamily: "var(--font-dm-sans)" }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p style={{ color: "#4a3d2e", fontSize: "0.72rem", fontFamily: "var(--font-dm-sans)" }}>
            © 2026 Veterinaria PetCare · Grupo 01 · UNAP
          </p>
        </div>
      </div>

      {/* ── RIGHT — Form panel ── */}
      <div
        className="flex w-full flex-col items-center justify-center px-6 py-12 md:w-[48%]"
        style={{ background: "var(--bg)" }}
      >
        {/* Mobile logo */}
        <div className="mb-8 md:hidden">
          <Image src="/logo/logo_h.png" alt="PetCare" width={130} height={36} className="object-contain" priority />
        </div>

        <div className="w-full max-w-[380px] animate-fade-up">
          {/* Heading */}
          <div className="mb-10">
            <h2
              style={{
                fontFamily: "var(--font-fraunces)",
                fontSize: "2rem",
                fontWeight: 500,
                fontStyle: "italic",
                color: "#1a1208",
                letterSpacing: "-0.025em",
                lineHeight: 1.2,
              }}
            >
              Iniciar sesión
            </h2>
            <p style={{ color: "#8a7a60", fontSize: "0.85rem", marginTop: "6px", fontFamily: "var(--font-dm-sans)" }}>
              Accede al sistema de gestión veterinaria
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div
              className="mb-6 flex items-start gap-3 rounded-xl px-4 py-3 text-sm animate-fade-up"
              style={{ background: "#fff5f5", border: "1px solid #fecaca", color: "#991b1b" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0">
                <circle cx="8" cy="8" r="7" stroke="#f87171" strokeWidth="1.5" />
                <path d="M8 5v4M8 11v.5" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span style={{ fontFamily: "var(--font-dm-sans)" }}>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600 transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email field */}
            <div className="delay-1 animate-fade-up">
              <label
                htmlFor="correo"
                style={{ display: "block", marginBottom: "6px", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "#6b5c44", fontFamily: "var(--font-dm-sans)" }}
              >
                Correo electrónico
              </label>
              <input
                id="correo"
                type="email"
                autoComplete="email"
                placeholder="usuario@petcare.pe"
                style={{
                  width: "100%",
                  height: "46px",
                  padding: "0 14px",
                  background: "var(--input-bg)",
                  border: errors.correo ? "1.5px solid #f87171" : "1.5px solid var(--input-border)",
                  borderRadius: "var(--radius)",
                  fontSize: "0.9rem",
                  color: "#1a1208",
                  fontFamily: "var(--font-dm-sans)",
                  outline: "none",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                className="login-input"
                {...register("correo")}
              />
              {errors.correo && (
                <p style={{ marginTop: "4px", fontSize: "0.75rem", color: "#dc2626", fontFamily: "var(--font-dm-sans)" }}>
                  {errors.correo.message}
                </p>
              )}
            </div>

            {/* Password field */}
            <div className="delay-2 animate-fade-up">
              <label
                htmlFor="contrasena"
                style={{ display: "block", marginBottom: "6px", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "#6b5c44", fontFamily: "var(--font-dm-sans)" }}
              >
                Contraseña
              </label>
              <input
                id="contrasena"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                style={{
                  width: "100%",
                  height: "46px",
                  padding: "0 14px",
                  background: "var(--input-bg)",
                  border: errors.contrasena ? "1.5px solid #f87171" : "1.5px solid var(--input-border)",
                  borderRadius: "var(--radius)",
                  fontSize: "0.9rem",
                  color: "#1a1208",
                  fontFamily: "var(--font-dm-sans)",
                  outline: "none",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                className="login-input"
                {...register("contrasena")}
              />
              {errors.contrasena && (
                <p style={{ marginTop: "4px", fontSize: "0.75rem", color: "#dc2626", fontFamily: "var(--font-dm-sans)" }}>
                  {errors.contrasena.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="delay-3 animate-fade-up pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  height: "48px",
                  background: isSubmitting ? "#285238" : "#0a1a11",
                  color: "#f2e8d5",
                  border: "none",
                  borderRadius: "var(--radius)",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  fontFamily: "var(--font-dm-sans)",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "background 0.2s, box-shadow 0.2s, transform 0.1s",
                  boxShadow: "0 4px 12px rgba(10,26,17,0.25)",
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    (e.target as HTMLButtonElement).style.background = "#162e20";
                    (e.target as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(10,26,17,0.35)";
                    (e.target as HTMLButtonElement).style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.background = isSubmitting ? "#285238" : "#0a1a11";
                  (e.target as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(10,26,17,0.25)";
                  (e.target as HTMLButtonElement).style.transform = "translateY(0)";
                }}
              >
                {isSubmitting ? (
                  <>
                    <span
                      style={{
                        width: "16px", height: "16px",
                        border: "2px solid rgba(242,232,213,0.3)",
                        borderTopColor: "#f2e8d5",
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "spin 0.7s linear infinite",
                      }}
                    />
                    Verificando…
                  </>
                ) : (
                  "Ingresar al sistema"
                )}
              </button>
            </div>
          </form>

          <p
            className="delay-4 animate-fade-up mt-8 text-center"
            style={{ fontSize: "0.72rem", color: "#a89a80", fontFamily: "var(--font-dm-sans)" }}
          >
            Sistema PetCare · Veterinaria · UNAP 2026-I
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .login-input:focus {
          border-color: #c48c34 !important;
          box-shadow: 0 0 0 3px rgba(196,140,52,0.12);
          outline: none;
        }
      `}</style>
    </div>
  );
}
