import { z } from "zod";
import { getAvailableSlots } from "@/lib/booking";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  barberId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      barberId: searchParams.get("barberId"),
      serviceId: searchParams.get("serviceId"),
      date: searchParams.get("date"),
    });

    if (!parsed.success) {
      return Response.json(
        { error: "Некорректные параметры запроса" },
        { status: 400 },
      );
    }

    const result = await getAvailableSlots(parsed.data);
    return Response.json(result);
  } catch (error) {
    console.error("[availability]", error);
    return Response.json(
      { error: "Не удалось загрузить свободное время" },
      { status: 500 },
    );
  }
}
