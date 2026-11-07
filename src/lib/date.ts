export const SHOP_TIMEZONE = process.env.SHOP_TIMEZONE || "Europe/Moscow";

export const WEEKDAYS_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
export const WEEKDAYS_FULL = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];
export const MONTHS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

export const MONTHS_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

function zonedParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SHOP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

export function todayISO(now = new Date()): string {
  const { year, month, day } = zonedParts(now);
  return `${year}-${month}-${day}`;
}

export function nowMinutes(now = new Date()): number {
  const { hour, minute } = zonedParts(now);
  return Number(hour) * 60 + Number(minute);
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function addDays(date: string, amount: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + amount, 12));
  return [
    value.getUTCFullYear(),
    String(value.getUTCMonth() + 1).padStart(2, "0"),
    String(value.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function dayOfWeek(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
}

export function isoWeekday(date: string): number {
  const day = dayOfWeek(date);
  return day === 0 ? 7 : day;
}

export function isDateBefore(left: string, right: string): boolean {
  return left < right;
}

export function getDateParts(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

export function formatDateHuman(
  date: string,
  options: { weekday?: boolean; year?: boolean } = {},
): string {
  const { year, month, day } = getDateParts(date);
  const weekday = options.weekday
    ? `, ${new Intl.DateTimeFormat("ru-RU", {
        weekday: "short",
        timeZone: "UTC",
      }).format(new Date(Date.UTC(year, month - 1, day, 12)))}`
    : "";

  return `${day} ${MONTHS_GENITIVE[month - 1]}${options.year ? ` ${year}` : ""}${weekday}`;
}

export function formatDateNumeric(date: string): string {
  const { year, month, day } = getDateParts(date);
  return `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.${year}`;
}

export function formatMonth(date: string): string {
  const { year, month } = getDateParts(date);
  return `${MONTHS[month - 1]} ${year}`;
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value) + " ₽";
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} ч ${rest} мин` : `${hours} ч`;
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) return phone;
  return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
}

export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    return `+7${digits.slice(1)}`;
  }
  if (digits.length === 10) return `+7${digits}`;
  return input.trim();
}

export function isValidPhone(input: string): boolean {
  const digits = input.replace(/\D/g, "");
  return digits.length === 11 && /^[78]/.test(digits);
}

export function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function publicBookingId(id: string): string {
  return `KL-${id.slice(-5).toUpperCase()}`;
}
