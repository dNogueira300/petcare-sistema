import type { Rol } from "@/types";

const permissions: Record<Rol, string[]> = {
  administrador: ["dashboard", "citas", "clientes", "mascotas", "historia-clinica", "usuarios", "reportes"],
  veterinario:   ["dashboard", "citas", "mascotas", "historia-clinica"],
  recepcionista: ["dashboard", "citas", "clientes", "mascotas"],
  cliente:       [],
};

export function canAccess(rol: Rol, module: string): boolean {
  return permissions[rol]?.includes(module) ?? false;
}
