import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";

// La ruta usa el SDK de Supabase con service key → runtime Node, nunca cacheada.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PageOpts {
  ok: boolean;
  dest: string;          // a dónde llevar al usuario después
  user?: Record<string, unknown>; // si se verificó: usuario para auto-login (sin contraseña)
}

/**
 * Devolvemos HTML directamente (status 200) en lugar de un redirect:
 *  - no depende de cómo Next maneje cookies en una respuesta de redirección
 *  - no depende del middleware al seguir el redirect
 *  - el usuario ve siempre un mensaje claro
 * La cookie de sesión se fija con res.cookies.set() (forma canónica y segura).
 */
function htmlResponse({ ok, dest, user }: PageOpts): NextResponse {
  const destLiteral = JSON.stringify(dest);
  const userLiteral = user
    ? JSON.stringify(JSON.stringify(user)).replace(/</g, "\\u003c")
    : "null";

  const accent = ok ? "#2d6a4f" : "#b45309";
  const iconBg = ok ? "#dcfce7" : "#fef3c7";
  const headingColor = ok ? "#166534" : "#92400e";
  const icon = ok ? "&#10003;" : "&#9888;";
  const heading = ok ? "¡Correo verificado!" : "No pudimos verificar tu correo";
  const message = ok
    ? "Tu cuenta quedó activada y ya iniciaste sesión. Te llevamos a tu portal…"
    : "El enlace no es válido o ya expiró. Inicia sesión y vuelve a solicitar el correo de verificación.";
  const btnText = ok ? "Ir a mi portal" : "Ir a iniciar sesión";

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${ok ? "Correo verificado" : "Verificación fallida"} — PetCare</title>
<meta http-equiv="refresh" content="3;url=${dest}">
</head>
<body style="margin:0;font-family:Arial,Helvetica,sans-serif;background:#ede7d9;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:16px;">
<div style="background:#fff;border:1px solid #e0d8ca;border-radius:18px;padding:34px 28px;max-width:380px;width:100%;text-align:center;box-shadow:0 12px 34px rgba(26,18,8,0.16);">
  <div style="width:62px;height:62px;border-radius:50%;background:${iconBg};display:flex;align-items:center;justify-content:center;margin:0 auto 18px;font-size:30px;line-height:1;color:${accent};">${icon}</div>
  <h1 style="margin:0 0 10px;font-size:1.3rem;color:${headingColor};">${heading}</h1>
  <p style="margin:0 0 22px;font-size:0.95rem;color:#4a3d2e;line-height:1.55;">${message}</p>
  <a href="${dest}" style="display:inline-block;background:${accent};color:#fff;text-decoration:none;font-weight:700;font-size:0.92rem;padding:12px 26px;border-radius:11px;">${btnText}</a>
  <noscript><p style="margin:14px 0 0;font-size:0.8rem;color:#8a7a60;">Si no se redirige automáticamente, usa el botón de arriba.</p></noscript>
</div>
<script>
(function(){
  try {
    var u = ${userLiteral};
    if (u) {
      sessionStorage.setItem('petcare_user', u);
      sessionStorage.setItem('petcare_session_exp', String(Date.now() + 8*60*60*1000));
    }
  } catch (e) {}
  setTimeout(function(){ window.location.replace(${destLiteral}); }, 1400);
})();
</script>
</body>
</html>`;

  const res = new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });

  if (ok && user) {
    const sessionValue = Buffer.from(JSON.stringify(user)).toString("base64");
    res.cookies.set("session", sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
  }
  return res;
}

export async function GET(req: NextRequest) {
  let verificado = false;
  try {
    let token: string | null = null;
    try { token = new URL(req.url).searchParams.get("token"); } catch { /* noop */ }
    if (!token) return htmlResponse({ ok: false, dest: "/login?verified=0" });

    const supabase = createAdminClient();

    const { data: usuario, error: selErr } = await supabase
      .from("usuarios")
      .select("id_usuario, token_expira, correo_verificado, activo")
      .eq("token_verificacion", token)
      .maybeSingle();

    if (selErr) {
      console.error("[VERIFY] error consultando usuario:", selErr);
      return htmlResponse({ ok: false, dest: "/login?verified=0" });
    }
    if (!usuario) return htmlResponse({ ok: false, dest: "/login?verified=0" });

    if (!usuario.correo_verificado) {
      if (!usuario.token_expira || new Date(usuario.token_expira) < new Date()) {
        return htmlResponse({ ok: false, dest: "/login?verified=0" });
      }
    }

    const { data: actualizado, error: updErr } = await supabase
      .from("usuarios")
      .update({ correo_verificado: true, token_verificacion: null, token_expira: null })
      .eq("id_usuario", usuario.id_usuario)
      .select("id_usuario, nombre, apellido, correo, rol, activo, creado_en, correo_verificado")
      .single();

    verificado = true; // el UPDATE se ejecutó; el correo ya está verificado

    // Si no pudimos releer la fila, igual quedó verificado: que inicie sesión.
    if (updErr || !actualizado) {
      console.error("[VERIFY] error releyendo usuario:", updErr);
      return htmlResponse({ ok: true, dest: "/login?verified=1" });
    }
    if (!actualizado.activo) return htmlResponse({ ok: true, dest: "/login?verified=1" });

    const dest = actualizado.rol === "cliente" ? "/portal?verified=1" : "/dashboard?verified=1";
    return htmlResponse({ ok: true, dest, user: actualizado });
  } catch (err) {
    console.error("[VERIFY] error inesperado:", err);
    return htmlResponse({
      ok: verificado,
      dest: verificado ? "/login?verified=1" : "/login?verified=0",
    });
  }
}
