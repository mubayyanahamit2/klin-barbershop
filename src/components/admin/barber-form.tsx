"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Clock3,
  ImageIcon,
  Loader2,
  Palette,
  Save,
  Scissors,
  UserRound,
} from "lucide-react";
import type { BarberData } from "@/lib/types";
import { WEEKDAYS_FULL } from "@/lib/date";

const photoPresets = [
  { value: "/images/barber-1.jpg", label: "Портрет 01" },
  { value: "/images/barber-2.jpg", label: "Портрет 02" },
  { value: "/images/barber-3.jpg", label: "Портрет 03" },
  { value: "/images/barber-4.jpg", label: "Портрет 04" },
];

const accentPresets = ["#ff5c35", "#d6f45f", "#9fb5e8", "#d8c4a5", "#f2ebd9"];

type ScheduleState = {
  weekday: number;
  isWorking: boolean;
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
};

function defaultSchedule(): ScheduleState[] {
  return Array.from({ length: 7 }, (_, index) => {
    const weekday = index + 1;
    return {
      weekday,
      isWorking: weekday <= 6,
      startTime: "10:00",
      endTime: "21:00",
      breakStart: "14:00",
      breakEnd: "15:00",
    };
  });
}

function scheduleFromBarber(barber?: BarberData): ScheduleState[] {
  if (!barber) return defaultSchedule();

  return Array.from({ length: 7 }, (_, index) => {
    const weekday = index + 1;
    const day = barber.workingDays.find((item) => item.weekday === weekday);
    return {
      weekday,
      isWorking: day?.isWorking ?? false,
      startTime: day?.startTime ?? "10:00",
      endTime: day?.endTime ?? "21:00",
      breakStart: day?.breakStart ?? "",
      breakEnd: day?.breakEnd ?? "",
    };
  });
}

export function BarberForm({ barber }: { barber?: BarberData }) {
  const router = useRouter();
  const [name, setName] = useState(barber?.name ?? "");
  const [role, setRole] = useState(barber?.role ?? "Барбер");
  const [bio, setBio] = useState(barber?.bio ?? "");
  const [photo, setPhoto] = useState(barber?.photo ?? photoPresets[0].value);
  const [accent, setAccent] = useState(barber?.accent ?? accentPresets[0]);
  const [experience, setExperience] = useState(barber?.experience ?? 0);
  const [sortOrder, setSortOrder] = useState(barber?.sortOrder ?? 0);
  const [isActive, setIsActive] = useState(barber?.isActive ?? true);
  const [schedule, setSchedule] = useState<ScheduleState[]>(() =>
    scheduleFromBarber(barber),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateSchedule(weekday: number, patch: Partial<ScheduleState>) {
    setSchedule((current) =>
      current.map((day) =>
        day.weekday === weekday ? { ...day, ...patch } : day,
      ),
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (name.trim().length < 2) {
      setError("Укажите имя барбера");
      return;
    }

    if (!schedule.some((day) => day.isWorking)) {
      setError("Выберите хотя бы один рабочий день");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        barber ? `/api/admin/barbers/${barber.id}` : "/api/admin/barbers",
        {
          method: barber ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            role,
            bio,
            photo,
            accent,
            experience,
            sortOrder,
            isActive,
            schedule: schedule.map((day) => ({
              weekday: day.weekday,
              isWorking: day.isWorking,
              startTime: day.startTime,
              endTime: day.endTime,
              breakStart: day.breakStart || null,
              breakEnd: day.breakEnd || null,
            })),
          }),
        },
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error || "Не удалось сохранить барбера");
        return;
      }

      router.push("/admin/barbers");
      router.refresh();
    } catch {
      setError("Ошибка соединения. Попробуйте ещё раз.");
    } finally {
      setSaving(false);
    }
  }

  const workingDays = schedule.filter((day) => day.isWorking);
  const firstWorking = workingDays[0];

  return (
    <form onSubmit={submit}>
      <header className="mb-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <Link
            href="/admin/barbers"
            className="inline-flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.12em] text-paper/35 transition-colors hover:text-paper/70"
          >
            <ArrowLeft className="size-3.5" /> К команде
          </Link>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-[-0.06em] sm:text-4xl">
            {barber ? barber.name : "Новый барбер"}
          </h1>
          <p className="mt-2 text-xs text-paper/40">
            Настройте профиль и недельное расписание. Изменения сразу повлияют
            на доступные окна записи.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/barbers"
            className="flex h-11 items-center border border-paper/15 px-4 text-[10px] font-extrabold uppercase tracking-[0.1em] text-paper/55 transition-colors hover:border-paper/35 hover:text-paper"
          >
            Отмена
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex h-11 items-center gap-2 bg-lime px-4 text-[10px] font-extrabold uppercase tracking-[0.1em] text-ink transition-colors hover:bg-paper disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {saving ? "Сохраняем" : "Сохранить"}
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-5 border border-accent/30 bg-accent/[0.07] px-4 py-3 text-xs font-semibold text-accent">
          {error}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_330px] xl:items-start">
        <div className="space-y-5">
          <section className="border border-paper/10 bg-paper/[0.02]">
            <div className="flex items-center gap-2 border-b border-paper/10 px-5 py-4">
              <UserRound className="size-4 text-paper/35" />
              <h2 className="text-xs font-bold">Профиль</h2>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-[9px] font-extrabold uppercase tracking-[0.12em] text-paper/35">
                  Имя и фамилия
                </span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Артём Волков"
                  className="h-11 w-full border border-paper/15 bg-paper/[0.03] px-3 text-sm text-paper outline-none transition-colors placeholder:text-paper/20 focus:border-lime/50"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[9px] font-extrabold uppercase tracking-[0.12em] text-paper/35">
                  Роль / специализация
                </span>
                <input
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  placeholder="Барбер · фейд-мастер"
                  className="h-11 w-full border border-paper/15 bg-paper/[0.03] px-3 text-sm text-paper outline-none transition-colors placeholder:text-paper/20 focus:border-lime/50"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-[9px] font-extrabold uppercase tracking-[0.12em] text-paper/35">
                  Короткое описание
                </span>
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  rows={3}
                  maxLength={600}
                  placeholder="Чем мастер отличается, какой стиль любит..."
                  className="w-full resize-none border border-paper/15 bg-paper/[0.03] px-3 py-2.5 text-sm text-paper outline-none transition-colors placeholder:text-paper/20 focus:border-lime/50"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[9px] font-extrabold uppercase tracking-[0.12em] text-paper/35">
                  Опыт, лет
                </span>
                <input
                  type="number"
                  min={0}
                  max={70}
                  value={experience}
                  onChange={(event) => setExperience(Number(event.target.value))}
                  className="h-11 w-full border border-paper/15 bg-paper/[0.03] px-3 text-sm text-paper outline-none transition-colors focus:border-lime/50"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[9px] font-extrabold uppercase tracking-[0.12em] text-paper/35">
                  Порядок в списке
                </span>
                <input
                  type="number"
                  min={0}
                  max={999}
                  value={sortOrder}
                  onChange={(event) => setSortOrder(Number(event.target.value))}
                  className="h-11 w-full border border-paper/15 bg-paper/[0.03] px-3 text-sm text-paper outline-none transition-colors focus:border-lime/50"
                />
              </label>

              <div className="sm:col-span-2">
                <span className="mb-2 flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.12em] text-paper/35">
                  <ImageIcon className="size-3.5" /> Фотография
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {photoPresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setPhoto(preset.value)}
                      className={`group relative aspect-[4/5] overflow-hidden border-2 transition-all ${
                        photo === preset.value
                          ? "border-lime"
                          : "border-transparent opacity-55 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={preset.value}
                        alt={preset.label}
                        fill
                        sizes="120px"
                        className="object-cover"
                      />
                      {photo === preset.value && (
                        <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-lime text-ink">
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <span className="mb-2 flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.12em] text-paper/35">
                  <Palette className="size-3.5" /> Акцентный цвет
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {accentPresets.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Цвет ${color}`}
                      onClick={() => setAccent(color)}
                      className={`grid size-8 place-items-center border-2 transition-all ${
                        accent === color ? "border-paper" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {accent === color && (
                        <Check className="size-3.5 text-ink" strokeWidth={3} />
                      )}
                    </button>
                  ))}
                  <label className="ml-1 flex h-8 items-center gap-2 border border-paper/15 px-2 text-[9px] text-paper/35">
                    Свой
                    <input
                      type="color"
                      value={accent}
                      onChange={(event) => setAccent(event.target.value)}
                      className="size-5 cursor-pointer border-0 bg-transparent p-0"
                    />
                  </label>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsActive((value) => !value)}
                className="flex items-center justify-between border border-paper/15 bg-paper/[0.02] px-4 py-3 text-left sm:col-span-2"
              >
                <span>
                  <span className="block text-xs font-bold">Показывать на сайте</span>
                  <span className="mt-1 block text-[9px] text-paper/30">
                    Если выключить, мастер исчезнет из формы записи и бота
                  </span>
                </span>
                <span
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    isActive ? "bg-lime" : "bg-paper/15"
                  }`}
                >
                  <span
                    className={`absolute top-1 size-4 rounded-full bg-ink transition-transform ${
                      isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </span>
              </button>
            </div>
          </section>

          <section className="border border-paper/10 bg-paper/[0.02]">
            <div className="flex items-center justify-between border-b border-paper/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <Clock3 className="size-4 text-paper/35" />
                <h2 className="text-xs font-bold">Рабочее расписание</h2>
              </div>
              <span className="text-[9px] font-semibold text-paper/25">
                {workingDays.length} из 7 дней
              </span>
            </div>

            <div className="divide-y divide-paper/[0.07]">
              {schedule.map((day) => (
                <div
                  key={day.weekday}
                  className={`px-5 py-4 transition-opacity ${
                    day.isWorking ? "" : "opacity-45"
                  }`}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <button
                      type="button"
                      onClick={() =>
                        updateSchedule(day.weekday, {
                          isWorking: !day.isWorking,
                        })
                      }
                      className="flex w-40 shrink-0 items-center gap-3 text-left"
                    >
                      <span
                        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                          day.isWorking ? "bg-lime" : "bg-paper/15"
                        }`}
                      >
                        <span
                          className={`absolute top-1 size-3 rounded-full bg-ink transition-transform ${
                            day.isWorking ? "translate-x-5" : "translate-x-1"
                          }`}
                        />
                      </span>
                      <span className="text-[11px] font-bold">
                        {WEEKDAYS_FULL[day.weekday - 1]}
                      </span>
                    </button>

                    <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
                      <label>
                        <span className="mb-1 block text-[8px] font-bold uppercase tracking-[0.08em] text-paper/25">
                          Начало
                        </span>
                        <input
                          type="time"
                          value={day.startTime}
                          disabled={!day.isWorking}
                          onChange={(event) =>
                            updateSchedule(day.weekday, {
                              startTime: event.target.value,
                            })
                          }
                          className="h-9 w-full border border-paper/15 bg-paper/[0.03] px-2 text-[11px] text-paper outline-none focus:border-lime/50 disabled:cursor-not-allowed"
                        />
                      </label>
                      <label>
                        <span className="mb-1 block text-[8px] font-bold uppercase tracking-[0.08em] text-paper/25">
                          Конец
                        </span>
                        <input
                          type="time"
                          value={day.endTime}
                          disabled={!day.isWorking}
                          onChange={(event) =>
                            updateSchedule(day.weekday, {
                              endTime: event.target.value,
                            })
                          }
                          className="h-9 w-full border border-paper/15 bg-paper/[0.03] px-2 text-[11px] text-paper outline-none focus:border-lime/50 disabled:cursor-not-allowed"
                        />
                      </label>
                      <label>
                        <span className="mb-1 block text-[8px] font-bold uppercase tracking-[0.08em] text-paper/25">
                          Перерыв с
                        </span>
                        <input
                          type="time"
                          value={day.breakStart}
                          disabled={!day.isWorking}
                          onChange={(event) =>
                            updateSchedule(day.weekday, {
                              breakStart: event.target.value,
                            })
                          }
                          className="h-9 w-full border border-paper/15 bg-paper/[0.03] px-2 text-[11px] text-paper outline-none focus:border-lime/50 disabled:cursor-not-allowed"
                        />
                      </label>
                      <label>
                        <span className="mb-1 block text-[8px] font-bold uppercase tracking-[0.08em] text-paper/25">
                          По
                        </span>
                        <input
                          type="time"
                          value={day.breakEnd}
                          disabled={!day.isWorking}
                          onChange={(event) =>
                            updateSchedule(day.weekday, {
                              breakEnd: event.target.value,
                            })
                          }
                          className="h-9 w-full border border-paper/15 bg-paper/[0.03] px-2 text-[11px] text-paper outline-none focus:border-lime/50 disabled:cursor-not-allowed"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="xl:sticky xl:top-28">
          <div className="overflow-hidden border border-paper/10 bg-paper/[0.03]">
            <div className="relative aspect-[4/3]">
              <Image
                src={photo}
                alt={name || "Фото барбера"}
                fill
                sizes="330px"
                className="object-cover grayscale-[0.15]"
              />
              <div className="absolute inset-0 bg-linear-to-t from-ink to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-paper/40">
                  {experience} лет опыта
                </p>
                <p className="mt-1 font-display text-xl font-semibold tracking-[-0.05em]">
                  {name || "Имя барбера"}
                </p>
                <p className="mt-0.5 text-[10px] text-paper/45">
                  {role || "Специализация"}
                </p>
              </div>
              <span
                className="absolute right-3 top-3 size-3 rounded-full"
                style={{ backgroundColor: accent }}
              />
            </div>

            <div className="space-y-3 p-4">
              <div className="flex items-start gap-2 text-[10px] text-paper/40">
                <Scissors className="mt-0.5 size-3.5 shrink-0 text-lime" />
                <span>
                  {workingDays.length
                    ? `${workingDays.length} рабочих дней · ${firstWorking.startTime}–${firstWorking.endTime}`
                    : "Расписание не задано"}
                </span>
              </div>
              <div className="flex items-start gap-2 text-[10px] text-paper/40">
                <Check className="mt-0.5 size-3.5 shrink-0 text-lime" />
                <span>{isActive ? "Виден на сайте и в боте" : "Скрыт из записи"}</span>
              </div>
              <p className="border-t border-paper/10 pt-3 text-[9px] leading-4 text-paper/25">
                {bio || "Добавьте короткое описание — оно появится в карточке мастера."}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 bg-lime text-[10px] font-extrabold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-paper disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {saving ? "Сохраняем..." : "Сохранить изменения"}
          </button>
        </aside>
      </div>
    </form>
  );
}
