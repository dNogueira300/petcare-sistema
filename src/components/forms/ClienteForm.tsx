"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordStrength } from "@/components/ui/password-strength";
import { passwordSchema } from "@/utils/password";

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
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const contrasenaValue = useWatch({ control, name: "contrasena", defaultValue: "" });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Nombre" error={errors.nombre?.message} {...register("nombre")} />
        <Input label="Apellido" error={errors.apellido?.message} {...register("apellido")} />
      </div>
      <Input label="Correo" type="email" error={errors.correo?.message} {...register("correo")} />
      <div>
        <Input
          label="Contraseña"
          type="password"
          error={errors.contrasena?.message}
          {...register("contrasena")}
        />
        <PasswordStrength value={contrasenaValue ?? ""} />
      </div>
      <Input label="Teléfono" error={errors.telefono?.message} {...register("telefono")} />
      <Input label="Dirección (opcional)" error={errors.direccion?.message} {...register("direccion")} />
      <div style={{ position:"sticky", bottom:0, background:"#fff",
        borderTop:"1px solid #f0ead8", padding:"12px 0 16px", marginTop:"4px" }}>
        <Button type="submit" loading={isSubmitting} className="w-full">
          Registrar cliente
        </Button>
      </div>
    </form>
  );
}
