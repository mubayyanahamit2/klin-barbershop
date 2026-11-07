import { formatDateHuman, formatPhone, formatPrice, publicBookingId } from "@/lib/date";

type BookingForNotification = {
  id: string;
  clientName: string;
  clientPhone: string;
  date: string;
  startTime: string;
  source: string;
  telegramUsername?: string | null;
  notes?: string | null;
  barber: { name: string };
  service: { name: string; price: number; duration: number };
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function telegramNotificationsConfigured() {
  return Boolean(
    process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_GROUP_CHAT_ID,
  );
}

export async function sendTelegramGroupMessage(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_GROUP_CHAT_ID;

  if (!token || !chatId) {
    console.info("[telegram] Group notifications are not configured, skipping.");
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error("[telegram] Failed to send group notification", response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[telegram] Group notification error", error);
    return false;
  }
}

export async function notifyNewBooking(booking: BookingForNotification) {
  const source = booking.source === "TELEGRAM" ? "Telegram-бот" : "Сайт";
  const username = booking.telegramUsername
    ? `\nTelegram: @${escapeHtml(booking.telegramUsername)}`
    : "";
  const notes = booking.notes
    ? `\nКомментарий: ${escapeHtml(booking.notes)}`
    : "";

  const text = [
    "<b>НОВАЯ ЗАПИСЬ — КЛИН</b>",
    "",
    `<b>Клиент:</b> ${escapeHtml(booking.clientName)}`,
    `<b>Телефон:</b> ${escapeHtml(formatPhone(booking.clientPhone))}${username}`,
    `<b>Услуга:</b> ${escapeHtml(booking.service.name)} · ${formatPrice(booking.service.price)}`,
    `<b>Барбер:</b> ${escapeHtml(booking.barber.name)}`,
    `<b>Когда:</b> ${formatDateHuman(booking.date, { weekday: true })}, ${booking.startTime}`,
    `<b>Источник:</b> ${source}${notes}`,
    "",
    `<b>Номер:</b> ${publicBookingId(booking.id)}`,
  ].join("\n");

  return sendTelegramGroupMessage(text);
}
