"use client";

import { Check, X } from "lucide-react";

const RULES = [
  { label: "Mínimo 8 caracteres",       test: (v: string) => v.length >= 8 },
  { label: "Una letra mayúscula (A–Z)",  test: (v: string) => /[A-Z]/.test(v) },
  { label: "Una letra minúscula (a–z)",  test: (v: string) => /[a-z]/.test(v) },
  { label: "Un número (0–9)",            test: (v: string) => /[0-9]/.test(v) },
  { label: "Un símbolo (!@#$%...)",      test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

interface Props { value: string }

export function PasswordStrength({ value }: Props) {
  if (!value) return null;
  const passed = RULES.filter((r) => r.test(value)).length;
  const pct = (passed / RULES.length) * 100;

  const barColor =
    passed <= 1 ? "#ef4444" :
    passed <= 2 ? "#f97316" :
    passed <= 3 ? "#eab308" :
    passed <= 4 ? "#84cc16" :
                  "#22c55e";

  return (
    <div style={{ marginTop: "8px" }}>
      {/* Barra de fortaleza */}
      <div style={{ height: "4px", background: "#e8e0d0", borderRadius: "99px", marginBottom: "8px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: barColor,
          borderRadius: "99px", transition: "width 0.3s ease, background 0.3s ease" }} />
      </div>

      {/* Requisitos */}
      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
        {RULES.map(({ label, test }) => {
          const ok = test(value);
          return (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              {ok
                ? <Check size={11} strokeWidth={3} color="#22c55e" />
                : <X     size={11} strokeWidth={3} color="#dc2626" />
              }
              <span style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "0.68rem",
                color: ok ? "#15803d" : "#b91c1c",
                transition: "color 0.2s",
              }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
