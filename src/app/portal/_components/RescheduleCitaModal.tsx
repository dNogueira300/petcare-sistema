"use client";

import { useState } from "react";
import { X, CheckCircle } from "lucide-react";
import { AvailabilityCalendar } from "@/components/ui/availability-calendar";
import { TimeSlotsGrid } from "@/components/ui/time-slots-grid";
import { format12h } from "@/utils/datetime";
import type { CitaRow } from "../_types";
import { dateToStr } from "../_types";

interface Props {
  cita: CitaRow | null;
  open: boolean;
  onClose: () => void;
  onRescheduled: () => void;
}

export function RescheduleCitaModal({ cita, open, onClose, onRescheduled }: Props) {
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [fecha, setFecha] = useState("");
  const [hora, setHora]   = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]   = useState(false);

  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) { setSelectedDay(undefined); setFecha(""); setHora(""); setError(null); setDone(false); }
  }

  if (!open || !cita) return null;

  const handleDaySelect = (date: Date | undefined) => {
    setSelectedDay(date);
    setFecha(date ? dateToStr(date) : "");
    setHora("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hora || !fecha) { setError("Selecciona fecha y hora."); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await fetch(`/api/citas/${cita.id_cita}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha, hora }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Error al reprogramar"); return; }
      setDone(true);
      onRescheduled();
    } catch { setError("Error de conexión"); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(6,18,9,0.7)", backdropFilter:"blur(8px)" }} onClick={onClose} />
      <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:"500px", background:"#fff", borderRadius:"24px", overflow:"hidden", boxShadow:"0 32px 80px rgba(10,26,17,0.4)", display:"flex", flexDirection:"column", maxHeight:"90vh" }}>
        <div style={{ background:"linear-gradient(135deg,#0a1a11,#0f2318)", padding:"20px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <p style={{ fontFamily:"var(--font-fraunces)", fontStyle:"italic", fontSize:"1.1rem", fontWeight:700, color:"#fff", margin:0 }}>{done?"¡Cita reprogramada!":"Cambiar fecha y hora"}</p>
            <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.75rem", color:"rgba(255,255,255,0.4)", margin:0 }}>{cita.mascotas?.nombre} · {cita.motivo}</p>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.08)", border:"none", color:"rgba(255,255,255,0.6)", cursor:"pointer", width:"34px", height:"34px", borderRadius:"9px", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16} /></button>
        </div>
        <div style={{ overflowY:"auto", flex:1, padding:"24px" }}>
          {done ? (
            <div style={{ textAlign:"center", padding:"16px 0" }}>
              <div style={{ width:"64px", height:"64px", borderRadius:"50%", background:"linear-gradient(135deg,#f0fdf4,#dcfce7)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}><CheckCircle size={32} color="#16a34a" /></div>
              <p style={{ fontFamily:"var(--font-fraunces)", fontSize:"1.2rem", fontWeight:700, fontStyle:"italic", color:"#1a1208", margin:"0 0 8px" }}>¡Listo!</p>
              <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.88rem", color:"#8a7a60", lineHeight:1.6, margin:"0 0 20px" }}>Tu cita fue reprogramada para el <strong>{fecha}</strong> a las <strong>{format12h(hora)}</strong>.</p>
              <button onClick={onClose} style={{ background:"#0a1a11", color:"#fff", border:"none", cursor:"pointer", padding:"12px 28px", borderRadius:"10px", fontFamily:"var(--font-dm-sans)", fontSize:"0.88rem", fontWeight:600 }}>Cerrar</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"18px" }}>
              <div>
                <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", color:"#6b5c44", marginBottom:"8px" }}>Nueva fecha</p>
                <AvailabilityCalendar selected={selectedDay} onSelect={handleDaySelect} />
              </div>
              {fecha && <TimeSlotsGrid fecha={fecha} idVeterinario={cita.id_veterinario} selected={hora} onSelect={setHora} />}
              {error && <p style={{ fontSize:"0.82rem", color:"#dc2626", fontFamily:"var(--font-dm-sans)" }}>{error}</p>}
              <div style={{ position:"sticky", bottom:0, background:"#fff", borderTop:"1px solid #f0ead8", padding:"12px 0 4px", marginTop:"4px" }}>
                <button type="submit" disabled={submitting || !hora}
                  style={{ width:"100%", background:"linear-gradient(135deg,#3d845b,#2d6647)", color:"#fff", border:"none", cursor:(submitting||!hora)?"not-allowed":"pointer", padding:"13px", borderRadius:"12px", fontSize:"0.9rem", fontWeight:700, fontFamily:"var(--font-dm-sans)", opacity:(submitting||!hora)?0.6:1 }}>
                  {submitting?"Guardando…":"Confirmar cambio"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
