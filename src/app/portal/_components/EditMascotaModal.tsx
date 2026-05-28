"use client";

import { useState } from "react";
import { X, CheckCircle } from "lucide-react";
import type { MascotaRow } from "../_types";
import { modalInputStyle, modalLabelStyle, ESPECIE_OPTS } from "../_types";

interface Props {
  mascota: MascotaRow | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function EditMascotaModal({ mascota, open, onClose, onSaved }: Props) {
  const [nombre, setNombre]     = useState("");
  const [especie, setEspecie]   = useState("Perro");
  const [raza, setRaza]         = useState("");
  const [sexo, setSexo]         = useState("macho");
  const [color, setColor]       = useState("");
  const [fechaNac, setFechaNac] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]         = useState(false);

  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open && mascota) {
      setNombre(mascota.nombre ?? ""); setEspecie(mascota.especie ?? "Perro");
      setRaza(mascota.raza ?? ""); setSexo(mascota.sexo ?? "macho");
      setColor(mascota.color ?? ""); setFechaNac(mascota.fecha_nacimiento ?? "");
      setError(null); setDone(false);
    }
  }

  if (!open || !mascota) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError("El nombre es requerido."); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await fetch(`/api/mascotas/${mascota.id_mascota}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, especie, raza: raza || undefined, sexo, color: color || undefined, fecha_nacimiento: fechaNac || undefined }),
      });
      const json = await res.json();
      if (!res.ok) { setError(typeof json.error === "string" ? json.error : "Error al guardar"); return; }
      setDone(true);
      onSaved();
    } catch { setError("Error de conexión"); }
    finally { setSubmitting(false); }
  };

  const inputS = modalInputStyle();
  const labelS = modalLabelStyle();

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(6,18,9,0.7)", backdropFilter:"blur(8px)" }} onClick={onClose} />
      <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:"440px", background:"#fff", borderRadius:"24px", overflow:"hidden", boxShadow:"0 32px 80px rgba(10,26,17,0.4)", maxHeight:"90vh", display:"flex", flexDirection:"column" }}>
        <div style={{ background:"linear-gradient(135deg,#0a1a11,#0f2318)", padding:"20px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <p style={{ fontFamily:"var(--font-fraunces)", fontStyle:"italic", fontSize:"1.1rem", fontWeight:700, color:"#fff", margin:0 }}>{done ? "¡Cambios guardados!" : "Editar mascota"}</p>
            <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.75rem", color:"rgba(255,255,255,0.4)", margin:0 }}>Portal del cliente · PetCare</p>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.08)", border:"none", color:"rgba(255,255,255,0.6)", cursor:"pointer", width:"34px", height:"34px", borderRadius:"9px", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16} /></button>
        </div>
        <div style={{ padding:"24px", overflowY:"auto" }}>
          {done ? (
            <div style={{ textAlign:"center", padding:"8px 0" }}>
              <div style={{ width:"64px", height:"64px", borderRadius:"50%", background:"linear-gradient(135deg,#f0fdf4,#dcfce7)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}><CheckCircle size={32} color="#16a34a" /></div>
              <p style={{ fontFamily:"var(--font-fraunces)", fontSize:"1.2rem", fontWeight:700, fontStyle:"italic", color:"#1a1208", margin:"0 0 8px" }}>¡Listo!</p>
              <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.88rem", color:"#8a7a60", lineHeight:1.6, margin:"0 0 20px" }}>Los datos de {nombre} fueron actualizados.</p>
              <button onClick={onClose} style={{ background:"#0a1a11", color:"#fff", border:"none", cursor:"pointer", padding:"12px 28px", borderRadius:"10px", fontFamily:"var(--font-dm-sans)", fontSize:"0.88rem", fontWeight:600 }}>Cerrar</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div><label style={labelS}>Nombre de la mascota</label><input value={nombre} onChange={e=>setNombre(e.target.value)} required style={inputS} /></div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                <div><label style={labelS}>Especie</label><select value={especie} onChange={e=>setEspecie(e.target.value)} style={inputS}>{ESPECIE_OPTS.map(o=><option key={o}>{o}</option>)}</select></div>
                <div><label style={labelS}>Raza (opcional)</label><input value={raza} onChange={e=>setRaza(e.target.value)} style={inputS} /></div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                <div><label style={labelS}>Sexo</label><select value={sexo} onChange={e=>setSexo(e.target.value)} style={inputS}><option value="macho">Macho</option><option value="hembra">Hembra</option></select></div>
                <div><label style={labelS}>Color (opcional)</label><input value={color} onChange={e=>setColor(e.target.value)} style={inputS} /></div>
              </div>
              <div><label style={labelS}>Fecha de nacimiento (opcional)</label><input type="date" value={fechaNac} onChange={e=>setFechaNac(e.target.value)} style={inputS} /></div>
              {error && <p style={{ fontSize:"0.82rem", color:"#dc2626", fontFamily:"var(--font-dm-sans)" }}>{error}</p>}
              <div style={{ position:"sticky", bottom:0, background:"#fff", borderTop:"1px solid #f0ead8", padding:"12px 0 4px", marginTop:"4px" }}>
                <button type="submit" disabled={submitting} style={{ width:"100%", background:"linear-gradient(135deg,#0a1a11,#162e20)", color:"#fff", border:"none", cursor:submitting?"not-allowed":"pointer", padding:"13px", borderRadius:"12px", fontSize:"0.9rem", fontWeight:700, fontFamily:"var(--font-dm-sans)", opacity:submitting?0.7:1 }}>{submitting?"Guardando…":"Guardar cambios"}</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
