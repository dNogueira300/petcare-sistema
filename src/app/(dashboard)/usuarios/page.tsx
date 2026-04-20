"use client";

import { useEffect, useState } from "react";
import { UserPlus, ToggleLeft, ToggleRight } from "lucide-react";
import { Table, type Column } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Alert } from "@/components/ui/alert";
import { UsuarioForm } from "@/components/forms/UsuarioForm";

interface Usuario {
  id_usuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
  activo: boolean;
  creado_en: string;
}

const rolLabels: Record<string, string> = {
  administrador: "Administrador",
  veterinario: "Veterinario",
  recepcionista: "Recepcionista",
  cliente: "Cliente",
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchUsuarios = async () => {
    setLoading(true);
    const res = await fetch("/api/usuarios");
    const json = await res.json();
    setUsuarios(json.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchUsuarios(); }, []);

  const toggleActivo = async (u: Usuario) => {
    await fetch(`/api/usuarios/${u.id_usuario}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !u.activo }),
    });
    fetchUsuarios();
  };

  const handleCreate = async (data: Record<string, unknown>) => {
    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setModalOpen(false);
      setAlert({ type: "success", msg: "Usuario creado correctamente" });
      fetchUsuarios();
    } else {
      const json = await res.json();
      setAlert({ type: "error", msg: json.error ?? "Error al crear" });
    }
  };

  const columns: Column<Usuario>[] = [
    {
      key: "nombre",
      header: "Nombre",
      render: (u) => `${u.nombre} ${u.apellido}`,
    },
    { key: "correo", header: "Correo" },
    {
      key: "rol",
      header: "Rol",
      render: (u) => (
        <Badge variant="info">{rolLabels[u.rol] ?? u.rol}</Badge>
      ),
    },
    {
      key: "activo",
      header: "Estado",
      render: (u) => (
        <Badge variant={u.activo ? "confirmada" : "cancelada"}>
          {u.activo ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      key: "acciones",
      header: "",
      render: (u) => (
        <button
          onClick={() => toggleActivo(u)}
          title={u.activo ? "Desactivar" : "Activar"}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
        >
          {u.activo ? (
            <ToggleRight className="size-5 text-petcare-600" />
          ) : (
            <ToggleLeft className="size-5 text-gray-400" />
          )}
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500">Gestión de cuentas del sistema</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <UserPlus className="size-4" />
          Nuevo usuario
        </Button>
      </div>

      {alert && (
        <Alert
          variant={alert.type}
          message={alert.msg}
          onClose={() => setAlert(null)}
        />
      )}

      <Table
        columns={columns}
        data={usuarios}
        keyField="id_usuario"
        loading={loading}
        emptyMessage="No hay usuarios registrados"
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo usuario">
        <UsuarioForm onSubmit={handleCreate as never} />
      </Modal>
    </div>
  );
}
