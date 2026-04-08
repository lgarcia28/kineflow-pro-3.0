
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
  supersetGroup?: string; // ID de grupo para biserie/triserie
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
      date: string;
      evaluator?: string;
      pre_session_training?: string;
      age?: number;
      height?: number;
      weight?: number;
      dominantLeg?: 'derecha' | 'izquierda';
      injuredLeg?: 'derecha' | 'izquierda' | 'ninguna';
      injuryType?: string;
      injury_comments?: string;
      medical_history?: string;
      referring_doctor?: string;
      pain_during_eval?: 'Sí' | 'No';
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
      thomas_test_psoas_r?: 'OK' | 'X' | 'No evaluado';
      thomas_test_rectus_r?: 'OK' | 'X' | 'No evaluado';
      thomas_test_sartorius_r?: 'OK' | 'X' | 'No evaluado';
      thomas_test_psoas_l?: 'OK' | 'X' | 'No evaluado';
      thomas_test_rectus_l?: 'OK' | 'X' | 'No evaluado';
      thomas_test_sartorius_l?: 'OK' | 'X' | 'No evaluado';
      thomas_image_url?: string | null;
      hams_r?: number;
      hams_l?: number;
      askling_h_r?: 'OK' | 'X' | 'No evaluado';
      askling_h_l?: 'OK' | 'X' | 'No evaluado';
      slump_test_r?: 'OK' | 'X' | 'No evaluado';
      slump_test_l?: 'OK' | 'X' | 'No evaluado';
      bkfo_r?: number;
      bkfo_l?: number;
    };
    palpation: {
      psoas_r: { palpation?: number; contraction?: number; stretching?: number };
      psoas_l: { palpation?: number; contraction?: number; stretching?: number };
      pubis_r: { palpation?: number; contraction?: number; stretching?: number };
      pubis_l: { palpation?: number; contraction?: number; stretching?: number };
      abs_r: { palpation?: number; contraction?: number; stretching?: number };
      abs_l: { palpation?: number; contraction?: number; stretching?: number };
      adductor_r: { palpation?: number; contraction?: number; stretching?: number };
      adductor_l: { palpation?: number; contraction?: number; stretching?: number };
      glute_med_r: { palpation?: number };
      glute_med_l: { palpation?: number };
      q_lumbar_r: { palpation?: number };
      q_lumbar_l: { palpation?: number };
      hip_impingement_r: 'negativo' | 'positivo';
      hip_impingement_l: 'negativo' | 'positivo';
      hip_labrum_r: 'negativo' | 'positivo';
      hip_labrum_l: 'negativo' | 'positivo';
      spine_flexion?: number;
      spine_extension?: number;
      spine_inc_r?: number;
      spine_inc_l?: number;
      sacroiliac_r: 'negativo' | 'positivo';
      sacroiliac_l: 'negativo' | 'positivo';
    };
    perimetry: {
      thigh_r?: number;
      thigh_l?: number;
      calf_r?: number;
      calf_l?: number;
    };
    balance: {
      y_balance_ant_r?: number;
      y_balance_pm_r?: number;
      y_balance_pl_r?: number;
      y_balance_ant_l?: number;
      y_balance_pm_l?: number;
      y_balance_pl_l?: number;
      leg_length?: number;
      eyes_open_r?: number;
      eyes_closed_r?: number;
      eyes_open_l?: number;
      eyes_closed_l?: number;
      vestibular_side_r?: number;
      vestibular_up_r?: number;
      vestibular_side_l?: number;
      vestibular_up_l?: number;
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
      shoulder_press_r?: number;
      shoulder_press_l?: number;
      shoulder_press_vas_r?: number;
      shoulder_press_vas_l?: number;
      bench_press_reps?: number;
      bench_press_vas?: number;
      pull_ups_reps?: number;
      pull_ups_vas?: number;
      // Agregados del Excel
      braking_test?: number;
      t_test?: number;
      edgren_side_step?: number;
      cmas_45_r?: number;
      cmas_45_l?: number;
      cmas_90_r?: number;
      cmas_90_l?: number;
      ikdc?: number;
      lca_rsi?: number;
      hagos?: number;
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
      triceps_sural_r?: number;
      triceps_sural_l?: number;
      triceps_sural_vas_r?: number;
      triceps_sural_vas_l?: number;
      tobillo_abd_r?: number;
      tobillo_abd_l?: number;
      tobillo_abd_vas_r?: number;
      tobillo_abd_vas_l?: number;
      tobillo_add_r?: number;
      tobillo_add_l?: number;
      tobillo_add_vas_r?: number;
      tobillo_add_vas_l?: number;
      imtp_peak?: number;
      imtp_r?: number;
      imtp_l?: number;
      shoulder_ri_r?: number;
      shoulder_ri_l?: number;
      shoulder_ri_vas_r?: number;
      shoulder_ri_vas_l?: number;
      shoulder_re_r?: number;
      shoulder_re_l?: number;
      shoulder_re_vas_r?: number;
      shoulder_re_vas_l?: number;
      ash_i_r?: number;
      ash_i_l?: number;
      ash_i_vas_r?: number;
      ash_i_vas_l?: number;
      ash_y_r?: number;
      ash_y_l?: number;
      ash_y_vas_r?: number;
      ash_y_vas_l?: number;
      ash_t_r?: number;
      ash_t_l?: number;
      ash_t_vas_r?: number;
      ash_t_vas_l?: number;
      handgrip_r?: number;
      handgrip_l?: number;
    };
    vbt: {
      squat_r?: number;
      squat_l?: number;
      squat_weight?: number;
      deadlift_r?: number;
      deadlift_l?: number;
      deadlift_weight?: number;
      glute_bridge_r?: number;
      glute_bridge_l?: number;
      glute_bridge_weight?: number;
      bulgarian_r?: number;
      bulgarian_l?: number;
      bulgarian_weight?: number;
    };
    jumps_vertical: {
      cmj_2p_height?: number;
      cmj_2p_brake_r?: number;
      cmj_2p_brake_l?: number;
      cmj_2p_prop_r?: number;
      cmj_2p_prop_l?: number;
      cmj_2p_land_r?: number;
      cmj_2p_land_l?: number;
      cmj_2p_rsi?: number;
      cmj_1p_height_r?: number;
      cmj_1p_height_l?: number;
      cmj_1p_brake_r?: number;
      cmj_1p_brake_l?: number;
      cmj_1p_prop_r?: number;
      cmj_1p_prop_l?: number;
      cmj_1p_land_r?: number;
      cmj_1p_land_l?: number;
      cmj_1p_rsi_r?: number;
      cmj_1p_rsi_l?: number;
      dj_2p_height?: number;
      dj_2p_peak_force_r?: number;
      dj_2p_peak_force_l?: number;
      dj_2p_rsi?: number;
      dj_1p_height_r?: number;
      dj_1p_height_l?: number;
      dj_1p_contact_r?: number;
      dj_1p_contact_l?: number;
      dj_1p_rsi_r?: number;
      dj_1p_rsi_l?: number;
    };
    jumps_horizontal: {
      single_hop_r?: number;
      single_hop_l?: number;
      triple_hop_dist_r?: number;
      triple_hop_dist_l?: number;
      triple_hop_contact_r?: number;
      triple_hop_contact_l?: number;
      crossover_hop_dist_r?: number;
      crossover_hop_dist_l?: number;
      crossover_hop_contact_r?: number;
      crossover_hop_contact_l?: number;
      medial_side_triple_hop_r?: number;
      medial_side_triple_hop_l?: number;
      medial_rotation_hop_r?: number;
      medial_rotation_hop_l?: number;
      side_hop_r?: number;
      side_hop_l?: number;
    };
    motor_control: {
      sls_frontal_trunk_r?: number;
      sls_frontal_pelvis_r?: number;
      sls_frontal_hip_r?: number;
      sls_frontal_knee_r?: number;
      sls_frontal_trunk_l?: number;
      sls_frontal_pelvis_l?: number;
      sls_frontal_hip_l?: number;
      sls_frontal_knee_l?: number;
      sls_sagittal_r?: number;
      sls_sagittal_l?: number;
      bipodal_squat_r?: number;
      bipodal_squat_l?: number;
      hip_hinge_r?: number;
      hip_hinge_l?: number;
      lunge_fms?: number;
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
