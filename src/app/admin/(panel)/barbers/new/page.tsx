import type { Metadata } from "next";
import { BarberForm } from "@/components/admin/barber-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Новый барбер",
};

export default function NewBarberPage() {
  return <BarberForm />;
}
