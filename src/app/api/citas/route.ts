import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { hoyCimaFecha } from "@/utils/datetime";
import { slotsDisponiblesVet } from "@/lib/horarios";

const createSchema = z.object({
  id_mascota: z.number().int().positive(),
  id_veterinario: z.number().int().positive(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hora: z.string().regex(/^\d{2}:\d{2}$/),
  motivo: z.string().min(5),
  observaciones: z.string().optional(),
  origen: z.enum(["interno", "portal"]).optional(),
});

const WRITE_ROLES = ["administrador", "recepcionista", "cliente"];

export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fecha = searchParams.get("fecha");
  const id_veterinario = searchParams.get("id_veterinario");
  const estado = searchParams.get("estado");
  const origen = searchParams.get("origen");

  const supabase = createAdminClient();

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
    if (!clienteData) return NextResponse.json({ data: [] });
    const { data: mascotasData } = await supabase
      .from("mascotas")
      .select("id_mascota")
      .eq("id_cliente", clienteData.id_cliente);
    const ids = (mascotasData ?? []).map((m: { id_mascota: number }) => m.id_mascota);
    if (ids.length === 0) return NextResponse.json({ data: [] });
    query = query.in("id_mascota", ids);
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
  if (origen) query = query.eq("origen", origen);

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

  const admin = createAdminClient();

  const slots = await slotsDisponiblesVet(admin, parsed.data.id_veterinario, parsed.data.fecha);
  if (slots.length === 0) {
    return NextResponse.json(
      { error: "El veterinario no atiende ese día" },
      { status: 400 }
    );
  }
  if (!slots.includes(parsed.data.hora)) {
    return NextResponse.json(
      { error: "El horario seleccionado no está disponible para ese veterinario" },
      { status: 409 }
    );
  }

  const origen = session.rol === "cliente" ? "portal" : (parsed.data.origen ?? "interno");

  const { data, error } = await admin
    .from("citas")
    .insert({ ...parsed.data, estado: "pendiente", origen })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
