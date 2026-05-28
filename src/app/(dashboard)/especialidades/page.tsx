"use client";

import { useEffect, useState } from "react";
import {
  Plus, Pencil, Trash2, Award, ChevronRight, Check, X, UserCheck, AlertTriangle,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/context/toast";
import { useAuth } from "@/hooks/useAuth";
import type { Especialidad, VeterinarioEspecialidad } from "@/types";

interface EspRow extends Especialidad {
  veterinario_especialidad?: { count: number }[];
}

// usuarios es plural (Supabase join) · veterinario_especialidad incluye especialidades anidadas
interface VetRow {
  id_veterinario: number;
  id_usuario: number;
  especialidad: string | null;
  horario_inicio: string;
  horario_fin: string;
  usuarios?: { nombre: string; apellido: string };
  veterinario_especialidad?: { especialidades: { nombre: string } | null }[];
}

function vetNombre(v: VetRow): string {
  return v.usuarios
    ? `${v.usuarios.nombre} ${v.usuarios.apellido}`
    : `Vet #${v.id_veterinario}`;
}

export default function EspecialidadesPage() {
  const [especialidades, setEspecialidades] = useState<EspRow[]>([]);
  const [veterinarios, setVeterinarios]     = useState<VetRow[]>([]);
  const [loading, setLoading]               = useState(true);

  // Modal crear/editar
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem]     = useState<EspRow | null>(null);
  const [nombre, setNombre]         = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [saving, setSaving]         = useState(false);

  // Modal confirmación eliminar
  const [deleteTarget, setDeleteTarget] = useState<EspRow | null>(null);
  const [deleting, setDeleting]         = useState(false);

  // Modal asignación vet ↔ especialidades
  const [vetModal, setVetModal]   = useState<VetRow | null>(null);
  const [vetEsps, setVetEsps]     = useState<VeterinarioEspecialidad[]>([]);
  const [assigning, setAssigning] = useState(false);

  const { user } = useAuth();
  const toast    = useToast();
  const isAdmin  = user?.rol === "administrador";

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/especialidades").then(r => r.json()),
      fetch("/api/veterinarios").then(r => r.json()),
    ]).then(([jsonE, jsonV]) => {
      setEspecialidades(jsonE.data ?? []);
      setVeterinarios(jsonV.data ?? []);
      setLoading(false);
    }).catch(() => { toast.error("Error al cargar datos"); setLoading(false); });
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/especialidades").then(r => r.json()),
      fetch("/api/veterinarios").then(r => r.json()),
    ]).then(([jsonE, jsonV]) => {
      setEspecialidades(jsonE.data ?? []);
      setVeterinarios(jsonV.data ?? []);
      setLoading(false);
    }).catch(() => { toast.error("Error al cargar datos"); setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Crear / Editar especialidad ───────────────────────────────────────────
  const openCreate = () => { setNombre(""); setDescripcion(""); setCreateOpen(true); };
  const openEdit   = (e: EspRow) => { setNombre(e.nombre); setDescripcion(e.descripcion ?? ""); setEditItem(e); };

  const handleSave = async () => {
    if (!nombre.trim()) { toast.error("El nombre es requerido"); return; }
    setSaving(true);
    try {
      const url    = editItem ? `/api/especialidades/${editItem.id_especialidad}` : "/api/especialidades";
      const method = editItem ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim(), descripcion: descripcion.trim() || undefined }),
      });
      if (res.ok) {
        toast.success(editItem ? "Especialidad actualizada" : "Especialidad creada");
        setCreateOpen(false); setEditItem(null);
        fetchData();
      } else {
        const json = await res.json();
        toast.error(json.error ?? "Error al guardar");
      }
    } finally { setSaving(false); }
  };

  // ── Eliminar especialidad (con modal de confirmación) ─────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/especialidades/${deleteTarget.id_especialidad}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Especialidad eliminada");
        setDeleteTarget(null);
        fetchData();
      } else {
        const j = await res.json();
        toast.error(j.error ?? "Error al eliminar");
      }
    } finally { setDeleting(false); }
  };

  // ── Asignar / Remover especialidad al veterinario ─────────────────────────
  const openVetModal = async (vet: VetRow) => {
    setVetModal(vet);
    const res  = await fetch(`/api/veterinarios/${vet.id_veterinario}/especialidades`);
    const json = await res.json();
    setVetEsps(json.data ?? []);
  };

  const assignEsp = async (id_especialidad: number) => {
    if (!vetModal) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/veterinarios/${vetModal.id_veterinario}/especialidades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_especialidad, es_especialidad_primaria: false }),
      });
      if (res.ok) {
        const json = await res.json();
        setVetEsps(prev => [...prev, json.data]);
        toast.success("Especialidad asignada");
        fetchData(); // refresca los cards de veterinarios
      } else {
        const json = await res.json();
        toast.error(json.error ?? "Error al asignar");
      }
    } finally { setAssigning(false); }
  };

  const removeEsp = async (id_especialidad: number) => {
    if (!vetModal) return;
    setAssigning(true);
    try {
      const res = await fetch(
        `/api/veterinarios/${vetModal.id_veterinario}/especialidades?id_especialidad=${id_especialidad}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setVetEsps(prev => prev.filter(e => e.id_especialidad !== id_especialidad));
        toast.success("Especialidad removida");
        fetchData();
      } else {
        const j = await res.json();
        toast.error(j.error ?? "Error al remover");
      }
    } finally { setAssigning(false); }
  };

  const vetHasEsp = (id_esp: number) => vetEsps.some(e => e.id_especialidad === id_esp);

  const labelS: React.CSSProperties = {
    fontSize: "0.72rem", fontWeight: 700, color: "#374151",
    textTransform: "uppercase", letterSpacing: "0.06em",
    fontFamily: "var(--font-dm-sans)", display: "block", marginBottom: "5px",
  };
  const inputS: React.CSSProperties = {
    border: "1.5px solid #d1d5db", borderRadius: 8, padding: "9px 12px",
    fontSize: "0.88rem", fontFamily: "var(--font-dm-sans)", outline: "none", width: "100%", boxSizing: "border-box",
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily:"var(--font-dm-sans)", letterSpacing:"-0.02em" }}>
            Especialidades Médicas
          </h1>
          <p className="text-sm text-gray-500 mt-0.5" style={{ fontFamily:"var(--font-dm-sans)" }}>
            Catálogo y asignación a veterinarios
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate}><Plus className="size-4" />Nueva especialidad</Button>
        )}
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 1fr" }}>

        {/* ── Catálogo ── */}
        <div>
          <h2 style={{ margin:"0 0 12px", fontSize:"0.85rem", fontWeight:700, color:"#374151", fontFamily:"var(--font-dm-sans)", textTransform:"uppercase", letterSpacing:"0.06em", display:"flex", alignItems:"center", gap:7 }}>
            <Award size={14} style={{ color:"#3d845b" }} /> Catálogo ({especialidades.length})
          </h2>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {loading ? (
              [0,1,2].map(i => <div key={i} style={{ height:64, borderRadius:10, background:"linear-gradient(90deg,#f3f4f6,#e5e7eb,#f3f4f6)", backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite" }} />)
            ) : especialidades.map(e => (
              <div key={e.id_especialidad} style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:"12px 14px", display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:36, height:36, borderRadius:8, flexShrink:0, background: e.es_activa ? "rgba(61,132,91,0.1)" : "#f3f4f6", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Award size={16} style={{ color: e.es_activa ? "#3d845b" : "#9ca3af" }} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:0, fontWeight:700, fontSize:"0.88rem", color:"#111827", fontFamily:"var(--font-dm-sans)" }}>
                    {e.nombre}
                    {!e.es_activa && <span style={{ marginLeft:8, fontSize:"0.65rem", fontWeight:600, color:"#9ca3af", textTransform:"uppercase" }}>Inactiva</span>}
                  </p>
                  {e.descripcion && <p style={{ margin:"2px 0 0", fontSize:"0.72rem", color:"#9ca3af", fontFamily:"var(--font-dm-sans)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.descripcion}</p>}
                </div>
                {isAdmin && (
                  <div style={{ display:"flex", gap:4, flexShrink:0 }}>
                    <button onClick={() => openEdit(e)} title="Editar" className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Pencil className="size-4" /></button>
                    <button onClick={() => setDeleteTarget(e)} title="Eliminar" className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 className="size-4" /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Veterinarios ── */}
        <div>
          <h2 style={{ margin:"0 0 12px", fontSize:"0.85rem", fontWeight:700, color:"#374151", fontFamily:"var(--font-dm-sans)", textTransform:"uppercase", letterSpacing:"0.06em", display:"flex", alignItems:"center", gap:7 }}>
            <UserCheck size={14} style={{ color:"#3d845b" }} /> Veterinarios
          </h2>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {loading ? (
              [0,1,2].map(i => <div key={i} style={{ height:64, borderRadius:10, background:"#f3f4f6", animation:"shimmer 1.5s infinite" }} />)
            ) : veterinarios.map(v => {
              const nombre = vetNombre(v);
              // Especialidades del vet desde la relación N:M
              const espsAsignadas = (v.veterinario_especialidad ?? [])
                .filter(ve => ve.especialidades)
                .map(ve => ve.especialidades!.nombre);
              const displayEsp = espsAsignadas.length > 0
                ? espsAsignadas.join(", ")
                : v.especialidad ?? null;

              return (
                <div key={v.id_veterinario}
                  style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:"12px 14px", display:"flex", alignItems:"center", gap:12, cursor:"pointer", transition:"border-color 0.15s" }}
                  onClick={() => openVetModal(v)}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#3d845b"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb"; }}
                >
                  <div style={{ width:36, height:36, borderRadius:"50%", flexShrink:0, background:"linear-gradient(135deg,#3d845b,#2d6446)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"0.88rem", fontWeight:700, fontFamily:"var(--font-dm-sans)" }}>
                    {nombre.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:0, fontWeight:700, fontSize:"0.88rem", color:"#111827", fontFamily:"var(--font-dm-sans)" }}>{nombre}</p>
                    {displayEsp ? (
                      <p style={{ margin:"2px 0 0", fontSize:"0.72rem", color:"#6b7280", fontFamily:"var(--font-dm-sans)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{displayEsp}</p>
                    ) : (
                      <p style={{ margin:"2px 0 0", fontSize:"0.72rem", color:"#d1d5db", fontFamily:"var(--font-dm-sans)", fontStyle:"italic" }}>Sin especialidades asignadas</p>
                    )}
                  </div>
                  <ChevronRight size={14} style={{ color:"#9ca3af", flexShrink:0 }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Modal Crear/Editar especialidad ── */}
      <Modal open={createOpen || !!editItem} onClose={() => { setCreateOpen(false); setEditItem(null); }}
        title={editItem ? "Editar especialidad" : "Nueva especialidad"}>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <label style={labelS}>Nombre *</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Cardiología" style={inputS}
              onFocus={e => { e.currentTarget.style.borderColor = "#3d845b"; }}
              onBlur={e  => { e.currentTarget.style.borderColor = "#d1d5db"; }} />
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <label style={labelS}>Descripción</label>
            <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción breve de la especialidad…" rows={3}
              style={{ ...inputS, resize:"vertical" }}
              onFocus={e => { e.currentTarget.style.borderColor = "#3d845b"; }}
              onBlur={e  => { e.currentTarget.style.borderColor = "#d1d5db"; }} />
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end", paddingTop:8, paddingBottom:4, borderTop:"1px solid #f3f4f6", marginTop:4, position:"sticky", bottom:0, background:"#fff" }}>
            <button onClick={() => { setCreateOpen(false); setEditItem(null); }}
              style={{ padding:"8px 16px", borderRadius:8, border:"1px solid #e5e7eb", background:"#fff", color:"#374151", fontSize:"0.82rem", fontWeight:600, fontFamily:"var(--font-dm-sans)", cursor:"pointer" }}>
              Cancelar
            </button>
            <Button loading={saving} onClick={handleSave}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal Confirmar Eliminación ── */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Eliminar especialidad">
        {deleteTarget && (
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:14, padding:"14px 16px", borderRadius:10, background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)" }}>
              <AlertTriangle size={20} style={{ color:"#dc2626", flexShrink:0, marginTop:1 }} />
              <div>
                <p style={{ margin:"0 0 4px", fontWeight:700, fontSize:"0.9rem", color:"#111827", fontFamily:"var(--font-dm-sans)" }}>
                  ¿Eliminar "{deleteTarget.nombre}"?
                </p>
                <p style={{ margin:0, fontSize:"0.82rem", color:"#6b7280", fontFamily:"var(--font-dm-sans)", lineHeight:1.5 }}>
                  Esta acción no se puede deshacer. Solo es posible si no hay veterinarios con esta especialidad asignada.
                </p>
              </div>
            </div>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end", paddingBottom:4, position:"sticky", bottom:0, background:"#fff" }}>
              <button onClick={() => setDeleteTarget(null)}
                style={{ padding:"8px 16px", borderRadius:8, border:"1px solid #e5e7eb", background:"#fff", color:"#374151", fontSize:"0.82rem", fontWeight:600, fontFamily:"var(--font-dm-sans)", cursor:"pointer" }}>
                Cancelar
              </button>
              <Button loading={deleting} onClick={confirmDelete}>
                <Trash2 size={13} /> Eliminar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal Asignar especialidades al veterinario ── */}
      <Modal open={!!vetModal} onClose={() => { setVetModal(null); }}
        title={vetModal ? `Especialidades — ${vetNombre(vetModal)}` : ""}
        className="max-w-lg">
        {vetModal && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <p style={{ margin:"0 0 4px", fontSize:"0.82rem", color:"#6b7280", fontFamily:"var(--font-dm-sans)" }}>
              Clic en <strong>Asignar</strong> para vincular una especialidad, o <strong>Remover</strong> para desvincularla.
            </p>
            {especialidades.filter(e => e.es_activa).map(e => {
              const tiene = vetHasEsp(e.id_especialidad);
              return (
                <div key={e.id_especialidad} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:8, border:"1px solid #e5e7eb", background: tiene ? "rgba(61,132,91,0.05)" : "#fff" }}>
                  <div style={{ flex:1 }}>
                    <p style={{ margin:0, fontWeight:600, fontSize:"0.85rem", color:"#111827", fontFamily:"var(--font-dm-sans)" }}>{e.nombre}</p>
                    {e.descripcion && <p style={{ margin:"2px 0 0", fontSize:"0.7rem", color:"#9ca3af", fontFamily:"var(--font-dm-sans)" }}>{e.descripcion}</p>}
                  </div>
                  {tiene ? (
                    <button onClick={() => removeEsp(e.id_especialidad)} disabled={assigning}
                      style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:6, border:"1px solid #fca5a5", background:"rgba(254,242,242,0.8)", color:"#dc2626", fontSize:"0.72rem", fontWeight:600, fontFamily:"var(--font-dm-sans)", cursor:"pointer" }}>
                      <X size={11} /> Remover
                    </button>
                  ) : (
                    <button onClick={() => assignEsp(e.id_especialidad)} disabled={assigning}
                      style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:6, border:"1px solid #bbf7d0", background:"rgba(240,253,244,0.8)", color:"#15803d", fontSize:"0.72rem", fontWeight:600, fontFamily:"var(--font-dm-sans)", cursor:"pointer" }}>
                      <Check size={11} /> Asignar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
    </div>
  );
}
