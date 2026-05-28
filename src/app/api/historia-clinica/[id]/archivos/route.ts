import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

const BUCKET = "petcare-historias";
type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSessionUser();
  if (!session)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  // Clientes: verificar que la historia pertenece a una mascota suya
  if (session.rol === "cliente") {
    const { data: hc } = await admin
      .from("historia_clinica")
      .select("id_mascota, mascotas(id_cliente, clientes(id_usuario))")
      .eq("id_historia", id)
      .single();

    const idUsuarioDueno = (
      hc as { mascotas?: { clientes?: { id_usuario: number } } } | null
    )?.mascotas?.clientes?.id_usuario;

    if (!hc || idUsuarioDueno !== session.id_usuario) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
  } else if (
    !["administrador", "veterinario", "recepcionista"].includes(session.rol)
  ) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { data, error } = await admin
    .from("archivos_historia_clinica")
    .select(
      "*, usuarios!archivos_historia_clinica_subido_por_fkey(nombre, apellido)",
    )
    .eq("id_historia", id)
    .order("fecha_carga", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Generar URLs firmadas (1 hora)
  const archivosConUrl = await Promise.all(
    (data ?? []).map(async (archivo) => {
      const { data: signedData } = await admin.storage
        .from(BUCKET)
        .createSignedUrl(archivo.path_storage, 3600);
      return {
        ...archivo,
        url_firmada: signedData?.signedUrl ?? archivo.url_publica,
      };
    }),
  );

  return NextResponse.json({ data: archivosConUrl });
}
