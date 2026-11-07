import { PrismaClient } from "@prisma/client";
import {
  addDays,
  isoWeekday,
  minutesToTime,
  nowMinutes,
  todayISO,
  timeToMinutes,
} from "../src/lib/date";

const prisma = new PrismaClient();

type Schedule = {
  days: number[];
  start: string;
  end: string;
  breakStart?: string;
  breakEnd?: string;
};

const barbers = [
  {
    slug: "artem-volkov",
    name: "Артём Волков",
    role: "Основатель · топ-барбер",
    bio: "Стрижёт 11 лет. Любит классику, чистые линии и клиентов, которые доверяют процессу.",
    photo: "/images/barber-1.jpg",
    accent: "#ff5c35",
    experience: 11,
    sortOrder: 1,
    schedule: {
      days: [1, 2, 3, 4, 5, 6],
      start: "10:00",
      end: "21:00",
      breakStart: "14:00",
      breakEnd: "15:00",
    } satisfies Schedule,
  },
  {
    slug: "danila-kim",
    name: "Данила Ким",
    role: "Барбер · фейд-мастер",
    bio: "Фанат текстурных стрижек и фейдов. Найдёт форму даже там, где её, кажется, не было.",
    photo: "/images/barber-2.jpg",
    accent: "#b9d950",
    experience: 7,
    sortOrder: 2,
    schedule: {
      days: [2, 3, 4, 5, 6, 7],
      start: "12:00",
      end: "22:00",
      breakStart: "16:30",
      breakEnd: "17:00",
    } satisfies Schedule,
  },
  {
    slug: "mark-orlov",
    name: "Марк Орлов",
    role: "Барбер · борода и бритьё",
    bio: "Отвечает за бороды, опасную бритву и неспешные разговоры. Работает только руками.",
    photo: "/images/barber-3.jpg",
    accent: "#d8c4a5",
    experience: 9,
    sortOrder: 3,
    schedule: {
      days: [1, 2, 3, 4, 5, 6],
      start: "10:00",
      end: "20:00",
      breakStart: "13:30",
      breakEnd: "14:00",
    } satisfies Schedule,
  },
  {
    slug: "timur-safin",
    name: "Тимур Сафин",
    role: "Барбер · универсал",
    bio: "Точная геометрия, спокойный темп и стрижки, которые легко повторить дома.",
    photo: "/images/barber-4.jpg",
    accent: "#9fb5e8",
    experience: 6,
    sortOrder: 4,
    schedule: {
      days: [3, 4, 5, 6, 7],
      start: "11:00",
      end: "21:00",
      breakStart: "15:00",
      breakEnd: "16:00",
    } satisfies Schedule,
  },
];

const services = [
  {
    name: "Мужская стрижка",
    description: "Консультация, мытьё, стрижка машинкой и ножницами, укладка.",
    duration: 45,
    price: 2600,
    sortOrder: 1,
  },
  {
    name: "Стрижка + борода",
    description: "Полный образ: форма головы, контуры бороды, горячее полотенце.",
    duration: 75,
    price: 3900,
    sortOrder: 2,
  },
  {
    name: "Оформление бороды",
    description: "Контуры, длина, тримминг и уход. Без стрижки головы.",
    duration: 30,
    price: 1800,
    sortOrder: 3,
  },
  {
    name: "Королевское бритьё",
    description: "Опасная бритва, пар, горячее полотенце и холодный компресс.",
    duration: 45,
    price: 2300,
    sortOrder: 4,
  },
  {
    name: "Детская стрижка",
    description: "Для гостей до 12 лет. Мягко, быстро и без слёз.",
    duration: 30,
    price: 1900,
    sortOrder: 5,
  },
  {
    name: "Камуфляж седины",
    description: "Естественное тонирование волос или бороды без эффекта краски.",
    duration: 30,
    price: 1600,
    sortOrder: 6,
  },
];

function appointmentsForDate(
  date: string,
  start: string,
  end: string,
  breakStart?: string,
  breakEnd?: string,
) {
  if (!breakStart || !breakEnd) return `${start}–${end}`;
  return `${start}–${breakStart}, ${breakEnd}–${end}`;
}

function nextWorkingDate(barberSchedule: Schedule, fromOffset: number): string {
  let date = addDays(todayISO(), fromOffset);
  for (let attempt = 0; attempt < 14; attempt += 1) {
    if (barberSchedule.days.includes(isoWeekday(date))) return date;
    date = addDays(date, 1);
  }
  return date;
}

async function main() {
  await prisma.appointment.deleteMany();
  await prisma.workingDay.deleteMany();
  await prisma.telegramSession.deleteMany();
  await prisma.barber.deleteMany();
  await prisma.service.deleteMany();

  const createdServices = await Promise.all(
    services.map((service) => prisma.service.create({ data: service })),
  );

  const createdBarbers = [];
  for (const barber of barbers) {
    const created = await prisma.barber.create({
      data: {
        slug: barber.slug,
        name: barber.name,
        role: barber.role,
        bio: barber.bio,
        photo: barber.photo,
        accent: barber.accent,
        experience: barber.experience,
        sortOrder: barber.sortOrder,
        workingDays: {
          create: Array.from({ length: 7 }, (_, index) => {
            const weekday = index + 1;
            const isWorking = barber.schedule.days.includes(weekday);
            return {
              weekday,
              isWorking,
              startTime: barber.schedule.start,
              endTime: barber.schedule.end,
              breakStart: isWorking ? barber.schedule.breakStart : null,
              breakEnd: isWorking ? barber.schedule.breakEnd : null,
            };
          }),
        },
      },
      include: { workingDays: true },
    });
    createdBarbers.push(created);
  }

  const clients = [
    ["Илья Соколов", "+7 912 340-18-22"],
    ["Максим Крылов", "+7 922 118-44-09"],
    ["Роман Гущин", "+7 950 700-31-17"],
    ["Никита Лапин", "+7 912 855-20-63"],
    ["Алексей Мельник", "+7 904 377-90-41"],
    ["Дмитрий Хабаров", "+7 999 201-72-35"],
    ["Сергей Пахомов", "+7 912 604-11-80"],
    ["Егор Тарасов", "+7 922 930-55-14"],
    ["Антон Григорьев", "+7 950 418-77-26"],
    ["Владислав Ким", "+7 904 112-68-53"],
    ["Михаил Сорокин", "+7 999 788-14-02"],
    ["Кирилл Жуков", "+7 912 555-39-71"],
  ];

  const today = todayISO();
  const now = nowMinutes();
  const serviceIndex = [0, 1, 2, 3, 4, 5];
  const times = ["11:00", "12:30", "15:00", "17:30", "19:00"];

  let clientIndex = 0;
  for (const [barberIndex, barber] of createdBarbers.entries()) {
    const schedule = barbers[barberIndex].schedule;
    for (const [appointmentIndex, offset] of [0, 2, 4].entries()) {
      const date = nextWorkingDate(schedule, offset);
      const service = createdServices[serviceIndex[(barberIndex + appointmentIndex) % serviceIndex.length]];
      const startTime = times[(barberIndex + appointmentIndex) % times.length];
      const endTime = minutesToTime(timeToMinutes(startTime) + service.duration);
      const [clientName, clientPhone] = clients[clientIndex % clients.length];
      const isPast = date < today || (date === today && timeToMinutes(startTime) < now);
      const isCancelled = barberIndex === 2 && appointmentIndex === 2;
      const source = clientIndex % 4 === 0 ? "TELEGRAM" : "WEBSITE";

      await prisma.appointment.create({
        data: {
          barberId: barber.id,
          serviceId: service.id,
          clientName,
          clientPhone,
          date,
          startTime,
          endTime,
          status: isCancelled ? "CANCELLED" : isPast ? "DONE" : "CONFIRMED",
          source,
          telegramId: source === "TELEGRAM" ? `10000000${clientIndex}` : null,
          telegramUsername: source === "TELEGRAM" ? `klin_guest_${clientIndex}` : null,
          createdAt: new Date(Date.now() - clientIndex * 3_600_000),
        },
      });

      clientIndex += 1;
    }
  }

  console.log("KLIN seed completed");
  console.log(
    `${createdBarbers.length} barbers, ${createdServices.length} services, ${clientIndex} appointments`,
  );
  console.log(
    `Working hours example: ${appointmentsForDate(
      today,
      barbers[0].schedule.start,
      barbers[0].schedule.end,
      barbers[0].schedule.breakStart,
      barbers[0].schedule.breakEnd,
    )}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
