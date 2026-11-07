import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  Bot,
  InlineKeyboard,
  InputFile,
  Keyboard,
  type CallbackQueryContext,
  type Context,
} from "grammy";
import type { InputMediaPhoto } from "grammy/types";
import { prisma } from "@/lib/prisma";
import { createBooking, getAvailableSlots, BookingError } from "@/lib/booking";
import {
  addDays,
  formatDateHuman,
  formatPrice,
  isValidPhone,
  isoWeekday,
  normalizePhone,
  publicBookingId,
  todayISO,
} from "@/lib/date";
import { notifyNewBooking } from "@/lib/telegram";

type BookingDraft = {
  serviceId?: string;
  barberId?: string;
  date?: string;
  time?: string;
  name?: string;
};

type SessionValue = {
  step: string;
  data: BookingDraft;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function readSession(chatId: number): Promise<SessionValue> {
  const session = await prisma.telegramSession.findUnique({
    where: { chatId: String(chatId) },
  });

  if (!session) return { step: "idle", data: {} };

  try {
    return {
      step: session.step,
      data: JSON.parse(session.data) as BookingDraft,
    };
  } catch {
    return { step: "idle", data: {} };
  }
}

async function writeSession(
  chatId: number,
  step: string,
  data: BookingDraft,
) {
  await prisma.telegramSession.upsert({
    where: { chatId: String(chatId) },
    create: { chatId: String(chatId), step, data: JSON.stringify(data) },
    update: { step, data: JSON.stringify(data) },
  });
}

function mainMenuKeyboard() {
  return new InlineKeyboard()
    .text("Записаться", "book")
    .row()
    .text("Мои записи", "my")
    .text("Услуги и цены", "services");
}

function welcomeText() {
  return [
    "<b>КЛИН — барбершоп в Екатеринбурге</b>",
    "",
    "Запишу вас к барберу за пару шагов. Выберите действие ниже.",
    "",
    "Малышева, 44 · ежедневно 10:00–22:00",
  ].join("\n");
}

async function editOrReply(
  ctx: CallbackQueryContext<Context>,
  text: string,
  keyboard?: InlineKeyboard,
) {
  const extra = {
    parse_mode: "HTML" as const,
    reply_markup: keyboard,
  };

  try {
    await ctx.editMessageText(text, extra);
  } catch {
    await ctx.reply(text, extra);
  }
}

async function showServices(
  ctx: Context | CallbackQueryContext<Context>,
  edit = false,
) {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const keyboard = new InlineKeyboard();
  services.forEach((service) => {
    keyboard
      .text(
        `${service.name} · ${formatPrice(service.price)}`,
        `svc:${service.id}`,
      )
      .row();
  });

  const message = "<b>Шаг 1 из 4. Выберите услугу</b>";
  if (edit && "editMessageText" in ctx) {
    await editOrReply(ctx as CallbackQueryContext<Context>, message, keyboard);
  } else {
    await (ctx as Context).reply(message, {
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
  }
}

function barberPhoto(photo: string) {
  if (/^https?:\/\//i.test(photo)) return photo;

  const localPath = join(process.cwd(), "public", photo.replace(/^\/+/, ""));
  if (!existsSync(localPath)) return null;

  return new InputFile(localPath);
}

async function showBarbers(ctx: CallbackQueryContext<Context>, serviceId: string) {
  const [service, barbers] = await Promise.all([
    prisma.service.findUnique({ where: { id: serviceId } }),
    prisma.barber.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  if (!service) {
    await ctx.reply("Услуга не найдена. Начните заново: /book");
    return;
  }

  if (!barbers.length) {
    await ctx.reply("Сейчас нет доступных барберов. Попробуйте позже.");
    return;
  }

  const keyboard = new InlineKeyboard();
  const photos: InputMediaPhoto[] = [];

  barbers.forEach((barber) => {
    keyboard.text(barber.name, `barber:${barber.id}`).row();
    const media = barberPhoto(barber.photo);
    if (!media) return;

    photos.push({
      type: "photo",
      media,
      caption: [
        `<b>${escapeHtml(barber.name)}</b>`,
        escapeHtml(barber.role),
        `Опыт: ${barber.experience} лет`,
      ].join("\n"),
      parse_mode: "HTML",
    });
  });
  keyboard.text("Выбрать другую услугу", "book");

  try {
    await ctx.deleteMessage();
  } catch {}

  try {
    if (photos.length > 1) {
      await ctx.replyWithMediaGroup(photos);
    } else if (photos.length === 1) {
      await ctx.replyWithPhoto(photos[0].media, {
        caption: photos[0].caption,
        parse_mode: "HTML",
      });
    }
  } catch (error) {
    console.error("[telegram-bot] Failed to send barber photos", error);
  }

  await ctx.reply(
    [
      `<b>${escapeHtml(service.name)}</b> · ${formatPrice(service.price)}`,
      "",
      "<b>Шаг 2 из 4. Выберите барбера</b>",
    ].join("\n"),
    { parse_mode: "HTML", reply_markup: keyboard },
  );
}

async function showDates(
  ctx: CallbackQueryContext<Context>,
  data: BookingDraft,
  barberId: string,
) {
  const [service, barber] = await Promise.all([
    data.serviceId
      ? prisma.service.findUnique({ where: { id: data.serviceId } })
      : null,
    prisma.barber.findUnique({
      where: { id: barberId },
      include: { workingDays: true },
    }),
  ]);

  if (!service || !barber?.isActive || !ctx.chat) {
    await ctx.reply("Не удалось загрузить данные. Начните заново: /book");
    return;
  }

  const today = todayISO();
  const dates: string[] = [];
  for (let offset = 0; offset < 21 && dates.length < 10; offset += 1) {
    const date = addDays(today, offset);
    const weekday = barber.workingDays.find(
      (day) => day.weekday === isoWeekday(date),
    );
    if (weekday?.isWorking) dates.push(date);
  }

  if (!dates.length) {
    await ctx.reply("У барбера пока нет доступных дней. Попробуйте другого мастера: /book");
    return;
  }

  const keyboard = new InlineKeyboard();
  dates.forEach((date, index) => {
    const label = formatDateHuman(date, { weekday: true });
    keyboard.text(label, `date:${date}`);
    if (index % 2 === 1) keyboard.row();
  });
  if (dates.length % 2 === 1) keyboard.row();
  keyboard.text("Выбрать другого барбера", "back:barbers");

  await writeSession(ctx.chat.id, "booking", {
    ...data,
    barberId,
  });

  await editOrReply(
    ctx,
    [
      `<b>${escapeHtml(barber.name)}</b> · ${escapeHtml(service.name)}`,
      "",
      "<b>Шаг 3 из 4. Выберите дату</b>",
      `Ближайшие свободные дни: ${formatDateHuman(dates[0], { weekday: true })} — ${formatDateHuman(dates[dates.length - 1], { weekday: true })}`,
    ].join("\n"),
    keyboard,
  );
}

async function showTimes(
  ctx: CallbackQueryContext<Context>,
  data: BookingDraft,
  date: string,
) {
  if (!data.serviceId || !data.barberId || !ctx.chat) {
    await ctx.reply("Сессия устарела. Начните заново: /book");
    return;
  }

  const availability = await getAvailableSlots({
    barberId: data.barberId,
    serviceId: data.serviceId,
    date,
  });

  if (!availability.slots.length) {
    await ctx.reply(
      `${formatDateHuman(date, { weekday: true })}: свободных окон нет. Выберите другой день.`,
      { reply_markup: new InlineKeyboard().text("К выбору даты", "back:dates") },
    );
    return;
  }

  const keyboard = new InlineKeyboard();
  availability.slots.forEach((time, index) => {
    keyboard.text(time, `time:${time}`);
    if (index % 3 === 2) keyboard.row();
  });
  if (availability.slots.length % 3 !== 0) keyboard.row();
  keyboard.text("К выбору даты", "back:dates");

  await writeSession(ctx.chat.id, "booking", { ...data, date });

  await editOrReply(
    ctx,
    [
      `<b>${formatDateHuman(date, { weekday: true })}</b>`,
      "",
      "<b>Шаг 4 из 4. Выберите время</b>",
      "Все окна указаны по местному времени барбершопа.",
    ].join("\n"),
    keyboard,
  );
}

async function completeBooking(ctx: Context, phoneInput: string) {
  if (!ctx.chat) return;

  const session = await readSession(ctx.chat.id);
  const { data } = session;

  if (
    !data.serviceId ||
    !data.barberId ||
    !data.date ||
    !data.time ||
    !data.name
  ) {
    await ctx.reply("Сессия устарела. Начните заново: /book");
    return;
  }

  const phone = normalizePhone(phoneInput);
  if (!isValidPhone(phone)) {
    await ctx.reply(
      "Не получилось распознать номер. Отправьте телефон в формате +7 999 123-45-67.",
    );
    return;
  }

  try {
    const booking = await createBooking({
      barberId: data.barberId,
      serviceId: data.serviceId,
      date: data.date,
      startTime: data.time,
      clientName: data.name,
      clientPhone: phone,
      source: "TELEGRAM",
      telegramId: String(ctx.chat.id),
      telegramUsername: ctx.from?.username ?? null,
    });

    await writeSession(ctx.chat.id, "idle", {});

    await ctx.reply(
      [
        "<b>Вы записаны в КЛИН</b>",
        "",
        `<b>Номер:</b> ${publicBookingId(booking.id)}`,
        `<b>Барбер:</b> ${escapeHtml(booking.barber.name)}`,
        `<b>Услуга:</b> ${escapeHtml(booking.service.name)}`,
        `<b>Дата:</b> ${formatDateHuman(booking.date, { weekday: true })}`,
        `<b>Время:</b> ${booking.startTime}`,
        `<b>Стоимость:</b> ${formatPrice(booking.service.price)}`,
        "",
        "Малышева, 44. Приходите за 5 минут до начала.",
        "Если планы изменятся — позвоните нам: +7 (343) 288-44-18.",
      ].join("\n"),
      {
        parse_mode: "HTML",
        reply_markup: mainMenuKeyboard(),
      },
    );

    await notifyNewBooking(booking);
  } catch (error) {
    if (error instanceof BookingError) {
      await writeSession(ctx.chat.id, "idle", {});
      await ctx.reply(
        `${error.message}\n\nНачните заново: /book`,
        { reply_markup: mainMenuKeyboard() },
      );
      return;
    }
    console.error("[telegram-bot] Booking error", error);
    await ctx.reply("Что-то пошло не так. Попробуйте ещё раз: /book");
  }
}

export function createBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }

  const bot = new Bot(token);

  bot.command("start", async (ctx) => {
    if (ctx.chat) await writeSession(ctx.chat.id, "idle", {});
    await ctx.reply(welcomeText(), {
      parse_mode: "HTML",
      reply_markup: mainMenuKeyboard(),
    });
  });

  bot.command("book", async (ctx) => {
    if (ctx.chat) await writeSession(ctx.chat.id, "booking", {});
    await showServices(ctx);
  });

  bot.command("cancel", async (ctx) => {
    if (ctx.chat) await writeSession(ctx.chat.id, "idle", {});
    await ctx.reply("Запись отменена.", { reply_markup: mainMenuKeyboard() });
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(
      [
        "<b>Команды</b>",
        "/book — записаться",
        "/my — мои записи",
        "/cancel — отменить текущую запись",
        "/id — узнать ID этого чата",
        "",
        "Или просто нажмите кнопку ниже.",
      ].join("\n"),
      { parse_mode: "HTML", reply_markup: mainMenuKeyboard() },
    );
  });

  bot.command("id", async (ctx) => {
    if (!ctx.chat) return;
    await ctx.reply(`ID этого чата: ${ctx.chat.id}`);
  });

  bot.command("services", async (ctx) => {
    await showServices(ctx);
  });

  bot.command("my", async (ctx) => {
    if (!ctx.chat) return;

    const appointments = await prisma.appointment.findMany({
      where: {
        telegramId: String(ctx.chat.id),
        date: { gte: todayISO() },
        status: { not: "CANCELLED" },
      },
      include: { barber: true, service: true },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 10,
    });

    if (!appointments.length) {
      await ctx.reply(
        "У вас пока нет предстоящих записей.\n\nВыберите услугу и удобное время — я всё оформлю.",
        { reply_markup: new InlineKeyboard().text("Записаться", "book") },
      );
      return;
    }

    const lines = ["<b>Ваши записи</b>", ""];
    appointments.forEach((appointment) => {
      lines.push(
        `<b>${formatDateHuman(appointment.date, { weekday: true })}, ${appointment.startTime}</b>`,
      );
      lines.push(
        `${escapeHtml(appointment.service.name)} · ${escapeHtml(appointment.barber.name)}`,
      );
      lines.push(`Номер: ${publicBookingId(appointment.id)}`, "");
    });

    await ctx.reply(lines.join("\n"), {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard().text("Записаться ещё", "book"),
    });
  });

  bot.callbackQuery("book", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (ctx.chat) await writeSession(ctx.chat.id, "booking", {});
    await showServices(ctx, true);
  });

  bot.callbackQuery("my", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.chat) return;

    const appointments = await prisma.appointment.findMany({
      where: {
        telegramId: String(ctx.chat.id),
        date: { gte: todayISO() },
        status: { not: "CANCELLED" },
      },
      include: { barber: true, service: true },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 10,
    });

    if (!appointments.length) {
      await editOrReply(
        ctx,
        "У вас пока нет предстоящих записей.",
        new InlineKeyboard().text("Записаться", "book"),
      );
      return;
    }

    const lines = ["<b>Ваши записи</b>", ""];
    appointments.forEach((appointment) => {
      lines.push(
        `<b>${formatDateHuman(appointment.date, { weekday: true })}, ${appointment.startTime}</b>`,
      );
      lines.push(
        `${escapeHtml(appointment.service.name)} · ${escapeHtml(appointment.barber.name)}`,
        `Номер: ${publicBookingId(appointment.id)}`,
        "",
      );
    });

    await editOrReply(
      ctx,
      lines.join("\n"),
      new InlineKeyboard().text("Записаться ещё", "book"),
    );
  });

  bot.callbackQuery("services", async (ctx) => {
    await ctx.answerCallbackQuery();
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    await editOrReply(
      ctx,
      [
        "<b>Услуги и цены</b>",
        "",
        ...services.map(
          (service) =>
            `${escapeHtml(service.name)} — ${formatPrice(service.price)} · ${service.duration} мин`,
        ),
      ].join("\n"),
      new InlineKeyboard().text("Записаться", "book"),
    );
  });

  bot.callbackQuery(/^svc:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.chat) return;

    const serviceId = ctx.match[1];
    const current = await readSession(ctx.chat.id);
    await writeSession(ctx.chat.id, "booking", {
      ...current.data,
      serviceId,
    });
    await showBarbers(ctx, serviceId);
  });

  bot.callbackQuery(/^barber:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.chat) return;

    const barberId = ctx.match[1];
    const session = await readSession(ctx.chat.id);
    await showDates(ctx, session.data, barberId);
  });

  bot.callbackQuery(/^date:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.chat) return;

    const date = ctx.match[1];
    const session = await readSession(ctx.chat.id);
    await showTimes(ctx, session.data, date);
  });

  bot.callbackQuery(/^time:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.chat) return;

    const time = ctx.match[1];
    const session = await readSession(ctx.chat.id);
    await writeSession(ctx.chat.id, "awaiting_name", {
      ...session.data,
      time,
    });

    await ctx.reply(
      [
        "<b>Последний шаг</b>",
        "",
        "Как к вам обращаться? Напишите имя.",
      ].join("\n"),
      { parse_mode: "HTML", reply_markup: { remove_keyboard: true } },
    );
  });

  bot.callbackQuery("back:barbers", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.chat) return;

    const session = await readSession(ctx.chat.id);
    if (!session.data.serviceId) {
      await showServices(ctx, true);
      return;
    }
    await showBarbers(ctx, session.data.serviceId);
  });

  bot.callbackQuery("back:dates", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.chat) return;

    const session = await readSession(ctx.chat.id);
    if (!session.data.barberId) {
      await showServices(ctx, true);
      return;
    }
    await showDates(ctx, session.data, session.data.barberId);
  });

  bot.on("message:contact", async (ctx) => {
    if (!ctx.chat) return;
    const session = await readSession(ctx.chat.id);
    if (session.step !== "awaiting_phone") {
      await ctx.reply("Нажмите /book, чтобы начать запись.");
      return;
    }
    await completeBooking(ctx, ctx.message.contact.phone_number);
  });

  bot.on("message:text", async (ctx) => {
    if (!ctx.chat) return;
    const text = ctx.message.text.trim();
    if (text.startsWith("/")) return;

    const session = await readSession(ctx.chat.id);

    if (session.step === "awaiting_name") {
      if (text.length < 2) {
        await ctx.reply("Напишите имя — хотя бы две буквы.");
        return;
      }

      await writeSession(ctx.chat.id, "awaiting_phone", {
        ...session.data,
        name: text,
      });

      await ctx.reply(
        [
          `Приятно познакомиться, ${escapeHtml(text)}.`,
          "Теперь отправьте номер телефона или нажмите кнопку ниже.",
        ].join("\n"),
        {
          parse_mode: "HTML",
          reply_markup: new Keyboard()
            .requestContact("Отправить телефон")
            .resized()
            .oneTime(),
        },
      );
      return;
    }

    if (session.step === "awaiting_phone") {
      await completeBooking(ctx, text);
      return;
    }

    await ctx.reply(
      "Я помогу записаться в КЛИН. Нажмите /book или выберите действие.",
      { reply_markup: mainMenuKeyboard() },
    );
  });

  bot.catch((error) => {
    console.error("[telegram-bot]", error.error);
  });

  return bot;
}
