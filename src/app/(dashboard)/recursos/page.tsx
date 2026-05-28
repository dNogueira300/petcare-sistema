"use client";

import { useEffect, useState } from "react";
import {
  Plus, Pencil, Building2, Scissors, Cpu, Grid3x3,
  ToggleLeft, ToggleRight, Stethoscope, Clock,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/context/toast";
import { useAuth } from "@/hooks/useAuth";
import type { Recurso, TipoRecurso, ServicioMedico } from "@/types";

const TIPO_META: Record<TipoRecurso, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  consultorio:           { label: "Consultorio",           icon: Building2, color: "#2563eb", bg: "rgba(37,99,235,0.1)" },
  quirofano:             { label: "Quirófano",             icon: Scissors,  color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
  equipo:                { label: "Equipo",                icon: Cpu,       color: "#0369a1", bg: "rgba(3,105,161,0.1)" },
  jaula_hospitalizacion: { label: "Jaula/Hospitalización", icon: Grid3x3,   color: "#b45309", bg: "rgba(180,83,9,0.1)" },
};

type RecursoRow = Recurso; // sin recurso_disponibilidad

export default function RecursosPage() {
  const [recursos,   setRecursos]   = useState<RecursoRow[]>([]);
  const [servicios,  setServicios]  = useState<ServicioMedico[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editItem,   setEditItem]   = useState<RecursoRow | null>(null);

  const [fNombre,    setFNombre]    = useState("");
  const [fTipo,      setFTipo]      = useState<TipoRecurso>("consultorio");
  const [fDesc,      setFDesc]      = useState("");
  const [fCapacidad, setFCapacidad] = useState("1");
  const [fUbicacion, setFUbicacion] = useState("");
  const [saving,     setSaving]     = useState(false);

  const { user } = useAuth();
  const toast    = useToast();
  const isAdmin  = user?.rol === "administrador";

  useEffect(() => {
    Promise.all([
      fetch("/api/recursos").then(r => r.json()),
      fetch("/api/servicios-medicos").then(r => r.json()),
    ]).then(([jsonR, jsonS]) => {
      setRecursos(jsonR.data ?? []);
      setServicios(jsonS.data ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const reload = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/recursos").then(r => r.json()),
      fetch("/api/servicios-medicos").then(r => r.json()),
    ]).then(([jsonR, jsonS]) => {
      setRecursos(jsonR.data ?? []);
      setServicios(jsonS.data ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const openCreate = () => {
    setEditItem(null);
    setFNombre(""); setFTipo("consultorio"); setFDesc(""); setFCapacidad("1"); setFUbicacion("");
    setModalOpen(true);
  };
  const openEdit = (r: RecursoRow) => {
    setEditItem(r);
    setFNombre(r.nombre); setFTipo(r.tipo_recurso); setFDesc(r.descripcion ?? "");
    setFCapacidad(String(r.capacidad)); setFUbicacion(r.ubicacion ?? "");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!fNombre.trim()) { toast.error("El nombre es requerido"); return; }
    setSaving(true);
    const body = {
      nombre: fNombre.trim(), tipo_recurso: fTipo,
      descripcion: fDesc || undefined, capacidad: Number(fCapacidad) || 1,
      ubicacion: fUbicacion || undefined,
    };
    const url    = editItem ? `/api/recursos/${editItem.id_recurso}` : "/api/recursos";
    const method = editItem ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) { toast.success(editItem ? "Recurso actualizado" : "Recurso creado"); setModalOpen(false); reload(); }
    else { const j = await res.json(); toast.error(j.error ?? "Error al guardar"); }
  };

  const toggleActivo = async (r: RecursoRow) => {
    const res = await fetch(`/api/recursos/${r.id_recurso}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !r.activo }),
    });
    if (res.ok) { toast.success(r.activo ? "Recurso desactivado" : "Recurso activado"); reload(); }
  };

  // Servicios que requieren este recurso
  const serviciosDeRecurso = (id: number): ServicioMedico[] =>
    servicios.filter(s => s.id_recurso_requerido === id && s.es_activo);

  const inputStyle: React.CSSProperties = {
    border: "1.5px solid #d1d5db", borderRadius: 8, padding: "9px 12px",
    fontSize: "0.85rem", fontFamily: "var(--font-dm-sans)", outline: "none",
    width: "100%", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: "0.72rem", fontWeight: 700, color: "#374151",
    textTransform: "uppercase", letterSpacing: "0.06em",
    fontFamily: "var(--font-dm-sans)", display: "block", marginBottom: "5px",
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily:"var(--font-dm-sans)", letterSpacing:"-0.02em" }}>
            Recursos Clínicos
          </h1>
          <p className="text-sm text-gray-500 mt-0.5" style={{ fontFamily:"var(--font-dm-sans)" }}>
            Consultorios, quirófanos y equipos disponibles
          </p>
        </div>
        {isAdmin && <Button onClick={openCreate}><Plus className="size-4" />Nuevo recurso</Button>}
      </div>

      {/* Grid 2 columnas */}
      {loading ? (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:16 }}>
          {Array.from({length:6}).map((_,i) => (
            <div key={i} style={{ height:160, borderRadius:14, background:"linear-gradient(90deg,#f3f4f6,#e5e7eb,#f3f4f6)", backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite" }} />
          ))}
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
          {recursos.map(r => {
            const meta    = TIPO_META[r.tipo_recurso];
            const Icon    = meta.icon;
            const vinculados = serviciosDeRecurso(r.id_recurso);
            return (
              <div key={r.id_recurso} style={{
                background: "#fff",
                border: `1px solid ${r.activo ? "#e8f0eb" : "#e5e7eb"}`,
                borderRadius: 14, padding: "18px 20px",
                display: "flex", flexDirection: "column", gap: 12,
                opacity: r.activo ? 1 : 0.6,
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              }}>

                {/* Header card */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:meta.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Icon size={20} style={{ color:meta.color }} />
                    </div>
                    <div>
                      <p style={{ margin:0, fontWeight:700, fontSize:"0.92rem", color:"#111827", fontFamily:"var(--font-dm-sans)" }}>{r.nombre}</p>
                      <span style={{ display:"inline-flex", alignItems:"center", gap:4, marginTop:2, fontSize:"0.68rem", fontWeight:600, color:meta.color, background:meta.bg, padding:"2px 8px", borderRadius:99, fontFamily:"var(--font-dm-sans)" }}>
                        {meta.label}
                      </span>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:4, flexShrink:0, alignItems:"center" }}>
                    {isAdmin && (
                      <button onClick={() => openEdit(r)} title="Editar" className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <Pencil className="size-4" />
                      </button>
                    )}
                    {isAdmin && (
                      <button onClick={() => toggleActivo(r)} title={r.activo ? "Desactivar" : "Activar"}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition-colors">
                        {r.activo ? <ToggleRight className="size-6" /> : <ToggleLeft className="size-6" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {r.ubicacion && (
                    <span style={{ fontSize:"0.75rem", color:"#6b7280", fontFamily:"var(--font-dm-sans)" }}>
                      📍 {r.ubicacion}
                    </span>
                  )}
                  {r.capacidad > 1 && (
                    <span style={{ fontSize:"0.75rem", color:"#6b7280", fontFamily:"var(--font-dm-sans)" }}>
                      · Capacidad: {r.capacidad}
                    </span>
                  )}
                  {!r.activo && (
                    <span style={{ fontSize:"0.65rem", fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:"var(--font-dm-sans)" }}>
                      Inactivo
                    </span>
                  )}
                </div>

                {r.descripcion && (
                  <p style={{ margin:0, fontSize:"0.78rem", color:"#6b7280", fontFamily:"var(--font-dm-sans)", lineHeight:1.5 }}>
                    {r.descripcion}
                  </p>
                )}

                {/* Servicios vinculados */}
                <div style={{ paddingTop:10, borderTop:"1px solid #f3f4f6" }}>
                  <p style={{ margin:"0 0 6px", fontSize:"0.68rem", fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.07em", fontFamily:"var(--font-dm-sans)", display:"flex", alignItems:"center", gap:5 }}>
                    <Stethoscope size={11} /> Servicios que lo requieren
                  </p>
                  {vinculados.length === 0 ? (
                    <p style={{ margin:0, fontSize:"0.75rem", color:"#d1d5db", fontFamily:"var(--font-dm-sans)", fontStyle:"italic" }}>
                      Ningún servicio lo requiere aún
                    </p>
                  ) : (
                    <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                      {vinculados.map(s => (
                        <span key={s.id_servicio} style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 9px", borderRadius:99, background:"rgba(61,132,91,0.08)", color:"#15803d", fontSize:"0.72rem", fontWeight:600, fontFamily:"var(--font-dm-sans)" }}>
                          <Clock size={9} />
                          {s.nombre}
                          {s.duracion_estimada_min ? ` (${s.duracion_estimada_min}min)` : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear/Editar */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editItem ? "Editar recurso" : "Nuevo recurso"}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <label style={labelStyle}>Nombre *</label>
            <input value={fNombre} onChange={e => setFNombre(e.target.value)} placeholder="Ej: Consultorio 3" style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = "#3d845b"; }}
              onBlur={e  => { e.currentTarget.style.borderColor = "#d1d5db"; }} />
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              <label style={labelStyle}>Tipo *</label>
              <select value={fTipo} onChange={e => setFTipo(e.target.value as TipoRecurso)} style={inputStyle}>
                {(Object.keys(TIPO_META) as TipoRecurso[]).map(t => (
                  <option key={t} value={t}>{TIPO_META[t].label}</option>
                ))}
              </select>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              <label style={labelStyle}>Capacidad</label>
              <input type="number" value={fCapacidad} onChange={e => setFCapacidad(e.target.value)} min={1} style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = "#3d845b"; }}
                onBlur={e  => { e.currentTarget.style.borderColor = "#d1d5db"; }} />
            </div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <label style={labelStyle}>Ubicación</label>
            <input value={fUbicacion} onChange={e => setFUbicacion(e.target.value)} placeholder="Ej: Piso 1, ala norte" style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = "#3d845b"; }}
              onBlur={e  => { e.currentTarget.style.borderColor = "#d1d5db"; }} />
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <label style={labelStyle}>Descripción</label>
            <textarea value={fDesc} onChange={e => setFDesc(e.target.value)} rows={2}
              style={{ ...inputStyle, resize:"vertical" }}
              onFocus={e => { e.currentTarget.style.borderColor = "#3d845b"; }}
              onBlur={e  => { e.currentTarget.style.borderColor = "#d1d5db"; }} />
          </div>

          <p style={{ margin:0, fontSize:"0.75rem", color:"#9ca3af", fontFamily:"var(--font-dm-sans)" }}>
            Para vincular un recurso a un servicio, edita el servicio desde <strong>Servicios Médicos</strong> y selecciona este recurso en el campo "Recurso requerido".
          </p>

          <div style={{ display:"flex", gap:8, justifyContent:"flex-end", paddingTop:8, paddingBottom:4, borderTop:"1px solid #f3f4f6", position:"sticky", bottom:0, background:"#fff" }}>
            <button onClick={() => setModalOpen(false)}
              style={{ padding:"8px 16px", borderRadius:8, border:"1px solid #e5e7eb", background:"#fff", color:"#374151", fontSize:"0.82rem", fontWeight:600, fontFamily:"var(--font-dm-sans)", cursor:"pointer" }}>
              Cancelar
            </button>
            <Button loading={saving} onClick={handleSave}>Guardar</Button>
          </div>
        </div>
      </Modal>

      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
    </div>
  );
}
