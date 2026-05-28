"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle } from "lucide-react";
import { AvailabilityCalendar } from "@/components/ui/availability-calendar";
import { TimeSlotsGrid } from "@/components/ui/time-slots-grid";
import type { MascotaRow, VetOption, ServicioOpt } from "../_types";
import { vetEspecialidadLabel } from "../_types";
import { dateToStr } from "../_types";

interface Props {
  open: boolean;
  onClose: () => void;
  mascotas: MascotaRow[];
  onBooked: () => void;
  prefillMotivo?: string;
  prefillMascotaId?: number;
}

export function BookingModal({ open, onClose, mascotas, onBooked, prefillMotivo, prefillMascotaId }: Props) {
  const [step, setStep]             = useState<"form" | "success">("form");
  const [vets, setVets]             = useState<VetOption[]>([]);
  const [servicios, setServicios]   = useState<ServicioOpt[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [fecha, setFecha]   = useState("");
  const [hora, setHora]     = useState("");
  const [idMascota, setIdMascota] = useState("");
  const [idVet, setIdVet]   = useState("");
  const [motivo, setMotivo] = useState("");
  const [idServicio, setIdServicio] = useState("");
  const [error, setError]   = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/veterinarios").then(r=>r.json()).then(j=>setVets(j.data??[]));
    fetch("/api/servicios-medicos").then(r=>r.json()).then(j=>setServicios((j.data??[]).filter((s: ServicioOpt) => s.es_activo)));
  }, []);

  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setStep("form"); setSelectedDay(undefined); setFecha(""); setHora("");
      setIdMascota(prefillMascotaId?.toString() ?? ""); setIdVet("");
      setMotivo(prefillMotivo ?? ""); setIdServicio(""); setError(null);
    }
  }

  if (!open) return null;

  const handleDaySelect = (date: Date | undefined) => {
    setSelectedDay(date); setFecha(date ? dateToStr(date) : ""); setHora("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idMascota || !idVet || !fecha || !hora || !motivo) { setError("Completa todos los campos."); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await fetch("/api/citas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_mascota: Number(idMascota), id_veterinario: Number(idVet),
          fecha, hora, motivo, origen: "portal",
          ...(idServicio ? { id_servicio: Number(idServicio) } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Error al agendar la cita"); return; }
      setStep("success");
      onBooked();
    } catch { setError("Error de conexión"); }
    finally { setSubmitting(false); }
  };

  const servicioSel = servicios.find(s => s.id_servicio === Number(idServicio));
  const labelStyle: React.CSSProperties = { fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", color:"#6b5c44", fontFamily:"var(--font-dm-sans)", display:"block", marginBottom:"6px" };
  const selectStyle: React.CSSProperties = { height:"40px", width:"100%", borderRadius:"9px", border:"1.5px solid #d0c8b8", background:"#fdfaf5", padding:"0 12px", fontSize:"0.875rem", fontFamily:"var(--font-dm-sans)", color:"#1a1208", outline:"none" };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(6,18,9,0.7)", backdropFilter:"blur(8px)" }} onClick={onClose} />
      <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:"520px", background:"#fff", borderRadius:"24px", overflow:"hidden", boxShadow:"0 32px 80px rgba(10,26,17,0.4)", maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ background:"linear-gradient(135deg,#0a1a11,#0f2318)", padding:"20px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 }}>
          <div>
            <p style={{ fontFamily:"var(--font-fraunces)", fontStyle:"italic", fontSize:"1.1rem", fontWeight:700, color:"#fff", margin:0 }}>{step==="success"?"¡Cita agendada!":"Agendar una cita"}</p>
            <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.75rem", color:"rgba(255,255,255,0.4)", margin:0 }}>Portal del cliente · PetCare</p>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.08)", border:"none", color:"rgba(255,255,255,0.6)", cursor:"pointer", width:"34px", height:"34px", borderRadius:"9px", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16} /></button>
        </div>
        <div style={{ padding:"24px" }}>
          {step === "success" ? (
            <div style={{ textAlign:"center", padding:"16px 0" }}>
              <div style={{ width:"72px", height:"72px", borderRadius:"50%", background:"linear-gradient(135deg,#f0fdf4,#dcfce7)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}><CheckCircle size={36} color="#16a34a" /></div>
              <h3 style={{ fontFamily:"var(--font-fraunces)", fontSize:"1.3rem", fontWeight:700, fontStyle:"italic", color:"#1a1208", margin:"0 0 10px" }}>¡Solicitud enviada!</h3>
              <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.88rem", color:"#8a7a60", lineHeight:1.6, margin:"0 0 24px" }}>Tu cita fue agendada exitosamente. Recuerda llegar 10 minutos antes de tu hora.</p>
              <button onClick={onClose} style={{ background:"#0a1a11", color:"#fff", border:"none", cursor:"pointer", padding:"12px 32px", borderRadius:"10px", fontFamily:"var(--font-dm-sans)", fontSize:"0.88rem", fontWeight:600 }}>Cerrar</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"18px" }}>
              {/* Mascota */}
              <div><label style={labelStyle}>Mascota</label><select style={selectStyle} value={idMascota} onChange={e=>setIdMascota(e.target.value)}><option value="">Seleccionar mascota…</option>{mascotas.map(m=><option key={m.id_mascota} value={m.id_mascota}>{m.nombre} ({m.especie})</option>)}</select></div>

              {/* Servicio (opcional) */}
              <div>
                <label style={labelStyle}>Servicio <span style={{ fontWeight:400, opacity:0.6 }}>(opcional)</span></label>
                <select style={selectStyle} value={idServicio} onChange={e=>setIdServicio(e.target.value)}>
                  <option value="">Consulta general / Sin especificar</option>
                  {servicios.map(s=><option key={s.id_servicio} value={s.id_servicio}>{s.nombre}{s.precio_base?` — S/ ${s.precio_base.toFixed(2)}`:""}{s.duracion_estimada_min?` (~${s.duracion_estimada_min} min)`:""}</option>)}
                </select>
                {servicioSel?.precio_base && (
                  <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.72rem", color:"#6b5c44", margin:"4px 0 0" }}>
                    Precio referencial: S/ {servicioSel.precio_base.toFixed(2)} · Duración estimada: {servicioSel.duracion_estimada_min} minutos
                  </p>
                )}
              </div>

              {/* Fecha */}
              <div><label style={labelStyle}>Fecha</label><AvailabilityCalendar selected={selectedDay} onSelect={handleDaySelect} /></div>

              {/* Veterinario */}
              {fecha && (
                <div>
                  <label style={labelStyle}>Veterinario</label>
                  <select style={selectStyle} value={idVet} onChange={e=>{ setIdVet(e.target.value); setHora(""); }}>
                    <option value="">Seleccionar veterinario…</option>
                    {vets.map(v => {
                      const esp = vetEspecialidadLabel(v);
                      return (
                        <option key={v.id_veterinario} value={v.id_veterinario}>
                          {v.usuarios.nombre} {v.usuarios.apellido}{esp ? ` — ${esp}` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Horarios */}
              {fecha && idVet && <TimeSlotsGrid fecha={fecha} idVeterinario={idVet} selected={hora} onSelect={setHora} />}

              {/* Motivo */}
              <div><label style={labelStyle}>Motivo de la consulta</label><textarea value={motivo} onChange={e=>setMotivo(e.target.value)} placeholder="Describe brevemente el motivo…" style={{ ...selectStyle, height:"80px", padding:"10px 12px", resize:"none" } as React.CSSProperties} rows={3} /></div>

              {error && <p style={{ fontSize:"0.82rem", color:"#dc2626", fontFamily:"var(--font-dm-sans)" }}>{error}</p>}

              <div style={{ position:"sticky", bottom:0, background:"#fff", borderTop:"1px solid #f0ead8", padding:"12px 0 4px", marginTop:"4px" }}>
                <button type="submit" disabled={submitting || !hora || !idMascota || !motivo}
                  style={{ width:"100%", background:"linear-gradient(135deg,#c48c34,#a07028)", color:"#fff", border:"none", cursor:(submitting||!hora||!idMascota||!motivo)?"not-allowed":"pointer", padding:"14px", borderRadius:"12px", fontSize:"0.9rem", fontWeight:700, fontFamily:"var(--font-dm-sans)", opacity:(submitting||!hora||!idMascota||!motivo)?0.6:1 }}>
                  {submitting?"Agendando…":"Confirmar cita"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
