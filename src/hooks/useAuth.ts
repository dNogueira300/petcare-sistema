"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import type { Usuario } from "@/types";

type SessionUser = Omit<Usuario, "contrasena_hash">;

// La cookie de sesión vive 8 h (ver /api/auth/login)
export const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;
const STORAGE_USER = "petcare_user";
const STORAGE_EXP = "petcare_session_exp";

/* ─── External store ────────────────────────────────────────────────────────
   Mantenemos una caché del usuario y la versión serializada para que
   `getSnapshot` devuelva siempre la misma referencia si nada cambió.
   Cualquier mutación a sessionStorage (login/logout/etc.) llama a `notify`. */
const listeners = new Set<() => void>();
let cachedRaw: string | null = "__init__";
let cachedUser: SessionUser | null = null;

function readUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_USER);
    if (raw === cachedRaw) return cachedUser;
    cachedRaw = raw;
    cachedUser = raw ? (JSON.parse(raw) as SessionUser) : null;
    return cachedUser;
  } catch {
    cachedRaw = null;
    cachedUser = null;
    return null;
  }
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  // Cambios entre pestañas: el evento `storage` lo dispara el navegador.
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function notify() {
  // Invalidar caché para que getSnapshot relea sessionStorage en la próxima llamada.
  cachedRaw = "__init__";
  listeners.forEach((l) => l());
}

function storedExp(): number | null {
  try {
    const v = sessionStorage.getItem(STORAGE_EXP);
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function isExpired(): boolean {
  const exp = storedExp();
  return exp !== null && Date.now() >= exp;
}

export function setSessionExpiration(maxAgeMs: number = SESSION_MAX_AGE_MS): void {
  try {
    sessionStorage.setItem(STORAGE_EXP, String(Date.now() + maxAgeMs));
  } catch { /* noop */ }
}

export function clearSessionStorage(): void {
  try {
    sessionStorage.removeItem(STORAGE_USER);
    sessionStorage.removeItem(STORAGE_EXP);
  } catch { /* noop */ }
  notify();
}

export function useAuth() {
  const router = useRouter();
  const user = useSyncExternalStore<SessionUser | null>(
    subscribe,
    readUser,
    () => null,
  );
  // El loading sólo aplica durante el login activo; el snapshot del store es síncrono.
  const loggingInRef = useRef(false);
  const loggedOutRef = useRef(false);

  const doLogout = useCallback(
    async (redirectTo = "/login") => {
      if (loggedOutRef.current) return;
      loggedOutRef.current = true;
      clearSessionStorage();
      try { await fetch("/api/auth/logout", { method: "POST" }); } catch { /* noop */ }
      router.push(redirectTo);
    },
    [router],
  );

  useEffect(() => {
    if (isExpired()) {
      doLogout("/login?expired=1");
      return;
    }
    const checkExpiration = () => {
      if (isExpired()) doLogout("/login?expired=1");
    };
    const id = window.setInterval(checkExpiration, 30000);
    window.addEventListener("focus", checkExpiration);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", checkExpiration);
    };
  }, [doLogout]);

  const login = useCallback(
    async (correo: string, contrasena: string): Promise<string | null> => {
      loggingInRef.current = true;
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ correo, contrasena }),
        });
        const data = await res.json();
        if (!res.ok) {
          return data.error ?? "Error al iniciar sesión";
        }
        try { sessionStorage.setItem(STORAGE_USER, JSON.stringify(data.user)); } catch { /* noop */ }
        setSessionExpiration();
        loggedOutRef.current = false;
        notify();
        return null;
      } catch {
        return "Error de conexión";
      } finally {
        loggingInRef.current = false;
      }
    },
    [],
  );

  const logout = useCallback(
    async (redirectTo = "/login") => doLogout(redirectTo),
    [doLogout],
  );

  return { user, isLoading: false, login, logout };
}
