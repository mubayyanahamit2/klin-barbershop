"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock3,
  Loader2,
  MessageSquare,
  Phone,
  Scissors,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { BarberData, ServiceData } from "@/lib/types";
import {
  formatDateHuman,
  formatDuration,
  formatMonth,
  formatPrice,
  getDateParts,
  isoWeekday,
  WEEKDAYS_SHORT,
} from "@/lib/date";

type BookingResult = {
  id: string;
  publicId: string;
  date: string;
  startTime: string;
  endTime: string;
  barber: string;
  service: string;
  price: number;
};

type Props = {
  services: ServiceData[];
  barbers: BarberData[];
  today: string;
  initialServiceId?: string;
  initialBarberId?: string;
};

function monthStart(date: string) {
  return `${date.slice(0, 7)}-01`;
}

function shiftMonth(month: string, delta: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const value = new Date(Date.UTC(year, monthNumber - 1 + delta, 1, 12));
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function monthLimit(today: string) {
  const [year, month] = today.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1 + 6, 1, 12));
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function scheduleLabel(days: BarberData["workingDays"]) {
  const working = days
    .filter((day) => day.isWorking)
    .map((day) => day.weekday)
    .sort((a, b) => a - b);

  if (!working.length) return "Нет дней";
  if (working.length === 7) return "Ежедневно";

  const groups: number[][] = [];
  for (const day of working) {
    const group = groups[groups.length - 1];
    if (group && day === group[group.length - 1] + 1) {
      group.push(day);
    } else {
      groups.push([day]);
    }
  }

  return groups
    .map((group) =>
      group.length === 1
        ? WEEKDAYS_SHORT[group[0] - 1]
        : `${WEEKDAYS_SHORT[group[0] - 1]}–${WEEKDAYS_SHORT[group[group.length - 1] - 1]}`,
    )
    .join(", ");
}

function StepHeading({
  number,
  title,
  description,
  complete,
  active,
}: {
  number: string;
  title: string;
  description: string;
  complete?: boolean;
  active?: boolean;
}) {
  return (
    <div className="flex items-start gap-4">
      <span
        className={`grid size-9 shrink-0 place-items-center text-[11px] font-extrabold ${
          complete
            ? "bg-accent text-ink"
            : active
              ? "bg-ink text-paper"
              : "border border-line text-muted"
        }`}
      >
        {complete ? <Check className="size-4" strokeWidth={2.5} /> : number}
      </span>
      <div>
        <h2 className="font-display text-xl font-semibold tracking-[-0.045em] sm:text-2xl">
          {title}
        </h2>
        <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
      </div>
    </div>
  );
}

export function BookingFlow({
  services,
  barbers,
  today,
  initialServiceId,
  initialBarberId,
}: Props) {
  const [serviceId, setServiceId] = useState(initialServiceId ?? "");
  const [barberId, setBarberId] = useState(initialBarberId ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [month, setMonth] = useState(() => monthStart(today));
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsMessage, setSlotsMessage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState<BookingResult | null>(null);
  const [requestKey, setRequestKey] = useState(0);
  const contactRef = useRef<HTMLElement>(null);

  const service = services.find((item) => item.id === serviceId) ?? null;
  const barber = barbers.find((item) => item.id === barberId) ?? null;

  const calendar = useMemo(() => {
    const { year, month: monthNumber } = getDateParts(month);
    const first = new Date(Date.UTC(year, monthNumber - 1, 1, 12));
    const daysInMonth = new Date(
      Date.UTC(year, monthNumber, 0, 12),
    ).getUTCDate();
    const leading = (first.getUTCDay() + 6) % 7;
    const cells: (string | null)[] = Array.from({ length: leading }, () => null);

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(
        `${year}-${String(monthNumber).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      );
    }

    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [month]);

  const dayAvailability = useMemo(() => {
    const map = new Map<number, { isWorking: boolean; start: string; end: string }>();
    if (!barber) return map;
    barber.workingDays.forEach((day) => {
      map.set(day.weekday, {
        isWorking: day.isWorking,
        start: day.startTime,
        end: day.endTime,
      });
    });
    return map;
  }, [barber]);

  useEffect(() => {
    if (!date || !barberId || !serviceId) return;

    const controller = new AbortController();

    fetch(
      `/api/availability?barberId=${encodeURIComponent(barberId)}&serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(date)}`,
      { signal: controller.signal, cache: "no-store" },
    )
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Ошибка загрузки");
        return payload as { slots: string[]; message?: string };
      })
      .then((payload) => {
        setSlots(payload.slots);
        setSlotsMessage(payload.message ?? null);
        setTime((current) =>
          Boolean(current) && payload.slots.includes(current) ? current : "",
        );
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        setSlots([]);
        setSlotsMessage("Не удалось загрузить свободное время");
      })
      .finally(() => {
        if (!controller.signal.aborted) setSlotsLoading(false);
      });

    return () => controller.abort();
  }, [date, barberId, serviceId, requestKey]);

  function chooseService(id: string) {
    setServiceId(id);
    setTime("");
    setSlots([]);
    setSlotsMessage(null);
    setSlotsLoading(Boolean(date && barberId));
    setErrors((current) => ({ ...current, service: "" }));
  }

  function chooseBarber(id: string) {
    setBarberId(id);
    setDate("");
    setTime("");
    setSlots([]);
    setSlotsMessage(null);
    setSlotsLoading(false);
    setErrors((current) => ({ ...current, barber: "" }));
  }

  function chooseDate(nextDate: string) {
    setDate(nextDate);
    setTime("");
    setSlots([]);
    setSlotsMessage(null);
    setSlotsLoading(Boolean(serviceId && barberId));
  }

  function isDisabledDay(day: string) {
    if (!barber) return true;
    if (day < today) return true;
    const info = dayAvailability.get(isoWeekday(day));
    return !info?.isWorking;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError("");
    const nextErrors: Record<string, string> = {};

    if (!serviceId) nextErrors.service = "Выберите услугу";
    if (!barberId) nextErrors.barber = "Выберите барбера";
    if (!date) nextErrors.date = "Выберите дату";
    if (!time) nextErrors.time = "Выберите время";
    if (name.trim().length < 2) nextErrors.name = "Укажите имя";
    if (phone.replace(/\D/g, "").length < 10) {
      nextErrors.phone = "Укажите телефон";
    }
    if (!agree) nextErrors.agree = "Подтвердите согласие";

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      if (nextErrors.name || nextErrors.phone || nextErrors.agree) {
        contactRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          barberId,
          date,
          startTime: time,
          clientName: name,
          clientPhone: phone,
          notes,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSubmitError(payload.error || "Не удалось создать запись");
        setErrors(payload.fields || {});
        if (response.status === 409) {
          setTime("");
          setSlotsLoading(true);
          setRequestKey((value) => value + 1);
        }
        return;
      }

      setSuccess(payload as BookingResult);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSubmitError("Проверьте соединение и попробуйте ещё раз");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setSuccess(null);
    setServiceId("");
    setBarberId("");
    setDate("");
    setTime("");
    setName("");
    setPhone("");
    setNotes("");
    setAgree(false);
    setErrors({});
    setSubmitError("");
    setMonth(monthStart(today));
  }

  if (success) {
    return (
      <section className="container-page py-14 lg:py-24">
        <div className="mx-auto max-w-2xl border border-line bg-paper-deep/40">
          <div className="border-b border-line bg-ink p-8 text-paper sm:p-12">
            <div className="grid size-14 place-items-center rounded-full bg-lime text-ink">
              <CircleCheck className="size-7" strokeWidth={2} />
            </div>
            <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.16em] text-paper/45">
              Запись подтверждена
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold uppercase leading-[0.95] tracking-[-0.07em] sm:text-5xl">
              Ждём вас
              <br />
              <span className="text-lime">в КЛИНЕ.</span>
            </h1>
            <p className="mt-5 text-sm leading-6 text-paper/55">
              Мы отправили детали в Telegram-группу барбершопа. Если планы
              изменятся — просто позвоните нам.
            </p>
          </div>

          <div className="p-6 sm:p-10">
            <div className="flex items-start justify-between gap-4 border-b border-line pb-5">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-muted">
                  Номер записи
                </p>
                <p className="mt-1 font-display text-2xl font-bold tracking-[-0.05em]">
                  {success.publicId}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-muted">
                  Стоимость
                </p>
                <p className="mt-1 font-display text-2xl font-bold tracking-[-0.05em]">
                  {formatPrice(success.price)}
                </p>
              </div>
            </div>

            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-[9px] font-bold uppercase tracking-[0.13em] text-muted">
                  Дата и время
                </dt>
                <dd className="mt-1 text-sm font-semibold">
                  {formatDateHuman(success.date, { weekday: true })}, {success.startTime}
                </dd>
              </div>
              <div>
                <dt className="text-[9px] font-bold uppercase tracking-[0.13em] text-muted">
                  Барбер
                </dt>
                <dd className="mt-1 text-sm font-semibold">{success.barber}</dd>
              </div>
              <div>
                <dt className="text-[9px] font-bold uppercase tracking-[0.13em] text-muted">
                  Услуга
                </dt>
                <dd className="mt-1 text-sm font-semibold">{success.service}</dd>
              </div>
              <div>
                <dt className="text-[9px] font-bold uppercase tracking-[0.13em] text-muted">
                  Адрес
                </dt>
                <dd className="mt-1 text-sm font-semibold">Малышева, 44</dd>
              </div>
            </dl>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex h-12 items-center justify-center gap-2 bg-ink px-5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-paper transition-colors hover:bg-accent hover:text-ink"
              >
                <ArrowLeft className="size-4" /> На главную
              </Link>
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-12 items-center justify-center gap-2 border border-ink/20 px-5 text-[10px] font-extrabold uppercase tracking-[0.12em] transition-colors hover:border-ink"
              >
                Записаться ещё <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const serviceComplete = Boolean(service);
  const barberComplete = Boolean(barber);
  const dateTimeComplete = Boolean(date && time);

  return (
    <form id="booking-form" onSubmit={submit}>
      <section className="container-page pt-10 lg:pt-14">
        <div className="flex flex-col justify-between gap-6 border-b border-line pb-8 lg:flex-row lg:items-end">
          <div>
            <span className="eyebrow text-muted">Онлайн-запись</span>
            <h1 className="mt-5 font-display text-[clamp(2.6rem,6vw,6.2rem)] font-bold uppercase leading-[0.86] tracking-[-0.085em]">
              Своё время.
              <br />
              <span className="text-accent">Свой барбер.</span>
            </h1>
          </div>
          <div className="max-w-sm lg:pb-2">
            <p className="text-sm leading-7 text-muted">
              Четыре шага, меньше минуты. Выберите услугу, мастера и удобное
              окно — остальное мы возьмём на себя.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-accent" /> без предоплаты
              </span>
              <span className="flex items-center gap-1.5">
                <Clock3 className="size-3.5 text-accent" /> точное время
              </span>
              <span className="flex items-center gap-1.5">
                <MessageSquare className="size-3.5 text-accent" /> напомним
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-6 py-8 lg:grid-cols-[1fr_350px] lg:items-start lg:gap-8 lg:py-12">
        <div className="space-y-5">
          <section className="border border-line bg-paper/60 p-5 sm:p-7">
            <StepHeading
              number="01"
              title="Услуга"
              description="Выберите, что нужно сделать."
              complete={serviceComplete}
              active={!serviceComplete}
            />
            {errors.service && (
              <p className="mt-4 text-xs font-semibold text-accent">{errors.service}</p>
            )}
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {services.map((item) => {
                const selected = serviceId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => chooseService(item.id)}
                    className={`group flex items-start justify-between gap-3 border p-4 text-left transition-all ${
                      selected
                        ? "border-ink bg-ink text-paper"
                        : "border-line bg-paper hover:border-ink/45"
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-extrabold">{item.name}</span>
                      <span
                        className={`mt-1 block text-[10px] font-semibold ${
                          selected ? "text-paper/45" : "text-muted"
                        }`}
                      >
                        {formatDuration(item.duration)} · {formatPrice(item.price)}
                      </span>
                    </span>
                    <span
                      className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border ${
                        selected
                          ? "border-lime bg-lime text-ink"
                          : "border-line text-transparent group-hover:border-ink/30"
                      }`}
                    >
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="border border-line bg-paper/60 p-5 sm:p-7">
            <StepHeading
              number="02"
              title="Барбер"
              description="К кому хотите попасть?"
              complete={barberComplete}
              active={serviceComplete && !barberComplete}
            />
            {errors.barber && (
              <p className="mt-4 text-xs font-semibold text-accent">{errors.barber}</p>
            )}
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {barbers.map((item) => {
                const selected = barberId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => chooseBarber(item.id)}
                    className={`group flex items-center gap-3 border p-3 text-left transition-all ${
                      selected ? "border-ink bg-ink text-paper" : "border-line bg-paper hover:border-ink/45"
                    }`}
                  >
                    <span className="relative size-14 shrink-0 overflow-hidden bg-paper-deep">
                      <Image
                        src={item.photo}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover grayscale-[0.2]"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-extrabold">
                        {item.name}
                      </span>
                      <span
                        className={`mt-1 block truncate text-[10px] font-semibold ${
                          selected ? "text-paper/45" : "text-muted"
                        }`}
                      >
                        {item.role}
                      </span>
                      <span
                        className={`mt-1 block text-[9px] font-bold uppercase tracking-[0.1em] ${
                          selected ? "text-lime" : "text-muted/80"
                        }`}
                      >
                        {scheduleLabel(item.workingDays)}
                      </span>
                    </span>
                    <span
                      className={`grid size-5 shrink-0 place-items-center rounded-full border ${
                        selected
                          ? "border-lime bg-lime text-ink"
                          : "border-line text-transparent group-hover:border-ink/30"
                      }`}
                    >
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="border border-line bg-paper/60 p-5 sm:p-7">
            <StepHeading
              number="03"
              title="Дата и время"
              description="Свободные окна обновляются в реальном времени."
              complete={dateTimeComplete}
              active={barberComplete && !dateTimeComplete}
            />
            {(errors.date || errors.time) && (
              <p className="mt-4 text-xs font-semibold text-accent">
                {errors.date || errors.time}
              </p>
            )}

            <div className="mt-6 grid gap-5 md:grid-cols-[1fr_1fr]">
              <div className="border border-line bg-paper p-4">
                <div className="flex items-center justify-between">
                  <p className="font-display text-sm font-semibold tracking-[-0.03em]">
                    {formatMonth(month)}
                  </p>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setMonth(shiftMonth(month, -1))}
                      disabled={month <= monthStart(today)}
                      aria-label="Предыдущий месяц"
                      className="grid size-8 place-items-center border border-line transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setMonth(shiftMonth(month, 1))}
                      disabled={month >= monthLimit(today)}
                      aria-label="Следующий месяц"
                      className="grid size-8 place-items-center border border-line transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-7 gap-1">
                  {WEEKDAYS_SHORT.map((day) => (
                    <span
                      key={day}
                      className="grid h-7 place-items-center text-[9px] font-extrabold uppercase text-muted"
                    >
                      {day}
                    </span>
                  ))}
                  {calendar.map((day, index) => {
                    if (!day) {
                      return <span key={`empty-${index}`} className="h-9" />;
                    }
                    const disabled = isDisabledDay(day);
                    const selected = date === day;
                    const isToday = day === today;
                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={disabled}
                        onClick={() => chooseDate(day)}
                        aria-label={formatDateHuman(day, { weekday: true })}
                        className={`relative grid h-9 place-items-center text-[11px] font-bold transition-colors ${
                          selected
                            ? "bg-ink text-paper"
                            : disabled
                              ? "cursor-not-allowed text-muted/30"
                              : "hover:bg-paper-deep"
                        }`}
                      >
                        {Number(day.slice(-2))}
                        {isToday && !selected && (
                          <span className="absolute bottom-1 size-1 rounded-full bg-accent" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {!barber && (
                  <p className="mt-4 border-t border-line pt-3 text-[10px] leading-4 text-muted">
                    Сначала выберите барбера — календарь покажет его рабочие дни.
                  </p>
                )}
              </div>

              <div className="border border-line bg-paper p-4">
                <div className="flex items-center justify-between">
                  <p className="font-display text-sm font-semibold tracking-[-0.03em]">
                    {date ? formatDateHuman(date, { weekday: true }) : "Время"}
                  </p>
                  {slotsLoading && (
                    <Loader2 className="size-4 animate-spin text-muted" />
                  )}
                </div>

                {!date && (
                  <div className="mt-5 flex min-h-40 flex-col items-center justify-center text-center">
                    <CalendarDays className="size-7 text-line" strokeWidth={1.5} />
                    <p className="mt-3 max-w-[190px] text-[10px] leading-4 text-muted">
                      Выберите дату в календаре, и мы покажем свободные окна.
                    </p>
                  </div>
                )}

                {date && !slotsLoading && !slots.length && (
                  <div className="mt-5 flex min-h-40 flex-col items-center justify-center text-center">
                    <Clock3 className="size-7 text-line" strokeWidth={1.5} />
                    <p className="mt-3 max-w-[200px] text-[10px] leading-4 text-muted">
                      {!serviceId
                        ? "Сначала выберите услугу."
                        : slotsMessage || "На эту дату свободных окон нет"}
                    </p>
                  </div>
                )}

                {date && slots.length > 0 && !slotsLoading && (
                  <div className="mt-4 grid grid-cols-3 gap-1.5">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => {
                          setTime(slot);
                          setErrors((current) => ({ ...current, time: "" }));
                        }}
                        className={`h-9 border text-[11px] font-bold transition-colors ${
                          time === slot
                            ? "border-ink bg-ink text-paper"
                            : "border-line bg-paper hover:border-ink"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section
            ref={contactRef}
            className="border border-line bg-paper/60 p-5 sm:p-7"
          >
            <StepHeading
              number="04"
              title="Контакты"
              description="Чтобы мы знали, кого ждать."
              complete={Boolean(name && phone)}
              active={dateTimeComplete}
            />

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-muted">
                  <UserRound className="size-3.5" /> Имя
                </span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Как к вам обращаться"
                  autoComplete="name"
                  className={`h-12 w-full border bg-paper px-4 text-sm outline-none transition-colors placeholder:text-muted/50 focus:border-ink ${
                    errors.name ? "border-accent" : "border-line"
                  }`}
                />
                {errors.name && (
                  <span className="mt-1 block text-[10px] font-semibold text-accent">
                    {errors.name}
                  </span>
                )}
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-muted">
                  <Phone className="size-3.5" /> Телефон
                </span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+7 (___) ___-__-__"
                  inputMode="tel"
                  autoComplete="tel"
                  className={`h-12 w-full border bg-paper px-4 text-sm outline-none transition-colors placeholder:text-muted/50 focus:border-ink ${
                    errors.phone ? "border-accent" : "border-line"
                  }`}
                />
                {errors.phone && (
                  <span className="mt-1 block text-[10px] font-semibold text-accent">
                    {errors.phone}
                  </span>
                )}
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-[9px] font-extrabold uppercase tracking-[0.12em] text-muted">
                  Комментарий <span className="normal-case tracking-normal">(необязательно)</span>
                </span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Например: нужен совет по укладке"
                  rows={3}
                  maxLength={300}
                  className="w-full resize-none border border-line bg-paper px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted/50 focus:border-ink"
                />
              </label>
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={agree}
                onChange={(event) => {
                  setAgree(event.target.checked);
                  setErrors((current) => ({ ...current, agree: "" }));
                }}
                className="mt-0.5 size-4 shrink-0 accent-[#141510]"
              />
              <span className="text-[10px] leading-4 text-muted">
                Согласен с обработкой персональных данных и правилами
                барбершопа. Подтверждение придёт в Telegram-группу барбершопа.
              </span>
            </label>
            {errors.agree && (
              <p className="mt-2 text-[10px] font-semibold text-accent">
                {errors.agree}
              </p>
            )}

            {submitError && (
              <div className="mt-5 border border-accent/30 bg-accent/5 px-4 py-3 text-xs font-semibold text-accent">
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 flex h-14 w-full items-center justify-between bg-ink px-6 text-[11px] font-extrabold uppercase tracking-[0.13em] text-paper transition-colors hover:bg-accent hover:text-ink disabled:cursor-wait disabled:opacity-60 lg:hidden"
            >
              {submitting ? "Записываем..." : "Подтвердить запись"}
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowUpRightIcon />
              )}
            </button>
          </section>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-32 overflow-hidden border border-ink bg-ink text-paper">
            <div className="border-b border-paper/12 p-6">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-paper/40">
                Ваша запись
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.05em]">
                {service ? service.name : "Выберите услугу"}
              </h2>
              <p className="mt-1 text-xs text-paper/45">
                {service
                  ? `${formatDuration(service.duration)} · ${barber ? barber.name : "барбер не выбран"}`
                  : "Начните с первого шага"}
              </p>
            </div>

            <div className="space-y-4 p-6 text-xs">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-lime" />
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-paper/35">
                    Дата
                  </p>
                  <p className="mt-1 font-semibold text-paper/85">
                    {date ? formatDateHuman(date, { weekday: true }) : "Не выбрана"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 size-4 shrink-0 text-lime" />
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-paper/35">
                    Время
                  </p>
                  <p className="mt-1 font-semibold text-paper/85">
                    {time || "Не выбрано"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Scissors className="mt-0.5 size-4 shrink-0 text-lime" />
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-paper/35">
                    Барбер
                  </p>
                  <p className="mt-1 font-semibold text-paper/85">
                    {barber ? barber.name : "Не выбран"}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-paper/12 p-6">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-paper/35">
                    Итого
                  </p>
                  <p className="mt-1 font-display text-3xl font-bold tracking-[-0.06em]">
                    {service ? formatPrice(service.price) : "—"}
                  </p>
                </div>
                <p className="pb-1 text-[9px] font-semibold text-paper/35">
                  оплата на месте
                </p>
              </div>
              <button
                type="submit"
                form="booking-form"
                disabled={submitting}
                className="mt-5 flex h-12 w-full items-center justify-between bg-lime px-4 text-[10px] font-extrabold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-paper disabled:cursor-wait disabled:opacity-60"
              >
                {submitting ? "Записываем..." : "Подтвердить"}
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ArrowRight className="size-4" />
                )}
              </button>
              <p className="mt-3 text-center text-[9px] leading-4 text-paper/30">
                Отмена бесплатная. Просто позвоните за пару часов.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}

function ArrowUpRightIcon() {
  return <ArrowRight className="size-4" />;
}
