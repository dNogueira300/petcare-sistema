import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { sendRecordatorioCita } from "@/lib/mailer";
import { formatLima, hoyCimaFecha } from "@/utils/datetime";

function mananaFecha(): string {
  const [y, m, d] = hoyCimaFecha().split("-").map(Number);
  const manana = new Date(y, m - 1, d + 1);
  return [
    manana.getFullYear(),
    String(manana.getMonth() + 1).padStart(2, "0"),
    String(manana.getDate()).padStart(2, "0"),
  ].join("-");
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const fecha = mananaFecha();

  const { data: citas, error } = await supabase
    .from("citas")
    .select(`
      id_cita, fecha, hora, motivo, estado,
      mascotas(nombre, especie, clientes(usuarios(nombre, apellido, correo))),
      veterinarios(usuarios(nombre, apellido))
    `)
    .eq("fecha", fecha)
    .in("estado", ["pendiente", "confirmada"]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!citas || citas.length === 0) {
    return NextResponse.json({ mensaje: "No hay citas mañana", enviados: 0 });
  }

  // Idempotencia: omitir citas con recordatorio ya enviado
  const idsCitas = citas.map((c) => c.id_cita);
  const { data: yaEnviados } = await supabase
    .from("recordatorios_enviados")
    .select("id_cita")
    .in("id_cita", idsCitas)
    .eq("canal", "email");

  const yaEnviadosSet = new Set((yaEnviados ?? []).map((r: { id_cita: number }) => r.id_cita));
  const pendientes = citas.filter((c) => !yaEnviadosSet.has(c.id_cita));

  if (pendientes.length === 0) {
    return NextResponse.json({ mensaje: "Todos los recordatorios ya fueron enviados", enviados: 0 });
  }

  let enviados = 0, fallidos = 0;

  for (const cita of pendientes) {
    const mascota = cita.mascotas as unknown as {
      nombre: string; especie: string;
      clientes: { usuarios: { nombre: string; apellido: string; correo: string } } | null;
    } | null;
    const vet = cita.veterinarios as unknown as {
      usuarios: { nombre: string; apellido: string };
    } | null;

    const correoCliente = mascota?.clientes?.usuarios?.correo;
    if (!correoCliente) continue;

    const nombreCliente = `${mascota?.clientes?.usuarios?.nombre ?? ""} ${mascota?.clientes?.usuarios?.apellido ?? ""}`.trim();
    const nombreVet = vet ? `${vet.usuarios.nombre} ${vet.usuarios.apellido}` : "Veterinario";
    const horaStr = (cita.hora as string).slice(0, 5);
    const fechaFormateada = formatLima(`${cita.fecha}T00:00:00`, "dd/MM/yyyy");

    let estadoEnvio: "enviado" | "fallido" = "enviado";
    let detalle: string | null = null;

    try {
      await sendRecordatorioCita({
        nombreCliente,
        nombreMascota: mascota?.nombre ?? "Tu mascota",
        especie: mascota?.especie ?? "",
        fechaFormateada,
        hora: horaStr,
        nombreVeterinario: nombreVet,
        correoCliente,
      });
      enviados++;
    } catch (err) {
      estadoEnvio = "fallido";
      detalle = err instanceof Error ? err.message : "Error desconocido";
      fallidos++;
    }

    await supabase.from("recordatorios_enviados").upsert(
      { id_cita: cita.id_cita, canal: "email", estado: estadoEnvio, detalle },
      { onConflict: "id_cita,canal" }
    );
  }

  return NextResponse.json({
    fecha,
    total: pendientes.length,
    enviados,
    fallidos,
    omitidos: citas.length - pendientes.length,
  });
}
