import { BrevoClient, BrevoEnvironment } from "@getbrevo/brevo";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://petcare-sistema.vercel.app";

/* ─── Cliente Brevo ────────────────────────────────────────────────────────
   La clave SMTP de Brevo (xkeysib-...) es la misma que la API key del SDK.
   ────────────────────────────────────────────────────────────────────────── */
function getClient(): BrevoClient {
  return new BrevoClient({
    apiKey: process.env.BREVO_SMTP_PASS ?? "",
    environment: BrevoEnvironment.Default,
  });
}

/* ─── Tipos ───────────────────────────────────────────────────────────────── */
export interface RecordatorioParams {
  nombreCliente: string;
  nombreMascota: string;
  especie: string;
  fechaFormateada: string; // "dd/MM/yyyy"
  hora: string; // "HH:MM"
  nombreVeterinario: string;
  correoCliente: string;
}

/* ─── HTML template (sin imágenes base64 → correo < 15 KB) ──────────────── */
function buildHtml(p: RecordatorioParams): string {
  return /* html */ `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Recordatorio de cita — PetCare</title>
</head>
<body style="margin:0;padding:0;background:#e8dfd0;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#e8dfd0;padding:28px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0"
      style="max-width:560px;width:100%;background:#fdf6e3;border-radius:14px;
             overflow:hidden;border:1px solid #d4c8a8;">

      <!-- HEADER -->
      <tr>
        <td style="background:#2d6a4f;padding:26px 32px 20px;text-align:center;">
          <div style="display:inline-block;background:rgba(255,255,255,0.12);
            border:1.5px solid rgba(255,255,255,0.25);border-radius:10px;
            padding:10px 22px;">
            <span style="color:#d4a017;font-size:20px;font-weight:700;">&#x1F43E;</span>
            <span style="font-size:18px;font-weight:700;color:#ffffff;
              letter-spacing:0.04em;"> Veterinaria PetCare</span>
          </div>
          <p style="margin:10px 0 0;font-size:11px;letter-spacing:0.14em;
            text-transform:uppercase;color:rgba(255,255,255,0.5);">Iquitos, Per&uacute;</p>
        </td>
      </tr>

      <!-- TITLE BAND -->
      <tr>
        <td style="background:#d4a017;padding:10px 32px;text-align:center;">
          <span style="font-size:12px;font-weight:700;color:#fff;letter-spacing:0.1em;
            text-transform:uppercase;">&#x1F4C5; Recordatorio de cita</span>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td style="padding:28px 32px 0;">
          <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#1a3320;">
            Hola, ${p.nombreCliente} &#x1F44B;
          </p>
          <p style="margin:0 0 22px;font-size:14px;color:#4a3d2e;line-height:1.65;">
            Te recordamos que ma&ntilde;ana tienes una cita programada
            para <strong>${p.nombreMascota}</strong>. &iexcl;Te esperamos!
          </p>

          <!-- CITA CARD -->
          <table width="100%" cellpadding="0" cellspacing="0"
            style="background:#fff8ee;border:1px solid #e8d8a0;border-radius:10px;
                   margin-bottom:22px;">
            <tr><td style="padding:20px 22px;">
              <table width="100%" cellpadding="7" cellspacing="0">
                <tr>
                  <td width="34" style="font-size:17px;">&#x1F43E;</td>
                  <td style="font-size:11px;font-weight:700;text-transform:uppercase;
                    letter-spacing:0.07em;color:#8a7a60;width:110px;">Mascota</td>
                  <td style="font-size:14px;font-weight:600;color:#1a3320;">
                    ${p.nombreMascota}
                    <span style="font-weight:400;color:#6b5c44;">(${p.especie})</span>
                  </td>
                </tr>
                <tr style="border-top:1px solid #f0e4c0;">
                  <td style="font-size:17px;">&#x1F4C5;</td>
                  <td style="font-size:11px;font-weight:700;text-transform:uppercase;
                    letter-spacing:0.07em;color:#8a7a60;">Fecha</td>
                  <td style="font-size:14px;font-weight:600;color:#1a3320;">${p.fechaFormateada}</td>
                </tr>
                <tr style="border-top:1px solid #f0e4c0;">
                  <td style="font-size:17px;">&#x1F550;</td>
                  <td style="font-size:11px;font-weight:700;text-transform:uppercase;
                    letter-spacing:0.07em;color:#8a7a60;">Hora</td>
                  <td style="font-size:15px;font-weight:700;color:#d4a017;">${p.hora}</td>
                </tr>
                <tr style="border-top:1px solid #f0e4c0;">
                  <td style="font-size:17px;">&#x1FA7A;</td>
                  <td style="font-size:11px;font-weight:700;text-transform:uppercase;
                    letter-spacing:0.07em;color:#8a7a60;">Veterinario</td>
                  <td style="font-size:14px;font-weight:600;color:#1a3320;">${p.nombreVeterinario}</td>
                </tr>
              </table>
            </td></tr>
          </table>

          <p style="margin:0 0 24px;font-size:13px;color:#4a3d2e;line-height:1.7;">
            Por favor pres&eacute;ntate con <strong>10 minutos de anticipaci&oacute;n</strong>.
            Si necesitas cancelar o reprogramar, hazlo desde tu portal de cliente.
          </p>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" width="100%"
            style="margin-bottom:28px;">
            <tr><td align="center">
              <a href="${APP_URL}/portal"
                style="display:inline-block;background:#2d6a4f;color:#ffffff;
                  text-decoration:none;font-size:14px;font-weight:700;
                  padding:13px 32px;border-radius:9px;letter-spacing:0.02em;">
                Ver mis citas en el portal &#x2192;
              </a>
            </td></tr>
          </table>
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background:#f0e8d0;border-top:1px solid #ddd0a8;
          padding:14px 32px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#8a7a60;line-height:1.65;">
            Mensaje autom&aacute;tico de <strong>Veterinaria PetCare</strong>.<br />
            Ante cualquier consulta, cont&aacute;ctanos directamente.
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/* ─── Función pública ─────────────────────────────────────────────────────── */
export async function sendRecordatorioCita(
  p: RecordatorioParams,
): Promise<void> {
  const client = getClient();

  await client.transactionalEmails.sendTransacEmail({
    sender: {
      name: process.env.BREVO_FROM_NAME ?? "PetCare",
      email: process.env.BREVO_FROM_EMAIL ?? "noreply@petcare.pe",
    },
    to: [{ email: p.correoCliente, name: p.nombreCliente }],
    subject: `\u{1F43E} Recordatorio: cita de ${p.nombreMascota} mañana a las ${p.hora}`,
    htmlContent: buildHtml(p),
  });
}
