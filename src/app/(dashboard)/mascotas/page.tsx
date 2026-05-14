"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PawPrint, Eye, Pencil, Search } from "lucide-react";
import { Table, type Column } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { MascotaForm } from "@/components/forms/MascotaForm";
import { useAuth } from "@/hooks/useAuth";
import { hoyCimaFecha } from "@/utils/datetime";
import { useToast } from "@/context/toast";

interface MascotaRow {
  id_mascota: number;
  nombre: string;
  especie: string;
  raza: string | null;
  sexo: string | null;
  color: string | null;
  fecha_nacimiento: string | null;
  clientes: {
    usuarios: { nombre: string; apellido: string };
  };
}

const SEXO_LABEL: Record<string, string> = { macho: "Macho", hembra: "Hembra" };

function calcEdad(fechaNac: string | null): string {
  if (!fechaNac) return "—";
  const hoy = hoyCimaFecha();
  const [ay, am, ad] = hoy.split("-").map(Number);
  const [by, bm, bd] = fechaNac.split("-").map(Number);
  let years = ay - by;
  let months = am - bm;
  if (months < 0 || (months === 0 && ad < bd)) { years--; months += 12; }
  if (years > 0) return `${years} año${years !== 1 ? "s" : ""}`;
  return `${months} mes${months !== 1 ? "es" : ""}`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value || "—"}</span>
    </div>
  );
}

const especieOptions = [
  { value: "Perro", label: "Perro" },
  { value: "Gato", label: "Gato" },
  { value: "Ave", label: "Ave" },
  { value: "Conejo", label: "Conejo" },
  { value: "Reptil", label: "Reptil" },
  { value: "Otro", label: "Otro" },
];

function EditMascotaForm({ mascota, onSubmit }: { mascota: MascotaRow; onSubmit: (d: Record<string, unknown>) => Promise<void> }) {
  const [nombre, setNombre] = useState(mascota.nombre);
  const [especie, setEspecie] = useState(mascota.especie);
  const [raza, setRaza] = useState(mascota.raza ?? "");
  const [sexo, setSexo] = useState(mascota.sexo ?? "");
  const [color, setColor] = useState(mascota.color ?? "");
  const [fechaNac, setFechaNac] = useState(mascota.fecha_nacimiento ?? "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit({
      nombre, especie,
      raza: raza || undefined,
      sexo: sexo || undefined,
      color: color || undefined,
      fecha_nacimiento: fechaNac || undefined,
    });
    setSubmitting(false);
  };

  const inputCls = "h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-petcare-500 focus:outline-none focus:ring-2 focus:ring-petcare-200 w-full";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Nombre</label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} required className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Especie</label>
          <select value={especie} onChange={(e) => setEspecie(e.target.value)} className={inputCls}>
            {especieOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Raza</label>
          <input value={raza} onChange={(e) => setRaza(e.target.value)} className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Sexo</label>
          <select value={sexo} onChange={(e) => setSexo(e.target.value)} className={inputCls}>
            <option value="">Sin especificar</option>
            <option value="macho">Macho</option>
            <option value="hembra">Hembra</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Color</label>
          <input value={color} onChange={(e) => setColor(e.target.value)} className={inputCls} placeholder="Ej: marrón y blanco" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Fecha de nacimiento</label>
        <input type="date" value={fechaNac} onChange={(e) => setFechaNac(e.target.value)} className={inputCls} />
      </div>
      <p className="text-xs text-gray-400">El peso se registra en la historia clínica de cada consulta.</p>
      <div style={{ position:"sticky", bottom:0, background:"#fff",
        borderTop:"1px solid #f0ead8", padding:"12px 0 16px", marginTop:"4px" }}>
        <Button type="submit" loading={submitting} className="w-full">Guardar cambios</Button>
      </div>
    </form>
  );
}

export default function MascotasPage() {
  const [mascotas, setMascotas] = useState<MascotaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<MascotaRow | null>(null);
  const [editItem, setEditItem] = useState<MascotaRow | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.rol === "administrador";
  const toast = useToast();

  const fetchMascotas = async () => {
    setLoading(true);
    const res = await fetch("/api/mascotas");
    const json = await res.json();
    setMascotas(json.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchMascotas(); }, []);

  const handleCreate = async (data: Record<string, unknown>) => {
    const res = await fetch("/api/mascotas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setCreateOpen(false);
      toast.success("Mascota registrada correctamente");
      fetchMascotas();
    } else {
      const json = await res.json();
      toast.error(json.error ?? "Error al registrar");
    }
  };

  const handleEdit = async (data: Record<string, unknown>) => {
    if (!editItem) return;
    const res = await fetch(`/api/mascotas/${editItem.id_mascota}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setEditItem(null);
      toast.success("Mascota actualizada");
      fetchMascotas();
    } else {
      const json = await res.json();
      toast.error(json.error ?? "Error al actualizar");
    }
  };

  const columns: Column<MascotaRow>[] = [
    { key: "nombre", header: "Nombre" },
    { key: "especie", header: "Especie" },
    { key: "raza", header: "Raza", className: "hidden sm:table-cell", render: (m) => m.raza ?? "—" },
    {
      key: "propietario",
      header: "Propietario",
      className: "hidden md:table-cell",
      render: (m) => m.clientes ? `${m.clientes.usuarios.nombre} ${m.clientes.usuarios.apellido}` : "—",
    },
    { key: "edad", header: "Edad", className: "hidden sm:table-cell", render: (m) => calcEdad(m.fecha_nacimiento) },
    {
      key: "acciones",
      header: "Acciones",
      render: (m) => (
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setDetailItem(m)}
            title="Ver detalle"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <Eye className="size-4" />
          </button>
          <Link
            href={`/mascotas/${m.id_mascota}/historia-clinica`}
            className="rounded px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors whitespace-nowrap"
          >
            Ver historial clínico
          </Link>
          <Link
            href={`/mascotas/${m.id_mascota}/cartilla`}
            className="rounded px-2 py-1 text-xs font-medium text-petcare-700 hover:bg-petcare-50 transition-colors whitespace-nowrap"
          >
            Registrar vacuna
          </Link>
          {isAdmin && (
            <button
              onClick={() => setEditItem(m)}
              title="Editar"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <Pencil className="size-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mascotas</h1>
          <p className="text-sm text-gray-500">Pacientes registrados en la clínica</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PawPrint className="size-4" />
          <span className="hidden sm:inline">Nueva mascota</span>
          <span className="sm:hidden">Nueva</span>
        </Button>
      </div>

      <div className="relative w-full sm:w-96">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por mascota o propietario…"
          className="h-10 w-full rounded-[9px] border border-gray-200 bg-white pl-9 pr-3 text-sm focus:border-petcare-500 focus:outline-none focus:ring-2 focus:ring-petcare-100"
        />
      </div>

      <Table
        columns={columns}
        data={mascotas.filter((m) => {
          const q = search.trim().toLowerCase();
          if (!q) return true;
          const propietario = m.clientes
            ? `${m.clientes.usuarios.nombre} ${m.clientes.usuarios.apellido}`.toLowerCase()
            : "";
          return m.nombre.toLowerCase().includes(q) || propietario.includes(q);
        })}
        keyField="id_mascota"
        loading={loading}
        emptyMessage={search ? "Sin resultados para esa búsqueda" : "No hay mascotas registradas"}
      />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nueva mascota">
        <MascotaForm onSubmit={handleCreate} />
      </Modal>

      <Modal open={!!detailItem} onClose={() => setDetailItem(null)} title="Detalle de la mascota">
        {detailItem && (
          <div className="grid grid-cols-2 gap-4">
            <DetailRow label="Nombre" value={detailItem.nombre} />
            <DetailRow label="Especie" value={detailItem.especie} />
            <DetailRow label="Raza" value={detailItem.raza ?? "—"} />
            <DetailRow label="Sexo" value={detailItem.sexo ? (SEXO_LABEL[detailItem.sexo] ?? detailItem.sexo) : "—"} />
            <DetailRow label="Color" value={detailItem.color ?? "—"} />
            <DetailRow label="Propietario" value={detailItem.clientes ? `${detailItem.clientes.usuarios.nombre} ${detailItem.clientes.usuarios.apellido}` : "—"} />
            <DetailRow label="Fecha de nacimiento" value={detailItem.fecha_nacimiento ?? "—"} />
            <DetailRow label="Edad" value={calcEdad(detailItem.fecha_nacimiento)} />
          </div>
        )}
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Editar mascota">
        {editItem && <EditMascotaForm mascota={editItem} onSubmit={handleEdit} />}
      </Modal>
    </div>
  );
}
