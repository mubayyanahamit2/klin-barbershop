import { prisma } from "@/lib/prisma";
import type { AppointmentData, BarberData, ServiceData } from "@/lib/types";
import {
  addDays,
  isoWeekday,
  timeToMinutes,
  todayISO,
} from "@/lib/date";

export async function getServices(): Promise<ServiceData[]> {
  return prisma.service.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      duration: true,
      price: true,
      sortOrder: true,
    },
  });
}

export async function getBarbers(includeInactive = false): Promise<BarberData[]> {
  return prisma.barber.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      role: true,
      bio: true,
      photo: true,
      accent: true,
      experience: true,
      isActive: true,
      sortOrder: true,
      workingDays: {
        orderBy: { weekday: "asc" },
        select: {
          weekday: true,
          isWorking: true,
          startTime: true,
          endTime: true,
          breakStart: true,
          breakEnd: true,
        },
      },
    },
  });
}

export async function getBarberById(id: string) {
  return prisma.barber.findUnique({
    where: { id },
    include: { workingDays: { orderBy: { weekday: "asc" } } },
  });
}

export async function getBarberBySlug(slug: string) {
  return prisma.barber.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true },
  });
}

function appointmentInclude() {
  return {
    barber: { select: { id: true, name: true, photo: true } },
    service: { select: { id: true, name: true, price: true, duration: true } },
  } as const;
}

export function serializeAppointment(
  appointment: Awaited<ReturnType<typeof getTodayAppointments>>[number],
): AppointmentData {
  return {
    id: appointment.id,
    clientName: appointment.clientName,
    clientPhone: appointment.clientPhone,
    date: appointment.date,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    status: appointment.status,
    source: appointment.source,
    telegramUsername: appointment.telegramUsername,
    notes: appointment.notes,
    createdAt: appointment.createdAt.toISOString(),
    barber: appointment.barber,
    service: appointment.service,
  };
}

export async function getTodayAppointments(date = todayISO()) {
  return prisma.appointment.findMany({
    where: { date },
    include: appointmentInclude(),
    orderBy: { startTime: "asc" },
  });
}

export async function getUpcomingAppointments(limit = 6) {
  const today = todayISO();
  return prisma.appointment.findMany({
    where: {
      date: { gte: today },
      status: { not: "CANCELLED" },
    },
    include: appointmentInclude(),
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    take: limit,
  });
}

export async function getDashboardData() {
  const today = todayISO();
  const weekEnd = addDays(today, 7);

  const [barbers, todayAppointments, weekAppointments] = await Promise.all([
    getBarbers(),
    getTodayAppointments(today),
    prisma.appointment.findMany({
      where: {
        date: { gte: today, lt: weekEnd },
        status: { not: "CANCELLED" },
      },
      select: { id: true, date: true, serviceId: true },
    }),
  ]);

  const activeToday = todayAppointments.filter(
    (appointment) => appointment.status !== "CANCELLED",
  );

  const revenueToday = activeToday.reduce(
    (sum, appointment) => sum + appointment.service.price,
    0,
  );

  const weekday = isoWeekday(today);

  const barberLoads = barbers.map((barber) => {
    const schedule = barber.workingDays.find((day) => day.weekday === weekday);
    const intervals = activeToday.filter(
      (appointment) => appointment.barberId === barber.id,
    );
    const bookedMinutes = intervals.reduce(
      (sum, appointment) => sum + appointment.service.duration,
      0,
    );

    let workingMinutes = 0;
    if (schedule?.isWorking) {
      workingMinutes =
        timeToMinutes(schedule.endTime) - timeToMinutes(schedule.startTime);
      if (schedule.breakStart && schedule.breakEnd) {
        workingMinutes -=
          timeToMinutes(schedule.breakEnd) - timeToMinutes(schedule.breakStart);
      }
    }

    const load = workingMinutes
      ? Math.min(100, Math.round((bookedMinutes / workingMinutes) * 100))
      : 0;

    return {
      ...barber,
      isWorkingToday: Boolean(schedule?.isWorking),
      schedule: schedule ?? null,
      appointmentsCount: intervals.length,
      bookedMinutes,
      workingMinutes,
      load,
    };
  });

  const totalWorkingMinutes = barberLoads.reduce(
    (sum, barber) => sum + barber.workingMinutes,
    0,
  );
  const totalBookedMinutes = barberLoads.reduce(
    (sum, barber) => sum + barber.bookedMinutes,
    0,
  );
  const totalLoad = totalWorkingMinutes
    ? Math.round((totalBookedMinutes / totalWorkingMinutes) * 100)
    : 0;

  return {
    today,
    weekEnd,
    todayAppointments,
    activeToday,
    upcoming: activeToday.slice(0, 7),
    barberLoads,
    stats: {
      todayCount: activeToday.length,
      revenueToday,
      totalLoad,
      weekCount: weekAppointments.length,
      activeBarbers: barbers.length,
    },
  };
}

export type AdminAppointment = Awaited<
  ReturnType<typeof getAdminAppointments>
>["appointments"][number];

export async function getAdminAppointments(options: {
  range?: string;
  status?: string;
  date?: string;
}) {
  const today = todayISO();
  const where: {
    date?: { gte?: string; lte?: string; equals?: string };
    status?: string;
  } = {};

  if (options.date) {
    where.date = { equals: options.date };
  } else if (options.range === "today") {
    where.date = { equals: today };
  } else if (options.range === "week") {
    where.date = { gte: today, lte: addDays(today, 6) };
  } else if (options.range === "past") {
    where.date = { lte: addDays(today, -1) };
  }

  if (options.status && options.status !== "all") {
    where.status = options.status;
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: appointmentInclude(),
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
    take: 300,
  });

  return { appointments, today };
}

export async function getAppointmentStats() {
  const today = todayISO();
  const [todayCount, allCount, cancelledCount, doneCount] = await Promise.all([
    prisma.appointment.count({
      where: { date: today, status: { not: "CANCELLED" } },
    }),
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: "CANCELLED" } }),
    prisma.appointment.count({ where: { status: "DONE" } }),
  ]);

  return { todayCount, allCount, cancelledCount, doneCount };
}
