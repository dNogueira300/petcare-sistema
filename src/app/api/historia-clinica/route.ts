import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

const createSchema = z.object({
  id_cita: z.number().int().positive(),
  id_mascota: z.number().int().positive(),
  id_veterinario: z.number().int().positive(),
  fecha_consulta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  diagnostico: z.string().min(5),
  tratamiento: z.string().min(5),
  observaciones: z.string().optional(),
  peso_consulta: z.number().positive().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session || !["administrador", "veterinario"].includes(session.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id_mascota = searchParams.get("id_mascota");

  const supabase = createAdminClient();

  let query = supabase
    .from("historia_clinica")
    .select("*, mascotas(nombre), veterinarios(usuarios(nombre, apellido)), citas(fecha, hora, motivo)")
    .order("fecha_consulta", { ascending: false });

  if (id_mascota) query = query.eq("id_mascota", id_mascota);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session || session.rol !== "veterinario") {
    return NextResponse.json({ error: "Solo veterinarios pueden crear historias clínicas" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: cita } = await admin
    .from("citas")
    .select("estado")
    .eq("id_cita", parsed.data.id_cita)
    .single();

  if (!cita || !["confirmada", "atendida"].includes(cita.estado)) {
    return NextResponse.json(
      { error: "Solo se puede crear historia clínica de citas confirmadas o atendidas" },
      { status: 400 }
    );
  }

  await admin
    .from("citas")
    .update({ estado: "atendida" })
    .eq("id_cita", parsed.data.id_cita);

  const { data, error } = await admin
    .from("historia_clinica")
    .insert(parsed.data)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
