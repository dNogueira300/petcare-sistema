"use client";

import { useEffect, useState, useCallback } from "react";
import { BarChart2, Users, PawPrint, CalendarDays, TrendingUp, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageLoading } from "@/components/ui/loading";
import { formatLima } from "@/utils/datetime";
import type { EstadoCita } from "@/types";

/* ═══ Types ═══ */
interface Resumen { total: number; por_estado: Record<string,number>; total_clientes: number; total_mascotas: number; }
interface VetRow { nombre: string; total: number; atendidas: number; canceladas: number; }
interface DiaRow { dia: string; cantidad: number; }
interface EspecieRow { especie: string; cantidad: number; }
interface CitaDetalle {
  id_cita: number; fecha: string; hora: string; motivo: string; estado: EstadoCita;
  mascotas: { nombre: string; especie: string; clientes: { usuarios: { nombre: string; apellido: string } } | null } | null;
  veterinarios: { usuarios: { nombre: string; apellido: string } } | null;
}
interface OrigenRow { origen: string; cantidad: number; }
interface ReportData { resumen: Resumen; por_veterinario: VetRow[]; por_dia: DiaRow[]; por_especie: EspecieRow[]; por_origen: OrigenRow[]; citas: CitaDetalle[]; }

interface VetOption { id_veterinario: number; usuarios: { nombre: string; apellido: string } }

const estadoLabels: Record<string, string> = { pendiente:"Pendiente", confirmada:"Confirmada", cancelada:"Cancelada", atendida:"Atendida" };
const estadoColors: Record<string, string> = { pendiente:"#f59e0b", confirmada:"#22c55e", cancelada:"#f43f5e", atendida:"#3b82f6" };

/* ═══ Bar chart component ═══ */
function BarChart({ data, maxVal, color = "#3d845b" }: { data: {label:string; value:number}[]; maxVal: number; color?: string }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
      {data.map(({ label, value }) => (
        <div key={label} style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <span style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.78rem", color:"#6b5c44", width:"90px",
            flexShrink:0, textAlign:"right", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
            {label}
          </span>
          <div style={{ flex:1, height:"22px", background:"#f0ead8", borderRadius:"4px", overflow:"hidden" }}>
            <div style={{ width: maxVal > 0 ? `${(value/maxVal)*100}%` : "0%", height:"100%",
              background: color, borderRadius:"4px", transition:"width 0.6s cubic-bezier(0.16,1,0.3,1)",
              display:"flex", alignItems:"center", justifyContent:"flex-end", paddingRight:"6px", minWidth: value>0?"24px":"0" }}>
              {value > 0 && <span style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.7rem", fontWeight:700, color:"#fff" }}>{value}</span>}
            </div>
          </div>
          {value === 0 && <span style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.78rem", color:"#c4b89c" }}>0</span>}
        </div>
      ))}
    </div>
  );
}

/* ═══ Stat card ═══ */
function StatCard({ icon: Icon, label, value, accent, accentBg }: { icon: React.ElementType; label: string; value: number | string; accent: string; accentBg: string }) {
  return (
    <div style={{ background:"var(--card-bg)", border:"1px solid var(--card-border)", borderRadius:"12px",
      padding:"20px", boxShadow:"0 1px 3px rgba(26,18,8,0.06)", display:"flex", alignItems:"center", gap:"16px" }}>
      <div style={{ width:"44px", height:"44px", borderRadius:"11px", background:accentBg,
        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Icon style={{ width:"20px", height:"20px", color:accent }} />
      </div>
      <div>
        <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.72rem", fontWeight:600, letterSpacing:"0.06em",
          textTransform:"uppercase", color:"#8a7a60", margin:0 }}>{label}</p>
        <p style={{ fontFamily:"var(--font-fraunces)", fontSize:"1.75rem", fontWeight:700, color:"#1a1208",
          lineHeight:1.1, margin:0 }}>{value}</p>
      </div>
    </div>
  );
}

/* ═══ Page ═══ */
export default function ReportesPage() {
  const today = new Date().toISOString().slice(0,10);
  const firstOfMonth = `${today.slice(0,7)}-01`;

  const [filters, setFilters] = useState({ desde:firstOfMonth, hasta:today, estado:"", id_veterinario:"" });
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [vets, setVets] = useState<VetOption[]>([]);
  const [citaPage, setCitaPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetch("/api/veterinarios").then(r=>r.json()).then(j=>setVets(j.data ?? []));
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ desde:filters.desde, hasta:filters.hasta });
    if (filters.estado) p.set("estado", filters.estado);
    if (filters.id_veterinario) p.set("id_veterinario", filters.id_veterinario);
    const res = await fetch(`/api/reportes?${p}`);
    const json = await res.json();
    setData(json);
    setCitaPage(1);
    setLoading(false);
  }, [filters]);

  useEffect(() => { loadData(); }, [loadData]);

  const setFilter = (k: keyof typeof filters, v: string) => setFilters(f => ({ ...f, [k]:v }));

  if (loading || !data) return <PageLoading />;

  const { resumen, por_veterinario, por_dia, por_especie, citas } = data;
  const maxVet = Math.max(...por_veterinario.map(v=>v.total), 1);
  const maxDia = Math.max(...por_dia.map(d=>d.cantidad), 1);

  const pagedCitas = citas.slice((citaPage-1)*PAGE_SIZE, citaPage*PAGE_SIZE);
  const totalPages = Math.ceil(citas.length / PAGE_SIZE);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"24px" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-sm text-gray-500">Estadísticas y análisis del sistema</p>
        </div>
        <button onClick={loadData} style={{ display:"flex", alignItems:"center", gap:"6px",
          background:"#0a1a11", color:"#fff", border:"none", cursor:"pointer", padding:"9px 18px",
          borderRadius:"9px", fontFamily:"var(--font-dm-sans)", fontSize:"0.82rem", fontWeight:600 }}>
          <TrendingUp size={14} /> Actualizar
        </button>
      </div>

      {/* Filters */}
      <div style={{ background:"var(--card-bg)", border:"1px solid var(--card-border)", borderRadius:"12px",
        padding:"18px 20px", display:"flex", flexWrap:"wrap", gap:"14px", alignItems:"flex-end" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"6px", color:"#6b5c44", marginBottom:"2px", flex:"0 0 auto" }}>
          <Filter size={14} />
          <span style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.78rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em" }}>Filtros</span>
        </div>
        {[["desde","Desde","date"], ["hasta","Hasta","date"]].map(([k,l,t])=>(
          <div key={k}>
            <label style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.72rem", fontWeight:600, color:"#6b5c44",
              textTransform:"uppercase", letterSpacing:"0.07em", display:"block", marginBottom:"4px" }}>{l}</label>
            <input type={t} value={filters[k as keyof typeof filters]}
              onChange={e=>setFilter(k as keyof typeof filters, e.target.value)}
              style={{ height:"36px", border:"1.5px solid var(--input-border)", borderRadius:"8px",
                padding:"0 10px", fontFamily:"var(--font-dm-sans)", fontSize:"0.82rem",
                background:"var(--input-bg)", color:"#1a1208", outline:"none" }} />
          </div>
        ))}
        <div>
          <label style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.72rem", fontWeight:600, color:"#6b5c44",
            textTransform:"uppercase", letterSpacing:"0.07em", display:"block", marginBottom:"4px" }}>Estado</label>
          <select value={filters.estado} onChange={e=>setFilter("estado", e.target.value)}
            style={{ height:"36px", border:"1.5px solid var(--input-border)", borderRadius:"8px",
              padding:"0 10px", fontFamily:"var(--font-dm-sans)", fontSize:"0.82rem",
              background:"var(--input-bg)", color:"#1a1208", outline:"none", minWidth:"140px" }}>
            <option value="">Todos los estados</option>
            {["pendiente","confirmada","cancelada","atendida"].map(e=>(
              <option key={e} value={e}>{estadoLabels[e]}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.72rem", fontWeight:600, color:"#6b5c44",
            textTransform:"uppercase", letterSpacing:"0.07em", display:"block", marginBottom:"4px" }}>Veterinario</label>
          <select value={filters.id_veterinario} onChange={e=>setFilter("id_veterinario", e.target.value)}
            style={{ height:"36px", border:"1.5px solid var(--input-border)", borderRadius:"8px",
              padding:"0 10px", fontFamily:"var(--font-dm-sans)", fontSize:"0.82rem",
              background:"var(--input-bg)", color:"#1a1208", outline:"none", minWidth:"160px" }}>
            <option value="">Todos los veterinarios</option>
            {vets.map(v=>(
              <option key={v.id_veterinario} value={v.id_veterinario}>
                {v.usuarios.nombre} {v.usuarios.apellido}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CalendarDays} label="Total citas" value={resumen.total} accent="#c48c34" accentBg="#fdf3dc" />
        <StatCard icon={TrendingUp} label="Atendidas" value={resumen.por_estado.atendida ?? 0} accent="#3d845b" accentBg="#f0fdf4" />
        <StatCard icon={Users} label="Clientes" value={resumen.total_clientes} accent="#2e6fa8" accentBg="#eff6ff" />
        <StatCard icon={PawPrint} label="Mascotas" value={resumen.total_mascotas} accent="#8a5a9a" accentBg="#faf5ff" />
      </div>

      {/* Charts row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" }}>

        {/* Estado de citas */}
        <div style={{ background:"var(--card-bg)", border:"1px solid var(--card-border)", borderRadius:"12px",
          padding:"22px", boxShadow:"0 1px 3px rgba(26,18,8,0.06)" }}>
          <p style={{ fontFamily:"var(--font-fraunces)", fontWeight:600, fontStyle:"italic", fontSize:"1rem",
            color:"#1a1208", margin:"0 0 20px" }}>Citas por estado</p>
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            {Object.entries(resumen.por_estado).map(([estado, cantidad]) => {
              const pct = resumen.total > 0 ? Math.round((cantidad/resumen.total)*100) : 0;
              return (
                <div key={estado}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
                    <span style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.82rem", color:"#4a3d2e", fontWeight:500 }}>
                      {estadoLabels[estado]}
                    </span>
                    <span style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.82rem", fontWeight:700, color:"#1a1208" }}>
                      {cantidad} <span style={{ fontWeight:400, color:"#8a7a60" }}>({pct}%)</span>
                    </span>
                  </div>
                  <div style={{ height:"10px", background:"#f0ead8", borderRadius:"99px", overflow:"hidden" }}>
                    <div style={{ width:`${pct}%`, height:"100%", background:estadoColors[estado] ?? "#3d845b",
                      borderRadius:"99px", transition:"width 0.7s cubic-bezier(0.16,1,0.3,1)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Por veterinario */}
        <div style={{ background:"var(--card-bg)", border:"1px solid var(--card-border)", borderRadius:"12px",
          padding:"22px", boxShadow:"0 1px 3px rgba(26,18,8,0.06)" }}>
          <p style={{ fontFamily:"var(--font-fraunces)", fontWeight:600, fontStyle:"italic", fontSize:"1rem",
            color:"#1a1208", margin:"0 0 20px" }}>Citas por veterinario</p>
          {por_veterinario.length === 0
            ? <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.85rem", color:"#a89a80" }}>Sin datos</p>
            : <BarChart data={por_veterinario.map(v=>({ label:v.nombre.split(" ").slice(0,2).join(" "), value:v.total }))} maxVal={maxVet} />
          }
        </div>

        {/* Por día de semana */}
        <div style={{ background:"var(--card-bg)", border:"1px solid var(--card-border)", borderRadius:"12px",
          padding:"22px", boxShadow:"0 1px 3px rgba(26,18,8,0.06)" }}>
          <p style={{ fontFamily:"var(--font-fraunces)", fontWeight:600, fontStyle:"italic", fontSize:"1rem",
            color:"#1a1208", margin:"0 0 20px" }}>Citas por día de semana</p>
          <BarChart data={por_dia.filter(d=>d.dia!=="Domingo").map(d=>({ label:d.dia, value:d.cantidad }))} maxVal={maxDia} color="#c48c34" />
        </div>

        {/* Por especie */}
        <div style={{ background:"var(--card-bg)", border:"1px solid var(--card-border)", borderRadius:"12px",
          padding:"22px", boxShadow:"0 1px 3px rgba(26,18,8,0.06)" }}>
          <p style={{ fontFamily:"var(--font-fraunces)", fontWeight:600, fontStyle:"italic", fontSize:"1rem",
            color:"#1a1208", margin:"0 0 20px" }}>Citas por especie</p>
          {por_especie.length === 0
            ? <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.85rem", color:"#a89a80" }}>Sin datos</p>
            : <BarChart data={por_especie.map(e=>({ label:e.especie, value:e.cantidad }))} maxVal={Math.max(...por_especie.map(e=>e.cantidad), 1)} color="#8a5a9a" />
          }
        </div>

        {/* Por origen */}
        <div style={{ background:"var(--card-bg)", border:"1px solid var(--card-border)", borderRadius:"12px",
          padding:"22px", boxShadow:"0 1px 3px rgba(26,18,8,0.06)", gridColumn:"1 / -1" }}>
          <p style={{ fontFamily:"var(--font-fraunces)", fontWeight:600, fontStyle:"italic", fontSize:"1rem",
            color:"#1a1208", margin:"0 0 20px" }}>Origen de las citas</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"24px", alignItems:"center" }}>
            {(data.por_origen ?? []).map((o) => {
              const pct = data.resumen.total > 0 ? Math.round((o.cantidad / data.resumen.total) * 100) : 0;
              const color = o.origen.startsWith("Portal") ? "#c48c34" : "#3d845b";
              const bg    = o.origen.startsWith("Portal") ? "#fdf3dc" : "#f0fdf4";
              return (
                <div key={o.origen} style={{ display:"flex", alignItems:"center", gap:"16px",
                  background:bg, borderRadius:"12px", padding:"16px 24px", flex:"1", minWidth:"220px" }}>
                  <div style={{ width:"52px", height:"52px", borderRadius:"50%",
                    background: color + "22", border:`2px solid ${color}40`,
                    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span style={{ fontFamily:"var(--font-fraunces)", fontSize:"1.1rem",
                      fontWeight:700, color }}>{pct}%</span>
                  </div>
                  <div>
                    <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.72rem", fontWeight:700,
                      textTransform:"uppercase", letterSpacing:"0.08em", color:"#8a7a60", margin:0 }}>
                      {o.origen}
                    </p>
                    <p style={{ fontFamily:"var(--font-fraunces)", fontSize:"1.6rem", fontWeight:700,
                      color, margin:0, lineHeight:1.1 }}>{o.cantidad}</p>
                    <p style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.75rem", color:"#8a7a60", margin:0 }}>
                      {o.cantidad === 1 ? "cita" : "citas"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Vet detail table */}
      {por_veterinario.length > 0 && (
        <div style={{ background:"var(--card-bg)", border:"1px solid var(--card-border)", borderRadius:"12px",
          overflow:"hidden", boxShadow:"0 1px 3px rgba(26,18,8,0.06)" }}>
          <div style={{ padding:"18px 20px", borderBottom:"1px solid var(--card-border)" }}>
            <p style={{ fontFamily:"var(--font-fraunces)", fontWeight:600, fontStyle:"italic", fontSize:"1rem",
              color:"#1a1208", margin:0 }}>Resumen por veterinario</p>
          </div>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.85rem" }}>
            <thead>
              <tr style={{ background:"#f9f6f0" }}>
                {["Veterinario","Total","Atendidas","Canceladas","Tasa de atención"].map(h=>(
                  <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontFamily:"var(--font-dm-sans)",
                    fontWeight:600, color:"#6b5c44", fontSize:"0.78rem", textTransform:"uppercase",
                    letterSpacing:"0.06em", borderBottom:"1px solid var(--card-border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {por_veterinario.map((v,i) => {
                const tasa = v.total > 0 ? Math.round((v.atendidas/v.total)*100) : 0;
                return (
                  <tr key={i} style={{ borderBottom:"1px solid #f5f0e8" }}>
                    <td style={{ padding:"13px 16px", fontFamily:"var(--font-dm-sans)", fontWeight:600, color:"#1a1208" }}>{v.nombre}</td>
                    <td style={{ padding:"13px 16px", fontFamily:"var(--font-dm-sans)", color:"#1a1208", fontWeight:700 }}>{v.total}</td>
                    <td style={{ padding:"13px 16px", fontFamily:"var(--font-dm-sans)", color:"#16a34a" }}>{v.atendidas}</td>
                    <td style={{ padding:"13px 16px", fontFamily:"var(--font-dm-sans)", color:"#dc2626" }}>{v.canceladas}</td>
                    <td style={{ padding:"13px 16px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                        <div style={{ flex:1, height:"6px", background:"#e8e0d0", borderRadius:"99px" }}>
                          <div style={{ width:`${tasa}%`, height:"100%", background:"#3d845b", borderRadius:"99px" }} />
                        </div>
                        <span style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.78rem", fontWeight:600, color:"#3d845b", flexShrink:0 }}>{tasa}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Citas table */}
      <div style={{ background:"var(--card-bg)", border:"1px solid var(--card-border)", borderRadius:"12px",
        overflow:"hidden", boxShadow:"0 1px 3px rgba(26,18,8,0.06)" }}>
        <div style={{ padding:"18px 20px", borderBottom:"1px solid var(--card-border)", display:"flex",
          justifyContent:"space-between", alignItems:"center" }}>
          <p style={{ fontFamily:"var(--font-fraunces)", fontWeight:600, fontStyle:"italic", fontSize:"1rem",
            color:"#1a1208", margin:0 }}>Detalle de citas</p>
          <span style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.78rem", color:"#8a7a60" }}>
            {citas.length} registros
          </span>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.84rem" }}>
            <thead>
              <tr style={{ background:"#f9f6f0" }}>
                {["Fecha","Hora","Mascota","Propietario","Veterinario","Motivo","Estado"].map(h=>(
                  <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontFamily:"var(--font-dm-sans)",
                    fontWeight:600, color:"#6b5c44", fontSize:"0.75rem", textTransform:"uppercase",
                    letterSpacing:"0.06em", borderBottom:"1px solid var(--card-border)", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedCitas.length === 0
                ? <tr><td colSpan={7} style={{ padding:"40px", textAlign:"center", color:"#a89a80", fontFamily:"var(--font-dm-sans)" }}>Sin resultados para los filtros seleccionados</td></tr>
                : pagedCitas.map((c) => (
                  <tr key={c.id_cita} style={{ borderBottom:"1px solid #f5f0e8" }} className="hover:bg-petcare-50/30">
                    <td style={{ padding:"11px 14px", fontFamily:"var(--font-dm-sans)", color:"#1a1208", whiteSpace:"nowrap" }}>
                      {formatLima(`${c.fecha}T00:00:00`, "dd/MM/yyyy")}
                    </td>
                    <td style={{ padding:"11px 14px", fontFamily:"var(--font-dm-sans)", color:"#1a1208" }}>{c.hora.slice(0,5)}</td>
                    <td style={{ padding:"11px 14px", fontFamily:"var(--font-dm-sans)", color:"#1a1208" }}>{c.mascotas?.nombre ?? "—"}</td>
                    <td style={{ padding:"11px 14px", fontFamily:"var(--font-dm-sans)", color:"#6b5c44" }}>
                      {c.mascotas?.clientes ? `${c.mascotas.clientes.usuarios?.nombre ?? ""} ${c.mascotas.clientes.usuarios?.apellido ?? ""}`.trim() : "—"}
                    </td>
                    <td style={{ padding:"11px 14px", fontFamily:"var(--font-dm-sans)", color:"#6b5c44", whiteSpace:"nowrap" }}>
                      {c.veterinarios ? `${c.veterinarios.usuarios.nombre} ${c.veterinarios.usuarios.apellido}` : "—"}
                    </td>
                    <td style={{ padding:"11px 14px", fontFamily:"var(--font-dm-sans)", color:"#1a1208", maxWidth:"180px",
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={c.motivo}>{c.motivo}</td>
                    <td style={{ padding:"11px 14px" }}><Badge variant={c.estado}>{estadoLabels[c.estado] ?? c.estado}</Badge></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div style={{ padding:"14px 20px", borderTop:"1px solid var(--card-border)", display:"flex",
            justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontFamily:"var(--font-dm-sans)", fontSize:"0.8rem", color:"#8a7a60" }}>
              Página {citaPage} de {totalPages} · {citas.length} citas
            </span>
            <div style={{ display:"flex", gap:"6px" }}>
              <button onClick={() => setCitaPage(p=>Math.max(1,p-1))} disabled={citaPage<=1}
                style={{ padding:"6px 12px", borderRadius:"7px", border:"1px solid #e5e7eb",
                  background: citaPage<=1 ? "#f9fafb" : "#fff", cursor: citaPage<=1 ? "default" : "pointer",
                  fontFamily:"var(--font-dm-sans)", fontSize:"0.8rem", color: citaPage<=1 ? "#c4b89c" : "#1a1208",
                  opacity: citaPage<=1 ? 0.5 : 1 }}>← Anterior</button>
              <button onClick={() => setCitaPage(p=>Math.min(totalPages,p+1))} disabled={citaPage>=totalPages}
                style={{ padding:"6px 12px", borderRadius:"7px", border:"1px solid #e5e7eb",
                  background: citaPage>=totalPages ? "#f9fafb" : "#fff", cursor: citaPage>=totalPages ? "default" : "pointer",
                  fontFamily:"var(--font-dm-sans)", fontSize:"0.8rem", color: citaPage>=totalPages ? "#c4b89c" : "#1a1208",
                  opacity: citaPage>=totalPages ? 0.5 : 1 }}>Siguiente →</button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
