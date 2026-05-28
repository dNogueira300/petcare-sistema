import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id_mascota = searchParams.get("id_mascota");
  const estado = searchParams.get("estado") ?? "activa";

  const supabase = createAdminClient();
  let query = supabase
    .from("alertas_vacunacion")
    .select(
      `
      *,
      mascotas(nombre, especie, clientes(usuarios(nombre, apellido, correo))),
      cartilla_vacunacion(tipo_vacuna, fecha_proxima_dosis)
    `,
    )
    .order("fecha_alerta", { ascending: true });

  if (estado !== "todas") query = query.eq("estado", estado);

  if (session.rol === "cliente") {
    const { data: clienteData } = await supabase
      .from("clientes")
      .select("id_cliente")
      .eq("id_usuario", session.id_usuario)
      .single();
    if (!clienteData) return NextResponse.json({ data: [] });
    const { data: mascotas } = await supabase
      .from("mascotas")
      .select("id_mascota")
      .eq("id_cliente", clienteData.id_cliente);
    const ids = (mascotas ?? []).map(
      (m: { id_mascota: number }) => m.id_mascota,
    );
    if (ids.length === 0) return NextResponse.json({ data: [] });
    query = query.in("id_mascota", ids);
  } else if (id_mascota) {
    query = query.eq("id_mascota", id_mascota);
  }

  const { data, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
