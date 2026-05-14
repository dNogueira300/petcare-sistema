"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PageLoading } from "@/components/ui/loading";
import { Table, type Column } from "@/components/ui/table";
import { VacunaForm } from "@/components/forms/VacunaForm";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/context/toast";
import { formatLima, hoyCimaFecha } from "@/utils/datetime";
import { FRECUENCIA_LABEL, type Frecuencia } from "@/lib/vacunas";
import { exportCartillaPdf } from "@/utils/cartillaPdf";
import type { CartillaVacunacion } from "@/types";

interface MascotaInfo {
  id_mascota: number;
  nombre: string;
  especie: string;
  raza: string | null;
  sexo?: string | null;
  color?: string | null;
  fecha_nacimiento?: string | null;
  clientes?: { usuarios: { nombre: string; apellido: string } };
}

type VacunaRow = CartillaVacunacion & {
  veterinarios?: { usuarios?: { nombre: string; apellido: string } };
};

function diasHasta(fechaISO: string): number {
  const [hy, hm, hd] = hoyCimaFecha().split("-").map(Number);
  const [fy, fm, fd] = fechaISO.split("-").map(Number);
  return Math.round((Date.UTC(fy, fm - 1, fd) - Date.UTC(hy, hm - 1, hd)) / 86400000);
}

function alertaColor(dias: number): { bg: string; border: string; text: string; label: string } {
  if (dias < 0) return { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", label: "Vencida" };
  if (dias <= 7) return { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", label: `En ${dias} día${dias !== 1 ? "s" : ""}` };
  if (dias <= 30) return { bg: "#fffbeb", border: "#fde68a", text: "#92400e", label: `En ${dias} días` };
  return { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534", label: `En ${dias} días` };
}

export default function CartillaPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const toast = useToast();
  const puedeRegistrar = user?.rol === "administrador" || user?.rol === "veterinario" || user?.rol === "recepcionista";

  const [mascota, setMascota] = useState<MascotaInfo | null>(null);
  const [vacunas, setVacunas] = useState<VacunaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    const [mRes, vRes] = await Promise.all([
      fetch(`/api/mascotas/${id}`).then((r) => r.json()).catch(() => ({})),
      fetch(`/api/vacunas?id_mascota=${id}`).then((r) => r.json()).catch(() => ({})),
    ]);
    setMascota(mRes.data ?? null);
    setVacunas(vRes.data ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  if (loading) return <PageLoading />;

  const proximas = vacunas
    .filter((v) => v.fecha_proxima_dosis)
    .sort((a, b) => (a.fecha_proxima_dosis! < b.fecha_proxima_dosis! ? -1 : 1));

  const columns: Column<VacunaRow>[] = [
    { key: "tipo", header: "Vacuna", render: (v) => <span className="font-medium text-gray-900">{v.tipo_vacuna}</span> },
    { key: "aplicacion", header: "Fecha aplicación",
      render: (v) => formatLima(`${v.fecha_aplicacion}T00:00:00`, "dd/MM/yyyy") },
    { key: "proxima", header: "Próxima dosis",
      render: (v) => v.fecha_proxima_dosis ? formatLima(`${v.fecha_proxima_dosis}T00:00:00`, "dd/MM/yyyy") : "—" },
    { key: "frecuencia", header: "Frecuencia", className: "hidden sm:table-cell",
      render: (v) => v.frecuencia ? FRECUENCIA_LABEL[v.frecuencia as Frecuencia] : "—" },
    { key: "lote", header: "Lote", className: "hidden md:table-cell",
      render: (v) => v.lote ?? "—" },
    { key: "veterinario", header: "Veterinario", className: "hidden lg:table-cell",
      render: (v) => v.veterinarios?.usuarios
        ? `${v.veterinarios.usuarios.nombre} ${v.veterinarios.usuarios.apellido}` : "—" },
    { key: "observaciones", header: "Observaciones", className: "hidden xl:table-cell",
      render: (v) => v.observaciones ?? "—" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/mascotas" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-petcare-50 text-petcare-600">
            <PawPrint className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Cartilla de vacunas — {mascota?.nombre ?? "Mascota"}
            </h1>
            <p className="text-sm text-gray-500">
              {mascota?.especie}{mascota?.raza ? ` · ${mascota.raza}` : ""}
              {mascota?.clientes ? ` · ${mascota.clientes.usuarios.nombre} ${mascota.clientes.usuarios.apellido}` : ""}
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            onClick={() =>
              exportCartillaPdf({
                mascota: mascota ?? { id_mascota: Number(id), nombre: "Mascota", especie: "", raza: null },
                vacunas,
              })
            }
            disabled={vacunas.length === 0}
            variant="outline"
          >
            Descargar PDF
          </Button>
          {puedeRegistrar && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="size-4" /> Registrar vacuna
            </Button>
          )}
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Próximas dosis</h2>
        {proximas.length === 0 ? (
          <p className="text-sm text-gray-400">No hay dosis programadas.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {proximas.map((v) => {
              const dias = diasHasta(v.fecha_proxima_dosis!);
              const c = alertaColor(dias);
              return (
                <div key={v.id} className="rounded-xl border p-4"
                  style={{ background: c.bg, borderColor: c.border }}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-gray-900">{v.tipo_vacuna}</span>
                    <span className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ color: c.text, background: "#fff" }}>{c.label}</span>
                  </div>
                  <p className="mt-1 text-sm" style={{ color: c.text }}>
                    {formatLima(`${v.fecha_proxima_dosis}T00:00:00`, "dd/MM/yyyy")}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Historial de vacunas</h2>
        <Table
          columns={columns}
          data={vacunas}
          keyField="id"
          loading={false}
          emptyMessage="Aún no se han registrado vacunas para esta mascota."
        />
      </section>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Registrar nueva vacuna">
        <VacunaForm
          idMascota={Number(id)}
          onSuccess={() => { setFormOpen(false); toast.success("Vacuna registrada"); cargar(); }}
        />
      </Modal>
    </div>
  );
}
