"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Users, PawPrint, Clock, CalendarPlus, UserPlus } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoading } from "@/components/ui/loading";
import { formatLima } from "@/utils/datetime";
import type { EstadoCita } from "@/types";

interface Metrics {
  citas_hoy: number;
  citas_semana: number;
  citas_pendientes: number;
  total_clientes: number;
  total_mascotas: number;
  citas_por_estado: { estado: string; cantidad: number }[];
  proximas_citas: {
    id_cita: number;
    fecha: string;
    hora: string;
    motivo: string;
    estado: EstadoCita;
    mascotas: { nombre: string; especie: string };
    veterinarios: { usuarios: { nombre: string; apellido: string } };
  }[];
}

const estadoLabels: Record<string, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
  atendida: "Atendida",
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((j) => setMetrics(j))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoading />;
  if (!metrics) return <p className="text-gray-500">Error al cargar el dashboard</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Resumen del sistema PetCare</p>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={CalendarDays}
          label="Citas hoy"
          value={metrics.citas_hoy}
          color="text-petcare-600"
          bg="bg-petcare-50"
        />
        <MetricCard
          icon={Clock}
          label="Citas semana"
          value={metrics.citas_semana}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <MetricCard
          icon={Users}
          label="Clientes"
          value={metrics.total_clientes}
          color="text-purple-600"
          bg="bg-purple-50"
        />
        <MetricCard
          icon={PawPrint}
          label="Mascotas"
          value={metrics.total_mascotas}
          color="text-amber-600"
          bg="bg-amber-50"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Estado de citas */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Estado de citas</h2>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {metrics.citas_por_estado.length === 0 ? (
                <p className="text-sm text-gray-400">Sin datos</p>
              ) : (
                metrics.citas_por_estado.map((item) => (
                  <div key={item.estado} className="flex items-center justify-between text-sm">
                    <Badge variant={item.estado as EstadoCita}>
                      {estadoLabels[item.estado] ?? item.estado}
                    </Badge>
                    <span className="font-semibold text-gray-700">{item.cantidad}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Accesos rápidos */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Accesos rápidos</h2>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Link
                href="/citas/nueva"
                className="flex items-center gap-3 rounded-xl border border-petcare-200 bg-petcare-50 p-3 text-sm font-medium text-petcare-700 hover:bg-petcare-100 transition-colors"
              >
                <CalendarPlus className="size-5" />
                Nueva cita
              </Link>
              <Link
                href="/clientes"
                className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <UserPlus className="size-5" />
                Registrar cliente
              </Link>
              <Link
                href="/mascotas"
                className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <PawPrint className="size-5" />
                Registrar mascota
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Citas del día */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Citas de hoy</h2>
          <span className="text-sm text-gray-500">{metrics.proximas_citas.length} citas</span>
        </CardHeader>
        <CardContent>
          {metrics.proximas_citas.length === 0 ? (
            <p className="text-sm text-gray-400">No hay citas programadas para hoy</p>
          ) : (
            <ul className="flex flex-col divide-y divide-gray-50">
              {metrics.proximas_citas.map((cita) => (
                <li key={cita.id_cita} className="flex items-center gap-4 py-3 text-sm">
                  <span className="w-12 shrink-0 font-mono text-petcare-600">{cita.hora}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {cita.mascotas?.nombre} — {cita.motivo}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {cita.veterinarios?.usuarios.nombre} {cita.veterinarios?.usuarios.apellido}
                    </p>
                  </div>
                  <Badge variant={cita.estado}>{estadoLabels[cita.estado]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`rounded-xl p-3 ${bg}`}>
          <Icon className={`size-6 ${color}`} />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
