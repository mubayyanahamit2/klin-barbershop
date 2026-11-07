"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";

export function TelegramTestButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  async function sendTest() {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/telegram/test", { method: "POST" });
      const payload = await response.json().catch(() => ({}));

      setResult(
        response.ok
          ? { ok: true, text: "Сообщение отправлено в группу" }
          : { ok: false, text: payload.error || "Не удалось отправить" },
      );
    } catch {
      setResult({ ok: false, text: "Ошибка соединения" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={sendTest}
        disabled={loading}
        className="flex h-9 items-center gap-2 border border-lime/30 bg-lime/10 px-3 text-[9px] font-extrabold uppercase tracking-[0.1em] text-lime transition-colors hover:bg-lime/15 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Send className="size-3.5" />
        )}
        Отправить тест
      </button>
      {result && (
        <p
          className={`mt-2 text-[9px] font-semibold ${
            result.ok ? "text-lime" : "text-accent"
          }`}
        >
          {result.text}
        </p>
      )}
    </div>
  );
}
