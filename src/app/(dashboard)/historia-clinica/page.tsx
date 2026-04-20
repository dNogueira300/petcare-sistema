"use client";

import { useEffect, useState } from "react";
import { FilePlus } from "lucide-react";
import { Table, type Column } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Alert } from "@/components/ui/alert";
import { HistoriaClinicaForm } from "@/components/forms/HistoriaClinicaForm";
import { formatLima } from "@/utils/datetime";

interface HistoriaRow {
  id_historia: number;
  fecha_consulta: string;
  diagnostico: string;
  tratamiento: string;
  peso_consulta: number | null;
  mascotas: { nombre: string };
  veterinarios: { usuarios: { nombre: string; apellido: string } };
}

export default function HistoriaClinicaPage() {
  const [historias, setHistorias] = useState<HistoriaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

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
      setModalOpen(false);
      setAlert({ type: "success", msg: "Historia clínica registrada" });
      fetchHistorias();
    } else {
      const json = await res.json();
      setAlert({ type: "error", msg: json.error ?? "Error al registrar" });
    }
  };

  const columns: Column<HistoriaRow>[] = [
    {
      key: "fecha_consulta",
      header: "Fecha",
      render: (h) => formatLima(`${h.fecha_consulta}T00:00:00`, "dd/MM/yyyy"),
    },
    {
      key: "mascota",
      header: "Mascota",
      render: (h) => h.mascotas?.nombre ?? "—",
    },
    {
      key: "veterinario",
      header: "Veterinario",
      render: (h) =>
        h.veterinarios
          ? `${h.veterinarios.usuarios.nombre} ${h.veterinarios.usuarios.apellido}`
          : "—",
    },
    { key: "diagnostico", header: "Diagnóstico" },
    {
      key: "peso_consulta",
      header: "Peso",
      render: (h) => (h.peso_consulta ? `${h.peso_consulta} kg` : "—"),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historia Clínica</h1>
          <p className="text-sm text-gray-500">Registros de consultas y tratamientos</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <FilePlus className="size-4" />
          Nueva historia
        </Button>
      </div>

      {alert && (
        <Alert variant={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
      )}

      <Table
        columns={columns}
        data={historias}
        keyField="id_historia"
        loading={loading}
        emptyMessage="No hay historias clínicas registradas"
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nueva historia clínica"
        className="max-w-2xl"
      >
        <HistoriaClinicaForm onSubmit={handleCreate} />
      </Modal>
    </div>
  );
}
