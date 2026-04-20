import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { hoyCimaFecha } from "@/utils/datetime";

const createSchema = z.object({
  id_mascota: z.number().int().positive(),
  id_veterinario: z.number().int().positive(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hora: z.string().regex(/^\d{2}:\d{2}$/),
  motivo: z.string().min(5),
  observaciones: z.string().optional(),
});

const WRITE_ROLES = ["administrador", "recepcionista"];

export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fecha = searchParams.get("fecha");
  const id_veterinario = searchParams.get("id_veterinario");
  const estado = searchParams.get("estado");

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  let query = supabase
    .from("citas")
    .select(
      "*, mascotas(nombre, especie, clientes(usuarios(nombre, apellido))), veterinarios(usuarios(nombre, apellido))"
    )
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true });

  if (session.rol === "cliente") {
    const { data: clienteData } = await supabase
      .from("clientes")
      .select("id_cliente")
      .eq("id_usuario", session.id_usuario)
      .single();
    if (clienteData) {
      query = query.eq("mascotas.id_cliente", clienteData.id_cliente);
    }
  } else if (session.rol === "veterinario") {
    const { data: vetData } = await supabase
      .from("veterinarios")
      .select("id_veterinario")
      .eq("id_usuario", session.id_usuario)
      .single();
    if (vetData) query = query.eq("id_veterinario", vetData.id_veterinario);
  }

  if (fecha) query = query.eq("fecha", fecha);
  if (id_veterinario) query = query.eq("id_veterinario", id_veterinario);
  if (estado) query = query.eq("estado", estado);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session || !WRITE_ROLES.includes(session.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.fecha < hoyCimaFecha()) {
    return NextResponse.json({ error: "No se pueden crear citas en fechas pasadas" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: existing } = await supabase
    .from("citas")
    .select("id_cita")
    .eq("id_veterinario", parsed.data.id_veterinario)
    .eq("fecha", parsed.data.fecha)
    .eq("hora", parsed.data.hora)
    .neq("estado", "cancelada")
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "El veterinario ya tiene una cita en ese horario" },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("citas")
    .insert({ ...parsed.data, estado: "pendiente" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
