import { z } from "zod";
import { BookingError, createBooking } from "@/lib/booking";
import { isValidPhone, normalizePhone, publicBookingId } from "@/lib/date";
import { notifyNewBooking } from "@/lib/telegram";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bookingSchema = z.object({
  barberId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  clientName: z.string().trim().min(2, "Укажите имя").max(80),
  clientPhone: z
    .string()
    .trim()
    .refine((value) => isValidPhone(value), "Укажите корректный телефон"),
  notes: z.string().trim().max(300).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bookingSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error: "Проверьте данные формы",
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const booking = await createBooking({
      ...parsed.data,
      clientPhone: normalizePhone(parsed.data.clientPhone),
      source: "WEBSITE",
    });

    await notifyNewBooking(booking);

    return Response.json(
      {
        id: booking.id,
        publicId: publicBookingId(booking.id),
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        barber: booking.barber.name,
        service: booking.service.name,
        price: booking.service.price,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof BookingError) {
      return Response.json(
        { error: error.message },
        { status: error.code === "SLOT_TAKEN" ? 409 : 400 },
      );
    }

    console.error("[bookings]", error);
    return Response.json(
      { error: "Не удалось создать запись. Попробуйте ещё раз." },
      { status: 500 },
    );
  }
}
