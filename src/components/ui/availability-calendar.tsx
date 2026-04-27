"use client";

import { DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { hoyCimaFecha } from "@/utils/datetime";

interface AvailabilityCalendarProps {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
}

function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function AvailabilityCalendar({ selected, onSelect }: AvailabilityCalendarProps) {
  const today = parseLocalDate(hoyCimaFecha());

  const isSunday = (date: Date) => date.getDay() === 0;

  return (
    <div className="availability-calendar" style={{ display: "flex", justifyContent: "center" }}>
      <DayPicker
        locale={es}
        mode="single"
        selected={selected}
        onSelect={onSelect}
        disabled={[{ before: today }, isSunday]}
        modifiers={{ sunday: isSunday }}
        modifiersClassNames={{ sunday: "rdp-day--sunday" }}
        showOutsideDays={false}
      />
      <style>{`
        .availability-calendar .rdp-root {
          --rdp-accent-color: #3d845b;
          --rdp-accent-background-color: #f0fdf4;
          font-family: var(--font-dm-sans);
          font-size: 0.85rem;
        }
        .availability-calendar .rdp-day_button:hover:not([disabled]) {
          background: #dcfce7;
        }
        .availability-calendar .rdp-selected .rdp-day_button {
          background: #0a1a11 !important;
          color: #f2e8d5 !important;
          border-radius: 8px;
        }
        .availability-calendar .rdp-today .rdp-day_button {
          font-weight: 700;
          color: #3d845b;
        }
        .availability-calendar .rdp-day--sunday .rdp-day_button {
          color: #d1c4a8;
          text-decoration: line-through;
        }
        .availability-calendar .rdp-disabled .rdp-day_button {
          color: #d1c4a8 !important;
          cursor: not-allowed;
        }
        .availability-calendar .rdp-caption_label {
          font-family: var(--font-fraunces);
          font-style: italic;
          font-size: 0.95rem;
          color: #1a1208;
        }
        .availability-calendar .rdp-head_cell {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #8a7a60;
        }
      `}</style>
    </div>
  );
}
