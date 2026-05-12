"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Syringe } from "lucide-react";
import { formatLima, hoyCimaFecha } from "@/utils/datetime";
import type { CartillaVacunacion } from "@/types";

interface MascotaInfo { nombre: string; especie: string; raza: string | null }

function diasHasta(fechaISO: string): number {
  const [hy, hm, hd] = hoyCimaFecha().split("-").map(Number);
  const [fy, fm, fd] = fechaISO.split("-").map(Number);
  return Math.round((Date.UTC(fy, fm - 1, fd) - Date.UTC(hy, hm - 1, hd)) / 86400000);
}
function alerta(dias: number) {
  if (dias < 0) return { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", label: "Vencida" };
  if (dias <= 7) return { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", label: `En ${dias} día${dias !== 1 ? "s" : ""}` };
  if (dias <= 30) return { bg: "#fffbeb", border: "#fde68a", text: "#92400e", label: `En ${dias} días` };
  return { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534", label: `En ${dias} días` };
}

export default function PortalCartillaPage() {
  const { id } = useParams<{ id: string }>();
  const [mascota, setMascota] = useState<MascotaInfo | null>(null);
  const [vacunas, setVacunas] = useState<CartillaVacunacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [denegado, setDenegado] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? sessionStorage.getItem("petcare_user") : null;
    if (!stored) { window.location.href = "/"; return; }
    (async () => {
      const vRes = await fetch(`/api/vacunas?id_mascota=${id}`).then((r) => r.json()).catch(() => ({}));
      if (vRes?.error) { setDenegado(true); setLoading(false); return; }
      const mRes = await fetch(`/api/mascotas/${id}`).then((r) => r.json()).catch(() => ({}));
      setMascota(mRes.data ?? null);
      setVacunas(vRes.data ?? []);
      setLoading(false);
    })();
  }, [id]);

  const proximas = vacunas
    .filter((v) => v.fecha_proxima_dosis)
    .sort((a, b) => (a.fecha_proxima_dosis! < b.fecha_proxima_dosis! ? -1 : 1));

  return (
    <div style={{ minHeight: "100vh", background: "#ede7d9" }}>
      <header style={{ background: "linear-gradient(135deg,#0a1a11,#0f2318)", padding: "0 clamp(20px,4vw,60px)",
        height: "64px", display: "flex", alignItems: "center", gap: "16px", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/portal" style={{ display: "flex", alignItems: "center", gap: "8px",
          color: "rgba(255,255,255,0.7)", textDecoration: "none", fontFamily: "var(--font-dm-sans)", fontSize: "0.85rem" }}>
          <ArrowLeft size={16} /> Volver al portal
        </Link>
        <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.15)" }} />
        <Image src="/logo/logo_h.png" alt="PetCare" width={90} height={26}
          style={{ height: "auto", filter: "brightness(0) invert(1)", opacity: 0.85 }} />
      </header>

      <main style={{ maxWidth: "880px", margin: "0 auto", padding: "24px clamp(12px,3vw,32px)" }}>
        <div style={{ background: "#faf8f3", border: "1px solid #e0d8ca", borderRadius: "20px", padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "linear-gradient(135deg,#f0fdf4,#dcfce7)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Syringe size={24} color="#16a34a" />
            </div>
            <div>
              <h1 style={{ fontFamily: "var(--font-fraunces)", fontStyle: "italic", fontSize: "1.5rem", fontWeight: 700, color: "#1a1208", margin: 0 }}>
                Cartilla de vacunas{mascota ? ` — ${mascota.nombre}` : ""}
              </h1>
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.85rem", color: "#8a7a60", margin: 0 }}>
                {mascota ? `${mascota.especie}${mascota.raza ? ` · ${mascota.raza}` : ""}` : ""}
              </p>
            </div>
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
              <Image src="/logo/logo_i.png" alt="" width={48} height={48} style={{ animation: "pulse 1.5s ease-in-out infinite", objectFit: "contain" }} />
            </div>
          ) : denegado ? (
            <p style={{ fontFamily: "var(--font-dm-sans)", color: "#991b1b" }}>No tienes acceso a esta cartilla.</p>
          ) : (
            <>
              {/* Próximas dosis */}
              <h2 style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase", color: "#8a7a60", margin: "0 0 12px" }}>Próximas dosis</h2>
              {proximas.length === 0 ? (
                <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.88rem", color: "#a89a80", margin: "0 0 24px" }}>No hay dosis programadas.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "12px", marginBottom: "24px" }}>
                  {proximas.map((v) => {
                    const c = alerta(diasHasta(v.fecha_proxima_dosis!));
                    return (
                      <div key={v.id} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: "12px", padding: "14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 700, color: "#1a1208", fontSize: "0.9rem" }}>{v.tipo_vacuna}</span>
                          <span style={{ background: "#fff", borderRadius: "99px", padding: "2px 8px", fontSize: "0.7rem", fontWeight: 700, color: c.text, fontFamily: "var(--font-dm-sans)" }}>{c.label}</span>
                        </div>
                        <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: c.text, fontFamily: "var(--font-dm-sans)" }}>
                          {formatLima(`${v.fecha_proxima_dosis}T00:00:00`, "dd/MM/yyyy")}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Historial */}
              <h2 style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase", color: "#8a7a60", margin: "0 0 12px" }}>Historial de vacunas</h2>
              {vacunas.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#a89a80", fontFamily: "var(--font-dm-sans)", fontSize: "0.88rem",
                  border: "1px dashed #d9cfba", borderRadius: "12px" }}>
                  Aún no hay vacunas registradas para esta mascota.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {vacunas.map((v) => (
                    <div key={v.id} style={{ background: "#fff", border: "1px solid #e8e0d0", borderRadius: "12px", padding: "14px 18px",
                      display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                      <div>
                        <p style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 600, color: "#1a1208", margin: 0, fontSize: "0.9rem" }}>{v.tipo_vacuna}</p>
                        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.78rem", color: "#8a7a60", margin: 0 }}>
                          Aplicada el {formatLima(`${v.fecha_aplicacion}T00:00:00`, "dd/MM/yyyy")}
                          {v.lote ? ` · Lote ${v.lote}` : ""}
                          {v.observaciones ? ` · ${v.observaciones}` : ""}
                        </p>
                      </div>
                      <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.78rem", color: "#3d845b", background: "#f0fdf4",
                        padding: "4px 10px", borderRadius: "99px", whiteSpace: "nowrap" }}>
                        {v.fecha_proxima_dosis ? `Próx: ${formatLima(`${v.fecha_proxima_dosis}T00:00:00`, "dd/MM/yyyy")}` : "Sin refuerzo"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
