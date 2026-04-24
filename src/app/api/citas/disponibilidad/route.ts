import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id_veterinario = searchParams.get("id_veterinario");
  const fecha = searchParams.get("fecha");
  const hora = searchParams.get("hora");

  if (!id_veterinario || !fecha || !hora) {
    return NextResponse.json({ error: "Parámetros incompletos" }, { status: 400 });
  }

  const { data } = await createAdminClient()
    .from("citas")
    .select("id_cita")
    .eq("id_veterinario", id_veterinario)
    .eq("fecha", fecha)
    .eq("hora", hora)
    .neq("estado", "cancelada")
    .single();

  return NextResponse.json({ disponible: !data });
}
