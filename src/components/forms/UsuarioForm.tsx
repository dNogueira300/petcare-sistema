"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PasswordStrength } from "@/components/ui/password-strength";
import { TimePicker12h } from "@/components/ui/time-picker-12h";
import { passwordSchema, PASSWORD_HINT } from "@/utils/password";
import { DIA_SEMANA_LABEL } from "@/types";

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

export interface Franja { hora_inicio: string; hora_fin: string }
export type HorariosEstado = Record<number, Franja[]>;
export interface UsuarioFormSubmitData {
  nombre: string;
  apellido: string;
  correo: string;
  rol: "administrador" | "veterinario" | "recepcionista";
  especialidad?: string;
  contrasena?: string;
  horarios?: { dia_semana: number; hora_inicio: string; hora_fin: string }[];
}

interface UsuarioFormProps {
  defaultValues?: Partial<CreateData>;
  /** Horarios actuales del veterinario (al editar). Sólo se usa si rol=veterinario. */
  defaultHorarios?: HorariosEstado;
  onSubmit: (data: UsuarioFormSubmitData) => Promise<void>;
  isEdit?: boolean;
}

const rolOptions = [
  { value: "administrador", label: "Administrador" },
  { value: "veterinario", label: "Veterinario" },
  { value: "recepcionista", label: "Recepcionista" },
];

const DIAS = [1, 2, 3, 4, 5, 6, 7];

function emptyHorarios(): HorariosEstado {
  return DIAS.reduce((acc, d) => ({ ...acc, [d]: [] }), {} as HorariosEstado);
}

export function UsuarioForm({
  defaultValues,
  defaultHorarios,
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

  const [horarios, setHorarios] = useState<HorariosEstado>(defaultHorarios ?? emptyHorarios());
  const [horariosError, setHorariosError] = useState<string | null>(null);
  // Patrón "previous prop": si cambia defaultHorarios (p.ej. al abrir el modal para otro vet),
  // re-sincronizamos el estado en render — sin useEffect, evitando cascading renders.
  const [prevDefaultHorarios, setPrevDefaultHorarios] = useState(defaultHorarios);
  if (prevDefaultHorarios !== defaultHorarios) {
    setPrevDefaultHorarios(defaultHorarios);
    setHorarios(defaultHorarios ?? emptyHorarios());
  }

  const addFranja = (dia: number) =>
    setHorarios((s) => ({ ...s, [dia]: [...s[dia], { hora_inicio: "08:00", hora_fin: "13:00" }] }));

  const removeFranja = (dia: number, idx: number) =>
    setHorarios((s) => ({ ...s, [dia]: s[dia].filter((_, i) => i !== idx) }));

  const updateFranja = (dia: number, idx: number, campo: keyof Franja, valor: string) =>
    setHorarios((s) => ({
      ...s,
      [dia]: s[dia].map((f, i) => (i === idx ? { ...f, [campo]: valor } : f)),
    }));

  const submit = async (data: CreateData | EditData) => {
    setHorariosError(null);
    const out: UsuarioFormSubmitData = {
      nombre: data.nombre,
      apellido: data.apellido,
      correo: data.correo,
      rol: data.rol,
      especialidad: data.especialidad,
    };
    if ("contrasena" in data && data.contrasena) {
      out.contrasena = data.contrasena;
    }
    if (data.rol === "veterinario") {
      // Validar franjas
      for (const d of DIAS) {
        for (const f of horarios[d]) {
          if (!f.hora_inicio || !f.hora_fin || f.hora_fin <= f.hora_inicio) {
            setHorariosError(`Revisa las franjas del ${DIA_SEMANA_LABEL[d]}: la hora fin debe ser mayor que la de inicio.`);
            return;
          }
        }
      }
      out.horarios = DIAS.flatMap((d) =>
        horarios[d].map((f) => ({ dia_semana: d, hora_inicio: f.hora_inicio, hora_fin: f.hora_fin })),
      );
    }
    await onSubmit(out);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
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
        <>
          <Input
            label="Especialidad (opcional)"
            placeholder="Ej: Cirugía, Dermatología…"
            error={e.especialidad?.message}
            {...register("especialidad")}
          />

          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">Horario de atención</p>
            <p className="text-xs text-gray-500 mb-3">Un día sin franjas se considera libre.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {DIAS.map((d) => {
                const franjas = horarios[d];
                const libre = franjas.length === 0;
                return (
                  <div key={d} className={`rounded-lg border p-3 ${libre ? "border-gray-200 bg-white/60" : "border-petcare-200 bg-white"}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-900">{DIA_SEMANA_LABEL[d]}</h4>
                      {libre && <span className="text-[10px] uppercase tracking-wide text-gray-400">Libre</span>}
                    </div>
                    <div className="flex flex-col gap-2">
                      {franjas.map((f, idx) => (
                        <div key={idx} className="flex flex-col gap-1.5 rounded-md border border-gray-200 bg-white/80 p-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Inicio</span>
                            <button
                              type="button"
                              onClick={() => removeFranja(d, idx)}
                              title="Eliminar franja"
                              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                          <TimePicker12h
                            value={f.hora_inicio}
                            onChange={(v) => updateFranja(d, idx, "hora_inicio", v)}
                          />
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Fin</span>
                          <TimePicker12h
                            value={f.hora_fin}
                            onChange={(v) => updateFranja(d, idx, "hora_fin", v)}
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addFranja(d)}
                        className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-dashed border-gray-300 py-1.5 text-xs font-medium text-gray-500 hover:border-petcare-300 hover:text-petcare-600 transition-colors"
                      >
                        <Plus className="size-3.5" /> Añadir franja
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {horariosError && (
              <p className="mt-3 text-xs text-red-600" role="alert">{horariosError}</p>
            )}
          </div>
        </>
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
