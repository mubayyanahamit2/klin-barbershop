import { z } from "zod";
import { isAdminAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const schema = z.object({
  status: z.enum(["CONFIRMED", "DONE", "CANCELLED"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) return unauthorizedResponse();

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: "Некорректный статус" }, { status: 400 });
    }

    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "Запись не найдена" }, { status: 404 });
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    return Response.json({ ok: true, status: appointment.status });
  } catch (error) {
    console.error("[admin/appointments/update]", error);
    return Response.json(
      { error: "Не удалось обновить запись" },
      { status: 500 },
    );
  }
}
