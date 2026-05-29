"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Stethoscope, CalendarClock } from "lucide-react";
import { Table, type Column } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";

interface VetRow {
  id_veterinario: number;
  especialidad: string | null;
  usuarios: { nombre: string; apellido: string };
}

export default function VeterinariosPage() {
  const { user } = useAuth();
  const isAdmin = user?.rol === "administrador";
  const [vets, setVets] = useState<VetRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/veterinarios")
      .then((r) => r.json())
      .then((j) => setVets(j.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<VetRow>[] = [
    { key: "nombre", header: "Veterinario", render: (v) => `${v.usuarios.nombre} ${v.usuarios.apellido}` },
    { key: "especialidad", header: "Especialidad", render: (v) => v.especialidad ?? "—" },
    {
      key: "acciones",
      header: "Horarios",
      render: (v) =>
        isAdmin ? (
          <Link
            href={`/veterinarios/${v.id_veterinario}/horarios`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-petcare-200 bg-petcare-50/40 px-3 py-1.5 text-xs font-medium text-petcare-700 hover:bg-petcare-50 transition-colors"
          >
            <CalendarClock className="size-3.5" /> Configurar horarios
          </Link>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex items-center gap-2">
        <div className="flex size-10 items-center justify-center rounded-xl bg-petcare-50 text-petcare-600">
          <Stethoscope className="size-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>Veterinarios</h1>
          <p className="text-sm text-gray-500">Equipo médico y sus horarios de atención semanales</p>
        </div>
      </div>

      <Table columns={columns} data={vets} keyField="id_veterinario" loading={loading} emptyMessage="No hay veterinarios registrados" />
    </div>
  );
}
