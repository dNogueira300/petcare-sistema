"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart3, FileText, FileSearch, FileDown, RefreshCw,
  Calendar, ShieldX, TrendingUp, Users, CheckCircle2, XCircle,
  Clock, Syringe, AlertTriangle, BarChart2, CalendarDays,
} from "lucide-react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, PointElement, LineElement, Title, Tooltip, Legend,
} from "chart.js";
import { Bar, Pie, Doughnut } from "react-chartjs-2";
import { Badge } from "@/components/ui/badge";
import { PageLoading } from "@/components/ui/loading";
import { formatLima } from "@/utils/datetime";
import type { ReportData, VetOption } from "@/types/reportes";
import { useAuth } from "@/hooks/useAuth";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend);

// ── Tipos ─────────────────────────────────────────────────────────────────────
type Periodo  = "dia" | "semana" | "mes" | "anio";
type ActiveTab = "analitica" | "auditoria";

interface AnaliticaData {
  kpis: { total_citas:number; citas_atendidas:number; citas_canceladas:number; tasa_cancelacion:number; tasa_atencion:number; total_vacunas:number; total_historias:number; nuevas_mascotas:number; seguimientos_pendientes:number; alertas_vacunas_activas:number; atenciones_activas:number };
  por_estado: { pendiente:number; confirmada:number; cancelada:number; atendida:number };
  por_veterinario: { nombre:string; total:number; atendidas:number; canceladas:number }[];
  por_especie: { especie:string; cantidad:number }[];
  por_dia: { dia:string; cantidad:number }[];
  evolucion_semanal: { semana:string; total:number; atendidas:number; canceladas:number }[];
  triajes_por_urgencia: { normal:number; urgente:number; emergencia:number };
  seguimientos_por_estado: { pendiente:number; sugerencia_enviada:number; completado:number; no_presentado:number };
}

type AudRow = {
  id_auditoria: number; id_historia: number;
  tipo_cambio: "INSERT" | "UPDATE"; timestamp_cambio: string;
  diagnostico_anterior?:string|null; diagnostico_nuevo?:string|null;
  tratamiento_anterior?:string|null;  tratamiento_nuevo?:string|null;
  observaciones_anterior?:string|null; observaciones_nuevo?:string|null;
  peso_anterior?:number|null; peso_nuevo?:number|null; razon_cambio?:string|null;
  usuarios?: { nombre:string; apellido:string; rol:string } | null;
  historia_clinica?: { fecha_consulta?:string; mascotas?:{nombre:string;especie:string}|null; veterinarios?:{usuarios?:{nombre:string;apellido:string}}|null } | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function periodoToRange(p: Periodo): { desde: string; hasta: string } {
  const hoy = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const hasta = fmt(hoy);
  if (p === "dia")    return { desde: hasta, hasta };
  if (p === "semana") { const d = new Date(hoy); d.setDate(hoy.getDate()-6); return { desde: fmt(d), hasta }; }
  if (p === "anio")   { const d = new Date(hoy); d.setFullYear(hoy.getFullYear()-1); return { desde: fmt(d), hasta }; }
  return { desde: `${hasta.slice(0,7)}-01`, hasta }; // mes
}

function periodoToApiParam(p: Periodo): string {
  return p === "anio" ? "anio" : p === "semana" ? "mes" : p === "dia" ? "mes" : "mes";
}

const FONT = "var(--font-dm-sans)";
const tooltipCfg = { backgroundColor:"#fff", borderColor:"#e5e7eb", borderWidth:1, titleColor:"#111827", bodyColor:"#6b7280", titleFont:{family:FONT,weight:700 as const,size:12}, bodyFont:{family:FONT,size:11}, padding:10 };
const hBarOpts = (max:number) => ({ indexAxis:"y" as const, responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false},tooltip:{...tooltipCfg}}, scales:{ x:{max:Math.ceil(max*1.2)||1, grid:{color:"#f3f4f6"}, ticks:{font:{family:FONT,size:11},color:"#9ca3af"}, border:{display:false}}, y:{grid:{display:false}, ticks:{font:{family:FONT,size:11},color:"#374151"}, border:{display:false}} } });
const vBarOpts = (stacked=false) => ({ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:"top" as const,labels:{font:{family:FONT,size:11},boxWidth:10,boxHeight:10,padding:14}},tooltip:{...tooltipCfg}}, scales:{ x:{stacked, grid:{display:false}, ticks:{font:{family:FONT,size:10},color:"#374151"}, border:{display:false}}, y:{stacked, grid:{color:"#f3f4f6"}, ticks:{font:{family:FONT,size:11},color:"#9ca3af"}, border:{display:false}} } });
const arcOpts = (cutout="0%") => ({ responsive:true, maintainAspectRatio:false, cutout, plugins:{legend:{position:"right" as const,labels:{font:{family:FONT,size:11},boxWidth:10,boxHeight:10,padding:10}},tooltip:{...tooltipCfg}} });

function KpiCard({ label, value, icon:Icon, color, suffix="", sub }: { label:string; value:number|string; icon:React.ElementType; color:string; suffix?:string; sub?:string }) {
  return (
    <div style={{ background:"#fff", border:"1px solid #e8f0eb", borderRadius:12, padding:"14px 16px", display:"flex", flexDirection:"column", gap:8, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
      <div style={{ width:32,height:32,borderRadius:8,background:`${color}15`,display:"flex",alignItems:"center",justifyContent:"center" }}><Icon size={15} style={{color}} /></div>
      <div>
        <p style={{ margin:0, fontSize:"1.5rem", fontWeight:800, color:"#111827", fontFamily:FONT, letterSpacing:"-0.03em", lineHeight:1 }}>
          {typeof value === "number" ? value.toLocaleString() : value}
          {suffix && <span style={{ fontSize:"0.95rem", fontWeight:600, color, marginLeft:2 }}>{suffix}</span>}
        </p>
        <p style={{ margin:"3px 0 0", fontSize:"0.72rem", color:"#6b7280", fontFamily:FONT }}>{label}</p>
        {sub && <p style={{ margin:"1px 0 0", fontSize:"0.68rem", color:"#6b7280", fontFamily:FONT }}>{sub}</p>}
      </div>
    </div>
  );
}

function ChartCard({ title, children, h=220 }: { title:string; children:React.ReactNode; h?:number }) {
  return (
    <div style={{ background:"#fff", border:"1px solid #e8f0eb", borderRadius:14, padding:"18px 20px", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
      <p style={{ margin:"0 0 16px", fontSize:"0.76rem", fontWeight:700, color:"#374151", fontFamily:FONT, textTransform:"uppercase", letterSpacing:"0.07em" }}>{title}</p>
      <div style={{ height:h }}>{children}</div>
    </div>
  );
}

function Skeleton({ h=120 }: { h?:number }) {
  return <div style={{ height:h, borderRadius:12, background:"linear-gradient(90deg,#f3f4f6,#e8f0eb,#f3f4f6)", backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite" }} />;
}

// ── Comparativa mes a mes (Flujo B) ─────────────────────────────────────────
function ComparativaPanel({ vets }: { vets: VetOption[] }) {
  const [mesA, setMesA] = useState(() => { const hoy=new Date(); return `${hoy.getFullYear()}-${String(hoy.getMonth()).padStart(2,"0")}`; });
  const [mesB, setMesB] = useState(() => { const hoy=new Date(); return `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}`; });
  const [dataA, setDataA] = useState<ReportData|null>(null);
  const [dataB, setDataB] = useState<ReportData|null>(null);
  const [loading, setLoading] = useState(false);
  const [idVet, setIdVet] = useState("");

  const comparar = () => {
    setLoading(true);
    const buildUrl = (mes:string) => {
      const [y,m]=mes.split("-").map(Number);
      const desde=`${y}-${String(m).padStart(2,"0")}-01`;
      const until=new Date(y,m,0);
      const hasta=`${until.getFullYear()}-${String(until.getMonth()+1).padStart(2,"0")}-${String(until.getDate()).padStart(2,"0")}`;
      const p=new URLSearchParams({desde,hasta});
      if (idVet) p.set("id_veterinario",idVet);
      return `/api/reportes?${p}`;
    };
    Promise.all([fetch(buildUrl(mesA)).then(r=>r.json()), fetch(buildUrl(mesB)).then(r=>r.json())])
      .then(([jA,jB])=>{ setDataA(jA); setDataB(jB); setLoading(false); });
  };

  const kpiDef: {label:string; getValue:(d:ReportData|null)=>number}[] = [
    {label:"Total citas",     getValue:d=>d?.resumen?.total ?? 0},
    {label:"Atendidas",       getValue:d=>d?.resumen?.por_estado?.atendida ?? 0},
    {label:"Canceladas",      getValue:d=>d?.resumen?.por_estado?.cancelada ?? 0},
    {label:"Pendientes",      getValue:d=>d?.resumen?.por_estado?.pendiente ?? 0},
  ];

  return (
    <div style={{ background:"#fff", border:"1px solid #e8f0eb", borderRadius:14, padding:"20px 22px" }}>
      <h2 style={{ margin:"0 0 16px", fontSize:"0.85rem", fontWeight:700, color:"#374151", fontFamily:FONT }}>Comparativa mes a mes (Flujo B)</h2>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:14, alignItems:"flex-end" }}>
        <div><label htmlFor="cmp-mesA" style={{ display:"block", fontSize:"0.7rem", fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:FONT, marginBottom:5 }}>Período A</label>
          <input id="cmp-mesA" type="month" value={mesA} onChange={e=>setMesA(e.target.value)} style={{ height:36, borderRadius:8, border:"1.5px solid #d1d5db", padding:"0 10px", fontFamily:FONT, fontSize:"0.85rem", outline:"none" }} /></div>
        <div><label htmlFor="cmp-mesB" style={{ display:"block", fontSize:"0.7rem", fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:FONT, marginBottom:5 }}>Período B</label>
          <input id="cmp-mesB" type="month" value={mesB} onChange={e=>setMesB(e.target.value)} style={{ height:36, borderRadius:8, border:"1.5px solid #d1d5db", padding:"0 10px", fontFamily:FONT, fontSize:"0.85rem", outline:"none" }} /></div>
        <div><label htmlFor="cmp-vet" style={{ display:"block", fontSize:"0.7rem", fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:FONT, marginBottom:5 }}>Veterinario (opcional)</label>
          <select id="cmp-vet" value={idVet} onChange={e=>setIdVet(e.target.value)} style={{ height:36, borderRadius:8, border:"1.5px solid #d1d5db", padding:"0 10px", fontFamily:FONT, fontSize:"0.85rem", outline:"none", minWidth:160 }}>
            <option value="">Todos</option>
            {vets.map(v=><option key={v.id_veterinario} value={v.id_veterinario}>{v.usuarios.nombre} {v.usuarios.apellido}</option>)}
          </select></div>
        <button onClick={comparar} style={{ height:36, padding:"0 18px", borderRadius:8, border:"none", background:"linear-gradient(135deg,#3d845b,#2d6446)", color:"#fff", fontFamily:FONT, fontSize:"0.82rem", fontWeight:700, cursor:"pointer" }}>
          {loading ? "Comparando…" : "Comparar →"}
        </button>
      </div>
      {(dataA || dataB) && (
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:FONT }}>
            <thead>
              <tr style={{ background:"#f9fafb" }}>
                <th style={{ padding:"8px 12px", textAlign:"left", fontSize:"0.72rem", fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.06em" }}>Métrica</th>
                <th style={{ padding:"8px 12px", textAlign:"right", fontSize:"0.72rem", fontWeight:700, color:"#2563eb" }}>{mesA}</th>
                <th style={{ padding:"8px 12px", textAlign:"right", fontSize:"0.72rem", fontWeight:700, color:"#7c3aed" }}>{mesB}</th>
                <th style={{ padding:"8px 12px", textAlign:"right", fontSize:"0.72rem", fontWeight:700, color:"#374151" }}>Δ Cambio</th>
              </tr>
            </thead>
            <tbody>
              {kpiDef.map(({label,getValue}) => {
                const vA=getValue(dataA), vB=getValue(dataB), delta=vB-vA;
                return (
                  <tr key={label} style={{ borderTop:"1px solid #f3f4f6" }}>
                    <td style={{ padding:"8px 12px", fontSize:"0.82rem", color:"#374151", fontWeight:500 }}>{label}</td>
                    <td style={{ padding:"8px 12px", fontSize:"0.88rem", fontWeight:700, color:"#2563eb", textAlign:"right" }}>{vA}</td>
                    <td style={{ padding:"8px 12px", fontSize:"0.88rem", fontWeight:700, color:"#7c3aed", textAlign:"right" }}>{vB}</td>
                    <td style={{ padding:"8px 12px", textAlign:"right" }}>
                      <span style={{ fontSize:"0.82rem", fontWeight:700, color: delta>0?"#dc2626":delta<0?"#15803d":"#6b7280" }}>
                        {delta>0?"+":""}{delta}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ReportesPage() {
  const { user } = useAuth();
  const [tab, setTab]           = useState<ActiveTab>("analitica");
  const [periodo, setPeriodo]   = useState<Periodo>("mes");
  const [filterVet, setFilterVet] = useState("");
  const [loading, setLoading]   = useState(true);

  // Datos analítica
  const [analitica, setAnalitica] = useState<AnaliticaData|null>(null);

  // Datos citas (reportes)
  const [citas, setCitas]       = useState<ReportData|null>(null);
  const [citasLoading, setCitasLoading] = useState(false);
  const [vets, setVets]         = useState<VetOption[]>([]);
  const [mascotas, setMascotas] = useState<{id_mascota:number;nombre:string;especie:string}[]>([]);
  const [citaPage, setCitaPage] = useState(1);
  const PAGE_SIZE = 10;

  // Datos auditoría
  const [audFiltros, setAudFiltros] = useState({ id_mascota:"", id_veterinario:"", desde:"", hasta:"" });
  const [audData, setAudData]     = useState<AudRow[]>([]);
  const [audLoading, setAudLoading] = useState(false);
  const [audBuscado, setAudBuscado] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  if (user && user.rol !== "administrador") {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", gap:16 }}>
        <div style={{ width:56,height:56,borderRadius:"50%",background:"rgba(220,38,38,0.08)",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <ShieldX size={28} style={{color:"#dc2626"}} />
        </div>
        <p style={{ margin:0, fontWeight:700, fontSize:"1rem", color:"#111827", fontFamily:FONT }}>Acceso restringido</p>
        <p style={{ margin:0, fontSize:"0.85rem", color:"#6b7280", fontFamily:FONT }}>Solo el administrador puede acceder a los reportes.</p>
      </div>
    );
  }

  // ── Carga de catálogos ──────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch("/api/veterinarios").then(r=>r.json()),
      fetch("/api/mascotas").then(r=>r.json()),
    ]).then(([jV,jM])=>{ setVets(jV.data??[]); setMascotas(jM.data??[]); });
  }, []);

  // ── Carga de analítica ──────────────────────────────────────────────────────
  const loadAnalitica = useCallback(() => {
    setLoading(true);
    const apiPeriodo = periodoToApiParam(periodo);
    const url = `/api/analitica?periodo=${apiPeriodo}`;
    fetch(url).then(r=>r.json()).then(j=>{ setAnalitica(j); setLoading(false); }).catch(()=>setLoading(false));
  }, [periodo]);

  useEffect(() => { if (tab==="analitica") loadAnalitica(); }, [tab, loadAnalitica]);

  // ── Carga de citas ──────────────────────────────────────────────────────────
  const loadCitas = useCallback(() => {
    setCitasLoading(true);
    const { desde, hasta } = periodoToRange(periodo);
    const p = new URLSearchParams({ desde, hasta });
    if (filterVet) p.set("id_veterinario", filterVet);
    fetch(`/api/reportes?${p}`).then(r=>r.json()).then(j=>{ setCitas(j); setCitaPage(1); setCitasLoading(false); }).catch(()=>setCitasLoading(false));
  }, [periodo, filterVet]);

  // loadCitas disponible para exportVetPdf/exportPdfCitas aunque no hay tab de citas

  // ── Buscar auditoría ────────────────────────────────────────────────────────
  const buscarAuditoria = () => {
    setAudLoading(true);
    const p = new URLSearchParams();
    if (audFiltros.id_mascota)     p.set("id_mascota",    audFiltros.id_mascota);
    if (audFiltros.id_veterinario) p.set("id_veterinario",audFiltros.id_veterinario);
    if (audFiltros.desde)          p.set("desde",         audFiltros.desde);
    if (audFiltros.hasta)          p.set("hasta",         audFiltros.hasta);
    fetch(`/api/auditoria/historia-clinica?${p}`)
      .then(r=>r.json()).then(j=>{ setAudData(j.data??[]); setAudBuscado(true); setAudLoading(false); })
      .catch(()=>setAudLoading(false));
  };

  // ── Exportar CSV ────────────────────────────────────────────────────────────
  const exportCSV = () => {
    if (!analitica) return;
    const rows = [
      ["Métrica","Valor"],
      ["Total citas",String(analitica.kpis.total_citas)],
      ["Citas atendidas",String(analitica.kpis.citas_atendidas)],
      ["Citas canceladas",String(analitica.kpis.citas_canceladas)],
      ["Tasa de atención (%)",String(analitica.kpis.tasa_atencion)],
      ["Tasa de cancelación (%)",String(analitica.kpis.tasa_cancelacion)],
      ["Vacunas aplicadas",String(analitica.kpis.total_vacunas)],
      [], ["Citas por estado",""],
      ...Object.entries(analitica.por_estado).map(([k,v])=>[k,String(v)]),
      [], ["Veterinario","Total","Atendidas","Canceladas"],
      ...analitica.por_veterinario.map(v=>[v.nombre,String(v.total),String(v.atendidas),String(v.canceladas)]),
    ];
    const csv = rows.map(r=>r.map(c=>`"${c??""}"`) .join(",")).join("\n");
    const blob = new Blob(["﻿"+csv], {type:"text/csv;charset=utf-8;"});
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"),{href:url,download:`reporte-${periodo}-${new Date().toISOString().slice(0,10)}.csv`});
    a.click(); URL.revokeObjectURL(url);
  };

  // ── Exportar PDF general ────────────────────────────────────────────────────
  const exportPdfCitas = async () => {
    if (!citas) return;
    setPdfLoading(true);
    const { generarReportePDF } = await import("@/utils/reportePdf");
    const { desde, hasta } = periodoToRange(periodo);
    await generarReportePDF({ desde, hasta, estado:"", id_veterinario:filterVet }, citas, vets);
    setPdfLoading(false);
  };

  // ── Exportar PDF veterinario (Flujo C) ─────────────────────────────────────
  const exportVetPdf = async () => {
    if (!filterVet || !citas) return;
    const vet = vets.find(v=>v.id_veterinario.toString()===filterVet);
    if (!vet) return;
    setPdfLoading(true);
    const { generarReportePDF } = await import("@/utils/reportePdf");
    const { desde, hasta } = periodoToRange(periodo);
    await generarReportePDF({ desde, hasta, estado:"", id_veterinario:filterVet }, citas, vets);
    setPdfLoading(false);
  };

  // ── Exportar PDF auditoría ──────────────────────────────────────────────────
  const exportAudPdf = async () => {
    const { exportAuditoriaPdf } = await import("@/utils/auditoriaPdf");
    const mascotaN = mascotas.find(m=>m.id_mascota.toString()===audFiltros.id_mascota)?.nombre;
    const vetObj   = vets.find(v=>v.id_veterinario.toString()===audFiltros.id_veterinario);
    await exportAuditoriaPdf(audData, { mascota:mascotaN, veterinario:vetObj ? `${vetObj.usuarios.nombre} ${vetObj.usuarios.apellido}`:undefined, desde:audFiltros.desde||undefined, hasta:audFiltros.hasta||undefined });
  };

  // ── Charts datasets ─────────────────────────────────────────────────────────
  const A = analitica;
  const pieEstado = A ? { labels:["Atendidas","Confirmadas","Pendientes","Canceladas"], datasets:[{ data:[A.por_estado.atendida,A.por_estado.confirmada,A.por_estado.pendiente,A.por_estado.cancelada], backgroundColor:["#22c55e","#3b82f6","#f59e0b","#f43f5e"], borderWidth:2, borderColor:"#fff" }] } : null;
  const donutTriaje = A ? { labels:["Normal","Urgente","Emergencia"], datasets:[{ data:[A.triajes_por_urgencia.normal,A.triajes_por_urgencia.urgente,A.triajes_por_urgencia.emergencia], backgroundColor:["#22c55e","#f59e0b","#ef4444"], borderWidth:2, borderColor:"#fff" }] } : null;
  const barVet = A ? { labels:A.por_veterinario.slice(0,6).map(v=>v.nombre.split(" ")[0]), datasets:[{label:"Atendidas",data:A.por_veterinario.slice(0,6).map(v=>v.atendidas),backgroundColor:"#22c55e",borderRadius:4},{label:"Canceladas",data:A.por_veterinario.slice(0,6).map(v=>v.canceladas),backgroundColor:"#f43f5e",borderRadius:4}] } : null;
  const barSemanal = A ? { labels:A.evolucion_semanal.map(s=>s.semana), datasets:[{label:"Total",data:A.evolucion_semanal.map(s=>s.total),backgroundColor:"rgba(61,132,91,0.45)",borderColor:"#3d845b",borderWidth:2,borderRadius:3},{label:"Atendidas",data:A.evolucion_semanal.map(s=>s.atendidas),backgroundColor:"#22c55e",borderRadius:3},{label:"Canceladas",data:A.evolucion_semanal.map(s=>s.canceladas),backgroundColor:"#f43f5e",borderRadius:3}] } : null;
  const hEspecie = A ? { labels:A.por_especie.slice(0,7).map(e=>e.especie), datasets:[{label:"Citas",data:A.por_especie.slice(0,7).map(e=>e.cantidad),backgroundColor:["#3d845b","#0369a1","#7c3aed","#b45309","#0f766e","#dc2626","#9ca3af"],borderRadius:4}] } : null;
  const hDia = A ? { labels:A.por_dia.map(d=>d.dia), datasets:[{label:"Citas",data:A.por_dia.map(d=>d.cantidad),backgroundColor:"#3d845b",borderRadius:4}] } : null;
  const maxEsp = A ? Math.max(...A.por_especie.slice(0,7).map(e=>e.cantidad),1) : 1;
  const maxDia = A ? Math.max(...A.por_dia.map(d=>d.cantidad),1) : 1;

  const tabBtn = (id:ActiveTab, label:string, Icon:React.ElementType) => (
    <button onClick={()=>setTab(id)} style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 18px", borderRadius:9, border:"none", cursor:"pointer", fontFamily:FONT, fontSize:"0.85rem", fontWeight:tab===id?700:500, transition:"all 0.15s", background:tab===id?"#0a1a11":"transparent", color:tab===id?"#fff":"#6b5c44" }}>
      <Icon size={14} /> {label}
    </button>
  );

  const PERIODO_OPS: {val:Periodo;label:string}[] = [{val:"dia",label:"Hoy"},{val:"semana",label:"7 días"},{val:"mes",label:"Este mes"},{val:"anio",label:"Este año"}];

  // ── Citas paginadas ─────────────────────────────────────────────────────────
  const citasList = (citas?.citas ?? []) as { id_cita:number; fecha:string; hora:string; estado:string; mascotas:{ nombre:string;especie:string }|null; veterinarios:{ usuarios:{ nombre:string;apellido:string } }|null }[];
  const paged   = citasList.slice((citaPage-1)*PAGE_SIZE, citaPage*PAGE_SIZE);
  const totalPg = Math.ceil(citasList.length / PAGE_SIZE);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>

      {/* ── Header ── */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
        <div>
          <h1 style={{ margin:0, fontSize:"1.5rem", fontWeight:800, color:"#111827" }}>
            Reportes y Analítica
          </h1>
          <p style={{ margin:"3px 0 0", fontSize:"0.82rem", color:"#6b7280", fontFamily:FONT }}>
            KPIs operacionales, comparativas, citas detalladas y auditoría clínica
          </p>
        </div>
        {/* Selector de período */}
        <div style={{ display:"flex", border:"1px solid #e5e7eb", borderRadius:9, overflow:"hidden", background:"#fff" }}>
          {PERIODO_OPS.map(({val,label}) => (
            <button key={val} onClick={()=>setPeriodo(val)} style={{ padding:"7px 14px", border:"none", cursor:"pointer", fontSize:"0.78rem", fontWeight:600, fontFamily:FONT, background:periodo===val?"rgba(61,132,91,0.1)":"transparent", color:periodo===val?"#15803d":"#6b7280", borderRight:val!=="anio"?"1px solid #e5e7eb":"none", transition:"all 0.12s" }}>
              <Calendar size={11} style={{ display:"inline", marginRight:4 }} />{label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:"flex", gap:2, background:"#ede7d9", padding:4, borderRadius:12, width:"fit-content" }}>
        {tabBtn("analitica", "KPIs y Analítica", BarChart3)}
        {tabBtn("auditoria", "Auditoría Clínica", FileSearch)}
      </div>

      {/* ══════════ TAB: KPIs y Analítica ══════════ */}
      {tab === "analitica" && (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          {/* Filtro + Exportar */}
          <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
            <select value={filterVet} onChange={e=>setFilterVet(e.target.value)} aria-label="Filtrar por veterinario"
              style={{ height:36, borderRadius:8, border:"1.5px solid #d1d5db", padding:"0 10px", fontFamily:FONT, fontSize:"0.82rem", outline:"none" }}>
              <option value="">Todos los veterinarios</option>
              {vets.map(v=><option key={v.id_veterinario} value={v.id_veterinario}>{v.usuarios.nombre} {v.usuarios.apellido}</option>)}
            </select>
            <button onClick={loadAnalitica} style={{ height:36, padding:"0 14px", borderRadius:8, border:"1px solid #d1fae5", background:"rgba(240,253,244,0.7)", color:"#15803d", fontFamily:FONT, fontSize:"0.78rem", fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
              <RefreshCw size={13} style={loading?{animation:"spin 1s linear infinite"}:{}} /> Actualizar
            </button>
            <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
              {A && <button onClick={exportCSV} style={{ height:36, padding:"0 14px", borderRadius:8, border:"1px solid #bfdbfe", background:"rgba(239,246,255,0.9)", color:"#1d4ed8", fontFamily:FONT, fontSize:"0.78rem", fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}><FileDown size={13}/> CSV</button>}
            </div>
          </div>

          {/* KPI Grid */}
          {loading ? (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))", gap:12 }}>
              {Array.from({length:11}).map((_,i)=><Skeleton key={i} h={96} />)}
            </div>
          ) : A && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))", gap:12 }}>
              <KpiCard label="Total citas"            value={A.kpis.total_citas}             icon={CalendarDays} color="#3d845b" />
              <KpiCard label="Citas atendidas"        value={A.kpis.citas_atendidas}         icon={CheckCircle2} color="#15803d" />
              <KpiCard label="Citas canceladas"       value={A.kpis.citas_canceladas}        icon={XCircle}      color="#dc2626" />
              <KpiCard label="Tasa de no-presentación" value={A.kpis.tasa_cancelacion}      icon={AlertTriangle} color="#b45309" suffix="%" />
              <KpiCard label="Tasa de atención"       value={A.kpis.tasa_atencion}           icon={TrendingUp}   color="#0369a1" suffix="%" />
              <KpiCard label="Vacunas aplicadas"      value={A.kpis.total_vacunas}           icon={Syringe}      color="#7c3aed" />
              <KpiCard label="Historias clínicas"     value={A.kpis.total_historias}         icon={FileText}     color="#0f766e" />
              <KpiCard label="Mascotas nuevas"        value={A.kpis.nuevas_mascotas}         icon={Users}        color="#15803d" />
              <KpiCard label="Seguimientos pendientes" value={A.kpis.seguimientos_pendientes} icon={Clock}        color="#d97706" />
              <KpiCard label="Vet. más solicitado"   value={A.por_veterinario[0]?.nombre.split(" ")[0] ?? "—"} icon={BarChart2} color="#2563eb"
                sub={A.por_veterinario[0] ? `${A.por_veterinario[0].total} citas` : undefined} />
              <KpiCard label="Hora pico"             value={A.por_dia.sort((a,b)=>b.cantidad-a.cantidad)[0]?.dia ?? "—"} icon={Clock} color="#0f766e" />
            </div>
          )}

          {/* Charts */}
          {!loading && A && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <ChartCard title="Estado de citas">{pieEstado && <Pie data={pieEstado} options={arcOpts()} />}</ChartCard>
              <ChartCard title="Evolución semanal">{barSemanal && <Bar data={barSemanal} options={vBarOpts(false)} />}</ChartCard>
              <ChartCard title="Citas por veterinario (top 6)">{barVet && <Bar data={barVet} options={vBarOpts(true)} />}</ChartCard>
              <ChartCard title="Triajes por urgencia" h={180}>{donutTriaje && <Doughnut data={donutTriaje} options={arcOpts("60%")} />}</ChartCard>
              <ChartCard title="Citas por especie" h={Math.max((A.por_especie.slice(0,7).length)*38,140)}>{hEspecie && <Bar data={hEspecie} options={hBarOpts(maxEsp)} />}</ChartCard>
              <ChartCard title="Citas por día de semana" h={Math.max(A.por_dia.length*38,140)}>{hDia && <Bar data={hDia} options={hBarOpts(maxDia)} />}</ChartCard>
            </div>
          )}

          {/* Comparativa (Flujo B) */}
          {!loading && <ComparativaPanel vets={vets} />}
        </div>
      )}

      {/* ══════════ TAB: Auditoría Clínica ══════════ */}
      {tab === "auditoria" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <p style={{ margin:0, fontFamily:FONT, fontSize:"0.88rem", color:"#6b7280" }}>
            Consulta el historial completo de cambios en historias clínicas: quién modificó qué campo, cuándo y el valor anterior vs. nuevo.
          </p>

          {/* Filtros */}
          <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:14, padding:"18px 20px" }}>
            <p style={{ margin:"0 0 12px", fontFamily:FONT, fontSize:"0.75rem", fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:"0.07em" }}>Filtros</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:12, marginBottom:14 }}>
              <div><label htmlFor="aud-mascota" style={{ display:"block", fontFamily:FONT, fontSize:"0.7rem", fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:5 }}>Mascota</label>
                <select id="aud-mascota" value={audFiltros.id_mascota} onChange={e=>setAudFiltros(f=>({...f,id_mascota:e.target.value}))} style={{ width:"100%", height:36, borderRadius:8, border:"1.5px solid #d1d5db", padding:"0 10px", fontFamily:FONT, fontSize:"0.82rem", outline:"none" }}>
                  <option value="">Todas las mascotas</option>
                  {mascotas.map(m=><option key={m.id_mascota} value={m.id_mascota}>{m.nombre} ({m.especie})</option>)}
                </select></div>
              <div><label htmlFor="aud-vet" style={{ display:"block", fontFamily:FONT, fontSize:"0.7rem", fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:5 }}>Veterinario</label>
                <select id="aud-vet" value={audFiltros.id_veterinario} onChange={e=>setAudFiltros(f=>({...f,id_veterinario:e.target.value}))} style={{ width:"100%", height:36, borderRadius:8, border:"1.5px solid #d1d5db", padding:"0 10px", fontFamily:FONT, fontSize:"0.82rem", outline:"none" }}>
                  <option value="">Todos</option>
                  {vets.map(v=><option key={v.id_veterinario} value={v.id_veterinario}>{v.usuarios.nombre} {v.usuarios.apellido}</option>)}
                </select></div>
              <div><label htmlFor="aud-desde" style={{ display:"block", fontFamily:FONT, fontSize:"0.7rem", fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:5 }}>Desde</label>
                <input id="aud-desde" type="date" value={audFiltros.desde} onChange={e=>setAudFiltros(f=>({...f,desde:e.target.value}))} style={{ width:"100%", height:36, borderRadius:8, border:"1.5px solid #d1d5db", padding:"0 10px", fontFamily:FONT, fontSize:"0.82rem", outline:"none", boxSizing:"border-box" }} /></div>
              <div><label htmlFor="aud-hasta" style={{ display:"block", fontFamily:FONT, fontSize:"0.7rem", fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:5 }}>Hasta</label>
                <input id="aud-hasta" type="date" value={audFiltros.hasta} onChange={e=>setAudFiltros(f=>({...f,hasta:e.target.value}))} style={{ width:"100%", height:36, borderRadius:8, border:"1.5px solid #d1d5db", padding:"0 10px", fontFamily:FONT, fontSize:"0.82rem", outline:"none", boxSizing:"border-box" }} /></div>
            </div>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              {audBuscado && audData.length > 0 && (
                <button onClick={exportAudPdf} style={{ height:36, padding:"0 14px", borderRadius:8, border:"1px solid #bfdbfe", background:"rgba(239,246,255,0.9)", color:"#1d4ed8", fontFamily:FONT, fontSize:"0.8rem", fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                  <FileDown size={13}/> Exportar PDF
                </button>
              )}
              <button onClick={buscarAuditoria} style={{ height:36, padding:"0 20px", borderRadius:8, border:"none", background:"linear-gradient(135deg,#2d6a4f,#1a3320)", color:"#fff", fontFamily:FONT, fontSize:"0.85rem", fontWeight:700, cursor:"pointer" }}>
                {audLoading ? "Buscando…" : "Buscar"}
              </button>
            </div>
          </div>

          {/* Timeline */}
          {audBuscado && (
            <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:14, overflow:"hidden" }}>
              <div style={{ padding:"12px 18px", borderBottom:"1px solid #f3f4f6", background:"#f9fafb", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontFamily:FONT, fontSize:"0.78rem", fontWeight:700, color:"#374151" }}>
                  {audData.length === 0 ? "Sin resultados" : `${audData.length} registro${audData.length!==1?"s":""} encontrado${audData.length!==1?"s":""}`}
                </span>
                {audData.length>0 && <span style={{ fontFamily:FONT, fontSize:"0.72rem", color:"#6b7280" }}>Más recientes primero</span>}
              </div>
              {audLoading ? <div style={{ padding:40, textAlign:"center", color:"#6b7280", fontFamily:FONT }}>Cargando…</div>
              : audData.length === 0 ? <div style={{ padding:40, textAlign:"center", color:"#6b7280", fontFamily:FONT }}>No se encontraron registros con los filtros aplicados.</div>
              : (
                <div style={{ padding:"16px 18px", display:"flex", flexDirection:"column", gap:12 }}>
                  {audData.map((e,idx)=>{
                    const isIns = e.tipo_cambio==="INSERT";
                    const mascota = e.historia_clinica?.mascotas;
                    const vetU    = e.historia_clinica?.veterinarios?.usuarios;
                    const usuario = e.usuarios;
                    const fechaHC = e.historia_clinica?.fecha_consulta
                      ? new Date(`${e.historia_clinica.fecha_consulta}T00:00:00`).toLocaleDateString("es-PE",{day:"2-digit",month:"2-digit",year:"numeric"})
                      : null;
                    const campos:string[] = [];
                    if (e.diagnostico_anterior!==e.diagnostico_nuevo&&(e.diagnostico_anterior||e.diagnostico_nuevo)) campos.push("Diagnóstico");
                    if (e.tratamiento_anterior!==e.tratamiento_nuevo&&(e.tratamiento_anterior||e.tratamiento_nuevo)) campos.push("Tratamiento");
                    if (e.observaciones_anterior!==e.observaciones_nuevo&&(e.observaciones_anterior||e.observaciones_nuevo)) campos.push("Observaciones");
                    if (e.peso_anterior!==e.peso_nuevo&&(e.peso_anterior!=null||e.peso_nuevo!=null)) campos.push("Peso");
                    return (
                      <div key={e.id_auditoria} style={{ position:"relative", paddingLeft:24 }}>
                        {idx<audData.length-1 && <div style={{ position:"absolute", left:7, top:18, bottom:-12, width:1, background:"#e5e7eb" }} />}
                        <div style={{ position:"absolute", left:0, top:4, width:14, height:14, borderRadius:"50%", background:isIns?"#3d845b":"#2563eb", border:"2px solid #fff", boxShadow:"0 0 0 1px #e5e7eb" }} />
                        <div style={{ background:isIns?"rgba(240,253,244,0.5)":"#fff", border:"1px solid #f3f4f6", borderRadius:10, padding:"12px 14px" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, marginBottom:8, flexWrap:"wrap" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 8px", borderRadius:99, background:isIns?"rgba(21,128,61,0.1)":"rgba(37,99,235,0.08)", color:isIns?"#15803d":"#2563eb", fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", fontFamily:FONT }}>
                                {isIns?"Creación":"Modificación"}
                              </span>
                              {mascota && <span style={{ fontFamily:FONT, fontSize:"0.8rem", fontWeight:700, color:"#111827" }}>{mascota.nombre} <span style={{ fontWeight:400, color:"#6b7280", textTransform:"capitalize" }}>({mascota.especie})</span></span>}
                            </div>
                            <span style={{ fontFamily:FONT, fontSize:"0.72rem", color:"#6b7280", whiteSpace:"nowrap" }}>
                              {new Date(e.timestamp_cambio).toLocaleString("es-PE",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                            </span>
                          </div>
                          <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:campos.length>0?8:0 }}>
                            {fechaHC && <span style={{ fontFamily:FONT, fontSize:"0.75rem", color:"#6b7280" }}>HC del {fechaHC}</span>}
                            {vetU    && <span style={{ fontFamily:FONT, fontSize:"0.75rem", color:"#6b7280" }}>Vet: {vetU.nombre} {vetU.apellido}</span>}
                            {usuario && <span style={{ fontFamily:FONT, fontSize:"0.75rem", color:"#374151", fontWeight:600 }}>Por: {usuario.nombre} {usuario.apellido}</span>}
                            {e.razon_cambio && <span style={{ fontFamily:FONT, fontSize:"0.73rem", color:"#6b7280", fontStyle:"italic" }}>"{e.razon_cambio}"</span>}
                          </div>
                          {campos.length>0 && (
                            <div style={{ display:"flex", flexDirection:"column", gap:6, borderTop:"1px solid #f3f4f6", paddingTop:8 }}>
                              {(["diagnostico","tratamiento","observaciones","peso"] as const).map(campo=>{
                                const label = {diagnostico:"Diagnóstico",tratamiento:"Tratamiento",observaciones:"Observaciones",peso:"Peso"}[campo];
                                const ant = e[`${campo}_anterior` as keyof AudRow] as string|null|undefined;
                                const nvo = e[`${campo}_nuevo`    as keyof AudRow] as string|null|undefined;
                                if ((!ant&&!nvo)||ant===nvo) return null;
                                return (
                                  <div key={campo} style={{ fontFamily:FONT, fontSize:"0.76rem" }}>
                                    <span style={{ fontWeight:600, color:"#374151" }}>{label}: </span>
                                    {ant && <span style={{ background:"rgba(239,68,68,0.08)", color:"#dc2626", padding:"1px 5px", borderRadius:4, textDecoration:"line-through", marginRight:5 }}>{String(ant).slice(0,100)}{String(ant).length>100?"…":""}</span>}
                                    {nvo && <span style={{ background:"rgba(21,128,61,0.08)", color:"#15803d", padding:"1px 5px", borderRadius:4 }}>{String(nvo).slice(0,100)}{String(nvo).length>100?"…":""}</span>}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

