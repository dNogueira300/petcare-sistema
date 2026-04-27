"use client";

import { useState, useEffect, useRef } from "react";
import { LogOut, Bell, ChevronLeft, ChevronRight, X, CalendarDays } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatLima } from "@/utils/datetime";
import type { EstadoCita } from "@/types";

interface NavbarProps {
  onMenuToggle?: () => void;
  collapsed?: boolean;
  onCollapse?: (v: boolean) => void;
}

interface CitaNotif {
  id_cita: number;
  fecha: string;
  hora: string;
  motivo: string;
  estado: EstadoCita;
  mascotas: { nombre: string; especie: string } | null;
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ").filter(Boolean);
  const init =
    parts.length >= 2 ? parts[0][0] + parts[1][0] : (parts[0]?.[0] ?? "U");
  const colors = ["#c48c34", "#3d845b", "#8a5a9a", "#2e6fa8", "#a85050"];
  const hue = (name.charCodeAt(0) ?? 0) % colors.length;
  return (
    <span
      title={name}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: "32px", height: "32px", borderRadius: "50%",
        background: colors[hue] + "28", border: `1.5px solid ${colors[hue]}60`,
        fontSize: "0.7rem", fontWeight: 700, color: colors[hue],
        letterSpacing: "0.04em", fontFamily: "var(--font-dm-sans)", flexShrink: 0,
      }}
    >
      {init.toUpperCase()}
    </span>
  );
}

function LogoutDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(6,18,9,0.72)",
        backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
        justifyContent: "center", padding: "16px" }}
      onClick={onCancel}
    >
      <div
        style={{ width: "100%", maxWidth: "380px", background: "var(--card-bg)",
          borderRadius: "20px", overflow: "hidden",
          boxShadow: "0 32px 80px rgba(6,18,9,0.35), 0 0 0 1px var(--card-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ background: "linear-gradient(135deg,#0a1a11,#0f2318)", padding: "22px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "11px",
              background: "rgba(196,140,52,0.18)", border: "1px solid rgba(196,140,52,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <LogOut size={18} color="#c48c34" />
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-fraunces)", fontSize: "1.05rem",
                fontWeight: 700, fontStyle: "italic", color: "#fff", margin: 0 }}>Cerrar sesión</p>
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.72rem",
                color: "rgba(255,255,255,0.4)", margin: 0 }}>PetCare · Sistema veterinario</p>
            </div>
          </div>
          <button onClick={onCancel}
            style={{ background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer",
              width: "30px", height: "30px", borderRadius: "8px", display: "flex",
              alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)" }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: "24px" }}>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.9rem", color: "#4a3d2e",
            lineHeight: 1.65, margin: "0 0 24px" }}>
            Tu sesión se cerrará y serás redirigido a la página de inicio de sesión.
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={onCancel}
              style={{ flex: 1, height: "42px", borderRadius: "10px",
                border: "1.5px solid var(--card-border)", background: "var(--input-bg)",
                color: "#4a3d2e", fontSize: "0.88rem", fontWeight: 600,
                fontFamily: "var(--font-dm-sans)", cursor: "pointer" }}>
              Cancelar
            </button>
            <button onClick={onConfirm}
              style={{ flex: 1, height: "42px", borderRadius: "10px", border: "none",
                background: "linear-gradient(135deg,#0a1a11,#162e20)", color: "#fff",
                fontSize: "0.88rem", fontWeight: 600, fontFamily: "var(--font-dm-sans)",
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: "6px" }}>
              <LogOut size={14} /> Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const rolLabels: Record<string, string> = {
  administrador: "Administrador",
  veterinario: "Veterinario",
  recepcionista: "Recepcionista",
  cliente: "Cliente",
};

export function Navbar({ onMenuToggle, collapsed = false, onCollapse }: NavbarProps) {
  const { user, logout } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifs, setNotifs] = useState<CitaNotif[]>([]);
  const bellRef = useRef<HTMLDivElement>(null);
  const fullName = user ? `${user.nombre} ${user.apellido}` : "";

  const canSeeNotifs = user?.rol === "administrador" || user?.rol === "recepcionista";

  useEffect(() => {
    if (!canSeeNotifs) return;
    fetch("/api/citas?origen=portal&estado=pendiente")
      .then((r) => r.json())
      .then((j) => setNotifs(j.data ?? []))
      .catch(() => {});
  }, [canSeeNotifs]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [bellOpen]);

  return (
    <>
      <header
        style={{ height: "56px", display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "0 20px", background: "#ffffff",
          borderBottom: "1px solid var(--card-border)", flexShrink: 0,
          position: "sticky", top: 0, zIndex: 30 }}
      >
        {/* Sidebar toggle */}
        <button
          onClick={() => {
            if (window.innerWidth < 768) onMenuToggle?.();
            else onCollapse?.(!collapsed);
          }}
          title={collapsed ? "Expandir menú" : "Colapsar menú"}
          style={{ padding: "6px", borderRadius: "7px", border: "1px solid #e5e7eb",
            background: "#f9fafb", color: "#6b7280", cursor: "pointer",
            transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center" }}
          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "#f3f4f6"; b.style.borderColor = "#d1d5db"; b.style.color = "#374151"; }}
          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "#f9fafb"; b.style.borderColor = "#e5e7eb"; b.style.color = "#6b7280"; }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>

          {/* Bell */}
          <div ref={bellRef} style={{ position: "relative" }}>
            <button
              onClick={() => canSeeNotifs && setBellOpen((v) => !v)}
              title={canSeeNotifs ? "Notificaciones" : undefined}
              style={{ padding: "7px", borderRadius: "8px", border: "none",
                background: bellOpen ? "var(--card-border)" : "transparent",
                color: notifs.length > 0 ? "#c48c34" : "#a89a80",
                cursor: canSeeNotifs ? "pointer" : "default",
                display: "flex", alignItems: "center", transition: "background 0.15s",
                position: "relative" }}
              onMouseEnter={(e) => { if (canSeeNotifs) (e.currentTarget as HTMLButtonElement).style.background = "var(--card-border)"; }}
              onMouseLeave={(e) => { if (!bellOpen) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <Bell size={15} />
              {canSeeNotifs && notifs.length > 0 && (
                <span style={{ position: "absolute", top: "4px", right: "4px",
                  width: "8px", height: "8px", borderRadius: "50%",
                  background: "#c48c34", border: "1.5px solid #fff" }} />
              )}
            </button>

            {/* Dropdown */}
            {bellOpen && canSeeNotifs && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0,
                width: "320px", background: "#fff", borderRadius: "14px",
                border: "1px solid var(--card-border)",
                boxShadow: "0 12px 40px rgba(26,18,8,0.14)", zIndex: 500,
                overflow: "hidden" }}>
                {/* Header */}
                <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--card-border)",
                  display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Bell size={13} color="#c48c34" />
                    <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.82rem",
                      fontWeight: 700, color: "#1a1208" }}>
                      Citas nuevas del portal
                    </span>
                    {notifs.length > 0 && (
                      <span style={{ background: "#fdf3dc", color: "#a07028", fontSize: "0.65rem",
                        fontWeight: 700, padding: "2px 7px", borderRadius: "99px",
                        border: "1px solid #f0d080", fontFamily: "var(--font-dm-sans)" }}>
                        {notifs.length}
                      </span>
                    )}
                  </div>
                  <button onClick={() => setBellOpen(false)}
                    style={{ background: "none", border: "none", cursor: "pointer",
                      color: "#a89a80", display: "flex", padding: "2px" }}>
                    <X size={13} />
                  </button>
                </div>

                {/* Items */}
                <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                  {notifs.length === 0 ? (
                    <div style={{ padding: "24px 16px", textAlign: "center",
                      fontFamily: "var(--font-dm-sans)", fontSize: "0.82rem", color: "#a89a80" }}>
                      Sin citas nuevas pendientes
                    </div>
                  ) : notifs.map((n) => (
                    <div key={n.id_cita}
                      style={{ padding: "12px 16px", borderBottom: "1px solid #f5f0e8",
                        display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <div style={{ width: "34px", height: "34px", borderRadius: "9px", flexShrink: 0,
                        background: "linear-gradient(135deg,#fdf3dc,#fce8b0)",
                        display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <CalendarDays size={15} color="#c48c34" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.82rem",
                          fontWeight: 600, color: "#1a1208", margin: 0,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {n.mascotas?.nombre ?? "Mascota"} — {n.motivo}
                        </p>
                        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.75rem",
                          color: "#8a7a60", margin: "2px 0 0" }}>
                          {formatLima(`${n.fecha}T00:00:00`, "dd/MM/yyyy")} · {n.hora.slice(0, 5)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {notifs.length > 0 && (
                  <div style={{ padding: "10px 16px", borderTop: "1px solid #f5f0e8" }}>
                    <a href="/citas" style={{ fontFamily: "var(--font-dm-sans)", fontSize: "0.78rem",
                      fontWeight: 600, color: "#3d845b", textDecoration: "none" }}>
                      Ver todas en Citas →
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ width: "1px", height: "20px", background: "var(--card-border)", margin: "0 4px" }} />

          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <Initials name={fullName || "Usuario"} />
            <div className="hidden sm:block">
              <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1a1208",
                lineHeight: 1.2, fontFamily: "var(--font-dm-sans)", margin: 0 }}>
                {fullName || "—"}
              </p>
              <p style={{ fontSize: "0.68rem", color: "#a89a80",
                fontFamily: "var(--font-dm-sans)", margin: 0 }}>
                {user ? rolLabels[user.rol] : ""}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowDialog(true)}
            title="Cerrar sesión"
            style={{ padding: "7px", borderRadius: "8px", border: "none", background: "transparent",
              color: "#a89a80", cursor: "pointer", display: "flex", alignItems: "center",
              transition: "background 0.15s, color 0.15s", marginLeft: "2px" }}
            onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "#fff0f0"; b.style.color = "#dc2626"; }}
            onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "transparent"; b.style.color = "#a89a80"; }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {showDialog && (
        <LogoutDialog
          onConfirm={() => { setShowDialog(false); logout(); }}
          onCancel={() => setShowDialog(false)}
        />
      )}
    </>
  );
}
