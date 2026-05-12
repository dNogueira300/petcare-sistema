import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { calcularProximaDosis } from "@/lib/vacunas";

const WRITE_ROLES = ["administrador", "veterinario", "recepcionista"];

const createSchema = z.object({
  id_mascota: z.number().int().positive(),
  tipo_vacuna: z.string().min(2),
  fecha_aplicacion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lote: z.string().optional(),
  id_veterinario: z.number().int().positive().optional(),
  observaciones: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const idMascota = searchParams.get("id_mascota");
  if (!idMascota) return NextResponse.json({ error: "Se requiere id_mascota" }, { status: 400 });

  const supabase = createAdminClient();

  if (session.rol === "cliente") {
    const { data: cliente } = await supabase
      .from("clientes")
      .select("id_cliente")
      .eq("id_usuario", session.id_usuario)
      .maybeSingle();
    const { data: mascota } = await supabase
      .from("mascotas")
      .select("id_cliente")
      .eq("id_mascota", idMascota)
      .maybeSingle();
    if (!cliente || !mascota || mascota.id_cliente !== cliente.id_cliente) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
  }

  const { data, error } = await supabase
    .from("cartilla_vacunacion")
    .select(`
      id, id_mascota, tipo_vacuna, fecha_aplicacion, fecha_proxima_dosis, lote,
      id_veterinario, observaciones, creado_en,
      veterinarios(id_veterinario, usuarios(nombre, apellido))
    `)
    .eq("id_mascota", idMascota)
    .order("fecha_aplicacion", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session || !WRITE_ROLES.includes(session.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createAdminClient();

  let idVeterinario = parsed.data.id_veterinario ?? null;
  if (!idVeterinario && session.rol === "veterinario") {
    const { data: vet } = await supabase
      .from("veterinarios")
      .select("id_veterinario")
      .eq("id_usuario", session.id_usuario)
      .maybeSingle();
    idVeterinario = vet?.id_veterinario ?? null;
  }

  const fechaProxima = await calcularProximaDosis(supabase, parsed.data.tipo_vacuna, parsed.data.fecha_aplicacion);

  const { data, error } = await supabase
    .from("cartilla_vacunacion")
    .insert({
      id_mascota: parsed.data.id_mascota,
      tipo_vacuna: parsed.data.tipo_vacuna,
      fecha_aplicacion: parsed.data.fecha_aplicacion,
      fecha_proxima_dosis: fechaProxima,
      lote: parsed.data.lote ?? null,
      id_veterinario: idVeterinario,
      observaciones: parsed.data.observaciones ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
