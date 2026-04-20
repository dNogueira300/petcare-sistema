"use client";

import { useEffect, useState, useCallback } from "react";
import { UserPlus, Search } from "lucide-react";
import { Table, type Column } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Alert } from "@/components/ui/alert";
import { ClienteForm } from "@/components/forms/ClienteForm";
import Link from "next/link";

interface ClienteRow {
  id_cliente: number;
  telefono: string;
  direccion: string | null;
  usuarios: {
    id_usuario: number;
    nombre: string;
    apellido: string;
    correo: string;
    activo: boolean;
  };
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchClientes = useCallback(async (q = "") => {
    setLoading(true);
    const res = await fetch(`/api/clientes${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    const json = await res.json();
    setClientes(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchClientes(); }, [fetchClientes]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClientes(search);
  };

  const handleCreate = async (data: Record<string, unknown>) => {
    const res = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setModalOpen(false);
      setAlert({ type: "success", msg: "Cliente registrado correctamente" });
      fetchClientes(search);
    } else {
      const json = await res.json();
      setAlert({ type: "error", msg: json.error ?? "Error al registrar" });
    }
  };

  const columns: Column<ClienteRow>[] = [
    {
      key: "nombre",
      header: "Nombre",
      render: (c) => (
        <Link
          href={`/clientes/${c.id_cliente}`}
          className="font-medium text-petcare-600 hover:underline"
        >
          {c.usuarios.nombre} {c.usuarios.apellido}
        </Link>
      ),
    },
    { key: "correo", header: "Correo", render: (c) => c.usuarios.correo },
    { key: "telefono", header: "Teléfono" },
    {
      key: "activo",
      header: "Estado",
      render: (c) => (
        <Badge variant={c.usuarios.activo ? "confirmada" : "cancelada"}>
          {c.usuarios.activo ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500">Propietarios de mascotas registrados</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <UserPlus className="size-4" />
          Nuevo cliente
        </Button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo…"
            className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:border-petcare-500 focus:outline-none focus:ring-2 focus:ring-petcare-200"
          />
        </div>
        <Button type="submit" variant="outline" size="md">
          Buscar
        </Button>
      </form>

      {alert && (
        <Alert variant={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
      )}

      <Table
        columns={columns}
        data={clientes}
        keyField="id_cliente"
        loading={loading}
        emptyMessage="No hay clientes registrados"
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo cliente">
        <ClienteForm onSubmit={handleCreate as never} />
      </Modal>
    </div>
  );
}
