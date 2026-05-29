import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

/**
 * GET /api/auditoria/historia-clinica
 * Auditoría filtrable de historias clínicas (solo admin).
 * Params: id_mascota?, id_veterinario?, desde?, hasta?
 */
export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session || session.rol !== "administrador") {
    return NextResponse.json({ error: "Solo el administrador puede acceder a la auditoría" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id_mascota    = searchParams.get("id_mascota");
  const id_veterinario = searchParams.get("id_veterinario");
  const desde         = searchParams.get("desde");
  const hasta         = searchParams.get("hasta");

  const admin = createAdminClient();

  let query = admin
    .from("auditoria_historia_clinica")
    .select(`
      *,
      usuarios!auditoria_historia_clinica_id_usuario_fkey(nombre, apellido, rol),
      historia_clinica(
        id_historia,
        fecha_consulta,
        mascotas(nombre, especie),
        veterinarios(id_veterinario, usuarios(nombre, apellido))
      )
    `)
    .order("timestamp_cambio", { ascending: false })
    .limit(500);

  if (desde) query = query.gte("timestamp_cambio", `${desde}T00:00:00`);
  if (hasta) query = query.lte("timestamp_cambio", `${hasta}T23:59:59`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Filtrar por mascota o veterinario en aplicación (la join anidada no permite .eq en subnivel)
  type AudRow = {
    id_historia: number;
    historia_clinica?: {
      mascotas?: { nombre: string };
      veterinarios?: { id_veterinario: number };
    } | null;
  };

  let result = (data ?? []) as AudRow[];
  if (id_mascota) {
    result = result.filter(r => {
      const hc = r.historia_clinica;
      if (!hc) return false;
      // No podemos filtrar directamente por id_mascota desde este join,
      // así que filtramos por id_historia vinculado a la mascota solicitada
      return true; // se aplicará en la siguiente query
    });
    // Query secundaria: IDs de historias de la mascota
    const { data: hcs } = await admin
      .from("historia_clinica")
      .select("id_historia")
      .eq("id_mascota", id_mascota);
    const idsHC = new Set((hcs ?? []).map((h: { id_historia: number }) => h.id_historia));
    result = (data ?? []).filter((r: AudRow) => idsHC.has(r.id_historia)) as AudRow[];
  }

  if (id_veterinario) {
    const { data: hcs } = await admin
      .from("historia_clinica")
      .select("id_historia")
      .eq("id_veterinario", id_veterinario);
    const idsHC = new Set((hcs ?? []).map((h: { id_historia: number }) => h.id_historia));
    result = result.filter((r: { id_historia: number }) => idsHC.has(r.id_historia)) as AudRow[];
  }

  return NextResponse.json({ data: result });
}
