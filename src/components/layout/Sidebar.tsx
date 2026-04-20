"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  PawPrint,
  FileText,
  UserCog,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  { href: "/dashboard",       icon: LayoutDashboard, label: "Dashboard",       module: "dashboard"        },
  { href: "/citas",           icon: CalendarDays,    label: "Citas",           module: "citas"            },
  { href: "/clientes",        icon: Users,           label: "Clientes",        module: "clientes"         },
  { href: "/mascotas",        icon: PawPrint,        label: "Mascotas",        module: "mascotas"         },
  { href: "/historia-clinica",icon: FileText,        label: "Historia Clínica",module: "historia-clinica" },
  { href: "/usuarios",        icon: UserCog,         label: "Usuarios",        module: "usuarios"         },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname  = usePathname();
  const { user }  = useAuth();
  const rol       = user?.rol as Rol | undefined;

  const visible = navItems.filter(item => !rol || canAccess(rol, item.module));

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "noise fixed inset-y-0 left-0 z-50 flex w-57.5 flex-col transition-transform duration-300 ease-out md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ background: "linear-gradient(180deg, #0a1a11 0%, #080f0a 100%)" }}
      >
        {/* Subtle top glow */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(61,132,91,0.18) 0%, transparent 70%)" }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center justify-between px-5 py-5">
          <Image
            src="/logo/logo_c.png"
            alt="PetCare"
            width={88}
            height={32}
            className="object-contain brightness-[1.3] saturate-0 invert opacity-75"
          />
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-forest-400 hover:text-cream-400 transition-colors md:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-5 mb-4" style={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />

        {/* Role label */}
        {user && (
          <p
            className="relative z-10 px-5 mb-3"
            style={{
              fontSize: "0.65rem",
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#3d845b",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            {({ administrador:"Administrador", veterinario:"Veterinario", recepcionista:"Recepcionista", cliente:"Cliente" })[user.rol] ?? user.rol}
          </p>
        )}

        {/* Nav items */}
        <nav className="relative z-10 flex-1 overflow-y-auto px-3 pb-4">
          <ul className="flex flex-col gap-0.5">
            {visible.map((item) => {
              const Icon     = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "9px 10px",
                      borderRadius: "8px",
                      fontSize: "0.82rem",
                      fontWeight: isActive ? 600 : 400,
                      fontFamily: "var(--font-dm-sans)",
                      letterSpacing: "0.01em",
                      transition: "background 0.15s, color 0.15s",
                      background: isActive ? "rgba(61,132,91,0.18)" : "transparent",
                      color: isActive ? "#80cc9c" : "#6b5c44",
                      borderLeft: isActive ? "2px solid #3d845b" : "2px solid transparent",
                      marginLeft: "2px",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)";
                        (e.currentTarget as HTMLAnchorElement).style.color = "#a89a80";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                        (e.currentTarget as HTMLAnchorElement).style.color = "#6b5c44";
                      }
                    }}
                  >
                    <Icon
                      style={{
                        width: "15px",
                        height: "15px",
                        flexShrink: 0,
                        color: isActive ? "#55a876" : "#4a3d2e",
                      }}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div
          className="relative z-10 px-5 py-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <p style={{ fontSize: "0.65rem", color: "#2a2118", fontFamily: "var(--font-dm-sans)" }}>
            PetCare v1.0 · UNAP 2026
          </p>
        </div>
      </aside>
    </>
  );
}
