"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  PawPrint, CalendarDays, FileText, LogOut, User, ChevronRight,
  X, CalendarPlus, Plus, CalendarClock,
  Clock, ListOrdered,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { formatLima, format12h } from "@/utils/datetime";
import { exportHistorialPdf } from "@/utils/historialPdf";
import type { EstadoCita } from "@/types";

import type { MascotaRow, CitaRow, HistoriaRow, SeguimientoPortal, AlertaVacPortal, AtencionPortal, ColaPortal, Tab } from "./_types";
import { estadoLabels } from "./_types";
import { MascotaCard }          from "./_components/MascotaCard";
import { AlertsSidebar }        from "./_components/AlertsSidebar";
import { SeguimientosTab }      from "./_components/SeguimientosTab";
import { ColaEsperaModal }      from "./_components/ColaEsperaModal";
import { RegisterMascotaModal } from "./_components/RegisterMascotaModal";
import { EditMascotaModal }     from "./_components/EditMascotaModal";
import { ProfileModal }         from "./_components/ProfileModal";
import { RescheduleCitaModal }  from "./_components/RescheduleCitaModal";
import { BookingModal }         from "./_components/BookingModal";

export default function PortalPage() {
  const { user, logout } = useAuth();

  // ── Tab & data state ───────────────────────────────────────────────────────
  const [tab, setTab]               = useState<Tab>("mascotas");
  const [mascotas, setMascotas]     = useState<MascotaRow[]>([]);
  const [citas, setCitas]           = useState<CitaRow[]>([]);
  const [historias, setHistorias]   = useState<HistoriaRow[]>([]);
  const [seguimientos, setSeguimientos] = useState<SeguimientoPortal[]>([]);
  const [alertasVac, setAlertasVac] = useState<AlertaVacPortal[]>([]);
  const [atencionesActivas, setAtencionesActivas] = useState<AtencionPortal[]>([]);
  const [colaEsperaActiva, setColaEsperaActiva]   = useState<ColaPortal[]>([]);
  const [historialMascotaId, setHistorialMascotaId] = useState<number | "all">("all");

  // loading arranca en true para la carga inicial — evita setState síncrono en el effect
  const [loadingTab, setLoadingTab] = useState(true);

  // ── Modal state ────────────────────────────────────────────────────────────
  const [detailCita, setDetailCita]           = useState<CitaRow | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [bookingOpen, setBookingOpen]         = useState(false);
  const [bookingPrefill, setBookingPrefill]   = useState<{ motivo?: string; mascotaId?: number }>({});
  const [mascotaModalOpen, setMascotaModalOpen] = useState(false);
  const [rescheduleItem, setRescheduleItem]   = useState<CitaRow | null>(null);
  const [editMascota, setEditMascota]         = useState<MascotaRow | null>(null);
  const [profileOpen, setProfileOpen]         = useState(false);
  const [noMascotasAlert, setNoMascotasAlert] = useState(false);
  const [colaOpen, setColaOpen]               = useState(false);

  const [verifiedBanner, setVerifiedBanner] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("verified") === "1";
  });
  // ID de cita a confirmar automáticamente (llegado por email link ?confirmar=N)
  const [confirmandoCitaId, setConfirmandoCitaId] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const v = new URLSearchParams(window.location.search).get("confirmar");
    return v ? Number(v) : null;
  });

  // ── Auth redirect ──────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = sessionStorage.getItem("petcare_user");
    if (stored) {
      const u = JSON.parse(stored) as { rol: string };
      if (u.rol !== "cliente") window.location.href = "/dashboard";
      return;
    }
    fetch("/api/auth/session").then(r=>r.json()).then(j=>{
      if (j?.user?.rol === "cliente") {
        sessionStorage.setItem("petcare_user", JSON.stringify(j.user));
        sessionStorage.setItem("petcare_session_exp", String(Date.now() + 8*60*60*1000));
        window.location.reload();
      } else if (j?.user) { window.location.href = "/dashboard"; }
      else { window.location.href = "/"; }
    }).catch(() => { window.location.href = "/"; });
  }, []);

  // ── Confirmar cita desde link del email (?confirmar=N) ────────────────────
  useEffect(() => {
    if (!confirmandoCitaId) return;
    // Ir automáticamente a la tab de citas
    handleTabChange("citas");
    // Intentar confirmar
    fetch(`/api/citas/${confirmandoCitaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "confirmada" }),
    }).then(r => r.json()).then(j => {
      if (j.data) {
        // Limpiar el query param sin recargar
        const url = new URL(window.location.href);
        url.searchParams.delete("confirmar");
        window.history.replaceState({}, "", url.toString());
        setConfirmandoCitaId(null);
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmandoCitaId]);

  // ── Summary data (alertas, seguimientos, atenciones) ──────────────────────
  useEffect(() => {
    Promise.all([
      fetch("/api/alertas-vacunacion?estado=activa").then(r=>r.json()).catch(()=>({})),
      fetch("/api/seguimientos-clinicos?pendientes=1").then(r=>r.json()).catch(()=>({})),
      fetch("/api/atenciones-clinicas").then(r=>r.json()).catch(()=>({})),
      fetch("/api/portal/cola-espera").then(r=>r.json()).catch(()=>({})),
    ]).then(([jA, jS, jAt, jC]) => {
      setAlertasVac(jA.data ?? []);
      setSeguimientos((jS.data ?? []).filter((s: SeguimientoPortal) => ["pendiente","sugerencia_enviada"].includes(s.estado)));
      setAtencionesActivas((jAt.data ?? []).filter((a: AtencionPortal) => !["finalizado","cancelada","no_asistio"].includes(a.estado_actual)));
      setColaEsperaActiva(jC.data ?? []);
    });
  }, []);

  // ── Tab data loader — no setState síncrono: solo llama setState en async callbacks ──
  const loadTab = useCallback(async (t: Tab) => {
    try {
      if (t === "mascotas") {
        const j = await fetch("/api/mascotas").then(r=>r.json());
        setMascotas(j.data ?? []);
      } else if (t === "citas") {
        const j = await fetch("/api/citas").then(r=>r.json());
        setCitas(j.data ?? []);
      } else if (t === "seguimientos") {
        const j = await fetch("/api/seguimientos-clinicos?pendientes=1").then(r=>r.json());
        setSeguimientos((j.data ?? []).filter((s: SeguimientoPortal) => ["pendiente","sugerencia_enviada"].includes(s.estado)));
      } else {
        const [hRes, mRes] = await Promise.all([
          fetch("/api/historia-clinica").then(r=>r.json()).catch(()=>({})),
          fetch("/api/mascotas").then(r=>r.json()).catch(()=>({})),
        ]);
        setHistorias(hRes.data ?? []);
        setMascotas(mRes.data ?? []);
      }
    } finally {
      setLoadingTab(false); // solo en callback async — válido
    }
  }, []);

  // Efecto de tab: loadTab ya no llama setState síncronamente, este patrón es seguro
  useEffect(() => { loadTab(tab); }, [tab, loadTab]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const handleTabChange = (t: Tab) => {
    setLoadingTab(true); // evento de usuario — setState síncrono válido aquí
    setTab(t);
  };

  const openBooking = (opts: { motivo?: string; mascotaId?: number } = {}) => {
    if (mascotas.length === 0) { setNoMascotasAlert(true); return; }
    setBookingPrefill(opts);
    setBookingOpen(true);
  };

  const firstName = user?.nombre ?? "Cliente";

  const tabBtn = (id: Tab, label: string, icon: React.ReactNode, badge?: number) => (
    <button onClick={() => handleTabChange(id)} style={{
      display:"flex", alignItems:"center", gap:"8px", padding:"10px 18px",
      borderRadius:"10px", border:"none", cursor:"pointer",
      fontFamily:"var(--font-dm-sans)", fontSize:"0.85rem",
      fontWeight: tab===id ? 700 : 500, transition:"all 0.15s",
      background: tab===id ? "#0a1a11" : "transparent",
      color: tab===id ? "#fff" : "#6b5c44", position:"relative",
    }}>
      {icon} {label}
      {badge != null && badge > 0 && (
        <span style={{ position:"absolute", top:"4px", right:"4px", width:"16px", height:"16px", borderRadius:"50%", background:"#dc2626", color:"#fff", fontSize:"0.6rem", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-dm-sans)" }}>
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );

  // ── Historial helpers ──────────────────────────────────────────────────────
  const historiasFiltradas = historialMascotaId === "all"
    ? historias
    : historias.filter(h => h.id_mascota === historialMascotaId);

  const handleDescargarPdf = async () => {
    const mascotaSeleccionada = historialMascotaId === "all"
      ? null
      : mascotas.find(m => m.id_mascota === historialMascotaId) ?? null;
    const mascotasParaPdf = mascotaSeleccionada
      ? [mascotaSeleccionada]
      : mascotas.filter(m => historias.some(h => h.id_mascota === m.id_mascota));
    for (const mPdf of mascotasParaPdf) {
      await exportHistorialPdf({
        mascota: { id_mascota:mPdf.id_mascota, nombre:mPdf.nombre, especie:mPdf.especie, raza:mPdf.raza, sexo:mPdf.sexo, color:mPdf.color, fecha_nacimiento:mPdf.fecha_nacimiento, clientes: user ? { usuarios:{ nombre:user.nombre, apellido:user.apellido } } : undefined },
        historias: historias.filter(h => h.id_mascota === mPdf.id_mascota),
      });
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#ede7d9" }}>

      {/* ── HEADER ── */}
      <header style={{ background:"linear-gradient(135deg,#0a1a11,#0f2318)", padding:"0 clamp(20px,4vw,60px)", height:"64px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
          <Link href="/" style={{ display:"flex", alignItems:"center" }}>
            <Image src="/logo/logo_h.png" alt="PetCare" width={100} height={28} style={{ height:"auto", filter:"brightness(0) invert(1)", opacity:0.9 }} />
          </Link>
          <div className="hidden sm:block" style={{ width:"1px", height:"20px", background:"rgba(255,255,255,0.15)" }} />
          <span className="hidden sm:block" style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.82rem", color:"rgba(255,255,255,0.55)" }}>Mi Portal</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <button onClick={() => setProfileOpen(true)} title="Mi perfil"
            style={{ display:"flex", alignItems:"center", gap:"8px", background:"transparent", border:"1px solid rgba(255,255,255,0.1)", padding:"4px 10px 4px 4px", borderRadius:"99px", cursor:"pointer", transition:"all 0.15s" }}
            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.08)";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="transparent";}}>
            <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:"rgba(61,132,91,0.25)", border:"1.5px solid rgba(61,132,91,0.4)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <User size={14} color="#80cc9c" />
            </div>
            <span className="hidden sm:block" style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.82rem", color:"rgba(255,255,255,0.75)", fontWeight:500 }}>
              {user?.nombre} {user?.apellido}
            </span>
          </button>
          <Link href="/" className="hidden sm:flex" style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.78rem", color:"rgba(255,255,255,0.45)", textDecoration:"none", padding:"6px 10px", borderRadius:"7px", border:"1px solid rgba(255,255,255,0.1)", transition:"all 0.15s" }}
            onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.color="rgba(255,255,255,0.8)";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.color="rgba(255,255,255,0.45)";}}>
            Inicio
          </Link>
          <button onClick={() => setShowLogoutModal(true)} title="Cerrar sesión"
            style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.7)", cursor:"pointer", padding:"6px 12px", borderRadius:"7px", fontFamily:"var(--font-dm-sans)", fontSize:"0.78rem", display:"flex", alignItems:"center", gap:"6px", transition:"all 0.15s" }}
            onMouseEnter={e=>{const b=e.currentTarget as HTMLButtonElement;b.style.background="rgba(255,255,255,0.14)";b.style.color="#fff";}}
            onMouseLeave={e=>{const b=e.currentTarget as HTMLButtonElement;b.style.background="rgba(255,255,255,0.08)";b.style.color="rgba(255,255,255,0.7)";}}>
            <LogOut size={13} /><span className="hidden sm:inline"> Cerrar sesión</span>
          </button>
        </div>
      </header>

      {/* ── MAIN — layout dos columnas ── */}
      <main style={{ maxWidth:"1200px", margin:"0 auto", padding:"24px clamp(12px,3vw,32px)" }}>
        <div className="portal-layout">

          {/* Columna principal */}
          <div style={{ flex:1, minWidth:0, background:"#faf8f3", border:"1px solid #e0d8ca", borderRadius:"20px", padding:"24px", boxShadow:"0 2px 12px rgba(26,18,8,0.07)" }}>

          {/* Verified banner */}
          {verifiedBanner && (
            <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"20px", background:"#f0fdf4", border:"1px solid #86efac", borderRadius:"14px", padding:"14px 18px" }}>
              <div style={{ width:"36px", height:"36px", borderRadius:"10px", background:"#dcfce7", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span style={{ fontSize:"1.2rem" }}>✓</span>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontFamily:"var(--font-dm-sans)", fontWeight:700, color:"#166534", margin:0, fontSize:"0.92rem" }}>¡Correo verificado!</p>
                <p style={{ fontFamily:"var(--font-dm-sans)", color:"#15803d", margin:0, fontSize:"0.82rem" }}>Tu cuenta quedó activada. Bienvenido a tu portal.</p>
              </div>
              <button onClick={() => setVerifiedBanner(false)} style={{ background:"transparent", border:"none", cursor:"pointer", color:"#16a34a", padding:"4px", display:"flex" }}><X size={16} /></button>
            </div>
          )}

          {/* Hero */}
          <div className="portal-hero" style={{ background:"linear-gradient(135deg,#0a1a11 0%,#133320 100%)", borderRadius:"20px", padding:"28px 32px", marginBottom:"24px", gap:"20px", boxShadow:"0 8px 32px rgba(10,26,17,0.18)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"18px" }}>
              <div style={{ width:"56px", height:"56px", borderRadius:"50%", flexShrink:0, background:"rgba(196,140,52,0.18)", border:"2px solid rgba(196,140,52,0.4)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <PawPrint size={26} color="#c48c34" />
              </div>
              <div>
                <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.72rem", fontWeight:600, letterSpacing:"0.14em", textTransform:"uppercase", color:"rgba(255,255,255,0.4)", margin:"0 0 4px" }}>Mi portal</p>
                <h1 style={{ fontFamily:"var(--font-fraunces)", fontSize:"clamp(1.4rem,3vw,1.9rem)", fontWeight:700, fontStyle:"italic", color:"#f2e8d5", margin:0, letterSpacing:"-0.02em" }}>Hola, {firstName}</h1>
              </div>
            </div>
            <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
              <button onClick={() => openBooking()}
                style={{ display:"flex", alignItems:"center", gap:"8px", background:"linear-gradient(135deg,#c48c34,#a07028)", color:"#fff", border:"none", cursor:"pointer", padding:"11px 20px", borderRadius:"10px", fontFamily:"var(--font-dm-sans)", fontSize:"0.85rem", fontWeight:700, boxShadow:"0 4px 16px rgba(196,140,52,0.35)", transition:"all 0.2s", whiteSpace:"nowrap" }}
                onMouseEnter={e=>{const b=e.currentTarget as HTMLButtonElement;b.style.transform="translateY(-2px)";b.style.boxShadow="0 8px 24px rgba(196,140,52,0.5)";}}
                onMouseLeave={e=>{const b=e.currentTarget as HTMLButtonElement;b.style.transform="translateY(0)";b.style.boxShadow="0 4px 16px rgba(196,140,52,0.35)";}}>
                <CalendarPlus size={15} /> Agendar cita
              </button>
              <button onClick={() => setMascotaModalOpen(true)}
                style={{ display:"flex", alignItems:"center", gap:"8px", background:"rgba(61,132,91,0.18)", color:"#80cc9c", border:"1.5px solid rgba(61,132,91,0.35)", cursor:"pointer", padding:"11px 20px", borderRadius:"10px", fontFamily:"var(--font-dm-sans)", fontSize:"0.85rem", fontWeight:700, transition:"all 0.2s", whiteSpace:"nowrap" }}
                onMouseEnter={e=>{const b=e.currentTarget as HTMLButtonElement;b.style.background="rgba(61,132,91,0.28)";b.style.transform="translateY(-2px)";}}
                onMouseLeave={e=>{const b=e.currentTarget as HTMLButtonElement;b.style.background="rgba(61,132,91,0.18)";b.style.transform="translateY(0)";}}>
                <Plus size={15} /> Registrar mascota
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="portal-tabs" style={{ background:"#ede7d9", padding:"4px", borderRadius:"12px" }}>
            {tabBtn("mascotas",    "Mis mascotas",   <PawPrint size={14} />)}
            {tabBtn("citas",       "Mis citas",      <CalendarDays size={14} />)}
            {tabBtn("historial",   "Historial clínico", <FileText size={14} />)}
            {tabBtn("seguimientos","Seguimientos",   <Clock size={14} />, seguimientos.length)}
          </div>

          {/* Tab content */}
          <div style={{ background:"#fff", border:"1px solid #e8e0d0", borderRadius:"16px", padding:"24px", minHeight:"320px" }}>
            {loadingTab ? (
              <div style={{ display:"flex", justifyContent:"center", padding:"60px 0" }}>
                <Image src="/logo/logo_i.png" alt="" width={48} height={48} style={{ animation:"pulse 1.5s ease-in-out infinite", objectFit:"contain" }} />
              </div>
            ) : (
              <>
                {/* ── MASCOTAS ── */}
                {tab === "mascotas" && (
                  mascotas.length === 0 ? (
                    <div style={{ textAlign:"center", padding:"60px 20px" }}>
                      <PawPrint size={40} color="#d9cfba" style={{ margin:"0 auto 12px", display:"block" }} />
                      <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.9rem", color:"#8a7a60", margin:"0 0 20px" }}>No tienes mascotas registradas aún.</p>
                      <button onClick={() => setMascotaModalOpen(true)} style={{ display:"inline-flex", alignItems:"center", gap:"8px", background:"linear-gradient(135deg,#3d845b,#2d6647)", color:"#fff", border:"none", cursor:"pointer", padding:"11px 22px", borderRadius:"10px", fontFamily:"var(--font-dm-sans)", fontSize:"0.88rem", fontWeight:700 }}>
                        <Plus size={15} /> Registrar mi primera mascota
                      </button>
                    </div>
                  ) : (
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:"20px" }}>
                      {mascotas.map(m => (
                        <MascotaCard key={m.id_mascota} m={m} onEdit={setEditMascota} atencionActiva={atencionesActivas.find(a => a.id_mascota === m.id_mascota)} />
                      ))}
                    </div>
                  )
                )}

                {/* ── CITAS ── */}
                {tab === "citas" && (
                  <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                    {citas.length === 0 ? (
                      <div style={{ textAlign:"center", padding:"60px 20px", color:"#8a7a60", fontFamily:"var(--font-dm-sans)", fontSize:"0.9rem" }}>
                        <CalendarDays size={40} color="#d9cfba" style={{ margin:"0 auto 12px", display:"block" }} />
                        No tienes citas registradas.
                        <div style={{ marginTop:"12px" }}>
                          <button onClick={() => setColaOpen(true)} style={{ display:"inline-flex", alignItems:"center", gap:"6px", background:"rgba(124,58,237,0.1)", color:"#7c3aed", border:"1px solid rgba(124,58,237,0.3)", cursor:"pointer", padding:"8px 16px", borderRadius:"9px", fontFamily:"var(--font-dm-sans)", fontSize:"0.82rem", fontWeight:600 }}>
                            <ListOrdered size={13} /> Unirme a lista de espera
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {citas.map(c => (
                          <div key={c.id_cita} className="portal-cita-row" style={{ background:"#fff", border:"1px solid #e8e0d0", borderRadius:"14px", padding:"18px 22px" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:"16px", minWidth:0 }}>
                              <div style={{ width:"46px", height:"46px", borderRadius:"12px", background:"linear-gradient(135deg,#fdf3dc,#fce8b0)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                <CalendarDays size={20} color="#c48c34" />
                              </div>
                              <div style={{ minWidth:0 }}>
                                <p style={{ fontFamily:"var(--font-dm-sans)", fontWeight:600, color:"#1a1208", margin:0, fontSize:"0.9rem" }}>
                                  {c.mascotas?.nombre ?? "—"} · {c.motivo}
                                </p>
                                <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.78rem", color:"#8a7a60", margin:0 }}>
                                  {formatLima(`${c.fecha}T00:00:00`, "dd/MM/yyyy")} a las {format12h(c.hora)}
                                  {c.veterinarios ? ` · Dr. ${c.veterinarios.usuarios.nombre} ${c.veterinarios.usuarios.apellido}` : ""}
                                </p>
                              </div>
                            </div>
                            <div style={{ display:"flex", alignItems:"center", gap:"8px", flexShrink:0, flexWrap:"wrap", justifyContent:"flex-end" }}>
                              <Badge variant={c.estado}>{estadoLabels[c.estado]}</Badge>
                              {/* Confirmar asistencia — solo citas pendientes */}
                              {c.estado === "pendiente" && (
                                <button onClick={async () => {
                                  const res = await fetch(`/api/citas/${c.id_cita}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ estado:"confirmada" }) });
                                  if (res.ok) { setLoadingTab(true); loadTab("citas"); }
                                }} style={{ background:"#f0fdf4", border:"1px solid #86efac", color:"#15803d", cursor:"pointer", padding:"6px 10px", borderRadius:"8px", fontFamily:"var(--font-dm-sans)", fontSize:"0.75rem", fontWeight:700, display:"flex", alignItems:"center", gap:"4px" }}>
                                  ✓ Confirmar asistencia
                                </button>
                              )}
                              {(c.estado==="pendiente"||c.estado==="confirmada") && (
                                <button onClick={() => setRescheduleItem(c)} style={{ background:"#fdf3dc", border:"1px solid #f0d080", color:"#a07028", cursor:"pointer", padding:"6px 10px", borderRadius:"8px", fontFamily:"var(--font-dm-sans)", fontSize:"0.75rem", fontWeight:600, display:"flex", alignItems:"center", gap:"4px" }}>
                                  <CalendarClock size={12} /> Reprogramar
                                </button>
                              )}
                              <button onClick={() => setDetailCita(c)} style={{ background:"rgba(240,253,244,0.5)", border:"1px solid #e5e7eb", color:"#374151", cursor:"pointer", padding:"6px 10px", borderRadius:"8px", fontFamily:"var(--font-dm-sans)", fontSize:"0.75rem", fontWeight:600, display:"flex", alignItems:"center", gap:"4px" }}>
                                Ver <ChevronRight size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                        <div style={{ paddingTop:"8px", borderTop:"1px solid #f5f0e8" }}>
                          <button onClick={() => setColaOpen(true)} style={{ display:"flex", alignItems:"center", gap:"6px", background:"transparent", color:"#8a7a60", border:"1px dashed #d9cfba", cursor:"pointer", padding:"8px 16px", borderRadius:"9px", fontFamily:"var(--font-dm-sans)", fontSize:"0.78rem", fontWeight:600 }}>
                            <ListOrdered size={13} /> ¿No encuentras horario? Unirme a lista de espera
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ── HISTORIAL ── */}
                {tab === "historial" && (
                  <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                    {mascotas.length > 1 && (
                      <div style={{ display:"flex", flexWrap:"wrap", gap:"12px", alignItems:"center", justifyContent:"space-between" }}>
                        <label style={{ display:"flex", alignItems:"center", gap:"10px", flex:"1 1 220px" }}>
                          <span style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.78rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"#6b5c44", whiteSpace:"nowrap" }}>Mascota</span>
                          <select value={String(historialMascotaId)} onChange={e=>setHistorialMascotaId(e.target.value==="all"?"all":Number(e.target.value))}
                            style={{ flex:1, height:"38px", borderRadius:"9px", border:"1.5px solid #d0c8b8", background:"#fdfaf5", padding:"0 12px", fontSize:"0.85rem", fontFamily:"var(--font-dm-sans)", color:"#1a1208", outline:"none" }}>
                            <option value="all">Todas mis mascotas</option>
                            {mascotas.map(m => <option key={m.id_mascota} value={m.id_mascota}>{m.nombre} ({m.especie})</option>)}
                          </select>
                        </label>
                        <button onClick={handleDescargarPdf} disabled={historiasFiltradas.length===0}
                          style={{ display:"flex", alignItems:"center", gap:"6px", background:"#2d6a4f", color:"#fff", border:"none", cursor:historiasFiltradas.length===0?"not-allowed":"pointer", padding:"10px 16px", borderRadius:"9px", fontFamily:"var(--font-dm-sans)", fontSize:"0.85rem", fontWeight:700, opacity:historiasFiltradas.length===0?0.5:1 }}>
                          <FileText size={14} /> Descargar PDF
                        </button>
                      </div>
                    )}
                    {mascotas.length === 1 && historias.length > 0 && (
                      <div style={{ display:"flex", justifyContent:"flex-end" }}>
                        <button onClick={handleDescargarPdf} style={{ display:"flex", alignItems:"center", gap:"6px", background:"#2d6a4f", color:"#fff", border:"none", cursor:"pointer", padding:"10px 16px", borderRadius:"9px", fontFamily:"var(--font-dm-sans)", fontSize:"0.85rem", fontWeight:700 }}>
                          <FileText size={14} /> Descargar PDF
                        </button>
                      </div>
                    )}
                    {historiasFiltradas.length === 0 ? (
                      <div style={{ textAlign:"center", padding:"60px 20px", color:"#8a7a60", fontFamily:"var(--font-dm-sans)", fontSize:"0.9rem" }}>
                        <FileText size={40} color="#d9cfba" style={{ margin:"0 auto 12px", display:"block" }} />
                        {historias.length===0 ? "No hay historias clínicas registradas." : "No hay historias para la mascota seleccionada."}
                      </div>
                    ) : historiasFiltradas.map(h => (
                      <div key={h.id_historia} style={{ background:"#fff", border:"1px solid #e8e0d0", borderRadius:"14px", padding:"20px 24px" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"12px", marginBottom:"14px" }}>
                          <div>
                            <p style={{ fontFamily:"var(--font-fraunces)", fontSize:"1rem", fontWeight:700, color:"#1a1208", margin:0 }}>{h.mascotas?.nombre ?? "—"}</p>
                            <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.78rem", color:"#8a7a60", margin:0 }}>
                              {formatLima(`${h.fecha_consulta}T00:00:00`, "dd/MM/yyyy")}
                              {h.veterinarios ? ` · Dr. ${h.veterinarios.usuarios.nombre} ${h.veterinarios.usuarios.apellido}` : ""}
                            </p>
                          </div>
                          {h.peso_consulta && <span style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.78rem", fontWeight:600, color:"#3d845b", background:"#f0fdf4", padding:"4px 10px", borderRadius:"99px", whiteSpace:"nowrap" }}>{h.peso_consulta} kg</span>}
                        </div>
                        <div className="portal-hist-grid">
                          {[["Diagnóstico", h.diagnostico], ["Tratamiento", h.tratamiento]].map(([l,v]) => (
                            <div key={l}>
                              <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#8a7a60", margin:"0 0 3px" }}>{l}</p>
                              <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.85rem", color:"#1a1208", margin:0, lineHeight:1.5 }}>{v}</p>
                            </div>
                          ))}
                          {h.observaciones && (
                            <div style={{ gridColumn:"1/-1" }}>
                              <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#8a7a60", margin:"0 0 3px" }}>Observaciones</p>
                              <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.85rem", color:"#1a1208", margin:0, lineHeight:1.5 }}>{h.observaciones}</p>
                            </div>
                          )}
                        </div>
                        <div style={{ marginTop:"12px", paddingTop:"10px", borderTop:"1px solid #f5f0e8" }}>
                          <Link href={`/portal/mascotas/${h.id_mascota}/historia-clinica`}
                            style={{ display:"inline-flex", alignItems:"center", gap:"6px", fontFamily:"var(--font-dm-sans)", fontSize:"0.75rem", fontWeight:600, color:"#3d845b", textDecoration:"none" }}>
                            <FileText size={11} /> Ver historial completo y archivos adjuntos <ChevronRight size={11} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── SEGUIMIENTOS ── */}
                {tab === "seguimientos" && (
                  <SeguimientosTab seguimientos={seguimientos} mascotas={mascotas} loading={false}
                    onAgendar={(seg) => openBooking({ motivo:`Control: ${seg.motivo_seguimiento}`, mascotaId:seg.id_mascota })} />
                )}
              </>
            )}
          </div>
          </div>{/* fin columna principal */}

          {/* ── Sidebar de alertas ── */}
          <div className="portal-sidebar">
            <p style={{ margin:"0 0 10px", fontFamily:"var(--font-dm-sans)", fontSize:"0.7rem", fontWeight:700, color:"#8a7a60", textTransform:"uppercase", letterSpacing:"0.09em" }}>
              Estado y avisos
            </p>
            <AlertsSidebar
              alertasVac={alertasVac}
              seguimientos={seguimientos}
              atencionesActivas={atencionesActivas}
              colaEsperaActiva={colaEsperaActiva}
              onGoSeguimientos={() => handleTabChange("seguimientos")}
              onAbrirCola={() => setColaOpen(true)}
            />
          </div>

        </div>{/* fin flex row */}
      </main>

      {/* ── MODALS ── */}
      <RescheduleCitaModal  cita={rescheduleItem} open={!!rescheduleItem} onClose={()=>setRescheduleItem(null)} onRescheduled={()=>{ setLoadingTab(true); loadTab("citas"); }} />
      <RegisterMascotaModal open={mascotaModalOpen} onClose={()=>setMascotaModalOpen(false)} onCreated={()=>{ if(tab==="mascotas"){ setLoadingTab(true); loadTab("mascotas"); } }} />
      <EditMascotaModal     mascota={editMascota} open={!!editMascota} onClose={()=>setEditMascota(null)} onSaved={()=>{ setLoadingTab(true); loadTab(tab); }} />
      <ProfileModal         open={profileOpen} onClose={()=>setProfileOpen(false)} />
      <BookingModal         open={bookingOpen} onClose={()=>setBookingOpen(false)} mascotas={mascotas} prefillMotivo={bookingPrefill.motivo} prefillMascotaId={bookingPrefill.mascotaId} onBooked={()=>{ if(tab==="citas"){ setLoadingTab(true); loadTab("citas"); } }} />
      <ColaEsperaModal      open={colaOpen} onClose={()=>{ setColaOpen(false); fetch("/api/portal/cola-espera").then(r=>r.json()).then(j=>setColaEsperaActiva(j.data??[])); }} mascotas={mascotas} />

      {/* Cita detail */}
      {detailCita && (
        <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}>
          <div style={{ position:"absolute", inset:0, background:"rgba(10,26,17,0.6)", backdropFilter:"blur(6px)" }} onClick={()=>setDetailCita(null)} />
          <div style={{ position:"relative", zIndex:1, background:"#fff", borderRadius:"20px", padding:"28px", maxWidth:"460px", width:"100%", boxShadow:"0 24px 60px rgba(10,26,17,0.25)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
              <h2 style={{ fontFamily:"var(--font-fraunces)", fontSize:"1.2rem", fontWeight:700, color:"#1a1208", margin:0 }}>Detalle de la cita</h2>
              <button onClick={()=>setDetailCita(null)} style={{ background:"#f5f0e8", border:"none", borderRadius:"8px", width:"32px", height:"32px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem", color:"#6b5c44" }}>×</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
              {[
                ["Mascota", `${detailCita.mascotas?.nombre} (${detailCita.mascotas?.especie})`],
                ["Fecha", formatLima(`${detailCita.fecha}T00:00:00`, "dd/MM/yyyy")],
                ["Hora", format12h(detailCita.hora)],
                ["Veterinario", detailCita.veterinarios ? `${detailCita.veterinarios.usuarios.nombre} ${detailCita.veterinarios.usuarios.apellido}` : "—"],
                ["Motivo", detailCita.motivo],
                ["Estado", estadoLabels[detailCita.estado as EstadoCita]],
              ].map(([l,v]) => (
                <div key={l} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"10px 0", borderBottom:"1px solid #f0ead8" }}>
                  <span style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.78rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.07em", color:"#8a7a60", flexShrink:0 }}>{l}</span>
                  <span style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.88rem", color:"#1a1208", textAlign:"right", marginLeft:"16px" }}>{v}</span>
                </div>
              ))}
            </div>
            <button onClick={()=>setDetailCita(null)} style={{ marginTop:"20px", width:"100%", background:"#0a1a11", color:"#fff", border:"none", cursor:"pointer", padding:"12px", borderRadius:"10px", fontFamily:"var(--font-dm-sans)", fontSize:"0.88rem", fontWeight:600 }}>Cerrar</button>
          </div>
        </div>
      )}

      {/* Sin mascotas alert */}
      {noMascotasAlert && (
        <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}>
          <div style={{ position:"absolute", inset:0, background:"rgba(6,18,9,0.7)", backdropFilter:"blur(8px)" }} onClick={()=>setNoMascotasAlert(false)} />
          <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:"420px", background:"#fff", borderRadius:"24px", overflow:"hidden", boxShadow:"0 32px 80px rgba(10,26,17,0.4)" }}>
            <div style={{ background:"linear-gradient(135deg,#0a1a11,#0f2318)", padding:"22px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                <div style={{ width:"38px", height:"38px", borderRadius:"10px", background:"rgba(196,140,52,0.18)", border:"1px solid rgba(196,140,52,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}><PawPrint size={18} color="#c48c34" /></div>
                <p style={{ fontFamily:"var(--font-fraunces)", fontSize:"1.05rem", fontWeight:700, fontStyle:"italic", color:"#fff", margin:0 }}>Registra tu mascota primero</p>
              </div>
              <button onClick={()=>setNoMascotasAlert(false)} style={{ background:"rgba(255,255,255,0.08)", border:"none", cursor:"pointer", width:"30px", height:"30px", borderRadius:"8px", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.5)" }}><X size={14} /></button>
            </div>
            <div style={{ padding:"24px" }}>
              <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.9rem", color:"#4a3d2e", lineHeight:1.65, margin:"0 0 24px" }}>Para agendar una cita necesitas tener al menos una mascota registrada en tu cuenta.</p>
              <div style={{ display:"flex", gap:"10px" }}>
                <button onClick={()=>setNoMascotasAlert(false)} style={{ flex:1, height:"42px", borderRadius:"10px", border:"1.5px solid #e8e0d0", background:"#fdfaf5", color:"#4a3d2e", fontSize:"0.88rem", fontWeight:600, fontFamily:"var(--font-dm-sans)", cursor:"pointer" }}>Cancelar</button>
                <button onClick={()=>{ setNoMascotasAlert(false); setMascotaModalOpen(true); }} style={{ flex:1, height:"42px", borderRadius:"10px", border:"none", background:"linear-gradient(135deg,#3d845b,#2d6647)", color:"#fff", fontSize:"0.88rem", fontWeight:600, fontFamily:"var(--font-dm-sans)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}>
                  <PawPrint size={14} /> Registrar mascota
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout modal */}
      {showLogoutModal && (
        <div style={{ position:"fixed", inset:0, zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}>
          <div style={{ position:"absolute", inset:0, background:"rgba(6,18,9,0.7)", backdropFilter:"blur(8px)" }} onClick={()=>setShowLogoutModal(false)} />
          <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:"380px", background:"#fff", borderRadius:"20px", overflow:"hidden", boxShadow:"0 32px 80px rgba(6,18,9,0.35)" }} onClick={e=>e.stopPropagation()}>
            <div style={{ background:"linear-gradient(135deg,#0a1a11,#0f2318)", padding:"24px 24px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                <div style={{ width:"40px", height:"40px", borderRadius:"11px", background:"rgba(196,140,52,0.18)", border:"1px solid rgba(196,140,52,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}><LogOut size={18} color="#c48c34" /></div>
                <div>
                  <p style={{ fontFamily:"var(--font-fraunces)", fontSize:"1.05rem", fontWeight:700, fontStyle:"italic", color:"#fff", margin:0 }}>Cerrar sesión</p>
                  <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.72rem", color:"rgba(255,255,255,0.4)", margin:0 }}>PetCare · Portal del cliente</p>
                </div>
              </div>
              <button onClick={()=>setShowLogoutModal(false)} style={{ background:"rgba(255,255,255,0.08)", border:"none", cursor:"pointer", width:"30px", height:"30px", borderRadius:"8px", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.5)" }}><X size={14} /></button>
            </div>
            <div style={{ padding:"24px" }}>
              <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.9rem", color:"#4a3d2e", lineHeight:1.65, margin:"0 0 24px" }}>Tu sesión se cerrará y serás redirigido a la página de inicio.</p>
              <div style={{ display:"flex", gap:"10px" }}>
                <button onClick={()=>setShowLogoutModal(false)} style={{ flex:1, height:"42px", borderRadius:"10px", border:"1.5px solid #e8e0d0", background:"#fdfaf5", color:"#4a3d2e", fontSize:"0.88rem", fontWeight:600, fontFamily:"var(--font-dm-sans)", cursor:"pointer" }}>Cancelar</button>
                <button onClick={()=>logout("/")} style={{ flex:1, height:"42px", borderRadius:"10px", border:"none", background:"linear-gradient(135deg,#0a1a11,#162e20)", color:"#fff", fontSize:"0.88rem", fontWeight:600, fontFamily:"var(--font-dm-sans)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}>
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
