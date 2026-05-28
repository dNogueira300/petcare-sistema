"use client";

import { useState } from "react";
import { X, CheckCircle, ListOrdered } from "lucide-react";
import type { MascotaRow } from "../_types";
import { modalInputStyle, modalLabelStyle } from "../_types";

interface Props {
  open: boolean;
  onClose: () => void;
  mascotas: MascotaRow[];
}

export function ColaEsperaModal({ open, onClose, mascotas }: Props) {
  const [idMascota, setIdMascota]  = useState("");
  const [motivo, setMotivo]         = useState("");
  const [fecha, setFecha]           = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]             = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) { setIdMascota(""); setMotivo(""); setFecha(""); setDone(false); setError(null); }
  }

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idMascota || !motivo.trim()) { setError("Selecciona mascota e indica el motivo"); return; }
    setSubmitting(true); setError(null);
    const res = await fetch("/api/portal/cola-espera", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_mascota: Number(idMascota), motivo, preferencia_fecha: fecha || undefined }),
    });
    setSubmitting(false);
    if (res.ok) { setDone(true); }
    else { const j = await res.json(); setError(j.error ?? "Error al inscribirse"); }
  };

  const inputS  = modalInputStyle();
  const labelS  = modalLabelStyle();

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(6,18,9,0.7)", backdropFilter:"blur(8px)" }} onClick={onClose} />
      <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:"440px", background:"#fff", borderRadius:"24px", overflow:"hidden", boxShadow:"0 32px 80px rgba(10,26,17,0.4)" }}>
        <div style={{ background:"linear-gradient(135deg,#0a1a11,#0f2318)", padding:"20px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <p style={{ fontFamily:"var(--font-fraunces)", fontStyle:"italic", fontSize:"1.1rem", fontWeight:700, color:"#fff", margin:0 }}>
              {done ? "¡Inscrito en lista!" : "Lista de espera"}
            </p>
            <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.75rem", color:"rgba(255,255,255,0.4)", margin:0 }}>
              Te avisaremos cuando haya disponibilidad
            </p>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.08)", border:"none", color:"rgba(255,255,255,0.6)", cursor:"pointer", width:"34px", height:"34px", borderRadius:"9px", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding:"24px" }}>
          {done ? (
            <div style={{ textAlign:"center", padding:"8px 0" }}>
              <div style={{ width:"64px", height:"64px", borderRadius:"50%", background:"linear-gradient(135deg,#f0fdf4,#dcfce7)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                <CheckCircle size={32} color="#16a34a" />
              </div>
              <p style={{ fontFamily:"var(--font-fraunces)", fontSize:"1.2rem", fontWeight:700, fontStyle:"italic", color:"#1a1208", margin:"0 0 8px" }}>¡Listo!</p>
              <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.88rem", color:"#8a7a60", lineHeight:1.6, margin:"0 0 20px" }}>
                Te notificaremos por correo cuando haya un horario disponible.
              </p>
              <button onClick={onClose} style={{ background:"#0a1a11", color:"#fff", border:"none", cursor:"pointer", padding:"12px 28px", borderRadius:"10px", fontFamily:"var(--font-dm-sans)", fontSize:"0.88rem", fontWeight:600 }}>
                Cerrar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div>
                <label style={labelS}>Mascota</label>
                <select value={idMascota} onChange={e => setIdMascota(e.target.value)} style={inputS}>
                  <option value="">Seleccionar mascota…</option>
                  {mascotas.map(m => <option key={m.id_mascota} value={m.id_mascota}>{m.nombre} ({m.especie})</option>)}
                </select>
              </div>
              <div>
                <label style={labelS}>Motivo de la consulta</label>
                <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3} placeholder="Describe brevemente el motivo…"
                  style={{ ...inputS, height:"80px", padding:"10px 12px", resize:"none" } as React.CSSProperties} />
              </div>
              <div>
                <label style={labelS}>Fecha preferida <span style={{ fontWeight:400, opacity:0.6 }}>(opcional)</span></label>
                <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={inputS} />
              </div>
              {error && <p style={{ fontSize:"0.82rem", color:"#dc2626", fontFamily:"var(--font-dm-sans)" }}>{error}</p>}
              <button type="submit" disabled={submitting}
                style={{ width:"100%", background:"linear-gradient(135deg,#0a1a11,#162e20)", color:"#fff", border:"none", cursor:submitting?"not-allowed":"pointer", padding:"13px", borderRadius:"12px", fontSize:"0.9rem", fontWeight:700, fontFamily:"var(--font-dm-sans)", opacity:submitting?0.7:1, display:"flex", alignItems:"center", justifyContent:"center", gap:"7px" }}>
                <ListOrdered size={14} /> {submitting ? "Inscribiendo…" : "Unirme a la lista"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
