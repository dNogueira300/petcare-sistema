import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

const createSchema = z.object({
  id_historia_clinica: z.number().int().positive(),
  id_mascota: z.number().int().positive(),
  id_veterinario: z.number().int().positive(),
  motivo_seguimiento: z.string().min(3).max(200),
  fecha_sugerida_control: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dias_anticipacion_recordatorio: z.number().int().min(1).max(30).default(3),
  observaciones: z.string().optional(),
});

const WRITE_ROLES = ["administrador", "veterinario"];

export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id_mascota = searchParams.get("id_mascota");
  const id_veterinario = searchParams.get("id_veterinario");
  const estado = searchParams.get("estado");
  const pendientes = searchParams.get("pendientes") === "1";

  const supabase = createAdminClient();
  let query = supabase
    .from("seguimientos_clinicos")
    .select(
      `
      *,
      mascotas(nombre, especie, clientes(usuarios(nombre, apellido))),
      veterinarios(usuarios(nombre, apellido)),
      historia_clinica(diagnostico, fecha_consulta)
    `,
    )
    .order("fecha_sugerida_control", { ascending: true });

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

  if (pendientes) {
    query = query.in("estado", ["pendiente", "sugerencia_enviada"]);
  } else if (estado) {
    query = query.eq("estado", estado);
  }

  if (id_mascota) query = query.eq("id_mascota", id_mascota);
  if (id_veterinario) query = query.eq("id_veterinario", id_veterinario);

  const { data, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session || !WRITE_ROLES.includes(session.rol)) {
    return NextResponse.json(
      { error: "No autorizado para crear seguimientos" },
      { status: 403 },
    );
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Validar que la fecha de control sea futura
  const hoy = new Date().toISOString().slice(0, 10);
  if (parsed.data.fecha_sugerida_control <= hoy) {
    return NextResponse.json(
      { error: "La fecha de control debe ser futura" },
      { status: 400 },
    );
  }

  const { data, error } = await admin
    .from("seguimientos_clinicos")
    .insert(parsed.data)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Actualizar historia_clinica.estado_seguimiento
  await admin
    .from("historia_clinica")
    .update({ estado_seguimiento: "pendiente_seguimiento" })
    .eq("id_historia", parsed.data.id_historia_clinica);

  return NextResponse.json({ data }, { status: 201 });
}
