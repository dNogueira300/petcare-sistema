"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { hoyCimaFecha } from "@/utils/datetime";

const schema = z.object({
  id_cita: z.string().min(1, "Selecciona una cita"),
  id_mascota: z.string().min(1),
  id_veterinario: z.string().min(1),
  fecha_consulta: z.string().min(1),
  diagnostico: z.string().min(5, "Mínimo 5 caracteres"),
  tratamiento: z.string().min(5, "Mínimo 5 caracteres"),
  observaciones: z.string().optional(),
  peso_consulta: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface CitaAtendida {
  id_cita: number;
  fecha: string;
  hora: string;
  id_mascota: number;
  id_veterinario: number;
  mascotas: { nombre: string };
  veterinarios: { usuarios: { nombre: string; apellido: string } };
}

export interface PrefillCita {
  id_cita: number;
  id_mascota: number;
  id_veterinario: number;
  fecha: string;
  mascotas: { nombre: string };
  veterinarios: { usuarios: { nombre: string; apellido: string } };
}

interface HistoriaClinicaFormProps {
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  prefillCita?: PrefillCita;
}

export function HistoriaClinicaForm({
  onSubmit,
  prefillCita,
}: HistoriaClinicaFormProps) {
  const [citas, setCitas] = useState<CitaAtendida[]>([]);

  useEffect(() => {
    if (prefillCita) return;
    fetch("/api/citas?estado=confirmada")
      .then((r) => r.json())
      .then((j) => setCitas(j.data ?? []));
  }, [prefillCita]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fecha_consulta: prefillCita?.fecha ?? hoyCimaFecha(),
      id_cita: prefillCita ? String(prefillCita.id_cita) : "",
      id_mascota: prefillCita ? String(prefillCita.id_mascota) : "",
      id_veterinario: prefillCita ? String(prefillCita.id_veterinario) : "",
    },
  });

  const selectedCitaId = useWatch({ control, name: "id_cita" });
  const selectedCita =
    prefillCita ?? citas.find((c) => String(c.id_cita) === selectedCitaId);

  const handleCitaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cita = citas.find((c) => String(c.id_cita) === e.target.value);
    if (cita) {
      setValue("id_mascota", String(cita.id_mascota));
      setValue("id_veterinario", String(cita.id_veterinario));
    }
    setValue("id_cita", e.target.value);
  };

  const submit = async (data: FormData) => {
    await onSubmit({
      ...data,
      id_cita: Number(data.id_cita),
      id_mascota: Number(data.id_mascota),
      id_veterinario: Number(data.id_veterinario),
      peso_consulta: data.peso_consulta
        ? Number(data.peso_consulta)
        : undefined,
    });
  };

  const citaOptions = citas.map((c) => ({
    value: c.id_cita,
    label: `${c.fecha} ${c.hora.slice(0, 5)} — ${c.mascotas?.nombre ?? "—"} · ${c.veterinarios?.usuarios.nombre ?? ""}`,
  }));

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {prefillCita ? (
        /* Pre-filled mode: show cita info as read-only */
        <div className="rounded-lg border border-petcare-200 bg-petcare-50/40 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
            Cita seleccionada
          </p>
          <p className="text-sm font-medium text-gray-900">
            {prefillCita.mascotas?.nombre} · Dr.{" "}
            {prefillCita.veterinarios?.usuarios.nombre}{" "}
            {prefillCita.veterinarios?.usuarios.apellido}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Fecha: {prefillCita.fecha}
          </p>
        </div>
      ) : (
        /* Normal mode: cita selector */
        <Select
          label="Cita"
          options={citaOptions}
          placeholder="Seleccionar cita confirmada…"
          error={errors.id_cita?.message}
          {...register("id_cita")}
          onChange={handleCitaChange}
        />
      )}

      {selectedCita && !prefillCita && (
        <p className="text-sm text-gray-500">
          Mascota: <strong>{selectedCita.mascotas?.nombre}</strong> ·
          Veterinario:{" "}
          <strong>
            {selectedCita.veterinarios?.usuarios.nombre}{" "}
            {selectedCita.veterinarios?.usuarios.apellido}
          </strong>
        </p>
      )}

      <input type="hidden" {...register("id_mascota")} />
      <input type="hidden" {...register("id_veterinario")} />
      <input type="hidden" {...register("id_cita")} />

      <Input
        label="Fecha de consulta"
        type="date"
        error={errors.fecha_consulta?.message}
        {...register("fecha_consulta")}
      />
      <Textarea
        label="Diagnóstico"
        error={errors.diagnostico?.message}
        {...register("diagnostico")}
      />
      <Textarea
        label="Tratamiento"
        error={errors.tratamiento?.message}
        {...register("tratamiento")}
      />
      <Textarea
        label="Observaciones (opcional)"
        {...register("observaciones")}
      />
      <Input
        label="Peso en consulta (kg)"
        type="number"
        step="0.01"
        placeholder="0.00"
        {...register("peso_consulta")}
      />
      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: "#fff",
          borderTop: "1px solid #f0ead8",
          padding: "12px 0 16px",
          marginTop: "4px",
        }}
      >
        <Button type="submit" loading={isSubmitting} className="w-full">
          Registrar historia clínica
        </Button>
      </div>
    </form>
  );
}
