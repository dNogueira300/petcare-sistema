import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";
import {
  proximaDosisDesdeFrecuencia,
  FRECUENCIA_LABEL,
  type Frecuencia,
} from "@/lib/vacunas";

const WRITE_ROLES = ["administrador", "veterinario", "recepcionista"];

const frecuenciaEnum = z.enum([
  "unica",
  "semanal",
  "21dias",
  "mensual",
  "trimestral",
  "semestral",
  "anual",
]);

const createSchema = z.object({
  id_mascota: z.number().int().positive(),
  tipo_vacuna: z.string().min(2),
  fecha_aplicacion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  frecuencia: frecuenciaEnum.optional(),
  lote: z.string().optional(),
  fecha_vencimiento_lote: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  dosis_numero: z.number().int().positive().optional(),
  tipo_vacuna_categoria: z
    .enum(["obligatoria", "recomendada", "opcional"])
    .optional(),
  id_veterinario: z.number().int().positive().optional(),
  observaciones: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const idMascota = searchParams.get("id_mascota");
  if (!idMascota)
    return NextResponse.json(
      { error: "Se requiere id_mascota" },
      { status: 400 },
    );

  const supabase = createAdminClient();

  if (session.rol === "cliente") {
    const { data: cliente } = await supabase
      .from("clientes")
      .select("id_cliente")
      .eq("id_usuario", session.id_usuario)
      .maybeSingle();
    const { data: mascota } = await supabase
      .from("mascotas")
      .select("id_cliente")
      .eq("id_mascota", idMascota)
      .maybeSingle();
    if (!cliente || !mascota || mascota.id_cliente !== cliente.id_cliente) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
  }

  const { data, error } = await supabase
    .from("cartilla_vacunacion")
    .select(
      `
      id, id_mascota, tipo_vacuna, fecha_aplicacion, fecha_proxima_dosis, lote,
      id_veterinario, observaciones, frecuencia, creado_en,
      veterinarios(id_veterinario, usuarios(nombre, apellido))
    `,
    )
    .eq("id_mascota", idMascota)
    .order("fecha_aplicacion", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session || !WRITE_ROLES.includes(session.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  let idVeterinario = parsed.data.id_veterinario ?? null;
  if (!idVeterinario && session.rol === "veterinario") {
    const { data: vet } = await supabase
      .from("veterinarios")
      .select("id_veterinario")
      .eq("id_usuario", session.id_usuario)
      .maybeSingle();
    idVeterinario = vet?.id_veterinario ?? null;
  }

  // Validar lote no vencido
  if (parsed.data.fecha_vencimiento_lote) {
    const hoy = new Date().toISOString().slice(0, 10);
    if (parsed.data.fecha_vencimiento_lote < hoy) {
      return NextResponse.json(
        { error: "El lote de la vacuna está vencido" },
        { status: 400 },
      );
    }
  }

  const frecuencia = parsed.data.frecuencia ?? null;
  const fechaProxima = proximaDosisDesdeFrecuencia(
    parsed.data.fecha_aplicacion,
    frecuencia,
  );

  const { data, error } = await supabase
    .from("cartilla_vacunacion")
    .insert({
      id_mascota: parsed.data.id_mascota,
      tipo_vacuna: parsed.data.tipo_vacuna,
      fecha_aplicacion: parsed.data.fecha_aplicacion,
      fecha_proxima_dosis: fechaProxima,
      lote: parsed.data.lote ?? null,
      fecha_vencimiento_lote: parsed.data.fecha_vencimiento_lote ?? null,
      dosis_numero: parsed.data.dosis_numero ?? null,
      tipo_vacuna_categoria: parsed.data.tipo_vacuna_categoria ?? "recomendada",
      id_veterinario: idVeterinario,
      observaciones: parsed.data.observaciones ?? null,
      frecuencia,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Crear alerta de próxima dosis (si hay fecha próxima)
  if (data && fechaProxima) {
    const DIAS_ANTICIPACION = 7;
    const fechaAlerta = new Date(fechaProxima);
    fechaAlerta.setDate(fechaAlerta.getDate() - DIAS_ANTICIPACION);
    await supabase.from("alertas_vacunacion").insert({
      id_mascota: parsed.data.id_mascota,
      id_vacuna: data.id,
      tipo_alerta: "proximo_refuerzo",
      fecha_alerta: fechaAlerta.toISOString().slice(0, 10),
      dias_anticipacion: DIAS_ANTICIPACION,
      estado: "activa",
    });
  }

  // También registramos la vacuna en la historia clínica de la mascota.
  if (idVeterinario) {
    const detalleLote = parsed.data.lote ? ` (lote ${parsed.data.lote})` : "";
    const detalleFrec = frecuencia
      ? `. Frecuencia: ${FRECUENCIA_LABEL[frecuencia as Frecuencia]}`
      : "";
    const detalleProx = fechaProxima ? `. Próxima dosis: ${fechaProxima}` : "";
    await supabase.from("historia_clinica").insert({
      id_cita: null,
      id_mascota: parsed.data.id_mascota,
      id_veterinario: idVeterinario,
      fecha_consulta: parsed.data.fecha_aplicacion,
      diagnostico: `Vacunación: ${parsed.data.tipo_vacuna}`,
      tratamiento: `Aplicación de vacuna ${parsed.data.tipo_vacuna}${detalleLote}${detalleFrec}${detalleProx}`,
      observaciones: parsed.data.observaciones ?? null,
      peso_consulta: null,
    });
  }

  return NextResponse.json({ data }, { status: 201 });
}
