"use client";

import { useEffect, useState } from "react";
import { History, User, Plus, Edit3, AlertCircle, FileDown } from "lucide-react";
import { formatLima } from "@/utils/datetime";
import type { AuditoriaHistoriaClinica } from "@/types";

interface Props {
  id_historia: number;
  isAdmin?: boolean;
  mascotaNombre?: string;
}

const ROL_LABELS: Record<string, string> = {
  administrador: "Administrador",
  veterinario: "Veterinario",
  recepcionista: "Recepcionista",
};

// Componente en lugar de función helper — evita el warning "key" en listas
function DiffRow({
  label,
  ant,
  nvo,
}: {
  label: string;
  ant: string | null | undefined;
  nvo: string | null | undefined;
}) {
  if ((!ant && !nvo) || ant === nvo) return null;
  return (
    <div style={{ fontSize: "0.78rem", fontFamily: "var(--font-dm-sans)" }}>
      <span style={{ fontWeight: 600, color: "#374151" }}>{label}: </span>
      {ant && (
        <span style={{ background:"rgba(239,68,68,0.08)", color:"#dc2626", padding:"1px 5px", borderRadius:4, textDecoration:"line-through", marginRight:6 }}>
          {ant.length > 80 ? `${ant.slice(0, 80)}…` : ant}
        </span>
      )}
      {nvo && (
        <span style={{ background:"rgba(21,128,61,0.08)", color:"#15803d", padding:"1px 5px", borderRadius:4 }}>
          {nvo.length > 80 ? `${nvo.slice(0, 80)}…` : nvo}
        </span>
      )}
    </div>
  );
}

export function AuditoriaTimeline({ id_historia, isAdmin = false, mascotaNombre }: Props) {
  const [entradas, setEntradas] = useState<AuditoriaHistoriaClinica[]>([]);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // loading se deriva del estado — no se necesita setState síncrono en el efecto
  const loading = open && !fetched && !error;

  useEffect(() => {
    if (!open || fetched) return;
    fetch(`/api/auditoria/historia-clinica/${id_historia}`)
      .then((r) => r.json())
      .then((j) => {
        setEntradas(j.data ?? []);
        setFetched(true);
        setError(null);
      })
      .catch(() => setError("Error al cargar auditoría"));
  }, [id_historia, open, fetched]);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "7px 14px",
          borderRadius: 8,
          border: "1.5px solid #bfdbfe",
          background: "rgba(239,246,255,0.7)",
          color: "#1d4ed8",
          fontSize: "0.78rem",
          fontWeight: 600,
          fontFamily: "var(--font-dm-sans)",
          cursor: "pointer",
          transition: "all 0.12s",
          width: "100%",
          justifyContent: "center",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "#3b82f6";
          (e.currentTarget as HTMLElement).style.background = "rgba(239,246,255,1)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "#bfdbfe";
          (e.currentTarget as HTMLElement).style.background = "rgba(239,246,255,0.7)";
        }}
      >
        <History size={13} />
        Auditoría
        {entradas.length > 0 && (
          <span
            style={{
              background: "rgba(61,132,91,0.1)",
              color: "#3d845b",
              borderRadius: "99px",
              padding: "1px 7px",
              fontSize: "0.65rem",
              fontWeight: 700,
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            {entradas.length}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            marginTop: 10,
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            background: "#fff",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{ padding:"10px 14px", borderBottom:"1px solid #f3f4f6", background:"#f9fafb", display:"flex", alignItems:"center", gap:7 }}>
            <History size={13} style={{ color:"#3d845b" }} />
            <span style={{ fontSize:"0.78rem", fontWeight:700, color:"#374151", fontFamily:"var(--font-dm-sans)", flex:1 }}>
              Historial de cambios
            </span>
            {/* Botón exportar PDF — solo admin y cuando hay datos */}
            {isAdmin && entradas.length > 0 && (
              <button
                onClick={async () => {
                  const { exportAuditoriaPdf } = await import("@/utils/auditoriaPdf");
                  await exportAuditoriaPdf(
                    entradas,
                    { mascota: mascotaNombre },
                    mascotaNombre ? `Auditoría HC — ${mascotaNombre}` : "Auditoría de Historia Clínica",
                  );
                }}
                title="Exportar auditoría en PDF"
                style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:6, border:"1px solid #bfdbfe", background:"rgba(239,246,255,0.8)", color:"#1d4ed8", fontSize:"0.7rem", fontWeight:600, fontFamily:"var(--font-dm-sans)", cursor:"pointer", transition:"opacity 0.12s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
              >
                <FileDown size={11} /> PDF
              </button>
            )}
          </div>

          {/* Contenido */}
          <div style={{ padding: "12px 14px" }}>
            {loading && (
              <p
                style={{
                  margin: 0,
                  fontSize: "0.78rem",
                  color: "#9ca3af",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                Cargando…
              </p>
            )}
            {error && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: "#dc2626",
                  fontSize: "0.78rem",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                <AlertCircle size={13} />
                {error}
              </div>
            )}
            {!loading && !error && entradas.length === 0 && (
              <p
                style={{
                  margin: 0,
                  fontSize: "0.78rem",
                  color: "#9ca3af",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                Sin registros de auditoría
              </p>
            )}
            {!loading && entradas.length > 0 && (
              <div style={{ position: "relative", paddingLeft: 20 }}>
                {/* Línea vertical */}
                <div
                  style={{
                    position: "absolute",
                    left: 6,
                    top: 0,
                    bottom: 0,
                    width: 1,
                    background: "linear-gradient(180deg, #d1fae5, #e5e7eb)",
                  }}
                />

                {entradas.map((e, i) => {
                  const isInsert = e.tipo_cambio === "INSERT";
                  const Icon = isInsert ? Plus : Edit3;
                  // Detectar si hay algún cambio para mostrar la sección
                  const tieneCambios =
                    (e.diagnostico_anterior || e.diagnostico_nuevo) ||
                    (e.tratamiento_anterior  || e.tratamiento_nuevo)  ||
                    (e.observaciones_anterior || e.observaciones_nuevo) ||
                    (e.peso_anterior !== e.peso_nuevo);

                  return (
                    <div
                      key={e.id_auditoria}
                      style={{
                        position: "relative",
                        paddingBottom: i < entradas.length - 1 ? 16 : 0,
                      }}
                    >
                      {/* Dot */}
                      <div
                        style={{
                          position: "absolute",
                          left: -17,
                          top: 2,
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          background: isInsert ? "#3d845b" : "#2563eb",
                          border: "2px solid #fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon size={6} style={{ color: "#fff" }} />
                      </div>

                      {/* Card */}
                      <div
                        style={{
                          border: "1px solid #f3f4f6",
                          borderRadius: 8,
                          padding: "10px 12px",
                          background: isInsert
                            ? "rgba(240,253,244,0.5)"
                            : "#fff",
                        }}
                      >
                        {/* Meta */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 8,
                            marginBottom: 8,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <div
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: "50%",
                                flexShrink: 0,
                                background: isInsert
                                  ? "rgba(61,132,91,0.15)"
                                  : "rgba(37,99,235,0.1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <User
                                size={10}
                                style={{
                                  color: isInsert ? "#3d845b" : "#2563eb",
                                }}
                              />
                            </div>
                            <div>
                              <span
                                style={{
                                  fontSize: "0.78rem",
                                  fontWeight: 700,
                                  color: "#111827",
                                  fontFamily: "var(--font-dm-sans)",
                                }}
                              >
                                {e.usuario
                                  ? `${e.usuario.nombre} ${e.usuario.apellido}`
                                  : "Sistema"}
                              </span>
                              {e.usuario?.rol && (
                                <span
                                  style={{
                                    marginLeft: 5,
                                    fontSize: "0.65rem",
                                    color: "#9ca3af",
                                    fontFamily: "var(--font-dm-sans)",
                                  }}
                                >
                                  · {ROL_LABELS[e.usuario.rol] ?? e.usuario.rol}
                                </span>
                              )}
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: "0.68rem",
                              color: "#9ca3af",
                              fontFamily: "var(--font-dm-sans)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formatLima(e.timestamp_cambio, "dd/MM/yyyy HH:mm")}
                          </span>
                        </div>

                        {/* Tipo */}
                        <div style={{ marginBottom: tieneCambios ? 8 : 0 }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "2px 8px",
                              borderRadius: 99,
                              background: isInsert
                                ? "rgba(21,128,61,0.1)"
                                : "rgba(37,99,235,0.08)",
                              color: isInsert ? "#15803d" : "#2563eb",
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                              fontFamily: "var(--font-dm-sans)",
                            }}
                          >
                            <Icon size={8} />
                            {isInsert ? "Creación" : "Modificación"}
                          </span>
                          {e.razon_cambio && (
                            <span
                              style={{
                                marginLeft: 8,
                                fontSize: "0.72rem",
                                color: "#6b7280",
                                fontFamily: "var(--font-dm-sans)",
                                fontStyle: "italic",
                              }}
                            >
                              "{e.razon_cambio}"
                            </span>
                          )}
                        </div>

                        {/* Cambios — renderizados directamente (sin array) para evitar warning de key */}
                        {tieneCambios && (
                          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                            <DiffRow label="Diagnóstico"   ant={e.diagnostico_anterior}  nvo={e.diagnostico_nuevo} />
                            <DiffRow label="Tratamiento"   ant={e.tratamiento_anterior}  nvo={e.tratamiento_nuevo} />
                            <DiffRow label="Observaciones" ant={e.observaciones_anterior} nvo={e.observaciones_nuevo} />
                            {e.peso_anterior !== e.peso_nuevo && (
                              <DiffRow label="Peso"
                                ant={e.peso_anterior?.toString() ?? null}
                                nvo={e.peso_nuevo?.toString()   ?? null}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
