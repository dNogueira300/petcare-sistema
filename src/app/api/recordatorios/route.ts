import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { sendRecordatorioCita, sendRecordatorioVacuna } from "@/lib/mailer";
import { formatLima, hoyCimaFecha, format12h } from "@/utils/datetime";

const DIAS_AVISO_VACUNA = Number(process.env.DIAS_AVISO_VACUNA ?? 3);

function sumarDias(fechaISO: string, dias: number): string {
  const [y, m, d] = fechaISO.split("-").map(Number);
  const f = new Date(y, m - 1, d + dias);
  return [
    f.getFullYear(),
    String(f.getMonth() + 1).padStart(2, "0"),
    String(f.getDate()).padStart(2, "0"),
  ].join("-");
}

type Resumen = {
  fecha_citas: string;
  fecha_vacunas: string;
  citas_enviadas: number;
  citas_omitidas: number;
  citas_fallidas: number;
  vacunas_enviadas: number;
  vacunas_omitidas: number;
  vacunas_fallidas: number;
  cuentas_eliminadas: number;
};

async function procesar(): Promise<Resumen> {
  const supabase = createAdminClient();
  const hoy = hoyCimaFecha();
  const fechaCitas = sumarDias(hoy, 1);
  const fechaVacunas = sumarDias(hoy, DIAS_AVISO_VACUNA);

  const r: Resumen = {
    fecha_citas: fechaCitas,
    fecha_vacunas: fechaVacunas,
    citas_enviadas: 0, citas_omitidas: 0, citas_fallidas: 0,
    vacunas_enviadas: 0, vacunas_omitidas: 0, vacunas_fallidas: 0,
    cuentas_eliminadas: 0,
  };

  /* ─── 1. Recordatorios de citas (mañana) ─────────────────────────────── */
  const { data: citas } = await supabase
    .from("citas")
    .select(`
      id_cita, fecha, hora, motivo, estado,
      mascotas(nombre, especie, clientes(usuarios(nombre, apellido, correo))),
      veterinarios(usuarios(nombre, apellido))
    `)
    .eq("fecha", fechaCitas)
    .in("estado", ["pendiente", "confirmada"]);

  if (citas && citas.length > 0) {
    const idsCitas = citas.map((c) => c.id_cita);
    const { data: yaEnviados } = await supabase
      .from("recordatorios_enviados")
      .select("id_cita")
      .in("id_cita", idsCitas)
      .eq("canal", "email")
      .eq("tipo", "cita");
    const enviadosSet = new Set((yaEnviados ?? []).map((x: { id_cita: number }) => x.id_cita));

    for (const cita of citas) {
      if (enviadosSet.has(cita.id_cita)) { r.citas_omitidas++; continue; }

      const mascota = cita.mascotas as unknown as {
        nombre: string; especie: string;
        clientes: { usuarios: { nombre: string; apellido: string; correo: string } } | null;
      } | null;
      const vet = cita.veterinarios as unknown as { usuarios: { nombre: string; apellido: string } } | null;

      const correoCliente = mascota?.clientes?.usuarios?.correo;
      if (!correoCliente) { r.citas_omitidas++; continue; }

      const nombreCliente = `${mascota?.clientes?.usuarios?.nombre ?? ""} ${mascota?.clientes?.usuarios?.apellido ?? ""}`.trim();
      const nombreVet = vet ? `${vet.usuarios.nombre} ${vet.usuarios.apellido}` : "Veterinario";

      let estadoEnvio: "enviado" | "fallido" = "enviado";
      let detalle: string | null = null;
      try {
        await sendRecordatorioCita({
          nombreCliente,
          nombreMascota: mascota?.nombre ?? "Tu mascota",
          especie: mascota?.especie ?? "",
          fechaFormateada: formatLima(`${cita.fecha}T00:00:00`, "dd/MM/yyyy"),
          hora: format12h(cita.hora as string),
          nombreVeterinario: nombreVet,
          correoCliente,
        });
        r.citas_enviadas++;
      } catch (err) {
        estadoEnvio = "fallido";
        detalle = err instanceof Error ? err.message : "Error desconocido";
        r.citas_fallidas++;
      }

      await supabase.from("recordatorios_enviados").insert(
        { id_cita: cita.id_cita, canal: "email", tipo: "cita", estado: estadoEnvio, detalle },
      );
    }
  }

  /* ─── 2. Recordatorios de vacunas (próxima dosis en N días) ──────────── */
  const { data: vacunas } = await supabase
    .from("cartilla_vacunacion")
    .select(`
      id, tipo_vacuna, fecha_proxima_dosis,
      mascotas(nombre, clientes(usuarios(nombre, apellido, correo)))
    `)
    .eq("fecha_proxima_dosis", fechaVacunas);

  if (vacunas && vacunas.length > 0) {
    const idsVac = vacunas.map((v) => v.id);
    const { data: yaVac } = await supabase
      .from("recordatorios_enviados")
      .select("id_vacuna")
      .in("id_vacuna", idsVac)
      .eq("canal", "email");
    const vacSet = new Set((yaVac ?? []).map((x: { id_vacuna: number }) => x.id_vacuna));

    for (const vac of vacunas) {
      if (vacSet.has(vac.id)) { r.vacunas_omitidas++; continue; }

      const mascota = vac.mascotas as unknown as {
        nombre: string;
        clientes: { usuarios: { nombre: string; apellido: string; correo: string } } | null;
      } | null;
      const correoCliente = mascota?.clientes?.usuarios?.correo;
      if (!correoCliente) { r.vacunas_omitidas++; continue; }

      const nombreCliente = `${mascota?.clientes?.usuarios?.nombre ?? ""} ${mascota?.clientes?.usuarios?.apellido ?? ""}`.trim();

      let estadoEnvio: "enviado" | "fallido" = "enviado";
      let detalle: string | null = null;
      try {
        await sendRecordatorioVacuna({
          correoCliente,
          nombreCliente,
          nombreMascota: mascota?.nombre ?? "Tu mascota",
          tipoVacuna: vac.tipo_vacuna,
          fechaProximaDosis: formatLima(`${vac.fecha_proxima_dosis}T00:00:00`, "dd/MM/yyyy"),
        });
        r.vacunas_enviadas++;
      } catch (err) {
        estadoEnvio = "fallido";
        detalle = err instanceof Error ? err.message : "Error desconocido";
        r.vacunas_fallidas++;
      }

      await supabase.from("recordatorios_enviados").insert(
        { id_vacuna: vac.id, id_cita: null, canal: "email", tipo: "vacuna", estado: estadoEnvio, detalle },
      );
    }
  }

  /* ─── 3. Limpieza de cuentas de cliente no verificadas (token expirado) ─ */
  const { data: eliminadas } = await supabase
    .from("usuarios")
    .delete()
    .eq("rol", "cliente")
    .eq("correo_verificado", false)
    .lt("token_expira", new Date().toISOString())
    .select("id_usuario");
  r.cuentas_eliminadas = eliminadas?.length ?? 0;
  if (r.cuentas_eliminadas > 0) {
    console.log(`[RECORDATORIOS] Eliminadas ${r.cuentas_eliminadas} cuentas de cliente sin verificar.`);
  }

  return r;
}

function autorizado(req: NextRequest): boolean {
  if (!process.env.CRON_SECRET) return true;
  const header = req.headers.get("x-cron-secret");
  const auth = req.headers.get("authorization");
  return header === process.env.CRON_SECRET || auth === `Bearer ${process.env.CRON_SECRET}`;
}

export async function POST(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json(await procesar());
}

export async function GET(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json(await procesar());
}
