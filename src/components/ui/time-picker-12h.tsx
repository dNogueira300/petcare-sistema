"use client";

/**
 * Selector de hora en formato 12 h (AM/PM). El valor expuesto siempre es "HH:mm" (24 h).
 * Pensado para inputs internos donde queremos consistencia visual independiente del locale del navegador.
 */
interface TimePicker12hProps {
  value: string;                 // "HH:mm" 24 h
  onChange: (val: string) => void;
  disabled?: boolean;
  minuteStep?: number;           // default 15
  hourFrom?: number;             // 24 h, default 0
  hourTo?: number;               // 24 h, default 23
}

function parse24(value: string): { h: number; m: number } {
  if (!value) return { h: 8, m: 0 };
  const [hStr, mStr] = value.slice(0, 5).split(":");
  return { h: Number(hStr) || 0, m: Number(mStr) || 0 };
}

function toHHMM(h: number, m: number): string {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function TimePicker12h({
  value, onChange, disabled,
  minuteStep = 15,
  hourFrom = 0, hourTo = 23,
}: TimePicker12hProps) {
  const { h, m } = parse24(value);
  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;

  // Construir las horas 12 h permitidas a partir del rango 24 h
  const horas24Disponibles = new Set<number>();
  for (let i = hourFrom; i <= hourTo; i++) horas24Disponibles.add(i);

  const hoursAM: number[] = [];
  const hoursPM: number[] = [];
  for (const h24 of horas24Disponibles) {
    const h12 = ((h24 + 11) % 12) + 1;
    if (h24 < 12) { if (!hoursAM.includes(h12)) hoursAM.push(h12); }
    else { if (!hoursPM.includes(h12)) hoursPM.push(h12); }
  }
  hoursAM.sort((a, b) => (a === 12 ? -1 : b === 12 ? 1 : a - b));
  hoursPM.sort((a, b) => (a === 12 ? -1 : b === 12 ? 1 : a - b));

  const horasMostradas = period === "AM" ? hoursAM : hoursPM;

  const minutos: number[] = [];
  for (let i = 0; i < 60; i += minuteStep) minutos.push(i);

  const emit = (h12New: number, mNew: number, periodNew: "AM" | "PM") => {
    let h24 = h12New % 12;
    if (periodNew === "PM") h24 += 12;
    if (!horas24Disponibles.has(h24)) {
      // Si la combinación queda fuera de rango, redirige al primer válido del periodo
      const candidatos = periodNew === "AM" ? hoursAM : hoursPM;
      const primero = candidatos[0] ?? 8;
      h24 = primero % 12 + (periodNew === "PM" ? 12 : 0);
    }
    onChange(toHHMM(h24, mNew));
  };

  const selectCls = "h-9 rounded-lg border border-gray-300 px-2 text-sm focus:border-petcare-500 focus:outline-none bg-white";

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={hour12}
        disabled={disabled}
        onChange={(e) => emit(Number(e.target.value), m, period)}
        className={selectCls}
        aria-label="Hora"
      >
        {horasMostradas.map((hh) => (
          <option key={hh} value={hh}>{hh}</option>
        ))}
      </select>
      <span className="text-gray-400">:</span>
      <select
        value={m - (m % minuteStep)}
        disabled={disabled}
        onChange={(e) => emit(hour12, Number(e.target.value), period)}
        className={selectCls}
        aria-label="Minutos"
      >
        {minutos.map((mm) => (
          <option key={mm} value={mm}>{String(mm).padStart(2, "0")}</option>
        ))}
      </select>
      <select
        value={period}
        disabled={disabled}
        onChange={(e) => emit(hour12, m, e.target.value as "AM" | "PM")}
        className={selectCls}
        aria-label="AM/PM"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}
