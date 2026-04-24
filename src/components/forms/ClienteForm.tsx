"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { passwordSchema, PASSWORD_HINT } from "@/utils/password";

const schema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres"),
  apellido: z.string().min(2, "Mínimo 2 caracteres"),
  correo: z.string().email("Correo inválido"),
  contrasena: passwordSchema,
  telefono: z.string().min(7, "Teléfono inválido"),
  direccion: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ClienteFormProps {
  onSubmit: (data: FormData) => Promise<void>;
}

export function ClienteForm({ onSubmit }: ClienteFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Nombre" error={errors.nombre?.message} {...register("nombre")} />
        <Input label="Apellido" error={errors.apellido?.message} {...register("apellido")} />
      </div>
      <Input label="Correo" type="email" error={errors.correo?.message} {...register("correo")} />
      <Input
        label="Contraseña"
        type="password"
        hint={PASSWORD_HINT}
        error={errors.contrasena?.message}
        {...register("contrasena")}
      />
      <Input label="Teléfono" error={errors.telefono?.message} {...register("telefono")} />
      <Input
        label="Dirección (opcional)"
        error={errors.direccion?.message}
        {...register("direccion")}
      />
      <Button type="submit" loading={isSubmitting} className="mt-2">
        Registrar cliente
      </Button>
    </form>
  );
}
