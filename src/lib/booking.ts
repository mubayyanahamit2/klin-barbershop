import { prisma } from "@/lib/prisma";
import {
  isDateBefore,
  isoWeekday,
  minutesToTime,
  nowMinutes,
  timeToMinutes,
  todayISO,
} from "@/lib/date";

export type SlotResult = {
  slots: string[];
  isWorkingDay: boolean;
  message?: string;
};

export class BookingError extends Error {
  code: "NOT_FOUND" | "INVALID_DATE" | "SLOT_TAKEN" | "VALIDATION";

  constructor(
    message: string,
    code: "NOT_FOUND" | "INVALID_DATE" | "SLOT_TAKEN" | "VALIDATION" = "VALIDATION",
  ) {
    super(message);
    this.name = "BookingError";
    this.code = code;
  }
}

const SLOT_STEP = 30;

function overlaps(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
): boolean {
  return startA < endB && startB < endA;
}

export async function getAvailableSlots(input: {
  barberId: string;
  serviceId: string;
  date: string;
  ignoreAppointmentId?: string;
}): Promise<SlotResult> {
  const today = todayISO();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || isDateBefore(input.date, today)) {
    return {
      slots: [],
      isWorkingDay: false,
      message: "Выберите будущую дату",
    };
  }

  const [barber, service, appointments] = await Promise.all([
    prisma.barber.findUnique({
      where: { id: input.barberId },
      include: { workingDays: true },
    }),
    prisma.service.findUnique({ where: { id: input.serviceId } }),
    prisma.appointment.findMany({
      where: {
        barberId: input.barberId,
        date: input.date,
        status: { not: "CANCELLED" },
        ...(input.ignoreAppointmentId
          ? { id: { not: input.ignoreAppointmentId } }
          : {}),
      },
      select: { startTime: true, endTime: true },
    }),
  ]);

  if (!barber?.isActive || !service?.isActive) {
    return { slots: [], isWorkingDay: false, message: "Барбер или услуга недоступны" };
  }

  const weekday = barber.workingDays.find(
    (day) => day.weekday === isoWeekday(input.date),
  );

  if (!weekday?.isWorking) {
    return {
      slots: [],
      isWorkingDay: false,
      message: "В этот день барбер не работает",
    };
  }

  const open = timeToMinutes(weekday.startTime);
  const close = timeToMinutes(weekday.endTime);
  const breakStart = weekday.breakStart ? timeToMinutes(weekday.breakStart) : null;
  const breakEnd = weekday.breakEnd ? timeToMinutes(weekday.breakEnd) : null;
  const duration = service.duration;
  const currentMinutes = input.date === today ? nowMinutes() + 30 : -1;

  const slots: string[] = [];

  for (let start = open; start + duration <= close; start += SLOT_STEP) {
    const end = start + duration;

    if (start < currentMinutes) continue;

    if (
      breakStart !== null &&
      breakEnd !== null &&
      overlaps(start, end, breakStart, breakEnd)
    ) {
      continue;
    }

    const hasConflict = appointments.some((appointment) =>
      overlaps(
        start,
        end,
        timeToMinutes(appointment.startTime),
        timeToMinutes(appointment.endTime),
      ),
    );

    if (hasConflict) continue;

    slots.push(minutesToTime(start));
  }

  return { slots, isWorkingDay: true };
}

export async function createBooking(input: {
  barberId: string;
  serviceId: string;
  date: string;
  startTime: string;
  clientName: string;
  clientPhone: string;
  source: "WEBSITE" | "TELEGRAM";
  telegramId?: string | null;
  telegramUsername?: string | null;
  notes?: string | null;
}) {
  const [barber, service] = await Promise.all([
    prisma.barber.findUnique({ where: { id: input.barberId } }),
    prisma.service.findUnique({ where: { id: input.serviceId } }),
  ]);

  if (!barber?.isActive || !service?.isActive) {
    throw new BookingError("Барбер или услуга недоступны", "NOT_FOUND");
  }

  if (!/^\d{2}:\d{2}$/.test(input.startTime)) {
    throw new BookingError("Некорректное время", "VALIDATION");
  }

  const availability = await getAvailableSlots({
    barberId: input.barberId,
    serviceId: input.serviceId,
    date: input.date,
  });

  if (!availability.slots.includes(input.startTime)) {
    throw new BookingError(
      "Это время уже занято. Пожалуйста, выберите другое.",
      "SLOT_TAKEN",
    );
  }

  const endTime = minutesToTime(
    timeToMinutes(input.startTime) + service.duration,
  );

  try {
    return await prisma.appointment.create({
      data: {
        barberId: input.barberId,
        serviceId: input.serviceId,
        clientName: input.clientName.trim(),
        clientPhone: input.clientPhone.trim(),
        date: input.date,
        startTime: input.startTime,
        endTime,
        status: "CONFIRMED",
        source: input.source,
        telegramId: input.telegramId ?? null,
        telegramUsername: input.telegramUsername ?? null,
        notes: input.notes?.trim() || null,
      },
      include: { barber: true, service: true },
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new BookingError("Это время уже занято", "SLOT_TAKEN");
    }
    throw error;
  }
}
