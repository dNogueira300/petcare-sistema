"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, AlertTriangle, Calendar, RefreshCw } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/context/toast";
import { useAuth } from "@/hooks/useAuth";
import { formatLima } from "@/utils/datetime";
import type { Indisponibilidad, RazonIndisponibilidad } from "@/types";

const RAZON_LABEL: Record<RazonIndisponibilidad, string> = {
  enfermedad: "Enfermedad",
  vacaciones: "Vacaciones",
  capacitacion: "Capacitación",
  emergencia: "Emergencia",
  otro: "Otro",
};

const RAZON_COLOR: Record<RazonIndisponibilidad, string> = {
  enfermedad: "#dc2626",
  vacaciones: "#2563eb",
  capacitacion: "#7c3aed",
  emergencia: "#b45309",
  otro: "#6b7280",
};

interface VetRow {
  id_veterinario: number;
  usuarios?: { nombre: string; apellido: string }; // plural — Supabase join
}

export default function IndisponibilidadesPage() {
  const [indisponibilidades, setIndisponibilidades] = useState<
    Indisponibilidad[]
  >([]);
  const [veterinarios, setVeterinarios] = useState<VetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [fVet, setFVet] = useState("");
  const [fInicio, setFInicio] = useState("");
  const [fFin, setFfin] = useState("");
  const [fRazon, setFRazon] = useState<RazonIndisponibilidad>("enfermedad");
  const [fJust, setFJust] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{
    citas_afectadas: number;
    mensaje: string;
  } | null>(null);

  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    Promise.all([
      fetch("/api/indisponibilidades").then((r) => r.json()),
      fetch("/api/veterinarios").then((r) => r.json()),
    ])
      .then(([jsonI, jsonV]) => {
        setIndisponibilidades(jsonI.data ?? []);
        setVeterinarios(jsonV.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const reload = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/indisponibilidades").then((r) => r.json()),
      fetch("/api/veterinarios").then((r) => r.json()),
    ])
      .then(([jsonI, jsonV]) => {
        setIndisponibilidades(jsonI.data ?? []);
        setVeterinarios(jsonV.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const openCreate = () => {
    setFVet("");
    setFInicio("");
    setFfin("");
    setFRazon("enfermedad");
    setFJust("");
    setSaveResult(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!fVet || !fInicio || !fFin) {
      toast.error("Todos los campos son requeridos");
      return;
    }
    if (fFin < fInicio) {
      toast.error("La fecha de fin debe ser mayor o igual al inicio");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/indisponibilidades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_veterinario: Number(fVet),
        fecha_inicio: fInicio,
        fecha_fin: fFin,
        razon: fRazon,
        justificacion: fJust || undefined,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const j = await res.json();
      setSaveResult({ citas_afectadas: j.citas_afectadas, mensaje: j.mensaje });
      toast.success(`Indisponibilidad registrada. ${j.mensaje}`);
      reload();
    } else {
      const j = await res.json();
      toast.error(j.error ?? "Error al guardar");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta indisponibilidad?")) return;
    const res = await fetch(`/api/indisponibilidades/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Eliminada");
      reload();
    } else {
      const j = await res.json();
      toast.error(j.error ?? "Error al eliminar");
    }
  };

  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
            Indisponibilidades
          </h1>
          <p
            className="text-sm text-gray-500 mt-0.5"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            Bloqueos de agenda por veterinario
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
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
          {user?.rol === "administrador" && (
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Registrar bloqueo
            </Button>
          )}
        </div>
      </div>

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
        ) : indisponibilidades.length === 0 ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: "#9ca3af",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "0.85rem",
            }}
          >
            Sin indisponibilidades registradas
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {[
                  "Veterinario",
                  "Período",
                  "Razón",
                  "Justificación",
                  "Notificado",
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
              {indisponibilidades.map((ind, i) => {
                const vetNombre = ind.veterinarios?.usuarios
                  ? `${ind.veterinarios.usuarios.nombre} ${ind.veterinarios.usuarios.apellido}`
                  : `Vet #${ind.id_veterinario}`;
                const activa = ind.fecha_fin >= hoy;
                const color = RAZON_COLOR[ind.razon];
                return (
                  <tr
                    key={ind.id_indisponibilidad}
                    style={{
                      borderTop: i > 0 ? "1px solid #f3f4f6" : "none",
                      background: activa
                        ? "rgba(254,243,196,0.15)"
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
                        {vetNombre}
                      </p>
                      {activa && (
                        <span
                          style={{
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            color: "#b45309",
                            fontFamily: "var(--font-dm-sans)",
                            textTransform: "uppercase",
                          }}
                        >
                          Activa
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: "0.8rem",
                          color: "#374151",
                          fontFamily: "var(--font-dm-sans)",
                        }}
                      >
                        <Calendar size={12} style={{ color: "#9ca3af" }} />
                        {formatLima(
                          `${ind.fecha_inicio}T00:00:00`,
                          "dd/MM/yy",
                        )}{" "}
                        – {formatLima(`${ind.fecha_fin}T00:00:00`, "dd/MM/yy")}
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "2px 8px",
                          borderRadius: 99,
                          background: `${color}15`,
                          color,
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          fontFamily: "var(--font-dm-sans)",
                        }}
                      >
                        {RAZON_LABEL[ind.razon]}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "10px 14px",
                        fontSize: "0.78rem",
                        color: "#6b7280",
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
                        {ind.justificacion ?? "—"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      {ind.notificaciones_enviadas ? (
                        <span
                          style={{
                            fontSize: "0.72rem",
                            color: "#15803d",
                            fontWeight: 600,
                            fontFamily: "var(--font-dm-sans)",
                          }}
                        >
                          ✓ Enviado
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: "0.72rem",
                            color: "#9ca3af",
                            fontFamily: "var(--font-dm-sans)",
                          }}
                        >
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>
                      {user?.rol === "administrador" && (
                        <button
                          onClick={() => handleDelete(ind.id_indisponibilidad)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Registrar indisponibilidad"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {saveResult ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: 10,
                  background:
                    saveResult.citas_afectadas > 0
                      ? "rgba(254,243,196,0.6)"
                      : "rgba(240,253,244,0.6)",
                  border: `1px solid ${saveResult.citas_afectadas > 0 ? "#fde68a" : "#bbf7d0"}`,
                }}
              >
                {saveResult.citas_afectadas > 0 && (
                  <AlertTriangle
                    size={16}
                    style={{ color: "#b45309", marginBottom: 6 }}
                  />
                )}
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "#111827",
                    fontFamily: "var(--font-dm-sans)",
                  }}
                >
                  Registrado correctamente
                </p>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "0.78rem",
                    color: "#6b7280",
                    fontFamily: "var(--font-dm-sans)",
                  }}
                >
                  {saveResult.mensaje}
                </p>
              </div>
              <Button
                onClick={() => {
                  setModalOpen(false);
                  setSaveResult(null);
                }}
              >
                Cerrar
              </Button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#374151",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontFamily: "var(--font-dm-sans)",
                  }}
                >
                  Veterinario *
                </label>
                <select
                  value={fVet}
                  onChange={(e) => setFVet(e.target.value)}
                  style={{
                    border: "1.5px solid #d1d5db",
                    borderRadius: 8,
                    padding: "9px 12px",
                    fontSize: "0.85rem",
                    fontFamily: "var(--font-dm-sans)",
                    outline: "none",
                  }}
                >
                  <option value="">Seleccionar…</option>
                  {veterinarios.map((v: VetRow) => (
                    <option key={v.id_veterinario} value={v.id_veterinario}>
                      {v.usuarios
                        ? `${v.usuarios.nombre} ${v.usuarios.apellido}`
                        : `Vet #${v.id_veterinario}`}
                    </option>
                  ))}
                </select>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 5 }}
                >
                  <label
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "#374151",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      fontFamily: "var(--font-dm-sans)",
                    }}
                  >
                    Desde *
                  </label>
                  <input
                    type="date"
                    value={fInicio}
                    onChange={(e) => setFInicio(e.target.value)}
                    style={{
                      border: "1.5px solid #d1d5db",
                      borderRadius: 8,
                      padding: "9px 12px",
                      fontSize: "0.85rem",
                      fontFamily: "var(--font-dm-sans)",
                      outline: "none",
                    }}
                  />
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 5 }}
                >
                  <label
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "#374151",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      fontFamily: "var(--font-dm-sans)",
                    }}
                  >
                    Hasta *
                  </label>
                  <input
                    type="date"
                    value={fFin}
                    min={fInicio}
                    onChange={(e) => setFfin(e.target.value)}
                    style={{
                      border: "1.5px solid #d1d5db",
                      borderRadius: 8,
                      padding: "9px 12px",
                      fontSize: "0.85rem",
                      fontFamily: "var(--font-dm-sans)",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#374151",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontFamily: "var(--font-dm-sans)",
                  }}
                >
                  Razón *
                </label>
                <select
                  value={fRazon}
                  onChange={(e) =>
                    setFRazon(e.target.value as RazonIndisponibilidad)
                  }
                  style={{
                    border: "1.5px solid #d1d5db",
                    borderRadius: 8,
                    padding: "9px 12px",
                    fontSize: "0.85rem",
                    fontFamily: "var(--font-dm-sans)",
                    outline: "none",
                  }}
                >
                  {(Object.keys(RAZON_LABEL) as RazonIndisponibilidad[]).map(
                    (r) => (
                      <option key={r} value={r}>
                        {RAZON_LABEL[r]}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#374151",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontFamily: "var(--font-dm-sans)",
                  }}
                >
                  Justificación
                </label>
                <textarea
                  value={fJust}
                  onChange={(e) => setFJust(e.target.value)}
                  rows={2}
                  style={{
                    border: "1.5px solid #d1d5db",
                    borderRadius: 8,
                    padding: "9px 12px",
                    fontSize: "0.82rem",
                    fontFamily: "var(--font-dm-sans)",
                    resize: "vertical",
                    outline: "none",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                  paddingTop: 8,
                }}
              >
                <button
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    color: "#374151",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    fontFamily: "var(--font-dm-sans)",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <Button loading={saving} onClick={handleSave}>
                  Registrar bloqueo
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
