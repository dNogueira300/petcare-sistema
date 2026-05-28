import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const session = await getSessionUser();
  if (!session)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const supabase = createAdminClient();

  // Auto-create veterinarios rows for vet users that were created before this logic existed
  const { data: vetUsers } = await supabase
    .from("usuarios")
    .select("id_usuario")
    .eq("rol", "veterinario");

  if (vetUsers && vetUsers.length > 0) {
    const { data: existing } = await supabase
      .from("veterinarios")
      .select("id_usuario");

    const existingIds = new Set(
      (existing ?? []).map((v: { id_usuario: number }) => v.id_usuario),
    );
    const missing = vetUsers.filter(
      (u: { id_usuario: number }) => !existingIds.has(u.id_usuario),
    );

    if (missing.length > 0) {
      await supabase.from("veterinarios").insert(
        missing.map((u: { id_usuario: number }) => ({
          id_usuario: u.id_usuario,
          horario_inicio: "07:00",
          horario_fin: "20:00",
        })),
      );
    }
  }

  const { data, error } = await supabase
    .from("veterinarios")
    .select(
      "id_veterinario, id_usuario, especialidad, horario_inicio, horario_fin, usuarios(nombre, apellido), veterinario_especialidad(especialidades(nombre))",
    )
    .order("id_veterinario");

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
