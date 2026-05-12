"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PawPrint, CalendarDays, FileText, LogOut, User, ChevronRight, X, CalendarPlus, CheckCircle, Plus, CalendarClock, Syringe } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { AvailabilityCalendar } from "@/components/ui/availability-calendar";
import { TimeSlotsGrid } from "@/components/ui/time-slots-grid";
import { formatLima } from "@/utils/datetime";
import type { EstadoCita } from "@/types";

/* ═══ types ═══ */
interface MascotaRow { id_mascota: number; nombre: string; especie: string; raza: string | null; sexo: string | null; color: string | null; fecha_nacimiento: string | null; peso: number | null; }
const SEXO_LABEL: Record<string, string> = { macho: "Macho", hembra: "Hembra" };
interface CitaRow { id_cita: number; id_veterinario: number; fecha: string; hora: string; motivo: string; estado: EstadoCita; mascotas: { nombre: string; especie: string }; veterinarios: { usuarios: { nombre: string; apellido: string } }; }
interface HistoriaRow { id_historia: number; fecha_consulta: string; diagnostico: string; tratamiento: string; observaciones: string | null; peso_consulta: number | null; mascotas: { nombre: string }; veterinarios: { usuarios: { nombre: string; apellido: string } }; }
interface VetOption { id_veterinario: number; usuarios: { nombre: string; apellido: string } }

const estadoLabels: Record<EstadoCita, string> = { pendiente:"Pendiente", confirmada:"Confirmada", cancelada:"Cancelada", atendida:"Atendida" };

function calcEdad(fn: string | null) {
  if (!fn) return "—";
  const [by,bm,bd] = fn.split("-").map(Number);
  const now = new Date();
  let y = now.getFullYear() - by, m = now.getMonth()+1 - bm;
  if (m < 0) { y--; m += 12; }
  return y > 0 ? `${y} año${y!==1?"s":""}` : `${m} mes${m!==1?"es":""}`;
}

function dateToStr(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

type Tab = "mascotas" | "citas" | "historial";

/* ═══ Mascota card ═══ */
function MascotaCard({ m }: { m: MascotaRow }) {
  const icons: Record<string,string> = { Perro:"🐕", Gato:"🐈", Ave:"🦜", Conejo:"🐇", Reptil:"🦎", Otro:"🐾" };
  return (
    <div style={{ background:"#fff", border:"1px solid #e8e0d0", borderRadius:"16px",
      padding:"24px", display:"flex", flexDirection:"column", gap:"12px",
      boxShadow:"0 2px 8px rgba(26,18,8,0.06)", transition:"all 0.2s" }}
      onMouseEnter={e=>{ (e.currentTarget as HTMLDivElement).style.boxShadow="0 8px 24px rgba(26,18,8,0.12)"; (e.currentTarget as HTMLDivElement).style.transform="translateY(-2px)"; }}
      onMouseLeave={e=>{ (e.currentTarget as HTMLDivElement).style.boxShadow="0 2px 8px rgba(26,18,8,0.06)"; (e.currentTarget as HTMLDivElement).style.transform="translateY(0)"; }}
    >
      <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
        <div style={{ width:"56px", height:"56px", borderRadius:"14px", background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.8rem", flexShrink:0 }}>
          {icons[m.especie] ?? "🐾"}
        </div>
        <div>
          <p style={{ fontFamily:"var(--font-fraunces)", fontSize:"1.1rem", fontWeight:700, color:"#1a1208", margin:0 }}>{m.nombre}</p>
          <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.82rem", color:"#8a7a60", margin:0 }}>{m.especie}{m.raza ? ` · ${m.raza}` : ""}{m.color ? ` · ${m.color}` : ""}</p>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
        {[["Edad", calcEdad(m.fecha_nacimiento)], ["Sexo", m.sexo ? (SEXO_LABEL[m.sexo] ?? m.sexo) : "—"]].map(([l,v])=>(
          <div key={l} style={{ background:"#faf6ef", borderRadius:"8px", padding:"10px 12px" }}>
            <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.7rem", fontWeight:600, color:"#8a7a60", textTransform:"uppercase", letterSpacing:"0.08em", margin:0 }}>{l}</p>
            <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.9rem", fontWeight:600, color:"#1a1208", margin:0 }}>{v}</p>
          </div>
        ))}
      </div>
      <Link href={`/portal/mascotas/${m.id_mascota}/cartilla`}
        style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"6px",
          background:"#f0fdf4", border:"1px solid #bbf7d0", color:"#16a34a", textDecoration:"none",
          padding:"8px", borderRadius:"9px", fontFamily:"var(--font-dm-sans)", fontSize:"0.8rem", fontWeight:600 }}>
        <Syringe size={13} /> Ver cartilla de vacunas
      </Link>
    </div>
  );
}

/* ═══ Register pet modal ═══ */
const especieOpts = ["Perro","Gato","Ave","Conejo","Reptil","Otro"];

function RegisterMascotaModal({ open, onClose, onCreated }: {
  open: boolean; onClose: () => void; onCreated: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [especie, setEspecie] = useState("Perro");
  const [raza, setRaza] = useState("");
  const [sexo, setSexo] = useState("macho");
  const [color, setColor] = useState("");
  const [fechaNac, setFechaNac] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) { setNombre(""); setEspecie("Perro"); setRaza(""); setSexo("macho"); setColor(""); setFechaNac(""); setError(null); setDone(false); }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError("El nombre es requerido."); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await fetch("/api/mascotas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, especie, raza: raza || undefined, sexo, color: color || undefined, fecha_nacimiento: fechaNac || undefined }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Error al registrar"); return; }
      setDone(true);
      onCreated();
    } catch { setError("Error de conexión"); }
    finally { setSubmitting(false); }
  };

  if (!open) return null;

  const inputS: React.CSSProperties = { height:"40px", width:"100%", borderRadius:"9px",
    border:"1.5px solid #d0c8b8", background:"#fdfaf5", padding:"0 12px",
    fontSize:"0.875rem", fontFamily:"var(--font-dm-sans)", color:"#1a1208", outline:"none" };
  const labelS: React.CSSProperties = { fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.07em",
    textTransform:"uppercase", color:"#6b5c44", fontFamily:"var(--font-dm-sans)", display:"block", marginBottom:"5px" };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(6,18,9,0.7)", backdropFilter:"blur(8px)" }} onClick={onClose} />
      <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:"440px", background:"#fff", borderRadius:"24px", overflow:"hidden", boxShadow:"0 32px 80px rgba(10,26,17,0.4)" }}>
        <div style={{ background:"linear-gradient(135deg,#0a1a11,#0f2318)", padding:"20px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <p style={{ fontFamily:"var(--font-fraunces)", fontStyle:"italic", fontSize:"1.1rem", fontWeight:700, color:"#fff", margin:0 }}>
              {done ? "¡Mascota registrada!" : "Registrar mascota"}
            </p>
            <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.75rem", color:"rgba(255,255,255,0.4)", margin:0 }}>Portal del cliente · PetCare</p>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.08)", border:"none", color:"rgba(255,255,255,0.6)", cursor:"pointer", width:"34px", height:"34px", borderRadius:"9px", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding:"24px" }}>
          {done ? (
            <div style={{ textAlign:"center", padding:"8px 0" }}>
              <div style={{ width:"64px", height:"64px", borderRadius:"50%", background:"linear-gradient(135deg,#f0fdf4,#dcfce7)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", boxShadow:"0 6px 20px rgba(22,163,74,0.2)" }}>
                <CheckCircle size={32} color="#16a34a" />
              </div>
              <p style={{ fontFamily:"var(--font-fraunces)", fontSize:"1.2rem", fontWeight:700, fontStyle:"italic", color:"#1a1208", margin:"0 0 8px" }}>¡Listo!</p>
              <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.88rem", color:"#8a7a60", lineHeight:1.6, margin:"0 0 20px" }}>
                Tu mascota fue registrada. Ya puedes agendar una cita.
              </p>
              <button onClick={onClose} style={{ background:"#0a1a11", color:"#fff", border:"none", cursor:"pointer", padding:"12px 28px", borderRadius:"10px", fontFamily:"var(--font-dm-sans)", fontSize:"0.88rem", fontWeight:600 }}>
                Cerrar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div>
                <label style={labelS}>Nombre de la mascota</label>
                <input value={nombre} onChange={e=>setNombre(e.target.value)} required style={inputS} placeholder="Ej: Max" />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                <div>
                  <label style={labelS}>Especie</label>
                  <select value={especie} onChange={e=>setEspecie(e.target.value)} style={inputS}>
                    {especieOpts.map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelS}>Raza (opcional)</label>
                  <input value={raza} onChange={e=>setRaza(e.target.value)} style={inputS} placeholder="Ej: Labrador" />
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                <div>
                  <label style={labelS}>Sexo</label>
                  <select value={sexo} onChange={e=>setSexo(e.target.value)} style={inputS}>
                    <option value="macho">Macho</option>
                    <option value="hembra">Hembra</option>
                  </select>
                </div>
                <div>
                  <label style={labelS}>Color (opcional)</label>
                  <input value={color} onChange={e=>setColor(e.target.value)} style={inputS} placeholder="Ej: marrón y blanco" />
                </div>
              </div>
              <div>
                <label style={labelS}>Fecha de nacimiento (opcional)</label>
                <input type="date" value={fechaNac} onChange={e=>setFechaNac(e.target.value)} style={inputS} />
              </div>
              <p style={{ fontSize:"0.74rem", color:"#a89a80", fontFamily:"var(--font-dm-sans)", margin:0 }}>
                El peso se registra en la historia clínica de cada consulta.
              </p>
              {error && <p style={{ fontSize:"0.82rem", color:"#dc2626", fontFamily:"var(--font-dm-sans)" }}>{error}</p>}
              <div style={{ position:"sticky", bottom:0, background:"#fff",
                borderTop:"1px solid #f0ead8", padding:"12px 0 4px", marginTop:"4px" }}>
                <button type="submit" disabled={submitting}
                  style={{ width:"100%", background:"linear-gradient(135deg,#0a1a11,#162e20)", color:"#fff", border:"none",
                    cursor:submitting?"not-allowed":"pointer", padding:"13px", borderRadius:"12px",
                    fontSize:"0.9rem", fontWeight:700, fontFamily:"var(--font-dm-sans)", opacity:submitting?0.7:1 }}>
                  {submitting ? "Registrando…" : "Registrar mascota"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══ Reschedule modal ═══ */
function RescheduleCitaModal({ cita, open, onClose, onRescheduled }: {
  cita: CitaRow | null; open: boolean; onClose: () => void; onRescheduled: () => void;
}) {
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) { setSelectedDay(undefined); setFecha(""); setHora(""); setError(null); setDone(false); }
  }

  const handleDaySelect = (date: Date | undefined) => {
    setSelectedDay(date);
    if (!date) { setFecha(""); setHora(""); return; }
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    setFecha(`${y}-${m}-${d}`);
    setHora("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hora || !fecha || !cita) { setError("Selecciona fecha y hora."); return; }
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

  if (!open || !cita) return null;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(6,18,9,0.7)", backdropFilter:"blur(8px)" }} onClick={onClose} />
      <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:"500px", background:"#fff",
        borderRadius:"24px", overflow:"hidden", boxShadow:"0 32px 80px rgba(10,26,17,0.4)",
        display:"flex", flexDirection:"column", maxHeight:"90vh" }}>

        {/* Header sticky */}
        <div style={{ background:"linear-gradient(135deg,#0a1a11,#0f2318)", padding:"20px 24px",
          display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <p style={{ fontFamily:"var(--font-fraunces)", fontStyle:"italic", fontSize:"1.1rem", fontWeight:700, color:"#fff", margin:0 }}>
              {done ? "¡Cita reprogramada!" : "Cambiar fecha y hora"}
            </p>
            <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.75rem", color:"rgba(255,255,255,0.4)", margin:0 }}>
              {cita.mascotas?.nombre} · {cita.motivo}
            </p>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.08)", border:"none", color:"rgba(255,255,255,0.6)", cursor:"pointer", width:"34px", height:"34px", borderRadius:"9px", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY:"auto", flex:1, padding:"24px" }}>
          {done ? (
            <div style={{ textAlign:"center", padding:"16px 0" }}>
              <div style={{ width:"64px", height:"64px", borderRadius:"50%", background:"linear-gradient(135deg,#f0fdf4,#dcfce7)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", boxShadow:"0 6px 20px rgba(22,163,74,0.2)" }}>
                <CheckCircle size={32} color="#16a34a" />
              </div>
              <p style={{ fontFamily:"var(--font-fraunces)", fontSize:"1.2rem", fontWeight:700, fontStyle:"italic", color:"#1a1208", margin:"0 0 8px" }}>¡Listo!</p>
              <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.88rem", color:"#8a7a60", lineHeight:1.6, margin:"0 0 20px" }}>
                Tu cita fue reprogramada para el <strong>{fecha}</strong> a las <strong>{hora}</strong>.
              </p>
              <button onClick={onClose} style={{ background:"#0a1a11", color:"#fff", border:"none", cursor:"pointer", padding:"12px 28px", borderRadius:"10px", fontFamily:"var(--font-dm-sans)", fontSize:"0.88rem", fontWeight:600 }}>
                Cerrar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"18px" }}>
              <div>
                <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", color:"#6b5c44", marginBottom:"8px" }}>
                  Nueva fecha
                </p>
                <AvailabilityCalendar selected={selectedDay} onSelect={handleDaySelect} />
              </div>

              {fecha && (
                <TimeSlotsGrid
                  fecha={fecha}
                  idVeterinario={cita.id_veterinario}
                  selected={hora}
                  onSelect={setHora}
                />
              )}

              {error && <p style={{ fontSize:"0.82rem", color:"#dc2626", fontFamily:"var(--font-dm-sans)" }}>{error}</p>}

              <div style={{ position:"sticky", bottom:0, background:"#fff", borderTop:"1px solid #f0ead8", padding:"12px 0 4px", marginTop:"4px" }}>
                <button type="submit" disabled={submitting || !hora}
                  style={{ width:"100%", background:"linear-gradient(135deg,#3d845b,#2d6647)", color:"#fff",
                    border:"none", cursor:(submitting || !hora) ? "not-allowed" : "pointer",
                    padding:"13px", borderRadius:"12px", fontSize:"0.9rem", fontWeight:700,
                    fontFamily:"var(--font-dm-sans)", opacity:(submitting || !hora) ? 0.6 : 1 }}>
                  {submitting ? "Guardando…" : "Confirmar cambio"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══ Booking modal ═══ */
type BookStep = "form" | "success";

function BookingModal({ open, onClose, mascotas, onBooked }: {
  open: boolean; onClose: () => void;
  mascotas: MascotaRow[];
  onBooked: () => void;
}) {
  const [step, setStep] = useState<BookStep>("form");
  const [vets, setVets] = useState<VetOption[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [idMascota, setIdMascota] = useState("");
  const [idVet, setIdVet] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/veterinarios").then(r=>r.json()).then(j=>setVets(j.data ?? []));
  }, []);

  // Reset when opened
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setStep("form"); setSelectedDay(undefined); setFecha(""); setHora("");
      setIdMascota(""); setIdVet(vets[0]?.id_veterinario.toString() ?? ""); setMotivo(""); setError(null);
    }
  }

  // Auto-assign first vet
  useEffect(() => {
    if (vets.length > 0 && !idVet) setIdVet(vets[0].id_veterinario.toString());
  }, [vets, idVet]);

  const handleDaySelect = (date: Date | undefined) => {
    setSelectedDay(date);
    setFecha(date ? dateToStr(date) : "");
    setHora("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idMascota || !idVet || !fecha || !hora || !motivo) {
      setError("Completa todos los campos."); return;
    }
    setSubmitting(true); setError(null);
    try {
      const res = await fetch("/api/citas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_mascota: Number(idMascota),
          id_veterinario: Number(idVet),
          fecha, hora, motivo, origen: "portal",
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Error al agendar la cita"); return; }
      setStep("success");
      onBooked();
    } catch { setError("Error de conexión"); }
    finally { setSubmitting(false); }
  };

  if (!open) return null;

  const labelStyle: React.CSSProperties = {
    fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.07em",
    textTransform: "uppercase", color: "#6b5c44",
    fontFamily: "var(--font-dm-sans)", display: "block", marginBottom: "6px",
  };
  const selectStyle: React.CSSProperties = {
    height: "40px", width: "100%", borderRadius: "9px", border: "1.5px solid #d0c8b8",
    background: "#fdfaf5", padding: "0 12px", fontSize: "0.875rem",
    fontFamily: "var(--font-dm-sans)", color: "#1a1208", outline: "none",
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center",
      justifyContent:"center", padding:"16px" }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(6,18,9,0.7)", backdropFilter:"blur(8px)" }}
        onClick={onClose} />
      <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:"520px",
        background:"#fff", borderRadius:"24px", overflow:"hidden",
        boxShadow:"0 32px 80px rgba(10,26,17,0.4)", maxHeight:"90vh", overflowY:"auto" }}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#0a1a11,#0f2318)", padding:"20px 24px",
          display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 }}>
          <div>
            <p style={{ fontFamily:"var(--font-fraunces)", fontStyle:"italic", fontSize:"1.1rem",
              fontWeight:700, color:"#fff", margin:0 }}>
              {step === "success" ? "¡Cita agendada!" : "Agendar una cita"}
            </p>
            <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.75rem", color:"rgba(255,255,255,0.4)", margin:0 }}>
              Portal del cliente · PetCare
            </p>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.08)", border:"none",
            color:"rgba(255,255,255,0.6)", cursor:"pointer", width:"34px", height:"34px",
            borderRadius:"9px", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding:"24px" }}>
          {step === "success" ? (
            <div style={{ textAlign:"center", padding:"16px 0" }}>
              <div style={{ width:"72px", height:"72px", borderRadius:"50%",
                background:"linear-gradient(135deg,#f0fdf4,#dcfce7)", display:"flex",
                alignItems:"center", justifyContent:"center", margin:"0 auto 20px",
                boxShadow:"0 8px 24px rgba(22,163,74,0.2)" }}>
                <CheckCircle size={36} color="#16a34a" />
              </div>
              <h3 style={{ fontFamily:"var(--font-fraunces)", fontSize:"1.3rem", fontWeight:700,
                fontStyle:"italic", color:"#1a1208", margin:"0 0 10px" }}>¡Solicitud enviada!</h3>
              <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.88rem", color:"#8a7a60",
                lineHeight:1.6, margin:"0 0 24px" }}>
                Tu cita fue agendada. Recibirás una confirmación del equipo de PetCare.
              </p>
              <button onClick={onClose} style={{ background:"#0a1a11", color:"#fff", border:"none",
                cursor:"pointer", padding:"12px 32px", borderRadius:"10px",
                fontFamily:"var(--font-dm-sans)", fontSize:"0.88rem", fontWeight:600 }}>
                Cerrar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"18px" }}>
              {/* Mascota */}
              <div>
                <label style={labelStyle}>Mascota</label>
                <select style={selectStyle} value={idMascota}
                  onChange={e=>{ setIdMascota(e.target.value); }}>
                  <option value="">Seleccionar mascota…</option>
                  {mascotas.map(m => (
                    <option key={m.id_mascota} value={m.id_mascota}>{m.nombre} ({m.especie})</option>
                  ))}
                </select>
              </div>

              {/* Calendario */}
              <div>
                <label style={labelStyle}>Fecha</label>
                <AvailabilityCalendar selected={selectedDay} onSelect={handleDaySelect} />
              </div>

              {/* Veterinario — se elige después de la fecha */}
              {fecha && (
                <div>
                  <label style={labelStyle}>Veterinario</label>
                  <select style={selectStyle} value={idVet}
                    onChange={e=>{ setIdVet(e.target.value); setHora(""); }}>
                    <option value="">Seleccionar veterinario…</option>
                    {vets.map(v => (
                      <option key={v.id_veterinario} value={v.id_veterinario}>
                        {v.usuarios.nombre} {v.usuarios.apellido}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Grid de horarios — disponibilidad real del veterinario */}
              {fecha && idVet && (
                <TimeSlotsGrid
                  fecha={fecha}
                  idVeterinario={idVet}
                  selected={hora}
                  onSelect={setHora}
                />
              )}

              {/* Motivo */}
              <div>
                <label style={labelStyle}>Motivo de la consulta</label>
                <textarea value={motivo} onChange={e=>setMotivo(e.target.value)}
                  placeholder="Describe brevemente el motivo…"
                  style={{ ...selectStyle, height:"80px", padding:"10px 12px", resize:"none" } as React.CSSProperties}
                  rows={3} />
              </div>

              {error && (
                <p style={{ fontSize:"0.82rem", color:"#dc2626", fontFamily:"var(--font-dm-sans)" }}>{error}</p>
              )}

              <div style={{ position:"sticky", bottom:0, background:"#fff",
                borderTop:"1px solid #f0ead8", padding:"12px 0 4px", marginTop:"4px" }}>
                <button type="submit" disabled={submitting || !hora || !idMascota || !motivo}
                  style={{ width:"100%", background: "linear-gradient(135deg,#c48c34,#a07028)", color:"#fff",
                    border:"none", cursor: (submitting || !hora || !idMascota || !motivo) ? "not-allowed" : "pointer",
                    padding:"14px", borderRadius:"12px", fontSize:"0.9rem", fontWeight:700,
                    fontFamily:"var(--font-dm-sans)",
                    opacity: (submitting || !hora || !idMascota || !motivo) ? 0.6 : 1 }}>
                  {submitting ? "Agendando…" : "Confirmar cita"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══ ROOT ═══ */
export default function PortalPage() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("mascotas");
  const [mascotas, setMascotas] = useState<MascotaRow[]>([]);
  const [citas, setCitas] = useState<CitaRow[]>([]);
  const [historias, setHistorias] = useState<HistoriaRow[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);
  const [detailCita, setDetailCita] = useState<CitaRow | null>(null);
  const [showLogout, setShowLogout] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [mascotaModalOpen, setMascotaModalOpen] = useState(false);
  const [rescheduleItem, setRescheduleItem] = useState<CitaRow | null>(null);
  const [noMascotasAlert, setNoMascotasAlert] = useState(false);
  const [verifiedBanner, setVerifiedBanner] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") === "1") setVerifiedBanner(true);

    const stored = sessionStorage.getItem("petcare_user");
    if (stored) {
      const u = JSON.parse(stored) as { rol: string };
      if (u.rol !== "cliente") { window.location.href = "/dashboard"; }
      return;
    }
    // Sin sesión en sessionStorage — recuperar desde la cookie (p. ej. al verificar el correo)
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((j) => {
        if (j?.user?.rol === "cliente") {
          sessionStorage.setItem("petcare_user", JSON.stringify(j.user));
          window.location.reload();
        } else if (j?.user) {
          window.location.href = "/dashboard";
        } else {
          window.location.href = "/";
        }
      })
      .catch(() => { window.location.href = "/"; });
  }, []);

  const loadTab = async (t: Tab) => {
    setLoadingTab(true);
    try {
      if (t === "mascotas") {
        const r = await fetch("/api/mascotas"); const j = await r.json(); setMascotas(j.data ?? []);
      } else if (t === "citas") {
        const r = await fetch("/api/citas"); const j = await r.json(); setCitas(j.data ?? []);
      } else {
        const r = await fetch("/api/historia-clinica"); const j = await r.json(); setHistorias(j.data ?? []);
      }
    } finally { setLoadingTab(false); }
  };

  useEffect(() => { loadTab(tab); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const firstName = user?.nombre ?? "Cliente";

  const tabBtn = (id: Tab, label: string, icon: React.ReactNode) => (
    <button onClick={() => setTab(id)} style={{
      display:"flex", alignItems:"center", gap:"8px", padding:"10px 20px",
      borderRadius:"10px", border:"none", cursor:"pointer", fontFamily:"var(--font-dm-sans)",
      fontSize:"0.88rem", fontWeight: tab===id ? 700 : 500, transition:"all 0.15s",
      background: tab===id ? "#0a1a11" : "transparent",
      color: tab===id ? "#fff" : "#6b5c44",
    }}>
      {icon} {label}
    </button>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#ede7d9" }}>
      {/* TOP NAV */}
      <header style={{ background:"linear-gradient(135deg,#0a1a11,#0f2318)", padding:"0 clamp(20px,4vw,60px)",
        height:"64px", display:"flex", alignItems:"center", justifyContent:"space-between",
        position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
          <Link href="/" style={{ display:"flex", alignItems:"center" }}>
            <Image src="/logo/logo_h.png" alt="PetCare" width={100} height={28}
              style={{ height:"auto", filter:"brightness(0) invert(1)", opacity:0.9 }} />
          </Link>
          <div style={{ width:"1px", height:"20px", background:"rgba(255,255,255,0.15)" }} />
          <span style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.82rem", color:"rgba(255,255,255,0.55)" }}>
            Mi Portal
          </span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:"rgba(61,132,91,0.25)",
              border:"1.5px solid rgba(61,132,91,0.4)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <User size={14} color="#80cc9c" />
            </div>
            <span className="hidden sm:block" style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.82rem",
              color:"rgba(255,255,255,0.75)", fontWeight:500 }}>
              {user?.nombre} {user?.apellido}
            </span>
          </div>
          <Link href="/" style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.78rem",
            color:"rgba(255,255,255,0.45)", textDecoration:"none", padding:"6px 10px",
            borderRadius:"7px", border:"1px solid rgba(255,255,255,0.1)", transition:"all 0.15s" }}
            onMouseEnter={e=>{ (e.currentTarget as HTMLAnchorElement).style.color="rgba(255,255,255,0.8)"; }}
            onMouseLeave={e=>{ (e.currentTarget as HTMLAnchorElement).style.color="rgba(255,255,255,0.45)"; }}
          >
            Inicio
          </Link>
          <button onClick={() => setShowLogout(true)} title="Cerrar sesión"
            style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)",
              color:"rgba(255,255,255,0.7)", cursor:"pointer", padding:"6px 12px", borderRadius:"7px",
              fontFamily:"var(--font-dm-sans)", fontSize:"0.78rem", display:"flex", alignItems:"center", gap:"6px",
              transition:"all 0.15s" }}
            onMouseEnter={e=>{ const b=e.currentTarget as HTMLButtonElement; b.style.background="rgba(255,255,255,0.14)"; b.style.color="#fff"; }}
            onMouseLeave={e=>{ const b=e.currentTarget as HTMLButtonElement; b.style.background="rgba(255,255,255,0.08)"; b.style.color="rgba(255,255,255,0.7)"; }}
          >
            <LogOut size={13} /> Cerrar sesión
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main style={{ maxWidth:"960px", margin:"0 auto", padding:"24px clamp(12px,3vw,32px)" }}>
        {/* ── Contenedor único crema ── */}
        <div style={{ background:"#faf8f3", border:"1px solid #e0d8ca",
          borderRadius:"20px", padding:"24px",
          boxShadow:"0 2px 12px rgba(26,18,8,0.07)" }}>

        {/* ── Banner: correo verificado ── */}
        {verifiedBanner && (
          <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"20px",
            background:"#f0fdf4", border:"1px solid #86efac", borderRadius:"14px", padding:"14px 18px" }}>
            <div style={{ width:"36px", height:"36px", borderRadius:"10px", background:"#dcfce7",
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <CheckCircle size={20} color="#16a34a" />
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontFamily:"var(--font-dm-sans)", fontWeight:700, color:"#166534", margin:0, fontSize:"0.92rem" }}>
                ¡Correo verificado!
              </p>
              <p style={{ fontFamily:"var(--font-dm-sans)", color:"#15803d", margin:0, fontSize:"0.82rem" }}>
                Tu cuenta quedó activada y ya iniciaste sesión. Bienvenido a tu portal.
              </p>
            </div>
            <button onClick={() => setVerifiedBanner(false)}
              style={{ background:"transparent", border:"none", cursor:"pointer", color:"#16a34a", padding:"4px",
                display:"flex", alignItems:"center" }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* ── Hero card ── */}
        <div style={{ background:"linear-gradient(135deg,#0a1a11 0%,#133320 100%)",
          borderRadius:"20px", padding:"28px 32px", marginBottom:"24px",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          flexWrap:"wrap", gap:"20px", boxShadow:"0 8px 32px rgba(10,26,17,0.18)" }}>
          {/* Avatar + greeting */}
          <div style={{ display:"flex", alignItems:"center", gap:"18px" }}>
            <div style={{ width:"56px", height:"56px", borderRadius:"50%", flexShrink:0,
              background:"rgba(196,140,52,0.18)", border:"2px solid rgba(196,140,52,0.4)",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <PawPrint size={26} color="#c48c34" />
            </div>
            <div>
              <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.72rem", fontWeight:600,
                letterSpacing:"0.14em", textTransform:"uppercase", color:"rgba(255,255,255,0.4)",
                margin:"0 0 4px" }}>Mi portal</p>
              <h1 style={{ fontFamily:"var(--font-fraunces)", fontSize:"clamp(1.4rem,3vw,1.9rem)",
                fontWeight:700, fontStyle:"italic", color:"#f2e8d5", margin:0, letterSpacing:"-0.02em" }}>
                Hola, {firstName}
              </h1>
            </div>
          </div>
          {/* Action buttons */}
          <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
            <button onClick={() => {
              if (mascotas.length === 0) { setNoMascotasAlert(true); return; }
              setBookingOpen(true);
            }}
              style={{ display:"flex", alignItems:"center", gap:"8px",
                background:"linear-gradient(135deg,#c48c34,#a07028)", color:"#fff",
                border:"none", cursor:"pointer", padding:"11px 20px", borderRadius:"10px",
                fontFamily:"var(--font-dm-sans)", fontSize:"0.85rem", fontWeight:700,
                boxShadow:"0 4px 16px rgba(196,140,52,0.35)", transition:"all 0.2s", whiteSpace:"nowrap" }}
              onMouseEnter={e=>{ const b=e.currentTarget as HTMLButtonElement; b.style.transform="translateY(-2px)"; b.style.boxShadow="0 8px 24px rgba(196,140,52,0.5)"; }}
              onMouseLeave={e=>{ const b=e.currentTarget as HTMLButtonElement; b.style.transform="translateY(0)"; b.style.boxShadow="0 4px 16px rgba(196,140,52,0.35)"; }}
            >
              <CalendarPlus size={15} /> Agendar cita
            </button>
            <button onClick={() => setMascotaModalOpen(true)}
              style={{ display:"flex", alignItems:"center", gap:"8px",
                background:"rgba(61,132,91,0.18)", color:"#80cc9c",
                border:"1.5px solid rgba(61,132,91,0.35)", cursor:"pointer",
                padding:"11px 20px", borderRadius:"10px",
                fontFamily:"var(--font-dm-sans)", fontSize:"0.85rem", fontWeight:700,
                transition:"all 0.2s", whiteSpace:"nowrap" }}
              onMouseEnter={e=>{ const b=e.currentTarget as HTMLButtonElement; b.style.background="rgba(61,132,91,0.28)"; b.style.transform="translateY(-2px)"; }}
              onMouseLeave={e=>{ const b=e.currentTarget as HTMLButtonElement; b.style.background="rgba(61,132,91,0.18)"; b.style.transform="translateY(0)"; }}
            >
              <Plus size={15} /> Registrar mascota
            </button>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ display:"flex", gap:"2px", background:"#ede7d9", padding:"4px",
          borderRadius:"12px", width:"fit-content", marginBottom:"24px" }}>
          {tabBtn("mascotas", "Mis mascotas", <PawPrint size={14} />)}
          {tabBtn("citas", "Mis citas", <CalendarDays size={14} />)}
          {tabBtn("historial", "Historial clínico", <FileText size={14} />)}
        </div>

        {/* TAB CONTENT — tarjeta contenedora */}
        <div style={{ background:"#fff", border:"1px solid #e8e0d0", borderRadius:"16px",
          padding:"24px", minHeight:"320px" }}>
        {loadingTab ? (
          <div style={{ display:"flex", justifyContent:"center", padding:"60px 0" }}>
            <Image src="/logo/logo_i.png" alt="" width={48} height={48}
              style={{ animation:"pulse 1.5s ease-in-out infinite", objectFit:"contain" }} />
          </div>
        ) : (
          <>
            {tab === "mascotas" && (
              <div>
                {mascotas.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"60px 20px" }}>
                    <PawPrint size={40} color="#d9cfba" style={{ margin:"0 auto 12px", display:"block" }} />
                    <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.9rem", color:"#8a7a60",
                      margin:"0 0 20px" }}>
                      No tienes mascotas registradas aún.
                    </p>
                    <button onClick={() => setMascotaModalOpen(true)}
                      style={{ display:"inline-flex", alignItems:"center", gap:"8px",
                        background:"linear-gradient(135deg,#3d845b,#2d6647)", color:"#fff",
                        border:"none", cursor:"pointer", padding:"11px 22px", borderRadius:"10px",
                        fontFamily:"var(--font-dm-sans)", fontSize:"0.88rem", fontWeight:700 }}>
                      <Plus size={15} /> Registrar mi primera mascota
                    </button>
                  </div>
                ) : (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:"20px" }}>
                    {mascotas.map(m => <MascotaCard key={m.id_mascota} m={m} />)}
                  </div>
                )}
              </div>
            )}

            {tab === "citas" && (
              <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                {citas.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"60px 20px", color:"#8a7a60",
                    fontFamily:"var(--font-dm-sans)", fontSize:"0.9rem" }}>
                    <CalendarDays size={40} color="#d9cfba" style={{ margin:"0 auto 12px", display:"block" }} />
                    No tienes citas registradas.
                  </div>
                ) : citas.map(c => (
                  <div key={c.id_cita} style={{ background:"#fff", border:"1px solid #e8e0d0", borderRadius:"14px",
                    padding:"18px 22px", display:"flex", alignItems:"center", justifyContent:"space-between",
                    gap:"16px", flexWrap:"wrap" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"16px", minWidth:0 }}>
                      <div style={{ width:"46px", height:"46px", borderRadius:"12px",
                        background:"linear-gradient(135deg,#fdf3dc,#fce8b0)", display:"flex",
                        alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <CalendarDays size={20} color="#c48c34" />
                      </div>
                      <div style={{ minWidth:0 }}>
                        <p style={{ fontFamily:"var(--font-dm-sans)", fontWeight:600, color:"#1a1208",
                          margin:0, fontSize:"0.9rem" }}>
                          {c.mascotas?.nombre ?? "—"} · {c.motivo}
                        </p>
                        <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.78rem", color:"#8a7a60", margin:0 }}>
                          {formatLima(`${c.fecha}T00:00:00`, "dd/MM/yyyy")} a las {c.hora.slice(0,5)}
                          {c.veterinarios ? ` · Dr. ${c.veterinarios.usuarios.nombre} ${c.veterinarios.usuarios.apellido}` : ""}
                        </p>
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:"8px", flexShrink:0, flexWrap:"wrap", justifyContent:"flex-end" }}>
                      <Badge variant={c.estado}>{estadoLabels[c.estado]}</Badge>
                      {(c.estado === "pendiente" || c.estado === "confirmada") && (
                        <button onClick={() => setRescheduleItem(c)}
                          style={{ background:"#fdf3dc", border:"1px solid #f0d080",
                            color:"#a07028", cursor:"pointer", padding:"6px 10px", borderRadius:"8px",
                            fontFamily:"var(--font-dm-sans)", fontSize:"0.75rem", fontWeight:600,
                            display:"flex", alignItems:"center", gap:"4px" }}>
                          <CalendarClock size={12} /> Reprogramar
                        </button>
                      )}
                      <button onClick={() => setDetailCita(c)} style={{ background:"#f0fdf4", border:"1px solid #86efac",
                        color:"#16a34a", cursor:"pointer", padding:"6px 10px", borderRadius:"8px",
                        fontFamily:"var(--font-dm-sans)", fontSize:"0.75rem", fontWeight:600,
                        display:"flex", alignItems:"center", gap:"4px" }}>
                        Ver <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "historial" && (
              <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                {historias.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"60px 20px", color:"#8a7a60",
                    fontFamily:"var(--font-dm-sans)", fontSize:"0.9rem" }}>
                    <FileText size={40} color="#d9cfba" style={{ margin:"0 auto 12px", display:"block" }} />
                    No hay historias clínicas registradas.
                  </div>
                ) : historias.map(h => (
                  <div key={h.id_historia} style={{ background:"#fff", border:"1px solid #e8e0d0",
                    borderRadius:"14px", padding:"20px 24px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
                      gap:"12px", marginBottom:"14px" }}>
                      <div>
                        <p style={{ fontFamily:"var(--font-fraunces)", fontSize:"1rem", fontWeight:700,
                          color:"#1a1208", margin:0 }}>{h.mascotas?.nombre ?? "—"}</p>
                        <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.78rem", color:"#8a7a60", margin:0 }}>
                          {formatLima(`${h.fecha_consulta}T00:00:00`, "dd/MM/yyyy")}
                          {h.veterinarios ? ` · Dr. ${h.veterinarios.usuarios.nombre} ${h.veterinarios.usuarios.apellido}` : ""}
                        </p>
                      </div>
                      {h.peso_consulta && (
                        <span style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.78rem", fontWeight:600,
                          color:"#3d845b", background:"#f0fdf4", padding:"4px 10px", borderRadius:"99px",
                          whiteSpace:"nowrap" }}>{h.peso_consulta} kg</span>
                      )}
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                      {[["Diagnóstico", h.diagnostico], ["Tratamiento", h.tratamiento]].map(([l,v])=>(
                        <div key={l}>
                          <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.7rem", fontWeight:700,
                            textTransform:"uppercase", letterSpacing:"0.08em", color:"#8a7a60", margin:"0 0 3px" }}>{l}</p>
                          <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.85rem", color:"#1a1208",
                            margin:0, lineHeight:1.5 }}>{v}</p>
                        </div>
                      ))}
                      {h.observaciones && (
                        <div style={{ gridColumn:"1/-1" }}>
                          <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.7rem", fontWeight:700,
                            textTransform:"uppercase", letterSpacing:"0.08em", color:"#8a7a60", margin:"0 0 3px" }}>Observaciones</p>
                          <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.85rem", color:"#1a1208", margin:0, lineHeight:1.5 }}>{h.observaciones}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        </div>{/* cierre tab content */}
        </div>{/* cierre contenedor crema */}
      </main>

      {/* Reschedule modal */}
      <RescheduleCitaModal
        cita={rescheduleItem}
        open={!!rescheduleItem}
        onClose={() => setRescheduleItem(null)}
        onRescheduled={() => loadTab("citas")}
      />

      {/* Register pet modal */}
      <RegisterMascotaModal
        open={mascotaModalOpen}
        onClose={() => setMascotaModalOpen(false)}
        onCreated={() => { if (tab === "mascotas") loadTab("mascotas"); }}
      />

      {/* Booking modal */}
      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        mascotas={mascotas}
        onBooked={() => { if (tab === "citas") loadTab("citas"); }}
      />

      {/* Cita detail modal */}
      {detailCita && (
        <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center",
          justifyContent:"center", padding:"16px" }}>
          <div style={{ position:"absolute", inset:0, background:"rgba(10,26,17,0.6)", backdropFilter:"blur(6px)" }}
            onClick={() => setDetailCita(null)} />
          <div style={{ position:"relative", zIndex:1, background:"#fff", borderRadius:"20px",
            padding:"28px", maxWidth:"460px", width:"100%", boxShadow:"0 24px 60px rgba(10,26,17,0.25)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
              <h2 style={{ fontFamily:"var(--font-fraunces)", fontSize:"1.2rem", fontWeight:700, color:"#1a1208", margin:0 }}>
                Detalle de la cita
              </h2>
              <button onClick={() => setDetailCita(null)}
                style={{ background:"#f5f0e8", border:"none", borderRadius:"8px", width:"32px", height:"32px",
                  cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:"1.1rem", color:"#6b5c44" }}>×</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
              {[
                ["Mascota", `${detailCita.mascotas?.nombre} (${detailCita.mascotas?.especie})`],
                ["Fecha", formatLima(`${detailCita.fecha}T00:00:00`, "dd/MM/yyyy")],
                ["Hora", detailCita.hora.slice(0,5)],
                ["Veterinario", detailCita.veterinarios ? `${detailCita.veterinarios.usuarios.nombre} ${detailCita.veterinarios.usuarios.apellido}` : "—"],
                ["Motivo", detailCita.motivo],
                ["Estado", estadoLabels[detailCita.estado]],
              ].map(([l,v])=>(
                <div key={l} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
                  padding:"10px 0", borderBottom:"1px solid #f0ead8" }}>
                  <span style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.78rem", fontWeight:600,
                    textTransform:"uppercase", letterSpacing:"0.07em", color:"#8a7a60", flexShrink:0 }}>{l}</span>
                  <span style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.88rem", color:"#1a1208",
                    textAlign:"right", marginLeft:"16px" }}>{v}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setDetailCita(null)}
              style={{ marginTop:"20px", width:"100%", background:"#0a1a11", color:"#fff",
                border:"none", cursor:"pointer", padding:"12px", borderRadius:"10px",
                fontFamily:"var(--font-dm-sans)", fontSize:"0.88rem", fontWeight:600 }}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Sin mascotas — aviso antes de agendar */}
      {noMascotasAlert && (
        <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center",
          justifyContent:"center", padding:"16px" }}>
          <div style={{ position:"absolute", inset:0, background:"rgba(6,18,9,0.7)", backdropFilter:"blur(8px)" }}
            onClick={() => setNoMascotasAlert(false)} />
          <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:"420px",
            background:"#fff", borderRadius:"24px", overflow:"hidden",
            boxShadow:"0 32px 80px rgba(10,26,17,0.4)" }}>
            {/* Header */}
            <div style={{ background:"linear-gradient(135deg,#0a1a11,#0f2318)", padding:"22px 24px",
              display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                <div style={{ width:"38px", height:"38px", borderRadius:"10px",
                  background:"rgba(196,140,52,0.18)", border:"1px solid rgba(196,140,52,0.3)",
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <PawPrint size={18} color="#c48c34" />
                </div>
                <p style={{ fontFamily:"var(--font-fraunces)", fontSize:"1.05rem", fontWeight:700,
                  fontStyle:"italic", color:"#fff", margin:0 }}>
                  Registra tu mascota primero
                </p>
              </div>
              <button onClick={() => setNoMascotasAlert(false)}
                style={{ background:"rgba(255,255,255,0.08)", border:"none", cursor:"pointer",
                  width:"30px", height:"30px", borderRadius:"8px", display:"flex",
                  alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.5)" }}>
                <X size={14} />
              </button>
            </div>
            {/* Body */}
            <div style={{ padding:"24px" }}>
              <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.9rem", color:"#4a3d2e",
                lineHeight:1.65, margin:"0 0 6px" }}>
                Para agendar una cita necesitas tener al menos una mascota registrada en tu cuenta.
              </p>
              <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.85rem", color:"#8a7a60",
                lineHeight:1.6, margin:"0 0 24px" }}>
                Registra a tu mascota y luego podrás solicitar una cita con nuestros veterinarios.
              </p>
              <div style={{ display:"flex", gap:"10px" }}>
                <button onClick={() => setNoMascotasAlert(false)}
                  style={{ flex:1, height:"42px", borderRadius:"10px", border:"1.5px solid #e8e0d0",
                    background:"#fdfaf5", color:"#4a3d2e", fontSize:"0.88rem", fontWeight:600,
                    fontFamily:"var(--font-dm-sans)", cursor:"pointer" }}>
                  Cancelar
                </button>
                <button onClick={() => { setNoMascotasAlert(false); setMascotaModalOpen(true); }}
                  style={{ flex:1, height:"42px", borderRadius:"10px", border:"none",
                    background:"linear-gradient(135deg,#3d845b,#2d6647)", color:"#fff",
                    fontSize:"0.88rem", fontWeight:600, fontFamily:"var(--font-dm-sans)",
                    cursor:"pointer", display:"flex", alignItems:"center",
                    justifyContent:"center", gap:"6px" }}>
                  <PawPrint size={14} /> Registrar mascota
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout modal */}
      {showLogout && (
        <div style={{ position:"fixed", inset:0, zIndex:300, display:"flex", alignItems:"center",
          justifyContent:"center", padding:"16px" }}>
          <div style={{ position:"absolute", inset:0, background:"rgba(6,18,9,0.7)", backdropFilter:"blur(8px)" }}
            onClick={() => setShowLogout(false)} />
          <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:"380px",
            background:"#fff", borderRadius:"20px", overflow:"hidden",
            boxShadow:"0 32px 80px rgba(6,18,9,0.35)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ background:"linear-gradient(135deg,#0a1a11,#0f2318)", padding:"24px 24px 20px",
              display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                <div style={{ width:"40px", height:"40px", borderRadius:"11px",
                  background:"rgba(196,140,52,0.18)", border:"1px solid rgba(196,140,52,0.3)",
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <LogOut size={18} color="#c48c34" />
                </div>
                <div>
                  <p style={{ fontFamily:"var(--font-fraunces)", fontSize:"1.05rem", fontWeight:700,
                    fontStyle:"italic", color:"#fff", margin:0 }}>Cerrar sesión</p>
                  <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.72rem",
                    color:"rgba(255,255,255,0.4)", margin:0 }}>PetCare · Portal del cliente</p>
                </div>
              </div>
              <button onClick={() => setShowLogout(false)}
                style={{ background:"rgba(255,255,255,0.08)", border:"none", cursor:"pointer",
                  width:"30px", height:"30px", borderRadius:"8px", display:"flex",
                  alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.5)" }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ padding:"24px" }}>
              <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.9rem", color:"#4a3d2e",
                lineHeight:1.65, margin:"0 0 24px" }}>
                Tu sesión se cerrará y serás redirigido a la página de inicio.
              </p>
              <div style={{ display:"flex", gap:"10px" }}>
                <button onClick={() => setShowLogout(false)}
                  style={{ flex:1, height:"42px", borderRadius:"10px", border:"1.5px solid #e8e0d0",
                    background:"#fdfaf5", color:"#4a3d2e", fontSize:"0.88rem", fontWeight:600,
                    fontFamily:"var(--font-dm-sans)", cursor:"pointer" }}>
                  Cancelar
                </button>
                <button onClick={() => logout("/")}
                  style={{ flex:1, height:"42px", borderRadius:"10px", border:"none",
                    background:"linear-gradient(135deg,#0a1a11,#162e20)", color:"#fff",
                    fontSize:"0.88rem", fontWeight:600, fontFamily:"var(--font-dm-sans)",
                    cursor:"pointer", display:"flex", alignItems:"center",
                    justifyContent:"center", gap:"6px" }}>
                  <LogOut size={14} /> Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
