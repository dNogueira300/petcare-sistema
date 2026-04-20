"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const schema = z.object({
  id_cliente: z.string().min(1, "Selecciona un propietario"),
  nombre: z.string().min(1, "Campo requerido"),
  especie: z.string().min(1, "Selecciona una especie"),
  raza: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  peso: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const especieOptions = [
  { value: "Perro", label: "Perro" },
  { value: "Gato", label: "Gato" },
  { value: "Ave", label: "Ave" },
  { value: "Conejo", label: "Conejo" },
  { value: "Reptil", label: "Reptil" },
  { value: "Otro", label: "Otro" },
];

interface MascotaFormProps {
  defaultClienteId?: number;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}

interface ClienteOption {
  id_cliente: number;
  usuarios: { nombre: string; apellido: string };
}

export function MascotaForm({ defaultClienteId, onSubmit }: MascotaFormProps) {
  const [clientes, setClientes] = useState<ClienteOption[]>([]);

  useEffect(() => {
    fetch("/api/clientes")
      .then((r) => r.json())
      .then((j) => setClientes(j.data ?? []));
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { id_cliente: defaultClienteId ? String(defaultClienteId) : "" },
  });

  const submit = async (data: FormData) => {
    await onSubmit({
      ...data,
      id_cliente: Number(data.id_cliente),
      peso: data.peso ? Number(data.peso) : undefined,
    });
  };

  const clienteOptions = clientes.map((c) => ({
    value: c.id_cliente,
    label: `${c.usuarios.nombre} ${c.usuarios.apellido}`,
  }));

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      <Select
        label="Propietario"
        options={clienteOptions}
        placeholder="Seleccionar propietario…"
        error={errors.id_cliente?.message}
        {...register("id_cliente")}
      />
      <Input label="Nombre de la mascota" error={errors.nombre?.message} {...register("nombre")} />
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Especie"
          options={especieOptions}
          placeholder="Seleccionar…"
          error={errors.especie?.message}
          {...register("especie")}
        />
        <Input label="Raza (opcional)" {...register("raza")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Fecha de nacimiento"
          type="date"
          {...register("fecha_nacimiento")}
        />
        <Input
          label="Peso (kg)"
          type="number"
          step="0.01"
          placeholder="0.00"
          {...register("peso")}
        />
      </div>
      <Button type="submit" loading={isSubmitting} className="mt-2">
        Registrar mascota
      </Button>
    </form>
  );
}
