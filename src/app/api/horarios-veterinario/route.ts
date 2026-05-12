import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

const horaRe = /^\d{2}:\d{2}(:\d{2})?$/;

const putSchema = z.object({
  id_veterinario: z.number().int().positive(),
  horarios: z.array(
    z.object({
      dia_semana: z.number().int().min(1).max(7),
      hora_inicio: z.string().regex(horaRe),
      hora_fin: z.string().regex(horaRe),
    }),
  ),
});

export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const idVet = new URL(req.url).searchParams.get("id_veterinario");
  if (!idVet) return NextResponse.json({ error: "Se requiere id_veterinario" }, { status: 400 });

  const { data, error } = await createAdminClient()
    .from("horarios_veterinario")
    .select("id, id_veterinario, dia_semana, hora_inicio, hora_fin")
    .eq("id_veterinario", idVet)
    .order("dia_semana", { ascending: true })
    .order("hora_inicio", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest) {
  const session = await getSessionUser();
  if (!session || session.rol !== "administrador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  for (const h of parsed.data.horarios) {
    if (h.hora_fin <= h.hora_inicio) {
      return NextResponse.json(
        { error: `Franja inválida (día ${h.dia_semana}): la hora fin debe ser mayor que la hora inicio` },
        { status: 400 },
      );
    }
  }

  const supabase = createAdminClient();
  const { id_veterinario, horarios } = parsed.data;

  const { error: delError } = await supabase
    .from("horarios_veterinario")
    .delete()
    .eq("id_veterinario", id_veterinario);
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });

  if (horarios.length > 0) {
    const rows = horarios.map((h) => ({
      id_veterinario,
      dia_semana: h.dia_semana,
      hora_inicio: h.hora_inicio.length === 5 ? `${h.hora_inicio}:00` : h.hora_inicio,
      hora_fin: h.hora_fin.length === 5 ? `${h.hora_fin}:00` : h.hora_fin,
    }));
    const { error: insError } = await supabase.from("horarios_veterinario").insert(rows);
    if (insError) return NextResponse.json({ error: insError.message }, { status: 500 });
  }

  const { data } = await supabase
    .from("horarios_veterinario")
    .select("id, id_veterinario, dia_semana, hora_inicio, hora_fin")
    .eq("id_veterinario", id_veterinario)
    .order("dia_semana", { ascending: true })
    .order("hora_inicio", { ascending: true });

  return NextResponse.json({ data });
}
