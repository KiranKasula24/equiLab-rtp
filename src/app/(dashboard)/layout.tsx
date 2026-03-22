"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type CSSProperties, type ReactNode } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/trade", label: "Trade" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/analytics", label: "Analytics" },
  { href: "/history", label: "History" },
];

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <strong>equiLab RTP</strong>
        <nav style={styles.nav}>
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} style={{ ...styles.link, ...(active ? styles.activeLink : {}) }}>
                {link.label}
              </Link>
            );
          })}
        </nav>
        <button style={styles.logoutButton} onClick={logout} disabled={loading}>
          {loading ? "..." : "Logout"}
        </button>
      </header>
      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: { minHeight: "100vh", background: "#0b111d", color: "#e8efff" },
  header: {
    position: "sticky",
    top: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 20px",
    background: "#111a2b",
    borderBottom: "1px solid #263754",
    zIndex: 10,
    gap: "14px",
    flexWrap: "wrap",
  },
  nav: { display: "flex", gap: "8px", flexWrap: "wrap" },
  link: {
    textDecoration: "none",
    color: "#c4d5fa",
    padding: "6px 10px",
    borderRadius: "8px",
    border: "1px solid transparent",
  },
  activeLink: {
    color: "#ffffff",
    borderColor: "#3f5f90",
    background: "#1d2e4a",
  },
  logoutButton: {
    background: "#27406a",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    cursor: "pointer",
  },
  main: { padding: "20px", maxWidth: "1200px", margin: "0 auto" },
};


