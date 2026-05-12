import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { calcularProximaDosis } from "@/lib/vacunas";

const WRITE_ROLES = ["administrador", "veterinario", "recepcionista"];

const updateSchema = z.object({
  tipo_vacuna: z.string().min(2),
  fecha_aplicacion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lote: z.string().nullable().optional(),
  id_veterinario: z.number().int().positive().nullable().optional(),
  observaciones: z.string().nullable().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || !WRITE_ROLES.includes(session.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createAdminClient();
  const fechaProxima = await calcularProximaDosis(supabase, parsed.data.tipo_vacuna, parsed.data.fecha_aplicacion);

  const { data, error } = await supabase
    .from("cartilla_vacunacion")
    .update({
      tipo_vacuna: parsed.data.tipo_vacuna,
      fecha_aplicacion: parsed.data.fecha_aplicacion,
      fecha_proxima_dosis: fechaProxima,
      lote: parsed.data.lote ?? null,
      id_veterinario: parsed.data.id_veterinario ?? null,
      observaciones: parsed.data.observaciones ?? null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.rol !== "administrador") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const { error } = await createAdminClient().from("cartilla_vacunacion").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
