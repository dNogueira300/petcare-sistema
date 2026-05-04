"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays, Users, PawPrint, Clock,
  CalendarPlus, UserPlus, ArrowRight,
} from "lucide-react";
import { PageLoading } from "@/components/ui/loading";
import { formatLima } from "@/utils/datetime";
import { useAuth } from "@/hooks/useAuth";
import type { EstadoCita } from "@/types";

interface Metrics {
  citas_hoy: number;
  citas_semana: number;
  citas_pendientes: number;
  total_clientes: number;
  total_mascotas: number;
  citas_por_estado: { estado: string; cantidad: number }[];
  proximas_citas: {
    id_cita: number;
    fecha: string;
    hora: string;
    motivo: string;
    estado: EstadoCita;
    mascotas: { nombre: string; especie: string };
    veterinarios: { usuarios: { nombre: string; apellido: string } };
  }[];
}

const estadoLabels: Record<string, string> = {
  pendiente:  "Pendiente",
  confirmada: "Confirmada",
  cancelada:  "Cancelada",
  atendida:   "Atendida",
};

const estadoStyle: Record<string, { bg: string; color: string; dot: string }> = {
  pendiente:  { bg: "#fffbeb", color: "#92400e", dot: "#f59e0b" },
  confirmada: { bg: "#f0fdf4", color: "#14532d", dot: "#22c55e" },
  cancelada:  { bg: "#fff1f2", color: "#9f1239", dot: "#f43f5e" },
  atendida:   { bg: "#eff6ff", color: "#1e3a8a", dot: "#3b82f6" },
};

export default function DashboardPage() {
  const [metrics, setMetrics]   = useState<Metrics | null>(null);
  const [loading, setLoading]   = useState(true);
  const { user }                = useAuth();

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((j) => setMetrics(j))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoading />;
  if (!metrics) return <p style={{ color: "#a89a80", fontFamily: "var(--font-dm-sans)" }}>Error al cargar el dashboard</p>;

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="flex flex-col gap-4 sm:gap-7 animate-fade-up">

      {/* ── Header ── */}
      <div>
        <p style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7a60", fontFamily: "var(--font-dm-sans)", marginBottom: "4px" }}>
          {greeting}
        </p>
        <h1
          style={{
            fontFamily: "var(--font-fraunces)",
            fontSize: "clamp(1.4rem, 4vw, 1.9rem)",
            fontWeight: 500,
            fontStyle: "italic",
            color: "#1a1208",
            letterSpacing: "-0.025em",
            lineHeight: 1.2,
          }}
        >
          {user ? `${user.nombre} ${user.apellido}` : "Panel de control"}
        </h1>
      </div>

      {/* ── Metric cards — carousel on mobile, grid on sm+ ── */}
      <div className="metric-carousel">
        {[
          { icon: CalendarDays, label: "Citas hoy",   value: metrics.citas_hoy,      accent: "#c48c34", accentBg: "#fdf3dc" },
          { icon: Clock,        label: "Esta semana", value: metrics.citas_semana,   accent: "#3d845b", accentBg: "#f0fdf4" },
          { icon: Users,        label: "Clientes",    value: metrics.total_clientes, accent: "#2e6fa8", accentBg: "#eff6ff" },
          { icon: PawPrint,     label: "Mascotas",    value: metrics.total_mascotas, accent: "#8a5a9a", accentBg: "#faf5ff" },
        ].map(({ icon: Icon, label, value, accent, accentBg }, i) => (
          <div
            key={label}
            className={`metric-carousel-item delay-${i + 1} animate-fade-up`}
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              borderRadius: "12px",
              padding: "16px",
              boxShadow: "0 1px 3px rgba(26,18,8,0.06)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "40px", height: "40px",
                borderRadius: "10px",
                background: accentBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon style={{ width: "18px", height: "18px", color: accent }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#8a7a60", fontFamily: "var(--font-dm-sans)", margin: 0, whiteSpace: "nowrap" }}>
                {label}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-fraunces)",
                  fontSize: "1.6rem",
                  fontWeight: 700,
                  color: "#1a1208",
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Lower grid ── */}
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">

        {/* Citas hoy (span 2) */}
        <div
          className="delay-3 animate-fade-up lg:col-span-2"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(26,18,8,0.06)",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--card-border)" }}>
            <p style={{ fontFamily: "var(--font-fraunces)", fontWeight: 600, fontStyle: "italic", fontSize: "1rem", color: "#1a1208", margin: 0 }}>
              Citas de hoy
            </p>
            <span style={{ fontSize: "0.72rem", color: "#a89a80", fontFamily: "var(--font-dm-sans)" }}>
              {metrics.proximas_citas.length} programadas
            </span>
          </div>

          {metrics.proximas_citas.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <CalendarDays style={{ width: "28px", height: "28px", color: "#d9cfba", margin: "0 auto 8px" }} />
              <p style={{ color: "#a89a80", fontSize: "0.85rem", fontFamily: "var(--font-dm-sans)" }}>
                Sin citas programadas para hoy
              </p>
            </div>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {metrics.proximas_citas.map((cita, idx) => {
                const s = estadoStyle[cita.estado] ?? estadoStyle.pendiente;
                return (
                  <li
                    key={cita.id_cita}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "13px 20px",
                      borderBottom: idx < metrics.proximas_citas.length - 1 ? "1px solid var(--card-border)" : "none",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        color: "#c48c34",
                        width: "44px",
                        flexShrink: 0,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {cita.hora.slice(0, 5)}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600, color: "#1a1208", fontFamily: "var(--font-dm-sans)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {cita.mascotas?.nombre ?? "—"}
                        <span style={{ fontWeight: 400, color: "#8a7a60", marginLeft: "6px" }}>
                          — {cita.motivo}
                        </span>
                      </p>
                      <p style={{ margin: 0, fontSize: "0.72rem", color: "#a89a80", fontFamily: "var(--font-dm-sans)", marginTop: "1px" }}>
                        {cita.veterinarios?.usuarios
                          ? `Dr. ${cita.veterinarios.usuarios.nombre} ${cita.veterinarios.usuarios.apellido}`
                          : "—"}
                      </p>
                    </div>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "3px 9px",
                        borderRadius: "99px",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        fontFamily: "var(--font-dm-sans)",
                        background: s.bg,
                        color: s.color,
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.dot, display: "inline-block", flexShrink: 0 }} />
                      {estadoLabels[cita.estado]}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* Estado de citas */}
          <div
            className="delay-4 animate-fade-up"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(26,18,8,0.06)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--card-border)" }}>
              <p style={{ fontFamily: "var(--font-fraunces)", fontWeight: 600, fontStyle: "italic", fontSize: "1rem", color: "#1a1208", margin: 0 }}>
                Estado general
              </p>
            </div>
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {metrics.citas_por_estado.length === 0 ? (
                <p style={{ color: "#a89a80", fontSize: "0.82rem", fontFamily: "var(--font-dm-sans)" }}>Sin datos</p>
              ) : (
                metrics.citas_por_estado.map((item) => {
                  const s = estadoStyle[item.estado] ?? estadoStyle.pendiente;
                  return (
                    <div key={item.estado} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "0.8rem", color: "#4a3d2e", fontFamily: "var(--font-dm-sans)" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
                        {estadoLabels[item.estado] ?? item.estado}
                      </span>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1a1208", fontFamily: "var(--font-dm-sans)" }}>
                        {item.cantidad}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Accesos rápidos */}
          <div
            className="delay-5 animate-fade-up"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(26,18,8,0.06)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--card-border)" }}>
              <p style={{ fontFamily: "var(--font-fraunces)", fontWeight: 600, fontStyle: "italic", fontSize: "1rem", color: "#1a1208", margin: 0 }}>
                Accesos rápidos
              </p>
            </div>
            <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
              {[
                { href: "/citas/nueva",  icon: CalendarPlus, label: "Nueva cita",     accent: "#c48c34", accentBg: "#fdf3dc" },
                { href: "/clientes",     icon: UserPlus,     label: "Nuevo cliente",  accent: "#2e6fa8", accentBg: "#eff6ff" },
                { href: "/mascotas",     icon: PawPrint,     label: "Nueva mascota",  accent: "#8a5a9a", accentBg: "#faf5ff" },
              ].map(({ href, icon: Icon, label, accent, accentBg }) => (
                <Link
                  key={href}
                  href={href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "transparent",
                    textDecoration: "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "var(--cream-100, #f6f1e6)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "transparent")}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ width: "30px", height: "30px", borderRadius: "8px", background: accentBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon style={{ width: "14px", height: "14px", color: accent }} />
                    </span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 500, color: "#1a1208", fontFamily: "var(--font-dm-sans)" }}>
                      {label}
                    </span>
                  </span>
                  <ArrowRight style={{ width: "13px", height: "13px", color: "#a89a80" }} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
