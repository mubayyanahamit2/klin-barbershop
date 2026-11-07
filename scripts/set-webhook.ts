import { createBot } from "../src/lib/telegram-bot";
import { prisma } from "../src/lib/prisma";

async function main() {
  const baseUrl =
    process.argv[2] ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";
  const webhookUrl = `${baseUrl.replace(/\/$/, "")}/api/telegram/webhook`;
  const bot = createBot();

  await bot.api.setWebhook(webhookUrl, {
    secret_token: process.env.TELEGRAM_WEBHOOK_SECRET || undefined,
    allowed_updates: ["message", "callback_query"],
  });

  console.log(`[telegram] Webhook set: ${webhookUrl}`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("[telegram] Failed to set webhook", error);
  await prisma.$disconnect();
  process.exit(1);
});
