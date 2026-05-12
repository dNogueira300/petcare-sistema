"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/ui/loading";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/context/toast";
import { DIA_SEMANA_LABEL } from "@/types";

interface Franja { hora_inicio: string; hora_fin: string }
type Estado = Record<number, Franja[]>;

const DIAS = [1, 2, 3, 4, 5, 6, 7];

function vacio(): Estado {
  return DIAS.reduce((acc, d) => ({ ...acc, [d]: [] }), {} as Estado);
}

export default function HorariosVeterinarioPage() {
  const { id } = useParams<{ id: string }>();
  const idVet = Number(id);
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.rol === "administrador";

  const [estado, setEstado] = useState<Estado>(vacio());
  const [nombreVet, setNombreVet] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [hRes, vRes] = await Promise.all([
        fetch(`/api/horarios-veterinario?id_veterinario=${idVet}`).then((r) => r.json()).catch(() => ({})),
        fetch("/api/veterinarios").then((r) => r.json()).catch(() => ({})),
      ]);
      const next = vacio();
      for (const h of (hRes.data ?? []) as { dia_semana: number; hora_inicio: string; hora_fin: string }[]) {
        next[h.dia_semana].push({ hora_inicio: h.hora_inicio.slice(0, 5), hora_fin: h.hora_fin.slice(0, 5) });
      }
      setEstado(next);
      const vet = (vRes.data ?? []).find((v: { id_veterinario: number }) => v.id_veterinario === idVet);
      if (vet) setNombreVet(`${vet.usuarios.nombre} ${vet.usuarios.apellido}`);
      setLoading(false);
    })();
  }, [idVet]);

  const addFranja = (dia: number) =>
    setEstado((s) => ({ ...s, [dia]: [...s[dia], { hora_inicio: "08:00", hora_fin: "13:00" }] }));

  const removeFranja = (dia: number, idx: number) =>
    setEstado((s) => ({ ...s, [dia]: s[dia].filter((_, i) => i !== idx) }));

  const updateFranja = (dia: number, idx: number, campo: keyof Franja, valor: string) =>
    setEstado((s) => ({
      ...s,
      [dia]: s[dia].map((f, i) => (i === idx ? { ...f, [campo]: valor } : f)),
    }));

  const guardar = async () => {
    // Validación local
    for (const d of DIAS) {
      for (const f of estado[d]) {
        if (!f.hora_inicio || !f.hora_fin || f.hora_fin <= f.hora_inicio) {
          toast.error(`Revisa las franjas del ${DIA_SEMANA_LABEL[d]}: la hora fin debe ser mayor que la de inicio.`);
          return;
        }
      }
    }
    const horarios = DIAS.flatMap((d) =>
      estado[d].map((f) => ({ dia_semana: d, hora_inicio: f.hora_inicio, hora_fin: f.hora_fin })),
    );
    setSaving(true);
    const res = await fetch("/api/horarios-veterinario", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_veterinario: idVet, horarios }),
    });
    setSaving(false);
    if (res.ok) toast.success("Horarios actualizados");
    else {
      const j = await res.json().catch(() => ({}));
      toast.error(typeof j.error === "string" ? j.error : "No se pudieron guardar los horarios");
    }
  };

  if (loading) return <PageLoading />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/veterinarios" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Horarios semanales</h1>
          <p className="text-sm text-gray-500">{nombreVet || `Veterinario #${idVet}`} · un día sin franjas = día libre</p>
        </div>
        {isAdmin && (
          <div className="ml-auto">
            <Button onClick={guardar} loading={saving}>
              <Save className="size-4" /> Guardar cambios
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {DIAS.map((d) => {
          const franjas = estado[d];
          const libre = franjas.length === 0;
          return (
            <div key={d} className={`rounded-xl border p-4 ${libre ? "border-gray-200 bg-gray-50" : "border-petcare-200 bg-white"}`}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{DIA_SEMANA_LABEL[d]}</h3>
                {libre && <span className="text-xs text-gray-400">Libre</span>}
              </div>
              <div className="flex flex-col gap-2">
                {franjas.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <input
                      type="time"
                      value={f.hora_inicio}
                      disabled={!isAdmin}
                      onChange={(e) => updateFranja(d, idx, "hora_inicio", e.target.value)}
                      className="h-9 flex-1 rounded-lg border border-gray-300 px-2 text-sm focus:border-petcare-500 focus:outline-none"
                    />
                    <span className="text-gray-400">–</span>
                    <input
                      type="time"
                      value={f.hora_fin}
                      disabled={!isAdmin}
                      onChange={(e) => updateFranja(d, idx, "hora_fin", e.target.value)}
                      className="h-9 flex-1 rounded-lg border border-gray-300 px-2 text-sm focus:border-petcare-500 focus:outline-none"
                    />
                    {isAdmin && (
                      <button
                        onClick={() => removeFranja(d, idx)}
                        title="Eliminar franja"
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                ))}
                {isAdmin && (
                  <button
                    onClick={() => addFranja(d)}
                    className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-1.5 text-xs font-medium text-gray-500 hover:border-petcare-300 hover:text-petcare-600 transition-colors"
                  >
                    <Plus className="size-3.5" /> Añadir franja
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
