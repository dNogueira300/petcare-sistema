import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

const createSchema = z.object({
  id_cita: z.number().int().positive().optional(),
  id_mascota: z.number().int().positive(),
  id_veterinario: z.number().int().positive(),
  motivo_consulta: z.string().min(3).optional(),
  prioridad: z.enum(["normal", "urgente"]).optional(),
  estado_actual: z
    .enum([
      "reservada",
      "confirmada",
      "espera",
      "triaje",
      "consulta",
      "hospitalizado",
      "finalizado",
      "seguimiento",
      "no_asistio",
      "cancelada",
    ])
    .optional(),
});

const WRITE_ROLES = ["administrador", "recepcionista", "veterinario"];

export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const estado = searchParams.get("estado");
  const id_mascota = searchParams.get("id_mascota");
  const id_vet = searchParams.get("id_veterinario");

  const supabase = createAdminClient();

  // El hint "!atenciones_clinicas_id_cita_fkey" disambigua el join hacia citas
  // (FK directa: atenciones_clinicas.id_cita → citas.id_cita), evitando
  // el conflicto con la FK inversa (citas.id_atencion_clinica → atenciones_clinicas).
  let query = supabase
    .from("atenciones_clinicas")
    .select(
      `
      *,
      mascotas(nombre, especie, clientes(usuarios(nombre, apellido))),
      veterinarios(usuarios(nombre, apellido)),
      citas!atenciones_clinicas_id_cita_fkey(fecha, hora, motivo)
    `,
    )
    .order("fecha_inicio", { ascending: false });

  if (session.rol === "veterinario") {
    const { data: vetData } = await supabase
      .from("veterinarios")
      .select("id_veterinario")
      .eq("id_usuario", session.id_usuario)
      .single();
    if (vetData) query = query.eq("id_veterinario", vetData.id_veterinario);
  } else if (session.rol === "cliente") {
    const { data: clienteData } = await supabase
      .from("clientes")
      .select("id_cliente")
      .eq("id_usuario", session.id_usuario)
      .single();
    if (!clienteData) return NextResponse.json({ data: [] });
    const { data: mascotas } = await supabase
      .from("mascotas")
      .select("id_mascota")
      .eq("id_cliente", clienteData.id_cliente);
    const ids = (mascotas ?? []).map(
      (m: { id_mascota: number }) => m.id_mascota,
    );
    if (ids.length === 0) return NextResponse.json({ data: [] });
    query = query.in("id_mascota", ids);
  }

  if (estado) query = query.eq("estado_actual", estado);
  if (id_mascota) query = query.eq("id_mascota", id_mascota);
  if (id_vet) query = query.eq("id_veterinario", id_vet);

  const { data, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    return NextResponse.json(
      { error: parsed.error.issues.map(i => i.message).join(", ") },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("atenciones_clinicas")
    .insert({
      ...parsed.data,
      estado_actual: parsed.data.estado_actual ?? "reservada",
      prioridad: parsed.data.prioridad ?? "normal",
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Si viene de una cita, vincular
  if (parsed.data.id_cita && data) {
    await admin
      .from("citas")
      .update({ id_atencion_clinica: data.id_atencion })
      .eq("id_cita", parsed.data.id_cita);
  }

  // Registrar transición inicial
  await admin.from("transiciones_estado").insert({
    id_atencion: data.id_atencion,
    estado_anterior: "reservada",
    estado_nuevo: data.estado_actual,
    id_usuario: session.id_usuario,
    razon: "Creación inicial",
  });

  return NextResponse.json({ data }, { status: 201 });
}
