import { createBot } from "../src/lib/telegram-bot";
import { prisma } from "../src/lib/prisma";

async function main() {
  const bot = createBot();

  await bot.init();
  console.log(`[telegram-bot] @${bot.botInfo.username} is running in polling mode`);

  const stop = async () => {
    await bot.stop();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  await bot.start({
    allowed_updates: ["message", "callback_query"],
  });
}

main().catch(async (error) => {
  console.error("[telegram-bot] Failed to start", error);
  await prisma.$disconnect();
  process.exit(1);
});
