"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MapPin, Menu, Phone, X } from "lucide-react";
import { Logo } from "@/components/site/logo";

const nav = [
  { label: "Услуги", href: "/#services" },
  { label: "Барберы", href: "/#barbers" },
  { label: "О нас", href: "/#about" },
  { label: "Контакты", href: "/#contacts" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div className="bg-ink text-paper">
        <div className="container-page flex h-9 items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em]">
          <span className="flex items-center gap-2">
            <MapPin className="size-3 text-accent" strokeWidth={2} />
            Екатеринбург · Малышева, 44
          </span>
          <span className="hidden text-paper/55 sm:block">
            Ежедневно 10:00–22:00 · без выходных
          </span>
          <a
            href="tel:+73432884418"
            className="flex items-center gap-2 transition-colors hover:text-accent"
          >
            <Phone className="size-3" strokeWidth={2} />
            +7 (343) 288-44-18
          </a>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-line/80 bg-paper/92 backdrop-blur-xl">
        <div className="container-page flex h-[74px] items-center justify-between">
          <Logo />

          <nav className="hidden items-center gap-8 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group relative py-2 text-[13px] font-bold transition-colors hover:text-accent"
              >
                {item.label}
                <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="tel:+73432884418"
              className="hidden items-center gap-2 text-[13px] font-bold transition-colors hover:text-accent xl:flex"
            >
              <Phone className="size-4" strokeWidth={1.8} />
              +7 (343) 288-44-18
            </a>
            <Link
              href="/booking"
              className="hidden h-11 items-center gap-2 bg-ink px-5 text-[12px] font-extrabold uppercase tracking-[0.1em] text-paper transition-colors hover:bg-accent hover:text-ink sm:flex"
            >
              Записаться
              <ArrowUpRight className="size-4" strokeWidth={2} />
            </Link>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={open}
              className="grid size-11 place-items-center border border-ink/20 transition-colors hover:border-ink hover:bg-ink hover:text-paper lg:hidden"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-x-0 bottom-0 top-[110px] z-40 overflow-y-auto bg-paper lg:hidden">
          <div className="container-page flex min-h-full flex-col py-8">
            <nav className="flex flex-col border-t border-line">
              {nav.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="group flex items-center justify-between border-b border-line py-6"
                >
                  <span className="flex items-baseline gap-4">
                    <span className="text-[10px] font-bold text-muted">
                      0{index + 1}
                    </span>
                    <span className="font-display text-3xl font-semibold tracking-[-0.06em]">
                      {item.label}
                    </span>
                  </span>
                  <ArrowUpRight className="size-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </Link>
              ))}
            </nav>

            <div className="mt-auto pt-10">
              <Link
                href="/booking"
                onClick={() => setOpen(false)}
                className="flex h-14 w-full items-center justify-between bg-ink px-6 text-[12px] font-extrabold uppercase tracking-[0.12em] text-paper"
              >
                Записаться онлайн
                <ArrowUpRight className="size-5" />
              </Link>
              <div className="mt-6 flex items-center justify-between text-xs font-semibold text-muted">
                <span>Малышева, 44</span>
                <a href="tel:+73432884418" className="text-ink">
                  +7 (343) 288-44-18
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
