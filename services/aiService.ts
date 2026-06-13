import { app } from '../firebase';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import { ExerciseDefinition, RoutineDay, RoutineExercise, WeeklyTarget } from '../types';

let aiInstance: any = null;

const getAIInstance = () => {
  if (!aiInstance && app) {
    try {
      aiInstance = getAI(app, { backend: new GoogleAIBackend() });
      console.log("firebase/ai initialized successfully.");
    } catch (e) {
      console.error("Error initializing firebase/ai:", e);
    }
  }
  return aiInstance;
};

interface AIExerciseOutput {
  definitionId: string;
  targetSets: number;
  targetReps: number;
  targetLoad: number;
  weeklyTargets: WeeklyTarget[];
}

interface AIDayOutput {
  name: string;
  exercises: AIExerciseOutput[];
}

export const generateAIPortion = async (
  patientCondition: string,
  sessionsPerWeek: number,
  exercisesLibrary: ExerciseDefinition[],
  objectives: string,
  progressionStyle: string
): Promise<RoutineDay[]> => {
  const ai = getAIInstance();
  if (!ai) {
    throw new Error("El servicio de IA no está disponible o Firebase no está configurado.");
  }

  // Filtrar los ejercicios de la biblioteca para el prompt
  const exercisesPromptList = exercisesLibrary.map(ex => ({
    id: ex.id,
    name: ex.name,
    category: ex.category,
    metricType: ex.metricType,
    difficulty: ex.difficulty || 1
  }));

  const systemInstruction = `
Eres un Kinesiólogo y preparador físico experto en rehabilitación y entrenamiento.
Tu tarea es diseñar una rutina de entrenamiento estructurada en un MACROCICLO de 6 meses (24 semanas en total), dividida en 6 MESOCICLOS de 4 semanas cada uno.

El paciente tiene la siguiente condición clínica: "${patientCondition}".
El objetivo principal del macrociclo es: "${objectives}".
El estilo de progresión de la carga debe ser: "${progressionStyle}".
La cantidad de días de entrenamiento por semana es: ${sessionsPerWeek}.

Debes seleccionar los ejercicios adecuados de la siguiente biblioteca y organizarlos en ${sessionsPerWeek} días de rutina (Día 1, Día 2, etc.):
${JSON.stringify(exercisesPromptList, null, 2)}

REGLAS DE DISEÑO DE LA RUTINA:
1. Selecciona entre 4 y 7 ejercicios por día de la biblioteca provista. Utiliza únicamente los ejercicios de la biblioteca, haciendo referencia estricta a su 'id' como 'definitionId'. No inventes ejercicios nuevos.
2. ORDEN DE DIFICULTAD Y PROGRESIÓN TEMPORAL:
   - Progresa e introduce los ejercicios basándote en su dificultad ('difficulty', escala 1 a 5).
   - En el Mesociclo 1 (Semanas 1-4), utiliza ejercicios más sencillos (dificultad 1 y 2).
   - En los Mesociclos 2 y 3 (Semanas 5-12), introduce gradualmente ejercicios de dificultad 3.
   - En los Mesociclos 4, 5 y 6 (Semanas 13-24), introduce progresivamente ejercicios de dificultad 4 y 5 como progresión o reemplazo de los anteriores.
3. CALCULO SEMANA A SEMANA (24 SEMANAS):
   - Para cada ejercicio seleccionado, debes generar un arreglo 'weeklyTargets' de exactamente 24 elementos correspondientes a las semanas 1 a 24.
   - Cada elemento de 'weeklyTargets' debe contener: { "week": número del 1 al 24, "sets": número de series, "reps": número de repeticiones (poner 0 si es por tiempo), "load": valor numérico de carga }.
   - El valor de 'load' depende de 'metricType':
     - Si es 'kg': carga en kilogramos (ej: comenzar con 5kg e incrementar de a 1 o 2.5kg según la progresión).
     - Si es 'time': tiempo en segundos (ej: planificar planchas de 30, 45, 60 segundos).
     - Si es 'tension': nivel de tensión de banda elástica (1: Baja, 2: Media, 3: Alta).
   - Progresa la carga según el estilo '${progressionStyle}':
     - 'Lineal': Aumentos constantes y pequeños semana a semana. Introduce una semana de descarga (bajar un 20% la carga/volumen) al final de cada mesociclo (semanas 4, 8, 12, 16, 20, 24).
     - 'Step' (En Escalón): Mantener la misma carga/volumen durante 3 semanas y subir el peldaño en la semana de inicio del siguiente mesociclo, con descarga si es necesario.
     - 'Ondulante': Alternar semanas de alta intensidad / bajo volumen con semanas de baja intensidad / alto volumen.
     - 'Conservadora': Progresión extremadamente lenta y controlada, manteniendo las variables muy estables antes de realizar un incremento seguro.
4. El objeto JSON de respuesta debe ser un arreglo de días de entrenamiento.

RETORNA EXCLUSIVAMENTE UN ARREGLO JSON CON LA SIGUIENTE ESTRUCTURA:
[
  {
    "name": "Día 1: [Nombre descriptivo, ej: Fuerza General o Control Motor]",
    "exercises": [
      {
        "definitionId": "[id del ejercicio de la biblioteca]",
        "targetSets": [series iniciales de la semana 1],
        "targetReps": [repeticiones iniciales de la semana 1],
        "targetLoad": [carga inicial de la semana 1],
        "weeklyTargets": [
          { "week": 1, "sets": 3, "reps": 12, "load": 10 },
          { "week": 2, "sets": 3, "reps": 12, "load": 12.5 },
          ...
          { "week": 24, "sets": 4, "reps": 10, "load": 20 }
        ]
      }
    ]
  }
]
No incluyas texto explicativo, solo el JSON formateado.
`;

  try {
    const model = getGenerativeModel(ai, {
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const result = await model.generateContent(systemInstruction);
    const responseText = await result.response.text();
    console.log("Raw AI Response received:", responseText);

    const parsedDays: AIDayOutput[] = JSON.parse(responseText);

    // Mapear los datos de IA a la estructura de la aplicación
    const routineDays: RoutineDay[] = parsedDays.map((day, idx) => {
      const exercises: RoutineExercise[] = day.exercises
        .map(ex => {
          const definition = exercisesLibrary.find(libEx => libEx.id === ex.definitionId);
          if (!definition) return null;

          return {
            id: `re-${Date.now()}-${ex.definitionId}-${Math.random().toString(36).substr(2, 5)}`,
            definitionId: ex.definitionId,
            definition,
            targetSets: ex.targetSets || 3,
            targetReps: ex.targetReps !== undefined ? ex.targetReps : 10,
            targetLoad: ex.targetLoad || 0,
            isDone: false,
            history: [],
            weeklyTargets: ex.weeklyTargets || []
          } as RoutineExercise;
        })
        .filter((ex): ex is RoutineExercise => ex !== null);

      return {
        id: `d-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
        name: day.name,
        exercises
      };
    });

    return routineDays;
  } catch (error) {
    console.error("Error generating routine with AI:", error);
    throw error;
  }
};
