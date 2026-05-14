"use client";

import { useEffect, useState } from "react";
import { UserPlus, Eye, Pencil, ToggleLeft, ToggleRight, KeyRound, Search } from "lucide-react";
import { Table, type Column } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { UsuarioForm, type HorariosEstado } from "@/components/forms/UsuarioForm";
import { ChangePasswordForm } from "@/components/forms/ChangePasswordForm";
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
  especialidad?: string | null;
  id_veterinario?: number | null;
}

const DIAS = [1, 2, 3, 4, 5, 6, 7];
function vacioHorarios(): HorariosEstado {
  return DIAS.reduce((acc, d) => ({ ...acc, [d]: [] }), {} as HorariosEstado);
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
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<Usuario | null>(null);
  const [editItem, setEditItem] = useState<Usuario | null>(null);
  const [editHorarios, setEditHorarios] = useState<HorariosEstado | null>(null);
  const [passwordItem, setPasswordItem] = useState<Usuario | null>(null);
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
      setEditHorarios(null);
      toast.success("Usuario actualizado");
      fetchUsuarios();
    } else {
      const json = await res.json();
      toast.error(json.error ?? "Error al actualizar");
    }
  };

  const openEdit = async (u: Usuario) => {
    setEditItem(u);
    if (u.rol === "veterinario" && u.id_veterinario) {
      const res = await fetch(`/api/horarios-veterinario?id_veterinario=${u.id_veterinario}`)
        .then((r) => r.json())
        .catch(() => ({}));
      const next = vacioHorarios();
      for (const h of (res.data ?? []) as { dia_semana: number; hora_inicio: string; hora_fin: string }[]) {
        next[h.dia_semana].push({
          hora_inicio: h.hora_inicio.slice(0, 5),
          hora_fin: h.hora_fin.slice(0, 5),
        });
      }
      setEditHorarios(next);
    } else {
      setEditHorarios(vacioHorarios());
    }
  };

  const handlePasswordChange = async (contrasena: string) => {
    if (!passwordItem) return;
    const res = await fetch(`/api/usuarios/${passwordItem.id_usuario}`, {
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
    { key: "correo", header: "Correo", className: "hidden md:table-cell" },
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
                onClick={() => openEdit(u)}
                title="Editar"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <Pencil className="size-4" />
              </button>
              <button
                onClick={() => setPasswordItem(u)}
                title="Cambiar contraseña"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
              >
                <KeyRound className="size-4" />
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
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500">Gestión de cuentas del sistema</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus className="size-4" />
            <span className="hidden sm:inline">Nuevo usuario</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        )}
      </div>

      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o correo…"
          className="h-10 w-full rounded-[9px] border border-gray-200 bg-white pl-9 pr-3 text-sm focus:border-petcare-500 focus:outline-none focus:ring-2 focus:ring-petcare-100"
        />
      </div>

      <Table
        columns={columns}
        data={usuarios.filter((u) => {
          const q = search.trim().toLowerCase();
          if (!q) return true;
          return (
            `${u.nombre} ${u.apellido}`.toLowerCase().includes(q) ||
            u.correo.toLowerCase().includes(q)
          );
        })}
        keyField="id_usuario"
        loading={loading}
        emptyMessage={search ? "Sin resultados para esa búsqueda" : "No hay usuarios registrados"}
      />

      {/* Crear */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo usuario">
        <UsuarioForm onSubmit={(d) => handleCreate(d as unknown as Record<string, unknown>)} />
      </Modal>

      {/* Detalle */}
      <Modal open={!!detailItem} onClose={() => setDetailItem(null)} title="Detalle del usuario">
        {detailItem && (
          <div className="grid grid-cols-2 gap-4">
            <DetailRow label="Nombre" value={`${detailItem.nombre} ${detailItem.apellido}`} />
            <DetailRow label="Correo" value={detailItem.correo} />
            <DetailRow label="Rol" value={rolLabels[detailItem.rol] ?? detailItem.rol} />
            <DetailRow label="Estado" value={detailItem.activo ? "Activo" : "Inactivo"} />
            {detailItem.rol === "veterinario" && (
              <DetailRow label="Especialidad" value={detailItem.especialidad ?? "—"} />
            )}
          </div>
        )}
      </Modal>

      {/* Editar */}
      <Modal open={!!editItem} onClose={() => { setEditItem(null); setEditHorarios(null); }} title="Editar usuario">
        {editItem && (
          <UsuarioForm
            isEdit
            defaultValues={{
              nombre: editItem.nombre,
              apellido: editItem.apellido,
              correo: editItem.correo,
              rol: editItem.rol as "administrador" | "veterinario" | "recepcionista",
              especialidad: editItem.especialidad ?? "",
            }}
            defaultHorarios={editHorarios ?? undefined}
            onSubmit={(d) => handleEdit(d as unknown as Record<string, unknown>)}
          />
        )}
      </Modal>

      {/* Cambiar contraseña */}
      <Modal open={!!passwordItem} onClose={() => setPasswordItem(null)} title="Cambiar contraseña">
        {passwordItem && (
          <>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.85rem", color: "#6b5c44", marginBottom: "16px" }}>
              {passwordItem.nombre} {passwordItem.apellido} · {rolLabels[passwordItem.rol] ?? passwordItem.rol}
            </p>
            <ChangePasswordForm onSubmit={handlePasswordChange} />
          </>
        )}
      </Modal>
    </div>
  );
}
