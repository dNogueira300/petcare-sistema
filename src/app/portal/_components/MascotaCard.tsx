"use client";

import Link from "next/link";
import { Pencil, Syringe, Activity } from "lucide-react";
import {
  type MascotaRow, type AtencionPortal,
  estadoAtencionLabel, estadoAtencionColor,
  ESPECIE_ICONS, calcEdad,
} from "../_types";

const SEXO_LABEL: Record<string, string> = { macho: "Macho", hembra: "Hembra" };

interface Props {
  m: MascotaRow;
  onEdit: (m: MascotaRow) => void;
  atencionActiva?: AtencionPortal;
}

export function MascotaCard({ m, onEdit, atencionActiva }: Props) {
  const estadoActual = atencionActiva?.estado_actual;
  const estadoLabel  = estadoActual ? estadoAtencionLabel[estadoActual] : null;
  const estadoColor  = estadoActual ? estadoAtencionColor[estadoActual] : null;

  return (
    <div
      style={{
        background: "#fff",
        border: estadoLabel ? `1.5px solid ${estadoColor}60` : "1px solid #e8e0d0",
        borderRadius: "16px", padding: "24px",
        display: "flex", flexDirection: "column", gap: "12px",
        boxShadow: estadoLabel ? `0 4px 16px ${estadoColor}20` : "0 2px 8px rgba(26,18,8,0.06)",
        transition: "all 0.2s",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = "0 8px 24px rgba(26,18,8,0.12)";
        el.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = estadoLabel ? `0 4px 16px ${estadoColor}20` : "0 2px 8px rgba(26,18,8,0.06)";
        el.style.transform = "translateY(0)";
      }}
    >
      {/* Atención activa badge */}
      {estadoLabel && estadoColor && (
        <div style={{ display:"flex", alignItems:"center", gap:"6px", padding:"6px 10px", borderRadius:"8px", background:`${estadoColor}12`, border:`1px solid ${estadoColor}30` }}>
          <Activity size={11} style={{ color: estadoColor }} />
          <span style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.72rem", fontWeight:700, color:estadoColor }}>{estadoLabel}</span>
        </div>
      )}

      <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
        <div style={{ width:"56px", height:"56px", borderRadius:"14px", background:"linear-gradient(135deg,#f0fdf4,#dcfce7)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.8rem", flexShrink:0 }}>
          {ESPECIE_ICONS[m.especie] ?? "🐾"}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontFamily:"var(--font-fraunces)", fontSize:"1.1rem", fontWeight:700, color:"#1a1208", margin:0 }}>{m.nombre}</p>
          <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.82rem", color:"#8a7a60", margin:0 }}>
            {m.especie}{m.raza ? ` · ${m.raza}` : ""}{m.color ? ` · ${m.color}` : ""}
          </p>
        </div>
        <button onClick={() => onEdit(m)} title="Editar mascota"
          style={{ background:"#faf6ef", border:"1px solid #e8e0d0", borderRadius:"9px", width:"34px", height:"34px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#6b5c44", flexShrink:0 }}>
          <Pencil size={14} />
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
        {[["Edad", calcEdad(m.fecha_nacimiento)], ["Sexo", m.sexo ? (SEXO_LABEL[m.sexo] ?? m.sexo) : "—"]].map(([l,v]) => (
          <div key={l} style={{ background:"#faf6ef", borderRadius:"8px", padding:"10px 12px" }}>
            <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.7rem", fontWeight:600, color:"#8a7a60", textTransform:"uppercase", letterSpacing:"0.08em", margin:0 }}>{l}</p>
            <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.9rem", fontWeight:600, color:"#1a1208", margin:0 }}>{v}</p>
          </div>
        ))}
      </div>

      <Link href={`/portal/mascotas/${m.id_mascota}/cartilla`}
        style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", background:"#f0fdf4", border:"1px solid #bbf7d0", color:"#16a34a", textDecoration:"none", padding:"8px", borderRadius:"9px", fontFamily:"var(--font-dm-sans)", fontSize:"0.78rem", fontWeight:600 }}>
        <Syringe size={12} /> Cartilla de vacunas
      </Link>
    </div>
  );
}
