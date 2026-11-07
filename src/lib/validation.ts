import { z } from "zod";

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Время должно быть в формате ЧЧ:ММ");

const optionalTimeSchema = z
  .union([timeSchema, z.literal(""), z.null()])
  .optional();

export const scheduleDaySchema = z.object({
  weekday: z.number().int().min(1).max(7),
  isWorking: z.boolean(),
  startTime: timeSchema,
  endTime: timeSchema,
  breakStart: optionalTimeSchema,
  breakEnd: optionalTimeSchema,
});

export const scheduleSchema = z
  .array(scheduleDaySchema)
  .length(7)
  .refine(
    (days) => new Set(days.map((day) => day.weekday)).size === 7,
    "В расписании должны быть все дни недели",
  );

export const barberInputSchema = z.object({
  name: z.string().trim().min(2, "Имя слишком короткое").max(80),
  role: z.string().trim().min(2, "Укажите роль").max(120),
  bio: z.string().trim().max(600).default(""),
  photo: z.string().trim().min(1).max(500).default("/images/barber-1.jpg"),
  accent: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Цвет должен быть в формате #RRGGBB")
    .default("#ff5c35"),
  experience: z.number().int().min(0).max(70).default(0),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999).default(0),
  schedule: scheduleSchema,
});

export type BarberInput = z.infer<typeof barberInputSchema>;

export function validateSchedule(input: BarberInput): string | null {
  for (const day of input.schedule) {
    if (!day.isWorking) continue;

    const toMinutes = (value: string) => {
      const [hours, minutes] = value.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const start = toMinutes(day.startTime);
    const end = toMinutes(day.endTime);

    if (end <= start) {
      return `День ${day.weekday}: конец смены должен быть позже начала`;
    }

    const hasBreakStart = Boolean(day.breakStart);
    const hasBreakEnd = Boolean(day.breakEnd);

    if (hasBreakStart !== hasBreakEnd) {
      return `День ${day.weekday}: укажите начало и конец перерыва`;
    }

    if (hasBreakStart && hasBreakEnd) {
      const breakStart = toMinutes(day.breakStart as string);
      const breakEnd = toMinutes(day.breakEnd as string);
      if (
        breakEnd <= breakStart ||
        breakStart < start ||
        breakEnd > end
      ) {
        return `День ${day.weekday}: перерыв должен быть внутри смены`;
      }
    }
  }

  return null;
}
