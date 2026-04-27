import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

// Returns booked time slots for a vet on a given date (used by TimeSlotsGrid)
export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id_veterinario = searchParams.get("id_veterinario");
  const fecha = searchParams.get("fecha");

  if (!id_veterinario || !fecha) {
    return NextResponse.json({ error: "Parámetros incompletos" }, { status: 400 });
  }

  const { data } = await createAdminClient()
    .from("citas")
    .select("hora")
    .eq("id_veterinario", id_veterinario)
    .eq("fecha", fecha)
    .neq("estado", "cancelada");

  const ocupadas = (data ?? []).map((r) => (r.hora as string).slice(0, 5));
  return NextResponse.json({ ocupadas });
}
