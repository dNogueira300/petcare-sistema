import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

const BUCKET = "petcare-historias";
type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session || !["administrador", "veterinario"].includes(session.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data: archivo } = await admin
    .from("archivos_historia_clinica")
    .select("path_storage, subido_por")
    .eq("id_archivo", id)
    .single();

  if (!archivo)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // Solo el que subió o el admin puede eliminar
  if (
    session.rol !== "administrador" &&
    archivo.subido_por !== session.id_usuario
  ) {
    return NextResponse.json(
      { error: "No autorizado para eliminar este archivo" },
      { status: 403 },
    );
  }

  // Eliminar del storage
  await admin.storage.from(BUCKET).remove([archivo.path_storage]);

  // Eliminar registro en BD
  const { error } = await admin
    .from("archivos_historia_clinica")
    .delete()
    .eq("id_archivo", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
