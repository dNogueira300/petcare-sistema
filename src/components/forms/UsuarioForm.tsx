"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { passwordSchema, PASSWORD_HINT } from "@/utils/password";

const baseFields = {
  nombre: z.string().min(2, "Mínimo 2 caracteres"),
  apellido: z.string().min(2, "Mínimo 2 caracteres"),
  correo: z.string().email("Correo inválido"),
  rol: z.enum(["administrador", "veterinario", "recepcionista"]),
};

const createSchema = z.object({
  ...baseFields,
  contrasena: passwordSchema,
});

const editSchema = z.object(baseFields);

type CreateData = z.infer<typeof createSchema>;
type EditData = z.infer<typeof editSchema>;
type FormData = CreateData | EditData;

interface UsuarioFormProps {
  defaultValues?: Partial<CreateData>;
  onSubmit: (data: FormData) => Promise<void>;
  isEdit?: boolean;
}

const rolOptions = [
  { value: "administrador", label: "Administrador" },
  { value: "veterinario", label: "Veterinario" },
  { value: "recepcionista", label: "Recepcionista" },
];

export function UsuarioForm({ defaultValues, onSubmit, isEdit }: UsuarioFormProps) {
  const schema = isEdit ? editSchema : createSchema;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema as z.ZodType<FormData>),
    defaultValues,
  });

  const e = errors as Record<string, { message?: string }>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Nombre" error={e.nombre?.message} {...register("nombre")} />
        <Input label="Apellido" error={e.apellido?.message} {...register("apellido")} />
      </div>
      <Input label="Correo" type="email" error={e.correo?.message} {...register("correo")} />
      {!isEdit && (
        <Input
          label="Contraseña"
          type="password"
          hint={PASSWORD_HINT}
          error={e.contrasena?.message}
          {...register("contrasena" as never)}
        />
      )}
      <Select label="Rol" options={rolOptions} error={e.rol?.message} {...register("rol")} />
      <Button type="submit" loading={isSubmitting} className="mt-2">
        {isEdit ? "Guardar cambios" : "Crear usuario"}
      </Button>
    </form>
  );
}
