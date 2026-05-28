"use client";

import { CalendarPlus, Clock, Stethoscope } from "lucide-react";
import { formatLima } from "@/utils/datetime";
import type { SeguimientoPortal, MascotaRow } from "../_types";
import { ESPECIE_ICONS } from "../_types";

interface Props {
  seguimientos: SeguimientoPortal[];
  mascotas: MascotaRow[];
  loading: boolean;
  onAgendar: (seg: SeguimientoPortal) => void;
}

export function SeguimientosTab({ seguimientos, mascotas, loading, onAgendar }: Props) {
  const hoy = new Date().toISOString().slice(0, 10);

  if (loading) {
    return (
      <div style={{ textAlign:"center", padding:"60px 0", color:"#a89a80", fontFamily:"var(--font-dm-sans)", fontSize:"0.88rem" }}>
        Cargando…
      </div>
    );
  }

  if (seguimientos.length === 0) {
    return (
      <div style={{ textAlign:"center", padding:"60px 20px" }}>
        <Clock size={40} color="#d9cfba" style={{ margin:"0 auto 12px", display:"block" }} />
        <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.9rem", color:"#8a7a60", margin:0 }}>
          No tienes controles médicos pendientes.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
      <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.82rem", color:"#6b5c44", margin:"0 0 4px" }}>
        Tu veterinario ha solicitado que regreses para un control. Agenda tu cita aquí.
      </p>
      {seguimientos.map(s => {
        const vencido  = s.fecha_sugerida_control < hoy && ["pendiente","sugerencia_enviada"].includes(s.estado);
        const mascota  = mascotas.find(m => m.id_mascota === s.id_mascota);
        return (
          <div key={s.id_seguimiento} style={{ background: vencido ? "rgba(254,242,242,0.5)" : "#fff", border: vencido ? "1.5px solid rgba(220,38,38,0.3)" : "1px solid #e8e0d0", borderRadius:"14px", padding:"18px 22px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"16px", flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"14px", minWidth:0 }}>
              <div style={{ width:"44px", height:"44px", borderRadius:"12px", background: vencido ? "rgba(220,38,38,0.1)" : "rgba(217,119,6,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.4rem", flexShrink:0 }}>
                {mascota ? (ESPECIE_ICONS[mascota.especie] ?? "🐾") : <Stethoscope size={18} color="#d97706" />}
              </div>
              <div style={{ minWidth:0 }}>
                <p style={{ fontFamily:"var(--font-dm-sans)", fontWeight:700, color:"#1a1208", margin:0, fontSize:"0.9rem" }}>
                  {s.mascotas?.nombre ?? `Mascota #${s.id_mascota}`}
                </p>
                <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.78rem", color: vencido ? "#dc2626" : "#8a7a60", margin:0 }}>
                  {s.motivo_seguimiento} · Control para {formatLima(`${s.fecha_sugerida_control}T00:00:00`, "dd/MM/yyyy")}
                  {vencido ? " — VENCIDO" : ""}
                </p>
                {s.veterinarios && (
                  <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.72rem", color:"#a89a80", margin:0 }}>
                    Dr. {s.veterinarios.usuarios.nombre} {s.veterinarios.usuarios.apellido}
                  </p>
                )}
              </div>
            </div>
            <button onClick={() => onAgendar(s)}
              style={{ background:"linear-gradient(135deg,#c48c34,#a07028)", color:"#fff", border:"none", cursor:"pointer", padding:"9px 16px", borderRadius:"10px", fontFamily:"var(--font-dm-sans)", fontSize:"0.8rem", fontWeight:700, display:"flex", alignItems:"center", gap:"6px", whiteSpace:"nowrap", flexShrink:0 }}>
              <CalendarPlus size={13} /> Agendar control
            </button>
          </div>
        );
      })}
    </div>
  );
}
