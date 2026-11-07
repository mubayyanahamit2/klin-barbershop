"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, RotateCcw, X } from "lucide-react";

export function AppointmentActions({
  id,
  status,
  compact = false,
}: {
  id: string;
  status: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function update(nextStatus: "CONFIRMED" | "DONE" | "CANCELLED") {
    if (
      nextStatus === "CANCELLED" &&
      !window.confirm("Отменить эту запись? Время снова станет доступно для записи.")
    ) {
      return;
    }

    setLoading(nextStatus);
    setError("");

    try {
      const response = await fetch(`/api/admin/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error || "Не удалось обновить");
        return;
      }

      router.refresh();
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(null);
    }
  }

  const baseClass = compact
    ? "flex h-7 items-center gap-1 border border-paper/15 px-2 text-[8px] font-extrabold uppercase tracking-[0.08em] transition-colors disabled:opacity-40"
    : "flex h-8 items-center gap-1.5 border border-paper/15 px-2.5 text-[9px] font-extrabold uppercase tracking-[0.08em] transition-colors disabled:opacity-40";

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {status === "CONFIRMED" && (
          <>
            <button
              type="button"
              onClick={() => update("DONE")}
              disabled={Boolean(loading)}
              className={`${baseClass} hover:border-lime/50 hover:bg-lime/10 hover:text-lime`}
            >
              {loading === "DONE" ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Check className="size-3" />
              )}
              Завершить
            </button>
            <button
              type="button"
              onClick={() => update("CANCELLED")}
              disabled={Boolean(loading)}
              className={`${baseClass} hover:border-accent/50 hover:bg-accent/10 hover:text-accent`}
            >
              {loading === "CANCELLED" ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <X className="size-3" />
              )}
              Отменить
            </button>
          </>
        )}

        {status === "DONE" && (
          <>
            <button
              type="button"
              onClick={() => update("CONFIRMED")}
              disabled={Boolean(loading)}
              className={`${baseClass} hover:border-lime/40 hover:text-lime`}
            >
              <RotateCcw className="size-3" />
              Вернуть
            </button>
            <button
              type="button"
              onClick={() => update("CANCELLED")}
              disabled={Boolean(loading)}
              className={`${baseClass} hover:border-accent/50 hover:text-accent`}
            >
              <X className="size-3" />
              Отменить
            </button>
          </>
        )}

        {status === "CANCELLED" && (
          <button
            type="button"
            onClick={() => update("CONFIRMED")}
            disabled={Boolean(loading)}
            className={`${baseClass} hover:border-lime/40 hover:text-lime`}
          >
            {loading === "CONFIRMED" ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <RotateCcw className="size-3" />
            )}
            Восстановить
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-[9px] text-accent">{error}</p>}
    </div>
  );
}
