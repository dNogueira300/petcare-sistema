import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { passwordSchema } from "@/utils/password";

const updateSchema = z.object({
  nombre: z.string().min(2).optional(),
  apellido: z.string().min(2).optional(),
  correo: z.string().email().optional(),
  rol: z.enum(["administrador", "veterinario", "recepcionista"]).optional(),
  especialidad: z.string().optional(),
});

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
  const { especialidad, ...userFields } = parsed.data;

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

  if (data.rol === "veterinario" && especialidad !== undefined) {
    const { data: vetRow } = await supabase
      .from("veterinarios")
      .select("id_veterinario")
      .eq("id_usuario", id)
      .maybeSingle();
    if (vetRow) {
      await supabase.from("veterinarios").update({ especialidad: especialidad || null }).eq("id_usuario", id);
    } else {
      await supabase.from("veterinarios").insert({
        id_usuario: Number(id),
        especialidad: especialidad || null,
        horario_inicio: "07:00",
        horario_fin: "20:00",
      });
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
