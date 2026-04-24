"use client";

import { useEffect, useState } from "react";
import { UserPlus, Eye, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import { Table, type Column } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { UsuarioForm } from "@/components/forms/UsuarioForm";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/context/toast";

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
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value || "—"}</span>
    </div>
  );
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<Usuario | null>(null);
  const [editItem, setEditItem] = useState<Usuario | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.rol === "administrador";
  const toast = useToast();

  const fetchUsuarios = async () => {
    setLoading(true);
    const res = await fetch("/api/usuarios");
    const json = await res.json();
    setUsuarios(json.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchUsuarios(); }, []);

  const handleCreate = async (data: Record<string, unknown>) => {
    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setCreateOpen(false);
      toast.success("Usuario creado correctamente");
      fetchUsuarios();
    } else {
      const json = await res.json();
      toast.error(json.error ?? "Error al crear");
    }
  };

  const handleEdit = async (data: Record<string, unknown>) => {
    if (!editItem) return;
    const res = await fetch(`/api/usuarios/${editItem.id_usuario}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setEditItem(null);
      toast.success("Usuario actualizado");
      fetchUsuarios();
    } else {
      const json = await res.json();
      toast.error(json.error ?? "Error al actualizar");
    }
  };

  const toggleActivo = async (u: Usuario) => {
    await fetch(`/api/usuarios/${u.id_usuario}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !u.activo }),
    });
    fetchUsuarios();
  };

  const columns: Column<Usuario>[] = [
    { key: "nombre", header: "Nombre", render: (u) => `${u.nombre} ${u.apellido}` },
    { key: "correo", header: "Correo" },
    { key: "rol", header: "Rol", render: (u) => <Badge variant="info">{rolLabels[u.rol] ?? u.rol}</Badge> },
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
      header: "Acciones",
      render: (u) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDetailItem(u)}
            title="Ver detalle"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <Eye className="size-4" />
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => setEditItem(u)}
                title="Editar"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <Pencil className="size-4" />
              </button>
              <button
                onClick={() => toggleActivo(u)}
                title={u.activo ? "Desactivar" : "Activar"}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"
              >
                {u.activo
                  ? <ToggleRight className="size-5 text-petcare-600" />
                  : <ToggleLeft className="size-5 text-gray-400" />}
              </button>
            </>
          )}
        </div>
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
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus className="size-4" />
            Nuevo usuario
          </Button>
        )}
      </div>

      <Table columns={columns} data={usuarios} keyField="id_usuario" loading={loading} emptyMessage="No hay usuarios registrados" />

      {/* Crear */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo usuario">
        <UsuarioForm onSubmit={handleCreate as never} />
      </Modal>

      {/* Detalle */}
      <Modal open={!!detailItem} onClose={() => setDetailItem(null)} title="Detalle del usuario">
        {detailItem && (
          <div className="grid grid-cols-2 gap-4">
            <DetailRow label="Nombre" value={`${detailItem.nombre} ${detailItem.apellido}`} />
            <DetailRow label="Correo" value={detailItem.correo} />
            <DetailRow label="Rol" value={rolLabels[detailItem.rol] ?? detailItem.rol} />
            <DetailRow label="Estado" value={detailItem.activo ? "Activo" : "Inactivo"} />
          </div>
        )}
      </Modal>

      {/* Editar */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Editar usuario">
        {editItem && (
          <UsuarioForm
            isEdit
            defaultValues={{
              nombre: editItem.nombre,
              apellido: editItem.apellido,
              correo: editItem.correo,
              rol: editItem.rol as "administrador" | "veterinario" | "recepcionista",
            }}
            onSubmit={handleEdit as never}
          />
        )}
      </Modal>
    </div>
  );
}
