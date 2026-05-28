"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Clock, Activity, ChevronRight, X } from "lucide-react";
import type { AlertaVacPortal, SeguimientoPortal, AtencionPortal } from "../_types";
import { estadoAtencionLabel } from "../_types";

interface Props {
  alertasVac: AlertaVacPortal[];
  seguimientos: SeguimientoPortal[];
  atencionesActivas: AtencionPortal[];
  onGoSeguimientos: () => void;
}

export function AlertBanner({ alertasVac, seguimientos, atencionesActivas, onGoSeguimientos }: Props) {
  const [hidden, setHidden] = useState(false);

  if (hidden || (alertasVac.length === 0 && seguimientos.length === 0 && atencionesActivas.length === 0)) {
    return null;
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"20px" }}>

      {/* Atención activa */}
      {atencionesActivas.length > 0 && (
        <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"12px 16px", borderRadius:"12px", background:"rgba(3,105,161,0.07)", border:"1px solid rgba(3,105,161,0.25)" }}>
          <Activity size={16} style={{ color:"#0369a1", flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <p style={{ fontFamily:"var(--font-dm-sans)", fontWeight:700, color:"#0369a1", margin:0, fontSize:"0.85rem" }}>Atención en curso</p>
            <p style={{ fontFamily:"var(--font-dm-sans)", color:"#0369a1", margin:0, fontSize:"0.78rem", opacity:0.8 }}>
              {atencionesActivas.map(a => `${a.mascotas?.nombre ?? "Mascota"}: ${estadoAtencionLabel[a.estado_actual] ?? a.estado_actual}`).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {/* Alertas vacunación */}
      {alertasVac.length > 0 && (
        <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"12px 16px", borderRadius:"12px", background:"rgba(220,38,38,0.06)", border:"1px solid rgba(220,38,38,0.2)" }}>
          <Bell size={16} style={{ color:"#dc2626", flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <p style={{ fontFamily:"var(--font-dm-sans)", fontWeight:700, color:"#dc2626", margin:0, fontSize:"0.85rem" }}>
              {alertasVac.length} alerta{alertasVac.length > 1 ? "s" : ""} de vacunación
            </p>
            <p style={{ fontFamily:"var(--font-dm-sans)", color:"#b91c1c", margin:0, fontSize:"0.78rem" }}>
              {alertasVac.slice(0,2).map(a => `${a.mascotas?.nombre ?? ""}: ${a.cartilla_vacunacion?.tipo_vacuna ?? "Vacuna"}`).join(" · ")}
              {alertasVac.length > 2 ? ` y ${alertasVac.length - 2} más` : ""}
            </p>
          </div>
          <Link href={`/portal/mascotas/${alertasVac[0].id_mascota}/cartilla`}
            style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.75rem", fontWeight:700, color:"#dc2626", textDecoration:"none", whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:"4px" }}>
            Ver <ChevronRight size={12} />
          </Link>
        </div>
      )}

      {/* Seguimientos */}
      {seguimientos.length > 0 && (
        <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"12px 16px", borderRadius:"12px", background:"rgba(217,119,6,0.07)", border:"1px solid rgba(217,119,6,0.25)" }}>
          <Clock size={16} style={{ color:"#d97706", flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <p style={{ fontFamily:"var(--font-dm-sans)", fontWeight:700, color:"#b45309", margin:0, fontSize:"0.85rem" }}>
              {seguimientos.length} control{seguimientos.length > 1 ? "es" : ""} médico{seguimientos.length > 1 ? "s" : ""} pendiente{seguimientos.length > 1 ? "s" : ""}
            </p>
            <p style={{ fontFamily:"var(--font-dm-sans)", color:"#92400e", margin:0, fontSize:"0.78rem" }}>
              Tu veterinario solicitó un control de seguimiento. Agenda tu cita.
            </p>
          </div>
          <button onClick={onGoSeguimientos}
            style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.75rem", fontWeight:700, color:"#d97706", background:"none", border:"none", cursor:"pointer", whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:"4px", padding:0 }}>
            Ver <ChevronRight size={12} />
          </button>
        </div>
      )}

      <button onClick={() => setHidden(true)}
        style={{ alignSelf:"flex-end", background:"none", border:"none", cursor:"pointer", color:"#a89a80", fontFamily:"var(--font-dm-sans)", fontSize:"0.72rem", padding:"2px 0", display:"flex", alignItems:"center", gap:"4px" }}>
        <X size={11} /> Cerrar avisos
      </button>
    </div>
  );
}
