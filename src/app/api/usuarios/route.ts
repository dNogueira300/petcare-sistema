import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { hashPassword, getSessionUser } from "@/lib/auth";
import { passwordSchema } from "@/utils/password";

const horaRe = /^\d{2}:\d{2}(:\d{2})?$/;

const horarioSchema = z.object({
  dia_semana: z.number().int().min(1).max(7),
  hora_inicio: z.string().regex(horaRe),
  hora_fin: z.string().regex(horaRe),
});

const createSchema = z.object({
  nombre: z.string().min(2),
  apellido: z.string().min(2),
  correo: z.string().email(),
  contrasena: passwordSchema,
  rol: z.enum(["administrador", "veterinario", "recepcionista"]),
  especialidad: z.string().optional(),
  horarios: z.array(horarioSchema).optional(),
});

function normalizaHora(h: string): string {
  return h.length === 5 ? `${h}:00` : h;
}

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.rol !== "administrador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { data, error } = await createAdminClient()
    .from("usuarios")
    .select("id_usuario, nombre, apellido, correo, rol, activo, creado_en, veterinarios(id_veterinario, especialidad)")
    .not("rol", "eq", "cliente")
    .order("creado_en", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const flat = (data ?? []).map((u: Record<string, unknown>) => {
    const vet = u.veterinarios as { id_veterinario: number; especialidad: string | null }[] | { id_veterinario: number; especialidad: string | null } | null;
    const vetRow = Array.isArray(vet) ? (vet[0] ?? null) : vet;
    const especialidad = vetRow?.especialidad ?? null;
    const id_veterinario = vetRow?.id_veterinario ?? null;
    const rest = { ...u };
    delete rest.veterinarios;
    return { ...rest, especialidad, id_veterinario };
  });

  return NextResponse.json({ data: flat });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session || session.rol !== "administrador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { contrasena, especialidad, horarios, ...rest } = parsed.data;
  const contrasena_hash = await hashPassword(contrasena);

  if (horarios) {
    for (const h of horarios) {
      if (h.hora_fin <= h.hora_inicio) {
        return NextResponse.json(
          { error: `Franja inválida (día ${h.dia_semana}): la hora fin debe ser mayor que la hora inicio` },
          { status: 400 },
        );
      }
    }
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("usuarios")
    .insert({ ...rest, contrasena_hash, correo_verificado: true })
    .select("id_usuario, nombre, apellido, correo, rol, activo, creado_en")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "El correo ya está registrado" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data.rol === "veterinario") {
    const { data: vetData, error: vetError } = await supabase
      .from("veterinarios")
      .insert({
        id_usuario: data.id_usuario,
        especialidad: especialidad || null,
        horario_inicio: "07:00",
        horario_fin: "20:00",
      })
      .select("id_veterinario")
      .single();

    if (vetError) {
      return NextResponse.json({ error: vetError.message }, { status: 500 });
    }

    if (horarios && horarios.length > 0 && vetData) {
      const rows = horarios.map((h) => ({
        id_veterinario: vetData.id_veterinario,
        dia_semana: h.dia_semana,
        hora_inicio: normalizaHora(h.hora_inicio),
        hora_fin: normalizaHora(h.hora_fin),
      }));
      const { error: hError } = await supabase.from("horarios_veterinario").insert(rows);
      if (hError) {
        return NextResponse.json({ error: hError.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ data: { ...data, especialidad: especialidad || null } }, { status: 201 });
}
