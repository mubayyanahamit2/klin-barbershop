import { isAdminAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { barberInputSchema, validateSchedule } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) return unauthorizedResponse();

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = barberInputSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error: "Проверьте данные барбера",
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const scheduleError = validateSchedule(parsed.data);
    if (scheduleError) {
      return Response.json({ error: scheduleError }, { status: 400 });
    }

    const existing = await prisma.barber.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "Барбер не найден" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.workingDay.deleteMany({ where: { barberId: id } });
      await tx.barber.update({
        where: { id },
        data: {
          name: parsed.data.name,
          role: parsed.data.role,
          bio: parsed.data.bio,
          photo: parsed.data.photo,
          accent: parsed.data.accent,
          experience: parsed.data.experience,
          isActive: parsed.data.isActive,
          sortOrder: parsed.data.sortOrder,
          workingDays: {
            create: parsed.data.schedule.map((day) => ({
              weekday: day.weekday,
              isWorking: day.isWorking,
              startTime: day.startTime,
              endTime: day.endTime,
              breakStart: day.breakStart || null,
              breakEnd: day.breakEnd || null,
            })),
          },
        },
      });
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[admin/barbers/update]", error);
    return Response.json(
      { error: "Не удалось сохранить барбера" },
      { status: 500 },
    );
  }
}
