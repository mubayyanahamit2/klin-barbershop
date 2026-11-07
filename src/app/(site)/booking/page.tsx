import type { Metadata } from "next";
import { BookingFlow } from "@/components/booking/booking-flow";
import { getBarbers, getServices } from "@/lib/data";
import { todayISO } from "@/lib/date";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Онлайн-запись",
  description:
    "Выберите услугу, барбера, дату и время. Онлайн-запись в барбершоп КЛИН на Малышева, 44.",
};

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ barber?: string; service?: string }>;
}) {
  const [services, barbers, params] = await Promise.all([
    getServices(),
    getBarbers(),
    searchParams,
  ]);

  const initialBarberId = barbers.find(
    (barber) => barber.slug === params.barber,
  )?.id;
  const initialServiceId = services.find(
    (service) => service.id === params.service,
  )?.id;

  return (
    <BookingFlow
      services={services}
      barbers={barbers}
      today={todayISO()}
      initialServiceId={initialServiceId}
      initialBarberId={initialBarberId}
    />
  );
}
