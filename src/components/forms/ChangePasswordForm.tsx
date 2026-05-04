"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordStrength } from "@/components/ui/password-strength";
import { passwordSchema } from "@/utils/password";

const schema = z
  .object({
    contrasena: passwordSchema,
    confirmar: z.string().min(1, "Confirma la contraseña"),
  })
  .refine((d) => d.contrasena === d.confirmar, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar"],
  });

type FormData = z.infer<typeof schema>;

interface ChangePasswordFormProps {
  onSubmit: (contrasena: string) => Promise<void>;
}

const inputCls =
  "w-full h-10 rounded-[9px] border border-gray-200 px-3 text-sm focus:border-petcare-500 focus:outline-none focus:ring-2 focus:ring-petcare-100";

export function ChangePasswordForm({ onSubmit }: ChangePasswordFormProps) {
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const contrasenaValue = watch("contrasena") ?? "";

  const submit = async (data: FormData) => {
    await onSubmit(data.contrasena);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {/* Nueva contraseña */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Nueva contraseña
        </label>
        <div style={{ position: "relative" }}>
          <input
            type={showNew ? "text" : "password"}
            placeholder="••••••••"
            className={inputCls}
            style={{ paddingRight: "38px" }}
            {...register("contrasena")}
          />
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            tabIndex={-1}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#a89a80",
              display: "flex",
              padding: 0,
            }}
          >
            {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {errors.contrasena && (
          <p className="text-xs text-red-600">{errors.contrasena.message}</p>
        )}
        <PasswordStrength value={contrasenaValue} />
      </div>

      {/* Confirmar contraseña */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Confirmar contraseña
        </label>
        <div style={{ position: "relative" }}>
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="••••••••"
            className={inputCls}
            style={{ paddingRight: "38px" }}
            {...register("confirmar")}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            tabIndex={-1}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#a89a80",
              display: "flex",
              padding: 0,
            }}
          >
            {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {errors.confirmar && (
          <p className="text-xs text-red-600">{errors.confirmar.message}</p>
        )}
      </div>

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
          Cambiar contraseña
        </Button>
      </div>
    </form>
  );
}
