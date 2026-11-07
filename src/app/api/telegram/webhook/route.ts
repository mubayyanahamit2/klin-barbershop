import { webhookCallback } from "grammy";
import { createBot } from "@/lib/telegram-bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let handler: ((request: Request) => Promise<Response>) | null = null;

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const incomingSecret = request.headers.get(
    "x-telegram-bot-api-secret-token",
  );

  if (secret && incomingSecret !== secret) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return Response.json(
      { ok: false, error: "TELEGRAM_BOT_TOKEN is not configured" },
      { status: 503 },
    );
  }

  if (!handler) {
    handler = webhookCallback(createBot(), "std/http");
  }

  return handler(request);
}
