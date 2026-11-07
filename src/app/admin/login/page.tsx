import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Bot, CalendarCheck2, ChartNoAxesCombined } from "lucide-react";
import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/site/logo";
import { isAdminAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Вход в админ-панель",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) redirect("/admin");

  return (
    <main className="grid min-h-screen bg-paper lg:grid-cols-[1.1fr_.9fr]">
      <section className="relative hidden overflow-hidden bg-ink text-paper lg:block">
        <Image
          src="/images/hero.jpg"
          alt=""
          fill
          priority
          className="object-cover opacity-35 grayscale"
        />
        <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/50 to-ink/10" />
        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
          <Logo light />
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-lime">
              Klin control room
            </p>
            <h1 className="mt-5 max-w-xl font-display text-[clamp(3.2rem,5.4vw,6rem)] font-bold uppercase leading-[0.86] tracking-[-0.08em]">
              Всё под
              <br />
              контролем.
            </h1>
            <p className="mt-6 max-w-sm text-sm leading-7 text-paper/50">
              Расписание, загрузка команды и записи клиентов — в одном месте.
              Сайт и Telegram-бот работают синхронно.
            </p>

            <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">
              {[
                { icon: CalendarCheck2, label: "Записи" },
                { icon: ChartNoAxesCombined, label: "Загрузка" },
                { icon: Bot, label: "Telegram" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="border border-paper/12 bg-paper/[0.03] p-4 backdrop-blur-sm"
                >
                  <item.icon className="size-4 text-lime" strokeWidth={1.7} />
                  <p className="mt-5 text-[9px] font-bold uppercase tracking-[0.12em] text-paper/55">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-paper/25">
            Барбершоп КЛИН · Екатеринбург
          </p>
        </div>
      </section>

      <section className="flex flex-col">
        <div className="flex items-center justify-between p-6 lg:justify-end lg:p-8">
          <div className="lg:hidden">
            <Logo />
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-ink/55 transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4" />
            На сайт
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-16 lg:px-14">
          <div className="w-full max-w-md">
            <span className="eyebrow text-ink/45">Служебный вход</span>
            <h2 className="mt-6 font-display text-4xl font-bold uppercase leading-[0.95] tracking-[-0.07em] sm:text-5xl">
              Панель
              <br />
              управления
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-7 text-ink/50">
              Введите пароль администратора. Если вы не меняли его при установке,
              используйте данные из файла <code className="text-ink">.env</code>.
            </p>

            <LoginForm />

            {process.env.NODE_ENV !== "production" && (
              <p className="mt-6 border border-line bg-paper-deep/50 px-4 py-3 text-[10px] leading-5 text-ink/50">
                Демо-пароль по умолчанию: <strong className="text-ink">klin-admin</strong>.
                Смените его в <code>ADMIN_PASSWORD</code> перед публикацией.
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-line p-6 text-[9px] font-bold uppercase tracking-[0.14em] text-ink/30 lg:p-8">
          © 2026 КЛИН · доступ только для сотрудников
        </div>
      </section>
    </main>
  );
}
