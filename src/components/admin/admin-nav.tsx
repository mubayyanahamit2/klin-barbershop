"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bot,
  CalendarDays,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Settings2,
  UsersRound,
} from "lucide-react";
import { Logo } from "@/components/site/logo";

const nav = [
  { href: "/admin", label: "Обзор", icon: LayoutDashboard, exact: true },
  { href: "/admin/barbers", label: "Барберы", icon: UsersRound },
  { href: "/admin/appointments", label: "Записи", icon: CalendarDays },
  { href: "/admin/settings", label: "Настройки", icon: Settings2 },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav({ telegramConfigured }: { telegramConfigured: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[252px] flex-col border-r border-paper/10 bg-[#0c0e0b] lg:flex">
        <div className="flex h-20 items-center border-b border-paper/10 px-6">
          <Logo light />
        </div>

        <div className="px-4 pt-5">
          <div className="flex items-center justify-between px-2 text-[9px] font-extrabold uppercase tracking-[0.16em] text-paper/30">
            <span>Control room</span>
            <span className="flex items-center gap-1.5 text-lime/70">
              <span className="size-1.5 rounded-full bg-lime pulse-soft" />
              online
            </span>
          </div>
        </div>

        <nav className="mt-4 flex flex-col gap-1 px-3">
          {nav.map((item) => {
            const active = isActive(pathname, item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex h-11 items-center gap-3 px-3 text-[12px] font-bold transition-colors ${
                  active
                    ? "bg-paper text-ink"
                    : "text-paper/55 hover:bg-paper/[0.06] hover:text-paper"
                }`}
              >
                <item.icon className="size-4" strokeWidth={1.8} />
                {item.label}
                {active && (
                  <span className="ml-auto size-1.5 rounded-full bg-accent" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-4">
          <div className="border border-paper/10 bg-paper/[0.03] p-4">
            <div className="flex items-center justify-between">
              <Bot className="size-4 text-paper/45" strokeWidth={1.7} />
              <span
                className={`size-1.5 rounded-full ${
                  telegramConfigured ? "bg-lime" : "bg-accent"
                }`}
              />
            </div>
            <p className="mt-4 text-[10px] font-bold text-paper/75">
              Telegram-бот
            </p>
            <p className="mt-1 text-[9px] leading-4 text-paper/35">
              {telegramConfigured
                ? "Подключён, уведомления включены"
                : "Требуется настройка токена"}
            </p>
            <Link
              href="/admin/settings"
              className="mt-3 inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-lime"
            >
              Настроить
            </Link>
          </div>

          <Link
            href="/"
            target="_blank"
            className="mt-3 flex h-10 items-center gap-3 px-3 text-[11px] font-bold text-paper/45 transition-colors hover:text-paper"
          >
            <ExternalLink className="size-4" />
            Открыть сайт
          </Link>
          <button
            type="button"
            onClick={logout}
            className="mt-1 flex h-10 w-full items-center gap-3 px-3 text-[11px] font-bold text-paper/45 transition-colors hover:text-accent"
          >
            <LogOut className="size-4" />
            Выйти
          </button>
        </div>
      </aside>

      <div className="sticky top-0 z-40 border-b border-paper/10 bg-[#0c0e0b]/95 backdrop-blur-xl lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Logo light />
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              aria-label="Открыть сайт"
              className="grid size-9 place-items-center border border-paper/15 text-paper/55"
            >
              <ExternalLink className="size-4" />
            </Link>
            <button
              type="button"
              onClick={logout}
              aria-label="Выйти"
              className="grid size-9 place-items-center border border-paper/15 text-paper/55"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-4 pb-3">
          {nav.map((item) => {
            const active = isActive(pathname, item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-9 shrink-0 items-center gap-2 px-3 text-[10px] font-bold ${
                  active ? "bg-paper text-ink" : "text-paper/50"
                }`}
              >
                <item.icon className="size-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
