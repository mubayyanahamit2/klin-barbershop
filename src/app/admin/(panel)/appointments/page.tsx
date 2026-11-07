import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Download,
  Phone,
  XCircle,
} from "lucide-react";
import { AppointmentActions } from "@/components/admin/appointment-actions";
import { EmptyState, SourceBadge, StatusBadge } from "@/components/admin/ui";
import {
  getAdminAppointments,
  getAppointmentStats,
} from "@/lib/data";
import {
  formatDateHuman,
  formatPhone,
  formatPrice,
  publicBookingId,
} from "@/lib/date";

export const dynamic = "force-dynamic";

const ranges = [
  { value: "today", label: "Сегодня" },
  { value: "week", label: "7 дней" },
  { value: "all", label: "Все" },
  { value: "past", label: "Прошедшие" },
];

const statuses = [
  { value: "all", label: "Все статусы" },
  { value: "CONFIRMED", label: "Подтверждённые" },
  { value: "DONE", label: "Выполненные" },
  { value: "CANCELLED", label: "Отменённые" },
];

function filterUrl(range: string, status: string) {
  return `/admin/appointments?range=${range}&status=${status}`;
}

export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; status?: string }>;
}) {
  const params = await searchParams;
  const range = ranges.some((item) => item.value === params.range)
    ? (params.range as string)
    : "all";
  const status = statuses.some((item) => item.value === params.status)
    ? (params.status as string)
    : "all";

  const [{ appointments, today }, stats] = await Promise.all([
    getAdminAppointments({ range, status }),
    getAppointmentStats(),
  ]);

  const totalRevenue = appointments
    .filter((appointment) => appointment.status !== "CANCELLED")
    .reduce((sum, appointment) => sum + appointment.service.price, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-paper/35">
            Журнал записей
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-[-0.06em] sm:text-4xl">
            Записи клиентов
          </h1>
          <p className="mt-2 max-w-xl text-xs leading-5 text-paper/40">
            Все заявки с сайта и Telegram-бота. Подтверждайте визиты, закрывайте
            выполненные и отменяйте записи одним нажатием.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-10 items-center gap-2 border border-paper/10 px-3 text-[9px] font-bold text-paper/35">
            <span className="size-1.5 rounded-full bg-lime" />
            {appointments.length} в выборке
          </span>
          <span className="flex h-10 items-center gap-2 border border-paper/10 px-3 text-[9px] font-bold text-paper/35">
            <Download className="size-3.5" />
            {formatPrice(totalRevenue)}
          </span>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Сегодня", value: stats.todayCount, icon: CalendarDays },
          { label: "Всего записей", value: stats.allCount, icon: CalendarDays },
          { label: "Выполнено", value: stats.doneCount, icon: CheckCircle2 },
          { label: "Отменено", value: stats.cancelledCount, icon: XCircle },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between border border-paper/10 bg-paper/[0.025] px-4 py-3.5"
          >
            <div>
              <p className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-paper/30">
                {item.label}
              </p>
              <p className="mt-1 font-display text-2xl font-bold tracking-[-0.05em]">
                {item.value}
              </p>
            </div>
            <item.icon className="size-4 text-paper/20" strokeWidth={1.6} />
          </div>
        ))}
      </section>

      <section>
        <div className="flex flex-col gap-3 border-b border-paper/10 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="no-scrollbar flex gap-1 overflow-x-auto">
            {ranges.map((item) => (
              <Link
                key={item.value}
                href={filterUrl(item.value, status)}
                className={`flex h-8 shrink-0 items-center px-3 text-[9px] font-extrabold uppercase tracking-[0.1em] transition-colors ${
                  range === item.value
                    ? "bg-paper text-ink"
                    : "text-paper/40 hover:bg-paper/[0.05] hover:text-paper/70"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="no-scrollbar flex gap-1 overflow-x-auto">
            {statuses.map((item) => (
              <Link
                key={item.value}
                href={filterUrl(range, item.value)}
                className={`flex h-8 shrink-0 items-center px-3 text-[9px] font-extrabold uppercase tracking-[0.1em] transition-colors ${
                  status === item.value
                    ? "border border-paper/25 text-paper"
                    : "border border-transparent text-paper/35 hover:text-paper/65"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {appointments.length ? (
          <div className="mt-4 border border-paper/10 bg-paper/[0.02]">
            <div className="hidden grid-cols-[110px_1.1fr_1fr_1.1fr_auto] gap-4 border-b border-paper/10 px-4 py-3 text-[8px] font-extrabold uppercase tracking-[0.12em] text-paper/25 lg:grid">
              <span>Когда</span>
              <span>Клиент</span>
              <span>Услуга</span>
              <span>Барбер / статус</span>
              <span className="text-right">Действия</span>
            </div>

            <div className="divide-y divide-paper/[0.07]">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className={`grid gap-3 px-4 py-4 transition-colors hover:bg-paper/[0.02] lg:grid-cols-[110px_1.1fr_1fr_1.1fr_auto] lg:items-center lg:gap-4 ${
                    appointment.status === "CANCELLED" ? "opacity-55" : ""
                  }`}
                >
                  <div>
                    <p className="font-display text-base font-bold tracking-[-0.04em]">
                      {appointment.date === today
                        ? "Сегодня"
                        : formatDateHuman(appointment.date, { weekday: true })}
                    </p>
                    <p className="mt-1 text-[9px] font-semibold text-paper/35">
                      {appointment.startTime}–{appointment.endTime}
                    </p>
                    <span className="mt-1 hidden font-mono text-[8px] text-paper/20 xl:block">
                      {publicBookingId(appointment.id)}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold">
                      {appointment.clientName}
                    </p>
                    <a
                      href={`tel:${appointment.clientPhone}`}
                      className="mt-1 flex items-center gap-1.5 text-[9px] text-paper/35 hover:text-paper/65"
                    >
                      <Phone className="size-2.5" />
                      {formatPhone(appointment.clientPhone)}
                    </a>
                    {appointment.notes && (
                      <p className="mt-1 line-clamp-1 text-[9px] italic text-paper/25">
                        {appointment.notes}
                      </p>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-paper/75">
                      {appointment.service.name}
                    </p>
                    <p className="mt-1 text-[9px] text-paper/35">
                      {formatPrice(appointment.service.price)} ·{" "}
                      {appointment.service.duration} мин
                    </p>
                    <div className="mt-1">
                      <SourceBadge source={appointment.source} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 lg:block">
                    <p className="truncate text-[11px] font-semibold text-paper/70">
                      {appointment.barber.name}
                    </p>
                    <div className="mt-1.5">
                      <StatusBadge status={appointment.status} />
                    </div>
                  </div>

                  <div className="flex justify-start lg:justify-end">
                    <AppointmentActions
                      id={appointment.id}
                      status={appointment.status}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState
              title="Записей не найдено"
              description="Попробуйте изменить фильтры или дождитесь первой заявки с сайта либо Telegram-бота."
            />
          </div>
        )}
      </section>

      <p className="text-[9px] leading-4 text-paper/25">
        Показаны последние {appointments.length} записей по выбранному фильтру.
        Отменённая запись освобождает время и снова появляется в календаре.
      </p>
    </div>
  );
}
