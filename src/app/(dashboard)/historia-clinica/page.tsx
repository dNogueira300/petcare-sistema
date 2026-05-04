"use client";

import { useEffect, useState } from "react";
import { FilePlus, Eye, Pencil } from "lucide-react";
import { Table, type Column } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { HistoriaClinicaForm } from "@/components/forms/HistoriaClinicaForm";
import { formatLima } from "@/utils/datetime";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/context/toast";

interface HistoriaRow {
  id_historia: number;
  fecha_consulta: string;
  diagnostico: string;
  tratamiento: string;
  observaciones: string | null;
  peso_consulta: number | null;
  mascotas: { nombre: string };
  veterinarios: { usuarios: { nombre: string; apellido: string } };
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 whitespace-pre-wrap">{value || "—"}</span>
    </div>
  );
}

function EditHistoriaForm({
  historia,
  onSubmit,
}: {
  historia: HistoriaRow;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}) {
  const [fechaConsulta, setFechaConsulta] = useState(historia.fecha_consulta);
  const [diagnostico, setDiagnostico] = useState(historia.diagnostico);
  const [tratamiento, setTratamiento] = useState(historia.tratamiento);
  const [observaciones, setObservaciones] = useState(historia.observaciones ?? "");
  const [peso, setPeso] = useState(historia.peso_consulta ? String(historia.peso_consulta) : "");
  const [submitting, setSubmitting] = useState(false);

  const inputCls = "w-full rounded-[9px] border border-gray-200 px-3 py-2 text-sm focus:border-petcare-500 focus:outline-none focus:ring-2 focus:ring-petcare-100";
  const labelCls = "text-xs font-semibold uppercase tracking-wide text-gray-500";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit({
      fecha_consulta: fechaConsulta,
      diagnostico,
      tratamiento,
      observaciones: observaciones || undefined,
      peso_consulta: peso ? Number(peso) : undefined,
    });
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="rounded-lg border border-petcare-200 bg-petcare-50/40 px-4 py-3">
        <p className={`${labelCls} mb-1`}>Mascota</p>
        <p className="text-sm font-medium text-gray-900">{historia.mascotas?.nombre ?? "—"}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Vet: {historia.veterinarios?.usuarios
            ? `${historia.veterinarios.usuarios.nombre} ${historia.veterinarios.usuarios.apellido}`
            : "—"}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Fecha de consulta</label>
        <input
          type="date"
          value={fechaConsulta}
          onChange={(e) => setFechaConsulta(e.target.value)}
          required
          className={inputCls}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Diagnóstico</label>
        <textarea
          value={diagnostico}
          onChange={(e) => setDiagnostico(e.target.value)}
          required
          rows={3}
          className={`${inputCls} resize-none`}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Tratamiento</label>
        <textarea
          value={tratamiento}
          onChange={(e) => setTratamiento(e.target.value)}
          required
          rows={3}
          className={`${inputCls} resize-none`}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Observaciones (opcional)</label>
        <textarea
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={2}
          className={`${inputCls} resize-none`}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Peso en consulta (kg)</label>
        <input
          type="number"
          step="0.01"
          value={peso}
          onChange={(e) => setPeso(e.target.value)}
          className={inputCls}
        />
      </div>

      <div style={{ position: "sticky", bottom: 0, background: "#fff",
        borderTop: "1px solid #f0ead8", padding: "12px 0 16px", marginTop: "4px" }}>
        <Button type="submit" loading={submitting} className="w-full">
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}

export default function HistoriaClinicaPage() {
  const [historias, setHistorias] = useState<HistoriaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<HistoriaRow | null>(null);
  const [editItem, setEditItem] = useState<HistoriaRow | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.rol === "administrador";
  const toast = useToast();

  const fetchHistorias = async () => {
    setLoading(true);
    const res = await fetch("/api/historia-clinica");
    const json = await res.json();
    setHistorias(json.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchHistorias(); }, []);

  const handleCreate = async (data: Record<string, unknown>) => {
    const res = await fetch("/api/historia-clinica", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setCreateOpen(false);
      toast.success("Historia clínica registrada");
      fetchHistorias();
    } else {
      const json = await res.json();
      toast.error(json.error ?? "Error al registrar");
    }
  };

  const handleEdit = async (data: Record<string, unknown>) => {
    if (!editItem) return;
    const res = await fetch(`/api/historia-clinica/${editItem.id_historia}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setEditItem(null);
      toast.success("Historia clínica actualizada");
      fetchHistorias();
    } else {
      const json = await res.json();
      toast.error(json.error ?? "Error al actualizar");
    }
  };

  const columns: Column<HistoriaRow>[] = [
    {
      key: "fecha_consulta",
      header: "Fecha",
      render: (h) => formatLima(`${h.fecha_consulta}T00:00:00`, "dd/MM/yyyy"),
    },
    { key: "mascota", header: "Mascota", render: (h) => h.mascotas?.nombre ?? "—" },
    {
      key: "veterinario",
      header: "Veterinario",
      className: "hidden sm:table-cell",
      render: (h) => h.veterinarios
        ? `${h.veterinarios.usuarios.nombre} ${h.veterinarios.usuarios.apellido}`
        : "—",
    },
    {
      key: "diagnostico",
      header: "Diagnóstico",
      render: (h) => (
        <span className="line-clamp-1 max-w-xs" title={h.diagnostico}>{h.diagnostico}</span>
      ),
    },
    {
      key: "peso_consulta",
      header: "Peso",
      className: "hidden sm:table-cell",
      render: (h) => (h.peso_consulta ? `${h.peso_consulta} kg` : "—"),
    },
    {
      key: "acciones",
      header: "Acciones",
      render: (h) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDetailItem(h)}
            title="Ver detalle"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <Eye className="size-4" />
          </button>
          {isAdmin && (
            <button
              onClick={() => setEditItem(h)}
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Historia Clínica</h1>
          <p className="text-sm text-gray-500">Registros de consultas y tratamientos</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <FilePlus className="size-4" />
          <span className="hidden sm:inline">Nueva historia</span>
          <span className="sm:hidden">Nueva</span>
        </Button>
      </div>

      <Table columns={columns} data={historias} keyField="id_historia" loading={loading} emptyMessage="No hay historias clínicas registradas" />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nueva historia clínica" className="max-w-2xl">
        <HistoriaClinicaForm onSubmit={handleCreate} />
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Editar historia clínica" className="max-w-2xl">
        {editItem && <EditHistoriaForm historia={editItem} onSubmit={handleEdit} />}
      </Modal>

      <Modal open={!!detailItem} onClose={() => setDetailItem(null)} title="Historia clínica" className="max-w-2xl">
        {detailItem && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailRow label="Fecha" value={formatLima(`${detailItem.fecha_consulta}T00:00:00`, "dd/MM/yyyy")} />
              <DetailRow label="Mascota" value={detailItem.mascotas?.nombre ?? "—"} />
              <DetailRow label="Veterinario" value={detailItem.veterinarios ? `${detailItem.veterinarios.usuarios.nombre} ${detailItem.veterinarios.usuarios.apellido}` : "—"} />
              <DetailRow label="Peso en consulta" value={detailItem.peso_consulta ? `${detailItem.peso_consulta} kg` : "—"} />
            </div>
            <DetailRow label="Diagnóstico" value={detailItem.diagnostico} />
            <DetailRow label="Tratamiento" value={detailItem.tratamiento} />
            {detailItem.observaciones && <DetailRow label="Observaciones" value={detailItem.observaciones} />}
          </div>
        )}
      </Modal>
    </div>
  );
}
