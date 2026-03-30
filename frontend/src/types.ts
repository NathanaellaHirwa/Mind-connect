export type Task = {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  completed: boolean;
  progress: number;
  createdAt: string;
};

export type Goal = {
  id: string;
  title: string;
  description: string;
  targetDate: string | null;
  progress: number;
  completed: boolean;
  createdAt: string;
};

export type Professional = {
  id: string;
  name: string;
  specialty: string;
  country: string;
  languages: string[];
  availability: string;
  title?: string;
  specialization?: string;
  bio?: string;
  yearsExperience?: number;
  years_experience?: number;
  ratePerSession?: number;
  rate_per_session?: number;
  available?: boolean;
  rating?: number;
  photoUrl?: string;
  photo_url?: string;
  imageUrl?: string;
  image_url?: string;
};

export type Booking = {
  id: string;
  professionalId: string;
  requestedAt: string;
  status: string;
  note: string;
};

export type Message = {
  id: string;
  sender: string;
  body: string;
  sentAt: string;
};

export type Chat = {
  id: string;
  professionalId: string;
  messages: Message[];
};

export type AdminResourcesProps = { token: string; refreshResources?: () => Promise<void> };

export type AdminProfessionalsProps = { token: string; refreshProfessionals?: () => Promise<void> };

export type Resource = {
  id: string;
  title: string;
  type: string;
  language: string;
  url: string;
  tag: string;
  description?: string;
  imageUrl?: string;
  image_url?: string;
  durationMinutes?: number;
  duration_minutes?: number;
  tags?: string[];
  content?: string;
};

export type Notification = {
  id: string;
  type: string;
  body: string;
  createdAt: string;
  read: boolean;
};

export type WellnessCheck = {
  id: string;
  userId?: string;
  mood: string;
  stressLevel?: number;
  sleepHours?: number;
  energyLevel?: number;
  note?: string;
  grateful?: string;
  createdAt: string;
};
