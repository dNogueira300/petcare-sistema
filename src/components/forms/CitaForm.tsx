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
import { hoyCimaFecha, slotsDisponibles } from "@/utils/datetime";

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
interface VetOption { id_veterinario: number; usuarios: { nombre: string; apellido: string } }

function labelFecha(fecha: string): string | null {
  if (!fecha) return null;
  const [y, mo, d] = fecha.split("-").map(Number);
  const dow = new Date(y, mo - 1, d).getDay();
  if (dow === 0) return "Los domingos no hay atención";
  return null;
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
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const selectedFecha = watch("fecha");
  const slots = selectedFecha ? slotsDisponibles(selectedFecha) : [];
  const esDomingo = !!labelFecha(selectedFecha);

  // Limpiar hora al cambiar fecha para evitar selecciones inválidas
  useEffect(() => {
    setValue("hora", "");
  }, [selectedFecha, setValue]);

  const submit = async (data: FormData) => {
    setDisponibilidadErr(null);
    const res = await fetch(
      `/api/citas/disponibilidad?id_veterinario=${data.id_veterinario}&fecha=${data.fecha}&hora=${data.hora}`
    );
    const json = await res.json();
    if (!json.disponible) {
      setDisponibilidadErr("El veterinario ya tiene una cita en ese horario. Elige otra hora.");
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

  const horaOptions = slots.map((h) => ({ value: h, label: h }));

  const horaPlaceholder = !selectedFecha
    ? "Selecciona una fecha primero"
    : esDomingo
    ? "Sin atención los domingos"
    : "Seleccionar hora…";

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
          placeholder={horaPlaceholder}
          error={errors.hora?.message}
          {...register("hora")}
        />
      </div>
      {esDomingo && (
        <p className="text-sm text-amber-600">
          Los domingos no hay atención. Selecciona otro día.
        </p>
      )}
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
