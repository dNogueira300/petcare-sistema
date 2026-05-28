"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, FileText, Download } from "lucide-react";
import { formatLima } from "@/utils/datetime";
import { exportHistorialPdf } from "@/utils/historialPdf";
import { ArchivosClinicosPanel } from "@/components/ui/archivos-clinicos";

interface MascotaInfo {
  id_mascota: number;
  nombre: string;
  especie: string;
  raza: string | null;
  sexo?: string | null;
  color?: string | null;
  fecha_nacimiento?: string | null;
}

interface HistoriaRow {
  id_historia: number;
  id_mascota: number;
  fecha_consulta: string;
  diagnostico: string;
  tratamiento: string;
  observaciones: string | null;
  peso_consulta: number | null;
  veterinarios?: { usuarios: { nombre: string; apellido: string } };
}

export default function PortalHistoriaPage() {
  const { id } = useParams<{ id: string }>();
  const [mascota, setMascota] = useState<MascotaInfo | null>(null);
  const [historias, setHistorias] = useState<HistoriaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [denegado, setDenegado] = useState(false);

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? sessionStorage.getItem("petcare_user")
        : null;
    if (!stored) {
      window.location.href = "/";
      return;
    }
    (async () => {
      const [hRes, mRes] = await Promise.all([
        fetch(`/api/historia-clinica?id_mascota=${id}`)
          .then((r) => r.json())
          .catch(() => ({})),
        fetch(`/api/mascotas/${id}`)
          .then((r) => r.json())
          .catch(() => ({})),
      ]);
      if (hRes?.error) {
        setDenegado(true);
        setLoading(false);
        return;
      }
      setMascota(mRes.data ?? null);
      setHistorias(hRes.data ?? []);
      setLoading(false);
    })();
  }, [id]);

  return (
    <div style={{ minHeight: "100vh", background: "#ede7d9" }}>
      <header
        style={{
          background: "linear-gradient(135deg,#0a1a11,#0f2318)",
          padding: "0 clamp(20px,4vw,60px)",
          height: "64px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <Link
          href="/portal"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "rgba(255,255,255,0.7)",
            textDecoration: "none",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "0.85rem",
          }}
        >
          <ArrowLeft size={16} /> Volver al portal
        </Link>
        <div
          style={{
            width: "1px",
            height: "20px",
            background: "rgba(255,255,255,0.15)",
          }}
        />
        <Image
          src="/logo/logo_h.png"
          alt="PetCare"
          width={90}
          height={26}
          style={{
            height: "auto",
            filter: "brightness(0) invert(1)",
            opacity: 0.85,
          }}
        />
      </header>

      <main
        style={{
          maxWidth: "880px",
          margin: "0 auto",
          padding: "24px clamp(12px,3vw,32px)",
        }}
      >
        <div
          style={{
            background: "#faf8f3",
            border: "1px solid #e0d8ca",
            borderRadius: "20px",
            padding: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                background: "linear-gradient(135deg,#dbeafe,#bfdbfe)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <FileText size={22} color="#1d4ed8" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1
                style={{
                  fontFamily: "var(--font-fraunces)",
                  fontStyle: "italic",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "#1a1208",
                  margin: 0,
                }}
              >
                Historia clínica{mascota ? ` — ${mascota.nombre}` : ""}
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "0.85rem",
                  color: "#8a7a60",
                  margin: 0,
                }}
              >
                {mascota
                  ? `${mascota.especie}${mascota.raza ? ` · ${mascota.raza}` : ""}`
                  : ""}
              </p>
            </div>
            <button
              onClick={() =>
                exportHistorialPdf({
                  mascota: mascota ?? {
                    id_mascota: Number(id),
                    nombre: "Mascota",
                    especie: "",
                    raza: null,
                  },
                  historias,
                })
              }
              disabled={historias.length === 0}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "#2d6a4f",
                color: "#fff",
                border: "none",
                cursor: historias.length === 0 ? "not-allowed" : "pointer",
                padding: "10px 16px",
                borderRadius: "9px",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "0.85rem",
                fontWeight: 700,
                opacity: historias.length === 0 ? 0.5 : 1,
              }}
            >
              <Download size={14} /> Descargar PDF
            </button>
          </div>

          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "60px 0",
              }}
            >
              <Image
                src="/logo/logo_i.png"
                alt=""
                width={48}
                height={48}
                style={{
                  animation: "pulse 1.5s ease-in-out infinite",
                  objectFit: "contain",
                }}
              />
            </div>
          ) : denegado ? (
            <p style={{ fontFamily: "var(--font-dm-sans)", color: "#991b1b" }}>
              No tienes acceso a esta historia.
            </p>
          ) : historias.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "#a89a80",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "0.88rem",
                border: "1px dashed #d9cfba",
                borderRadius: "12px",
              }}
            >
              Aún no hay historias clínicas registradas para esta mascota.
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {historias.map((h) => (
                <div
                  key={h.id_historia}
                  style={{
                    background: "#fff",
                    border: "1px solid #e8e0d0",
                    borderRadius: "12px",
                    padding: "16px 20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "12px",
                      marginBottom: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontFamily: "var(--font-dm-sans)",
                          fontWeight: 700,
                          color: "#1a1208",
                          margin: 0,
                          fontSize: "0.95rem",
                        }}
                      >
                        {formatLima(
                          `${h.fecha_consulta}T00:00:00`,
                          "dd/MM/yyyy",
                        )}
                      </p>
                      <p
                        style={{
                          fontFamily: "var(--font-dm-sans)",
                          fontSize: "0.78rem",
                          color: "#8a7a60",
                          margin: 0,
                        }}
                      >
                        {h.veterinarios
                          ? `Dr. ${h.veterinarios.usuarios.nombre} ${h.veterinarios.usuarios.apellido}`
                          : ""}
                      </p>
                    </div>
                    {h.peso_consulta && (
                      <span
                        style={{
                          fontFamily: "var(--font-dm-sans)",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          color: "#3d845b",
                          background: "#f0fdf4",
                          padding: "4px 10px",
                          borderRadius: "99px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h.peso_consulta} kg
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                    }}
                  >
                    {[
                      ["Diagnóstico", h.diagnostico],
                      ["Tratamiento", h.tratamiento],
                    ].map(([l, v]) => (
                      <div key={l}>
                        <p
                          style={{
                            fontFamily: "var(--font-dm-sans)",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            color: "#8a7a60",
                            margin: "0 0 3px",
                          }}
                        >
                          {l}
                        </p>
                        <p
                          style={{
                            fontFamily: "var(--font-dm-sans)",
                            fontSize: "0.85rem",
                            color: "#1a1208",
                            margin: 0,
                            lineHeight: 1.5,
                          }}
                        >
                          {v}
                        </p>
                      </div>
                    ))}
                    {h.observaciones && (
                      <div style={{ gridColumn: "1/-1" }}>
                        <p
                          style={{
                            fontFamily: "var(--font-dm-sans)",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            color: "#8a7a60",
                            margin: "0 0 3px",
                          }}
                        >
                          Observaciones
                        </p>
                        <p
                          style={{
                            fontFamily: "var(--font-dm-sans)",
                            fontSize: "0.85rem",
                            color: "#1a1208",
                            margin: 0,
                            lineHeight: 1.5,
                          }}
                        >
                          {h.observaciones}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Archivos médicos adjuntos (solo lectura) */}
                  <div
                    style={{
                      marginTop: "14px",
                      paddingTop: "12px",
                      borderTop: "1px solid #f5f0e8",
                    }}
                  >
                    <ArchivosClinicosPanel
                      id_historia={h.id_historia}
                      id_mascota={h.id_mascota}
                      readOnly={true}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
