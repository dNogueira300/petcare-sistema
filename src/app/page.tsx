"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import vetBg from "../../public/vet_bg.webp";
import {
  PawPrint,
  Stethoscope,
  Syringe,
  Scissors,
  Smile,
  HeartPulse,
  FlaskConical,
  CalendarPlus,
  Phone,
  MapPin,
  ChevronDown,
  CheckCircle,
  X,
  ArrowRight,
  Menu as MenuIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { slotsDisponibles, hoyCimaFecha } from "@/utils/datetime";
import { passwordSchema } from "@/utils/password";
import { PasswordStrength } from "@/components/ui/password-strength";

/* ═══════════════════════════════════════════
   Scroll-reveal hook
═══════════════════════════════════════════ */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          // Añadir al entrar, quitar al salir → el efecto se repite en cada scroll
          if (e.isIntersecting) {
            e.target.classList.add("land-visible");
          } else {
            e.target.classList.remove("land-visible");
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -50px 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/* ═══════════════════════════════════════════
   Floating paw decorations
═══════════════════════════════════════════ */
const PAWS = [
  { top: "8%", left: "5%", size: 80, delay: "0s", dur: "7s", op: 0.1 },
  { top: "18%", left: "72%", size: 52, delay: "1.2s", dur: "9s", op: 0.14 },
  { top: "40%", left: "88%", size: 96, delay: "0.5s", dur: "11s", op: 0.08 },
  { top: "55%", left: "3%", size: 64, delay: "2s", dur: "8s", op: 0.12 },
  { top: "72%", left: "55%", size: 44, delay: "1s", dur: "10s", op: 0.1 },
  { top: "85%", left: "20%", size: 72, delay: "0.8s", dur: "7.5s", op: 0.09 },
  { top: "30%", left: "40%", size: 36, delay: "3s", dur: "12s", op: 0.07 },
];

/* ═══════════════════════════════════════════
   SERVICES data
═══════════════════════════════════════════ */
const SERVICES = [
  {
    icon: Stethoscope,
    title: "Medicina General",
    desc: "Consultas, diagnósticos y control de salud para tu mascota.",
  },
  {
    icon: FlaskConical,
    title: "Laboratorio",
    desc: "Análisis clínicos completos con resultados el mismo día.",
  },
  {
    icon: Syringe,
    title: "Vacunación",
    desc: "Calendario de vacunas personalizado para cada especie.",
  },
  {
    icon: Scissors,
    title: "Cirugía",
    desc: "Quirófano moderno con monitoreo durante todo el procedimiento.",
  },
  {
    icon: Smile,
    title: "Odontología",
    desc: "Limpieza dental profesional y tratamientos bucales.",
  },
  {
    icon: HeartPulse,
    title: "Urgencias",
    desc: "Atención de emergencias con equipo capacitado.",
  },
];

const STATS = [
  { n: "10+", label: "Años de experiencia" },
  { n: "5,000+", label: "Pacientes atendidos" },
  { n: "2", label: "Veterinarios especializados" },
  { n: "98%", label: "Clientes satisfechos" },
];

/* ═══════════════════════════════════════════
   NAVBAR
═══════════════════════════════════════════ */
function Navbar({
  scrolled,
  onBook,
}: {
  scrolled: boolean;
  onBook: () => void;
}) {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: scrolled ? "rgba(6,18,9,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(61,132,91,0.15)" : "none",
        transition:
          "background 0.4s ease, backdrop-filter 0.4s ease, border 0.4s ease",
        padding: "0 clamp(20px, 4vw, 60px)",
        height: "68px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          textDecoration: "none",
        }}
      >
        <Image
          src="/logo/logo_h.png"
          alt="PetCare"
          width={110}
          height={30}
          style={{
            height: "auto",
            filter: "brightness(0) invert(1)",
            opacity: 0.9,
          }}
        />
      </Link>

      {/* Desktop nav */}
      <nav
        className="hidden md:flex"
        style={{ gap: "8px", alignItems: "center" }}
      >
        {[
          ["Inicio", "hero"],
          ["Servicios", "servicios"],
          ["Horarios", "horarios"],
          ["Contacto", "contacto"],
        ].map(([l, id]) => (
          <button
            key={id}
            onClick={() => scrollTo(id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.75)",
              fontSize: "0.85rem",
              fontFamily: "var(--font-dm-sans)",
              padding: "8px 14px",
              borderRadius: "8px",
              transition: "color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#fff";
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "rgba(255,255,255,0.75)";
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
            }}
          >
            {l}
          </button>
        ))}
        <div
          style={{
            width: "1px",
            height: "20px",
            background: "rgba(255,255,255,0.15)",
            margin: "0 6px",
          }}
        />
        {user ? (
          <Link
            href={user.rol === "cliente" ? "/portal" : "/dashboard"}
            style={{
              background: "linear-gradient(135deg,#3d845b,#2d6647)",
              color: "#fff",
              padding: "9px 20px",
              borderRadius: "10px",
              fontSize: "0.85rem",
              fontWeight: 600,
              fontFamily: "var(--font-dm-sans)",
              textDecoration: "none",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.opacity = "0.85")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.opacity = "1")
            }
          >
            Ir al sistema →
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              style={{
                color: "rgba(255,255,255,0.75)",
                fontSize: "0.85rem",
                fontFamily: "var(--font-dm-sans)",
                padding: "8px 14px",
                textDecoration: "none",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.color = "#fff")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.color =
                  "rgba(255,255,255,0.75)")
              }
            >
              Iniciar sesión
            </Link>
            <button
              onClick={onBook}
              style={{
                background: "linear-gradient(135deg,#c48c34,#a07028)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                padding: "9px 20px",
                borderRadius: "10px",
                fontSize: "0.85rem",
                fontWeight: 600,
                fontFamily: "var(--font-dm-sans)",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.opacity = "0.85")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
              }
            >
              Agendar cita
            </button>
          </>
        )}
      </nav>

      {/* Mobile hamburger */}
      <button
        className="md:hidden"
        onClick={() => setMobileOpen((v) => !v)}
        style={{
          background: "none",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          padding: "6px",
        }}
      >
        <MenuIcon size={22} />
      </button>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          style={{
            position: "absolute",
            top: "68px",
            left: 0,
            right: 0,
            background: "rgba(6,18,9,0.98)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(61,132,91,0.2)",
            display: "flex",
            flexDirection: "column",
            padding: "16px 24px 24px",
            gap: "4px",
          }}
        >
          {[
            ["Inicio", "hero"],
            ["Servicios", "servicios"],
            ["Horarios", "horarios"],
            ["Contacto", "contacto"],
          ].map(([l, id]) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.8)",
                fontSize: "0.95rem",
                fontFamily: "var(--font-dm-sans)",
                padding: "12px 0",
                textAlign: "left",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {l}
            </button>
          ))}
          <div style={{ height: "16px" }} />
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: "0.9rem",
              fontFamily: "var(--font-dm-sans)",
              marginBottom: "10px",
              textAlign: "left",
              textDecoration: "none",
              display: "block",
            }}
          >
            Iniciar sesión
          </Link>
          <button
            onClick={() => {
              onBook();
              setMobileOpen(false);
            }}
            style={{
              background: "linear-gradient(135deg,#c48c34,#a07028)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              padding: "12px",
              borderRadius: "10px",
              fontSize: "0.95rem",
              fontWeight: 600,
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            Agendar cita
          </button>
        </div>
      )}
    </header>
  );
}

/* ═══════════════════════════════════════════
   HERO
═══════════════════════════════════════════ */
function Hero({ onBook }: { onBook: () => void }) {
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section
      id="hero"
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* LCP background — optimized & priority-loaded */}
      <Image
        src={vetBg}
        alt=""
        fill
        priority
        placeholder="blur"
        sizes="100vw"
        style={{ objectFit: "cover", objectPosition: "center", zIndex: 0 }}
      />
      {/* Gradient overlay (was part of the CSS background-image) */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background:
            "linear-gradient(155deg, rgba(6,18,9,0.78) 0%, rgba(10,26,17,0.72) 40%, rgba(15,35,24,0.75) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Bokeh glow circles */}
      {[
        { w: 500, h: 500, t: "10%", l: "60%", c: "#3d845b" },
        { w: 350, h: 350, t: "55%", l: "-5%", c: "#c48c34" },
        { w: 280, h: 280, t: "75%", l: "75%", c: "#3d845b" },
      ].map((g, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: `${g.w}px`,
            height: `${g.h}px`,
            borderRadius: "50%",
            top: g.t,
            left: g.l,
            transform: "translate(-50%,-50%)",
            background: `radial-gradient(ellipse, ${g.c}20 0%, transparent 70%)`,
            animation: "heroPulse 6s ease-in-out infinite",
            animationDelay: `${i * 2}s`,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Floating paw prints */}
      {PAWS.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: p.top,
            left: p.left,
            color: "#3d845b",
            animation: `floatPaw ${p.dur} ease-in-out infinite`,
            animationDelay: p.delay,
            pointerEvents: "none",
            ["--base-op" as string]: p.op,
          }}
        >
          <PawPrint size={p.size} opacity={p.op} />
        </div>
      ))}

      {/* Hero content */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          textAlign: "center",
          padding: "0 clamp(24px,6vw,80px)",
          maxWidth: "860px",
          width: "100%",
        }}
      >
        <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
          <span
            style={{
              display: "inline-block",
              background: "rgba(61,132,91,0.18)",
              border: "1px solid rgba(61,132,91,0.35)",
              color: "#80cc9c",
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              padding: "6px 18px",
              borderRadius: "99px",
              fontFamily: "var(--font-dm-sans)",
              marginBottom: "28px",
            }}
          >
            Veterinaria PetCare · Iquitos, Perú
          </span>
        </div>

        <h1
          className="animate-fade-up"
          style={{
            animationDelay: "200ms",
            fontFamily: "var(--font-fraunces)",
            fontSize: "clamp(2.6rem, 7vw, 5.2rem)",
            fontWeight: 700,
            fontStyle: "italic",
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            color: "#fff",
            margin: "0 0 12px",
          }}
        >
          Cuidado experto para
        </h1>
        <h1
          className="animate-fade-up"
          style={{
            animationDelay: "300ms",
            fontFamily: "var(--font-fraunces)",
            fontSize: "clamp(2.6rem, 7vw, 5.2rem)",
            fontWeight: 700,
            fontStyle: "italic",
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            color: "#00bf63",
            WebkitTextStroke: "1.5px #004118",
            //textShadow: "0 0 40px rgba(18,233,20,0.45)",
            margin: "0 0 28px",
          }}
        >
          los que más amas.
        </h1>

        <p
          className="animate-fade-up"
          style={{
            animationDelay: "400ms",
            color: "rgba(255,255,255,0.6)",
            fontSize: "clamp(1rem,2.5vw,1.2rem)",
            fontFamily: "var(--font-dm-sans)",
            lineHeight: 1.7,
            maxWidth: "560px",
            margin: "0 auto 44px",
          }}
        >
          Medicina veterinaria de alto nivel, tecnología moderna y un equipo
          apasionado. Porque tu mascota merece lo mejor.
        </p>

        <div
          className="animate-fade-up"
          style={{
            animationDelay: "500ms",
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={onBook}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "linear-gradient(135deg, #c48c34 0%, #a07028 100%)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              padding: "16px 32px",
              borderRadius: "14px",
              fontSize: "1rem",
              fontWeight: 700,
              fontFamily: "var(--font-dm-sans)",
              boxShadow: "0 8px 32px rgba(196,140,52,0.35)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.transform = "translateY(-2px)";
              b.style.boxShadow = "0 12px 40px rgba(196,140,52,0.45)";
            }}
            onMouseLeave={(e) => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.transform = "translateY(0)";
              b.style.boxShadow = "0 8px 32px rgba(196,140,52,0.35)";
            }}
          >
            <CalendarPlus size={18} /> Agendar cita ahora
          </button>
          <button
            onClick={() => scrollTo("servicios")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.85)",
              border: "1.5px solid rgba(255,255,255,0.18)",
              cursor: "pointer",
              padding: "16px 32px",
              borderRadius: "14px",
              fontSize: "1rem",
              fontWeight: 600,
              fontFamily: "var(--font-dm-sans)",
              transition: "all 0.2s ease",
              backdropFilter: "blur(8px)",
            }}
            onMouseEnter={(e) => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.background = "rgba(255,255,255,0.14)";
            }}
            onMouseLeave={(e) => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.background = "rgba(255,255,255,0.08)";
            }}
          >
            Ver servicios <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Scroll indicator — solo el chevron, sin texto */}
      <div
        style={{
          position: "absolute",
          bottom: "36px",
          left: "50%",
          transform: "translateX(-50%)",
          animation: "scrollBounce 2s ease-in-out infinite",
          cursor: "pointer",
        }}
        onClick={() => scrollTo("servicios")}
      >
        <ChevronDown size={22} color="rgba(255,255,255,0.30)" />
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   SERVICES
═══════════════════════════════════════════ */
function ServicesSection() {
  return (
    <section
      id="servicios"
      style={{ background: "#faf8f3", padding: "clamp(60px,10vw,100px) clamp(20px,6vw,80px)" }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div data-reveal style={{ textAlign: "center", marginBottom: "clamp(32px,6vw,64px)" }}>
          <span
            style={{
              color: "#3d845b",
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            Nuestros servicios
          </span>
          <h2
            style={{
              fontFamily: "var(--font-fraunces)",
              fontSize: "clamp(1.8rem,4vw,2.8rem)",
              fontWeight: 700,
              fontStyle: "italic",
              color: "#1a1208",
              marginTop: "12px",
              letterSpacing: "-0.02em",
            }}
          >
            Todo lo que tu mascota necesita
          </h2>
        </div>
        {/* carousel on mobile, grid on sm+ */}
        <div className="land-services-grid">
          {SERVICES.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                data-reveal
                className={`delay-${Math.min(i + 1, 5) * 100}`}
                style={{
                  background: "#fff",
                  borderRadius: "16px",
                  padding: "28px",
                  border: "1px solid #e8e0d0",
                  transition: "all 0.25s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  const d = e.currentTarget as HTMLDivElement;
                  d.style.transform = "translateY(-4px)";
                  d.style.boxShadow = "0 12px 40px rgba(26,18,8,0.10)";
                  d.style.borderColor = "#3d845b40";
                }}
                onMouseLeave={(e) => {
                  const d = e.currentTarget as HTMLDivElement;
                  d.style.transform = "translateY(0)";
                  d.style.boxShadow = "none";
                  d.style.borderColor = "#e8e0d0";
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "13px",
                    background: "linear-gradient(135deg,#f0fdf4,#dcfce7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                  }}
                >
                  <Icon size={22} color="#3d845b" />
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-fraunces)",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "#1a1208",
                    marginBottom: "8px",
                  }}
                >
                  {s.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "0.85rem",
                    color: "#8a7a60",
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   STATS
═══════════════════════════════════════════ */
function StatsSection() {
  return (
    <section
      style={{
        background: "linear-gradient(135deg,#0a1a11,#0f2318)",
        padding: "clamp(48px,8vw,80px) clamp(20px,6vw,80px)",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* carousel on mobile, 4-col grid on sm+ */}
        <div className="land-stats-row">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              data-reveal
              className={`delay-${i * 100}`}
              style={{ textAlign: "center" }}
            >
              <p
                style={{
                  fontFamily: "var(--font-fraunces)",
                  fontSize: "clamp(2rem,5vw,3.4rem)",
                  fontWeight: 700,
                  color: "#80cc9c",
                  margin: "0 0 8px",
                  letterSpacing: "-0.02em",
                }}
              >
                {s.n}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "0.82rem",
                  color: "rgba(255,255,255,0.55)",
                  margin: 0,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontWeight: 600,
                }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   SCHEDULE + CTA
═══════════════════════════════════════════ */
function ScheduleSection({ onBook }: { onBook: () => void }) {
  const schedule = [
    {
      day: "Lunes – Viernes",
      hours: "7:00 am – 1:00 pm  ·  3:00 pm – 8:00 pm",
    },
    { day: "Sábado", hours: "8:00 am – 3:00 pm" },
    { day: "Domingo", hours: "Cerrado" },
    { day: "Emergencias", hours: "24 horas" },
  ];
  return (
    <section
      id="horarios"
      style={{ background: "#faf8f3", padding: "clamp(60px,10vw,100px) clamp(20px,6vw,80px)" }}
    >
      <div
        className="land-schedule-grid"
        style={{ maxWidth: "1100px", margin: "0 auto" }}
      >
        <div data-reveal>
          <span
            style={{
              color: "#3d845b",
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            Horarios de atención
          </span>
          <h2
            style={{
              fontFamily: "var(--font-fraunces)",
              fontSize: "clamp(1.8rem,3.5vw,2.6rem)",
              fontWeight: 700,
              fontStyle: "italic",
              color: "#1a1208",
              margin: "12px 0 32px",
              letterSpacing: "-0.02em",
            }}
          >
            Siempre disponibles cuando nos necesitas
          </h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1px",
              borderRadius: "14px",
              overflow: "hidden",
              border: "1px solid #e8e0d0",
            }}
          >
            {schedule.map((s, i) => (
              <div
                key={s.day}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "18px 24px",
                  background:
                    s.hours === "24 horas"
                      ? "#fdf6e6"
                      : i % 2 === 0
                        ? "#fff"
                        : "#faf6ef",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontWeight: 600,
                    color: s.hours === "24 horas" ? "#a07028" : "#1a1208",
                    fontSize: "0.9rem",
                  }}
                >
                  {s.day}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "0.85rem",
                    color:
                      s.hours === "Cerrado"
                        ? "#dc2626"
                        : s.hours === "24 horas"
                          ? "#c48c34"
                          : "#3d845b",
                    fontWeight: s.hours === "24 horas" ? 700 : 500,
                  }}
                >
                  {s.hours}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginTop: "28px",
            }}
          >
            <MapPin size={16} color="#3d845b" />
            <span
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "0.88rem",
                color: "#8a7a60",
              }}
            >
              Av. Ejemplo 1234, Iquitos, Loreto
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginTop: "10px",
            }}
          >
            <Phone size={16} color="#3d845b" />
            <span
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "0.88rem",
                color: "#8a7a60",
              }}
            >
              +51 987 654 321
            </span>
          </div>
        </div>

        <div
          data-reveal
          className="delay-200"
          style={{
            background: "linear-gradient(135deg,#0a1a11,#0f2318)",
            borderRadius: "24px",
            padding: "48px 40px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 12px 40px rgba(6,18,9,0.25)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-30px",
              right: "-30px",
              color: "#3d845b",
            }}
          >
            <PawPrint size={120} opacity={0.07} />
          </div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "18px",
                background: "rgba(196,140,52,0.15)",
                border: "1px solid rgba(196,140,52,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <CalendarPlus size={28} color="#c48c34" />
            </div>
            <h3
              style={{
                fontFamily: "var(--font-fraunces)",
                fontSize: "1.8rem",
                fontWeight: 700,
                fontStyle: "italic",
                color: "#fff",
                margin: "0 0 12px",
                letterSpacing: "-0.02em",
              }}
            >
              ¿Listo para agendar?
            </h3>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "0.88rem",
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.7,
                margin: "0 0 32px",
              }}
            >
              Reserva en minutos. Sin filas, sin espera. Tu mascota en manos
              expertas.
            </p>
            <button
              onClick={onBook}
              style={{
                width: "100%",
                background: "linear-gradient(135deg,#c48c34,#a07028)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                padding: "16px",
                borderRadius: "12px",
                fontSize: "1rem",
                fontWeight: 700,
                fontFamily: "var(--font-dm-sans)",
                boxShadow: "0 8px 24px rgba(196,140,52,0.3)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.transform = "translateY(-2px)";
                b.style.boxShadow = "0 12px 32px rgba(196,140,52,0.45)";
              }}
              onMouseLeave={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.transform = "translateY(0)";
                b.style.boxShadow = "0 8px 24px rgba(196,140,52,0.3)";
              }}
            >
              Agendar mi cita
            </button>
            <p
              style={{
                marginTop: "16px",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.3)",
              }}
            >
              Sin cargo de reserva · Cancela cuando quieras
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════ */
function Footer() {
  return (
    <footer
      id="contacto"
      style={{
        background: "#061209",
        padding: "clamp(40px,8vw,60px) clamp(20px,6vw,80px) clamp(24px,4vw,32px)",
        borderTop: "1px solid rgba(61,132,91,0.15)",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div className="land-footer-grid">
          <div>
            <Image
              src="/logo/logo_h.png"
              alt="PetCare"
              width={120}
              height={32}
              style={{
                height: "auto",
                filter: "brightness(0) invert(1)",
                opacity: 0.8,
                marginBottom: "16px",
              }}
            />
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "0.85rem",
                color: "rgba(255,255,255,0.65)",
                lineHeight: 1.7,
                maxWidth: "300px",
              }}
            >
              Brindando atención veterinaria de excelencia desde 2014. Tu
              mascota es parte de nuestra familia.
            </p>
          </div>
          <div>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontWeight: 700,
                color: "#fff",
                fontSize: "0.8rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              Sistema
            </p>
            {[
              ["Iniciar sesión", "/login"],
              ["Panel de control", "/dashboard"],
            ].map(([l, h]) => (
              <Link
                key={l}
                href={h}
                style={{
                  display: "block",
                  color: "rgba(255,255,255,0.7)",
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "0.85rem",
                  textDecoration: "none",
                  marginBottom: "10px",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color = "#fff")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.color =
                    "rgba(255,255,255,0.7)")
                }
              >
                {l}
              </Link>
            ))}
          </div>
          <div>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontWeight: 700,
                color: "#fff",
                fontSize: "0.8rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              Contacto
            </p>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "0.85rem",
                color: "rgba(255,255,255,0.7)",
                marginBottom: "8px",
              }}
            >
              +51 987 654 321
            </p>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "0.85rem",
                color: "rgba(255,255,255,0.7)",
                marginBottom: "8px",
              }}
            >
              contacto@petcare.pe
            </p>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "0.85rem",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              Av. Ejemplo 1234, Iquitos, Loreto
            </p>
          </div>
        </div>
        <div
          className="land-footer-bottom"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.10)",
            paddingTop: "24px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "0.78rem",
              color: "rgba(255,255,255,0.5)",
              margin: 0,
            }}
          >
            © {new Date().getFullYear()} Veterinaria PetCare. Todos los derechos
            reservados.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <PawPrint size={12} color="rgba(61,132,91,0.6)" />
            <span
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.45)",
              }}
            >
              Hecho con amor para tus mascotas
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════
   BOOKING MODAL
═══════════════════════════════════════════ */
type ModalStep = "choice" | "register" | "login" | "booking" | "success";

function BookingModal({
  open,
  onClose,
  initialUser,
  initialStep = "choice",
}: {
  open: boolean;
  onClose: () => void;
  initialUser: boolean;
  initialStep?: ModalStep;
}) {
  const [step, setStep] = useState<ModalStep>(
    initialUser ? "booking" : initialStep,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset on open — adjusting state during rendering (no effect needed)
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setStep(initialUser ? "booking" : initialStep);
      setError(null);
    }
  }

  // --- Register state ---
  const [reg, setReg] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    contrasena: "",
    telefono: "",
  });
  const { login } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const passResult = passwordSchema.safeParse(reg.contrasena);
    if (!passResult.success) {
      setError(passResult.error.issues[0]?.message ?? "Contraseña inválida");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/public/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reg),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Error al registrar");
        return;
      }
      // Auto-login tras registro exitoso → redirigir al portal del cliente
      const loginErr = await login(reg.correo, reg.contrasena);
      if (loginErr) {
        onClose();
        window.location.href = "/login";
        return;
      }
      window.location.href = "/portal";
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // --- Login state ---
  const [loginData, setLoginData] = useState({ correo: "", contrasena: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const err = await login(loginData.correo, loginData.contrasena);
      if (err) {
        setError(err);
        return;
      }
      // Leer rol del sessionStorage (ya guardado por login())
      const stored = sessionStorage.getItem("petcare_user");
      const rol = stored ? (JSON.parse(stored) as { rol: string }).rol : null;
      if (rol === "cliente") {
        window.location.href = "/portal";
        return;
      }
      setStep("booking"); // staff puede agendar cita
    } finally {
      setLoading(false);
    }
  };

  // --- Booking state ---
  const [cita, setCita] = useState({
    nombreMascota: "",
    especie: "Perro",
    fecha: "",
    hora: "",
    motivo: "",
  });
  const slots = cita.fecha ? slotsDisponibles(cita.fecha) : [];

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("success");
  };

  if (!open) return null;

  const inputCls: React.CSSProperties = {
    height: "40px",
    width: "100%",
    borderRadius: "9px",
    border: "1.5px solid #d0c8b8",
    background: "#fdfaf5",
    padding: "0 12px",
    fontSize: "0.875rem",
    fontFamily: "var(--font-dm-sans)",
    color: "#1a1208",
    outline: "none",
    boxSizing: "border-box" as const,
  };
  const labelStyle: React.CSSProperties = {
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    color: "#6b5c44",
    fontFamily: "var(--font-dm-sans)",
    display: "block",
    marginBottom: "5px",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(6,18,9,0.7)",
          backdropFilter: "blur(8px)",
        }}
        onClick={onClose}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "460px",
          background: "#fff",
          borderRadius: "24px",
          boxShadow:
            "0 32px 80px rgba(10,26,17,0.4), 0 0 0 1px rgba(255,255,255,0.1)",
          overflow: "hidden",
          animation: "fadeUp 0.3s cubic-bezier(0.16,1,0.3,1) both",
        }}
      >
        {/* Header bar */}
        <div
          style={{
            background: "linear-gradient(135deg,#0a1a11,#0f2318)",
            padding: "24px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "var(--font-fraunces)",
                fontStyle: "italic",
                fontSize: "1.2rem",
                fontWeight: 700,
                color: "#fff",
                margin: 0,
              }}
            >
              {step === "choice" && "Agendar una cita"}
              {step === "register" && "Crear cuenta"}
              {step === "login" && "Iniciar sesión"}
              {step === "booking" && "Solicitar cita"}
              {step === "success" && "¡Solicitud enviada!"}
            </p>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "0.78rem",
                color: "rgba(255,255,255,0.45)",
                margin: "4px 0 0",
              }}
            >
              Veterinaria PetCare
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "none",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              width: "34px",
              height: "34px",
              borderRadius: "9px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "28px" }}>
          {/* CHOICE */}
          {step === "choice" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "0.9rem",
                  color: "#8a7a60",
                  textAlign: "center",
                  marginBottom: "8px",
                }}
              >
                Para agendar necesitas una cuenta en nuestro sistema.
              </p>
              <button
                onClick={() => setStep("register")}
                style={{
                  padding: "18px",
                  borderRadius: "14px",
                  border: "1.5px solid #e8e0d0",
                  background: "#faf8f3",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                onMouseEnter={(e) => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.borderColor = "#3d845b";
                  b.style.background = "#f0fdf4";
                }}
                onMouseLeave={(e) => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.borderColor = "#e8e0d0";
                  b.style.background = "#faf8f3";
                }}
              >
                <div>
                  <p
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontWeight: 700,
                      color: "#1a1208",
                      margin: 0,
                    }}
                  >
                    Soy nuevo aquí
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "0.82rem",
                      color: "#8a7a60",
                      margin: "3px 0 0",
                    }}
                  >
                    Crear mi cuenta gratis
                  </p>
                </div>
                <ArrowRight size={18} color="#3d845b" />
              </button>
              <button
                onClick={() => { onClose(); window.location.href = "/login"; }}
                style={{
                  padding: "18px",
                  borderRadius: "14px",
                  border: "1.5px solid #e8e0d0",
                  background: "#faf8f3",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                onMouseEnter={(e) => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.borderColor = "#c48c34";
                  b.style.background = "#fdf6e6";
                }}
                onMouseLeave={(e) => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.borderColor = "#e8e0d0";
                  b.style.background = "#faf8f3";
                }}
              >
                <div>
                  <p
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontWeight: 700,
                      color: "#1a1208",
                      margin: 0,
                    }}
                  >
                    Ya tengo cuenta
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "0.82rem",
                      color: "#8a7a60",
                      margin: "3px 0 0",
                    }}
                  >
                    Iniciar sesión
                  </p>
                </div>
                <ArrowRight size={18} color="#c48c34" />
              </button>
            </div>
          )}

          {/* REGISTER */}
          {step === "register" && (
            <form
              onSubmit={handleRegister}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                {[
                  ["Nombre", "nombre"],
                  ["Apellido", "apellido"],
                ].map(([l, k]) => (
                  <div key={k}>
                    <label style={labelStyle}>{l}</label>
                    <input
                      style={inputCls}
                      required
                      value={(reg as Record<string, string>)[k]}
                      onChange={(e) =>
                        setReg((r) => ({ ...r, [k]: e.target.value }))
                      }
                    />
                  </div>
                ))}
              </div>
              <div>
                <label style={labelStyle}>Correo electrónico</label>
                <input
                  type="email"
                  style={inputCls}
                  required
                  value={reg.correo}
                  onChange={(e) =>
                    setReg((r) => ({ ...r, correo: e.target.value }))
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Contraseña</label>
                <input
                  type="password"
                  style={inputCls}
                  required
                  value={reg.contrasena}
                  onChange={(e) =>
                    setReg((r) => ({ ...r, contrasena: e.target.value }))
                  }
                />
                <PasswordStrength value={reg.contrasena} />
              </div>
              <div>
                <label style={labelStyle}>Teléfono</label>
                <input
                  style={inputCls}
                  required
                  value={reg.telefono}
                  onChange={(e) =>
                    setReg((r) => ({ ...r, telefono: e.target.value }))
                  }
                />
              </div>
              {error && (
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "#dc2626",
                    fontFamily: "var(--font-dm-sans)",
                  }}
                >
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: "linear-gradient(135deg,#0a1a11,#1a3528)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  padding: "14px",
                  borderRadius: "12px",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-dm-sans)",
                  marginTop: "4px",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Registrando..." : "Crear cuenta y continuar"}
              </button>
              <button
                type="button"
                onClick={() => { onClose(); window.location.href = "/login"; }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#8a7a60",
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                ¿Ya tienes cuenta? Iniciar sesión
              </button>
            </form>
          )}

          {/* LOGIN */}
          {step === "login" && (
            <form
              onSubmit={handleLogin}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <div>
                <label style={labelStyle}>Correo electrónico</label>
                <input
                  type="email"
                  style={inputCls}
                  required
                  value={loginData.correo}
                  onChange={(e) =>
                    setLoginData((d) => ({ ...d, correo: e.target.value }))
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Contraseña</label>
                <input
                  type="password"
                  style={inputCls}
                  required
                  value={loginData.contrasena}
                  onChange={(e) =>
                    setLoginData((d) => ({ ...d, contrasena: e.target.value }))
                  }
                />
              </div>
              {error && (
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "#dc2626",
                    fontFamily: "var(--font-dm-sans)",
                  }}
                >
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: "linear-gradient(135deg,#0a1a11,#1a3528)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  padding: "14px",
                  borderRadius: "12px",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-dm-sans)",
                  marginTop: "4px",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Ingresando..." : "Iniciar sesión"}
              </button>
              <button
                type="button"
                onClick={() => setStep("register")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#8a7a60",
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                ¿Nuevo aquí? Crear cuenta
              </button>
            </form>
          )}

          {/* BOOKING */}
          {step === "booking" && (
            <form
              onSubmit={handleBooking}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "0.82rem",
                  color: "#8a7a60",
                  background: "#f0fdf4",
                  border: "1px solid #86efac",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  margin: 0,
                }}
              >
                Completa los datos de tu mascota. Te confirmaremos la cita por
                correo.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div>
                  <label style={labelStyle}>Nombre de tu mascota</label>
                  <input
                    style={inputCls}
                    required
                    value={cita.nombreMascota}
                    onChange={(e) =>
                      setCita((c) => ({ ...c, nombreMascota: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label style={labelStyle}>Especie</label>
                  <select
                    style={{ ...inputCls, cursor: "pointer" }}
                    value={cita.especie}
                    onChange={(e) =>
                      setCita((c) => ({ ...c, especie: e.target.value }))
                    }
                  >
                    {["Perro", "Gato", "Ave", "Conejo", "Reptil", "Otro"].map(
                      (o) => (
                        <option key={o}>{o}</option>
                      ),
                    )}
                  </select>
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div>
                  <label style={labelStyle}>Fecha</label>
                  <input
                    type="date"
                    style={inputCls}
                    required
                    min={hoyCimaFecha()}
                    value={cita.fecha}
                    onChange={(e) => {
                      const newFecha = e.target.value;
                      const newSlots = slotsDisponibles(newFecha);
                      setCita((c) => ({
                        ...c,
                        fecha: newFecha,
                        hora:
                          newSlots.length > 0 && newSlots.includes(c.hora)
                            ? c.hora
                            : "",
                      }));
                    }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Hora</label>
                  <select
                    style={{
                      ...inputCls,
                      cursor: cita.fecha ? "pointer" : "not-allowed",
                      opacity: cita.fecha ? 1 : 0.5,
                    }}
                    required
                    disabled={!cita.fecha || slots.length === 0}
                    value={cita.hora}
                    onChange={(e) =>
                      setCita((c) => ({ ...c, hora: e.target.value }))
                    }
                  >
                    <option value="">
                      {!cita.fecha
                        ? "Elige fecha primero"
                        : slots.length === 0
                          ? "Sin atención este día"
                          : "Seleccionar…"}
                    </option>
                    {slots.map((h) => (
                      <option key={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Motivo de la consulta</label>
                <textarea
                  style={
                    {
                      ...inputCls,
                      height: "80px",
                      padding: "10px 12px",
                      resize: "none",
                    } as React.CSSProperties
                  }
                  required
                  rows={3}
                  value={cita.motivo}
                  onChange={(e) =>
                    setCita((c) => ({ ...c, motivo: e.target.value }))
                  }
                />
              </div>
              <button
                type="submit"
                style={{
                  background: "linear-gradient(135deg,#c48c34,#a07028)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  padding: "14px",
                  borderRadius: "12px",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-dm-sans)",
                  marginTop: "4px",
                }}
              >
                Solicitar cita
              </button>
            </form>
          )}

          {/* SUCCESS */}
          {step === "success" && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#f0fdf4,#dcfce7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                  boxShadow: "0 8px 24px rgba(22,163,74,0.2)",
                }}
              >
                <CheckCircle size={36} color="#16a34a" />
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-fraunces)",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  fontStyle: "italic",
                  color: "#1a1208",
                  margin: "0 0 12px",
                }}
              >
                ¡Solicitud recibida!
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "0.88rem",
                  color: "#8a7a60",
                  lineHeight: 1.7,
                  margin: "0 0 28px",
                }}
              >
                Te contactaremos para confirmar tu cita. Revisa tu correo en los
                próximos minutos.
              </p>
              <button
                onClick={onClose}
                style={{
                  background: "linear-gradient(135deg,#0a1a11,#1a3528)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  padding: "14px 32px",
                  borderRadius: "12px",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ROOT PAGE
═══════════════════════════════════════════ */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState<ModalStep>("choice");
  const { user } = useAuth();
  useScrollReveal();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const openBook = () => {
    setBookingStep("choice");
    setBookingOpen(true);
  };

  return (
    <>
      <Navbar scrolled={scrolled} onBook={openBook} />
      <Hero onBook={openBook} />
      <ServicesSection />
      <StatsSection />
      <ScheduleSection onBook={openBook} />
      <Footer />
      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        initialUser={!!user}
        initialStep={bookingStep}
      />
    </>
  );
}
