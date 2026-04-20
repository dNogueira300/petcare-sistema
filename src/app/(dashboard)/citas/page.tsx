"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { Table, type Column } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Select } from "@/components/ui/select";
import { formatLima } from "@/utils/datetime";
import type { EstadoCita } from "@/types";

interface CitaRow {
  id_cita: number;
  fecha: string;
  hora: string;
  motivo: string;
  estado: EstadoCita;
  mascotas: {
    nombre: string;
    especie: string;
  };
  veterinarios: {
    usuarios: { nombre: string; apellido: string };
  };
}

const estadoLabels: Record<EstadoCita, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
  atendida: "Atendida",
};

const estadoOptions = [
  { value: "", label: "Todos los estados" },
  { value: "pendiente", label: "Pendiente" },
  { value: "confirmada", label: "Confirmada" },
  { value: "cancelada", label: "Cancelada" },
  { value: "atendida", label: "Atendida" },
];

export default function CitasPage() {
  const [citas, setCitas] = useState<CitaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [estadoFilter, setEstadoFilter] = useState("");
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchCitas = async (estado = "") => {
    setLoading(true);
    const url = `/api/citas${estado ? `?estado=${estado}` : ""}`;
    const res = await fetch(url);
    const json = await res.json();
    setCitas(json.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCitas(estadoFilter); }, [estadoFilter]);

  const cambiarEstado = async (id: number, estado: EstadoCita) => {
    const res = await fetch(`/api/citas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    if (res.ok) {
      setAlert({ type: "success", msg: "Estado actualizado" });
      fetchCitas(estadoFilter);
    }
  };

  const columns: Column<CitaRow>[] = [
    {
      key: "fecha",
      header: "Fecha",
      render: (c) => formatLima(`${c.fecha}T${c.hora}:00`, "dd/MM/yyyy"),
    },
    {
      key: "hora",
      header: "Hora",
      render: (c) => c.hora,
    },
    {
      key: "mascota",
      header: "Mascota",
      render: (c) => c.mascotas ? `${c.mascotas.nombre} (${c.mascotas.especie})` : "—",
    },
    {
      key: "veterinario",
      header: "Veterinario",
      render: (c) =>
        c.veterinarios
          ? `${c.veterinarios.usuarios.nombre} ${c.veterinarios.usuarios.apellido}`
          : "—",
    },
    { key: "motivo", header: "Motivo" },
    {
      key: "estado",
      header: "Estado",
      render: (c) => (
        <Badge variant={c.estado}>{estadoLabels[c.estado]}</Badge>
      ),
    },
    {
      key: "acciones",
      header: "",
      render: (c) => (
        <div className="flex gap-1">
          {c.estado === "pendiente" && (
            <button
              onClick={() => cambiarEstado(c.id_cita, "confirmada")}
              className="rounded px-2 py-1 text-xs font-medium text-petcare-600 hover:bg-petcare-50 transition-colors"
            >
              Confirmar
            </button>
          )}
          {(c.estado === "pendiente" || c.estado === "confirmada") && (
            <button
              onClick={() => cambiarEstado(c.id_cita, "cancelada")}
              className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Cancelar
            </button>
          )}
          {c.estado === "confirmada" && (
            <button
              onClick={() => cambiarEstado(c.id_cita, "atendida")}
              className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
            >
              Atendida
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Citas</h1>
          <p className="text-sm text-gray-500">Agenda de consultas veterinarias</p>
        </div>
        <Link href="/citas/nueva">
          <Button>
            <CalendarPlus className="size-4" />
            Nueva cita
          </Button>
        </Link>
      </div>

      <div className="w-48">
        <Select
          options={estadoOptions}
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
        />
      </div>

      {alert && (
        <Alert variant={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
      )}

      <Table
        columns={columns}
        data={citas}
        keyField="id_cita"
        loading={loading}
        emptyMessage="No hay citas registradas"
      />
    </div>
  );
}
