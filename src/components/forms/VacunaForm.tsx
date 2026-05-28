"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { hoyCimaFecha } from "@/utils/datetime";
import {
  FRECUENCIA_OPTIONS,
  FRECUENCIA_DIAS,
  type Frecuencia,
} from "@/lib/vacunas";
import type { EsquemaVacuna } from "@/types";

const CUSTOM = "__custom__";

interface VacunaFormProps {
  idMascota: number;
  onSuccess: () => void;
}

function addDaysStr(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const f = new Date(y, m - 1, d + days);
  return `${String(f.getDate()).padStart(2, "0")}/${String(f.getMonth() + 1).padStart(2, "0")}/${f.getFullYear()}`;
}

// Adivina la frecuencia más cercana a un número de días (para precargar al elegir un esquema)
function frecuenciaPorDias(dias: number): Frecuencia {
  const candidatos = Object.entries(FRECUENCIA_DIAS) as [Exclude<Frecuencia, "unica">, number][];
  let best: Frecuencia = "anual";
  let bestDiff = Infinity;
  for (const [k, v] of candidatos) {
    const diff = Math.abs(v - dias);
    if (diff < bestDiff) { best = k; bestDiff = diff; }
  }
  return best;
}

export function VacunaForm({ idMascota, onSuccess }: VacunaFormProps) {
  const [esquemas, setEsquemas] = useState<EsquemaVacuna[]>([]);
  const [tipoSel, setTipoSel] = useState<string>(""); // valor del select (nombre del esquema o CUSTOM)
  const [tipoCustom, setTipoCustom] = useState("");
  const [fechaAplicacion, setFechaAplicacion] = useState(hoyCimaFecha());
  const [frecuencia, setFrecuencia] = useState<Frecuencia | "">("");
  const [lote, setLote] = useState("");
  const [fechaVencLote, setFechaVencLote] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/esquemas-vacuna").then((r) => r.json()).then((j) => setEsquemas(j.data ?? []));
  }, []);

  const opciones = [
    ...esquemas.map((e) => ({ value: e.nombre_vacuna, label: e.nombre_vacuna })),
    { value: CUSTOM, label: "Otra (personalizada)…" },
  ];

  const tipoFinal = tipoSel === CUSTOM ? tipoCustom.trim() : tipoSel;
  const esquemaSel = tipoSel !== CUSTOM ? esquemas.find((e) => e.nombre_vacuna === tipoSel) : undefined;

  const handleTipoChange = (val: string) => {
    setTipoSel(val);
    if (val === CUSTOM) {
      setTipoCustom("");
      // mantener frecuencia actual
    } else {
      const esq = esquemas.find((e) => e.nombre_vacuna === val);
      if (esq && !frecuencia) setFrecuencia(frecuenciaPorDias(esq.dias_refuerzo));
    }
  };

  const proxima =
    frecuencia && frecuencia !== "unica" && fechaAplicacion
      ? addDaysStr(fechaAplicacion, FRECUENCIA_DIAS[frecuencia])
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!tipoFinal || tipoFinal.length < 2) newErrors.tipo_vacuna = "Selecciona o escribe el tipo de vacuna";
    if (!fechaAplicacion) newErrors.fecha_aplicacion = "Selecciona la fecha de aplicación";
    if (!frecuencia) newErrors.frecuencia = "Selecciona la frecuencia";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/vacunas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_mascota:             idMascota,
        tipo_vacuna:            tipoFinal,
        fecha_aplicacion:       fechaAplicacion,
        frecuencia,
        lote:                   lote || undefined,
        fecha_vencimiento_lote: fechaVencLote || undefined,
        observaciones:          observaciones || undefined,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      onSuccess();
      return;
    }
    const j = await res.json().catch(() => ({}));
    setError(typeof j.error === "string" ? j.error : "No se pudo registrar la vacuna");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <Select
          label="Tipo de vacuna"
          options={opciones}
          placeholder="Seleccionar…"
          value={tipoSel}
          onChange={(e) => handleTipoChange(e.target.value)}
          error={errors.tipo_vacuna}
        />
        {tipoSel === CUSTOM && (
          <Input
            label="Nombre personalizado"
            placeholder="Ej: Leishmaniosis"
            value={tipoCustom}
            onChange={(e) => setTipoCustom(e.target.value)}
            className="mt-2"
          />
        )}
        {esquemaSel?.descripcion && tipoSel !== CUSTOM && (
          <p className="mt-1 text-xs text-gray-400">{esquemaSel.descripcion}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Fecha de aplicación"
          type="date"
          max={hoyCimaFecha()}
          value={fechaAplicacion}
          onChange={(e) => setFechaAplicacion(e.target.value)}
          error={errors.fecha_aplicacion}
        />
        <Select
          label="Frecuencia"
          options={FRECUENCIA_OPTIONS}
          placeholder="Seleccionar…"
          value={frecuencia}
          onChange={(e) => setFrecuencia(e.target.value as Frecuencia)}
          error={errors.frecuencia}
        />
      </div>

      {proxima && (
        <p className="text-xs text-gray-500">Próxima dosis estimada: <strong>{proxima}</strong></p>
      )}
      {frecuencia === "unica" && (
        <p className="text-xs text-gray-500">Esta vacuna no requiere dosis de refuerzo.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Lote (opcional)" placeholder="N.º de lote del vial"
          value={lote} onChange={(e) => setLote(e.target.value)} />
        <div>
          <Input
            label="Vencimiento del lote (opcional)"
            type="date"
            value={fechaVencLote}
            onChange={(e) => setFechaVencLote(e.target.value)}
          />
          {fechaVencLote && fechaVencLote < hoyCimaFecha() && (
            <p className="mt-1 text-xs text-red-600 font-semibold">
              ⚠️ El lote está vencido — no se permitirá registrar la vacuna.
            </p>
          )}
          {fechaVencLote && fechaVencLote >= hoyCimaFecha() && (
            <p className="mt-1 text-xs text-green-600">
              ✓ Lote vigente hasta {fechaVencLote}
            </p>
          )}
        </div>
      </div>
      <Textarea label="Observaciones (opcional)" placeholder="Reacciones, notas…"
        value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <div style={{ position: "sticky", bottom: 0, background: "#fff",
        borderTop: "1px solid #f0ead8", padding: "12px 0 16px", marginTop: "4px" }}>
        <Button type="submit" loading={submitting} className="w-full">
          Registrar vacuna
        </Button>
      </div>
    </form>
  );
}
