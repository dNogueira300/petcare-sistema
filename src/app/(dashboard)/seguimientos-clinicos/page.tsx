"use client";

import { useEffect, useState } from "react";
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/context/toast";
import { useAuth } from "@/hooks/useAuth";
import { formatLima } from "@/utils/datetime";
import type { SeguimientoClinico, EstadoSeguimiento } from "@/types";

const ESTADO_META: Record<
  EstadoSeguimiento,
  {
    label: string;
    variant: "pendiente" | "confirmada" | "cancelada" | "atendida";
  }
> = {
  pendiente: { label: "Pendiente", variant: "pendiente" },
  sugerencia_enviada: { label: "Aviso enviado", variant: "pendiente" },
  cita_agendada: { label: "Cita agendada", variant: "confirmada" },
  completado: { label: "Completado", variant: "atendida" },
  no_presentado: { label: "No presentado", variant: "cancelada" },
  cancelado: { label: "Cancelado", variant: "cancelada" },
};

interface AtencionSeguimiento {
  id_atencion: number;
  id_mascota: number;
  motivo_consulta: string | null;
  fecha_inicio: string;
  mascotas?: { nombre: string; especie: string };
  veterinarios?: { usuarios: { nombre: string; apellido: string } };
}

export default function SeguimientosClinicosPage() {
  const [seguimientos,       setSeguimientos]       = useState<SeguimientoClinico[]>([]);
  const [atencionesSegState, setAtencionesSegState] = useState<AtencionSeguimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("pendiente");
  const [detailItem, setDetailItem] = useState<SeguimientoClinico | null>(null);
  const [updating, setUpdating] = useState(false);

  const { user } = useAuth();
  const toast = useToast();

  const fetchAll = () => {
    const url = `/api/seguimientos-clinicos?estado=${filtroEstado === "pendientes" ? "" : filtroEstado}&pendientes=${filtroEstado === "pendientes" ? "1" : "0"}`;
    Promise.all([
      fetch(url).then(r => r.json()),
      // También cargar atenciones en estado "seguimiento" que aún no tienen registro
      fetch("/api/atenciones-clinicas?estado=seguimiento").then(r => r.json()),
    ]).then(([jsonS, jsonA]) => {
      const segs: SeguimientoClinico[] = jsonS.data ?? [];
      setSeguimientos(segs);
      // Filtrar atenciones que NO tienen seguimiento ya registrado
      const idsConSeguimiento = new Set(segs.map((s: SeguimientoClinico) => s.id_mascota));
      const atensSinReg = (jsonA.data ?? []).filter(
        (a: AtencionSeguimiento) => !idsConSeguimiento.has(a.id_mascota)
      );
      setAtencionesSegState(atensSinReg);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, [filtroEstado]); // eslint-disable-line react-hooks/exhaustive-deps

  const reload = () => { setLoading(true); fetchAll(); };

  const cambiarEstado = async (id: number, estado: EstadoSeguimiento) => {
    setUpdating(true);
    const res = await fetch(`/api/seguimientos-clinicos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    setUpdating(false);
    if (res.ok) {
      toast.success(`Estado actualizado: ${ESTADO_META[estado].label}`);
      setDetailItem(null);
      reload();
    } else {
      const j = await res.json();
      toast.error(j.error ?? "Error al actualizar");
    }
  };

  const hoy = new Date().toISOString().slice(0, 10);
  const vencidos = seguimientos.filter(
    (s) =>
      s.fecha_sugerida_control < hoy &&
      ["pendiente", "sugerencia_enviada"].includes(s.estado),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
            Seguimientos Clínicos
          </h1>
          <p
            className="text-sm text-gray-500 mt-0.5"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            Controles post-consulta pendientes
          </p>
        </div>
        <button
          onClick={reload}
          style={{
            border: "1px solid #d1fae5",
            background: "rgba(240,253,244,0.7)",
            borderRadius: 8,
            padding: "7px 12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "#15803d",
            fontSize: "0.78rem",
            fontWeight: 600,
            fontFamily: "var(--font-dm-sans)",
          }}
        >
          <RefreshCw
            size={13}
            style={loading ? { animation: "spin 1s linear infinite" } : {}}
          />{" "}
          Actualizar
        </button>
      </div>

      {vencidos.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            borderRadius: 10,
            background: "rgba(220,38,38,0.06)",
            border: "1px solid rgba(220,38,38,0.2)",
          }}
        >
          <AlertTriangle
            size={16}
            style={{ color: "#dc2626", flexShrink: 0 }}
          />
          <p
            style={{
              margin: 0,
              fontSize: "0.82rem",
              color: "#dc2626",
              fontFamily: "var(--font-dm-sans)",
              fontWeight: 600,
            }}
          >
            {vencidos.length} seguimiento{vencidos.length > 1 ? "s" : ""}{" "}
            vencido{vencidos.length > 1 ? "s" : ""} — fecha de control ya pasó
            sin atención registrada.
          </p>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { val: "pendientes", label: "Pendientes" },
          { val: "cita_agendada", label: "Con cita" },
          { val: "completado", label: "Completados" },
          { val: "no_presentado", label: "No presentados" },
          { val: "cancelado", label: "Cancelados" },
        ].map((f) => (
          <button
            key={f.val}
            onClick={() => setFiltroEstado(f.val)}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: "0.78rem",
              fontWeight: 600,
              fontFamily: "var(--font-dm-sans)",
              cursor: "pointer",
              transition: "all 0.12s",
              border:
                filtroEstado === f.val
                  ? "1px solid #3d845b"
                  : "1px solid #e5e7eb",
              background:
                filtroEstado === f.val ? "rgba(61,132,91,0.1)" : "#fff",
              color: filtroEstado === f.val ? "#15803d" : "#6b7280",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        {loading ? (
          <div
            style={{
              padding: 32,
              textAlign: "center",
              color: "#9ca3af",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "0.82rem",
            }}
          >
            Cargando…
          </div>
        ) : seguimientos.length === 0 ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: "#9ca3af",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "0.85rem",
            }}
          >
            No hay seguimientos en este estado
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {[
                  "Mascota",
                  "Motivo",
                  "Veterinario",
                  "Fecha control",
                  "Estado",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      fontFamily: "var(--font-dm-sans)",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {seguimientos.map((s, i) => {
                const mascotaNombre = s.mascotas?.nombre ?? "—";
                const especie = s.mascotas?.especie ?? "";
                const vetNombre = s.veterinarios?.usuarios
                  ? `${s.veterinarios.usuarios.nombre} ${s.veterinarios.usuarios.apellido}`
                  : "—";
                const vencido =
                  s.fecha_sugerida_control < hoy &&
                  ["pendiente", "sugerencia_enviada"].includes(s.estado);
                const meta = ESTADO_META[s.estado];
                return (
                  <tr
                    key={s.id_seguimiento}
                    style={{
                      borderTop: i > 0 ? "1px solid #f3f4f6" : "none",
                      background: vencido
                        ? "rgba(254,242,242,0.5)"
                        : "transparent",
                    }}
                  >
                    <td style={{ padding: "10px 14px" }}>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          color: "#111827",
                          fontFamily: "var(--font-dm-sans)",
                        }}
                      >
                        {mascotaNombre}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.7rem",
                          color: "#9ca3af",
                          fontFamily: "var(--font-dm-sans)",
                          textTransform: "capitalize",
                        }}
                      >
                        {especie}
                      </p>
                    </td>
                    <td
                      style={{
                        padding: "10px 14px",
                        fontSize: "0.8rem",
                        color: "#374151",
                        fontFamily: "var(--font-dm-sans)",
                        maxWidth: 200,
                      }}
                    >
                      <span
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {s.motivo_seguimiento}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "10px 14px",
                        fontSize: "0.8rem",
                        color: "#6b7280",
                        fontFamily: "var(--font-dm-sans)",
                      }}
                    >
                      {vetNombre}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <Clock
                          size={12}
                          style={{ color: vencido ? "#dc2626" : "#9ca3af" }}
                        />
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color: vencido ? "#dc2626" : "#374151",
                            fontFamily: "var(--font-dm-sans)",
                            fontWeight: vencido ? 700 : 400,
                          }}
                        >
                          {formatLima(
                            `${s.fecha_sugerida_control}T00:00:00`,
                            "dd/MM/yyyy",
                          )}
                        </span>
                        {vencido && (
                          <span
                            style={{
                              fontSize: "0.65rem",
                              color: "#dc2626",
                              fontWeight: 700,
                              fontFamily: "var(--font-dm-sans)",
                            }}
                          >
                            VENCIDO
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>
                      <button
                        onClick={() => setDetailItem(s)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "5px 10px",
                          borderRadius: 6,
                          border: "1px solid #e5e7eb",
                          background: "#fff",
                          color: "#374151",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          fontFamily: "var(--font-dm-sans)",
                          cursor: "pointer",
                        }}
                      >
                        Gestionar <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Atenciones en estado "seguimiento" sin registro formal */}
      {atencionesSegState.length > 0 && (
        <div style={{ marginTop:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
            <div style={{ flex:1, height:1, background:"#fde68a" }} />
            <span style={{ fontSize:"0.72rem", fontWeight:700, color:"#b45309", fontFamily:"var(--font-dm-sans)", textTransform:"uppercase", letterSpacing:"0.08em", whiteSpace:"nowrap" }}>
              Atenciones en seguimiento sin registro formal ({atencionesSegState.length})
            </span>
            <div style={{ flex:1, height:1, background:"#fde68a" }} />
          </div>
          <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.78rem", color:"#6b7280", margin:"0 0 10px" }}>
            Estas atenciones están en estado &quot;seguimiento&quot; pero aún no tienen un seguimiento clínico programado. Para crearlos, ve a <strong>Atenciones Clínicas</strong>, selecciona la atención y usa el botón <em>Seguimiento</em>.
          </p>
          <div style={{ border:"1px solid #fde68a", borderRadius:12, overflow:"hidden", background:"rgba(254,243,199,0.2)" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"rgba(254,243,199,0.5)" }}>
                  {["Mascota","Motivo consulta","Veterinario","Desde",""].map(h => (
                    <th key={h} style={{ padding:"8px 14px", textAlign:"left", fontSize:"0.68rem", fontWeight:700, color:"#92400e", textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:"var(--font-dm-sans)", borderBottom:"1px solid #fde68a" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {atencionesSegState.map((a, i) => {
                  const vetN = a.veterinarios?.usuarios ? `${a.veterinarios.usuarios.nombre} ${a.veterinarios.usuarios.apellido}` : "—";
                  return (
                    <tr key={a.id_atencion} style={{ borderTop: i > 0 ? "1px solid #fde68a" : "none" }}>
                      <td style={{ padding:"10px 14px" }}>
                        <p style={{ margin:0, fontWeight:700, fontSize:"0.85rem", color:"#111827", fontFamily:"var(--font-dm-sans)" }}>{a.mascotas?.nombre ?? "—"}</p>
                        <p style={{ margin:0, fontSize:"0.7rem", color:"#9ca3af", fontFamily:"var(--font-dm-sans)", textTransform:"capitalize" }}>{a.mascotas?.especie}</p>
                      </td>
                      <td style={{ padding:"10px 14px", fontSize:"0.8rem", color:"#374151", fontFamily:"var(--font-dm-sans)" }}>{a.motivo_consulta ?? "—"}</td>
                      <td style={{ padding:"10px 14px", fontSize:"0.8rem", color:"#6b7280", fontFamily:"var(--font-dm-sans)" }}>{vetN}</td>
                      <td style={{ padding:"10px 14px", fontSize:"0.78rem", color:"#6b7280", fontFamily:"var(--font-dm-sans)" }}>{formatLima(a.fecha_inicio, "dd/MM/yyyy HH:mm")}</td>
                      <td style={{ padding:"10px 14px" }}>
                        <span style={{ fontSize:"0.65rem", fontWeight:700, color:"#b45309", background:"rgba(254,243,199,0.8)", border:"1px solid #fde68a", padding:"2px 8px", borderRadius:99, fontFamily:"var(--font-dm-sans)", textTransform:"uppercase" }}>
                          Sin registro
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal detalle/gestión */}
      <Modal
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
        title="Gestionar seguimiento"
      >
        {detailItem && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                background: "linear-gradient(135deg,#f0fdf4,#dcfce7)",
                border: "1px solid #bbf7d0",
              }}
            >
              <p
                style={{
                  margin: "0 0 2px",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  color: "#111827",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                {detailItem.mascotas?.nombre ?? "—"}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.75rem",
                  color: "#15803d",
                  fontFamily: "var(--font-dm-sans)",
                  textTransform: "capitalize",
                }}
              >
                {detailItem.mascotas?.especie}
              </p>
            </div>
            {[
              ["Motivo", detailItem.motivo_seguimiento],
              [
                "Fecha de control",
                formatLima(
                  `${detailItem.fecha_sugerida_control}T00:00:00`,
                  "dd/MM/yyyy",
                ),
              ],
              [
                "Veterinario",
                detailItem.veterinarios?.usuarios
                  ? `${detailItem.veterinarios.usuarios.nombre} ${detailItem.veterinarios.usuarios.apellido}`
                  : "—",
              ],
              [
                "Diagnóstico original",
                detailItem.historia_clinica?.diagnostico ?? "—",
              ],
              ["Estado actual", ESTADO_META[detailItem.estado].label],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid #f3f4f6",
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontFamily: "var(--font-dm-sans)",
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontSize: "0.82rem",
                    color: "#111827",
                    fontFamily: "var(--font-dm-sans)",
                    textAlign: "right",
                    maxWidth: "60%",
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
            {["pendiente", "sugerencia_enviada", "cita_agendada"].includes(
              detailItem.estado,
            ) &&
              user?.rol !== "cliente" && (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    paddingTop: 8,
                  }}
                >
                  {detailItem.estado !== "cita_agendada" && (
                    <button
                      disabled={updating}
                      onClick={() =>
                        cambiarEstado(
                          detailItem.id_seguimiento,
                          "cita_agendada",
                        )
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "7px 14px",
                        borderRadius: 8,
                        border: "1px solid #bbf7d0",
                        background: "rgba(240,253,244,0.8)",
                        color: "#15803d",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        fontFamily: "var(--font-dm-sans)",
                        cursor: "pointer",
                      }}
                    >
                      <CalendarCheck size={13} /> Cita agendada
                    </button>
                  )}
                  <button
                    disabled={updating}
                    onClick={() =>
                      cambiarEstado(detailItem.id_seguimiento, "completado")
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "7px 14px",
                      borderRadius: 8,
                      border: "1px solid #a7f3d0",
                      background: "rgba(236,253,245,0.8)",
                      color: "#065f46",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      fontFamily: "var(--font-dm-sans)",
                      cursor: "pointer",
                    }}
                  >
                    <CheckCircle2 size={13} /> Marcar completado
                  </button>
                  <button
                    disabled={updating}
                    onClick={() =>
                      cambiarEstado(detailItem.id_seguimiento, "no_presentado")
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "7px 14px",
                      borderRadius: 8,
                      border: "1px solid #fca5a5",
                      background: "rgba(254,242,242,0.8)",
                      color: "#dc2626",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      fontFamily: "var(--font-dm-sans)",
                      cursor: "pointer",
                    }}
                  >
                    <XCircle size={13} /> No se presentó
                  </button>
                </div>
              )}
          </div>
        )}
      </Modal>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
