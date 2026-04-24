import { cn } from "@/lib/utils";

export function Card({ className, children, style, interactive }: { className?: string; children: React.ReactNode; style?: React.CSSProperties; interactive?: boolean }) {
  return (
    <div
      className={cn("rounded-xl", interactive && "card-interactive", className)}
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        boxShadow: "0 1px 3px rgba(26,18,8,0.06), 0 1px 2px rgba(26,18,8,0.04)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn("flex items-center justify-between px-5 py-4", className)}
      style={{ borderBottom: "1px solid var(--card-border)" }}
    >
      {children}
    </div>
  );
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("px-5 py-4", className)}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn("px-5 py-3", className)}
      style={{ borderTop: "1px solid var(--card-border)" }}
    >
      {children}
    </div>
  );
}
