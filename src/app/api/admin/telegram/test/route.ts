import { isAdminAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { sendTelegramGroupMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!(await isAdminAuthenticated())) return unauthorizedResponse();

  const sent = await sendTelegramGroupMessage(
    "<b>Проверка связи — КЛИН</b>\n\nУведомления о новых записях настроены и работают.",
  );

  if (!sent) {
    return Response.json(
      { error: "Проверьте TELEGRAM_BOT_TOKEN и TELEGRAM_GROUP_CHAT_ID" },
      { status: 400 },
    );
  }

  return Response.json({ ok: true });
}
