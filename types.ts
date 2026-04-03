
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

export interface EvaluationResult {
  label: string;
  value: string | number;
  unit?: string;
  interpretation?: 'normal' | 'warning' | 'critical';
  category: string;
}

export interface ClinicalEvaluation {
  id: string;
  patientId: string;
  date: string;
  kineId: string;
  status: 'draft' | 'published';
  
  // Datos crudos ingresados de la hoja "A completar"
  measurements: {
    basic: {
      age?: number;
      weight?: number;
      height?: number;
      dominantLeg: 'derecha' | 'izquierda';
      injuredLeg: 'derecha' | 'izquierda' | 'ninguna';
      injuryType?: string;
      injuryDate?: string;
      surgeryDate?: string;
      painLevel?: number; // 0-10
      notes?: string;
    };
    mobility: {
      hip_ir_90_r?: number;
      hip_ir_90_l?: number;
      hip_er_90_r?: number;
      hip_er_90_l?: number;
      knee_ext_pass_r?: number;
      knee_ext_pass_l?: number;
      knee_flex_act_r?: number;
      knee_flex_act_l?: number;
      knee_flex_pass_r?: number;
      knee_flex_pass_l?: number;
      ankle_dorsiflex_r?: number;
      ankle_dorsiflex_l?: number;
      shoulder_ir_r?: number;
      shoulder_ir_l?: number;
      shoulder_er_r?: number;
      shoulder_er_l?: number;
    };
    flexibility: {
      thomas_psoas_r: 'normal' | 'corto';
      thomas_psoas_l: 'normal' | 'corto';
      thomas_rectus_r: 'normal' | 'corto';
      thomas_rectus_l: 'normal' | 'corto';
      ake_r?: number;
      ake_l?: number;
      askling_r: 'negativo' | 'positivo';
      askling_l: 'negativo' | 'positivo';
      slump_r: 'negativo' | 'positivo';
      slump_l: 'negativo' | 'positivo';
    };
    perimetry: {
      thigh_10cm_r?: number;
      thigh_10cm_l?: number;
      thigh_20cm_r?: number;
      thigh_20cm_l?: number;
      calf_max_r?: number;
      calf_max_l?: number;
    };
    stability: {
      y_balance_ant_r?: number;
      y_balance_pm_r?: number;
      y_balance_pl_r?: number;
      y_balance_ant_l?: number;
      y_balance_pm_l?: number;
      y_balance_pl_l?: number;
      leg_length?: number;
    };
    mcgill: {
      flexor_endurance?: number;
      extensor_endurance?: number;
      lateral_bridge_r?: number;
      lateral_bridge_l?: number;
    };
    functional: {
      glute_bridge_r?: number;
      glute_bridge_l?: number;
      glute_bridge_vas_r?: number;
      glute_bridge_vas_l?: number;
      calf_raise_r?: number;
      calf_raise_l?: number;
      calf_raise_vas_r?: number;
      calf_raise_vas_l?: number;
      single_leg_squat_r?: number;
      single_leg_squat_l?: number;
      single_leg_squat_vas_r?: number;
      single_leg_squat_vas_l?: number;
    };
    strength: {
      hip_flex_0_r?: number;
      hip_flex_0_l?: number;
      hip_flex_0_vas_r?: number;
      hip_flex_0_vas_l?: number;
      hip_flex_90_r?: number;
      hip_flex_90_l?: number;
      hip_flex_90_vas_r?: number;
      hip_flex_90_vas_l?: number;
      squeeze_test?: number;
      squeeze_vas?: number;
      adductor_r?: number;
      adductor_l?: number;
      adductor_vas_r?: number;
      adductor_vas_l?: number;
      abductor_r?: number;
      abductor_l?: number;
      abductor_vas_r?: number;
      abductor_vas_l?: number;
      quads_r?: number;
      quads_l?: number;
      quads_vas_r?: number;
      quads_vas_l?: number;
      hams_r?: number;
      hams_l?: number;
      hams_vas_r?: number;
      hams_vas_l?: number;
    };
    jumps: {
      cmj_height?: number;
      cmj_rsi?: number;
      sj_height?: number;
      sj_rsi?: number;
      broad_jump?: number;
      triple_hop_r?: number;
      triple_hop_l?: number;
    };
  };
  
  // Resultados calculados de la hoja "Resultados"
  results: {
    conclusions: string[];
    metrics: EvaluationResult[];
  };

  // Metadatos para gráficas
  summaryMetrics: {
    lsi_knee_ext?: number;
    lsi_knee_flex?: number;
    lsi_hip_abd?: number;
    rsi_cmj?: number;
    weight?: number;
  };
}
