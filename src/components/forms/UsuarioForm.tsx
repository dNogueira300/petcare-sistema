"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const schema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres"),
  apellido: z.string().min(2, "Mínimo 2 caracteres"),
  correo: z.string().email("Correo inválido"),
  contrasena: z.string().min(8, "Mínimo 8 caracteres").optional().or(z.literal("")),
  rol: z.enum(["administrador", "veterinario", "recepcionista", "cliente"]),
});

type FormData = z.infer<typeof schema>;

interface UsuarioFormProps {
  defaultValues?: Partial<FormData>;
  onSubmit: (data: FormData) => Promise<void>;
  isEdit?: boolean;
}

const rolOptions = [
  { value: "administrador", label: "Administrador" },
  { value: "veterinario", label: "Veterinario" },
  { value: "recepcionista", label: "Recepcionista" },
  { value: "cliente", label: "Cliente" },
];

export function UsuarioForm({ defaultValues, onSubmit, isEdit }: UsuarioFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Nombre" error={errors.nombre?.message} {...register("nombre")} />
        <Input label="Apellido" error={errors.apellido?.message} {...register("apellido")} />
      </div>
      <Input label="Correo" type="email" error={errors.correo?.message} {...register("correo")} />
      {!isEdit && (
        <Input
          label="Contraseña"
          type="password"
          error={errors.contrasena?.message}
          {...register("contrasena")}
        />
      )}
      <Select label="Rol" options={rolOptions} error={errors.rol?.message} {...register("rol")} />
      <Button type="submit" loading={isSubmitting} className="mt-2">
        {isEdit ? "Guardar cambios" : "Crear usuario"}
      </Button>
    </form>
  );
}
