"use client";

import Link from "next/link";
import { Bell, Clock, Activity, ListOrdered, ChevronRight, Syringe, CalendarPlus } from "lucide-react";
import { formatLima } from "@/utils/datetime";
import type { AlertaVacPortal, SeguimientoPortal, AtencionPortal, ColaPortal } from "../_types";
import { estadoAtencionLabel, estadoAtencionColor } from "../_types";

interface Props {
  alertasVac: AlertaVacPortal[];
  seguimientos: SeguimientoPortal[];
  atencionesActivas: AtencionPortal[];
  colaEsperaActiva: ColaPortal[];
  onGoSeguimientos: () => void;
  onAbrirCola: () => void;
}

// Sección reutilizable del sidebar
function SidebarSection({ title, icon: Icon, color, children }: {
  title: string; icon: React.ElementType; color: string; children: React.ReactNode;
}) {
  return (
    <div style={{ background:"#fff", border:`1px solid ${color}30`, borderRadius:12, overflow:"hidden" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:`${color}08`, borderBottom:`1px solid ${color}20` }}>
        <Icon size={13} style={{ color, flexShrink:0 }} />
        <span style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.72rem", fontWeight:700, color, textTransform:"uppercase", letterSpacing:"0.07em" }}>
          {title}
        </span>
      </div>
      <div style={{ padding:"10px 14px", display:"flex", flexDirection:"column", gap:8 }}>
        {children}
      </div>
    </div>
  );
}

export function AlertsSidebar({ alertasVac, seguimientos, atencionesActivas, colaEsperaActiva, onGoSeguimientos, onAbrirCola }: Props) {
  const hasAlerts = alertasVac.length > 0 || seguimientos.length > 0 || atencionesActivas.length > 0 || colaEsperaActiva.length > 0;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

      {/* ── Atención en curso ── */}
      {atencionesActivas.length > 0 && (
        <SidebarSection title="Atención en curso" icon={Activity} color="#0369a1">
          {atencionesActivas.map(a => {
            const estado = estadoAtencionLabel[a.estado_actual] ?? a.estado_actual;
            const color  = estadoAtencionColor[a.estado_actual] ?? "#0369a1";
            return (
              <div key={a.id_atencion}>
                <p style={{ margin:0, fontFamily:"var(--font-dm-sans)", fontSize:"0.82rem", fontWeight:700, color:"#111827" }}>
                  {a.mascotas?.nombre ?? "Mascota"}
                </p>
                <span style={{ display:"inline-flex", alignItems:"center", gap:4, marginTop:3, padding:"2px 8px", borderRadius:99, background:`${color}12`, border:`1px solid ${color}30`, fontSize:"0.68rem", fontWeight:700, color, fontFamily:"var(--font-dm-sans)" }}>
                  {estado}
                </span>
              </div>
            );
          })}
        </SidebarSection>
      )}

      {/* ── Alertas de vacunación ── */}
      {alertasVac.length > 0 && (
        <SidebarSection title={`Vacunación (${alertasVac.length})`} icon={Bell} color="#dc2626">
          {alertasVac.slice(0, 3).map(a => (
            <div key={a.id_alerta} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
              <div>
                <p style={{ margin:0, fontFamily:"var(--font-dm-sans)", fontSize:"0.8rem", fontWeight:600, color:"#111827" }}>
                  {a.mascotas?.nombre ?? "Mascota"}
                </p>
                <p style={{ margin:"1px 0 0", fontFamily:"var(--font-dm-sans)", fontSize:"0.7rem", color:"#dc2626" }}>
                  <Syringe size={9} style={{ display:"inline", marginRight:3 }} />
                  {a.cartilla_vacunacion?.tipo_vacuna ?? "Vacuna"}
                </p>
                {a.cartilla_vacunacion?.fecha_proxima_dosis && (
                  <p style={{ margin:"1px 0 0", fontFamily:"var(--font-dm-sans)", fontSize:"0.68rem", color:"#9ca3af" }}>
                    {formatLima(`${a.cartilla_vacunacion.fecha_proxima_dosis}T00:00:00`, "dd/MM/yyyy")}
                  </p>
                )}
              </div>
              <Link href={`/portal/mascotas/${a.id_mascota}/cartilla`}
                style={{ display:"flex", alignItems:"center", color:"#dc2626", textDecoration:"none", flexShrink:0 }}>
                <ChevronRight size={14} />
              </Link>
            </div>
          ))}
          {alertasVac.length > 3 && (
            <p style={{ margin:0, fontFamily:"var(--font-dm-sans)", fontSize:"0.7rem", color:"#9ca3af", textAlign:"center" }}>
              +{alertasVac.length - 3} alerta{alertasVac.length - 3 > 1 ? "s" : ""} más
            </p>
          )}
        </SidebarSection>
      )}

      {/* ── Seguimientos pendientes ── */}
      {seguimientos.length > 0 && (
        <SidebarSection title={`Seguimientos (${seguimientos.length})`} icon={Clock} color="#d97706">
          {seguimientos.slice(0, 3).map(s => {
            const hoy    = new Date().toISOString().slice(0,10);
            const vencido = s.fecha_sugerida_control < hoy;
            return (
              <div key={s.id_seguimiento}>
                <p style={{ margin:0, fontFamily:"var(--font-dm-sans)", fontSize:"0.8rem", fontWeight:600, color:"#111827" }}>
                  {s.mascotas?.nombre ?? "Mascota"}
                </p>
                <p style={{ margin:"1px 0 0", fontFamily:"var(--font-dm-sans)", fontSize:"0.7rem", color: vencido ? "#dc2626" : "#6b7280", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:160 }}>
                  {s.motivo_seguimiento}
                </p>
                <p style={{ margin:"1px 0 0", fontFamily:"var(--font-dm-sans)", fontSize:"0.68rem", color: vencido ? "#dc2626" : "#9ca3af", fontWeight: vencido ? 600 : 400 }}>
                  {vencido ? "⚠️ Vencido · " : ""}{formatLima(`${s.fecha_sugerida_control}T00:00:00`, "dd/MM/yyyy")}
                </p>
              </div>
            );
          })}
          <button onClick={onGoSeguimientos}
            style={{ marginTop:4, display:"flex", alignItems:"center", justifyContent:"center", gap:5, width:"100%", padding:"7px", borderRadius:8, border:"1px solid #fde68a", background:"rgba(254,243,199,0.6)", color:"#b45309", fontSize:"0.75rem", fontWeight:600, fontFamily:"var(--font-dm-sans)", cursor:"pointer" }}>
            <CalendarPlus size={12} /> Agendar control
          </button>
        </SidebarSection>
      )}

      {/* ── Cola de espera ── */}
      {colaEsperaActiva.length > 0 && (
        <SidebarSection title="Lista de espera" icon={ListOrdered} color="#7c3aed">
          {colaEsperaActiva.map(c => (
            <div key={c.id_cola_espera}>
              <p style={{ margin:0, fontFamily:"var(--font-dm-sans)", fontSize:"0.8rem", fontWeight:600, color:"#111827" }}>
                {c.mascotas?.nombre ?? "Mascota"} <span style={{ fontSize:"0.7rem", textTransform:"capitalize", color:"#6b7280" }}>({c.mascotas?.especie})</span>
              </p>
              <p style={{ margin:"1px 0 0", fontFamily:"var(--font-dm-sans)", fontSize:"0.68rem", color:"#7c3aed" }}>
                {c.estado === "activa" ? "En espera" : "Horario ofrecido"}
              </p>
            </div>
          ))}
        </SidebarSection>
      )}

      {/* Sin alertas */}
      {!hasAlerts && (
        <div style={{ background:"#fff", border:"1px solid #f3f4f6", borderRadius:12, padding:"20px 14px", textAlign:"center" }}>
          <div style={{ width:36, height:36, borderRadius:"50%", background:"rgba(61,132,91,0.1)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 8px" }}>
            <Activity size={16} style={{ color:"#3d845b" }} />
          </div>
          <p style={{ margin:0, fontFamily:"var(--font-dm-sans)", fontSize:"0.78rem", color:"#9ca3af" }}>Sin alertas activas</p>
        </div>
      )}

      {/* CTA Lista de espera */}
      <button onClick={onAbrirCola}
        style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"9px", borderRadius:10, border:"1px dashed #d1d5db", background:"transparent", color:"#9ca3af", fontSize:"0.75rem", fontWeight:600, fontFamily:"var(--font-dm-sans)", cursor:"pointer", transition:"all 0.12s" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor="#7c3aed"; (e.currentTarget as HTMLElement).style.color="#7c3aed"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor="#d1d5db"; (e.currentTarget as HTMLElement).style.color="#9ca3af"; }}>
        <ListOrdered size={13} /> Unirse a lista de espera
      </button>
    </div>
  );
}
