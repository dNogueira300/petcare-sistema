import Image from "next/image";
import { cn } from "@/lib/utils";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

const sizes = { sm: 24, md: 40, lg: 64 };

export function Loading({ size = "md", text, className }: LoadingProps) {
  const px = sizes[size];
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        className,
      )}
    >
      <div className="relative animate-pulse">
        <Image
          src="/logo/logo_i.png"
          alt="PetCare"
          width={px}
          height={px}
          className="object-contain"
        />
      </div>
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex min-h-100 items-center justify-center">
      <Loading size="lg" text="Cargando..." />
    </div>
  );
}
