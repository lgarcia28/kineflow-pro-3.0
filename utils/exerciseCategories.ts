import { ExerciseDefinition } from '../types';

export const BODY_REGIONS = [
  'Miembro Inferior',
  'Miembro Superior',
  'Zona Media / Columna',
  'Cabeza y Cuello',
  'General / Full Body'
] as const;

export type BodyRegion = typeof BODY_REGIONS[number];

export const SUB_REGIONS_BY_REGION: Record<string, string[]> = {
  'Miembro Inferior': [
    'Tobillo y Pie',
    'Rodilla',
    'Cadera',
    'Muslo / Isquios / Cuádriceps',
    'Pantorrilla / Gemelos / Sóleo'
  ],
  'Miembro Superior': [
    'Hombro y Escápula',
    'Codo y Antebrazo',
    'Muñeca y Mano'
  ],
  'Zona Media / Columna': [
    'Zona Lumbar',
    'Zona Torácica / Dorsal',
    'Abdomen / Core',
    'Suelo Pélvico'
  ],
  'Cabeza y Cuello': [
    'Cuello / Cervical',
    'Mandíbula (ATM)'
  ],
  'General / Full Body': [
    'Cardio / Aeróbico',
    'Cadenas Musculares / Global'
  ]
};

export const MOVEMENT_TYPES = [
  'Flexión / Extensión',
  'Movilidad / Rango Articular',
  'Fuerza / Potencia',
  'Aeróbico / Resistencia',
  'Neurodinamia / Movilización Neural',
  'Propiocepción / Equilibrio',
  'Flexibilidad / Estiramiento'
] as const;

export type MovementType = typeof MOVEMENT_TYPES[number];

export interface InferredCategories {
  region: string;
  subRegion: string;
  movementType: string;
}

export function inferExerciseCategories(ex: Partial<ExerciseDefinition>): InferredCategories {
  let region = ex.bodyRegion || '';
  let subRegion = ex.subRegion || '';
  let movementType = ex.movementType || '';

  const fullStr = `${ex.name || ''} ${ex.category || ''}`.toLowerCase();

  // Infer Region if missing
  if (!region) {
    if (/tobillo|pie|rodilla|cadera|pierna|glúteo|gluteo|isquio|cuádriceps|cuadriceps|sentadilla|estocada|monster|gemelo/i.test(fullStr)) {
      region = 'Miembro Inferior';
    } else if (/hombro|codo|ante brazo|antebrazo|muñeca|mano|escápula|escapula|biceps|bíceps|tríceps|triceps|trx|remo|vuelos|press/i.test(fullStr)) {
      region = 'Miembro Superior';
    } else if (/core|lumbar|dorsal|torácica|toracica|plancha|espalda|bicho muerto|deadbug|paloff|abdomen|abdominal/i.test(fullStr)) {
      region = 'Zona Media / Columna';
    } else if (/cervical|cuello|atm|mandíbula|mandibula|cabeza/i.test(fullStr)) {
      region = 'Cabeza y Cuello';
    } else {
      region = 'General / Full Body';
    }
  }

  // Infer SubRegion if missing
  if (!subRegion) {
    if (/tobillo|pie/i.test(fullStr)) subRegion = 'Tobillo y Pie';
    else if (/rodilla/i.test(fullStr)) subRegion = 'Rodilla';
    else if (/cadera|glúteo|gluteo|monster/i.test(fullStr)) subRegion = 'Cadera';
    else if (/isquio|cuádriceps|cuadriceps|sentadilla|estocada/i.test(fullStr)) subRegion = 'Muslo / Isquios / Cuádriceps';
    else if (/pantorrilla|gemelo|sóleo|soleo/i.test(fullStr)) subRegion = 'Pantorrilla / Gemelos / Sóleo';
    else if (/hombro|escápula|escapula|vuelos/i.test(fullStr)) subRegion = 'Hombro y Escápula';
    else if (/codo|antebrazo|biceps|triceps/i.test(fullStr)) subRegion = 'Codo y Antebrazo';
    else if (/muñeca|mano/i.test(fullStr)) subRegion = 'Muñeca y Mano';
    else if (/lumbar/i.test(fullStr)) subRegion = 'Zona Lumbar';
    else if (/dorsal|torácica|toracica|remo/i.test(fullStr)) subRegion = 'Zona Torácica / Dorsal';
    else if (/core|plancha|bicho muerto|deadbug|paloff|abdomen|abdominal/i.test(fullStr)) subRegion = 'Abdomen / Core';
    else if (/suelo pélvico|pelvico/i.test(fullStr)) subRegion = 'Suelo Pélvico';
    else if (/cuello|cervical/i.test(fullStr)) subRegion = 'Cuello / Cervical';
    else if (/mandíbula|mandibula|atm/i.test(fullStr)) subRegion = 'Mandíbula (ATM)';
    else if (/cardio|bici|cinta|trote/i.test(fullStr)) subRegion = 'Cardio / Aeróbico';
    else subRegion = SUB_REGIONS_BY_REGION[region]?.[0] || 'General';
  }

  // Infer MovementType if missing
  if (!movementType) {
    if (/neurodinam|nervio|gliding|sliding/i.test(fullStr)) movementType = 'Neurodinamia / Movilización Neural';
    else if (/movilidad|rango|movimiento|flexibilidad|estiramiento/i.test(fullStr)) movementType = 'Movilidad / Rango Articular';
    else if (/flexión|flexion|extensión|extension/i.test(fullStr)) movementType = 'Flexión / Extensión';
    else if (/propiocep|equilibrio|balance|estabilidad/i.test(fullStr)) movementType = 'Propiocepción / Equilibrio';
    else if (/aeróbico|aerobico|cardio|resistencia/i.test(fullStr)) movementType = 'Aeróbico / Resistencia';
    else movementType = 'Fuerza / Potencia';
  }

  return { region, subRegion, movementType };
}

export function formatCategoryString(region: string, subRegion: string, movementType: string): string {
  const parts = [];
  if (region) parts.push(region);
  if (subRegion && subRegion !== 'General') parts.push(subRegion);
  if (movementType) parts.push(movementType);
  return parts.join(' • ');
}

export function getRegionColorBadge(region: string): { bg: string; text: string; border: string } {
  switch (region) {
    case 'Miembro Inferior':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'Miembro Superior':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case 'Zona Media / Columna':
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
    case 'Cabeza y Cuello':
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    case 'General / Full Body':
    default:
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
  }
}
