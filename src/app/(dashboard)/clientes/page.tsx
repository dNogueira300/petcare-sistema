"use client";

import { useEffect, useState, useCallback } from "react";
import { UserPlus, Search, Eye, Pencil, ToggleLeft, ToggleRight, KeyRound } from "lucide-react";
import { Table, type Column } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ClienteForm } from "@/components/forms/ClienteForm";
import { ChangePasswordForm } from "@/components/forms/ChangePasswordForm";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/context/toast";

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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value || "—"}</span>
    </div>
  );
}

function EditClienteForm({
  cliente,
  onSubmit,
}: {
  cliente: ClienteRow;
  onSubmit: (data: { telefono: string; direccion: string }) => Promise<void>;
}) {
  const [telefono, setTelefono] = useState(cliente.telefono);
  const [direccion, setDireccion] = useState(cliente.direccion ?? "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit({ telefono, direccion });
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Teléfono</label>
        <input
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          required
          className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-petcare-500 focus:outline-none focus:ring-2 focus:ring-petcare-200"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Dirección</label>
        <input
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-petcare-500 focus:outline-none focus:ring-2 focus:ring-petcare-200"
        />
      </div>
      <Button type="submit" loading={submitting} className="mt-2">Guardar cambios</Button>
    </form>
  );
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<ClienteRow | null>(null);
  const [editItem, setEditItem] = useState<ClienteRow | null>(null);
  const [passwordItem, setPasswordItem] = useState<ClienteRow | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.rol === "administrador";
  const toast = useToast();

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
      setCreateOpen(false);
      toast.success("Cliente registrado correctamente");
      fetchClientes(search);
    } else {
      const json = await res.json();
      toast.error(json.error ?? "Error al registrar");
    }
  };

  const handleEdit = async (data: { telefono: string; direccion: string }) => {
    if (!editItem) return;
    const res = await fetch(`/api/clientes/${editItem.id_cliente}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setEditItem(null);
      toast.success("Cliente actualizado");
      fetchClientes(search);
    } else {
      const json = await res.json();
      toast.error(json.error ?? "Error al actualizar");
    }
  };

  const handlePasswordChange = async (contrasena: string) => {
    if (!passwordItem) return;
    const res = await fetch(`/api/usuarios/${passwordItem.usuarios.id_usuario}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contrasena }),
    });
    if (res.ok) {
      setPasswordItem(null);
      toast.success("Contraseña actualizada");
    } else {
      const json = await res.json();
      toast.error(json.error ?? "Error al cambiar contraseña");
    }
  };

  const toggleActivo = async (c: ClienteRow) => {
    await fetch(`/api/usuarios/${c.usuarios.id_usuario}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !c.usuarios.activo }),
    });
    fetchClientes(search);
  };

  const columns: Column<ClienteRow>[] = [
    {
      key: "nombre",
      header: "Nombre",
      render: (c) => `${c.usuarios.nombre} ${c.usuarios.apellido}`,
    },
    { key: "correo", header: "Correo", className: "hidden md:table-cell", render: (c) => c.usuarios.correo },
    { key: "telefono", header: "Teléfono", className: "hidden sm:table-cell" },
    {
      key: "activo",
      header: "Estado",
      render: (c) => (
        <Badge variant={c.usuarios.activo ? "confirmada" : "cancelada"}>
          {c.usuarios.activo ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      key: "acciones",
      header: "Acciones",
      render: (c) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDetailItem(c)}
            title="Ver detalle"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <Eye className="size-4" />
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => setEditItem(c)}
                title="Editar"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <Pencil className="size-4" />
              </button>
              <button
                onClick={() => setPasswordItem(c)}
                title="Cambiar contraseña"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
              >
                <KeyRound className="size-4" />
              </button>
              <button
                onClick={() => toggleActivo(c)}
                title={c.usuarios.activo ? "Desactivar" : "Activar"}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"
              >
                {c.usuarios.activo
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
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500">Propietarios de mascotas registrados</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="size-4" />
          <span className="hidden sm:inline">Nuevo cliente</span>
          <span className="sm:hidden">Nuevo</span>
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
        <Button type="submit" variant="outline" size="md">Buscar</Button>
      </form>

      <Table columns={columns} data={clientes} keyField="id_cliente" loading={loading} emptyMessage="No hay clientes registrados" />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo cliente">
        <ClienteForm onSubmit={handleCreate as never} />
      </Modal>

      <Modal open={!!detailItem} onClose={() => setDetailItem(null)} title="Detalle del cliente">
        {detailItem && (
          <div className="grid grid-cols-2 gap-4">
            <DetailRow label="Nombre" value={`${detailItem.usuarios.nombre} ${detailItem.usuarios.apellido}`} />
            <DetailRow label="Correo" value={detailItem.usuarios.correo} />
            <DetailRow label="Teléfono" value={detailItem.telefono} />
            <DetailRow label="Dirección" value={detailItem.direccion ?? "—"} />
            <DetailRow label="Estado" value={detailItem.usuarios.activo ? "Activo" : "Inactivo"} />
          </div>
        )}
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Editar cliente">
        {editItem && <EditClienteForm cliente={editItem} onSubmit={handleEdit} />}
      </Modal>

      {/* Cambiar contraseña */}
      <Modal open={!!passwordItem} onClose={() => setPasswordItem(null)} title="Cambiar contraseña">
        {passwordItem && (
          <>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.85rem", color: "#6b5c44", marginBottom: "16px" }}>
              {passwordItem.usuarios.nombre} {passwordItem.usuarios.apellido} · {passwordItem.usuarios.correo}
            </p>
            <ChangePasswordForm onSubmit={handlePasswordChange} />
          </>
        )}
      </Modal>
    </div>
  );
}
