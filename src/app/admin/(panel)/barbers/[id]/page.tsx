import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BarberForm } from "@/components/admin/barber-form";
import { getBarberById } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Редактирование барбера",
};

export default async function EditBarberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const barber = await getBarberById(id);

  if (!barber) notFound();

  return <BarberForm barber={barber} />;
}
