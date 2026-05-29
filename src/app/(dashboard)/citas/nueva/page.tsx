"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CitaForm } from "@/components/forms/CitaForm";
import { useToast } from "@/context/toast";

export default function NuevaCitaPage() {
  const router = useRouter();
  const toast  = useToast();

  const handleSubmit = async (data: Record<string, unknown>) => {
    const res = await fetch("/api/citas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast.success("Cita creada correctamente");
      router.push("/citas");
    } else {
      const json = await res.json();
      toast.error(json.error ?? "Error al crear la cita");
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link
          href="/citas"
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>Nueva cita</h1>
          <p className="text-sm text-gray-500">Agenda una consulta veterinaria</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <CitaForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
