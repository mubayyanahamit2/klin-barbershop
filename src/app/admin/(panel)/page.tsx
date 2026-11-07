import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Gauge,
  Plus,
  UsersRound,
} from "lucide-react";
import { AppointmentActions } from "@/components/admin/appointment-actions";
import { EmptyState, SourceBadge, StatusBadge } from "@/components/admin/ui";
import {
  getDashboardData,
  getUpcomingAppointments,
} from "@/lib/data";
import {
  formatDateHuman,
  formatPrice,
  formatPhone,
  publicBookingId,
} from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [data, upcoming] = await Promise.all([
    getDashboardData(),
    getUpcomingAppointments(8),
  ]);

  const stats = [
    {
      label: "Записей сегодня",
      value: String(data.stats.todayCount),
      note: "без отменённых",
      icon: CalendarDays,
    },
    {
      label: "Выручка дня",
      value: formatPrice(data.stats.revenueToday),
      note: "по подтверждённым",
      icon: CircleDollarSign,
    },
    {
      label: "Загрузка команды",
      value: `${data.stats.totalLoad}%`,
      note: "рабочего времени",
      icon: Gauge,
    },
    {
      label: "Клиентов за 7 дней",
      value: String(data.stats.weekCount),
      note: `${data.stats.activeBarbers} барбера в смене`,
      icon: UsersRound,
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.16em] text-paper/35">
            <span className="size-1.5 rounded-full bg-lime" />
            {formatDateHuman(data.today, { weekday: true, year: true })}
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-[-0.06em] sm:text-4xl">
            День под контролем
          </h1>
          <p className="mt-2 text-xs text-paper/40">
            Все записи, загрузка барберов и заявки с сайта и Telegram — здесь.
          </p>
        </div>
        <Link
          href="/booking"
          target="_blank"
          className="inline-flex h-11 items-center justify-between gap-6 bg-lime px-4 text-[10px] font-extrabold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-paper"
        >
          Новая запись <Plus className="size-4" />
        </Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="border border-paper/10 bg-paper/[0.025] p-5"
          >
            <div className="flex items-start justify-between">
              <span className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-paper/35">
                {stat.label}
              </span>
              <stat.icon className="size-4 text-paper/25" strokeWidth={1.6} />
            </div>
            <p className="mt-5 font-display text-3xl font-bold tracking-[-0.07em]">
              {stat.value}
            </p>
            <p className="mt-1 text-[9px] font-semibold text-paper/25">
              {stat.note}
            </p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.12fr_.88fr]">
        <section className="border border-paper/10 bg-paper/[0.02]">
          <div className="flex items-center justify-between border-b border-paper/10 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold">Загрузка команды</h2>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-paper/30">
                Сегодня · {formatDateHuman(data.today)}
              </p>
            </div>
            <Link
              href="/admin/barbers"
              className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-paper/40 transition-colors hover:text-lime"
            >
              Управлять <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-paper/[0.07]">
            {data.barberLoads.map((barber) => (
              <div
                key={barber.id}
                className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="relative size-10 shrink-0 overflow-hidden bg-paper/10">
                    <Image
                      src={barber.photo}
                      alt=""
                      fill
                      sizes="40px"
                      className="object-cover grayscale-[0.2]"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold">{barber.name}</p>
                    <p className="mt-1 text-[9px] text-paper/35">
                      {barber.isWorkingToday && barber.schedule
                        ? `${barber.schedule.startTime}–${barber.schedule.endTime} · ${barber.appointmentsCount} зап.`
                        : "Выходной"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:w-[42%]">
                  <div className="h-1.5 flex-1 overflow-hidden bg-paper/10">
                    <div
                      className="h-full bg-lime transition-all"
                      style={{ width: `${barber.load}%` }}
                    />
                  </div>
                  <span className="w-9 text-right font-display text-[11px] font-bold text-paper/70">
                    {barber.load}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-paper/10 bg-paper/[0.02]">
          <div className="flex items-center justify-between border-b border-paper/10 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold">Ближайшие записи</h2>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-paper/30">
                Сайт и Telegram
              </p>
            </div>
            <Link
              href="/admin/appointments"
              className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-paper/40 transition-colors hover:text-lime"
            >
              Все <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          {upcoming.length ? (
            <div className="divide-y divide-paper/[0.07]">
              {upcoming.slice(0, 5).map((appointment) => (
                <div key={appointment.id} className="px-5 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold">
                        {appointment.clientName}
                      </p>
                      <p className="mt-1 truncate text-[9px] text-paper/35">
                        {appointment.service.name} · {appointment.barber.name}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-[11px] font-bold">
                        {appointment.startTime}
                      </p>
                      <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-paper/25">
                        {formatDateHuman(appointment.date, { weekday: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4">
              <EmptyState
                title="Пока пусто"
                description="Новые записи появятся здесь автоматически."
              />
            </div>
          )}
        </section>
      </div>

      <section className="border border-paper/10 bg-paper/[0.02]">
        <div className="flex items-center justify-between border-b border-paper/10 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold">Расписание на сегодня</h2>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-paper/30">
              {data.todayAppointments.length} записей · включая отменённые
            </p>
          </div>
          <span className="hidden items-center gap-1.5 text-[9px] font-semibold text-paper/25 sm:flex">
            <Clock3 className="size-3.5" /> местное время
          </span>
        </div>

        {data.todayAppointments.length ? (
          <div className="divide-y divide-paper/[0.07]">
            {data.todayAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className={`grid gap-3 px-5 py-4 transition-colors hover:bg-paper/[0.02] sm:grid-cols-[70px_1.1fr_1fr_auto] sm:items-center ${
                  appointment.status === "CANCELLED" ? "opacity-50" : ""
                }`}
              >
                <div>
                  <p className="font-display text-lg font-bold tracking-[-0.04em]">
                    {appointment.startTime}
                  </p>
                  <p className="mt-0.5 text-[8px] font-semibold text-paper/25">
                    до {appointment.endTime}
                  </p>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-xs font-bold">
                      {appointment.clientName}
                    </p>
                    <StatusBadge status={appointment.status} />
                  </div>
                  <a
                    href={`tel:${appointment.clientPhone}`}
                    className="mt-1 block text-[9px] font-semibold text-paper/35 hover:text-paper/65"
                  >
                    {formatPhone(appointment.clientPhone)}
                  </a>
                </div>

                <div className="flex items-center gap-2 text-[9px] text-paper/40">
                  <span className="relative size-7 overflow-hidden bg-paper/10">
                    <Image
                      src={appointment.barber.photo}
                      alt=""
                      fill
                      sizes="28px"
                      className="object-cover"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-paper/70">
                      {appointment.barber.name}
                    </span>
                    <span className="block truncate">
                      {appointment.service.name}
                    </span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
                  <div className="flex items-center gap-3">
                    <SourceBadge source={appointment.source} />
                    <span className="hidden font-mono text-[8px] text-paper/20 xl:inline">
                      {publicBookingId(appointment.id)}
                    </span>
                  </div>
                  <AppointmentActions
                    id={appointment.id}
                    status={appointment.status}
                    compact
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              title="Сегодня записей нет"
              description="Можно отправить гостя на онлайн-запись или добавить запись вручную через календарь."
            >
              <Link
                href="/booking"
                target="_blank"
                className="mt-4 inline-flex items-center gap-2 bg-paper px-4 py-2 text-[9px] font-extrabold uppercase tracking-[0.1em] text-ink"
              >
                Открыть запись <ArrowUpRight className="size-3.5" />
              </Link>
            </EmptyState>
          </div>
        )}
      </section>
    </div>
  );
}
