"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Clock,
  DollarSign,
  Layers,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/context/toast";
import { useAuth } from "@/hooks/useAuth";
import type { ServicioMedico, Especialidad, Recurso } from "@/types";

export default function ServiciosMedicosPage() {
  const [servicios, setServicios]           = useState<ServicioMedico[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [recursos, setRecursos]             = useState<Recurso[]>([]);
  const [loading, setLoading]               = useState(true);
  const [filterEsp, setFilterEsp]           = useState("");

  const [modalOpen, setModalOpen]  = useState(false);
  const [editItem, setEditItem]    = useState<ServicioMedico | null>(null);

  // Form
  const [fNombre,   setFNombre]   = useState("");
  const [fEsp,      setFEsp]      = useState("");
  const [fRecurso,  setFRecurso]  = useState("");
  const [fDesc,     setFDesc]     = useState("");
  const [fDuracion, setFDuracion] = useState("30");
  const [fPrecio,   setFPrecio]   = useState("");
  const [saving,    setSaving]    = useState(false);

  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.rol === "administrador";

  useEffect(() => {
    Promise.all([
      fetch("/api/servicios-medicos").then((r) => r.json()),
      fetch("/api/especialidades").then((r) => r.json()),
      fetch("/api/recursos").then((r) => r.json()),
    ])
      .then(([jsonS, jsonE, jsonR]) => {
        setServicios(jsonS.data ?? []);
        setEspecialidades(jsonE.data ?? []);
        setRecursos((jsonR.data ?? []).filter((r: Recurso) => r.activo));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/servicios-medicos").then((r) => r.json()),
      fetch("/api/especialidades").then((r) => r.json()),
      fetch("/api/recursos").then((r) => r.json()),
    ])
      .then(([jsonS, jsonE, jsonR]) => {
        setServicios(jsonS.data ?? []);
        setEspecialidades(jsonE.data ?? []);
        setRecursos((jsonR.data ?? []).filter((r: Recurso) => r.activo));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const openCreate = () => {
    setEditItem(null);
    setFNombre(""); setFEsp(""); setFRecurso(""); setFDesc(""); setFDuracion("30"); setFPrecio("");
    setModalOpen(true);
  };

  const openEdit = (s: ServicioMedico) => {
    setEditItem(s);
    setFNombre(s.nombre);
    setFEsp(s.id_especialidad?.toString() ?? "");
    setFRecurso(s.id_recurso_requerido?.toString() ?? "");
    setFDesc(s.descripcion ?? "");
    setFDuracion(s.duracion_estimada_min.toString());
    setFPrecio(s.precio_base?.toString() ?? "");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!fNombre.trim()) { toast.error("El nombre es requerido"); return; }
    setSaving(true);
    try {
      const body = {
        nombre:               fNombre.trim(),
        id_especialidad:      fEsp     ? Number(fEsp)     : null,
        id_recurso_requerido: fRecurso ? Number(fRecurso) : null,
        descripcion:          fDesc.trim() || undefined,
        duracion_estimada_min: parseInt(fDuracion) || 30,
        precio_base:          fPrecio ? parseFloat(fPrecio) : undefined,
      };
      const url = editItem
        ? `/api/servicios-medicos/${editItem.id_servicio}`
        : "/api/servicios-medicos";
      const method = editItem ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(editItem ? "Servicio actualizado" : "Servicio creado");
        setModalOpen(false);
        fetchData();
      } else {
        const json = await res.json();
        toast.error(json.error ?? "Error al guardar");
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleActivo = async (s: ServicioMedico) => {
    const res = await fetch(`/api/servicios-medicos/${s.id_servicio}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ es_activo: !s.es_activo }),
    });
    if (res.ok) {
      toast.success(s.es_activo ? "Servicio desactivado" : "Servicio activado");
      fetchData();
    }
  };

  const displayed = filterEsp
    ? servicios.filter((s) => s.id_especialidad?.toString() === filterEsp)
    : servicios;

  const inputStyle: React.CSSProperties = {
    border: "1.5px solid #d1d5db",
    borderRadius: 8,
    padding: "9px 12px",
    fontSize: "0.85rem",
    fontFamily: "var(--font-dm-sans)",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
            Servicios Médicos
          </h1>
          <p
            className="text-sm text-gray-500 mt-0.5"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            Catálogo de procedimientos y consultas
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Nuevo servicio
          </Button>
        )}
      </div>

      {/* Filtro */}
      <div className="flex items-center gap-3 flex-wrap">
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Layers size={14} style={{ color: "#9ca3af" }} />
          <select
            value={filterEsp}
            onChange={(e) => setFilterEsp(e.target.value)}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 8,
              padding: "6px 10px",
              fontSize: "0.8rem",
              fontFamily: "var(--font-dm-sans)",
              color: "#374151",
              background: "#fff",
            }}
          >
            <option value="">Todas las especialidades</option>
            {especialidades.map((e) => (
              <option key={e.id_especialidad} value={e.id_especialidad}>
                {e.nombre}
              </option>
            ))}
          </select>
        </div>
        <span
          style={{
            fontSize: "0.78rem",
            color: "#9ca3af",
            fontFamily: "var(--font-dm-sans)",
          }}
        >
          {displayed.length} servicio{displayed.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 14,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 130,
                borderRadius: 12,
                background: "linear-gradient(90deg,#f3f4f6,#e5e7eb,#f3f4f6)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s infinite",
              }}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 14,
          }}
        >
          {displayed.map((s) => (
            <div
              key={s.id_servicio}
              style={{
                background: "#fff",
                border: `1px solid ${s.es_activo ? "#e8f0eb" : "#e5e7eb"}`,
                borderRadius: 12,
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                opacity: s.es_activo ? 1 : 0.6,
                transition: "opacity 0.2s, box-shadow 0.15s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      color: "#111827",
                      fontFamily: "var(--font-dm-sans)",
                    }}
                  >
                    {s.nombre}
                  </p>
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:4 }}>
                    {s.especialidad && (
                      <span style={{ display:"inline-block", padding:"2px 8px", borderRadius:99, background:"rgba(61,132,91,0.1)", color:"#15803d", fontSize:"0.68rem", fontWeight:600, fontFamily:"var(--font-dm-sans)" }}>
                        {s.especialidad.nombre}
                      </span>
                    )}
                    {s.recurso && (
                      <span style={{ display:"inline-flex", alignItems:"center", gap:3, padding:"2px 8px", borderRadius:99, background:"rgba(124,58,237,0.08)", color:"#7c3aed", fontSize:"0.68rem", fontWeight:600, fontFamily:"var(--font-dm-sans)", border:"1px solid rgba(124,58,237,0.2)" }}>
                        🏥 {s.recurso.nombre}
                      </span>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <button
                      onClick={() => openEdit(s)}
                      title="Editar"
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => toggleActivo(s)}
                      title={s.es_activo ? "Desactivar" : "Activar"}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                    >
                      {s.es_activo ? (
                        <ToggleRight className="size-5" />
                      ) : (
                        <ToggleLeft className="size-5" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {s.descripcion && (
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.78rem",
                    color: "#6b7280",
                    fontFamily: "var(--font-dm-sans)",
                    lineHeight: 1.5,
                  }}
                >
                  {s.descripcion}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  gap: 16,
                  paddingTop: 8,
                  borderTop: "1px solid #f3f4f6",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: "0.78rem",
                    color: "#6b7280",
                    fontFamily: "var(--font-dm-sans)",
                  }}
                >
                  <Clock size={12} style={{ color: "#9ca3af" }} />
                  {s.duracion_estimada_min} min
                </div>
                {s.precio_base != null && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: "0.78rem",
                      color: "#374151",
                      fontWeight: 600,
                      fontFamily: "var(--font-dm-sans)",
                    }}
                  >
                    <DollarSign size={12} style={{ color: "#9ca3af" }} />
                    S/ {s.precio_base.toFixed(2)}
                  </div>
                )}
                {!s.es_activo && (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      color: "#9ca3af",
                      fontFamily: "var(--font-dm-sans)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Inactivo
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? "Editar servicio" : "Nuevo servicio"}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
              Nombre *
            </label>
            <input
              value={fNombre}
              onChange={(e) => setFNombre(e.target.value)}
              placeholder="Ej: Consulta General"
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#3d845b";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#d1d5db";
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize:"0.72rem", fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:"var(--font-dm-sans)" }}>
              Especialidad
            </label>
            <select value={fEsp} onChange={e => setFEsp(e.target.value)} style={inputStyle}>
              <option value="">Sin especialidad</option>
              {especialidades.filter(e => e.es_activa).map(e => (
                <option key={e.id_especialidad} value={e.id_especialidad}>{e.nombre}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize:"0.72rem", fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:"var(--font-dm-sans)" }}>
              Recurso requerido
            </label>
            <select value={fRecurso} onChange={e => setFRecurso(e.target.value)} style={inputStyle}>
              <option value="">Sin recurso específico</option>
              {recursos.map(r => (
                <option key={r.id_recurso} value={r.id_recurso}>
                  {r.nombre} ({r.tipo_recurso === "consultorio" ? "Consultorio" : r.tipo_recurso === "quirofano" ? "Quirófano" : r.tipo_recurso === "equipo" ? "Equipo" : "Hospitalización"})
                </option>
              ))}
            </select>
            {fRecurso && (
              <p style={{ margin:0, fontSize:"0.72rem", color:"#7c3aed", fontFamily:"var(--font-dm-sans)" }}>
                ⚠️ Al agendar este servicio, el sistema verificará disponibilidad del recurso seleccionado.
              </p>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              style={{ fontSize: "0.72rem", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-dm-sans)" }}
            >
              Descripción
            </label>
            <textarea
              value={fDesc}
              onChange={(e) => setFDesc(e.target.value)}
              placeholder="Descripción del servicio…"
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#3d845b";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#d1d5db";
              }}
            />
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
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
                Duración (min)
              </label>
              <input
                type="number"
                value={fDuracion}
                onChange={(e) => setFDuracion(e.target.value)}
                min={5}
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#3d845b";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#d1d5db";
                }}
              />
            </div>
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
                Precio base (S/)
              </label>
              <input
                type="number"
                value={fPrecio}
                onChange={(e) => setFPrecio(e.target.value)}
                placeholder="0.00"
                min={0}
                step={0.01}
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#3d845b";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#d1d5db";
                }}
              />
            </div>
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
              Guardar
            </Button>
          </div>
        </div>
      </Modal>

      <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>
    </div>
  );
}
