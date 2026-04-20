"use client";

import { useState } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <Navbar onMenuToggle={() => setSidebarOpen(true)} />
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "28px 28px 48px",
            background: "var(--bg)",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
