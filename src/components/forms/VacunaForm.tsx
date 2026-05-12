"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { hoyCimaFecha } from "@/utils/datetime";
import type { EsquemaVacuna } from "@/types";

const schema = z.object({
  tipo_vacuna: z.string().min(2, "Selecciona el tipo de vacuna"),
  fecha_aplicacion: z.string().min(1, "Selecciona la fecha de aplicación"),
  lote: z.string().optional(),
  observaciones: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface VacunaFormProps {
  idMascota: number;
  onSuccess: () => void;
}

function addDaysStr(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const f = new Date(y, m - 1, d + days);
  return `${String(f.getDate()).padStart(2, "0")}/${String(f.getMonth() + 1).padStart(2, "0")}/${f.getFullYear()}`;
}

export function VacunaForm({ idMascota, onSuccess }: VacunaFormProps) {
  const [esquemas, setEsquemas] = useState<EsquemaVacuna[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/esquemas-vacuna").then((r) => r.json()).then((j) => setEsquemas(j.data ?? []));
  }, []);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fecha_aplicacion: hoyCimaFecha() },
  });

  const tipo = useWatch({ control, name: "tipo_vacuna" });
  const fechaApp = useWatch({ control, name: "fecha_aplicacion" });
  const esquemaSel = esquemas.find((e) => e.nombre_vacuna === tipo);
  const proxima = esquemaSel && fechaApp ? addDaysStr(fechaApp, esquemaSel.dias_refuerzo) : null;

  const submit = async (data: FormData) => {
    setError(null);
    const res = await fetch("/api/vacunas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_mascota: idMascota,
        tipo_vacuna: data.tipo_vacuna,
        fecha_aplicacion: data.fecha_aplicacion,
        lote: data.lote || undefined,
        observaciones: data.observaciones || undefined,
      }),
    });
    if (res.ok) {
      onSuccess();
      return;
    }
    const j = await res.json().catch(() => ({}));
    setError(typeof j.error === "string" ? j.error : "No se pudo registrar la vacuna");
  };

  const opciones = esquemas.map((e) => ({ value: e.nombre_vacuna, label: e.nombre_vacuna }));

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      <div>
        <Select
          label="Tipo de vacuna"
          options={opciones}
          placeholder="Seleccionar vacuna…"
          error={errors.tipo_vacuna?.message}
          {...register("tipo_vacuna")}
        />
        {esquemaSel?.descripcion && (
          <p className="mt-1 text-xs text-gray-400">{esquemaSel.descripcion}</p>
        )}
        {proxima && (
          <p className="mt-1 text-xs text-gray-400">Próxima dosis estimada: {proxima}</p>
        )}
      </div>

      <Input
        label="Fecha de aplicación"
        type="date"
        max={hoyCimaFecha()}
        error={errors.fecha_aplicacion?.message}
        {...register("fecha_aplicacion")}
      />
      <Input label="Lote (opcional)" placeholder="N.º de lote del vial" {...register("lote")} />
      <Textarea label="Observaciones (opcional)" placeholder="Reacciones, notas…" {...register("observaciones")} />

      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <div style={{ position: "sticky", bottom: 0, background: "#fff",
        borderTop: "1px solid #f0ead8", padding: "12px 0 16px", marginTop: "4px" }}>
        <Button type="submit" loading={isSubmitting} className="w-full">
          Registrar vacuna
        </Button>
      </div>
    </form>
  );
}
