import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

const BUCKET = "petcare-historias";
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
const ALLOWED_MIME = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "image/bmp", "image/tiff", "application/pdf",
]);
const TIPO_POR_MIME: Record<string, string> = {
  "application/pdf": "laboratorio",
  "image/jpeg": "fotografia",
  "image/png":  "fotografia",
  "image/gif":  "fotografia",
  "image/webp": "fotografia",
};

function isMimeAllowed(mime: string): boolean {
  if (ALLOWED_MIME.has(mime)) return true;
  if (mime.startsWith("image/")) return true;
  return false;
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session || !["administrador", "veterinario"].includes(session.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Formato de solicitud inválido" }, { status: 400 });
  }

  const file         = formData.get("file") as File | null;
  const id_historia  = formData.get("id_historia");
  const id_mascota   = formData.get("id_mascota");
  const tipo_archivo = (formData.get("tipo_archivo") as string | null) ?? "otro";

  if (!file || !id_historia || !id_mascota) {
    return NextResponse.json({ error: "Se requiere file, id_historia e id_mascota" }, { status: 400 });
  }

  if (!isMimeAllowed(file.type)) {
    return NextResponse.json(
      { error: `Tipo de archivo no permitido: ${file.type}. Permitidos: imágenes y PDF` },
      { status: 415 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: `El archivo supera el límite de 50 MB (${(file.size / 1024 / 1024).toFixed(1)} MB)` },
      { status: 413 }
    );
  }

  const admin  = createAdminClient();
  const ts     = Date.now();
  const path   = `historia/${id_historia}/${ts}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: `Error al subir archivo: ${uploadError.message}` }, { status: 500 });
  }

  const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path);

  const tipoFinal = ["radiografia","ecografia","fotografia","laboratorio","receta","otro"].includes(tipo_archivo)
    ? tipo_archivo
    : (TIPO_POR_MIME[file.type] ?? "otro");

  const { data, error: dbError } = await admin
    .from("archivos_historia_clinica")
    .insert({
      id_historia:     Number(id_historia),
      id_mascota:      Number(id_mascota),
      tipo_archivo:    tipoFinal,
      nombre_original: file.name,
      path_storage:    path,
      tamano_bytes:    file.size,
      mime_type:       file.type,
      url_publica:     urlData?.publicUrl ?? null,
      subido_por:      session.id_usuario,
    })
    .select()
    .single();

  if (dbError) {
    // Revertir el archivo subido si falla el registro en BD
    await admin.storage.from(BUCKET).remove([path]);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
