
import { Patient, Stage, ExerciseDefinition, PlanType, CheckInStatus, Product } from './types';

export const EXERCISES: ExerciseDefinition[] = [
  { id: 'ex1', name: 'Sentadilla en cajón', category: 'Pierna', videoUrl: 'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=200&h=200&fit=crop', metricType: 'kg', difficulty: 1 },
  { id: 'ex2', name: 'Puente de glúteos unipodal', category: 'Cadera', videoUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&h=200&fit=crop', metricType: 'kg', difficulty: 2 },
  { id: 'ex3', name: 'Press Paloff', category: 'Core', videoUrl: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=200&h=200&fit=crop', metricType: 'kg', difficulty: 2 },
  { id: 'ex4', name: 'Estocadas con mancuerna', category: 'Pierna', videoUrl: 'https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?w=200&h=200&fit=crop', metricType: 'kg', difficulty: 3 },
  { id: 'ex5', name: 'Movilidad de tobillo', category: 'Movilidad', videoUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&h=200&fit=crop', metricType: 'time', difficulty: 1 },
  { id: 'ex6', name: 'Remo TRX', category: 'Espalda', videoUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a05?w=200&h=200&fit=crop', metricType: 'kg', difficulty: 2 },
  { id: 'ex7', name: 'Plancha Frontal', category: 'Core', videoUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop', metricType: 'time', difficulty: 2 },
  { id: 'ex8', name: 'Bicho Muerto (Deadbug)', category: 'Core', videoUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=200&h=200&fit=crop', metricType: 'kg', difficulty: 1 },
  { id: 'ex9', name: 'Monster Walk', category: 'Cadera', videoUrl: 'https://images.unsplash.com/photo-1542766788-a2f588f447ee?w=200&h=200&fit=crop', metricType: 'kg', difficulty: 1 },
  { id: 'ex10', name: 'Vuelos Laterales', category: 'Hombro', videoUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=200&h=200&fit=crop', metricType: 'kg', difficulty: 2 },
  { id: 'ex11', name: 'Rotación externa con banda', category: 'Hombro', videoUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=200&h=200&fit=crop', metricType: 'tension', difficulty: 1 },
  { id: 'ex12', name: 'Monster Walk con banda loop', category: 'Cadera', videoUrl: 'https://images.unsplash.com/photo-1542766788-a2f588f447ee?w=200&h=200&fit=crop', metricType: 'tension', difficulty: 2 },
];

const generateHistory = (baseLoad: number): any[] => {
  const history = [];
  let currentLoad = baseLoad;
  for (let i = 1; i <= 5; i++) {
    history.push({
      date: new Date(Date.now() - (6 - i) * 86400000 * 7).toISOString().split('T')[0],
      week: i,
      load: currentLoad,
      reps: 10,
      rpe: Math.floor(Math.random() * 3) + 6,
    });
    currentLoad += 2.5;
  }
  return history;
};

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'p1',
    dni: '12345678',
    firstName: 'Juan',
    lastName: 'Pérez',
    condition: 'Post-op LCA Rodilla Izq.',
    injuryDate: '2024-08-15',
    surgeryDate: '2024-09-01',
    sessionsPerWeek: 3,
    planType: PlanType.SESSIONS,
    totalSessionsPaid: 12,
    remainingSessions: 4,
    paymentDate: new Date().toISOString().split('T')[0],
    expirationDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    hasHomePlan: true,
    checkInStatus: CheckInStatus.IDLE,
    photoUrl: 'https://picsum.photos/id/1012/200/200',
    lastVisit: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    history: ['Evaluación inicial: 10/09/23'],
    routine: {
      id: 'r1',
      stage: Stage.KINESIOLOGY,
      currentWeek: 6,
      days: [
        {
          id: 'd1',
          name: 'Día 1: Control Motor',
          exercises: [
            {
              id: 're1',
              definitionId: 'ex1',
              definition: EXERCISES[0],
              targetSets: 3,
              targetReps: 12,
              targetLoad: 10,
              isDone: false,
              history: generateHistory(5),
            }
          ],
        }
      ],
    },
    homeRoutine: {
      id: 'hr1',
      stage: Stage.KINESIOLOGY,
      currentWeek: 1,
      days: [
        {
          id: 'hd1',
          name: 'Rutina Casa',
          exercises: [
            {
              id: 'hre1',
              definitionId: 'ex5',
              definition: EXERCISES[4],
              targetSets: 2,
              targetReps: 1,
              targetLoad: 60,
              isDone: false,
              history: [],
            }
          ],
        }
      ],
    }
  },
  {
    id: 'p2',
    dni: '87654321',
    firstName: 'María',
    lastName: 'González',
    condition: 'Lesión Manguito Rotador Der.',
    injuryDate: '2024-10-01',
    sessionsPerWeek: 2,
    planType: PlanType.TIME,
    paymentDate: new Date().toISOString().split('T')[0],
    expirationDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    hasHomePlan: false,
    checkInStatus: CheckInStatus.IDLE,
    photoUrl: 'https://picsum.photos/id/1011/200/200',
    lastVisit: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    history: ['Evaluación inicial: dolor en hombro derecho al elevar el brazo.'],
    routine: {
      id: 'r2',
      stage: Stage.GYM,
      currentWeek: 1,
      days: [{ id: 'd1', name: 'Día Único', exercises: [] }],
    },
  },
];

export const MOCK_APPOINTMENTS: any[] = [
  {
    id: 'app1',
    patientId: 'p1',
    patientName: 'Juan Pérez',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    duration: 60,
    status: 'SCHEDULED',
    isRecurring: true
  },
  {
    id: 'app2',
    patientId: 'p2',
    patientName: 'María González',
    date: new Date().toISOString().split('T')[0],
    time: '11:00',
    duration: 60,
    status: 'SCHEDULED',
    isRecurring: false
  }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod1',
    name: 'Banda Elástica Loop',
    price: 1500,
    imageUrl: 'https://picsum.photos/seed/band/400/400',
    description: 'Banda de resistencia media para ejercicios de glúteo.',
    category: 'Accesorios',
    type: 'PRODUCT'
  },
  {
    id: 'prod2',
    name: 'Rollo de Masaje (Foam Roller)',
    price: 4500,
    imageUrl: 'https://picsum.photos/seed/roller/400/400',
    description: 'Ideal para liberación miofascial post-entrenamiento.',
    category: 'Accesorios',
    type: 'PRODUCT'
  },
  {
    id: 'serv1',
    name: 'Evaluación de Rodilla',
    price: 5000,
    imageUrl: 'https://picsum.photos/seed/knee/400/400',
    description: 'Evaluación funcional completa de la articulación de la rodilla.',
    category: 'Evaluaciones',
    type: 'SERVICE'
  },
  {
    id: 'serv2',
    name: 'Evaluación de Pubalgia',
    price: 5000,
    imageUrl: 'https://picsum.photos/seed/groin/400/400',
    description: 'Test específicos para diagnóstico y seguimiento de pubalgia.',
    category: 'Evaluaciones',
    type: 'SERVICE'
  },
  {
    id: 'serv3',
    name: 'Evaluación de Desgarros',
    price: 5000,
    imageUrl: 'https://picsum.photos/seed/muscle/400/400',
    description: 'Control ecográfico y funcional de lesiones musculares.',
    category: 'Evaluaciones',
    type: 'SERVICE'
  }
];

export interface ProtocolDefinition {
  name: string;
  category: string;
  description: string;
}

export const EVALUATION_PROTOCOLS: Record<string, ProtocolDefinition> = {
  hip_ir_90: {
    name: "Rotación interna de cadera 90º",
    category: "Movilidad",
    description: "PASIVO."
  },
  hip_er_90: {
    name: "Rotación externa de cadera 90º",
    category: "Movilidad",
    description: "PASIVO."
  },
  knee_ext_pass: {
    name: "Extensión pasiva de rodilla",
    category: "Movilidad",
    description: "Inclinómetro (regla L), buscar superficie dura"
  },
  knee_flex_act: {
    name: "Flexión activa de rodilla",
    category: "Movilidad",
    description: "Decúbito prono, inclinómetro en la tibia, sin entrada en calor"
  },
  knee_flex_pass: {
    name: "Flexión pasiva de rodilla",
    category: "Movilidad",
    description: "Decúbito prono, inclinómetro en la tibia, sin entrada en calor"
  },
  ankle_dorsiflex: {
    name: "Flexión dorsal de tobillo",
    category: "Movilidad",
    description: "Inclínometro borde anterior de tibia, moverlo 3 veces antes, no puede levantar talón, una sola medición, sin apoyar rodilla contraria en el suelo"
  },
  shoulder_ir: {
    name: "Rotación interna de hombro",
    category: "Movilidad",
    description: "Fijación a la antepulsión con mano del evaluador, inclinómetro parte dorsal del antebrazo, decúbito supino completamente"
  },
  shoulder_er: {
    name: "Rotación externa de hombro",
    category: "Movilidad",
    description: "Fijación a la antepulsión con mano del evaluador, inclinómetro parte dorsal del antebrazo, decúbito supino completamente"
  },
  thigh: {
    name: "Perímetro de muslo medio",
    category: "Antropometría",
    description: "Muslo medio: parado sobre banco, punto medio entre EIAS y borde superior de rótula."
  },
  calf: {
    name: "Perímetro de pantorrilla",
    category: "Antropometría",
    description: "Pantorrilla: pierna sobre banco, medición de mayor pliegue ubicado de forma lateral."
  },
  hams: {
    name: "AKE (Active Knee Extension)",
    category: "Flexibilidad",
    description: "Evaluación de flexibilidad de isquiotibiales (ángulo de extensión de rodilla activo)."
  },
  askling_h: {
    name: "Askling test",
    category: "Flexibilidad",
    description: "Test de flexibilidad dinámica / h-test para isquiotibiales."
  },
  slump_test: {
    name: "Slump test",
    category: "Meningorradicular",
    description: "Test de tensión neural dural y meningorradicular."
  },
  bkfo: {
    name: "BKFO test",
    category: "Movilidad",
    description: "Decúbito supino, planta con planta, distancia de la cabeza de peroné a la camilla en cm."
  },
  y_balance: {
    name: "Y-Balance Test",
    category: "Estabilidad / Balance",
    description: "Medición en cm en tres direcciones (Anterior, Posteromedial, Posterolateral). Se normaliza por el largo de miembro inferior."
  },
  eyes_open: {
    name: "Prueba de balance: cabeza lado a lado",
    category: "Balance",
    description: "Los sujetos se colocan de pie sobre una sola pierna, con un leve grado de flexión en la cadera, la rodilla y el tobillo, y con las manos apoyadas en la cintura. A una frecuencia de 60 pulsaciones por minuto, los sujetos giran repetidamente la cabeza de un lado al otro (entre 70 y 90 grados) durante un período de 15 segundos.\nLa visión debe estar alineada con la posición de la cabeza (sin fijación visual)."
  },
  vestibular_updown: {
    name: "Prueba de balance vestibular: cabeza arriba y abajo",
    category: "Balance",
    description: "Los sujetos se colocan de pie sobre una sola pierna, con un leve grado de flexión en la cadera, la rodilla y el tobillo, y con las manos apoyadas en la cintura. A una frecuencia de 60 pulsaciones por minuto, los sujetos inclinan repetidamente la cabeza hacia arriba y hacia abajo (mirando del piso al techo) durante un período de 15 segundos.\nLa visión debe estar alineada con la posición de la cabeza (sin fijación visual).\nLa prueba se considera aprobada si los sujetos pueden mantener la postura en apoyo unipodal y no retiran las manos de la cintura en ambas evaluaciones."
  },
  mcgill: {
    name: "Mc Gill",
    category: "Core / Resistencia",
    description: "Con valla abajo del cuerpo, flexores a 45°, si toca atrás corta, o si toca la valla de costado."
  },
  glute_bridge: {
    name: "Puente glúteo a 1p",
    category: "Fuerza Funcional",
    description: "Cajón de 60 cm, flexión de rodilla de 20º, brazos en pecho, apoyo de talón, llevar a extensión de cadera de 0º."
  },
  calf_raise: {
    name: "Elevación gemelo a 1p",
    category: "Fuerza Funcional",
    description: "Sobre pesa de 15kg, cabeza metatarsianos."
  },
  single_leg_squat: {
    name: "Sentadilla a 1p",
    category: "Fuerza Funcional",
    description: "Ajustá la altura del cajón para que, al sentarse, el sujeto quede con aproximadamente 60° de flexión de rodilla y 70–80° de flexión de cadera, con el talón apoyado y la tibia levemente inclinada hacia adelante. Debe sentarse con los isquiones a 5–8 cm del borde anterior del cajón. El pie del lado a evaluar se coloca a la distancia necesaria (habitualmente 10–15 cm del cajón) para mantener esa posición, con la rodilla alineada al segundo dedo. Los brazos van cruzados en el pecho y el tronco puede inclinarse hacia adelante de forma natural. Desde sentado, debe ponerse de pie completamente y volver a sentarse de manera controlada, sin rebotes, sin tocar el cajón con la otra pierna y sin despegar el talón. El movimiento se realiza con metrónomo a 60 bpm, subiendo en 2 segundos y bajando en 2 segundos, sin pausas. El test continúa hasta que aparece un fallo técnico: pérdida repetida de la alineación de rodilla, uso de impulso del tronco, talón que se despega, falta de extensión completa o pérdida de control en el descenso. Se registran la altura del cajón, las posiciones y la cantidad de repeticiones correctas."
  },
  shoulder_press: {
    name: "Press de hombro",
    category: "Fuerza Funcional",
    description: "Mancuerna desde sentado, empujar hacia arriba verticalmente hasta extensión completa de codo."
  },
  bench_press: {
    name: "Press de banca",
    category: "Fuerza Funcional",
    description: "Cajón decúbito supino, piernas apoyadas en suelo, mancuerna, bajar hasta valla."
  },
  dominadas: {
    name: "Dominadas",
    category: "Fuerza Funcional",
    description: "Colgado de barra, pasar el mentón por encima de la barra de tracción sin balanceo."
  },
  hip_flex_0: {
    name: "Flexores cadera 0-0º",
    category: "Dinamometría",
    description: "Cadena gancho suelo."
  },
  hip_flex_90: {
    name: "Flexores cadera 0-90º",
    category: "Dinamometría",
    description: "Cadena gancho suelo."
  },
  squeeze_test: {
    name: "Squezze Test",
    category: "Dinamometría",
    description: "Palanca corta para fuerza, decúbito supino, cadera 45°, rodilla 90°. Para hacer palanca larga ya tenemos el unilateral, pero nos interesa hacer palanca larga en el caso de que tenga molestia o dolor para estratificar cuánto puede hacer."
  },
  adductors: {
    name: "Aductores",
    category: "Dinamometría",
    description: "Palanca larga PIC (decúbito lateral, por presión)."
  },
  abductors: {
    name: "Abductores",
    category: "Dinamometría",
    description: "Cadena gancho suelo en camilla decúbito lateral, por tracción, cuidar extensión de cadera."
  },
  quads_strength: {
    name: "Cuádriceps",
    category: "Dinamometría",
    description: "90° cadera, 70° rodilla, dirección perpendicular de la cadena, agarrado con las manos o 90°90°."
  },
  dj_height: {
    name: "DJ: altura del salto",
    category: "Saltos / Pliometría",
    description: "15 cm de altura a 1 pierna, 30 cm a 2 piernas."
  }
};

