import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Clock3,
  MapPin,
  MoveUpRight,
  Scissors,
  Sparkles,
} from "lucide-react";
import { Marquee } from "@/components/site/marquee";
import { getBarbers, getServices } from "@/lib/data";
import {
  formatDuration,
  formatPrice,
  WEEKDAYS_SHORT,
} from "@/lib/date";

export const dynamic = "force-dynamic";

function scheduleLabel(days: { weekday: number; isWorking: boolean }[]) {
  const working = days
    .filter((day) => day.isWorking)
    .map((day) => day.weekday)
    .sort((a, b) => a - b);

  if (!working.length) return "Нет рабочих дней";
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
    .map((group) => {
      if (group.length === 1) return WEEKDAYS_SHORT[group[0] - 1];
      return `${WEEKDAYS_SHORT[group[0] - 1]}–${WEEKDAYS_SHORT[group[group.length - 1] - 1]}`;
    })
    .join(", ");
}

const reviews = [
  {
    name: "Илья С.",
    service: "Стрижка + борода",
    text: "Пришёл первый раз и остался на два года. Артём понимает форму без объяснений. Отдельный респект за музыку и кофе.",
  },
  {
    name: "Максим К.",
    service: "Фейд",
    text: "Данила делает самый чистый переход, который я видел в Екатеринбурге. Через три недели стрижка всё ещё держит форму.",
  },
  {
    name: "Роман Г.",
    service: "Королевское бритьё",
    text: "Это не услуга, а час тишины. Горячее полотенце, опасная бритва, никакой суеты. Выходишь другим человеком.",
  },
];

export default async function HomePage() {
  const [services, barbers] = await Promise.all([getServices(), getBarbers()]);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="container-page">
          <div className="grid items-center gap-10 pb-10 pt-8 md:pt-12 lg:min-h-[calc(100svh-110px)] lg:grid-cols-[1.04fr_.96fr] lg:gap-14 lg:pb-16 lg:pt-10">
            <div className="relative z-10">
              <div className="rise flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-2 border border-ink/20 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em]">
                  <span className="size-1.5 rounded-full bg-accent pulse-soft" />
                  Барбершоп · Екатеринбург
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                  Работаем с 2018
                </span>
              </div>

              <h1 className="rise mt-7 font-display text-[clamp(3.15rem,8.3vw,8.1rem)] font-extrabold uppercase leading-[0.84] tracking-[-0.085em] [animation-delay:80ms]">
                Форма,
                <br />
                которая
                <br />
                <span className="relative inline-block text-accent">
                  говорит.
                  <span className="absolute -bottom-2 left-0 h-[5px] w-[30%] bg-ink lg:h-2" />
                </span>
              </h1>

              <div className="rise mt-8 flex max-w-xl flex-col gap-6 [animation-delay:160ms] sm:flex-row sm:items-end sm:justify-between">
                <p className="max-w-[340px] text-pretty text-sm leading-7 text-muted">
                  Не просто стрижка, а точная работа с характером. Четыре
                  барбера, своя атмосфера и запись без звонков — за 30 секунд.
                </p>
                <div className="flex shrink-0 flex-col items-start gap-2">
                  <span className="font-display text-3xl font-bold leading-none tracking-[-0.06em]">
                    4.9
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                    рейтинг гостей
                  </span>
                </div>
              </div>

              <div className="rise mt-8 flex flex-col gap-3 [animation-delay:240ms] sm:flex-row">
                <Link
                  href="/booking"
                  className="group inline-flex h-14 items-center justify-between gap-8 bg-ink px-6 text-[11px] font-extrabold uppercase tracking-[0.14em] text-paper transition-colors hover:bg-accent hover:text-ink sm:min-w-[230px]"
                >
                  Выбрать время
                  <ArrowUpRight className="size-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </Link>
                <Link
                  href="#services"
                  className="inline-flex h-14 items-center justify-between gap-8 border border-ink/25 px-6 text-[11px] font-extrabold uppercase tracking-[0.14em] transition-colors hover:border-ink hover:bg-paper-deep sm:min-w-[220px]"
                >
                  Услуги и цены
                  <ArrowDown className="size-4" />
                </Link>
              </div>

              <div className="mt-10 hidden grid-cols-3 border-t border-line pt-5 sm:grid">
                {[
                  ["08", "лет на Малышева"],
                  ["12k+", "стрижек сделано"],
                  ["6", "услуг в меню"],
                ].map(([value, label]) => (
                  <div key={label} className="border-r border-line px-5 first:pl-0 last:border-0">
                    <p className="font-display text-2xl font-bold tracking-[-0.06em]">
                      {value}
                    </p>
                    <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.13em] text-muted">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[580px] lg:max-w-none">
              <div className="absolute -right-3 top-8 hidden h-[85%] w-[88%] bg-accent sm:block" />
              <div className="relative ml-auto w-[92%] overflow-hidden bg-ink-soft sm:w-[88%]">
                <div className="relative aspect-[4/5]">
                  <Image
                    src="/images/hero.jpg"
                    alt="Барбер за работой в барбершопе КЛИН"
                    fill
                    priority
                    sizes="(max-width: 1024px) 90vw, 46vw"
                    className="object-cover grayscale-[0.15]"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-ink/65 via-transparent to-transparent" />
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-paper sm:p-7">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-paper/55">
                      не просто барбершоп
                    </p>
                    <p className="mt-1 max-w-[230px] font-display text-lg font-semibold leading-tight tracking-[-0.04em]">
                      Место, где форму собирают по частям.
                    </p>
                  </div>
                  <span className="hidden border border-paper/30 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] sm:block">
                    Est. 2018
                  </span>
                </div>
              </div>

              <div className="absolute -bottom-5 left-0 z-10 bg-paper p-4 shadow-[0_20px_60px_rgba(20,21,16,0.12)] sm:-left-5 sm:p-5">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-muted">
                  Ближайшая запись
                </p>
                <p className="mt-1 font-display text-xl font-bold tracking-[-0.06em]">
                  Сегодня
                </p>
                <Link
                  href="/booking"
                  className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-accent"
                >
                  Смотреть окна <ArrowRight className="size-3.5" />
                </Link>
              </div>

              <div className="absolute right-0 top-0 z-10 grid size-24 -translate-y-1/2 translate-x-1/4 place-items-center rounded-full bg-lime text-ink sm:size-28 lg:size-32">
                <div className="absolute inset-2 rounded-full border border-dashed border-ink/30 spin-slow" />
                <span className="relative font-display text-[10px] font-extrabold uppercase leading-[1.4] tracking-[0.08em] text-center">
                  Онлайн
                  <br />
                  запись
                  <br />
                  24/7
                </span>
              </div>

              <span className="absolute -left-7 top-1/2 hidden -translate-y-1/2 -rotate-90 text-[9px] font-bold uppercase tracking-[0.3em] text-muted lg:block">
                Klin barber club
              </span>
            </div>
          </div>
        </div>
      </section>

      <Marquee />

      <section id="services" className="container-page py-20 lg:py-32">
        <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-20">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <span className="eyebrow text-muted">01 / Услуги</span>
            <h2 className="mt-7 font-display text-[clamp(2.5rem,5.3vw,5.3rem)] font-bold uppercase leading-[0.9] tracking-[-0.075em]">
              Не просто
              <br />
              стрижка.
              <br />
              <span className="text-accent">Ритуал.</span>
            </h2>
            <p className="mt-7 max-w-sm text-sm leading-7 text-muted">
              Начинаем с разговора, заканчиваем формой, которую хочется
              повторить. Каждая услуга — с мытьём, укладкой и честной
              консультацией.
            </p>
            <Link
              href="/booking"
              className="mt-8 inline-flex items-center gap-3 border-b border-ink pb-2 text-[11px] font-extrabold uppercase tracking-[0.12em] transition-colors hover:border-accent hover:text-accent"
            >
              Записаться на услугу <MoveUpRight className="size-4" />
            </Link>
          </div>

          <div className="border-t border-line">
            {services.map((service, index) => (
              <Link
                href={`/booking?service=${service.id}`}
                key={service.id}
                className="group grid grid-cols-[36px_1fr_auto] items-start gap-4 border-b border-line py-6 transition-colors hover:bg-paper-deep/55 sm:grid-cols-[48px_1fr_100px_100px_32px] sm:items-center sm:gap-5 lg:py-7"
              >
                <span className="pt-1 text-[10px] font-extrabold text-muted sm:pt-0">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold leading-tight tracking-[-0.045em] transition-transform duration-300 group-hover:translate-x-1 sm:text-xl">
                    {service.name}
                  </h3>
                  <p className="mt-2 max-w-md text-xs leading-5 text-muted">
                    {service.description}
                  </p>
                </div>
                <span className="hidden items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted sm:flex">
                  <Clock3 className="size-3.5" />
                  {formatDuration(service.duration)}
                </span>
                <span className="hidden text-right font-display text-sm font-semibold tracking-[-0.03em] sm:block">
                  {formatPrice(service.price)}
                </span>
                <span className="grid size-8 place-items-center border border-line transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-ink">
                  <ArrowUpRight className="size-4" />
                </span>
                <span className="col-start-2 mt-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.1em] text-muted sm:hidden">
                  <span>{formatDuration(service.duration)}</span>
                  <span className="font-display text-xs text-ink">
                    {formatPrice(service.price)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="bg-ink text-paper">
        <div className="container-page grid gap-10 py-20 lg:grid-cols-[.85fr_1.15fr] lg:gap-20 lg:py-32">
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden bg-ink-soft lg:aspect-[4/4.6]">
              <Image
                src="/images/barber-3.jpg"
                alt="Атмосфера барбершопа КЛИН"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover grayscale-[0.1]"
              />
              <div className="absolute inset-0 bg-linear-to-t from-ink/50 to-transparent" />
            </div>
            <div className="absolute -right-4 -top-4 flex size-24 flex-col items-center justify-center bg-accent text-ink sm:size-28">
              <span className="font-display text-3xl font-black tracking-[-0.08em]">
                08
              </span>
              <span className="text-[8px] font-extrabold uppercase tracking-[0.13em]">
                лет вместе
              </span>
            </div>
            <p className="absolute bottom-5 left-5 max-w-[210px] text-[10px] font-bold uppercase leading-5 tracking-[0.12em] text-paper/65">
              Малышева, 44 · второй этаж · вход со двора
            </p>
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <span className="eyebrow text-paper/45">02 / Манифест</span>
              <h2 className="mt-8 max-w-3xl font-display text-[clamp(2.4rem,4.8vw,4.8rem)] font-semibold uppercase leading-[0.95] tracking-[-0.07em]">
                Стрижка — это
                <br />
                не про волосы.
                <br />
                <span className="text-lime">Это про то,</span>
                <br />
                как вы выходите
                <br />
                в мир.
              </h2>
            </div>

            <div className="mt-12 grid gap-8 border-t border-paper/15 pt-8 sm:grid-cols-2 lg:mt-16">
              <p className="text-sm leading-7 text-paper/55">
                Мы не гонимся за трендами ради трендов. Сначала слушаем, потом
                стрижём. Наша задача — не удивить вас в кресле, а сделать так,
                чтобы через месяц вы всё ещё выглядели точно.
              </p>
              <div className="space-y-5">
                {[
                  ["4", "барбера в команде"],
                  ["12 000+", "гостей с 2018 года"],
                  ["4.9 / 5", "средняя оценка"],
                ].map(([value, label]) => (
                  <div key={label} className="flex items-baseline justify-between gap-4 border-b border-paper/10 pb-3">
                    <span className="font-display text-xl font-semibold tracking-[-0.05em] text-lime">
                      {value}
                    </span>
                    <span className="text-right text-[9px] font-bold uppercase tracking-[0.12em] text-paper/45">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="barbers" className="container-page py-20 lg:py-32">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <span className="eyebrow text-muted">03 / Команда</span>
            <h2 className="mt-7 font-display text-[clamp(2.6rem,5.3vw,5.3rem)] font-bold uppercase leading-[0.9] tracking-[-0.075em]">
              Кто держит
              <br />
              <span className="text-accent">форму</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-7 text-muted lg:pb-2">
            У каждого — свой почерк, но общий стандарт: точная геометрия,
            внимание к деталям и никакой спешки.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-5">
          {barbers.map((barber, index) => (
            <Link
              key={barber.id}
              href={`/booking?barber=${barber.slug}`}
              className="group relative overflow-hidden bg-ink-soft"
            >
              <div className="relative aspect-[4/5]">
                <Image
                  src={barber.photo}
                  alt={barber.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover grayscale-[0.15] transition duration-700 group-hover:scale-[1.04] group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/10 to-transparent" />
                <span className="absolute left-4 top-4 grid size-7 place-items-center bg-paper/90 text-[10px] font-extrabold text-ink">
                  0{index + 1}
                </span>
                <div className="absolute inset-x-0 bottom-0 p-5 text-paper">
                  <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-paper/55">
                    {scheduleLabel(barber.workingDays)} · {barber.experience} лет опыта
                  </p>
                  <h3 className="mt-2 font-display text-xl font-semibold tracking-[-0.05em]">
                    {barber.name}
                  </h3>
                  <p className="mt-1 text-xs text-paper/65">{barber.role}</p>
                  <span className="mt-4 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-lime">
                    Записаться
                    <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-paper-deep/55">
        <div className="container-page py-20 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
            <div>
              <span className="eyebrow text-muted">04 / Отзывы</span>
              <h2 className="mt-7 font-display text-[clamp(2.2rem,4.2vw,4rem)] font-bold uppercase leading-[0.92] tracking-[-0.07em]">
                Говорят
                <br />
                гости
              </h2>
              <div className="mt-7 flex items-center gap-3">
                <span className="font-display text-4xl font-bold tracking-[-0.08em]">
                  4.9
                </span>
                <div>
                  <p className="text-sm tracking-[0.15em] text-accent">★★★★★</p>
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
                    по 870 отзывам
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {reviews.map((review, index) => (
                <article
                  key={review.name}
                  className="flex flex-col justify-between border border-line bg-paper p-5"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
                        {review.service}
                      </span>
                      <span className="text-[10px] tracking-[0.12em] text-accent">
                        ★★★★★
                      </span>
                    </div>
                    <p className="mt-8 text-sm leading-6 text-ink/80">
                      «{review.text}»
                    </p>
                  </div>
                  <div className="mt-8 flex items-center justify-between border-t border-line pt-3">
                    <span className="text-xs font-extrabold">{review.name}</span>
                    <span className="text-[9px] font-bold text-muted">
                      0{index + 1}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-16 lg:py-24">
        <div className="relative overflow-hidden bg-ink px-6 py-14 text-paper sm:px-10 lg:px-16 lg:py-20">
          <div className="absolute right-0 top-0 hidden h-full w-[38%] border-l border-paper/10 lg:block">
            <div className="absolute inset-0 map-grid opacity-20" />
            <div className="absolute left-1/2 top-1/2 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-lime/30" />
            <div className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-lime/50" />
            <div className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime" />
          </div>
          <div className="relative z-10 max-w-3xl">
            <span className="eyebrow text-paper/45">Онлайн-запись</span>
            <h2 className="mt-7 font-display text-[clamp(2.7rem,6.2vw,6.6rem)] font-bold uppercase leading-[0.85] tracking-[-0.08em]">
              Ваше кресло
              <br />
              <span className="text-lime">свободно.</span>
            </h2>
            <p className="mt-7 max-w-md text-sm leading-7 text-paper/55">
              Выберите услугу, барбера, день и время. Без звонков, очередей и
              переписок — всё займёт меньше минуты.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/booking"
                className="group inline-flex h-14 items-center justify-between gap-10 bg-lime px-6 text-[11px] font-extrabold uppercase tracking-[0.13em] text-ink transition-colors hover:bg-paper sm:min-w-[240px]"
              >
                Открыть календарь
                <ArrowUpRight className="size-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Link>
              <a
                href="tel:+73432884418"
                className="inline-flex h-14 items-center justify-center border border-paper/20 px-6 text-[11px] font-extrabold uppercase tracking-[0.13em] transition-colors hover:border-paper hover:bg-paper hover:text-ink"
              >
                Или позвонить
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="contacts" className="container-page pb-20 lg:pb-32">
        <div className="grid overflow-hidden border border-line lg:grid-cols-2">
          <div className="p-7 sm:p-10 lg:p-14">
            <span className="eyebrow text-muted">05 / Контакты</span>
            <h2 className="mt-6 font-display text-[clamp(2.2rem,4vw,3.8rem)] font-bold uppercase leading-[0.92] tracking-[-0.07em]">
              Заходите
              <br />
              на огонёк
            </h2>

            <div className="mt-10 grid gap-7 sm:grid-cols-2">
              <div>
                <p className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.14em] text-muted">
                  <MapPin className="size-3.5 text-accent" /> Адрес
                </p>
                <p className="mt-3 text-sm font-semibold leading-6">
                  Екатеринбург,
                  <br />
                  ул. Малышева, 44
                </p>
                <p className="mt-1 text-xs text-muted">2 этаж, вход со двора</p>
              </div>
              <div>
                <p className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.14em] text-muted">
                  <Clock3 className="size-3.5 text-accent" /> Время работы
                </p>
                <p className="mt-3 text-sm font-semibold leading-6">
                  Ежедневно
                  <br />
                  10:00–22:00
                </p>
                <p className="mt-1 text-xs text-muted">Без выходных</p>
              </div>
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-muted">
                  Телефон
                </p>
                <a
                  href="tel:+73432884418"
                  className="mt-3 block font-display text-lg font-semibold tracking-[-0.04em] transition-colors hover:text-accent"
                >
                  +7 (343) 288-44-18
                </a>
                <p className="mt-1 text-xs text-muted">Звонки и WhatsApp</p>
              </div>
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-muted">
                  Почта
                </p>
                <a
                  href="mailto:hello@klin.bar"
                  className="mt-3 block text-sm font-semibold transition-colors hover:text-accent"
                >
                  hello@klin.bar
                </a>
                <p className="mt-1 text-xs text-muted">Для сотрудничества</p>
              </div>
            </div>

            <a
              href="https://yandex.ru/maps/?text=Екатеринбург%20Малышева%2044"
              target="_blank"
              rel="noreferrer"
              className="mt-10 inline-flex h-12 items-center gap-3 border border-ink/20 px-5 text-[10px] font-extrabold uppercase tracking-[0.12em] transition-colors hover:border-ink hover:bg-ink hover:text-paper"
            >
              Проложить маршрут <ArrowUpRight className="size-4" />
            </a>
          </div>

          <div className="relative min-h-[360px] overflow-hidden bg-paper-deep lg:min-h-full">
            <div className="absolute inset-0 map-grid" />
            <div className="absolute left-[14%] top-[20%] h-[130%] w-[8%] rotate-[24deg] bg-paper/80" />
            <div className="absolute left-[52%] top-[-30%] h-[170%] w-[5%] rotate-[-18deg] bg-paper/70" />
            <div className="absolute left-0 top-[58%] h-[8%] w-full rotate-[4deg] bg-paper/80" />
            <div className="absolute left-[20%] top-[20%] h-[24%] w-[18%] border border-ink/10 bg-ink/[0.025]" />
            <div className="absolute right-[10%] top-[10%] h-[16%] w-[20%] border border-ink/10 bg-ink/[0.025]" />
            <div className="absolute bottom-[12%] right-[18%] h-[22%] w-[22%] bg-lime/30" />
            <div className="absolute left-[50%] top-[48%] -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <span className="absolute inset-0 size-16 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full border border-accent/40 [animation-duration:2.5s]" />
                <div className="relative grid size-12 place-items-center rounded-full bg-accent text-ink shadow-xl">
                  <Scissors className="size-5" strokeWidth={2} />
                </div>
                <div className="absolute left-1/2 top-full mt-3 w-max -translate-x-1/2 bg-ink px-3 py-2 text-center text-paper">
                  <p className="font-display text-[10px] font-bold uppercase tracking-[0.08em]">
                    КЛИН
                  </p>
                  <p className="mt-0.5 text-[8px] uppercase tracking-[0.1em] text-paper/55">
                    Малышева, 44
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute bottom-5 left-5 flex items-center gap-2 bg-paper px-3 py-2 text-[9px] font-extrabold uppercase tracking-[0.12em]">
              <Sparkles className="size-3.5 text-accent" />
              Центр города · 3 мин от метро
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
