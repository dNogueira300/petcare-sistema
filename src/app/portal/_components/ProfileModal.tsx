"use client";

import { useState } from "react";
import { X, Settings, KeyRound } from "lucide-react";
import { modalInputStyle, modalLabelStyle } from "../_types";

export function ProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [view, setView]          = useState<"datos" | "password">("datos");
  const [loading, setLoading]    = useState(false);
  const [profile, setProfile]    = useState<{ id_cliente:number; telefono:string; direccion:string|null; usuarios:{id_usuario:number;nombre:string;apellido:string;correo:string} } | null>(null);
  const [telefono, setTelefono]  = useState("");
  const [direccion, setDireccion] = useState("");
  const [error, setError]        = useState<string | null>(null);
  const [savedMsg, setSavedMsg]  = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pwActual, setPwActual]  = useState("");
  const [pwNueva, setPwNueva]    = useState("");
  const [pwConf, setPwConf]      = useState("");
  const [showPw, setShowPw]      = useState(false);

  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setView("datos"); setError(null); setSavedMsg(null);
      setPwActual(""); setPwNueva(""); setPwConf(""); setShowPw(false);
      setLoading(true);
      fetch("/api/portal/perfil").then(r=>r.json()).then(j=>{ if (j?.data) { setProfile(j.data); setTelefono(j.data.telefono ?? ""); setDireccion(j.data.direccion ?? ""); } }).catch(()=>setError("No se pudo cargar el perfil")).finally(()=>setLoading(false));
    }
  }

  const handleSaveDatos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (telefono.trim().length < 7) { setError("Teléfono inválido (mínimo 7 dígitos)."); return; }
    setSubmitting(true); setError(null); setSavedMsg(null);
    try {
      const res = await fetch("/api/portal/perfil", { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ telefono, direccion:direccion||undefined }) });
      const json = await res.json();
      if (!res.ok) { setError(typeof json.error === "string" ? json.error : "Error al guardar"); return; }
      setSavedMsg("Datos personales actualizados.");
    } catch { setError("Error de conexión"); } finally { setSubmitting(false); }
  };

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSavedMsg(null);
    if (pwNueva !== pwConf) { setError("Las contraseñas no coinciden."); return; }
    if (pwNueva.length < 8) { setError("La nueva contraseña debe tener al menos 8 caracteres."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/portal/perfil", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ contrasena_actual:pwActual, contrasena:pwNueva }) });
      const json = await res.json();
      if (!res.ok) { setError(typeof json.error === "string" ? json.error : "Error al cambiar contraseña"); return; }
      setSavedMsg("Contraseña actualizada correctamente.");
      setPwActual(""); setPwNueva(""); setPwConf("");
    } catch { setError("Error de conexión"); } finally { setSubmitting(false); }
  };

  if (!open) return null;

  const inputS   = modalInputStyle();
  const labelS   = modalLabelStyle();
  const readS: React.CSSProperties = { ...inputS, background:"#f5f0e8", color:"#8a7a60", cursor:"not-allowed" };
  const tabBtnS = (active: boolean): React.CSSProperties => ({ flex:1, padding:"10px 12px", border:"none", cursor:"pointer", borderRadius:"9px", fontFamily:"var(--font-dm-sans)", fontSize:"0.82rem", fontWeight:active?700:500, background:active?"#0a1a11":"transparent", color:active?"#fff":"#6b5c44", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" });

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(6,18,9,0.7)", backdropFilter:"blur(8px)" }} onClick={onClose} />
      <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:"480px", background:"#fff", borderRadius:"24px", overflow:"hidden", boxShadow:"0 32px 80px rgba(10,26,17,0.4)", maxHeight:"90vh", display:"flex", flexDirection:"column" }}>
        <div style={{ background:"linear-gradient(135deg,#0a1a11,#0f2318)", padding:"20px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div><p style={{ fontFamily:"var(--font-fraunces)", fontStyle:"italic", fontSize:"1.1rem", fontWeight:700, color:"#fff", margin:0 }}>Mi perfil</p><p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.75rem", color:"rgba(255,255,255,0.4)", margin:0 }}>Portal del cliente · PetCare</p></div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.08)", border:"none", color:"rgba(255,255,255,0.6)", cursor:"pointer", width:"34px", height:"34px", borderRadius:"9px", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16} /></button>
        </div>
        <div style={{ padding:"20px 24px 8px", flexShrink:0 }}>
          <div style={{ display:"flex", gap:"4px", background:"#ede7d9", padding:"4px", borderRadius:"11px" }}>
            <button onClick={()=>{ setView("datos"); setError(null); setSavedMsg(null); }} style={tabBtnS(view==="datos")}><Settings size={13}/> Datos</button>
            <button onClick={()=>{ setView("password"); setError(null); setSavedMsg(null); }} style={tabBtnS(view==="password")}><KeyRound size={13}/> Contraseña</button>
          </div>
        </div>
        <div style={{ flex:1, minHeight:0, overflowY:"auto", padding:"16px 24px 24px" }}>
          {loading ? <div style={{ textAlign:"center", padding:"40px 0", color:"#8a7a60", fontFamily:"var(--font-dm-sans)", fontSize:"0.88rem" }}>Cargando…</div>
          : view === "datos" ? (
            <form onSubmit={handleSaveDatos} style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div className="portal-form-grid"><div><label style={labelS}>Nombre</label><input value={profile?.usuarios.nombre??""} readOnly style={readS} /></div><div><label style={labelS}>Apellido</label><input value={profile?.usuarios.apellido??""} readOnly style={readS} /></div></div>
              <div><label style={labelS}>Correo</label><input value={profile?.usuarios.correo??""} readOnly style={readS} /><p style={{ fontSize:"0.72rem", color:"#a89a80", fontFamily:"var(--font-dm-sans)", margin:"4px 0 0" }}>Para cambiar el nombre o correo, contacta con recepción.</p></div>
              <div><label style={labelS}>Teléfono</label><input value={telefono} onChange={e=>setTelefono(e.target.value)} required style={inputS} placeholder="Ej: 987654321" /></div>
              <div><label style={labelS}>Dirección (opcional)</label><input value={direccion} onChange={e=>setDireccion(e.target.value)} style={inputS} placeholder="Ej: Av. Larco 123" /></div>
              {error && <p style={{ fontSize:"0.82rem", color:"#dc2626", fontFamily:"var(--font-dm-sans)", margin:0 }}>{error}</p>}
              {savedMsg && <p style={{ fontSize:"0.82rem", color:"#16a34a", fontFamily:"var(--font-dm-sans)", margin:0 }}>{savedMsg}</p>}
              <button type="submit" disabled={submitting} style={{ width:"100%", background:"linear-gradient(135deg,#0a1a11,#162e20)", color:"#fff", border:"none", cursor:submitting?"not-allowed":"pointer", padding:"13px", borderRadius:"12px", fontSize:"0.9rem", fontWeight:700, fontFamily:"var(--font-dm-sans)", opacity:submitting?0.7:1, marginTop:"4px" }}>{submitting?"Guardando…":"Guardar cambios"}</button>
            </form>
          ) : (
            <form onSubmit={handleChangePw} style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div><label style={labelS}>Contraseña actual</label><input type={showPw?"text":"password"} value={pwActual} onChange={e=>setPwActual(e.target.value)} required style={inputS} placeholder="••••••••" autoComplete="current-password" /></div>
              <div><label style={labelS}>Nueva contraseña</label><input type={showPw?"text":"password"} value={pwNueva} onChange={e=>setPwNueva(e.target.value)} required style={inputS} placeholder="••••••••" autoComplete="new-password" /><p style={{ fontSize:"0.72rem", color:"#a89a80", fontFamily:"var(--font-dm-sans)", margin:"4px 0 0" }}>Mínimo 8 caracteres con mayúscula, minúscula, número y símbolo.</p></div>
              <div><label style={labelS}>Confirmar contraseña</label><input type={showPw?"text":"password"} value={pwConf} onChange={e=>setPwConf(e.target.value)} required style={inputS} placeholder="••••••••" autoComplete="new-password" /></div>
              <label style={{ display:"flex", alignItems:"center", gap:"8px", fontSize:"0.82rem", fontFamily:"var(--font-dm-sans)", color:"#6b5c44", cursor:"pointer" }}><input type="checkbox" checked={showPw} onChange={e=>setShowPw(e.target.checked)} />Mostrar contraseñas</label>
              {error && <p style={{ fontSize:"0.82rem", color:"#dc2626", fontFamily:"var(--font-dm-sans)", margin:0 }}>{error}</p>}
              {savedMsg && <p style={{ fontSize:"0.82rem", color:"#16a34a", fontFamily:"var(--font-dm-sans)", margin:0 }}>{savedMsg}</p>}
              <button type="submit" disabled={submitting} style={{ width:"100%", background:"linear-gradient(135deg,#0a1a11,#162e20)", color:"#fff", border:"none", cursor:submitting?"not-allowed":"pointer", padding:"13px", borderRadius:"12px", fontSize:"0.9rem", fontWeight:700, fontFamily:"var(--font-dm-sans)", opacity:submitting?0.7:1, marginTop:"4px" }}>{submitting?"Cambiando…":"Cambiar contraseña"}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
