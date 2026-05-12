import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { hashPassword, getSessionUser } from "@/lib/auth";
import { passwordSchema } from "@/utils/password";

const createSchema = z.object({
  nombre: z.string().min(2),
  apellido: z.string().min(2),
  correo: z.string().email(),
  contrasena: passwordSchema,
  rol: z.enum(["administrador", "veterinario", "recepcionista"]),
  especialidad: z.string().optional(),
});

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.rol !== "administrador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { data, error } = await createAdminClient()
    .from("usuarios")
    .select("id_usuario, nombre, apellido, correo, rol, activo, creado_en, veterinarios(especialidad)")
    .not("rol", "eq", "cliente")
    .order("creado_en", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const flat = (data ?? []).map((u: Record<string, unknown>) => {
    const vet = u.veterinarios as { especialidad: string | null }[] | { especialidad: string | null } | null;
    const especialidad = Array.isArray(vet) ? (vet[0]?.especialidad ?? null) : (vet?.especialidad ?? null);
    const { veterinarios: _v, ...rest } = u;
    return { ...rest, especialidad };
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

  const { contrasena, especialidad, ...rest } = parsed.data;
  const contrasena_hash = await hashPassword(contrasena);

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
    await supabase
      .from("veterinarios")
      .insert({
        id_usuario: data.id_usuario,
        especialidad: especialidad || null,
        horario_inicio: "07:00",
        horario_fin: "20:00",
      });
  }

  return NextResponse.json({ data: { ...data, especialidad: especialidad || null } }, { status: 201 });
}
