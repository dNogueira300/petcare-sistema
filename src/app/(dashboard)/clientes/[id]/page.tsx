"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PawPrint } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoading } from "@/components/ui/loading";

interface ClienteDetail {
  id_cliente: number;
  telefono: string;
  direccion: string | null;
  usuarios: {
    nombre: string;
    apellido: string;
    correo: string;
    activo: boolean;
  };
  mascotas: { id_mascota: number; nombre: string; especie: string; raza: string | null }[];
}

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ClienteDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/clientes/${id}`)
      .then((r) => r.json())
      .then((j) => setData(j.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoading />;
  if (!data) return <p className="text-gray-500">Cliente no encontrado</p>;

  const { usuarios: u, mascotas } = data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/clientes"
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {u.nombre} {u.apellido}
          </h1>
          <p className="text-sm text-gray-500">Detalle del cliente</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Información personal</h2>
            <Badge variant={u.activo ? "confirmada" : "cancelada"}>
              {u.activo ? "Activo" : "Inactivo"}
            </Badge>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Correo</dt>
                <dd className="text-gray-900">{u.correo}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Teléfono</dt>
                <dd className="text-gray-900">{data.telefono}</dd>
              </div>
              {data.direccion && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Dirección</dt>
                  <dd className="text-gray-900">{data.direccion}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Mascotas</h2>
            <span className="text-sm text-gray-500">{mascotas.length} registradas</span>
          </CardHeader>
          <CardContent>
            {mascotas.length === 0 ? (
              <p className="text-sm text-gray-400">Sin mascotas registradas</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {mascotas.map((m) => (
                  <li key={m.id_mascota} className="flex items-center gap-2 text-sm">
                    <PawPrint className="size-4 text-petcare-500" />
                    <Link
                      href={`/mascotas/${m.id_mascota}`}
                      className="font-medium text-petcare-600 hover:underline"
                    >
                      {m.nombre}
                    </Link>
                    <span className="text-gray-400">
                      {m.especie}{m.raza ? ` · ${m.raza}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
