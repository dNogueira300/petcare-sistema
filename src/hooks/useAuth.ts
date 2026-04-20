"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Usuario } from "@/types";

interface AuthState {
  user: Omit<Usuario, "contrasena_hash"> | null;
  isLoading: boolean;
}

export function useAuth() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({ user: null, isLoading: true });

  useEffect(() => {
    const stored = sessionStorage.getItem("petcare_user");
    if (stored) {
      try {
        setState({ user: JSON.parse(stored), isLoading: false });
        return;
      } catch {
        sessionStorage.removeItem("petcare_user");
      }
    }
    setState((s) => ({ ...s, isLoading: false }));
  }, []);

  const login = useCallback(
    async (correo: string, contrasena: string): Promise<string | null> => {
      setState((s) => ({ ...s, isLoading: true }));
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ correo, contrasena }),
        });
        const data = await res.json();
        if (!res.ok) {
          setState((s) => ({ ...s, isLoading: false }));
          return data.error ?? "Error al iniciar sesión";
        }
        sessionStorage.setItem("petcare_user", JSON.stringify(data.user));
        setState({ user: data.user, isLoading: false });
        return null;
      } catch {
        setState((s) => ({ ...s, isLoading: false }));
        return "Error de conexión";
      }
    },
    []
  );

  const logout = useCallback(async () => {
    sessionStorage.removeItem("petcare_user");
    setState({ user: null, isLoading: false });
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }, [router]);

  return { ...state, login, logout };
}
