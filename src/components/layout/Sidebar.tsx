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
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", module: "dashboard" },
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
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const rol = user?.rol as Rol | undefined;

  const visibleItems = navItems.filter(
    (item) => !rol || canAccess(rol, item.module)
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
          <Image
            src="/logo/logo_c.png"
            alt="PetCare"
            width={100}
            height={36}
            className="object-contain"
          />
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 md:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-petcare-600 text-white"
                        : "text-gray-600 hover:bg-petcare-50 hover:text-petcare-700"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-400">Sistema PetCare v1.0</p>
        </div>
      </aside>
    </>
  );
}
