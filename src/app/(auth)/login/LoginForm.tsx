"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  correo: z.string().email("Correo inválido"),
  contrasena: z.string().min(8, "Mínimo 8 caracteres"),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError(null);
    const err = await login(data.correo, data.contrasena);
    if (err) {
      setError(err);
      return;
    }
    const next = params.get("next") ?? "/dashboard";
    router.push(next);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel — form */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-6 py-12 md:w-1/2 lg:px-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <Image
              src="/logo/logo_h.png"
              alt="PetCare"
              width={160}
              height={44}
              className="object-contain"
              priority
            />
          </div>

          <h1 className="mb-2 text-2xl font-bold text-gray-900">Bienvenido</h1>
          <p className="mb-8 text-sm text-gray-500">
            Ingresa tus credenciales para continuar
          </p>

          {error && (
            <Alert
              variant="error"
              message={error}
              onClose={() => setError(null)}
              className="mb-5"
            />
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="correo@ejemplo.com"
              autoComplete="email"
              error={errors.correo?.message}
              {...register("correo")}
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.contrasena?.message}
              {...register("contrasena")}
            />
            <Button
              type="submit"
              size="lg"
              loading={isSubmitting}
              className="mt-2 w-full"
            >
              Iniciar sesión
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            Sistema de Gestión Veterinaria PetCare · UNAP 2026-I
          </p>
        </div>
      </div>

      {/* Right panel — brand */}
      <div className="hidden flex-col items-center justify-center bg-petcare-600 md:flex md:w-1/2">
        <Image
          src="/logo/logo_c.png"
          alt="PetCare"
          width={200}
          height={200}
          className="object-contain drop-shadow-lg"
        />
        <h2 className="mt-6 text-3xl font-bold text-white">PetCare</h2>
        <p className="mt-2 text-petcare-100">Gestión de citas veterinarias</p>
      </div>
    </div>
  );
}
