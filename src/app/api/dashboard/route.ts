import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { hoyCimaFecha } from "@/utils/datetime";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const hoy = hoyCimaFecha();
  const inicioSemana = (() => {
    const d = new Date(hoy);
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().slice(0, 10);
  })();
  const finSemana = (() => {
    const d = new Date(inicioSemana);
    d.setDate(d.getDate() + 6);
    return d.toISOString().slice(0, 10);
  })();

  const [
    { count: citas_hoy },
    { count: citas_semana },
    { count: citas_pendientes },
    { count: total_clientes },
    { count: total_mascotas },
    { data: citas_raw },
    { data: proximas_raw },
  ] = await Promise.all([
    supabase.from("citas").select("*", { count: "exact", head: true }).eq("fecha", hoy),
    supabase.from("citas").select("*", { count: "exact", head: true }).gte("fecha", inicioSemana).lte("fecha", finSemana),
    supabase.from("citas").select("*", { count: "exact", head: true }).eq("estado", "pendiente"),
    supabase.from("clientes").select("*", { count: "exact", head: true }),
    supabase.from("mascotas").select("*", { count: "exact", head: true }),
    supabase.from("citas").select("estado, especie:mascotas(especie)"),
    supabase.from("citas")
      .select("*, mascotas(nombre, especie), veterinarios(usuarios(nombre, apellido))")
      .eq("fecha", hoy)
      .neq("estado", "cancelada")
      .order("hora", { ascending: true })
      .limit(10),
  ]);

  const estadoCounts: Record<string, number> = {};
  (citas_raw ?? []).forEach((c: { estado: string }) => {
    estadoCounts[c.estado] = (estadoCounts[c.estado] ?? 0) + 1;
  });
  const citas_por_estado = Object.entries(estadoCounts).map(([estado, cantidad]) => ({
    estado,
    cantidad,
  }));

  return NextResponse.json({
    citas_hoy: citas_hoy ?? 0,
    citas_semana: citas_semana ?? 0,
    citas_pendientes: citas_pendientes ?? 0,
    total_clientes: total_clientes ?? 0,
    total_mascotas: total_mascotas ?? 0,
    citas_por_estado,
    proximas_citas: proximas_raw ?? [],
  });
}
