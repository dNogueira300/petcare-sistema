"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays, CheckCircle2, XCircle, TrendingDown, TrendingUp,
  Syringe, ClipboardList, PawPrint, Bell, Clock, Activity,
  Download, RefreshCw, AlertTriangle,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend,
} from "chart.js";
import { Bar, Pie, Doughnut } from "react-chartjs-2";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/context/toast";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// ── Types ─────────────────────────────────────────────────────────────────────
interface AnaliticaData {
  periodo: string;
  rango: { desde: string; hasta: string };
  kpis: {
    total_citas: number; citas_atendidas: number; citas_canceladas: number;
    tasa_cancelacion: number; tasa_atencion: number; total_vacunas: number;
    total_historias: number; nuevas_mascotas: number; alertas_vacunas_activas: number;
    seguimientos_pendientes: number; atenciones_activas: number;
  };
  por_estado: { pendiente: number; confirmada: number; cancelada: number; atendida: number };
  por_veterinario: { nombre: string; total: number; atendidas: number; canceladas: number }[];
  por_especie: { especie: string; cantidad: number }[];
  por_dia: { dia: string; cantidad: number }[];
  evolucion_semanal: { semana: string; total: number; atendidas: number; canceladas: number }[];
  mascotas_por_especie: { especie: string; cantidad: number }[];
  seguimientos_por_estado: { pendiente: number; sugerencia_enviada: number; completado: number; no_presentado: number };
  triajes_por_urgencia: { normal: number; urgente: number; emergencia: number };
}
type Periodo = "mes" | "trimestre" | "anio";

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, color, suffix = "" }: {
  label: string; value: number; icon: React.ElementType; color: string; suffix?: string;
}) {
  return (
    <div
      style={{ background: "#fff", border: "1px solid #e8f0eb", borderRadius: 12, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", transition: "box-shadow 0.15s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"; }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 8, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: "1.7rem", fontWeight: 800, color: "#111827", fontFamily: "var(--font-dm-sans)", letterSpacing: "-0.03em", lineHeight: 1 }}>
          {value.toLocaleString()}
          {suffix && <span style={{ fontSize: "1rem", fontWeight: 600, color, marginLeft: 2 }}>{suffix}</span>}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#6b7280", fontFamily: "var(--font-dm-sans)", fontWeight: 500 }}>{label}</p>
      </div>
    </div>
  );
}

function Skeleton({ h = 120 }: { h?: number }) {
  return <div style={{ height: h, borderRadius: 12, background: "linear-gradient(90deg,#f3f4f6,#e8f0eb,#f3f4f6)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />;
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e8f0eb", borderRadius: 14, padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <p style={{ margin: "0 0 18px", fontSize: "0.78rem", fontWeight: 700, color: "#374151", fontFamily: "var(--font-dm-sans)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{title}</p>
      {children}
    </div>
  );
}

// ── CSV Export ────────────────────────────────────────────────────────────────
function exportCSV(data: AnaliticaData) {
  const rows: string[][] = [
    ["Métrica", "Valor"],
    ["Total citas", String(data.kpis.total_citas)],
    ["Citas atendidas", String(data.kpis.citas_atendidas)],
    ["Citas canceladas", String(data.kpis.citas_canceladas)],
    ["Tasa de atención (%)", String(data.kpis.tasa_atencion)],
    ["Tasa de cancelación (%)", String(data.kpis.tasa_cancelacion)],
    ["Vacunas aplicadas", String(data.kpis.total_vacunas)],
    ["Historias clínicas", String(data.kpis.total_historias)],
    ["Mascotas nuevas", String(data.kpis.nuevas_mascotas)],
    [],
    ["Citas por estado", ""],
    ...Object.entries(data.por_estado).map(([k, v]) => [k, String(v)]),
    [],
    ["Veterinario", "Total", "Atendidas", "Canceladas"],
    ...data.por_veterinario.map(v => [v.nombre, String(v.total), String(v.atendidas), String(v.canceladas)]),
    [],
    ["Especie", "Cantidad"],
    ...data.por_especie.map(e => [e.especie, String(e.cantidad)]),
  ];
  const csv  = rows.map(r => r.map(c => `"${c ?? ""}"`).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href: url, download: `petcare-analitica-${data.rango.desde}.csv` });
  a.click(); URL.revokeObjectURL(url);
}

// ── Chart.js shared options ───────────────────────────────────────────────────
const FONT = "var(--font-dm-sans), system-ui";
const tooltipCfg = {
  backgroundColor: "#fff", borderColor: "#e5e7eb", borderWidth: 1,
  titleColor: "#111827", bodyColor: "#6b7280",
  titleFont: { family: FONT, weight: 700 as const, size: 12 },
  bodyFont:  { family: FONT, size: 11 }, padding: 10,
  boxWidth: 8, boxHeight: 8,
};

const hBarOpts = (max: number) => ({
  indexAxis: "y" as const, responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { ...tooltipCfg } },
  scales: {
    x: { max: Math.ceil(max * 1.2) || 1, grid: { color: "#f3f4f6" }, ticks: { font: { family: FONT, size: 11 }, color: "#9ca3af" }, border: { display: false } },
    y: { grid: { display: false }, ticks: { font: { family: FONT, size: 11 }, color: "#374151" }, border: { display: false } },
  },
});

const vBarOpts = (stacked = false) => ({
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { position: "top" as const, labels: { font: { family: FONT, size: 11 }, boxWidth: 10, boxHeight: 10, padding: 14 } },
    tooltip: { ...tooltipCfg },
  },
  scales: {
    x: { stacked, grid: { display: false }, ticks: { font: { family: FONT, size: 10 }, color: "#374151" }, border: { display: false } },
    y: { stacked, grid: { color: "#f3f4f6" }, ticks: { font: { family: FONT, size: 11 }, color: "#9ca3af" }, border: { display: false } },
  },
});

const arcOpts = (cutout = "0%") => ({
  responsive: true, maintainAspectRatio: false, cutout,
  plugins: {
    legend: { position: "right" as const, labels: { font: { family: FONT, size: 11 }, boxWidth: 10, boxHeight: 10, padding: 10 } },
    tooltip: { ...tooltipCfg },
  },
});

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AnaliticaPage() {
  const [data,    setData]    = useState<AnaliticaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const { user } = useAuth();
  const toast     = useToast();

  // Carga inicial — sin setState síncrono en el efecto (loading arranca en true)
  useEffect(() => {
    fetch(`/api/analitica?periodo=${periodo}`)
      .then(r => r.json())
      .then(j => { setData(j); setLoading(false); })
      .catch(() => { toast.error("Error al cargar analítica"); setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo]);

  // Refresco manual (handler de evento — setState síncrono es válido aquí)
  const refresh = () => {
    setLoading(true);
    fetch(`/api/analitica?periodo=${periodo}`)
      .then(r => r.json())
      .then(j => { setData(j); setLoading(false); })
      .catch(() => setLoading(false));
  };

  if (user?.rol !== "administrador") {
    return <div style={{ padding: 32, color: "#6b7280", fontFamily: "var(--font-dm-sans)" }}>Solo accesible para administradores.</div>;
  }

  const kpiCards = data ? [
    { label: "Total citas",             value: data.kpis.total_citas,             icon: CalendarDays,  color: "#3d845b" },
    { label: "Citas atendidas",         value: data.kpis.citas_atendidas,         icon: CheckCircle2,  color: "#15803d" },
    { label: "Citas canceladas",        value: data.kpis.citas_canceladas,        icon: XCircle,       color: "#dc2626" },
    { label: "Tasa de atención",        value: data.kpis.tasa_atencion,           icon: TrendingUp,    color: "#0369a1", suffix: "%" },
    { label: "Tasa de cancelación",     value: data.kpis.tasa_cancelacion,        icon: TrendingDown,  color: "#b45309", suffix: "%" },
    { label: "Vacunas aplicadas",       value: data.kpis.total_vacunas,           icon: Syringe,       color: "#7c3aed" },
    { label: "Historias clínicas",      value: data.kpis.total_historias,         icon: ClipboardList, color: "#0f766e" },
    { label: "Mascotas nuevas",         value: data.kpis.nuevas_mascotas,         icon: PawPrint,      color: "#15803d" },
    { label: "Alertas vacunas",         value: data.kpis.alertas_vacunas_activas, icon: Bell,          color: "#dc2626" },
    { label: "Seguimientos pendientes", value: data.kpis.seguimientos_pendientes, icon: Clock,         color: "#d97706" },
    { label: "Atenciones activas",      value: data.kpis.atenciones_activas,      icon: Activity,      color: "#2563eb" },
  ] as const : [];

  // ── Chart datasets ────────────────────────────────────────────────────────────
  const pieEstado = data ? {
    labels: ["Atendidas","Confirmadas","Pendientes","Canceladas"],
    datasets: [{ data: [data.por_estado.atendida, data.por_estado.confirmada, data.por_estado.pendiente, data.por_estado.cancelada], backgroundColor: ["#22c55e","#3b82f6","#f59e0b","#f43f5e"], borderWidth: 2, borderColor: "#fff" }],
  } : null;

  const donutTriaje = data ? {
    labels: ["Normal","Urgente","Emergencia"],
    datasets: [{ data: [data.triajes_por_urgencia.normal, data.triajes_por_urgencia.urgente, data.triajes_por_urgencia.emergencia], backgroundColor: ["#22c55e","#f59e0b","#ef4444"], borderWidth: 2, borderColor: "#fff" }],
  } : null;

  const barVet = data ? {
    labels: data.por_veterinario.slice(0, 6).map(v => v.nombre.split(" ")[0]),
    datasets: [
      { label: "Atendidas",  data: data.por_veterinario.slice(0, 6).map(v => v.atendidas),  backgroundColor: "#22c55e", borderRadius: 4 },
      { label: "Canceladas", data: data.por_veterinario.slice(0, 6).map(v => v.canceladas), backgroundColor: "#f43f5e", borderRadius: 4 },
    ],
  } : null;

  const barSemanal = data ? {
    labels: data.evolucion_semanal.map(s => s.semana),
    datasets: [
      { label: "Total",      data: data.evolucion_semanal.map(s => s.total),     backgroundColor: "rgba(61,132,91,0.45)", borderColor: "#3d845b", borderWidth: 2, borderRadius: 3 },
      { label: "Atendidas",  data: data.evolucion_semanal.map(s => s.atendidas), backgroundColor: "#22c55e", borderRadius: 3 },
      { label: "Canceladas", data: data.evolucion_semanal.map(s => s.canceladas),backgroundColor: "#f43f5e", borderRadius: 3 },
    ],
  } : null;

  const hEspecie = data ? {
    labels: data.por_especie.slice(0, 8).map(e => e.especie),
    datasets: [{ label: "Citas", data: data.por_especie.slice(0, 8).map(e => e.cantidad), backgroundColor: ["#3d845b","#0369a1","#7c3aed","#b45309","#0f766e","#dc2626","#9ca3af","#2563eb"], borderRadius: 4 }],
  } : null;

  const hDia = data ? {
    labels: data.por_dia.map(d => d.dia),
    datasets: [{ label: "Citas", data: data.por_dia.map(d => d.cantidad), backgroundColor: "#3d845b", borderRadius: 4 }],
  } : null;

  const hSeguimientos = data ? {
    labels: ["Pendientes","Aviso enviado","Completados","No presentados"],
    datasets: [{ label: "Seguimientos", data: [data.seguimientos_por_estado.pendiente, data.seguimientos_por_estado.sugerencia_enviada, data.seguimientos_por_estado.completado, data.seguimientos_por_estado.no_presentado], backgroundColor: ["#f59e0b","#3b82f6","#22c55e","#f43f5e"], borderRadius: 4 }],
  } : null;

  const hMascotas = data ? {
    labels: data.mascotas_por_especie.slice(0, 7).map(m => m.especie),
    datasets: [{ label: "Mascotas", data: data.mascotas_por_especie.slice(0, 7).map(m => m.cantidad), backgroundColor: ["#3d845b","#0369a1","#7c3aed","#b45309","#0f766e","#dc2626","#9ca3af"], borderRadius: 4 }],
  } : null;

  const maxEsp  = data ? Math.max(...data.por_especie.slice(0, 8).map(e => e.cantidad), 1) : 1;
  const maxDia  = data ? Math.max(...data.por_dia.map(d => d.cantidad), 1) : 1;
  const maxSegs = data ? Math.max(data.seguimientos_por_estado.pendiente, data.seguimientos_por_estado.sugerencia_enviada, data.seguimientos_por_estado.completado, data.seguimientos_por_estado.no_presentado, 1) : 1;
  const maxMasc = data ? Math.max(...data.mascotas_por_especie.slice(0, 7).map(m => m.cantidad), 1) : 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#111827", fontFamily: "var(--font-dm-sans)", letterSpacing: "-0.02em" }}>
            Analítica Operacional
          </h1>
          <p style={{ margin: "3px 0 0", fontSize: "0.82rem", color: "#6b7280", fontFamily: "var(--font-dm-sans)" }}>
            {data ? `${data.rango.desde} → ${data.rango.hasta}` : "Cargando…"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
            {([["mes","Último mes"],["trimestre","Trimestre"],["anio","Año"]] as [Periodo,string][]).map(([val, label]) => (
              <button key={val} onClick={() => setPeriodo(val)} style={{
                padding: "7px 14px", border: "none", cursor: "pointer",
                fontSize: "0.78rem", fontWeight: 600, fontFamily: "var(--font-dm-sans)",
                background: periodo === val ? "rgba(61,132,91,0.1)" : "transparent",
                color: periodo === val ? "#15803d" : "#6b7280",
                borderRight: val !== "anio" ? "1px solid #e5e7eb" : "none",
              }}>{label}</button>
            ))}
          </div>
          <button onClick={refresh} style={{ border: "1px solid #d1fae5", background: "rgba(240,253,244,0.7)", borderRadius: 8, padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#15803d", fontSize: "0.78rem", fontWeight: 600, fontFamily: "var(--font-dm-sans)" }}>
            <RefreshCw size={13} style={loading ? { animation: "spin 1s linear infinite" } : {}} /> Actualizar
          </button>
          {data && <Button onClick={() => exportCSV(data)}><Download size={14} /> Exportar CSV</Button>}
        </div>
      </div>

      {/* KPI Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          {Array.from({ length: 11 }).map((_, i) => <Skeleton key={i} h={100} />)}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          {kpiCards.map((k, i) => (
            <div key={i} style={{ animation: "fadeUp 0.4s ease both", animationDelay: `${i * 0.04}s` }}>
              <KpiCard {...k} />
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} h={260} />)}
        </div>
      ) : data && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* Pie: estado de citas */}
          <ChartCard title="Estado de citas">
            <div style={{ height: 230 }}>
              {pieEstado && <Pie data={pieEstado} options={arcOpts("0%")} />}
            </div>
          </ChartCard>

          {/* Donut: triajes por urgencia */}
          <ChartCard title="Triajes por nivel de urgencia">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ height: 200, flex: 1 }}>
                {donutTriaje && <Doughnut data={donutTriaje} options={arcOpts("60%")} />}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
                {([
                  { label: "Normal",     value: data.triajes_por_urgencia.normal,     color: "#22c55e", icon: CheckCircle2 },
                  { label: "Urgente",    value: data.triajes_por_urgencia.urgente,    color: "#f59e0b", icon: AlertTriangle },
                  { label: "Emergencia", value: data.triajes_por_urgencia.emergencia, color: "#ef4444", icon: AlertTriangle },
                ] as const).map(({ label, value, color, icon: Icon }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: `${color}0d`, border: `1px solid ${color}25` }}>
                    <Icon size={14} style={{ color, flexShrink: 0 }} />
                    <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.78rem", color: "#374151", flex: 1 }}>{label}</span>
                    <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "1rem", fontWeight: 800, color }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>

          {/* Bar: evolución semanal */}
          <ChartCard title="Evolución semanal (últimas 4 semanas)">
            <div style={{ height: 230 }}>
              {barSemanal && <Bar data={barSemanal} options={vBarOpts(false)} />}
            </div>
          </ChartCard>

          {/* Stacked bar: por veterinario */}
          <ChartCard title="Citas por veterinario (top 6)">
            <div style={{ height: 230 }}>
              {barVet && <Bar data={barVet} options={vBarOpts(true)} />}
            </div>
          </ChartCard>

          {/* Horizontal bar: por especie */}
          <ChartCard title="Citas por especie">
            <div style={{ height: Math.max(data.por_especie.slice(0, 8).length * 38, 160) }}>
              {hEspecie && <Bar data={hEspecie} options={hBarOpts(maxEsp)} />}
            </div>
          </ChartCard>

          {/* Horizontal bar: por día */}
          <ChartCard title="Citas por día de semana">
            <div style={{ height: Math.max(data.por_dia.length * 38, 160) }}>
              {hDia && <Bar data={hDia} options={hBarOpts(maxDia)} />}
            </div>
          </ChartCard>

          {/* Horizontal bar: seguimientos */}
          <ChartCard title="Seguimientos clínicos por estado">
            <div style={{ height: 180 }}>
              {hSeguimientos && <Bar data={hSeguimientos} options={hBarOpts(maxSegs)} />}
            </div>
          </ChartCard>

          {/* Horizontal bar: mascotas */}
          <ChartCard title="Mascotas registradas por especie">
            <div style={{ height: Math.max(data.mascotas_por_especie.slice(0, 7).length * 38, 140) }}>
              {hMascotas && <Bar data={hMascotas} options={hBarOpts(maxMasc)} />}
            </div>
          </ChartCard>

        </div>
      )}

      <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes spin    { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
