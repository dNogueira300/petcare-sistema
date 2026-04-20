"use client";

import Image from "next/image";
import { LogOut, Menu } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

interface NavbarProps {
  onMenuToggle?: () => void;
}

const rolLabels: Record<string, string> = {
  administrador: "Administrador",
  veterinario: "Veterinario",
  recepcionista: "Recepcionista",
  cliente: "Cliente",
};

export function Navbar({ onMenuToggle }: NavbarProps) {
  const { user, logout } = useAuth();
  const fullName = user ? `${user.nombre} ${user.apellido}` : "";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 md:hidden"
        >
          <Menu className="size-5" />
        </button>
        <Image
          src="/logo/logo_h.png"
          alt="PetCare"
          width={120}
          height={32}
          className="object-contain"
          priority
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden flex-col items-end md:flex">
          <span className="text-sm font-medium text-gray-900">{fullName}</span>
          <span className="text-xs text-gray-500">
            {user ? rolLabels[user.rol] : ""}
          </span>
        </div>
        <Avatar name={fullName || "U"} size="sm" />
        <button
          onClick={logout}
          title="Cerrar sesión"
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-red-600 transition-colors"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </header>
  );
}
