import { BusinessUnit, CostClassification, HistoricalMonthEERR } from '../types';

export interface CategoryOption {
  name: string;
  businessUnit?: BusinessUnit;
  costClassification?: CostClassification;
  group: string;
}

export const INCOME_CATEGORIES: CategoryOption[] = [
  // Kinesiología
  { name: 'Particular', businessUnit: 'KINESIO', group: 'Kinesiología' },
  { name: 'Obra Sociales', businessUnit: 'KINESIO', group: 'Kinesiología' },
  { name: 'Adicional Obra Social', businessUnit: 'KINESIO', group: 'Kinesiología' },
  { name: 'Unr', businessUnit: 'KINESIO', group: 'Kinesiología' },
  { name: 'Iapos', businessUnit: 'KINESIO', group: 'Kinesiología' },
  { name: 'Adicionales', businessUnit: 'KINESIO', group: 'Kinesiología' },
  { name: 'Evaluaciones', businessUnit: 'KINESIO', group: 'Kinesiología' },
  { name: 'Drenaje', businessUnit: 'KINESIO', group: 'Kinesiología' },
  { name: 'Terapia Manual', businessUnit: 'KINESIO', group: 'Kinesiología' },
  { name: 'Posturo', businessUnit: 'KINESIO', group: 'Kinesiología' },
  { name: 'Estampillado', businessUnit: 'KINESIO', group: 'Kinesiología' },
  { name: 'Domicilio', businessUnit: 'KINESIO', group: 'Kinesiología' },
  { name: 'Médico', businessUnit: 'KINESIO', group: 'Kinesiología' },
  { name: 'Nutricionista', businessUnit: 'KINESIO', group: 'Kinesiología' },

  // Gimnasio
  { name: 'Gimnasio 1 vez por semana', businessUnit: 'GYM', group: 'Gimnasio' },
  { name: 'Gimnasio 2 veces por semana', businessUnit: 'GYM', group: 'Gimnasio' },
  { name: 'Gimanasio 3 veces por semana', businessUnit: 'GYM', group: 'Gimnasio' },
  { name: 'Entrenamiento para viajero 1 vez por semana', businessUnit: 'GYM', group: 'Gimnasio' },
  { name: 'Entrenamiento para viajero 2 veces por semana', businessUnit: 'GYM', group: 'Gimnasio' },
  { name: 'Entrenamiento para viajero 3 veces por semana', businessUnit: 'GYM', group: 'Gimnasio' },

  // Alquileres y Aparatología
  { name: 'Alquiler consultorio', businessUnit: 'ALQUILERES', group: 'Alquileres' },
  { name: 'Ondas de Choques', businessUnit: 'ALQUILERES', group: 'Alquileres' },
  { name: 'Magneto Alquiler', businessUnit: 'ALQUILERES', group: 'Alquileres' },
  { name: 'Game Ready', businessUnit: 'ALQUILERES', group: 'Alquileres' },

  // Turismo
  { name: 'Turismo Ventas', businessUnit: 'TURISMO', group: 'Turismo' },

  // Otros
  { name: 'Ingr. Tranferencias', businessUnit: 'GENERAL', group: 'Otros' },
  { name: 'Otros Ingresos', businessUnit: 'GENERAL', group: 'Otros' },
];

export const EXPENSE_CATEGORIES: CategoryOption[] = [
  // Costos Variables
  { name: 'Ins. kine', costClassification: 'VARIABLE', businessUnit: 'KINESIO', group: 'Costos Variables' },
  { name: 'Ins. limpieza', costClassification: 'VARIABLE', businessUnit: 'KINESIO', group: 'Costos Variables' },
  { name: 'Arreglos', costClassification: 'VARIABLE', businessUnit: 'KINESIO', group: 'Costos Variables' },
  { name: 'Libreria', costClassification: 'VARIABLE', businessUnit: 'KINESIO', group: 'Costos Variables' },
  { name: 'Reuniones', costClassification: 'VARIABLE', businessUnit: 'KINESIO', group: 'Costos Variables' },
  { name: 'Cadeteria', costClassification: 'VARIABLE', businessUnit: 'KINESIO', group: 'Costos Variables' },
  { name: 'Yerba/café', costClassification: 'VARIABLE', businessUnit: 'KINESIO', group: 'Costos Variables' },
  { name: 'Publicidad', costClassification: 'VARIABLE', businessUnit: 'GENERAL', group: 'Costos Variables' },

  // Gastos Fijos / Estructura Operativa
  { name: 'Alquiler Local', costClassification: 'FIXED', businessUnit: 'GENERAL', group: 'Estructura Operativa' },
  { name: 'Luz', costClassification: 'FIXED', businessUnit: 'GENERAL', group: 'Servicios' },
  { name: 'Agua', costClassification: 'FIXED', businessUnit: 'GENERAL', group: 'Servicios' },
  { name: 'Gas', costClassification: 'FIXED', businessUnit: 'GENERAL', group: 'Servicios' },
  { name: 'Teléfono/Internet', costClassification: 'FIXED', businessUnit: 'GENERAL', group: 'Servicios' },
  { name: 'Expensas', costClassification: 'FIXED', businessUnit: 'GENERAL', group: 'Servicios' },
  { name: 'Aguared', costClassification: 'FIXED', businessUnit: 'GENERAL', group: 'Servicios' },
  { name: 'Pers. Limpieza', costClassification: 'FIXED', businessUnit: 'GENERAL', group: 'Estructura Operativa' },
  { name: 'Seguro', costClassification: 'FIXED', businessUnit: 'GENERAL', group: 'Estructura Operativa' },
  { name: 'Ecco Cobertura', costClassification: 'FIXED', businessUnit: 'GENERAL', group: 'Estructura Operativa' },
  { name: 'Honorarios contadora', costClassification: 'FIXED', businessUnit: 'GENERAL', group: 'Honorarios' },
  { name: 'Honorarios Couch', costClassification: 'FIXED', businessUnit: 'GENERAL', group: 'Honorarios' },
  { name: 'Sueldos', costClassification: 'FIXED', businessUnit: 'GENERAL', group: 'Sueldos' },
  { name: 'Sueldos secretarias', costClassification: 'FIXED', businessUnit: 'GENERAL', group: 'Sueldos' },
  { name: 'Sueldos kinesiologos', costClassification: 'FIXED', businessUnit: 'GENERAL', group: 'Sueldos' },
  { name: 'Cobros OS Angie Lean Colo', costClassification: 'FIXED', businessUnit: 'KINESIO', group: 'Honorarios' },
  { name: 'Adicional Angie', costClassification: 'FIXED', businessUnit: 'KINESIO', group: 'Honorarios' },
  { name: 'Adicional Colo', costClassification: 'FIXED', businessUnit: 'KINESIO', group: 'Honorarios' },
  { name: 'Adicional Lean', costClassification: 'FIXED', businessUnit: 'KINESIO', group: 'Honorarios' },
  { name: 'Gastos estampillado', costClassification: 'FIXED', businessUnit: 'KINESIO', group: 'Estructura Operativa' },
  { name: 'Gastos reuniones', costClassification: 'FIXED', businessUnit: 'GENERAL', group: 'Estructura Operativa' },

  // Inversiones y Retiros
  { name: 'Egresos por Inversiones', costClassification: 'INVESTMENT', businessUnit: 'GENERAL', group: 'Inversiones' },
  { name: 'Retiro', costClassification: 'NONE', businessUnit: 'GENERAL', group: 'Retiros' },
  { name: 'Extracción Transf', costClassification: 'NONE', businessUnit: 'GENERAL', group: 'Retiros' },
  { name: 'Otros', costClassification: 'FIXED', businessUnit: 'GENERAL', group: 'Otros' },
];

export const KNOWN_PROFESSIONALS = ['Angie', 'Lean', 'Colo'];

export const HISTORICAL_EERR_2026: HistoricalMonthEERR[] = [
  { month: 'Enero', monthNumber: 1, year: 2026, revenue: 10646469.2, variableCosts: 553116.84, grossMargin: 10093352.36, fixedCosts: 11157713.11, ebitda: -1064360.75 },
  { month: 'Febrero', monthNumber: 2, year: 2026, revenue: 10429505, variableCosts: 693856.97, grossMargin: 9735648.03, fixedCosts: 8596887.63, ebitda: 1138760.4 },
  { month: 'Marzo', monthNumber: 3, year: 2026, revenue: 14602868, variableCosts: 368352, grossMargin: 14234516, fixedCosts: 10443286.92, ebitda: 3791229.08 },
  { month: 'Abril', monthNumber: 4, year: 2026, revenue: 15975372, variableCosts: 497998, grossMargin: 15477374, fixedCosts: 10290075.65, ebitda: 5187298.35 },
  { month: 'Mayo', monthNumber: 5, year: 2026, revenue: 14124687, variableCosts: 199776.31, grossMargin: 13924910.69, fixedCosts: 11531422.97, ebitda: 2393487.72 },
  { month: 'Junio', monthNumber: 6, year: 2026, revenue: 16659520, variableCosts: 306417.16, grossMargin: 16353102.84, fixedCosts: 12997479.57, ebitda: 3355623.27 },
  { month: 'Julio', monthNumber: 7, year: 2026, revenue: 17394919, variableCosts: 767299, grossMargin: 16627620, fixedCosts: 13658743.24, ebitda: 2968876.76 },
  { month: 'Agosto', monthNumber: 8, year: 2026, revenue: 17604672, variableCosts: 677854, grossMargin: 16926818, fixedCosts: 14112176.69, ebitda: 2814641.31 },
  { month: 'Septiembre', monthNumber: 9, year: 2026, revenue: 18823371, variableCosts: 695077.2, grossMargin: 18128293.8, fixedCosts: 13642438.5, ebitda: 4485855.3 },
  { month: 'Octubre', monthNumber: 10, year: 2026, revenue: 0, variableCosts: 0, grossMargin: 0, fixedCosts: 1566149.55, ebitda: -1566149.55 },
  { month: 'Noviembre', monthNumber: 11, year: 2026, revenue: 0, variableCosts: 0, grossMargin: 0, fixedCosts: 0, ebitda: 0 },
  { month: 'Diciembre', monthNumber: 12, year: 2026, revenue: 0, variableCosts: 0, grossMargin: 0, fixedCosts: 0, ebitda: 0 }
];

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function getAutoClassification(category: string, isIncome: boolean): { businessUnit: BusinessUnit; costClassification: CostClassification } {
  const c = category.toLowerCase().trim();
  if (isIncome) {
    if (c.includes('gimnasio') || c.includes('gym') || c.includes('viajero')) {
      return { businessUnit: 'GYM', costClassification: 'NONE' };
    }
    if (c.includes('turismo')) {
      return { businessUnit: 'TURISMO', costClassification: 'NONE' };
    }
    if (c.includes('alquiler') || c.includes('magneto') || c.includes('ondas') || c.includes('game ready')) {
      return { businessUnit: 'ALQUILERES', costClassification: 'NONE' };
    }
    return { businessUnit: 'KINESIO', costClassification: 'NONE' };
  } else {
    if (
      c.includes('ins.') ||
      c.includes('insumos') ||
      c.includes('arreglos') ||
      c.includes('libreria') ||
      c.includes('reuniones') ||
      c.includes('cadeteria') ||
      c.includes('yerba') ||
      c.includes('cafe') ||
      c.includes('publicidad')
    ) {
      return { businessUnit: 'KINESIO', costClassification: 'VARIABLE' };
    }
    if (c.includes('inversion') || c.includes('inversiones')) {
      return { businessUnit: 'GENERAL', costClassification: 'INVESTMENT' };
    }
    return { businessUnit: 'GENERAL', costClassification: 'FIXED' };
  }
}
