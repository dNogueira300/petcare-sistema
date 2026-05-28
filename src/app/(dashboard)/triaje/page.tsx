"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Thermometer,
  Heart,
  Wind,
  Weight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Stethoscope,
  ChevronRight,
  RefreshCw,
  ClipboardPlus,
  Shield,
  AlertCircle,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/context/toast";
import { useAuth } from "@/hooks/useAuth";
import { formatLima } from "@/utils/datetime";
import type { NivelUrgencia, AtencionClinica, Triaje } from "@/types";

const ESPECIE_EMOJI: Record<string, string> = {
  perro: "🐕",
  gato: "🐈",
  conejo: "🐇",
  ave: "🦜",
  reptil: "🦎",
};

// ── Rangos normales estáticos por especie ────────────────────────────────────
const RANGOS: Record<
  string,
  { temp: [number, number]; fc: [number, number]; fr: [number, number] }
> = {
  perro: { temp: [38.0, 39.2], fc: [60, 140], fr: [15, 30] },
  gato: { temp: [38.0, 39.2], fc: [120, 220], fr: [20, 40] },
  conejo: { temp: [38.5, 39.5], fc: [130, 325], fr: [30, 60] },
  ave: { temp: [40.0, 42.0], fc: [150, 350], fr: [15, 35] },
  reptil: { temp: [26.0, 32.0], fc: [30, 80], fr: [4, 20] },
};

function getRango(especie: string) {
  return RANGOS[especie?.toLowerCase()] ?? RANGOS.perro;
}

function isOutOfRange(val: number | null, min: number, max: number): boolean {
  if (val === null || val === undefined) return false;
  return val < min || val > max;
}

// ── Nivel urgencia ────────────────────────────────────────────────────────────
const URGENCIA_META: Record<
  NivelUrgencia,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  normal: {
    label: "Normal",
    color: "#15803d",
    bg: "rgba(21,128,61,0.10)",
    icon: CheckCircle2,
  },
  urgente: {
    label: "Urgente",
    color: "#b45309",
    bg: "rgba(180,83,9,0.12)",
    icon: AlertTriangle,
  },
  emergencia: {
    label: "Emergencia",
    color: "#dc2626",
    bg: "rgba(220,38,38,0.12)",
    icon: AlertCircle,
  },
};

function UrgenciaBadge({ nivel }: { nivel: NivelUrgencia }) {
  const m = URGENCIA_META[nivel];
  const Icon = m.icon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: "99px",
        background: m.bg,
        color: m.color,
        fontSize: "0.7rem",
        fontWeight: 700,
        letterSpacing: "0.05em",
        fontFamily: "var(--font-dm-sans)",
        textTransform: "uppercase",
      }}
    >
      <Icon size={10} />
      {m.label}
    </span>
  );
}

// ── Campo de signo vital con validación visual ───────────────────────────────
function VitalField({
  icon: Icon,
  label,
  unit,
  value,
  onChange,
  min,
  max,
  placeholder,
}: {
  icon: React.ElementType;
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  const num = value ? parseFloat(value) : null;
  const outOfRange =
    min !== undefined && max !== undefined && isOutOfRange(num, min, max);
  const filled = value !== "";

  let borderColor = "#d1d5db";
  let glowColor = "transparent";
  if (outOfRange && filled) {
    borderColor = "#ef4444";
    glowColor = "rgba(239,68,68,0.12)";
  } else if (filled) {
    borderColor = "#3d845b";
    glowColor = "rgba(61,132,91,0.08)";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: "0.72rem",
          fontWeight: 600,
          color: "#374151",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontFamily: "var(--font-dm-sans)",
        }}
      >
        <Icon size={12} style={{ color: "#6b7280" }} />
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type="number"
          step="0.1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? `${min ?? ""}–${max ?? ""}`}
          style={{
            width: "100%",
            border: `1.5px solid ${borderColor}`,
            borderRadius: 8,
            padding: "9px 48px 9px 12px",
            fontSize: "0.9rem",
            fontFamily: "var(--font-dm-sans)",
            color: "#111827",
            background: glowColor || "#fff",
            transition: "border-color 0.15s, background 0.15s",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <span
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "0.7rem",
            color: "#9ca3af",
            fontFamily: "var(--font-dm-sans)",
            fontWeight: 500,
          }}
        >
          {unit}
        </span>
      </div>
      {outOfRange && filled && min !== undefined && max !== undefined && (
        <p
          style={{
            margin: 0,
            fontSize: "0.68rem",
            color: "#dc2626",
            fontFamily: "var(--font-dm-sans)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <AlertTriangle size={10} />
          Fuera de rango normal ({min}–{max} {unit})
        </p>
      )}
      {!outOfRange && filled && min !== undefined && max !== undefined && (
        <p
          style={{
            margin: 0,
            fontSize: "0.68rem",
            color: "#15803d",
            fontFamily: "var(--font-dm-sans)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <CheckCircle2 size={10} />
          Dentro del rango normal
        </p>
      )}
    </div>
  );
}

// ── Fila de atención en espera ───────────────────────────────────────────────
function AtencionRow({
  atencion,
  onIniciarTriaje,
}: {
  atencion: AtencionClinica;
  onIniciarTriaje: (a: AtencionClinica) => void;
}) {
  const mascotaNombre = atencion.mascotas?.nombre ?? "—";
  const especie = atencion.mascotas?.especie ?? "—";
  const vetNombre = atencion.veterinarios?.usuarios
    ? `${atencion.veterinarios.usuarios.nombre} ${atencion.veterinarios.usuarios.apellido}`
    : "—";
  const hora = formatLima(atencion.fecha_inicio, "HH:mm");

  const isTriaje = atencion.estado_actual === "triaje";

  return (
    <tr
      style={{ borderTop: "1px solid #f3f4f6", transition: "background 0.1s" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "#f9fafb";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <td style={{ padding: "12px 16px" }}>
        <div>
          <p
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: "0.88rem",
              color: "#111827",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            {mascotaNombre}
          </p>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: "0.72rem",
              color: "#9ca3af",
              fontFamily: "var(--font-dm-sans)",
              textTransform: "capitalize",
            }}
          >
            {especie}
          </p>
        </div>
      </td>
      <td
        style={{
          padding: "12px 16px",
          fontSize: "0.8rem",
          color: "#6b7280",
          fontFamily: "var(--font-dm-sans)",
        }}
      >
        {vetNombre}
      </td>
      <td style={{ padding: "12px 16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: "0.8rem",
            color: "#6b7280",
            fontFamily: "var(--font-dm-sans)",
          }}
        >
          <Clock size={12} style={{ color: "#9ca3af" }} />
          {hora}
        </div>
      </td>
      <td style={{ padding: "12px 16px" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 10px",
            borderRadius: "99px",
            background: isTriaje
              ? "rgba(124,58,237,0.1)"
              : "rgba(217,119,6,0.1)",
            color: isTriaje ? "#7c3aed" : "#b45309",
            fontSize: "0.7rem",
            fontWeight: 600,
            fontFamily: "var(--font-dm-sans)",
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: isTriaje ? "#8b5cf6" : "#f59e0b",
            }}
          />
          {isTriaje ? "En triaje" : "En espera"}
        </span>
      </td>
      {atencion.prioridad === "urgente" ? (
        <td style={{ padding: "12px 16px" }}>
          <UrgenciaBadge nivel="urgente" />
        </td>
      ) : (
        <td style={{ padding: "12px 16px" }} />
      )}
      <td style={{ padding: "12px 16px", textAlign: "right" }}>
        <button
          onClick={() => onIniciarTriaje(atencion)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            borderRadius: 8,
            background: "linear-gradient(135deg, #3d845b, #2d6446)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: "0.78rem",
            fontWeight: 600,
            fontFamily: "var(--font-dm-sans)",
            boxShadow: "0 1px 4px rgba(61,132,91,0.3)",
            transition: "opacity 0.12s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = "0.85";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = "1";
          }}
        >
          <ClipboardPlus size={13} />
          Registrar triaje
        </button>
      </td>
    </tr>
  );
}

// ── Tarjeta de triaje realizado ───────────────────────────────────────────────
function TriajeCard({
  triaje,
}: {
  triaje: Triaje & { mascotas?: { nombre: string; especie: string } };
}) {
  const hora = formatLima(triaje.fecha_triaje, "HH:mm");

  const vitalStyle = (
    val: number | null,
    min?: number,
    max?: number,
  ): React.CSSProperties => {
    if (!val || !min || !max) return { color: "#6b7280" };
    if (val < min || val > max) return { color: "#dc2626", fontWeight: 700 };
    return { color: "#15803d" };
  };

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
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
            }}
          >
            {triaje.mascotas?.nombre ?? `Atención #${triaje.id_atencion}`}
          </p>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: "0.72rem",
              color: "#9ca3af",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            {triaje.mascotas?.especie
              ? `${triaje.mascotas.especie} · `
              : ""}Triaje • {hora}
          </p>
        </div>
        <UrgenciaBadge nivel={triaje.nivel_urgencia} />
      </div>

      {/* Vitales */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          padding: "12px",
          borderRadius: 8,
          background: "linear-gradient(135deg, #f9fafb, #f3f4f6)",
          border: "1px solid #e5e7eb",
        }}
      >
        {[
          {
            icon: Weight,
            label: "Peso",
            value: triaje.peso,
            unit: "kg",
            min: undefined,
            max: undefined,
          },
          {
            icon: Thermometer,
            label: "Temp",
            value: triaje.temperatura,
            unit: "°C",
            min: 38.0,
            max: 39.2,
          },
          {
            icon: Heart,
            label: "FC",
            value: triaje.frecuencia_cardiaca,
            unit: "lat/min",
            min: 60,
            max: 140,
          },
          {
            icon: Wind,
            label: "FR",
            value: triaje.frecuencia_respiratoria,
            unit: "resp/min",
            min: 15,
            max: 30,
          },
        ].map(({ icon: Icon, label, value, unit, min, max }) => (
          <div
            key={label}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              alignItems: "center",
            }}
          >
            <Icon size={13} style={{ color: "#9ca3af" }} />
            <span
              style={{
                fontSize: "0.65rem",
                color: "#9ca3af",
                fontFamily: "var(--font-dm-sans)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {label}
            </span>
            <span
              style={{
                fontSize: "0.88rem",
                fontFamily: "var(--font-dm-sans)",
                ...vitalStyle(value, min, max),
              }}
            >
              {value != null ? `${value} ${unit}` : "—"}
            </span>
          </div>
        ))}
      </div>

      {triaje.observaciones_iniciales && (
        <p
          style={{
            margin: 0,
            fontSize: "0.75rem",
            color: "#6b7280",
            fontFamily: "var(--font-dm-sans)",
          }}
        >
          {triaje.observaciones_iniciales}
        </p>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function TriajePage() {
  const [atenciones, setAtenciones] = useState<AtencionClinica[]>([]);
  const [triajes, setTriajes] = useState<Triaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAtencion, setSelectedAtencion] =
    useState<AtencionClinica | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [peso, setPeso] = useState("");
  const [temp, setTemp] = useState("");
  const [fc, setFc] = useState("");
  const [fr, setFr] = useState("");
  const [urgencia, setUrgencia] = useState<NivelUrgencia>("normal");
  const [razonUrgencia, setRazonUrgencia] = useState("");
  const [sintomas, setSintomas] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const { user } = useAuth();
  const toast = useToast();

  // Carga inicial — sin setState síncrono en el efecto (loading arranca en true)
  useEffect(() => {
    Promise.all([
      fetch("/api/atenciones-clinicas").then((r) => r.json()),
      fetch("/api/triaje").then((r) => r.json()),
    ])
      .then(([jsonA, jsonT]) => {
        setAtenciones(jsonA.data ?? []);
        setTriajes(jsonT.data ?? []);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Error al cargar datos");
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresco manual desde el botón (handler de evento)
  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/atenciones-clinicas").then((r) => r.json()),
      fetch("/api/triaje").then((r) => r.json()),
    ])
      .then(([jsonA, jsonT]) => {
        setAtenciones(jsonA.data ?? []);
        setTriajes(jsonT.data ?? []);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Error al cargar datos");
        setLoading(false);
      });
  };

  const openModal = (a: AtencionClinica) => {
    setPeso("");
    setTemp("");
    setFc("");
    setFr("");
    setUrgencia("normal");
    setRazonUrgencia("");
    setSintomas("");
    setObservaciones("");
    setSelectedAtencion(a);
  };

  const handleSubmit = async () => {
    if (!selectedAtencion) return;
    if (
      (urgencia === "urgente" || urgencia === "emergencia") &&
      !razonUrgencia.trim()
    ) {
      toast.error("Debe indicar la razón de urgencia");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/triaje", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_atencion: selectedAtencion.id_atencion,
          id_mascota: selectedAtencion.id_mascota,
          peso: peso ? parseFloat(peso) : undefined,
          temperatura: temp ? parseFloat(temp) : undefined,
          frecuencia_cardiaca: fc ? parseInt(fc) : undefined,
          frecuencia_respiratoria: fr ? parseInt(fr) : undefined,
          nivel_urgencia: urgencia,
          razon_urgencia: razonUrgencia || undefined,
          sintomas_reportados: sintomas || undefined,
          observaciones_iniciales: observaciones || undefined,
          estado: "completado",
        }),
      });
      if (res.ok) {
        toast.success("Triaje registrado correctamente");
        setSelectedAtencion(null);
        fetchData();
      } else {
        const json = await res.json();
        toast.error(json.error ?? "Error al registrar triaje");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const especie = selectedAtencion?.mascotas?.especie?.toLowerCase() ?? "perro";
  const rangos = getRango(especie);

  // IDs de atenciones que ya tienen triaje registrado
  const atencionesConTriaje = new Set(triajes.map((t) => t.id_atencion));

  // Mostrar atenciones en espera/triaje que AÚN no tienen triaje registrado
  const atencionesEnEspera = atenciones.filter(
    (a) =>
      (a.estado_actual === "espera" || a.estado_actual === "triaje") &&
      !atencionesConTriaje.has(a.id_atencion),
  );

  const canAccess = user?.rol !== "cliente";

  if (!canAccess) {
    return (
      <div
        style={{
          padding: 32,
          color: "#6b7280",
          fontFamily: "var(--font-dm-sans)",
        }}
      >
        Sin acceso
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "#111827",
              fontFamily: "var(--font-dm-sans)",
              letterSpacing: "-0.02em",
            }}
          >
            Módulo de Triaje
          </h1>
          <p
            style={{
              margin: "3px 0 0",
              fontSize: "0.82rem",
              color: "#6b7280",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            Evaluación preliminar de signos vitales
          </p>
        </div>
        <button
          onClick={fetchData}
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
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[
          {
            label: "En espera",
            value: atencionesEnEspera.filter(
              (a) => a.estado_actual === "espera",
            ).length,
            color: "#d97706",
            bg: "rgba(217,119,6,0.1)",
          },
          {
            label: "En triaje",
            value: atencionesEnEspera.filter(
              (a) => a.estado_actual === "triaje",
            ).length,
            color: "#7c3aed",
            bg: "rgba(124,58,237,0.1)",
          },
          {
            label: "Urgentes",
            value: atencionesEnEspera.filter((a) => a.prioridad === "urgente")
              .length,
            color: "#dc2626",
            bg: "rgba(220,38,38,0.1)",
          },
          {
            label: "Triajes hoy",
            value: triajes.length,
            color: "#15803d",
            bg: "rgba(21,128,61,0.1)",
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              background: s.bg,
              border: `1px solid ${s.color}30`,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <span
              style={{
                fontSize: "1.4rem",
                fontWeight: 800,
                color: s.color,
                fontFamily: "var(--font-dm-sans)",
                lineHeight: 1,
              }}
            >
              {s.value}
            </span>
            <span
              style={{
                fontSize: "0.72rem",
                color: s.color,
                fontFamily: "var(--font-dm-sans)",
                opacity: 0.8,
              }}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Tabla de atenciones en espera */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <Activity size={16} style={{ color: "#3d845b" }} />
          <h2
            style={{
              margin: 0,
              fontSize: "1rem",
              fontWeight: 700,
              color: "#111827",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            Atenciones en espera
          </h2>
          <span
            style={{
              background: "rgba(61,132,91,0.1)",
              color: "#3d845b",
              borderRadius: "99px",
              padding: "2px 10px",
              fontSize: "0.72rem",
              fontWeight: 700,
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            {atencionesEnEspera.length}
          </span>
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
                padding: "32px",
                textAlign: "center",
                color: "#9ca3af",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "0.82rem",
              }}
            >
              Cargando…
            </div>
          ) : atencionesEnEspera.length === 0 ? (
            <div
              style={{
                padding: "48px 24px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "#f0fdf4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Shield size={22} style={{ color: "#3d845b" }} />
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.88rem",
                  color: "#6b7280",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                No hay atenciones en espera en este momento
              </p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {[
                    "Mascota",
                    "Veterinario",
                    "Hora llegada",
                    "Estado",
                    "Prioridad",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 16px",
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
                {atencionesEnEspera.map((a) => (
                  <AtencionRow
                    key={a.id_atencion}
                    atencion={a}
                    onIniciarTriaje={openModal}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Triajes del día */}
      {triajes.length > 0 && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
            }}
          >
            <Stethoscope size={16} style={{ color: "#3d845b" }} />
            <h2
              style={{
                margin: 0,
                fontSize: "1rem",
                fontWeight: 700,
                color: "#111827",
                fontFamily: "var(--font-dm-sans)",
              }}
            >
              Triajes registrados hoy
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 14,
            }}
          >
            {triajes.map((t) => (
              <TriajeCard key={t.id_triaje} triaje={t} />
            ))}
          </div>
        </div>
      )}

      {/* Modal de formulario de triaje */}
      <Modal
        open={!!selectedAtencion}
        onClose={() => setSelectedAtencion(null)}
        title={`Triaje — ${selectedAtencion?.mascotas?.nombre ?? "Mascota"}`}
        className="max-w-2xl"
      >
        {selectedAtencion && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Info mascota */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                border: "1px solid #bbf7d0",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #3d845b, #2d6446)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>
                  {ESPECIE_EMOJI[especie] ?? "🐾"}
                </span>
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 700,
                    color: "#111827",
                    fontFamily: "var(--font-dm-sans)",
                  }}
                >
                  {selectedAtencion.mascotas?.nombre}
                </p>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: "0.72rem",
                    color: "#15803d",
                    fontFamily: "var(--font-dm-sans)",
                    textTransform: "capitalize",
                  }}
                >
                  {especie} ·{" "}
                  {selectedAtencion.mascotas?.clientes?.usuarios
                    ? `${selectedAtencion.mascotas.clientes.usuarios.nombre} ${selectedAtencion.mascotas.clientes.usuarios.apellido}`
                    : ""}
                </p>
              </div>
              {selectedAtencion.prioridad === "urgente" && (
                <UrgenciaBadge nivel="urgente" />
              )}
            </div>

            {/* Signos vitales */}
            <div>
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "#374151",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                Signos Vitales
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                }}
              >
                <VitalField
                  icon={Weight}
                  label="Peso"
                  unit="kg"
                  value={peso}
                  onChange={setPeso}
                  placeholder="Ej: 8.5"
                />
                <VitalField
                  icon={Thermometer}
                  label="Temperatura"
                  unit="°C"
                  value={temp}
                  onChange={setTemp}
                  min={rangos.temp[0]}
                  max={rangos.temp[1]}
                />
                <VitalField
                  icon={Heart}
                  label="Frec. Cardíaca"
                  unit="lat/min"
                  value={fc}
                  onChange={setFc}
                  min={rangos.fc[0]}
                  max={rangos.fc[1]}
                />
                <VitalField
                  icon={Wind}
                  label="Frec. Respiratoria"
                  unit="resp/min"
                  value={fr}
                  onChange={setFr}
                  min={rangos.fr[0]}
                  max={rangos.fr[1]}
                />
              </div>
            </div>

            {/* Nivel urgencia */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                Nivel de urgencia
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                {(["normal", "urgente", "emergencia"] as NivelUrgencia[]).map(
                  (n) => {
                    const m = URGENCIA_META[n];
                    const Icon = m.icon;
                    const selected = urgencia === n;
                    return (
                      <button
                        key={n}
                        onClick={() => setUrgencia(n)}
                        style={{
                          flex: 1,
                          padding: "10px 8px",
                          borderRadius: 8,
                          cursor: "pointer",
                          border: selected
                            ? `2px solid ${m.color}`
                            : "2px solid #e5e7eb",
                          background: selected ? m.bg : "#fff",
                          color: selected ? m.color : "#6b7280",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          fontSize: "0.78rem",
                          fontWeight: selected ? 700 : 500,
                          fontFamily: "var(--font-dm-sans)",
                          transition: "all 0.15s",
                        }}
                      >
                        <Icon size={13} />
                        {m.label}
                      </button>
                    );
                  },
                )}
              </div>
              {(urgencia === "urgente" || urgencia === "emergencia") && (
                <textarea
                  value={razonUrgencia}
                  onChange={(e) => setRazonUrgencia(e.target.value)}
                  placeholder="Describa la razón de urgencia o emergencia…"
                  rows={2}
                  style={{
                    border: "1.5px solid #fca5a5",
                    borderRadius: 8,
                    padding: "9px 12px",
                    fontSize: "0.82rem",
                    fontFamily: "var(--font-dm-sans)",
                    color: "#111827",
                    resize: "vertical",
                    outline: "none",
                    background: "rgba(254,242,242,0.5)",
                  }}
                />
              )}
            </div>

            {/* Síntomas */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
                Síntomas reportados
              </label>
              <textarea
                value={sintomas}
                onChange={(e) => setSintomas(e.target.value)}
                placeholder="Ej: Letargo, pérdida de apetito, vómitos…"
                rows={2}
                style={{
                  border: "1.5px solid #d1d5db",
                  borderRadius: 8,
                  padding: "9px 12px",
                  fontSize: "0.82rem",
                  fontFamily: "var(--font-dm-sans)",
                  color: "#111827",
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

            {/* Observaciones */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
                Observaciones iniciales
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Anotaciones adicionales para el veterinario…"
                rows={2}
                style={{
                  border: "1.5px solid #d1d5db",
                  borderRadius: 8,
                  padding: "9px 12px",
                  fontSize: "0.82rem",
                  fontFamily: "var(--font-dm-sans)",
                  color: "#111827",
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

            {/* Acciones */}
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                borderTop: "1px solid #f3f4f6",
                paddingTop: 16,
                marginTop: 2,
                position: "sticky",
                bottom: 0,
                background: "#fff",
                paddingBottom: 4,
              }}
            >
              <button
                onClick={() => setSelectedAtencion(null)}
                style={{
                  padding: "9px 18px",
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
              <Button loading={submitting} onClick={handleSubmit}>
                <CheckCircle2 size={14} />
                Registrar triaje
                <ChevronRight size={13} />
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
