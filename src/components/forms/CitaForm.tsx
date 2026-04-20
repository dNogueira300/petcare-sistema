"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { hoyCimaFecha } from "@/utils/datetime";

const schema = z.object({
  id_mascota: z.string().min(1, "Selecciona una mascota"),
  id_veterinario: z.string().min(1, "Selecciona un veterinario"),
  fecha: z.string().min(1, "Selecciona una fecha"),
  hora: z.string().min(1, "Selecciona una hora"),
  motivo: z.string().min(5, "Describe el motivo (mín. 5 caracteres)"),
  observaciones: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface CitaFormProps {
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}

interface MascotaOption { id_mascota: number; nombre: string; especie: string }
interface VetOption { id_veterinario: number; horario_inicio: string; horario_fin: string; usuarios: { nombre: string; apellido: string } }

function generateHours(inicio: string, fin: string): string[] {
  const hours: string[] = [];
  const [sh, sm] = inicio.split(":").map(Number);
  const [eh, em] = fin.split(":").map(Number);
  let h = sh, m = sm;
  while (h < eh || (h === eh && m <= em)) {
    hours.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += 30;
    if (m >= 60) { h++; m -= 60; }
  }
  return hours;
}

export function CitaForm({ onSubmit }: CitaFormProps) {
  const [mascotas, setMascotas] = useState<MascotaOption[]>([]);
  const [veterinarios, setVeterinarios] = useState<VetOption[]>([]);
  const [disponibilidadErr, setDisponibilidadErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/mascotas").then((r) => r.json()).then((j) => setMascotas(j.data ?? []));
    fetch("/api/veterinarios").then((r) => r.json()).then((j) => setVeterinarios(j.data ?? []));
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const selectedVetId = watch("id_veterinario");
  const selectedVet = veterinarios.find((v) => String(v.id_veterinario) === selectedVetId);
  const horasDisponibles = selectedVet
    ? generateHours(selectedVet.horario_inicio, selectedVet.horario_fin)
    : [];

  const submit = async (data: FormData) => {
    setDisponibilidadErr(null);
    const res = await fetch(
      `/api/citas/disponibilidad?id_veterinario=${data.id_veterinario}&fecha=${data.fecha}&hora=${data.hora}`
    );
    const json = await res.json();
    if (!json.disponible) {
      setDisponibilidadErr("El veterinario no está disponible en ese horario");
      return;
    }
    await onSubmit({
      ...data,
      id_mascota: Number(data.id_mascota),
      id_veterinario: Number(data.id_veterinario),
    });
  };

  const mascotaOptions = mascotas.map((m) => ({
    value: m.id_mascota,
    label: `${m.nombre} (${m.especie})`,
  }));

  const vetOptions = veterinarios.map((v) => ({
    value: v.id_veterinario,
    label: `${v.usuarios.nombre} ${v.usuarios.apellido}`,
  }));

  const horaOptions = horasDisponibles.map((h) => ({ value: h, label: h }));

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      <Select
        label="Mascota"
        options={mascotaOptions}
        placeholder="Seleccionar mascota…"
        error={errors.id_mascota?.message}
        {...register("id_mascota")}
      />
      <Select
        label="Veterinario"
        options={vetOptions}
        placeholder="Seleccionar veterinario…"
        error={errors.id_veterinario?.message}
        {...register("id_veterinario")}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Fecha"
          type="date"
          min={hoyCimaFecha()}
          error={errors.fecha?.message}
          {...register("fecha")}
        />
        <Select
          label="Hora"
          options={horaOptions}
          placeholder="Seleccionar hora…"
          error={errors.hora?.message}
          {...register("hora")}
        />
      </div>
      <Textarea
        label="Motivo"
        placeholder="Describe el motivo de la consulta…"
        error={errors.motivo?.message}
        {...register("motivo")}
      />
      <Textarea
        label="Observaciones (opcional)"
        placeholder="Observaciones adicionales…"
        {...register("observaciones")}
      />

      {disponibilidadErr && (
        <Alert variant="error" message={disponibilidadErr} onClose={() => setDisponibilidadErr(null)} />
      )}

      <Button type="submit" loading={isSubmitting} className="mt-2">
        Agendar cita
      </Button>
    </form>
  );
}
