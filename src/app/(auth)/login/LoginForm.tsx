"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, PawPrint } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  correo: z.string().email("Correo inválido"),
  contrasena: z.string().min(6, "Mínimo 6 caracteres"),
});
type FormData = z.infer<typeof schema>;

/* Decorative paw prints scattered on the dark panel */
const pawPositions = [
  { top: "5%", left: "8%", size: 72, rotate: "-15deg", opacity: 0.13 },
  { top: "15%", left: "62%", size: 48, rotate: "30deg", opacity: 0.16 },
  { top: "35%", left: "78%", size: 88, rotate: "-8deg", opacity: 0.1 },
  { top: "52%", left: "6%", size: 60, rotate: "20deg", opacity: 0.14 },
  { top: "68%", left: "50%", size: 40, rotate: "-25deg", opacity: 0.17 },
  { top: "80%", left: "24%", size: 68, rotate: "12deg", opacity: 0.12 },
  { top: "88%", left: "70%", size: 50, rotate: "-40deg", opacity: 0.15 },
  { top: "25%", left: "36%", size: 34, rotate: "55deg", opacity: 0.11 },
];

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
    if (err) {
      setError(err);
      return;
    }
    router.push(params.get("next") ?? "/dashboard");
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      {/* ── LEFT — Dark forest panel ── */}
      <div
        className="noise relative hidden md:flex md:w-[52%] flex-col justify-between overflow-hidden"
        style={{
          background:
            "linear-gradient(155deg, #061209 0%, #0a1a11 40%, #0f2318 100%)",
        }}
      >
        {/* Ambient glows */}
        <div
          style={{
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 65% 55% at 25% 50%, rgba(61,132,91,0.14) 0%, transparent 65%)",
          }}
        />
        <div
          style={{
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 40% 35% at 80% 20%, rgba(196,140,52,0.07) 0%, transparent 60%)",
          }}
        />

        {/* Scattered decorative paw prints */}
        {pawPositions.map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: p.top,
              left: p.left,
              transform: `rotate(${p.rotate})`,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                opacity: p.opacity,
                color: i % 2 === 0 ? "#55a876" : "#c48c34",
                animation: `pawFloat${i % 3} ${6 + i * 0.8}s ease-in-out infinite`,
              }}
            >
              <PawPrint style={{ width: p.size, height: p.size }} />
            </div>
          </div>
        ))}

        {/* Right-edge feather blend into cream */}
        <div
          style={{
            pointerEvents: "none",
            position: "absolute",
            top: 0,
            right: 0,
            width: "80px",
            bottom: 0,
            background:
              "linear-gradient(to right, transparent, rgba(245,240,232,0.04) 70%, rgba(245,240,232,0.10))",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full px-14 py-14">
          {/* Logo */}
          <div>
            <Image
              src="/logo/logo_h.png"
              alt="PetCare"
              width={140}
              height={38}
              className="object-contain"
              style={{ filter: "brightness(0) invert(1)", opacity: 0.88, height: "auto" }}
              priority
            />
          </div>

          {/* Hero text */}
          <div className="space-y-6">
            <div>
              <p
                style={{
                  fontSize: "0.72rem",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  marginBottom: "16px",
                  color: "#3d845b",
                  fontFamily: "var(--font-dm-sans)",
                  fontWeight: 700,
                }}
              >
                Veterinaria PetCare
              </p>
              <h1
                style={{
                  fontFamily: "var(--font-fraunces)",
                  fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)",
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

            <p
              style={{
                color: "#7a6e58",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "0.88rem",
                maxWidth: "28ch",
                lineHeight: 1.7,
              }}
            >
              Sistema integral de gestión de citas, historias clínicas y
              seguimiento veterinario.
            </p>

            <ul className="space-y-3">
              {[
                "Citas con verificación de disponibilidad",
                "Historias clínicas por veterinario",
                "Dashboard con métricas en tiempo real",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span
                    style={{
                      display: "flex",
                      width: "20px",
                      height: "20px",
                      flexShrink: 0,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                      background: "rgba(61,132,91,0.22)",
                      border: "1px solid rgba(61,132,91,0.35)",
                    }}
                  >
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path
                        d="M1 3.5L3.5 6L8 1"
                        stroke="#55a876"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span
                    style={{
                      color: "#9a8c72",
                      fontSize: "0.82rem",
                      fontFamily: "var(--font-dm-sans)",
                    }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p
            style={{
              color: "#2a2118",
              fontSize: "0.7rem",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            © 2026 Veterinaria PetCare
          </p>
        </div>
      </div>

      {/* ── RIGHT — Form panel ── */}
      <div
        className="flex w-full flex-col items-center justify-center px-6 py-12 md:w-[48%]"
        style={{ background: "var(--bg)", position: "relative" }}
      >
        {/* Left-edge shadow to soften the seam on desktop */}
        <div
          className="hidden md:block"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "32px",
            bottom: 0,
            pointerEvents: "none",
            background:
              "linear-gradient(to right, rgba(10,26,17,0.08), transparent)",
          }}
        />

        {/* Mobile logo */}
        <div className="mb-8 md:hidden">
          <Image
            src="/logo/logo_h.png"
            alt="PetCare"
            width={130}
            height={36}
            className="object-contain"
            style={{ height: "auto" }}
            priority
          />
        </div>

        <div
          className="w-full max-w-95 animate-fade-up"
          style={{ position: "relative", zIndex: 1 }}
        >
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
            <p
              style={{
                color: "#8a7a60",
                fontSize: "0.85rem",
                marginTop: "6px",
                fontFamily: "var(--font-dm-sans)",
              }}
            >
              Accede al sistema de gestión veterinaria
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div
              className="mb-6 flex items-start gap-3 rounded-xl px-4 py-3 text-sm animate-fade-up"
              style={{
                background: "#fff5f5",
                border: "1px solid #fecaca",
                color: "#991b1b",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="mt-0.5 shrink-0"
              >
                <circle
                  cx="8"
                  cy="8"
                  r="7"
                  stroke="#f87171"
                  strokeWidth="1.5"
                />
                <path
                  d="M8 5v4M8 11v.5"
                  stroke="#f87171"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <span style={{ fontFamily: "var(--font-dm-sans)" }}>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M1 1l12 12M13 1L1 13"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email field */}
            <div className="delay-1 animate-fade-up">
              <label
                htmlFor="correo"
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "#6b5c44",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                Correo electrónico
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  style={{
                    position: "absolute",
                    left: "13px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "15px",
                    height: "15px",
                    color: "#a89a80",
                    pointerEvents: "none",
                  }}
                />
                <input
                  id="correo"
                  type="email"
                  autoComplete="email"
                  placeholder="usuario@petcare.pe"
                  style={{
                    width: "100%",
                    height: "46px",
                    padding: "0 14px 0 38px",
                    background: "var(--input-bg)",
                    border: errors.correo
                      ? "1.5px solid #f87171"
                      : "1.5px solid var(--input-border)",
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
              </div>
              {errors.correo && (
                <p
                  style={{
                    marginTop: "4px",
                    fontSize: "0.75rem",
                    color: "#dc2626",
                    fontFamily: "var(--font-dm-sans)",
                  }}
                >
                  {errors.correo.message}
                </p>
              )}
            </div>

            {/* Password field */}
            <div className="delay-2 animate-fade-up">
              <label
                htmlFor="contrasena"
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "#6b5c44",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                Contraseña
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  style={{
                    position: "absolute",
                    left: "13px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "15px",
                    height: "15px",
                    color: "#a89a80",
                    pointerEvents: "none",
                  }}
                />
                <input
                  id="contrasena"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    height: "46px",
                    padding: "0 14px 0 38px",
                    background: "var(--input-bg)",
                    border: errors.contrasena
                      ? "1.5px solid #f87171"
                      : "1.5px solid var(--input-border)",
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
              </div>
              {errors.contrasena && (
                <p
                  style={{
                    marginTop: "4px",
                    fontSize: "0.75rem",
                    color: "#dc2626",
                    fontFamily: "var(--font-dm-sans)",
                  }}
                >
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
                  transition:
                    "background 0.2s, box-shadow 0.2s, transform 0.1s",
                  boxShadow: "0 4px 14px rgba(10,26,17,0.28)",
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "#162e20";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      "0 6px 22px rgba(10,26,17,0.38)";
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    isSubmitting ? "#285238" : "#0a1a11";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 4px 14px rgba(10,26,17,0.28)";
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    "translateY(0)";
                }}
                onMouseDown={(e) => {
                  if (!isSubmitting)
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "translateY(0) scale(0.98)";
                }}
                onMouseUp={(e) => {
                  if (!isSubmitting)
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "translateY(-1px)";
                }}
              >
                {isSubmitting ? (
                  <>
                    <span
                      style={{
                        width: "16px",
                        height: "16px",
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
            style={{
              fontSize: "0.72rem",
              color: "#c4b89c",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            Sistema PetCare · Gestión Veterinaria
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .login-input:focus {
          border-color: #c48c34 !important;
          box-shadow: 0 0 0 3px rgba(196,140,52,0.14);
          outline: none;
        }
        @keyframes pawFloat0 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-9px); }
        }
        @keyframes pawFloat1 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(7px); }
        }
        @keyframes pawFloat2 {
          0%, 100% { transform: translateY(0px); }
          33% { transform: translateY(-6px); }
          66% { transform: translateY(5px); }
        }
      `}</style>
    </div>
  );
}
