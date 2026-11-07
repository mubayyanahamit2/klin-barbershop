import { isAdminAuthenticated, unauthorizedResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uniqueBarberSlug } from "@/lib/slug";
import { barberInputSchema, validateSchedule } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return unauthorizedResponse();

  try {
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

    const slug = await uniqueBarberSlug(parsed.data.name);
    const barber = await prisma.barber.create({
      data: {
        name: parsed.data.name,
        slug,
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

    return Response.json({ id: barber.id }, { status: 201 });
  } catch (error) {
    console.error("[admin/barbers/create]", error);
    return Response.json(
      { error: "Не удалось создать барбера" },
      { status: 500 },
    );
  }
}
