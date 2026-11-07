import Link from "next/link";
import { ArrowUpRight, Camera, MapPin, Phone, Send } from "lucide-react";
import { Logo } from "@/components/site/logo";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-paper">
      <div className="container-page">
        <div className="grid gap-12 border-b border-paper/12 py-14 lg:grid-cols-[1.2fr_.8fr_.8fr] lg:py-20">
          <div>
            <Logo light />
            <p className="mt-6 max-w-sm text-sm leading-7 text-paper/55">
              Барбершоп для тех, кто знает, что форма — часть характера.
              Работаем с 2018 года на Малышева, 44.
            </p>
            <div className="mt-7 flex gap-3">
              <a
                href="https://t.me/"
                target="_blank"
                rel="noreferrer"
                aria-label="Telegram"
                className="grid size-10 place-items-center border border-paper/20 transition-colors hover:border-accent hover:bg-accent hover:text-ink"
              >
                <Send className="size-4" />
              </a>
              <a
                href="https://instagram.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="grid size-10 place-items-center border border-paper/20 transition-colors hover:border-accent hover:bg-accent hover:text-ink"
              >
                <Camera className="size-4" />
              </a>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-paper/40">
              Навигация
            </p>
            <div className="mt-5 flex flex-col gap-3 text-sm font-semibold">
              <Link href="/#services" className="transition-colors hover:text-accent">
                Услуги и цены
              </Link>
              <Link href="/#barbers" className="transition-colors hover:text-accent">
                Барберы
              </Link>
              <Link href="/booking" className="transition-colors hover:text-accent">
                Онлайн-запись
              </Link>
              <Link href="/admin" className="transition-colors hover:text-accent">
                Панель управления
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-paper/40">
              Контакты
            </p>
            <div className="mt-5 space-y-4 text-sm font-semibold">
              <a
                href="tel:+73432884418"
                className="flex items-center gap-3 transition-colors hover:text-accent"
              >
                <Phone className="size-4 text-accent" />
                +7 (343) 288-44-18
              </a>
              <p className="flex items-start gap-3 text-paper/60">
                <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
                Екатеринбург,
                <br />
                ул. Малышева, 44
              </p>
              <p className="text-paper/60">Ежедневно 10:00–22:00</p>
            </div>
            <Link
              href="/booking"
              className="mt-7 inline-flex items-center gap-2 border-b border-paper/30 pb-1 text-xs font-extrabold uppercase tracking-[0.12em] transition-colors hover:border-accent hover:text-accent"
            >
              Выбрать время <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-4 py-6 text-[10px] font-bold uppercase tracking-[0.12em] text-paper/35 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2018–2026 Барбершоп КЛИН</p>
          <div className="flex gap-6">
            <span>ИП Волков А. С.</span>
            <span>Политика конфиденциальности</span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden border-t border-paper/10">
        <div className="font-display select-none text-center text-[25vw] font-black leading-[0.72] tracking-[-0.11em] text-paper/[0.045]">
          КЛИН
        </div>
      </div>
    </footer>
  );
}
