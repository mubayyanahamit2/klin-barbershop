import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Панель управления",
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="admin-grid min-h-screen bg-[#0b0d0a] text-paper">
      <AdminNav
        telegramConfigured={Boolean(
          process.env.TELEGRAM_BOT_TOKEN &&
            process.env.TELEGRAM_GROUP_CHAT_ID,
        )}
      />
      <div className="lg:pl-[252px]">
        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
