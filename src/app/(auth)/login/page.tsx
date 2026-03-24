"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const p = await r.json();
    if (!r.ok) {
      setError(p.error ?? "Login failed");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        position: "relative",
      }}
    >
      <div className="auth-orb auth-orb-cyan" />
      <div className="auth-orb auth-orb-violet" />

      <div className="auth-shell">
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", marginBottom: 14 }}>
            <BrandLogo size={54} showWordmark={false} />
          </div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Trade smarter with your EquiLab workspace</p>
        </div>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 15 }}>
          <div>
            <label className="label">Email address</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "var(--r-md)",
                fontSize: 13,
                background: "var(--loss-dim)",
                border: "1px solid rgba(251,113,133,0.42)",
                color: "var(--loss-text)",
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{ height: 46, fontSize: 15, marginTop: 2 }}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="auth-switch">
          No account?{" "}
          <Link href="/register" className="auth-link">
            Create one free
          </Link>
        </p>
      </div>
    </main>
  );
}
