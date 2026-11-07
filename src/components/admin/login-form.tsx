"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, LockKeyhole } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error || "Не удалось войти");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Проверьте соединение и попробуйте ещё раз");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-10">
      <label className="block">
        <span className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink/50">
          <LockKeyhole className="size-3.5" />
          Пароль администратора
        </span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Введите пароль"
          autoFocus
          autoComplete="current-password"
          className="h-14 w-full border border-ink/20 bg-paper px-4 text-base outline-none transition-colors placeholder:text-ink/25 focus:border-ink"
        />
      </label>

      {error && (
        <p className="mt-3 border-l-2 border-accent pl-3 text-xs font-semibold text-accent">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !password}
        className="mt-6 flex h-14 w-full items-center justify-between bg-ink px-5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-paper transition-colors hover:bg-accent hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "Проверяем..." : "Войти в панель"}
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ArrowRight className="size-4" />
        )}
      </button>
    </form>
  );
}
