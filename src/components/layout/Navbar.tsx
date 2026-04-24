"use client";

import { useState } from "react";
import { LogOut, Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface NavbarProps {
  onMenuToggle?: () => void;
  collapsed?: boolean;
  onCollapse?: (v: boolean) => void;
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

function LogoutDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(10, 26, 17, 0.55)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        animation: "fadeUp 0.2s cubic-bezier(0.16,1,0.3,1) both",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)",
          borderRadius: "16px",
          padding: "32px",
          boxShadow:
            "0 25px 50px -12px rgba(10, 26, 17, 0.25), 0 0 1px rgba(10, 26, 17, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
          maxWidth: "360px",
          width: "100%",
          animation: "fadeUp 0.25s cubic-bezier(0.16,1,0.3,1) both",
          border: "1px solid rgba(255, 255, 255, 0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)",
            border: "2px solid #fee2e2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
            boxShadow: "0 8px 16px rgba(220, 38, 38, 0.15)",
          }}
        >
          <LogOut
            style={{
              width: "28px",
              height: "28px",
              color: "#dc2626",
              strokeWidth: 2,
            }}
          />
        </div>
        <h3
          style={{
            fontFamily: "var(--font-fraunces)",
            fontSize: "1.3rem",
            fontWeight: 700,
            color: "#0a1a11",
            margin: "0 0 8px",
            letterSpacing: "-0.02em",
          }}
        >
          Cerrar sesión
        </h3>
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "0.9rem",
            color: "#6b7280",
            margin: "0 0 28px",
            lineHeight: 1.6,
          }}
        >
          Se cerrará tu sesión y volverás a la página de inicio de sesión.
        </p>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              height: "44px",
              borderRadius: "10px",
              border: "1.5px solid #e5e7eb",
              background: "#f9fafb",
              color: "#374151",
              fontSize: "0.9rem",
              fontWeight: 600,
              fontFamily: "var(--font-dm-sans)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "#f3f4f6";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "#d1d5db";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "#f9fafb";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "#e5e7eb";
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              height: "44px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
              color: "#fff",
              fontSize: "0.9rem",
              fontWeight: 600,
              fontFamily: "var(--font-dm-sans)",
              cursor: "pointer",
              transition: "all 0.15s ease",
              boxShadow: "0 4px 12px rgba(220, 38, 38, 0.2)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 6px 16px rgba(220, 38, 38, 0.3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 4px 12px rgba(220, 38, 38, 0.2)";
            }}
          >
            Cerrar sesión
          </button>
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

export function Navbar({
  onMenuToggle,
  collapsed = false,
  onCollapse,
}: NavbarProps) {
  const { user, logout } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const fullName = user ? `${user.nombre} ${user.apellido}` : "";

  return (
    <>
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
        {/* Single toggle button — opens mobile sidebar or collapses desktop sidebar */}
        <button
          onClick={() => {
            if (window.innerWidth < 768) {
              onMenuToggle?.();
            } else {
              onCollapse?.(!collapsed);
            }
          }}
          title={collapsed ? "Expandir menú" : "Colapsar menú"}
          style={{
            padding: "6px",
            borderRadius: "7px",
            border: "1px solid #e5e7eb",
            background: "#f9fafb",
            color: "#6b7280",
            cursor: "pointer",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#d1d5db";
            (e.currentTarget as HTMLButtonElement).style.color = "#374151";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#f9fafb";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb";
            (e.currentTarget as HTMLButtonElement).style.color = "#6b7280";
          }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
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
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                "var(--card-border)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                "transparent")
            }
          >
            <Bell size={15} />
          </button>

          <div
            style={{
              width: "1px",
              height: "20px",
              background: "var(--card-border)",
              margin: "0 4px",
            }}
          />

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

          <button
            onClick={() => setShowDialog(true)}
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
              (e.currentTarget as HTMLButtonElement).style.background =
                "#fff0f0";
              (e.currentTarget as HTMLButtonElement).style.color = "#dc2626";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "#a89a80";
            }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {showDialog && (
        <LogoutDialog
          onConfirm={() => {
            setShowDialog(false);
            logout();
          }}
          onCancel={() => setShowDialog(false)}
        />
      )}
    </>
  );
}
