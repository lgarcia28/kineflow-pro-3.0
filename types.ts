
export enum Stage {
  KINESIOLOGY = 'Kinesiología',
  GYM = 'Gimnasio',
}

export enum UserRole {
  RECEPCION = 'RECEPCION',
  KINE = 'KINE',
  PATIENT = 'PATIENT',
}

export enum PlanType {
  SESSIONS = 'SESSIONS',
  TIME = 'TIME',
}

export enum CheckInStatus {
  IDLE = 'IDLE',
  IN_ROOM = 'IN_ROOM',
  ATTENDED = 'ATTENDED',
}

export interface ExerciseLog {
  date: string;
  week: number;
  load: number;
  reps: number;
  rpe: number;
  observation?: string; // Para rutina domiciliaria
}

export type MetricType = 'kg' | 'time';

export interface ExerciseDefinition {
  id: string;
  name: string;
  category: string;
  videoUrl?: string;
  metricType: MetricType;
}

export interface RoutineExercise {
  id: string;
  definitionId: string;
  definition: ExerciseDefinition;
  targetSets: number;
  targetReps: number;
  targetLoad: number;
  currentRpe?: number;
  notes?: string;
  isDone: boolean;
  history: ExerciseLog[];
}

export interface RoutineDay {
  id: string;
  name: string;
  exercises: RoutineExercise[];
}

export interface Routine {
  id: string;
  stage: Stage;
  days: RoutineDay[];
  currentWeek: number;
}

export interface RecurringSlot {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  time: string; // "HH:mm"
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  duration: number; // minutes, default 60
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NOSHOW';
  notes?: string;
  isRecurring?: boolean;
}

export interface Patient {
  id: string;
  dni: string;
  firstName: string;
  lastName: string;
  condition: string;
  injuryDate: string;
  surgeryDate?: string;
  sessionsPerWeek: number;
  planType: PlanType;
  totalSessionsPaid?: number;
  remainingSessions?: number;
  timePlanFrequency?: string;
  paymentDate: string;
  expirationDate: string;
  hasHomePlan: boolean;
  checkInStatus: CheckInStatus;
  photoUrl: string;
  lastVisit: string;
  routine: Routine;
  homeRoutine?: Routine; // Rutina domiciliaria
  history: string[];
  recurringSlots?: RecurringSlot[]; // Horarios fijos del paciente
}

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description?: string;
  category?: string;
  type: 'PRODUCT' | 'SERVICE';
}

export interface StaffMember {
  id: string;
  username: string;
  password?: string; // Solo para login local, en prod usar auth
  firstName: string;
  lastName: string;
  role: UserRole;
}

export type ViewState = 'LOGIN' | 'HOME' | 'PATIENT_DETAIL' | 'SHOP_ADMIN' | 'PATIENT_LIST' | 'STAFF_ADMIN';
