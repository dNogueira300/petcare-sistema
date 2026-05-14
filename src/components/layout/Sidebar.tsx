"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  PawPrint,
  Users2,
  BarChart2,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { canAccess } from "@/lib/rbac";
import type { Rol } from "@/types";

interface NavChild {
  href: string;
  label: string;
  module: string;
}

interface NavItem {
  href?: string;
  icon: React.ElementType;
  label: string;
  module?: string; // si tiene página propia
  children?: NavChild[]; // sub-rutas
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    module: "dashboard",
  },
  { href: "/citas", icon: CalendarDays, label: "Citas", module: "citas" },
  {
    href: "/mascotas",
    icon: PawPrint,
    label: "Mascotas",
    module: "mascotas",
    children: [
      {
        href: "/historia-clinica",
        label: "Historia clínica",
        module: "historia-clinica",
      },
    ],
  },
  {
    icon: Users2,
    label: "Usuario",
    children: [
      { href: "/clientes", label: "Clientes", module: "clientes" },
      { href: "/usuarios", label: "Veterinarios", module: "usuarios" },
    ],
  },
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

function isPathActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar({
  mobileOpen,
  collapsed,
  onMobileClose,
  // onCollapse — reservado para uso futuro desde el sidebar
}: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const rol = user?.rol as Rol | undefined;

  // Filtrar items y children según permisos
  const visible: NavItem[] = useMemo(() => {
    const out: NavItem[] = [];
    for (const item of navItems) {
      const children = item.children?.filter(
        (c) => !rol || canAccess(rol, c.module),
      );
      const parentVisible = item.module
        ? !rol || canAccess(rol, item.module)
        : false;
      const hasVisibleChildren = !!children && children.length > 0;
      if (!parentVisible && !hasVisibleChildren) continue;
      out.push({
        ...item,
        children: hasVisibleChildren ? children : undefined,
      });
    }
    return out;
  }, [rol]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Calcular qué grupos deben estar abiertos automáticamente basándose en la ruta activa
  const autoOpenGroups = useMemo(() => {
    const next: Record<string, boolean> = {};
    for (const item of visible) {
      if (item.children) {
        const hasActiveChild = item.children.some((c) =>
          isPathActive(pathname, c.href),
        );
        const parentActive = item.href
          ? isPathActive(pathname, item.href)
          : false;
        if (hasActiveChild || parentActive) next[item.label] = true;
      }
    }
    return next;
  }, [pathname, visible]);

  const [citasNuevasPortal, setCitasNuevasPortal] = useState(0);

  useEffect(() => {
    if (!rol || rol === "cliente" || rol === "veterinario") return;
    const fetchCount = () =>
      fetch("/api/citas?origen=portal&estado=pendiente")
        .then((r) => r.json())
        .then((j) => setCitasNuevasPortal((j.data ?? []).length))
        .catch(() => {});
    fetchCount();
    // Polling: refresca el contador cada 20 s para mostrar nuevas citas sin recargar
    const id = window.setInterval(fetchCount, 20000);
    const onFocus = () => fetchCount();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [rol]);

  const W = collapsed ? 64 : 230;

  const itemBaseStyle = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: collapsed ? 0 : "10px",
    justifyContent: collapsed ? "center" : "flex-start",
    padding: collapsed ? "10px" : "9px 10px",
    borderRadius: "8px",
    fontSize: "0.82rem",
    fontWeight: active ? 600 : 400,
    fontFamily: "var(--font-dm-sans)",
    transition: "background 0.15s, color 0.15s",
    background: active ? "rgba(61,132,91,0.22)" : "transparent",
    color: active ? "#a8e8c0" : "rgba(255,255,255,0.55)",
    borderLeft: collapsed
      ? "none"
      : active
        ? "2px solid #3d845b"
        : "2px solid transparent",
    borderTop: "none",
    borderRight: "none",
    borderBottom: "none",
    marginLeft: collapsed ? 0 : "2px",
    textDecoration: "none",
    cursor: "pointer",
    width: "100%",
  });

  const onHover = (active: boolean) => (e: React.MouseEvent<HTMLElement>) => {
    if (!active) {
      e.currentTarget.style.background = "rgba(255,255,255,0.07)";
      e.currentTarget.style.color = "rgba(255,255,255,0.85)";
    }
  };
  const onLeave = (active: boolean) => (e: React.MouseEvent<HTMLElement>) => {
    if (!active) {
      e.currentTarget.style.background = "transparent";
      e.currentTarget.style.color = "rgba(255,255,255,0.55)";
    }
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
        />
      )}

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
        <style>{`@media (min-width: 768px) { aside[data-sidebar] { transform: translateX(0) !important; } }`}</style>

        <div
          style={{
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 80% 50% at 50% -5%, rgba(61,132,91,0.20) 0%, transparent 70%)",
          }}
        />

        {/* Logo */}
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
          {!collapsed ? (
            <Image
              src="/logo/logo_h.png"
              alt="PetCare"
              width={110}
              height={30}
              className="object-contain"
              style={{
                filter: "brightness(0) invert(1)",
                opacity: 0.9,
                height: "auto",
              }}
              priority
            />
          ) : (
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

        <div
          style={{
            height: "1px",
            background: "rgba(255,255,255,0.07)",
            marginInline: collapsed ? "12px" : "16px",
            flexShrink: 0,
          }}
        />

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
              const hasChildren = !!item.children?.length;
              const parentActive = item.href
                ? isPathActive(pathname, item.href)
                : false;
              const childActive =
                item.children?.some((c) => isPathActive(pathname, c.href)) ??
                false;
              const isActive = parentActive || (childActive && !item.href);
              const isOpen =
                hasChildren &&
                (openGroups[item.label] ?? autoOpenGroups[item.label] ?? false);

              // Encabezado del item: si tiene href propio → <Link>; si es solo grupo → <button>
              const headerContent = (
                <>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <Icon
                      style={{
                        width: "16px",
                        height: "16px",
                        color:
                          isActive || childActive
                            ? "#55a876"
                            : "rgba(255,255,255,0.45)",
                      }}
                    />
                    {item.label === "Citas" && citasNuevasPortal > 0 && (
                      <span
                        style={{
                          position: "absolute",
                          top: "-5px",
                          right: "-6px",
                          background: "#c48c34",
                          color: "#fff",
                          borderRadius: "99px",
                          fontSize: "0.58rem",
                          fontWeight: 700,
                          lineHeight: 1,
                          padding: "2px 4px",
                          minWidth: "14px",
                          textAlign: "center",
                          fontFamily: "var(--font-dm-sans)",
                        }}
                      >
                        {citasNuevasPortal > 9 ? "9+" : citasNuevasPortal}
                      </span>
                    )}
                  </div>
                  {!collapsed && (
                    <>
                      <span style={{ flex: hasChildren ? 0 : 1 }}>
                        {item.label}
                      </span>
                      {hasChildren && (
                        <ChevronDown
                          style={{
                            width: "13px",
                            height: "13px",
                            transition: "transform 0.18s",
                            transform: isOpen
                              ? "rotate(0deg)"
                              : "rotate(-90deg)",
                            color: "rgba(255,255,255,0.4)",
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </>
                  )}
                </>
              );

              return (
                <li key={item.label}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      onClick={(e) => {
                        if (hasChildren && !collapsed) {
                          // Si tiene hijos, además de navegar permitimos expandir/colapsar con shift-click;
                          // por defecto, navega y expande.
                          setOpenGroups((p) => ({ ...p, [item.label]: true }));
                          if (e.shiftKey) e.preventDefault();
                        }
                        onMobileClose();
                      }}
                      title={collapsed ? item.label : undefined}
                      style={itemBaseStyle(isActive || childActive)}
                      onMouseEnter={onHover(isActive || childActive)}
                      onMouseLeave={onLeave(isActive || childActive)}
                    >
                      {headerContent}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setOpenGroups((p) => ({
                          ...p,
                          [item.label]: !p[item.label],
                        }))
                      }
                      title={collapsed ? item.label : undefined}
                      style={itemBaseStyle(isActive || childActive)}
                      onMouseEnter={onHover(isActive || childActive)}
                      onMouseLeave={onLeave(isActive || childActive)}
                    >
                      {headerContent}
                    </button>
                  )}

                  {hasChildren && isOpen && !collapsed && (
                    <ul
                      style={{
                        listStyle: "none",
                        margin: "2px 0 4px",
                        padding: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                      }}
                    >
                      {item.children!.map((child) => {
                        const active = isPathActive(pathname, child.href);
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              onClick={onMobileClose}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "7px 10px 7px 30px",
                                borderRadius: "8px",
                                fontSize: "0.78rem",
                                fontWeight: active ? 600 : 400,
                                fontFamily: "var(--font-dm-sans)",
                                background: active
                                  ? "rgba(61,132,91,0.18)"
                                  : "transparent",
                                color: active
                                  ? "#a8e8c0"
                                  : "rgba(255,255,255,0.5)",
                                borderLeft: active
                                  ? "2px solid #3d845b"
                                  : "2px solid transparent",
                                marginLeft: "2px",
                                textDecoration: "none",
                                transition: "background 0.15s, color 0.15s",
                              }}
                              onMouseEnter={onHover(active)}
                              onMouseLeave={onLeave(active)}
                            >
                              <span
                                style={{
                                  width: "5px",
                                  height: "5px",
                                  borderRadius: "50%",
                                  background: active
                                    ? "#55a876"
                                    : "rgba(255,255,255,0.25)",
                                  flexShrink: 0,
                                }}
                              />
                              <span>{child.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div
          style={{
            height: "1px",
            background: "rgba(255,255,255,0.07)",
            marginInline: collapsed ? "12px" : "16px",
            flexShrink: 0,
          }}
        />
      </aside>

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
