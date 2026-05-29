"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Stethoscope,
  RefreshCw,
  ChevronRight,
  Activity,
  Plus,
  Filter,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/context/toast";
import { useAuth } from "@/hooks/useAuth";
import { formatLima, format12h } from "@/utils/datetime";
import {
  TRANSICIONES_VALIDAS,
  type EstadoAtencion,
  type AtencionClinica,
} from "@/types";

// ── Estado labels & colors ───────────────────────────────────────────────────
const ESTADO_META: Record<
  EstadoAtencion,
  { label: string; color: string; bg: string; dot: string }
> = {
  reservada: {
    label: "Reservada",
    color: "#6b7280",
    bg: "rgba(107,114,128,0.12)",
    dot: "#9ca3af",
  },
  confirmada: {
    label: "Confirmada",
    color: "#2563eb",
    bg: "rgba(37,99,235,0.10)",
    dot: "#3b82f6",
  },
  espera: {
    label: "En espera",
    color: "#d97706",
    bg: "rgba(217,119,6,0.12)",
    dot: "#f59e0b",
  },
  triaje: {
    label: "Triaje",
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.12)",
    dot: "#8b5cf6",
  },
  consulta: {
    label: "En consulta",
    color: "#0369a1",
    bg: "rgba(3,105,161,0.12)",
    dot: "#0ea5e9",
  },
  hospitalizado: {
    label: "Hospitalizado",
    color: "#b45309",
    bg: "rgba(180,83,9,0.12)",
    dot: "#f97316",
  },
  finalizado: {
    label: "Finalizado",
    color: "#15803d",
    bg: "rgba(21,128,61,0.12)",
    dot: "#22c55e",
  },
  seguimiento: {
    label: "Seguimiento",
    color: "#0f766e",
    bg: "rgba(15,118,110,0.12)",
    dot: "#14b8a6",
  },
  no_asistio: {
    label: "No asistió",
    color: "#9f1239",
    bg: "rgba(159,18,57,0.10)",
    dot: "#f43f5e",
  },
  cancelada: {
    label: "Cancelada",
    color: "#6b7280",
    bg: "rgba(107,114,128,0.08)",
    dot: "#9ca3af",
  },
};

const TRANSICION_ACTION: Partial<
  Record<EstadoAtencion, { label: string; style: React.CSSProperties }>
> = {
  confirmada: {
    label: "Confirmar",
    style: {
      background: "rgba(37,99,235,0.12)",
      color: "#2563eb",
      border: "1px solid rgba(37,99,235,0.25)",
    },
  },
  espera: {
    label: "A Sala",
    style: {
      background: "rgba(217,119,6,0.12)",
      color: "#d97706",
      border: "1px solid rgba(217,119,6,0.25)",
    },
  },
  triaje: {
    label: "Triaje",
    style: {
      background: "rgba(124,58,237,0.12)",
      color: "#7c3aed",
      border: "1px solid rgba(124,58,237,0.25)",
    },
  },
  consulta: {
    label: "A Consulta",
    style: {
      background: "rgba(3,105,161,0.12)",
      color: "#0369a1",
      border: "1px solid rgba(3,105,161,0.25)",
    },
  },
  hospitalizado: {
    label: "Hospitalizar",
    style: {
      background: "rgba(180,83,9,0.12)",
      color: "#b45309",
      border: "1px solid rgba(180,83,9,0.25)",
    },
  },
  finalizado: {
    label: "Finalizar",
    style: {
      background: "rgba(21,128,61,0.12)",
      color: "#15803d",
      border: "1px solid rgba(21,128,61,0.25)",
    },
  },
  seguimiento: {
    label: "Seguimiento",
    style: {
      background: "rgba(15,118,110,0.12)",
      color: "#0f766e",
      border: "1px solid rgba(15,118,110,0.25)",
    },
  },
  no_asistio: {
    label: "No asistió",
    style: {
      background: "rgba(159,18,57,0.10)",
      color: "#9f1239",
      border: "1px solid rgba(159,18,57,0.2)",
    },
  },
  cancelada: {
    label: "Cancelar",
    style: {
      background: "rgba(239,68,68,0.10)",
      color: "#dc2626",
      border: "1px solid rgba(239,68,68,0.2)",
    },
  },
};

// ── Columnas Kanban ──────────────────────────────────────────────────────────
const COLUMNAS = [
  {
    id: "pendientes",
    label: "Pendientes",
    estados: ["reservada", "confirmada"] as EstadoAtencion[],
    icon: Clock,
    accent: "#3b82f6",
  },
  {
    id: "sala",
    label: "En Sala",
    estados: ["espera", "triaje"] as EstadoAtencion[],
    icon: Activity,
    accent: "#f59e0b",
  },
  {
    id: "consulta",
    label: "Consulta",
    estados: ["consulta", "hospitalizado"] as EstadoAtencion[],
    icon: Stethoscope,
    accent: "#0ea5e9",
  },
];

const ESTADOS_CERRADOS: EstadoAtencion[] = [
  "finalizado",
  "seguimiento",
  "no_asistio",
  "cancelada",
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function StateBadge({ estado }: { estado: EstadoAtencion }) {
  const m = ESTADO_META[estado];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "2px 8px",
        borderRadius: "99px",
        background: m.bg,
        color: m.color,
        fontSize: "0.68rem",
        fontWeight: 600,
        letterSpacing: "0.04em",
        fontFamily: "var(--font-dm-sans)",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: m.dot,
          flexShrink: 0,
        }}
      />
      {m.label}
    </span>
  );
}

function UrgentBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 7px",
        borderRadius: "99px",
        background: "rgba(239,68,68,0.12)",
        color: "#dc2626",
        border: "1px solid rgba(239,68,68,0.3)",
        fontSize: "0.65rem",
        fontWeight: 700,
        letterSpacing: "0.08em",
        fontFamily: "var(--font-dm-sans)",
        textTransform: "uppercase",
      }}
    >
      <AlertTriangle size={9} />
      Urgente
    </span>
  );
}

// ── Tarjeta de atención ──────────────────────────────────────────────────────
function AtencionCard({
  atencion,
  onTransicion,
}: {
  atencion: AtencionClinica;
  onTransicion: (a: AtencionClinica, nuevoEstado: EstadoAtencion) => void;
}) {
  const transiciones = TRANSICIONES_VALIDAS[atencion.estado_actual];
  const mascotaNombre = atencion.mascotas?.nombre ?? "—";
  const especie = atencion.mascotas?.especie ?? "";
  const clienteNombre = atencion.mascotas?.clientes?.usuarios
    ? `${atencion.mascotas.clientes.usuarios.nombre} ${atencion.mascotas.clientes.usuarios.apellido}`
    : null;
  const vetNombre = atencion.veterinarios?.usuarios
    ? `Dr. ${atencion.veterinarios.usuarios.nombre} ${atencion.veterinarios.usuarios.apellido}`
    : "—";
  // Preferir la hora agendada de la cita; fallback al timestamp de inicio de atención
  const horaCita   = atencion.citas?.hora ? format12h(atencion.citas.hora) : null;
  const horaInicio = formatLima(atencion.fecha_inicio, "HH:mm");
  const hora       = horaCita ?? horaInicio;
  const fechaCita  = atencion.citas?.fecha
    ? formatLima(`${atencion.citas.fecha}T00:00:00`, "dd/MM/yyyy")
    : formatLima(atencion.fecha_inicio, "dd/MM/yyyy");

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e8f0eb",
        borderRadius: "12px",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        boxShadow:
          atencion.prioridad === "urgente"
            ? "0 0 0 2px rgba(239,68,68,0.3), 0 2px 8px rgba(0,0,0,0.06)"
            : "0 1px 4px rgba(0,0,0,0.06)",
        transition: "box-shadow 0.15s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Borde izquierdo de prioridad */}
      {atencion.prioridad === "urgente" && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: "linear-gradient(180deg, #ef4444, #dc2626)",
            borderRadius: "12px 0 0 12px",
          }}
        />
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: "0.9rem",
              color: "#111827",
              fontFamily: "var(--font-dm-sans)",
              lineHeight: 1.2,
            }}
          >
            {mascotaNombre}
          </p>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: "0.72rem",
              color: "#6b7280",
              fontFamily: "var(--font-dm-sans)",
              textTransform: "capitalize",
            }}
          >
            {especie}
            {clienteNombre ? ` · ${clienteNombre}` : ""}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 4,
            flexShrink: 0,
          }}
        >
          {atencion.prioridad === "urgente" && <UrgentBadge />}
          <StateBadge estado={atencion.estado_actual} />
        </div>
      </div>

      {/* Info */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: "0.75rem",
            color: "#374151",
            fontFamily: "var(--font-dm-sans)",
          }}
        >
          <Clock size={11} style={{ color: "#9ca3af" }} />
          {/* Fecha y hora agendada de la cita */}
          <span>{fechaCita}</span>
          <span style={{ color: "#d1d5db" }}>·</span>
          <span style={{ fontWeight: 600 }}>{hora}</span>
          <span style={{ color: "#d1d5db" }}>·</span>
          <Stethoscope size={11} style={{ color: "#9ca3af" }} />
          <span style={{ color: "#6b7280" }}>{vetNombre}</span>
        </div>
        {atencion.motivo_consulta && (
          <p
            style={{
              margin: 0,
              fontSize: "0.73rem",
              color: "#6b7280",
              fontFamily: "var(--font-dm-sans)",
              lineClamp: 2,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {atencion.motivo_consulta}
          </p>
        )}
      </div>

      {/* Acciones de transición */}
      {transiciones.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 5,
            borderTop: "1px solid #f3f4f6",
            paddingTop: 10,
          }}
        >
          {transiciones.map((e) => {
            const meta = TRANSICION_ACTION[e];
            if (!meta) return null;
            return (
              <button
                key={e}
                onClick={() => onTransicion(atencion, e)}
                style={{
                  ...meta.style,
                  borderRadius: "6px",
                  padding: "3px 10px",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  fontFamily: "var(--font-dm-sans)",
                  cursor: "pointer",
                  transition: "opacity 0.12s",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
                onMouseEnter={(e2) => (e2.currentTarget.style.opacity = "0.75")}
                onMouseLeave={(e2) => (e2.currentTarget.style.opacity = "1")}
              >
                <ChevronRight size={10} />
                {meta.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Columna Kanban ────────────────────────────────────────────────────────────
function KanbanCol({
  col,
  atenciones,
  onTransicion,
}: {
  col: (typeof COLUMNAS)[number];
  atenciones: AtencionClinica[];
  onTransicion: (a: AtencionClinica, e: EstadoAtencion) => void;
}) {
  const Icon = col.icon;
  const items = atenciones.filter((a) => col.estados.includes(a.estado_actual));

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}
    >
      {/* Header columna */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,249,0.9))",
          border: "1px solid #e8f0eb",
          borderRadius: "10px",
          backdropFilter: "blur(4px)",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: `${col.accent}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={14} style={{ color: col.accent }} />
        </div>
        <span
          style={{
            fontWeight: 700,
            fontSize: "0.82rem",
            color: "#111827",
            fontFamily: "var(--font-dm-sans)",
            flex: 1,
          }}
        >
          {col.label}
        </span>
        <span
          style={{
            background: items.length > 0 ? `${col.accent}20` : "#f3f4f6",
            color: items.length > 0 ? col.accent : "#9ca3af",
            borderRadius: "99px",
            padding: "1px 8px",
            fontSize: "0.72rem",
            fontWeight: 700,
            fontFamily: "var(--font-dm-sans)",
          }}
        >
          {items.length}
        </span>
      </div>

      {/* Tarjetas */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.length === 0 ? (
          <div
            style={{
              border: "1.5px dashed #d1fae5",
              borderRadius: 10,
              padding: "20px 12px",
              textAlign: "center",
              color: "#9ca3af",
              fontSize: "0.75rem",
              fontFamily: "var(--font-dm-sans)",
              background: "rgba(240,253,244,0.5)",
            }}
          >
            Sin atenciones
          </div>
        ) : (
          items.map((a) => (
            <AtencionCard
              key={a.id_atencion}
              atencion={a}
              onTransicion={onTransicion}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function AtencionesClinicasPage() {
  const [atenciones, setAtenciones] = useState<AtencionClinica[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPrioridad, setFilterPrioridad] = useState<
    "" | "urgente" | "normal"
  >("");
  const [transModal, setTransModal] = useState<{
    atencion: AtencionClinica;
    nuevoEstado: EstadoAtencion;
  } | null>(null);
  const [razon,              setRazon]              = useState("");
  const [motivoSeguimiento,  setMotivoSeguimiento]  = useState("");
  const [fechaControlSeg,    setFechaControlSeg]    = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  // Carga inicial — sin setState síncrono en el efecto (loading arranca en true)
  useEffect(() => {
    fetch("/api/atenciones-clinicas")
      .then((r) => r.json())
      .then((json) => {
        setAtenciones(json.data ?? []);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Error al cargar atenciones clínicas");
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresco manual desde el botón (handler de evento — setState síncrono está bien aquí)
  const fetchAtenciones = () => {
    setLoading(true);
    fetch("/api/atenciones-clinicas")
      .then((r) => r.json())
      .then((json) => {
        setAtenciones(json.data ?? []);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Error al cargar atenciones clínicas");
        setLoading(false);
      });
  };

  const handleTransicion = (atencion: AtencionClinica, nuevoEstado: EstadoAtencion) => {
    setRazon("");
    setMotivoSeguimiento("");
    // Fecha por defecto: 7 días desde hoy
    const defFecha = new Date(); defFecha.setDate(defFecha.getDate() + 7);
    setFechaControlSeg(defFecha.toISOString().slice(0, 10));
    setTransModal({ atencion, nuevoEstado });
  };

  const confirmarTransicion = async () => {
    if (!transModal) return;

    // Validación frontend para seguimiento
    if (transModal.nuevoEstado === "seguimiento") {
      if (!motivoSeguimiento.trim()) {
        toast.error("El motivo del seguimiento es requerido"); return;
      }
      if (!fechaControlSeg) {
        toast.error("La fecha de control es requerida"); return;
      }
    }
    // Validación frontend para hospitalización
    if (transModal.nuevoEstado === "hospitalizado" && !razon.trim()) {
      toast.error("El motivo de hospitalización es requerido"); return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        estado_nuevo: transModal.nuevoEstado,
        razon:        razon || undefined,
      };
      if (transModal.nuevoEstado === "seguimiento") {
        body.motivo_seguimiento     = motivoSeguimiento;
        body.fecha_sugerida_control = fechaControlSeg;
      }

      const res = await fetch(
        `/api/atenciones-clinicas/${transModal.atencion.id_atencion}/transicion`,
        { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
      );
      if (res.ok) {
        toast.success(`Estado actualizado a "${ESTADO_META[transModal.nuevoEstado].label}"`);
        setTransModal(null);
        fetchAtenciones();
      } else {
        const json = await res.json();
        toast.error(json.error ?? "Error al cambiar estado");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const displayed = filterPrioridad
    ? atenciones.filter((a) => a.prioridad === filterPrioridad)
    : atenciones;

  const activas = displayed.filter(
    (a) => !ESTADOS_CERRADOS.includes(a.estado_actual),
  );
  const cerradas = displayed.filter((a) =>
    ESTADOS_CERRADOS.includes(a.estado_actual),
  );

  // Stats pills
  const statsCounts: { label: string; value: number; color: string }[] = [
    {
      label: "Urgentes",
      value: activas.filter((a) => a.prioridad === "urgente").length,
      color: "#dc2626",
    },
    {
      label: "En espera",
      value: activas.filter((a) => a.estado_actual === "espera").length,
      color: "#d97706",
    },
    {
      label: "En triaje",
      value: activas.filter((a) => a.estado_actual === "triaje").length,
      color: "#7c3aed",
    },
    {
      label: "En consulta",
      value: activas.filter((a) => a.estado_actual === "consulta").length,
      color: "#0369a1",
    },
  ];

  const canCreate =
    user?.rol === "administrador" || user?.rol === "recepcionista";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "#111827",
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.02em",
            }}
          >
            Atenciones Clínicas
          </h1>
          <p
            style={{
              margin: "3px 0 0",
              fontSize: "0.82rem",
              color: "#6b7280",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            Flujo de atención en tiempo real
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={fetchAtenciones}
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
            />
            Actualizar
          </button>
          {canCreate && (
            <Button onClick={() => (window.location.href = "/citas")}>
              <Plus size={14} />
              Nueva atención
            </Button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            borderRadius: 8,
            background: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
            border: "1px solid #a7f3d0",
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "#065f46",
            fontFamily: "var(--font-dm-sans)",
          }}
        >
          <Activity size={13} />
          {activas.length} activas
        </div>
        {statsCounts.map(
          (s) =>
            s.value > 0 && (
              <div
                key={s.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 8,
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  fontFamily: "var(--font-dm-sans)",
                  color: s.color,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: s.color,
                    flexShrink: 0,
                  }}
                />
                {s.value} {s.label.toLowerCase()}
              </div>
            ),
        )}

        {/* Filtro prioridad */}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Filter size={13} style={{ color: "#9ca3af" }} />
          <select
            value={filterPrioridad}
            onChange={(e) =>
              setFilterPrioridad(e.target.value as typeof filterPrioridad)
            }
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 8,
              padding: "6px 10px",
              fontSize: "0.78rem",
              fontFamily: "var(--font-dm-sans)",
              color: "#374151",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            <option value="">Todas las prioridades</option>
            <option value="urgente">Solo urgentes</option>
            <option value="normal">Solo normales</option>
          </select>
        </div>
      </div>

      {/* Kanban */}
      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <div
                style={{
                  height: 48,
                  borderRadius: 10,
                  background:
                    "linear-gradient(90deg, #f3f4f6, #e5e7eb, #f3f4f6)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.5s infinite",
                }}
              />
              {[0, 1].map((j) => (
                <div
                  key={j}
                  style={{
                    height: 120,
                    borderRadius: 12,
                    background:
                      "linear-gradient(90deg, #f9fafb, #f3f4f6, #f9fafb)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s infinite",
                    animationDelay: `${j * 0.2}s`,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
        >
          {COLUMNAS.map((col) => (
            <KanbanCol
              key={col.id}
              col={col}
              atenciones={displayed}
              onTransicion={handleTransicion}
            />
          ))}
        </div>
      )}

      {/* Tabla de cerradas */}
      {cerradas.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#9ca3af",
                fontFamily: "var(--font-dm-sans)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                whiteSpace: "nowrap",
              }}
            >
              Historial del día ({cerradas.length})
            </span>
            <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
          </div>
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              overflow: "hidden",
              background: "#fff",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Mascota", "Veterinario", "Hora", "Motivo", "Estado"].map(
                    (h) => (
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
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {cerradas.map((a, i) => {
                  const vetN = a.veterinarios?.usuarios
                    ? `${a.veterinarios.usuarios.nombre} ${a.veterinarios.usuarios.apellido}`
                    : "—";
                  return (
                    <tr
                      key={a.id_atencion}
                      style={{
                        borderTop: i > 0 ? "1px solid #f3f4f6" : "none",
                      }}
                    >
                      <td
                        style={{
                          padding: "10px 14px",
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          color: "#111827",
                          fontFamily: "var(--font-dm-sans)",
                        }}
                      >
                        {a.mascotas?.nombre ?? "—"}
                        <span
                          style={{
                            fontWeight: 400,
                            color: "#9ca3af",
                            marginLeft: 5,
                            fontSize: "0.72rem",
                            textTransform: "capitalize",
                          }}
                        >
                          {a.mascotas?.especie}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          fontSize: "0.8rem",
                          color: "#374151",
                          fontFamily: "var(--font-dm-sans)",
                        }}
                      >
                        {vetN}
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          fontSize: "0.78rem",
                          color: "#6b7280",
                          fontFamily: "var(--font-dm-sans)",
                        }}
                      >
                        {a.citas?.hora
                          ? format12h(a.citas.hora)
                          : formatLima(a.fecha_inicio, "HH:mm")}
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
                          {a.motivo_consulta ?? "—"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <StateBadge estado={a.estado_actual} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de transición */}
      <Modal
        open={!!transModal}
        onClose={() => setTransModal(null)}
        title="Cambiar estado"
      >
        {transModal && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Flujo visual */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 16px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #f9fafb, #f3f4f6)",
                border: "1px solid #e5e7eb",
              }}
            >
              <StateBadge estado={transModal.atencion.estado_actual} />
              <ChevronRight size={14} style={{ color: "#9ca3af" }} />
              <StateBadge estado={transModal.nuevoEstado} />
            </div>

            {/* Info mascota */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.78rem",
                  color: "#6b7280",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                Mascota
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: "#111827",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                {transModal.atencion.mascotas?.nombre ?? "—"}
                <span
                  style={{
                    fontWeight: 400,
                    color: "#6b7280",
                    marginLeft: 6,
                    textTransform: "capitalize",
                    fontSize: "0.82rem",
                  }}
                >
                  {transModal.atencion.mascotas?.especie}
                </span>
              </p>
            </div>

            {/* Campos extra cuando el destino es "seguimiento" */}
            {transModal.nuevoEstado === "seguimiento" && (
              <>
                <div style={{ padding:"12px 14px", borderRadius:10, background:"rgba(15,118,110,0.06)", border:"1px solid rgba(15,118,110,0.2)" }}>
                  <p style={{ margin:"0 0 2px", fontFamily:"var(--font-dm-sans)", fontSize:"0.8rem", fontWeight:700, color:"#0f766e" }}>
                    Programar seguimiento clínico
                  </p>
                  <p style={{ margin:0, fontFamily:"var(--font-dm-sans)", fontSize:"0.75rem", color:"#0f766e", opacity:0.8 }}>
                    Se creará automáticamente un seguimiento en el módulo de Seguimientos.
                  </p>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  <label style={{ fontSize:"0.75rem", fontWeight:600, color:"#374151", textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:"var(--font-dm-sans)" }}>
                    Motivo del seguimiento *
                  </label>
                  <textarea
                    value={motivoSeguimiento}
                    onChange={e => setMotivoSeguimiento(e.target.value)}
                    placeholder="Ej: Control de herida, revisión de tratamiento…"
                    rows={2}
                    style={{ border:"1px solid #d1d5db", borderRadius:8, padding:"10px 12px", fontSize:"0.82rem", fontFamily:"var(--font-dm-sans)", color:"#111827", resize:"vertical", outline:"none" }}
                    onFocus={e => { e.currentTarget.style.borderColor = "#0f766e"; }}
                    onBlur={e  => { e.currentTarget.style.borderColor = "#d1d5db"; }}
                  />
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  <label style={{ fontSize:"0.75rem", fontWeight:600, color:"#374151", textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:"var(--font-dm-sans)" }}>
                    Fecha de control sugerida *
                  </label>
                  <input
                    type="date"
                    value={fechaControlSeg}
                    onChange={e => setFechaControlSeg(e.target.value)}
                    min={new Date(Date.now() + 86400000).toISOString().slice(0,10)}
                    style={{ border:"1px solid #d1d5db", borderRadius:8, padding:"9px 12px", fontSize:"0.82rem", fontFamily:"var(--font-dm-sans)", color:"#111827", outline:"none", width:"100%", boxSizing:"border-box" }}
                    onFocus={e => { e.currentTarget.style.borderColor = "#0f766e"; }}
                    onBlur={e  => { e.currentTarget.style.borderColor = "#d1d5db"; }}
                  />
                </div>
              </>
            )}

            {/* Razón del cambio — obligatoria para hospitalización */}
            {transModal.nuevoEstado === "hospitalizado" && (
              <div style={{ padding:"10px 14px", borderRadius:10, background:"rgba(180,83,9,0.06)", border:"1px solid rgba(180,83,9,0.2)" }}>
                <p style={{ margin:0, fontFamily:"var(--font-dm-sans)", fontSize:"0.8rem", fontWeight:700, color:"#b45309" }}>
                  Motivo de hospitalización requerido
                </p>
                <p style={{ margin:"2px 0 0", fontFamily:"var(--font-dm-sans)", fontSize:"0.75rem", color:"#b45309", opacity:0.8 }}>
                  Indique el motivo clínico para internar a la mascota.
                </p>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize:"0.75rem", fontWeight:600, color:"#374151", textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:"var(--font-dm-sans)" }}>
                {transModal.nuevoEstado === "seguimiento"
                  ? "Observaciones"
                  : transModal.nuevoEstado === "hospitalizado"
                    ? "Motivo de hospitalización *"
                    : "Razón del cambio"}{" "}
                {transModal.nuevoEstado !== "hospitalizado" && (
                  <span style={{ color:"#9ca3af", fontWeight:400 }}>(opcional)</span>
                )}
              </label>
              <textarea
                value={razon}
                onChange={e => setRazon(e.target.value)}
                placeholder={transModal.nuevoEstado === "seguimiento" ? "Notas adicionales para el seguimiento…" : "Ej: Paciente listo para consulta..."}
                rows={2}
                style={{ border:"1px solid #d1d5db", borderRadius:8, padding:"10px 12px", fontSize:"0.82rem", fontFamily:"var(--font-dm-sans)", color:"#111827", resize:"vertical", outline:"none", transition:"border-color 0.15s" }}
                onFocus={e => { e.currentTarget.style.borderColor = "#3d845b"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(61,132,91,0.1)"; }}
                onBlur={e  => { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                borderTop: "1px solid #f3f4f6",
                paddingTop: 14,
                paddingBottom: 8,
                marginTop: 4,
                position: "sticky",
                bottom: 0,
                background: "#fff",
              }}
            >
              <button
                onClick={() => setTransModal(null)}
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
              <Button loading={submitting} onClick={confirmarTransicion}>
                {transModal.nuevoEstado === "cancelada" ? (
                  <>
                    <XCircle size={13} /> Cancelar atención
                  </>
                ) : transModal.nuevoEstado === "finalizado" ? (
                  <>
                    <CheckCircle2 size={13} /> Finalizar
                  </>
                ) : (
                  <>
                    <ChevronRight size={13} /> Confirmar cambio
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
