import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";

const createSchema = z.object({
  id_mascota: z.number().int().positive(),
  motivo: z.string().min(5),
  preferencia_fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  preferencia_veterinario: z.number().int().positive().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session || session.rol !== "cliente") {
    return NextResponse.json(
      { error: "Solo clientes pueden unirse a la cola de espera" },
      { status: 403 },
    );
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Obtener el id_cliente del usuario autenticado
  const { data: clienteData } = await admin
    .from("clientes")
    .select("id_cliente")
    .eq("id_usuario", session.id_usuario)
    .single();

  if (!clienteData) {
    return NextResponse.json(
      { error: "Perfil de cliente no encontrado" },
      { status: 404 },
    );
  }

  // Verificar que la mascota pertenece al cliente
  const { data: mascota } = await admin
    .from("mascotas")
    .select("id_mascota")
    .eq("id_mascota", parsed.data.id_mascota)
    .eq("id_cliente", clienteData.id_cliente)
    .single();

  if (!mascota) {
    return NextResponse.json(
      { error: "Mascota no encontrada o no te pertenece" },
      { status: 403 },
    );
  }

  // Verificar que no esté ya en la cola activa
  const { count } = await admin
    .from("colas_espera")
    .select("id_cola_espera", { count: "exact", head: true })
    .eq("id_mascota", parsed.data.id_mascota)
    .eq("id_cliente", clienteData.id_cliente)
    .eq("estado", "activa");

  if (count && count > 0) {
    return NextResponse.json(
      { error: "Esta mascota ya está en la lista de espera" },
      { status: 409 },
    );
  }

  const { data, error } = await admin
    .from("colas_espera")
    .insert({
      id_mascota: parsed.data.id_mascota,
      id_cliente: clienteData.id_cliente,
      motivo: parsed.data.motivo,
      preferencia_fecha: parsed.data.preferencia_fecha ?? null,
      preferencia_veterinario: parsed.data.preferencia_veterinario ?? null,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.rol !== "cliente") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: clienteData } = await admin
    .from("clientes")
    .select("id_cliente")
    .eq("id_usuario", session.id_usuario)
    .single();
  if (!clienteData) return NextResponse.json({ data: [] });

  const { data, error } = await admin
    .from("colas_espera")
    .select("*, mascotas(nombre, especie)")
    .eq("id_cliente", clienteData.id_cliente)
    .in("estado", ["activa", "oferecido_horario"])
    .order("fecha_registro", { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
