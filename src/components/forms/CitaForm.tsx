"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { AvailabilityCalendar } from "@/components/ui/availability-calendar";
import { TimeSlotsGrid } from "@/components/ui/time-slots-grid";

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

function dateToStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function CitaForm({ onSubmit }: CitaFormProps) {
  const [mascotas, setMascotas] = useState<MascotaOption[]>([]);
  const [veterinarios, setVeterinarios] = useState<VetOption[]>([]);
  const [disponibilidadErr, setDisponibilidadErr] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();

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
  const selectedHora = watch("hora");
  const selectedVetId = watch("id_veterinario");

  const handleDaySelect = (date: Date | undefined) => {
    setSelectedDay(date);
    setValue("fecha", date ? dateToStr(date) : "", { shouldValidate: true });
    setValue("hora", "", { shouldValidate: false });
  };

  const handleSlotSelect = (hora: string) => {
    setValue("hora", hora, { shouldValidate: true });
  };

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

  const vetReg = register("id_veterinario");

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-5">
      <Select
        label="Mascota"
        options={mascotaOptions}
        placeholder="Seleccionar mascota…"
        error={errors.id_mascota?.message}
        {...register("id_mascota")}
      />

      {/* Calendar */}
      <div>
        <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.07em",
          textTransform: "uppercase", color: "#6b5c44", marginBottom: "8px",
          fontFamily: "var(--font-dm-sans)" }}>
          Fecha
        </p>
        <AvailabilityCalendar selected={selectedDay} onSelect={handleDaySelect} />
        {errors.fecha && (
          <p style={{ fontSize: "0.75rem", color: "#dc2626", fontFamily: "var(--font-dm-sans)",
            marginTop: "4px" }}>
            {errors.fecha.message}
          </p>
        )}
      </div>

      {/* Veterinario — se elige después de la fecha */}
      {selectedFecha && (
        <Select
          label="Veterinario"
          options={vetOptions}
          placeholder="Seleccionar veterinario…"
          error={errors.id_veterinario?.message}
          {...vetReg}
          onChange={(e) => { vetReg.onChange(e); setValue("hora", "", { shouldValidate: false }); }}
        />
      )}

      {/* Time slots grid — disponibilidad real del veterinario */}
      {selectedFecha && selectedVetId && (
        <div>
          <TimeSlotsGrid
            fecha={selectedFecha}
            idVeterinario={selectedVetId}
            selected={selectedHora ?? ""}
            onSelect={handleSlotSelect}
          />
          {errors.hora && (
            <p style={{ fontSize: "0.75rem", color: "#dc2626", fontFamily: "var(--font-dm-sans)",
              marginTop: "6px" }}>
              {errors.hora.message}
            </p>
          )}
        </div>
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

      <div style={{ position:"sticky", bottom:0, background:"#fff",
        borderTop:"1px solid #f0ead8", padding:"12px 0 16px", marginTop:"4px" }}>
        <Button type="submit" loading={isSubmitting} className="w-full">
          Agendar cita
        </Button>
      </div>
    </form>
  );
}
