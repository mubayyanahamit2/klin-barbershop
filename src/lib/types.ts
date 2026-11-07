export type WorkingDayData = {
  weekday: number;
  isWorking: boolean;
  startTime: string;
  endTime: string;
  breakStart: string | null;
  breakEnd: string | null;
};

export type BarberData = {
  id: string;
  name: string;
  slug: string;
  role: string;
  bio: string;
  photo: string;
  accent: string;
  experience: number;
  isActive: boolean;
  sortOrder: number;
  workingDays: WorkingDayData[];
};

export type ServiceData = {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  sortOrder: number;
};

export type AppointmentData = {
  id: string;
  clientName: string;
  clientPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  source: string;
  telegramUsername: string | null;
  notes: string | null;
  createdAt: string;
  barber: {
    id: string;
    name: string;
    photo: string;
  };
  service: {
    id: string;
    name: string;
    price: number;
    duration: number;
  };
};
