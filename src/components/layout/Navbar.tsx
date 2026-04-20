"use client";

import { LogOut, Menu, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface NavbarProps {
  onMenuToggle?: () => void;
}

function Initials({ name }: { name: string }) {
  const parts  = name.trim().split(" ").filter(Boolean);
  const init   = parts.length >= 2
    ? parts[0][0] + parts[1][0]
    : (parts[0]?.[0] ?? "U");
  const colors = ["#c48c34", "#3d845b", "#8a5a9a", "#2e6fa8", "#a85050"];
  const hue    = (name.charCodeAt(0) ?? 0) % colors.length;
  return (
    <span
      title={name}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        background: colors[hue] + "28",
        border: `1.5px solid ${colors[hue]}60`,
        fontSize: "0.7rem",
        fontWeight: 700,
        color: colors[hue],
        letterSpacing: "0.04em",
        fontFamily: "var(--font-dm-sans)",
        flexShrink: 0,
      }}
    >
      {init.toUpperCase()}
    </span>
  );
}

const rolLabels: Record<string, string> = {
  administrador: "Administrador",
  veterinario:   "Veterinario",
  recepcionista: "Recepcionista",
  cliente:       "Cliente",
};

export function Navbar({ onMenuToggle }: NavbarProps) {
  const { user, logout } = useAuth();
  const fullName = user ? `${user.nombre} ${user.apellido}` : "";

  return (
    <header
      style={{
        height: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        background: "#ffffff",
        borderBottom: "1px solid var(--card-border)",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          onClick={onMenuToggle}
          className="md:hidden"
          style={{
            padding: "6px",
            borderRadius: "7px",
            border: "none",
            background: "transparent",
            color: "#6b5c44",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Menu size={18} />
        </button>

        {/* Breadcrumb slot — intentionally minimal */}
        <div
          style={{
            width: "1px",
            height: "20px",
            background: "var(--card-border)",
            display: "none",
          }}
          className="md:block"
        />
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {/* Notification bell — decorative */}
        <button
          style={{
            padding: "7px",
            borderRadius: "8px",
            border: "none",
            background: "transparent",
            color: "#a89a80",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--card-border)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
        >
          <Bell size={15} />
        </button>

        {/* Divider */}
        <div style={{ width: "1px", height: "20px", background: "var(--card-border)", margin: "0 4px" }} />

        {/* User info */}
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <Initials name={fullName || "Usuario"} />
          <div className="hidden sm:block">
            <p
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#1a1208",
                lineHeight: 1.2,
                fontFamily: "var(--font-dm-sans)",
                margin: 0,
              }}
            >
              {fullName || "—"}
            </p>
            <p
              style={{
                fontSize: "0.68rem",
                color: "#a89a80",
                fontFamily: "var(--font-dm-sans)",
                margin: 0,
              }}
            >
              {user ? rolLabels[user.rol] : ""}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          title="Cerrar sesión"
          style={{
            padding: "7px",
            borderRadius: "8px",
            border: "none",
            background: "transparent",
            color: "#a89a80",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            transition: "background 0.15s, color 0.15s",
            marginLeft: "2px",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#fff0f0";
            (e.currentTarget as HTMLButtonElement).style.color = "#dc2626";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "#a89a80";
          }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
