import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session || session.rol !== "administrador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const desde = searchParams.get("desde") ?? "2020-01-01";
  const hasta = searchParams.get("hasta") ?? new Date().toISOString().slice(0, 10);
  const estado = searchParams.get("estado") ?? "";
  const id_veterinario = searchParams.get("id_veterinario") ?? "";

  const supabase = createAdminClient();

  let citasQuery = supabase
    .from("citas")
    .select("id_cita, fecha, hora, motivo, estado, origen, id_veterinario, mascotas(nombre, especie, clientes(usuarios(nombre, apellido))), veterinarios(id_veterinario, usuarios(nombre, apellido))")
    .gte("fecha", desde)
    .lte("fecha", hasta)
    .order("fecha", { ascending: false });

  if (estado) citasQuery = citasQuery.eq("estado", estado);
  if (id_veterinario) citasQuery = citasQuery.eq("id_veterinario", id_veterinario);

  const [{ data: citas }, { count: totalClientes }, { count: totalMascotas }] = await Promise.all([
    citasQuery,
    supabase.from("clientes").select("*", { count: "exact", head: true }).gte("id_cliente", 0),
    supabase.from("mascotas").select("*", { count: "exact", head: true }).gte("id_mascota", 0),
  ]);

  type CitaRow = {
    fecha: string;
    estado: string;
    origen?: string;
    id_veterinario: number;
    mascotas: { especie: string } | null;
    veterinarios: { usuarios: { nombre: string; apellido: string } } | null;
  };
  const citasArr = (citas ?? []) as unknown as CitaRow[];

  // Resumen por estado
  const porEstado: Record<string, number> = { pendiente:0, confirmada:0, cancelada:0, atendida:0 };
  citasArr.forEach((c) => { porEstado[c.estado] = (porEstado[c.estado] ?? 0) + 1; });

  // Por veterinario
  const vetMap: Record<string, { nombre: string; total: number; atendidas: number; canceladas: number }> = {};
  citasArr.forEach((c) => {
    const vid = String(c.id_veterinario);
    if (!vetMap[vid]) {
      const u = c.veterinarios?.usuarios;
      vetMap[vid] = { nombre: u ? `${u.nombre} ${u.apellido}` : `Vet #${vid}`, total:0, atendidas:0, canceladas:0 };
    }
    vetMap[vid].total++;
    if (c.estado === "atendida") vetMap[vid].atendidas++;
    if (c.estado === "cancelada") vetMap[vid].canceladas++;
  });
  const porVeterinario = Object.values(vetMap).sort((a,b) => b.total - a.total);

  // Por día de semana
  const dias = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const diaMap: Record<string, number> = {};
  dias.forEach(d => { diaMap[d] = 0; });
  citasArr.forEach((c) => {
    const d = new Date(`${c.fecha}T12:00:00`);
    diaMap[dias[d.getDay()]]++;
  });
  const porDia = dias.map(d => ({ dia: d, cantidad: diaMap[d] }));

  // Por especie
  const especieMap: Record<string, number> = {};
  citasArr.forEach((c) => {
    const esp = c.mascotas?.especie ?? "Otro";
    especieMap[esp] = (especieMap[esp] ?? 0) + 1;
  });
  const porEspecie = Object.entries(especieMap).map(([especie, cantidad]) => ({ especie, cantidad })).sort((a,b) => b.cantidad - a.cantidad);

  // Por origen
  let portalCount = 0, internoCount = 0;
  citasArr.forEach((c) => {
    if (c.origen === "portal") portalCount++; else internoCount++;
  });
  const porOrigen = [
    { origen: "Portal (clientes)", cantidad: portalCount },
    { origen: "Interno (staff)", cantidad: internoCount },
  ];

  return NextResponse.json({
    resumen: {
      total: citasArr.length,
      por_estado: porEstado,
      total_clientes: totalClientes ?? 0,
      total_mascotas: totalMascotas ?? 0,
    },
    por_veterinario: porVeterinario,
    por_dia: porDia,
    por_especie: porEspecie,
    por_origen: porOrigen,
    citas: citasArr,
  });
}
