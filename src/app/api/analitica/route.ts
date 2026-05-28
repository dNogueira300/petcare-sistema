import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session || session.rol !== "administrador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const periodo = searchParams.get("periodo") ?? "mes"; // mes | trimestre | anio
  const admin   = createAdminClient();

  // Calcular rango de fechas según período
  const hoy   = new Date();
  let desde: Date;
  if (periodo === "trimestre") {
    desde = new Date(hoy); desde.setMonth(hoy.getMonth() - 3);
  } else if (periodo === "anio") {
    desde = new Date(hoy); desde.setFullYear(hoy.getFullYear() - 1);
  } else {
    desde = new Date(hoy); desde.setMonth(hoy.getMonth() - 1);
  }
  const desdeStr = desde.toISOString().slice(0, 10);
  const hastaStr = hoy.toISOString().slice(0, 10);

  const [
    citasRes, mascotasRes, vacunasRes,
    historiasRes, seguimientosRes, alertasVacRes,
    atencionesRes, triagesRes,
  ] = await Promise.all([
    admin.from("citas")
      .select("id_cita, fecha, estado, origen, id_veterinario, mascotas(especie), veterinarios(usuarios(nombre,apellido))")
      .gte("fecha", desdeStr).lte("fecha", hastaStr),
    admin.from("mascotas")
      .select("id_mascota, especie, sexo, creado_en")
      .gte("creado_en", desde.toISOString()),
    admin.from("cartilla_vacunacion")
      .select("id, fecha_aplicacion, tipo_vacuna_categoria")
      .gte("fecha_aplicacion", desdeStr).lte("fecha_aplicacion", hastaStr),
    admin.from("historia_clinica")
      .select("id_historia, fecha_consulta, estado_seguimiento")
      .gte("fecha_consulta", desdeStr).lte("fecha_consulta", hastaStr),
    admin.from("seguimientos_clinicos")
      .select("id_seguimiento, estado, creado_en")
      .gte("creado_en", desde.toISOString()),
    admin.from("alertas_vacunacion")
      .select("id_alerta, tipo_alerta, estado")
      .eq("estado", "activa"),
    admin.from("atenciones_clinicas")
      .select("id_atencion, estado_actual, prioridad, creado_en")
      .gte("creado_en", desde.toISOString()),
    admin.from("triaje")
      .select("id_triaje, nivel_urgencia, creado_en")
      .gte("creado_en", desde.toISOString()),
  ]);

  type CitaR = {
    id_cita: number; fecha: string; estado: string; origen: string; id_veterinario: number;
    mascotas: { especie: string } | null;
    veterinarios: { usuarios: { nombre: string; apellido: string } } | null;
  };
  const citas = (citasRes.data ?? []) as unknown as CitaR[];

  // ── KPIs principales ───────────────────────────────────────────────────────
  const porEstado = { pendiente:0, confirmada:0, cancelada:0, atendida:0 } as Record<string,number>;
  citas.forEach(c => { porEstado[c.estado] = (porEstado[c.estado] ?? 0) + 1; });

  const tasaCancelacion = citas.length > 0
    ? Math.round((porEstado.cancelada / citas.length) * 100)
    : 0;
  const tasaAtencion = citas.length > 0
    ? Math.round((porEstado.atendida / citas.length) * 100)
    : 0;

  // ── Por veterinario ─────────────────────────────────────────────────────────
  const vetMap: Record<string, { nombre: string; total: number; atendidas: number; canceladas: number }> = {};
  citas.forEach(c => {
    const vid = String(c.id_veterinario);
    if (!vetMap[vid]) {
      const u = c.veterinarios?.usuarios;
      vetMap[vid] = { nombre: u ? `${u.nombre} ${u.apellido}` : `Vet #${vid}`, total:0, atendidas:0, canceladas:0 };
    }
    vetMap[vid].total++;
    if (c.estado === "atendida")  vetMap[vid].atendidas++;
    if (c.estado === "cancelada") vetMap[vid].canceladas++;
  });
  const porVeterinario = Object.values(vetMap).sort((a,b) => b.total - a.total).slice(0, 10);

  // ── Por especie ─────────────────────────────────────────────────────────────
  const espMap: Record<string, number> = {};
  citas.forEach(c => {
    const esp = c.mascotas?.especie ?? "Otro";
    espMap[esp] = (espMap[esp] ?? 0) + 1;
  });
  const porEspecie = Object.entries(espMap).map(([especie, cantidad]) => ({ especie, cantidad }))
    .sort((a,b) => b.cantidad - a.cantidad);

  // ── Citas por día de semana ─────────────────────────────────────────────────
  const diasMap: Record<string, number> = { Lun:0,Mar:0,Mié:0,Jue:0,Vie:0,Sáb:0,Dom:0 };
  const diasNom = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  citas.forEach(c => {
    const d = new Date(`${c.fecha}T12:00:00`);
    diasMap[diasNom[d.getDay()]] = (diasMap[diasNom[d.getDay()]] ?? 0) + 1;
  });
  const porDia = Object.entries(diasMap).map(([dia, cantidad]) => ({ dia, cantidad }));

  // ── Evolución semanal (últimas 4 semanas) ───────────────────────────────────
  const semanas: { semana: string; total: number; atendidas: number; canceladas: number }[] = [];
  for (let i = 3; i >= 0; i--) {
    const ini = new Date(hoy); ini.setDate(hoy.getDate() - (i + 1) * 7);
    const fin = new Date(hoy); fin.setDate(hoy.getDate() - i * 7);
    const iniStr = ini.toISOString().slice(0, 10);
    const finStr = fin.toISOString().slice(0, 10);
    const citasSem = citas.filter(c => c.fecha >= iniStr && c.fecha < finStr);
    semanas.push({
      semana: `${iniStr.slice(5)} – ${finStr.slice(5)}`,
      total:      citasSem.length,
      atendidas:  citasSem.filter(c => c.estado === "atendida").length,
      canceladas: citasSem.filter(c => c.estado === "cancelada").length,
    });
  }

  // ── Mascotas por especie (total histórico, no filtrado por rango) ──────────
  const mascotasEspMap: Record<string, number> = {};
  (mascotasRes.data ?? []).forEach((m: { especie: string }) => {
    mascotasEspMap[m.especie] = (mascotasEspMap[m.especie] ?? 0) + 1;
  });
  const mascotasPorEspecie = Object.entries(mascotasEspMap)
    .map(([especie, cantidad]) => ({ especie, cantidad }))
    .sort((a,b) => b.cantidad - a.cantidad);

  // ── Seguimientos ────────────────────────────────────────────────────────────
  type SegR = { estado: string };
  const segs = (seguimientosRes.data ?? []) as SegR[];
  const seguimientosPorEstado = {
    pendiente:          segs.filter(s => s.estado === "pendiente").length,
    sugerencia_enviada: segs.filter(s => s.estado === "sugerencia_enviada").length,
    completado:         segs.filter(s => s.estado === "completado").length,
    no_presentado:      segs.filter(s => s.estado === "no_presentado").length,
  };

  // ── Triajes por urgencia ────────────────────────────────────────────────────
  type TriajeR = { nivel_urgencia: string };
  const triajes = (triagesRes.data ?? []) as TriajeR[];
  const triajesPorUrgencia = {
    normal:     triajes.filter(t => t.nivel_urgencia === "normal").length,
    urgente:    triajes.filter(t => t.nivel_urgencia === "urgente").length,
    emergencia: triajes.filter(t => t.nivel_urgencia === "emergencia").length,
  };

  // ── Atenciones por estado ──────────────────────────────────────────────────
  type AtenR = { estado_actual: string; prioridad: string };
  const atenciones = (atencionesRes.data ?? []) as AtenR[];
  const atencionesActivas = atenciones.filter(a =>
    !["finalizado","cancelada","no_asistio"].includes(a.estado_actual)
  ).length;

  return NextResponse.json({
    periodo,
    rango: { desde: desdeStr, hasta: hastaStr },
    kpis: {
      total_citas:         citas.length,
      citas_atendidas:     porEstado.atendida,
      citas_canceladas:    porEstado.cancelada,
      tasa_cancelacion:    tasaCancelacion,
      tasa_atencion:       tasaAtencion,
      total_vacunas:       (vacunasRes.data ?? []).length,
      total_historias:     (historiasRes.data ?? []).length,
      nuevas_mascotas:     (mascotasRes.data ?? []).length,
      alertas_vacunas_activas: (alertasVacRes.data ?? []).length,
      seguimientos_pendientes: segs.filter(s => s.estado === "pendiente").length,
      atenciones_activas:  atencionesActivas,
    },
    por_estado:         porEstado,
    por_veterinario:    porVeterinario,
    por_especie:        porEspecie,
    por_dia:            porDia,
    evolucion_semanal:  semanas,
    mascotas_por_especie: mascotasPorEspecie,
    seguimientos_por_estado: seguimientosPorEstado,
    triajes_por_urgencia: triajesPorUrgencia,
  });
}
