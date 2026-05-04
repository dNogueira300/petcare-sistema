"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, Pencil, FilePlus, Eye } from "lucide-react";
import { Table, type Column } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { CitaForm } from "@/components/forms/CitaForm";
import { HistoriaClinicaForm, type PrefillCita } from "@/components/forms/HistoriaClinicaForm";
import { formatLima, hoyCimaFecha, slotsDisponibles } from "@/utils/datetime";
import type { EstadoCita, OrigenCita } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/context/toast";

interface CitaRow {
  id_cita: number;
  id_mascota: number;
  id_veterinario: number;
  fecha: string;
  hora: string;
  motivo: string;
  estado: EstadoCita;
  origen: OrigenCita;
  mascotas: { nombre: string; especie: string };
  veterinarios: { usuarios: { nombre: string; apellido: string } };
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

function EditCitaForm({
  cita,
  onSubmit,
}: {
  cita: CitaRow;
  onSubmit: (fecha: string, hora: string) => Promise<void>;
}) {
  const [fecha, setFecha] = useState(cita.fecha);
  const [hora, setHora] = useState(cita.hora.slice(0, 5));
  const [submitting, setSubmitting] = useState(false);

  const slots = fecha ? slotsDisponibles(fecha) : [];
  const esDomingo = slots.length === 0 && !!fecha;

  // Reset hora when fecha changes and current hora is not in new slots
  useEffect(() => {
    if (slots.length > 0 && !slots.includes(hora)) setHora("");
  }, [fecha]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hora) return;
    setSubmitting(true);
    await onSubmit(fecha, hora);
    setSubmitting(false);
  };

  const horaOptions = slots.map((h) => ({ value: h, label: h }));

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Veterinario</p>
        <p className="text-sm text-gray-900">
          {cita.veterinarios.usuarios.nombre} {cita.veterinarios.usuarios.apellido}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Fecha</label>
          <input
            type="date"
            value={fecha}
            min={hoyCimaFecha()}
            onChange={(e) => setFecha(e.target.value)}
            required
            className="h-10 rounded-[9px] border border-gray-200 px-3 text-sm focus:border-petcare-500 focus:outline-none focus:ring-2 focus:ring-petcare-100"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Hora</label>
          <select
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            required
            disabled={!fecha || esDomingo}
            className="h-10 rounded-[9px] border border-gray-200 px-3 text-sm focus:border-petcare-500 focus:outline-none focus:ring-2 focus:ring-petcare-100 disabled:opacity-50"
          >
            <option value="">
              {!fecha ? "Selecciona fecha primero" : esDomingo ? "Sin atención los domingos" : "Seleccionar hora…"}
            </option>
            {horaOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
      {esDomingo && (
        <p className="text-sm text-amber-600">Los domingos no hay atención. Selecciona otro día.</p>
      )}
      <div style={{ position:"sticky", bottom:0, background:"#fff",
        borderTop:"1px solid #f0ead8", padding:"12px 0 16px", marginTop:"4px" }}>
        <Button type="submit" loading={submitting} disabled={!hora} className="w-full">
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}

export default function CitasPage() {
  const [citas, setCitas] = useState<CitaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [estadoFilter, setEstadoFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<CitaRow | null>(null);
  const [historiaItem, setHistoriaItem] = useState<PrefillCita | null>(null);
  const [detailItem, setDetailItem] = useState<CitaRow | null>(null);
  const { user } = useAuth();
  const canEdit = user?.rol === "administrador" || user?.rol === "recepcionista";
  const isVet = user?.rol === "veterinario";
  const toast = useToast();

  const fetchCitas = async (estado = "") => {
    setLoading(true);
    const url = `/api/citas${estado ? `?estado=${estado}` : ""}`;
    const res = await fetch(url);
    const json = await res.json();
    setCitas(json.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCitas(estadoFilter); }, [estadoFilter]);

  const handleCreate = async (data: Record<string, unknown>) => {
    const res = await fetch("/api/citas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setCreateOpen(false);
      toast.success("Cita agendada correctamente");
      fetchCitas(estadoFilter);
    } else {
      const json = await res.json();
      toast.error(json.error ?? "Error al agendar la cita");
    }
  };

  const handleEdit = async (fecha: string, hora: string) => {
    if (!editItem) return;
    const res = await fetch(`/api/citas/${editItem.id_cita}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fecha, hora }),
    });
    if (res.ok) {
      setEditItem(null);
      toast.success("Cita actualizada");
      fetchCitas(estadoFilter);
    } else {
      const json = await res.json();
      toast.error(json.error ?? "Error al actualizar la cita");
    }
  };

  const cambiarEstado = async (id: number, estado: EstadoCita) => {
    const res = await fetch(`/api/citas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    if (res.ok) {
      toast.success("Estado actualizado");
      fetchCitas(estadoFilter);
    } else {
      const json = await res.json();
      toast.error(json.error ?? "Error al cambiar estado");
    }
  };

  const handleHistoriaSubmit = async (data: Record<string, unknown>) => {
    const res = await fetch("/api/historia-clinica", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setHistoriaItem(null);
      toast.success("Historia clínica registrada. Cita marcada como atendida.");
      fetchCitas(estadoFilter);
    } else {
      const json = await res.json();
      toast.error(json.error ?? "Error al registrar historia clínica");
    }
  };

  const openHistoria = (c: CitaRow) => {
    setHistoriaItem({
      id_cita: c.id_cita,
      id_mascota: c.id_mascota,
      id_veterinario: c.id_veterinario,
      fecha: c.fecha,
      mascotas: c.mascotas,
      veterinarios: c.veterinarios,
    });
  };

  const columns: Column<CitaRow>[] = [
    {
      key: "fecha",
      header: "Fecha",
      render: (c) => formatLima(`${c.fecha}T00:00:00`, "dd/MM/yyyy"),
    },
    { key: "hora", header: "Hora", className: "hidden sm:table-cell", render: (c) => c.hora.slice(0, 5) },
    {
      key: "mascota",
      header: "Mascota",
      render: (c) => c.mascotas ? `${c.mascotas.nombre} (${c.mascotas.especie})` : "—",
    },
    {
      key: "veterinario",
      header: "Veterinario",
      className: "hidden md:table-cell",
      render: (c) => c.veterinarios
        ? `${c.veterinarios.usuarios.nombre} ${c.veterinarios.usuarios.apellido}`
        : "—",
    },
    { key: "motivo", header: "Motivo", className: "hidden lg:table-cell" },
    {
      key: "estado",
      header: "Estado",
      render: (c) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant={c.estado}>{estadoLabels[c.estado]}</Badge>
          {c.origen === "portal" && c.estado === "pendiente" && (
            <span style={{ fontSize:"0.65rem", fontWeight:700, letterSpacing:"0.08em",
              textTransform:"uppercase", background:"#fdf3dc", color:"#a07028",
              border:"1px solid #f0d080", borderRadius:"99px", padding:"2px 7px",
              fontFamily:"var(--font-dm-sans)", whiteSpace:"nowrap" }}>
              Portal
            </span>
          )}
        </div>
      ),
    },
    {
      key: "acciones",
      header: "Acciones",
      render: (c) => (
        <div className="flex items-center gap-1">
          {/* Ver detalle — siempre disponible, especialmente para atendidas */}
          {c.estado === "atendida" && (
            <button
              onClick={() => setDetailItem(c)}
              title="Ver detalle"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <Eye className="size-4" />
            </button>
          )}
          {canEdit && c.estado !== "cancelada" && c.estado !== "atendida" && (
            <button
              onClick={() => setEditItem(c)}
              title="Editar fecha/hora"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <Pencil className="size-4" />
            </button>
          )}
          {/* Historia clínica — veterinario y admin en citas confirmadas */}
          {(isVet || canEdit) && c.estado === "confirmada" && (
            <button
              onClick={() => openHistoria(c)}
              title="Llenar historia clínica"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-700 transition-colors"
            >
              <FilePlus className="size-4" />
            </button>
          )}
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
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Citas</h1>
          <p className="text-sm text-gray-500">Agenda de consultas veterinarias</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <CalendarPlus className="size-4" />
          <span className="hidden sm:inline">Nueva cita</span>
          <span className="sm:hidden">Nueva</span>
        </Button>
      </div>

      <div className="w-40 sm:w-48">
        <Select
          options={estadoOptions}
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
        />
      </div>

      <Table
        columns={columns}
        data={citas}
        keyField="id_cita"
        loading={loading}
        emptyMessage="No hay citas registradas"
      />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nueva cita">
        <CitaForm onSubmit={handleCreate} />
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Editar cita">
        {editItem && <EditCitaForm cita={editItem} onSubmit={handleEdit} />}
      </Modal>

      <Modal open={!!historiaItem} onClose={() => setHistoriaItem(null)} title="Historia clínica" className="max-w-2xl">
        {historiaItem && (
          <HistoriaClinicaForm
            key={historiaItem.id_cita}
            prefillCita={historiaItem}
            onSubmit={handleHistoriaSubmit}
          />
        )}
      </Modal>

      {/* Detalle de cita atendida */}
      <Modal open={!!detailItem} onClose={() => setDetailItem(null)} title="Detalle de la cita">
        {detailItem && (
          <div className="flex flex-col gap-3">
            {[
              ["Mascota", `${detailItem.mascotas?.nombre ?? "—"} (${detailItem.mascotas?.especie ?? ""})`],
              ["Fecha", formatLima(`${detailItem.fecha}T00:00:00`, "dd/MM/yyyy")],
              ["Hora", detailItem.hora.slice(0, 5)],
              ["Veterinario", detailItem.veterinarios ? `${detailItem.veterinarios.usuarios.nombre} ${detailItem.veterinarios.usuarios.apellido}` : "—"],
              ["Motivo", detailItem.motivo],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-start py-2 border-b border-gray-100">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 shrink-0">{label}</span>
                <span className="text-sm text-gray-900 text-right ml-4">{value}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Estado</span>
              <Badge variant={detailItem.estado}>{estadoLabels[detailItem.estado]}</Badge>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
