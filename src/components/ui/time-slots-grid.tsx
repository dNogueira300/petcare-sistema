"use client";

import { useEffect, useState } from "react";

interface TimeSlotsGridProps {
  fecha: string;           // "YYYY-MM-DD"
  idVeterinario: number | string;
  selected: string;        // "HH:MM"
  onSelect: (hora: string) => void;
}

export function TimeSlotsGrid({ fecha, idVeterinario, selected, onSelect }: TimeSlotsGridProps) {
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!fecha || !idVeterinario) { setSlots([]); setLoaded(false); return; }
    setLoading(true);
    setLoaded(false);
    fetch(`/api/citas/slots?id_veterinario=${idVeterinario}&fecha=${fecha}`)
      .then((r) => r.json())
      .then((j) => setSlots(j.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => { setLoading(false); setLoaded(true); });
  }, [fecha, idVeterinario]);

  if (!fecha) return null;

  if (!idVeterinario) {
    return (
      <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.82rem", color: "#a89a80", padding: "10px 0" }}>
        Selecciona primero un veterinario.
      </p>
    );
  }

  if (loading) {
    return (
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", padding: "4px 0" }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{ width: "72px", height: "38px", borderRadius: "8px",
            background: "#f0ead8", animation: "pulse 1.4s ease-in-out infinite",
            animationDelay: `${i * 0.07}s` }} />
        ))}
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
      </div>
    );
  }

  if (loaded && slots.length === 0) {
    return (
      <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.82rem", color: "#dc2626", padding: "10px 0" }}>
        El veterinario no atiende este día o no quedan horarios disponibles. Elige otra fecha.
      </p>
    );
  }

  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.72rem", fontWeight: 700,
        letterSpacing: "0.08em", textTransform: "uppercase", color: "#8a7a60", marginBottom: "10px" }}>
        Horarios disponibles
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
        {slots.map((slot) => {
          const active = selected === slot;
          return (
            <button
              key={slot}
              type="button"
              onClick={() => onSelect(slot)}
              style={{
                width: "72px",
                height: "38px",
                borderRadius: "8px",
                border: active ? "2px solid #3d845b" : "1.5px solid #b8e4c9",
                background: active ? "#0a1a11" : "#f0fdf4",
                color: active ? "#f2e8d5" : "#1a6040",
                fontSize: "0.8rem",
                fontWeight: active ? 700 : 500,
                fontFamily: "var(--font-dm-sans)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {slot}
            </button>
          );
        })}
      </div>
    </div>
  );
}
