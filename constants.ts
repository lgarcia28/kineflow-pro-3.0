
import { Patient, Stage, ExerciseDefinition, PlanType, CheckInStatus, Product } from './types';

export const EXERCISES: ExerciseDefinition[] = [
  { id: 'ex1', name: 'Sentadilla en cajón', category: 'Pierna', videoUrl: 'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=200&h=200&fit=crop', metricType: 'kg' },
  { id: 'ex2', name: 'Puente de glúteos unipodal', category: 'Cadera', videoUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&h=200&fit=crop', metricType: 'kg' },
  { id: 'ex3', name: 'Press Paloff', category: 'Core', videoUrl: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=200&h=200&fit=crop', metricType: 'kg' },
  { id: 'ex4', name: 'Estocadas con mancuerna', category: 'Pierna', videoUrl: 'https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?w=200&h=200&fit=crop', metricType: 'kg' },
  { id: 'ex5', name: 'Movilidad de tobillo', category: 'Movilidad', videoUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&h=200&fit=crop', metricType: 'time' },
  { id: 'ex6', name: 'Remo TRX', category: 'Espalda', videoUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a05?w=200&h=200&fit=crop', metricType: 'kg' },
  { id: 'ex7', name: 'Plancha Frontal', category: 'Core', videoUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop', metricType: 'time' },
  { id: 'ex8', name: 'Bicho Muerto (Deadbug)', category: 'Core', videoUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=200&h=200&fit=crop', metricType: 'kg' },
  { id: 'ex9', name: 'Monster Walk', category: 'Cadera', videoUrl: 'https://images.unsplash.com/photo-1542766788-a2f588f447ee?w=200&h=200&fit=crop', metricType: 'kg' },
  { id: 'ex10', name: 'Vuelos Laterales', category: 'Hombro', videoUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=200&h=200&fit=crop', metricType: 'kg' },
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
