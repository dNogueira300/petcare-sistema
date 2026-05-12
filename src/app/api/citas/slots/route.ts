import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { slotsDisponiblesVet } from "@/lib/horarios";

export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const idVet = searchParams.get("id_veterinario");
  const fecha = searchParams.get("fecha");
  if (!idVet || !fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return NextResponse.json({ error: "Parámetros incompletos" }, { status: 400 });
  }

  const slots = await slotsDisponiblesVet(createAdminClient(), Number(idVet), fecha);
  return NextResponse.json({ slots });
}
