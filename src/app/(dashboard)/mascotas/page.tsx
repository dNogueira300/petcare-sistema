"use client";

import { useEffect, useState } from "react";
import { PawPrint } from "lucide-react";
import { Table, type Column } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Alert } from "@/components/ui/alert";
import { MascotaForm } from "@/components/forms/MascotaForm";
import { hoyCimaFecha } from "@/utils/datetime";

interface MascotaRow {
  id_mascota: number;
  nombre: string;
  especie: string;
  raza: string | null;
  fecha_nacimiento: string | null;
  clientes: {
    usuarios: { nombre: string; apellido: string };
  };
}

function calcEdad(fechaNac: string | null): string {
  if (!fechaNac) return "—";
  const hoy = hoyCimaFecha();
  const [ay, am, ad] = hoy.split("-").map(Number);
  const [by, bm, bd] = fechaNac.split("-").map(Number);
  let years = ay - by;
  let months = am - bm;
  if (months < 0 || (months === 0 && ad < bd)) {
    years--;
    months += 12;
  }
  if (years > 0) return `${years} año${years !== 1 ? "s" : ""}`;
  return `${months} mes${months !== 1 ? "es" : ""}`;
}

export default function MascotasPage() {
  const [mascotas, setMascotas] = useState<MascotaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

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
      setModalOpen(false);
      setAlert({ type: "success", msg: "Mascota registrada correctamente" });
      fetchMascotas();
    } else {
      const json = await res.json();
      setAlert({ type: "error", msg: json.error ?? "Error al registrar" });
    }
  };

  const columns: Column<MascotaRow>[] = [
    { key: "nombre", header: "Nombre" },
    { key: "especie", header: "Especie" },
    { key: "raza", header: "Raza", render: (m) => m.raza ?? "—" },
    {
      key: "propietario",
      header: "Propietario",
      render: (m) =>
        m.clientes
          ? `${m.clientes.usuarios.nombre} ${m.clientes.usuarios.apellido}`
          : "—",
    },
    {
      key: "edad",
      header: "Edad",
      render: (m) => calcEdad(m.fecha_nacimiento),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mascotas</h1>
          <p className="text-sm text-gray-500">Pacientes registrados en la clínica</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <PawPrint className="size-4" />
          Nueva mascota
        </Button>
      </div>

      {alert && (
        <Alert variant={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
      )}

      <Table
        columns={columns}
        data={mascotas}
        keyField="id_mascota"
        loading={loading}
        emptyMessage="No hay mascotas registradas"
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva mascota">
        <MascotaForm onSubmit={handleCreate} />
      </Modal>
    </div>
  );
}
