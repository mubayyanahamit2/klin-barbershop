import {
  Bot,
  CheckCircle2,
  KeyRound,
  MessageCircle,
  ShieldCheck,
  Terminal,
  Webhook,
  XCircle,
} from "lucide-react";
import { TelegramTestButton } from "@/components/admin/telegram-test-button";

export const dynamic = "force-dynamic";

type TelegramBotInfo = {
  username?: string;
  first_name?: string;
};

type WebhookInfo = {
  url?: string;
  pending_update_count?: number;
  last_error_message?: string;
};

async function telegramRequest<T>(
  token: string,
  method: string,
): Promise<T | null> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/${method}`,
      { cache: "no-store" },
    );
    const payload = (await response.json()) as { ok: boolean; result?: T };
    return payload.ok ? (payload.result ?? null) : null;
  } catch {
    return null;
  }
}

export default async function AdminSettingsPage() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const groupChatId = process.env.TELEGRAM_GROUP_CHAT_ID;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const notificationsEnabled = Boolean(token && groupChatId);

  const [botInfo, webhookInfo] = token
    ? await Promise.all([
        telegramRequest<TelegramBotInfo>(token, "getMe"),
        telegramRequest<WebhookInfo>(token, "getWebhookInfo"),
      ])
    : [null, null];

  const groupIdMasked = groupChatId
    ? `${groupChatId.slice(0, 4)}…${groupChatId.slice(-4)}`
    : "не задан";

  return (
    <div className="space-y-6">
      <header>
        <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-paper/35">
          Интеграции
        </span>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-[-0.06em] sm:text-4xl">
          Настройки
        </h1>
        <p className="mt-2 max-w-2xl text-xs leading-5 text-paper/40">
          Состояние Telegram-бота, уведомлений в группу и доступов. Секреты
          хранятся в переменных окружения и не отображаются в интерфейсе.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="border border-paper/10 bg-paper/[0.02] p-5">
          <div className="flex items-start justify-between">
            <span className="grid size-9 place-items-center border border-paper/10">
              <Bot className="size-4 text-paper/45" strokeWidth={1.7} />
            </span>
            {botInfo ? (
              <span className="flex items-center gap-1.5 text-[8px] font-extrabold uppercase tracking-[0.1em] text-lime">
                <CheckCircle2 className="size-3" /> online
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[8px] font-extrabold uppercase tracking-[0.1em] text-accent">
                <XCircle className="size-3" /> offline
              </span>
            )}
          </div>
          <h2 className="mt-5 text-sm font-bold">Telegram-бот</h2>
          <p className="mt-1 text-[10px] text-paper/35">
            {botInfo?.username
              ? `@${botInfo.username}`
              : "Токен не задан или бот недоступен"}
          </p>
          <p className="mt-4 border-t border-paper/10 pt-3 font-mono text-[8px] text-paper/20">
            TELEGRAM_BOT_TOKEN
          </p>
        </section>

        <section className="border border-paper/10 bg-paper/[0.02] p-5">
          <div className="flex items-start justify-between">
            <span className="grid size-9 place-items-center border border-paper/10">
              <MessageCircle className="size-4 text-paper/45" strokeWidth={1.7} />
            </span>
            {notificationsEnabled ? (
              <span className="flex items-center gap-1.5 text-[8px] font-extrabold uppercase tracking-[0.1em] text-lime">
                <CheckCircle2 className="size-3" /> включены
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[8px] font-extrabold uppercase tracking-[0.1em] text-accent">
                <XCircle className="size-3" /> выключены
              </span>
            )}
          </div>
          <h2 className="mt-5 text-sm font-bold">Группа барбершопа</h2>
          <p className="mt-1 text-[10px] text-paper/35">
            Chat ID: {groupIdMasked}
          </p>
          <div className="mt-4 border-t border-paper/10 pt-3">
            {notificationsEnabled ? (
              <TelegramTestButton />
            ) : (
              <p className="text-[9px] leading-4 text-paper/25">
                Добавьте токен бота и ID группы в <code>.env</code>, чтобы
                включить дублирование заявок.
              </p>
            )}
          </div>
        </section>

        <section className="border border-paper/10 bg-paper/[0.02] p-5">
          <div className="flex items-start justify-between">
            <span className="grid size-9 place-items-center border border-paper/10">
              <Webhook className="size-4 text-paper/45" strokeWidth={1.7} />
            </span>
            {webhookInfo?.url ? (
              <span className="flex items-center gap-1.5 text-[8px] font-extrabold uppercase tracking-[0.1em] text-lime">
                <CheckCircle2 className="size-3" /> webhook
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[8px] font-extrabold uppercase tracking-[0.1em] text-paper/35">
                polling / local
              </span>
            )}
          </div>
          <h2 className="mt-5 text-sm font-bold">Режим работы</h2>
          <p className="mt-1 truncate text-[10px] text-paper/35">
            {webhookInfo?.url || "Long polling через npm run bot"}
          </p>
          <p className="mt-4 border-t border-paper/10 pt-3 text-[9px] text-paper/25">
            {webhookInfo?.last_error_message
              ? `Ошибка: ${webhookInfo.last_error_message}`
              : "Секрет webhook: " +
                (webhookSecret ? "задан" : "не задан")}
          </p>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <section className="border border-paper/10 bg-paper/[0.02]">
          <div className="flex items-center gap-2 border-b border-paper/10 px-5 py-4">
            <Terminal className="size-4 text-paper/35" />
            <h2 className="text-xs font-bold">Как подключить Telegram</h2>
          </div>
          <ol className="divide-y divide-paper/[0.07]">
            {[
              {
                title: "Создайте бота",
                text: "Откройте @BotFather, выполните /newbot и скопируйте токен в TELEGRAM_BOT_TOKEN.",
              },
              {
                title: "Добавьте бота в группу",
                text: "Создайте группу для команды, добавьте бота и разрешите ему отправлять сообщения.",
              },
              {
                title: "Укажите ID группы",
                text: "ID начинается с -100. Его можно получить через getUpdates или специальные боты. Запишите в TELEGRAM_GROUP_CHAT_ID.",
              },
              {
                title: "Запустите локально",
                text: "В отдельном терминале выполните npm run bot — бот будет работать через long polling.",
              },
              {
                title: "Или включите webhook",
                text: "Для продакшена: npm run bot:webhook https://ваш-домен.ru. Укажите TELEGRAM_WEBHOOK_SECRET.",
              },
            ].map((item, index) => (
              <li key={item.title} className="flex gap-4 px-5 py-4">
                <span className="font-display text-lg font-bold text-paper/20">
                  0{index + 1}
                </span>
                <div>
                  <p className="text-[11px] font-bold">{item.title}</p>
                  <p className="mt-1 text-[10px] leading-5 text-paper/35">
                    {item.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="space-y-4">
          <section className="border border-paper/10 bg-paper/[0.02] p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-lime" />
              <h2 className="text-xs font-bold">Доступ в панель</h2>
            </div>
            <div className="mt-5 flex items-center justify-between border-b border-paper/[0.07] pb-3">
              <span className="text-[10px] text-paper/40">Пароль</span>
              <span className="text-[9px] font-bold text-paper/60">
                задан через ADMIN_PASSWORD
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] text-paper/40">Сессия</span>
              <span className="text-[9px] font-bold text-paper/60">
                7 дней · httpOnly
              </span>
            </div>
            <p className="mt-5 flex items-start gap-2 text-[9px] leading-4 text-paper/25">
              <KeyRound className="mt-0.5 size-3.5 shrink-0" />
              Перед публикацией смените ADMIN_PASSWORD и
              ADMIN_SESSION_SECRET, затем перезапустите приложение.
            </p>
          </section>

          <section className="border border-paper/10 bg-paper/[0.02] p-5">
            <h2 className="text-xs font-bold">Адрес и время</h2>
            <dl className="mt-4 space-y-3 text-[10px]">
              <div className="flex justify-between gap-4 border-b border-paper/[0.07] pb-2">
                <dt className="text-paper/30">Сайт</dt>
                <dd className="text-right text-paper/60">
                  {process.env.NEXT_PUBLIC_SITE_URL || "localhost:3000"}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-paper/[0.07] pb-2">
                <dt className="text-paper/30">Часовой пояс</dt>
                <dd className="text-paper/60">
                  {process.env.SHOP_TIMEZONE || "Europe/Moscow"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-paper/30">База</dt>
                <dd className="font-mono text-paper/60">SQLite · Prisma</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
