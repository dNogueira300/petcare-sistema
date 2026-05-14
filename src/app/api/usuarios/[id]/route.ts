import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { passwordSchema } from "@/utils/password";

const horaRe = /^\d{2}:\d{2}(:\d{2})?$/;

const horarioSchema = z.object({
  dia_semana: z.number().int().min(1).max(7),
  hora_inicio: z.string().regex(horaRe),
  hora_fin: z.string().regex(horaRe),
});

const updateSchema = z.object({
  nombre: z.string().min(2).optional(),
  apellido: z.string().min(2).optional(),
  correo: z.string().email().optional(),
  rol: z.enum(["administrador", "veterinario", "recepcionista"]).optional(),
  especialidad: z.string().optional(),
  horarios: z.array(horarioSchema).optional(),
});

function normalizaHora(h: string): string {
  return h.length === 5 ? `${h}:00` : h;
}

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session || session.rol !== "administrador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const { data, error } = await createAdminClient()
    .from("usuarios")
    .select("id_usuario, nombre, apellido, correo, rol, activo, creado_en")
    .eq("id_usuario", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session || session.rol !== "administrador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { especialidad, horarios, ...userFields } = parsed.data;

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

  let data;
  if (Object.keys(userFields).length > 0) {
    const res = await supabase
      .from("usuarios")
      .update(userFields)
      .eq("id_usuario", id)
      .select("id_usuario, nombre, apellido, correo, rol, activo, creado_en")
      .single();
    if (res.error) return NextResponse.json({ error: res.error.message }, { status: 500 });
    data = res.data;
  } else {
    const res = await supabase
      .from("usuarios")
      .select("id_usuario, nombre, apellido, correo, rol, activo, creado_en")
      .eq("id_usuario", id)
      .single();
    if (res.error) return NextResponse.json({ error: res.error.message }, { status: 500 });
    data = res.data;
  }

  let idVeterinario: number | null = null;
  if (data.rol === "veterinario") {
    const { data: vetRow } = await supabase
      .from("veterinarios")
      .select("id_veterinario")
      .eq("id_usuario", id)
      .maybeSingle();
    if (vetRow) {
      idVeterinario = vetRow.id_veterinario;
      if (especialidad !== undefined) {
        await supabase.from("veterinarios").update({ especialidad: especialidad || null }).eq("id_usuario", id);
      }
    } else {
      const { data: nuevoVet } = await supabase
        .from("veterinarios")
        .insert({
          id_usuario: Number(id),
          especialidad: especialidad !== undefined ? (especialidad || null) : null,
          horario_inicio: "07:00",
          horario_fin: "20:00",
        })
        .select("id_veterinario")
        .single();
      idVeterinario = nuevoVet?.id_veterinario ?? null;
    }

    if (horarios && idVeterinario !== null) {
      const { error: delError } = await supabase
        .from("horarios_veterinario")
        .delete()
        .eq("id_veterinario", idVeterinario);
      if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });

      if (horarios.length > 0) {
        const rows = horarios.map((h) => ({
          id_veterinario: idVeterinario,
          dia_semana: h.dia_semana,
          hora_inicio: normalizaHora(h.hora_inicio),
          hora_fin: normalizaHora(h.hora_fin),
        }));
        const { error: insError } = await supabase.from("horarios_veterinario").insert(rows);
        if (insError) return NextResponse.json({ error: insError.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ data: { ...data, especialidad: especialidad ?? null } });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session || session.rol !== "administrador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  if ("contrasena" in body) {
    const parsed = z.object({ contrasena: passwordSchema }).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Contraseña inválida" },
        { status: 400 }
      );
    }
    const contrasena_hash = await hashPassword(parsed.data.contrasena);
    const { error } = await createAdminClient()
      .from("usuarios")
      .update({ contrasena_hash })
      .eq("id_usuario", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  const { activo } = body;
  const { data, error } = await createAdminClient()
    .from("usuarios")
    .update({ activo })
    .eq("id_usuario", id)
    .select("id_usuario, nombre, apellido, correo, rol, activo")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
