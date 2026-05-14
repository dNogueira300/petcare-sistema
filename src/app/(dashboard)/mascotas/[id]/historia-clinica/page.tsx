"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Eye } from "lucide-react";
import { Table, type Column } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/ui/loading";
import { formatLima } from "@/utils/datetime";
import { useAuth } from "@/hooks/useAuth";
import { exportHistorialPdf } from "@/utils/historialPdf";

interface MascotaInfo {
  id_mascota: number;
  nombre: string;
  especie: string;
  raza: string | null;
  clientes?: { usuarios: { nombre: string; apellido: string } };
}

interface HistoriaRow {
  id_historia: number;
  fecha_consulta: string;
  diagnostico: string;
  tratamiento: string;
  observaciones: string | null;
  peso_consulta: number | null;
  veterinarios?: { usuarios: { nombre: string; apellido: string } };
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 whitespace-pre-wrap">{value || "—"}</span>
    </div>
  );
}

export default function MascotaHistoriaClinicaPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [mascota, setMascota] = useState<MascotaInfo | null>(null);
  const [historias, setHistorias] = useState<HistoriaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<HistoriaRow | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    const [mRes, hRes] = await Promise.all([
      fetch(`/api/mascotas/${id}`).then((r) => r.json()).catch(() => ({})),
      fetch(`/api/historia-clinica?id_mascota=${id}`).then((r) => r.json()).catch(() => ({})),
    ]);
    setMascota(mRes.data ?? null);
    setHistorias(hRes.data ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  if (loading) return <PageLoading />;

  const columns: Column<HistoriaRow>[] = [
    { key: "fecha", header: "Fecha", render: (h) => formatLima(`${h.fecha_consulta}T00:00:00`, "dd/MM/yyyy") },
    { key: "vet", header: "Veterinario", className: "hidden sm:table-cell",
      render: (h) => h.veterinarios ? `${h.veterinarios.usuarios.nombre} ${h.veterinarios.usuarios.apellido}` : "—" },
    { key: "diagnostico", header: "Diagnóstico",
      render: (h) => <span className="line-clamp-1 max-w-xs" title={h.diagnostico}>{h.diagnostico}</span> },
    { key: "tratamiento", header: "Tratamiento", className: "hidden md:table-cell",
      render: (h) => <span className="line-clamp-1 max-w-xs" title={h.tratamiento}>{h.tratamiento}</span> },
    { key: "peso", header: "Peso", className: "hidden sm:table-cell",
      render: (h) => h.peso_consulta ? `${h.peso_consulta} kg` : "—" },
    { key: "acciones", header: "Acciones",
      render: (h) => (
        <button onClick={() => setDetail(h)} title="Ver detalle"
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
          <Eye className="size-4" />
        </button>
      ),
    },
  ];

  const back = user?.rol === "cliente" ? "/portal" : "/mascotas";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href={back} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FileText className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Historia clínica — {mascota?.nombre ?? "Mascota"}
            </h1>
            <p className="text-sm text-gray-500">
              {mascota?.especie}{mascota?.raza ? ` · ${mascota.raza}` : ""}
              {mascota?.clientes ? ` · ${mascota.clientes.usuarios.nombre} ${mascota.clientes.usuarios.apellido}` : ""}
            </p>
          </div>
        </div>
        <div className="ml-auto">
          <Button
            onClick={() =>
              exportHistorialPdf({
                mascota: mascota ?? { id_mascota: Number(id), nombre: "Mascota", especie: "", raza: null },
                historias,
              })
            }
            disabled={historias.length === 0}
          >
            Descargar PDF
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        data={historias}
        keyField="id_historia"
        loading={false}
        emptyMessage="Sin historias clínicas registradas para esta mascota."
      />

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Historia clínica" className="max-w-2xl">
        {detail && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailRow label="Fecha" value={formatLima(`${detail.fecha_consulta}T00:00:00`, "dd/MM/yyyy")} />
              <DetailRow label="Veterinario" value={detail.veterinarios ? `${detail.veterinarios.usuarios.nombre} ${detail.veterinarios.usuarios.apellido}` : "—"} />
              <DetailRow label="Peso en consulta" value={detail.peso_consulta ? `${detail.peso_consulta} kg` : "—"} />
            </div>
            <DetailRow label="Diagnóstico" value={detail.diagnostico} />
            <DetailRow label="Tratamiento" value={detail.tratamiento} />
            {detail.observaciones && <DetailRow label="Observaciones" value={detail.observaciones} />}
          </div>
        )}
      </Modal>
    </div>
  );
}
