"use client";

import { useEffect, useState } from "react";
import {
  ListOrdered,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/context/toast";
import { useAuth } from "@/hooks/useAuth";
import { formatLima } from "@/utils/datetime";
import type { ColaEspera, EstadoColaEspera } from "@/types";

const ESTADO_META: Record<
  EstadoColaEspera,
  {
    label: string;
    variant: "pendiente" | "confirmada" | "cancelada" | "atendida";
  }
> = {
  activa: { label: "En espera", variant: "pendiente" },
  oferecido_horario: { label: "Horario ofrecido", variant: "pendiente" },
  agendada: { label: "Cita agendada", variant: "confirmada" },
  cancelada: { label: "Cancelada", variant: "cancelada" },
};

interface MascotaOpt {
  id_mascota: number;
  nombre: string;
  especie: string;
  id_cliente: number;
}
interface ClienteOpt {
  id_cliente: number;
  id_usuario: number;
  usuario?: { nombre: string; apellido: string };
}

export default function ColaEsperaPage() {
  const [cola, setCola] = useState<ColaEspera[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("activa");
  const [modalOpen, setModalOpen] = useState(false);
  const [mascotas, setMascotas] = useState<MascotaOpt[]>([]);
  const [clientes, setClientes] = useState<ClienteOpt[]>([]);

  const [fMascota, setFMascota] = useState("");
  const [fMotivo, setFMotivo] = useState("");
  const [fFecha, setFFecha] = useState("");
  const [saving, setSaving] = useState(false);

  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    fetch(`/api/colas-espera?estado=${filtroEstado}`)
      .then((r) => r.json())
      .then((j) => {
        setCola(j.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filtroEstado]);

  const reload = () => {
    setLoading(true);
    fetch(`/api/colas-espera?estado=${filtroEstado}`)
      .then((r) => r.json())
      .then((j) => {
        setCola(j.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const openCreate = async () => {
    const [resM, resC] = await Promise.all([
      fetch("/api/mascotas").then((r) => r.json()),
      fetch("/api/clientes").then((r) => r.json()),
    ]);
    setMascotas(resM.data ?? []);
    setClientes(resC.data ?? []);
    setFMascota("");
    setFMotivo("");
    setFFecha("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!fMascota || !fMotivo.trim()) {
      toast.error("Mascota y motivo son requeridos");
      return;
    }
    const mascotaSel = mascotas.find((m) => m.id_mascota === Number(fMascota));
    if (!mascotaSel) {
      toast.error("Mascota no encontrada");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/colas-espera", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_mascota: mascotaSel.id_mascota,
        id_cliente: mascotaSel.id_cliente,
        motivo: fMotivo,
        preferencia_fecha: fFecha || undefined,
      }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Agregado a la cola de espera");
      setModalOpen(false);
      reload();
    } else {
      const j = await res.json();
      toast.error(j.error ?? "Error al agregar");
    }
  };

  const cambiarEstado = async (id: number, estado: EstadoColaEspera) => {
    const res = await fetch(`/api/colas-espera/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    if (res.ok) {
      toast.success(`Estado actualizado`);
      reload();
    } else {
      const j = await res.json();
      toast.error(j.error ?? "Error");
    }
  };

  const canManage =
    user?.rol === "administrador" || user?.rol === "recepcionista";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1
            className="text-2xl font-bold text-gray-900"
            style={{
              fontFamily: "var(--font-dm-sans)",
              letterSpacing: "-0.02em",
            }}
          >
            Cola de Espera
          </h1>
          <p
            className="text-sm text-gray-500 mt-0.5"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            Clientes en lista de espera para cita
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
          {canManage && (
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Agregar
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { val: "activa", label: "En espera" },
          { val: "oferecido_horario", label: "Horario ofrecido" },
          { val: "agendada", label: "Agendados" },
          { val: "cancelada", label: "Cancelados" },
          { val: "todas", label: "Todos" },
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
        ) : cola.length === 0 ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <ListOrdered size={32} style={{ color: "#d1d5db" }} />
            <p
              style={{
                margin: 0,
                fontSize: "0.85rem",
                color: "#9ca3af",
                fontFamily: "var(--font-dm-sans)",
              }}
            >
              Cola vacía en este estado
            </p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {[
                  "#",
                  "Mascota / Cliente",
                  "Motivo",
                  "Preferencia",
                  "Desde",
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
              {cola.map((c, i) => {
                const mascotaNombre = c.mascotas?.nombre ?? "—";
                const especie = c.mascotas?.especie ?? "";
                const clienteNombre = c.clientes?.usuarios
                  ? `${c.clientes.usuarios.nombre} ${c.clientes.usuarios.apellido}`
                  : "—";
                const meta = ESTADO_META[c.estado];
                return (
                  <tr
                    key={c.id_cola_espera}
                    style={{ borderTop: i > 0 ? "1px solid #f3f4f6" : "none" }}
                  >
                    <td
                      style={{
                        padding: "10px 14px",
                        fontSize: "0.8rem",
                        color: "#9ca3af",
                        fontFamily: "var(--font-dm-sans)",
                        fontWeight: 700,
                      }}
                    >
                      #{i + 1}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          color: "#111827",
                          fontFamily: "var(--font-dm-sans)",
                          textTransform: "capitalize",
                        }}
                      >
                        {mascotaNombre} ({especie})
                      </p>
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: "0.72rem",
                          color: "#9ca3af",
                          fontFamily: "var(--font-dm-sans)",
                        }}
                      >
                        {clienteNombre}
                      </p>
                    </td>
                    <td
                      style={{
                        padding: "10px 14px",
                        fontSize: "0.8rem",
                        color: "#374151",
                        fontFamily: "var(--font-dm-sans)",
                        maxWidth: 180,
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
                        {c.motivo}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "10px 14px",
                        fontSize: "0.78rem",
                        color: "#6b7280",
                        fontFamily: "var(--font-dm-sans)",
                      }}
                    >
                      {c.preferencia_fecha
                        ? formatLima(
                            `${c.preferencia_fecha}T00:00:00`,
                            "dd/MM/yyyy",
                          )
                        : "—"}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: "0.75rem",
                          color: "#9ca3af",
                          fontFamily: "var(--font-dm-sans)",
                        }}
                      >
                        <Clock size={11} />{" "}
                        {formatLima(c.fecha_registro, "dd/MM/yy HH:mm")}
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      {canManage && c.estado === "activa" && (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            onClick={() =>
                              cambiarEstado(
                                c.id_cola_espera,
                                "oferecido_horario",
                              )
                            }
                            title="Horario ofrecido"
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          >
                            <CheckCircle2 className="size-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              cambiarEstado(c.id_cola_espera, "cancelada")
                            }
                            title="Cancelar"
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <XCircle className="size-3.5" />
                          </button>
                        </div>
                      )}
                      {canManage && c.estado === "oferecido_horario" && (
                        <button
                          onClick={() =>
                            cambiarEstado(c.id_cola_espera, "agendada")
                          }
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "4px 10px",
                            borderRadius: 6,
                            border: "1px solid #bbf7d0",
                            background: "rgba(240,253,244,0.8)",
                            color: "#15803d",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            fontFamily: "var(--font-dm-sans)",
                            cursor: "pointer",
                          }}
                        >
                          <CheckCircle2 size={11} /> Confirmar agendado
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
        title="Agregar a cola de espera"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
              Mascota *
            </label>
            <select
              value={fMascota}
              onChange={(e) => setFMascota(e.target.value)}
              style={{
                border: "1.5px solid #d1d5db",
                borderRadius: 8,
                padding: "9px 12px",
                fontSize: "0.85rem",
                fontFamily: "var(--font-dm-sans)",
                outline: "none",
              }}
            >
              <option value="">Seleccionar mascota…</option>
              {mascotas.map((m) => {
                const c = clientes.find((cl) => cl.id_cliente === m.id_cliente);
                return (
                  <option key={m.id_mascota} value={m.id_mascota}>
                    {m.nombre} ({m.especie})
                    {c?.usuario
                      ? ` — ${c.usuario.nombre} ${c.usuario.apellido}`
                      : ""}
                  </option>
                );
              })}
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
              Motivo *
            </label>
            <textarea
              value={fMotivo}
              onChange={(e) => setFMotivo(e.target.value)}
              placeholder="Motivo de la consulta…"
              rows={3}
              style={{
                border: "1.5px solid #d1d5db",
                borderRadius: 8,
                padding: "9px 12px",
                fontSize: "0.82rem",
                fontFamily: "var(--font-dm-sans)",
                resize: "vertical",
                outline: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#3d845b";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#d1d5db";
              }}
            />
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
              Preferencia de fecha{" "}
              <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                (opcional)
              </span>
            </label>
            <input
              type="date"
              value={fFecha}
              onChange={(e) => setFFecha(e.target.value)}
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
              Agregar a cola
            </Button>
          </div>
        </div>
      </Modal>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
