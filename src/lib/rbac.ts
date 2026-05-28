import type { Rol } from "@/types";

const permissions: Record<Rol, string[]> = {
  administrador: [
    "dashboard", "citas", "clientes", "mascotas", "historia-clinica",
    "usuarios", "veterinarios", "reportes",
    "atenciones-clinicas", "triaje", "especialidades", "servicios-medicos",
    // Fases 5-8
    "recursos", "seguimientos-clinicos", "indisponibilidades", "cola-espera",
    // Fases 9-10
    "analitica",
  ],
  veterinario: [
    "dashboard", "citas", "mascotas", "historia-clinica",
    "atenciones-clinicas", "triaje",
    "seguimientos-clinicos",
  ],
  recepcionista: [
    "dashboard", "citas", "clientes", "mascotas", "historia-clinica",
    "atenciones-clinicas", "triaje",
    "seguimientos-clinicos", "cola-espera",
  ],
  cliente: [],
};

export function canAccess(rol: Rol, module: string): boolean {
  return permissions[rol]?.includes(module) ?? false;
}
