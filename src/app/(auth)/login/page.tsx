"use client";

import { FormEvent, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Login failed");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main style={styles.page}>
      <form onSubmit={onSubmit} style={styles.card}>
        <h1 style={styles.title}>Login to equiLab</h1>
        <p style={styles.subtitle}>Paper trading for NSE and BSE markets.</p>

        <label style={styles.label}>Email</label>
        <input
          style={styles.input}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label style={styles.label}>Password</label>
        <input
          style={styles.input}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {error ? <p style={styles.error}>{error}</p> : null}

        <button style={styles.button} disabled={loading} type="submit">
          {loading ? "Signing in..." : "Login"}
        </button>

        <p style={styles.footerText}>
          New user? <Link href="/register">Create account</Link>
        </p>
      </form>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(120deg, #0b0f1a, #121a2c)",
    padding: "24px",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    background: "#151d30",
    border: "1px solid #27324a",
    borderRadius: "16px",
    padding: "24px",
    display: "grid",
    gap: "12px",
  },
  title: { fontSize: "24px", margin: 0 },
  subtitle: { margin: 0, color: "#9eb1d6" },
  label: { fontSize: "13px", color: "#b7c7e8" },
  input: {
    height: "40px",
    borderRadius: "8px",
    border: "1px solid #2a3a59",
    background: "#0f1524",
    color: "#e9f0ff",
    padding: "0 10px",
  },
  button: {
    height: "42px",
    borderRadius: "10px",
    border: "none",
    background: "#3b82f6",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: "4px",
  },
  error: { color: "#fca5a5", margin: 0 },
  footerText: { margin: "6px 0 0", color: "#b7c7e8" },
};

