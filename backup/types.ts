
export enum Stage {
  KINESIOLOGY = 'Kinesiología',
  GYM = 'Gimnasio',
}

export enum UserRole {
  ADMIN = 'Recepción',
  KINE = 'Kinesiólogo',
  PATIENT = 'Paciente',
}

export interface ExerciseLog {
  date: string;
  week: number;
  load: number;
  reps: number;
  rpe: number;
}

export type MetricType = 'kg' | 'time';

export interface ExerciseDefinition {
  id: string;
  name: string;
  category: string;
  videoUrl?: string;
  metricType: MetricType; // Nuevo campo: 'kg' o 'time'
}

export interface RoutineExercise {
  id: string;
  definitionId: string;
  definition: ExerciseDefinition;
  targetSets: number;
  targetReps: number;
  targetLoad: number; // Si metricType es 'time', esto representa SEGUNDOS
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

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  condition: string;
  photoUrl: string;
  lastVisit: string;
  routine: Routine;
  history: string[];
}

export type ViewState = 'HOME' | 'PATIENT_DETAIL';