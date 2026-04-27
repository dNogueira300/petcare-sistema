import type { Metadata } from "next";
export const metadata: Metadata = { title: "Mi Portal — PetCare" };
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
