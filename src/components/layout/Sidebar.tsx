"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  PawPrint,
  FileText,
  UserCog,
  BarChart2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { canAccess } from "@/lib/rbac";
import type { Rol } from "@/types";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  module: string;
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    module: "dashboard",
  },
  { href: "/citas", icon: CalendarDays, label: "Citas", module: "citas" },
  { href: "/clientes", icon: Users, label: "Clientes", module: "clientes" },
  { href: "/mascotas", icon: PawPrint, label: "Mascotas", module: "mascotas" },
  {
    href: "/historia-clinica",
    icon: FileText,
    label: "Historia Clínica",
    module: "historia-clinica",
  },
  { href: "/usuarios", icon: UserCog, label: "Usuarios", module: "usuarios" },
  { href: "/reportes", icon: BarChart2, label: "Reportes", module: "reportes" },
];

interface SidebarProps {
  mobileOpen: boolean;
  collapsed: boolean;
  onMobileClose: () => void;
  onCollapse: (v: boolean) => void;
}

const rolLabels: Record<string, string> = {
  administrador: "Administrador",
  veterinario: "Veterinario",
  recepcionista: "Recepcionista",
  cliente: "Cliente",
};

export function Sidebar({
  mobileOpen,
  collapsed,
  onMobileClose,
  onCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const rol = user?.rol as Rol | undefined;
  const visible = navItems.filter(
    (item) => !rol || canAccess(rol, item.module),
  );

  const [citasNuevasPortal, setCitasNuevasPortal] = useState(0);

  useEffect(() => {
    if (!rol || rol === "cliente" || rol === "veterinario") return;
    fetch("/api/citas?origen=portal&estado=pendiente")
      .then((r) => r.json())
      .then((j) => setCitasNuevasPortal((j.data ?? []).length))
      .catch(() => {});
  }, [rol]);

  const W = collapsed ? 64 : 230;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/*
        The sidebar is always position:fixed.
        On desktop (md+), the <style> overrides ONLY the transform (not position),
        so it's always visible. The spacer div below provides layout space.
      */}
      <aside
        className="noise"
        data-sidebar
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          width: `${W}px`,
          transition:
            "width 0.25s cubic-bezier(0.16,1,0.3,1), transform 0.3s cubic-bezier(0.16,1,0.3,1)",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          background: "linear-gradient(180deg, #0a1a11 0%, #070e09 100%)",
          overflow: "hidden",
        }}
      >
        {/* On md+ always show sidebar regardless of mobileOpen.
            Only override transform — keep position:fixed so spacer handles layout space. */}
        <style>{`
          @media (min-width: 768px) {
            aside[data-sidebar] { transform: translateX(0) !important; }
          }
        `}</style>

        {/* Top glow */}
        <div
          style={{
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 80% 50% at 50% -5%, rgba(61,132,91,0.20) 0%, transparent 70%)",
          }}
        />

        {/* Logo row — centered */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: collapsed ? "18px 0" : "16px 0",
            flexShrink: 0,
          }}
        >
          {!collapsed && (
            <Image
              src="/logo/logo_h.png"
              alt="PetCare"
              width={110}
              height={30}
              className="object-contain"
              style={{ filter: "brightness(0) invert(1)", opacity: 0.9, height: "auto" }}
              priority
            />
          )}
          {collapsed && (
            <Image
              src="/logo/logo_c.png"
              alt="PetCare"
              width={28}
              height={28}
              className="object-contain"
              style={{ filter: "brightness(0) invert(1)", opacity: 0.9 }}
              priority
            />
          )}
        </div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "rgba(255,255,255,0.07)",
            marginInline: collapsed ? "12px" : "16px",
            flexShrink: 0,
          }}
        />

        {/* Role label */}
        {user && !collapsed && (
          <p
            style={{
              position: "relative",
              zIndex: 10,
              fontSize: "0.63rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#3d845b",
              fontFamily: "var(--font-dm-sans)",
              paddingTop: "10px",
              paddingBottom: "4px",
              paddingLeft: "18px",
              paddingRight: "18px",
              flexShrink: 0,
            }}
          >
            {rolLabels[user.rol] ?? user.rol}
          </p>
        )}
        {user && collapsed && <div style={{ height: "14px", flexShrink: 0 }} />}

        {/* Nav */}
        <nav
          style={{
            position: "relative",
            zIndex: 10,
            flex: 1,
            overflowY: "auto",
            paddingTop: 0,
            paddingLeft: collapsed ? "8px" : "10px",
            paddingRight: collapsed ? "8px" : "10px",
            paddingBottom: "8px",
          }}
        >
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            {visible.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onMobileClose}
                    title={collapsed ? item.label : undefined}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: collapsed ? 0 : "10px",
                      justifyContent: collapsed ? "center" : "flex-start",
                      padding: collapsed ? "10px" : "9px 10px",
                      borderRadius: "8px",
                      fontSize: "0.82rem",
                      fontWeight: isActive ? 600 : 400,
                      fontFamily: "var(--font-dm-sans)",
                      transition: "background 0.15s, color 0.15s",
                      background: isActive
                        ? "rgba(61,132,91,0.22)"
                        : "transparent",
                      color: isActive ? "#a8e8c0" : "rgba(255,255,255,0.55)",
                      borderLeft: collapsed
                        ? "none"
                        : isActive
                          ? "2px solid #3d845b"
                          : "2px solid transparent",
                      marginLeft: collapsed ? 0 : "2px",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (
                          e.currentTarget as HTMLAnchorElement
                        ).style.background = "rgba(255,255,255,0.07)";
                        (e.currentTarget as HTMLAnchorElement).style.color =
                          "rgba(255,255,255,0.85)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (
                          e.currentTarget as HTMLAnchorElement
                        ).style.background = "transparent";
                        (e.currentTarget as HTMLAnchorElement).style.color =
                          "rgba(255,255,255,0.55)";
                      }
                    }}
                  >
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <Icon
                        style={{
                          width: "16px",
                          height: "16px",
                          color: isActive ? "#55a876" : "rgba(255,255,255,0.45)",
                        }}
                      />
                      {item.module === "citas" && citasNuevasPortal > 0 && (
                        <span style={{
                          position: "absolute", top: "-5px", right: "-6px",
                          background: "#c48c34", color: "#fff", borderRadius: "99px",
                          fontSize: "0.58rem", fontWeight: 700, lineHeight: 1,
                          padding: "2px 4px", minWidth: "14px", textAlign: "center",
                          fontFamily: "var(--font-dm-sans)",
                        }}>
                          {citasNuevasPortal > 9 ? "9+" : citasNuevasPortal}
                        </span>
                      )}
                    </div>
                    {!collapsed && (
                      <span
                        className="nav-label"
                        style={{ opacity: 1, maxWidth: "180px" }}
                      >
                        {item.label}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "rgba(255,255,255,0.07)",
            marginInline: collapsed ? "12px" : "16px",
            flexShrink: 0,
          }}
        />
      </aside>

      {/* Spacer — takes up sidebar width in layout on desktop (sidebar is fixed, not in flow) */}
      <div
        className="hidden md:block"
        style={{
          width: `${W}px`,
          flexShrink: 0,
          transition: "width 0.25s cubic-bezier(0.16,1,0.3,1)",
        }}
      />
    </>
  );
}
