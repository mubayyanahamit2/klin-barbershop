import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  Plus,
  Sparkles,
} from "lucide-react";
import { EmptyState } from "@/components/admin/ui";
import { getBarbers, getDashboardData } from "@/lib/data";
import { WEEKDAYS_SHORT } from "@/lib/date";

export const dynamic = "force-dynamic";

function scheduleLabel(days: { weekday: number; isWorking: boolean }[]) {
  const working = days
    .filter((day) => day.isWorking)
    .map((day) => day.weekday)
    .sort((a, b) => a - b);

  if (!working.length) return "Нет рабочих дней";
  if (working.length === 7) return "Ежедневно";

  return working.map((day) => WEEKDAYS_SHORT[day - 1]).join(", ");
}

export default async function AdminBarbersPage() {
  const [barbers, dashboard] = await Promise.all([
    getBarbers(true),
    getDashboardData(),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-paper/35">
            Команда · {barbers.length} человек
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-[-0.06em] sm:text-4xl">
            Барберы и расписание
          </h1>
          <p className="mt-2 max-w-xl text-xs leading-5 text-paper/40">
            Управляйте составом команды, рабочими днями, перерывами и
            видимостью мастеров на сайте и в Telegram-боте.
          </p>
        </div>
        <Link
          href="/admin/barbers/new"
          className="inline-flex h-11 items-center justify-between gap-6 bg-lime px-4 text-[10px] font-extrabold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-paper"
        >
          Добавить барбера <Plus className="size-4" />
        </Link>
      </header>

      {barbers.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {barbers.map((barber) => {
            const load = dashboard.barberLoads.find(
              (item) => item.id === barber.id,
            );
            return (
              <article
                key={barber.id}
                className={`overflow-hidden border bg-paper/[0.02] ${
                  barber.isActive ? "border-paper/10" : "border-paper/[0.07] opacity-60"
                }`}
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="relative h-52 w-full shrink-0 overflow-hidden bg-paper/10 sm:h-auto sm:w-[38%] sm:min-h-[220px]">
                    <Image
                      src={barber.photo}
                      alt={barber.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 20vw"
                      className="object-cover grayscale-[0.15]"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-ink/70 to-transparent sm:bg-linear-to-r" />
                    <span
                      className={`absolute left-3 top-3 inline-flex h-6 items-center gap-1.5 border px-2 text-[8px] font-extrabold uppercase tracking-[0.1em] ${
                        barber.isActive
                          ? "border-lime/30 bg-ink/70 text-lime"
                          : "border-paper/20 bg-ink/70 text-paper/45"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          barber.isActive ? "bg-lime" : "bg-paper/30"
                        }`}
                      />
                      {barber.isActive ? "Активен" : "Скрыт"}
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-display text-xl font-semibold tracking-[-0.05em]">
                          {barber.name}
                        </h2>
                        <p className="mt-1 text-[10px] font-semibold text-paper/40">
                          {barber.role}
                        </p>
                      </div>
                      <span className="text-[9px] font-bold text-paper/25">
                        {barber.experience} лет
                      </span>
                    </div>

                    <div className="mt-5 flex items-start gap-2 text-[10px] text-paper/45">
                      <CalendarClock className="mt-0.5 size-3.5 shrink-0 text-paper/25" />
                      <div>
                        <p className="font-semibold">
                          {scheduleLabel(barber.workingDays)}
                        </p>
                        <p className="mt-1 text-[9px] text-paper/25">
                          {barber.workingDays.find((day) => day.isWorking)?.startTime ??
                            "—"}
                          –
                          {barber.workingDays.find((day) => day.isWorking)?.endTime ??
                            "—"}
                          {barber.workingDays.find((day) => day.isWorking)?.breakStart
                            ? ` · перерыв ${barber.workingDays.find((day) => day.isWorking)?.breakStart}–${barber.workingDays.find((day) => day.isWorking)?.breakEnd}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.09em]">
                        <span className="text-paper/30">Загрузка сегодня</span>
                        <span className="text-paper/60">
                          {load?.isWorkingToday ? `${load.load}%` : "Выходной"}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden bg-paper/10">
                        <div
                          className={`h-full ${load?.isWorkingToday ? "bg-lime" : "bg-paper/20"}`}
                          style={{ width: `${load?.load ?? 0}%` }}
                        />
                      </div>
                      <p className="mt-2 text-[9px] text-paper/25">
                        {load?.isWorkingToday
                          ? `${load?.appointmentsCount ?? 0} записей · ${Math.round(((load?.bookedMinutes ?? 0) / 60) * 10) / 10} ч занято`
                          : "Сегодня не работает"}
                      </p>
                    </div>

                    <Link
                      href={`/admin/barbers/${barber.id}`}
                      className="mt-auto flex h-9 items-center justify-between border border-paper/15 px-3 text-[9px] font-extrabold uppercase tracking-[0.1em] text-paper/60 transition-colors hover:border-paper/40 hover:text-paper"
                    >
                      Редактировать <ArrowUpRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="В команде пока никого"
          description="Добавьте первого барбера, настройте рабочие дни — он сразу появится на сайте и в боте."
        >
          <Link
            href="/admin/barbers/new"
            className="mt-4 inline-flex items-center gap-2 bg-lime px-4 py-2 text-[9px] font-extrabold uppercase tracking-[0.1em] text-ink"
          >
            Добавить барбера <Plus className="size-3.5" />
          </Link>
        </EmptyState>
      )}

      <div className="flex flex-col gap-3 border border-paper/10 bg-paper/[0.02] p-5 sm:flex-row sm:items-start">
        <Sparkles className="size-4 shrink-0 text-lime" strokeWidth={1.6} />
        <p className="max-w-3xl text-[10px] leading-5 text-paper/35">
          Скрытый барбер остаётся в истории записей, но пропадает из формы
          онлайн-записи и Telegram-бота. Расписание применяется к новым слотам
          сразу — после сохранения.
        </p>
      </div>
    </div>
  );
}
