import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyCredentials } from "@/lib/auth";
import { cookies } from "next/headers";

const schema = z.object({
  correo: z.string().email(),
  contrasena: z.string().min(8),
});

const attempts = new Map<string, { count: number; until: number }>();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { correo, contrasena } = parsed.data;

  const record = attempts.get(correo);
  if (record && record.count >= 5 && Date.now() < record.until) {
    return NextResponse.json(
      { error: "Cuenta bloqueada temporalmente. Intenta en 15 minutos." },
      { status: 423 }
    );
  }

  const usuario = await verifyCredentials(correo, contrasena);

  if (!usuario) {
    const prev = attempts.get(correo) ?? { count: 0, until: 0 };
    const count = prev.count + 1;
    attempts.set(correo, {
      count,
      until: count >= 5 ? Date.now() + 15 * 60 * 1000 : 0,
    });
    return NextResponse.json(
      { error: "Credenciales incorrectas" },
      { status: 401 }
    );
  }

  attempts.delete(correo);

  const { contrasena_hash: _, ...safeUser } = usuario;
  const sessionValue = Buffer.from(JSON.stringify(safeUser)).toString("base64");

  const cookieStore = await cookies();
  cookieStore.set("session", sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });

  return NextResponse.json({ user: safeUser });
}
