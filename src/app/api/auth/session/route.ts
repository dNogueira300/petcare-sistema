import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null });
  const { contrasena_hash: _, ...safe } = user;
  return NextResponse.json({ user: safe });
}
