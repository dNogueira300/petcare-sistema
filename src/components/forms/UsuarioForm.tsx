"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PasswordStrength } from "@/components/ui/password-strength";
import { passwordSchema, PASSWORD_HINT } from "@/utils/password";

const baseFields = {
  nombre: z.string().min(2, "Mínimo 2 caracteres"),
  apellido: z.string().min(2, "Mínimo 2 caracteres"),
  correo: z.string().email("Correo inválido"),
  rol: z.enum(["administrador", "veterinario", "recepcionista"]),
  especialidad: z.string().optional(),
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

export function UsuarioForm({
  defaultValues,
  onSubmit,
  isEdit,
}: UsuarioFormProps) {
  const schema = isEdit ? editSchema : createSchema;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const contrasenaValue = useWatch({
    control,
    name: "contrasena" as never,
    defaultValue: "",
  }) as string;
  const rolValue = useWatch({ control, name: "rol" as never }) as string | undefined;
  const e = errors as Record<string, { message?: string }>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Nombre"
          error={e.nombre?.message}
          {...register("nombre")}
        />
        <Input
          label="Apellido"
          error={e.apellido?.message}
          {...register("apellido")}
        />
      </div>
      <Input
        label="Correo"
        type="email"
        error={e.correo?.message}
        {...register("correo")}
      />
      {!isEdit && (
        <div>
          <Input
            label="Contraseña"
            type="password"
            hint={PASSWORD_HINT}
            error={e.contrasena?.message}
            {...register("contrasena" as never)}
          />
          <PasswordStrength value={contrasenaValue ?? ""} />
        </div>
      )}
      <Select
        label="Rol"
        options={rolOptions}
        error={e.rol?.message}
        {...register("rol")}
      />
      {rolValue === "veterinario" && (
        <Input
          label="Especialidad (opcional)"
          placeholder="Ej: Cirugía, Dermatología…"
          error={e.especialidad?.message}
          {...register("especialidad")}
        />
      )}
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
          {isEdit ? "Guardar cambios" : "Crear usuario"}
        </Button>
      </div>
    </form>
  );
}
