import { BusinessUnit, CostClassification, HistoricalMonthEERR } from '../types';

export interface CategoryOption {
  name: string;
  businessUnit?: BusinessUnit;
  costClassification?: CostClassification;
  group: string;
}

// Orden exacto de la hoja Resumen de "Agosto 2026. Ingresos y gastos.xlsx" (Filas 6 a 29)
export const RESUMEN_INCOME_ORDER: string[] = [
  'Particular',
  'Obra Sociales',
  'Unr',
  'Iapos',
  'Alquiler consultorio',
  'Domicilio',
  'Drenaje',
  'Evaluaciones',
  'Game Ready',
  'Gimnasio 1 vez por semana',
  'Gimnasio 2 veces por semana',
  'Gimanasio 3 veces por semana',
  'Entrenamiento para viajero 1 vez por semana',
  'Entrenamiento para viajero 2 veces por semana',
  'Entrenamiento para viajero 3 veces por semana',
  'Magneto Alquiler',
  'Reflexologia',
  'Terapia Manual',
  'Médico',
  'Nutricionista',
  'Ondas de Choques',
  'Ingr. Tranferencias',
  'Posturo',
  'Estampillado'
];

// Orden exacto de la hoja Resumen de "Agosto 2026. Ingresos y gastos.xlsx" (Filas 30 a 54)
export const RESUMEN_EXPENSE_ORDER: string[] = [
  'Aguared',
  'Alquiler Local',
  'Arreglos',
  'Ecco Cobertura',
  'Expensas',
  'Gas',
  'Ins. kine',
  'Ins. limpieza',
  'Libreria',
  'Luz',
  'Otros',
  'Pers. Limpieza',
  'Publicidad',
  'Seguro',
  'Sueldos',
  'Teléfono/Internet',
  'Retiro',
  'Extracción Transf',
  'Yerba/café',
  'Gastos estampillado',
  'Gastos reuniones',
  'Egresos por Inversiones',
  'Cadeteria',
  'Adicional Angie',
  'Adicional Colo'
];

export const INCOME_CATEGORIES: CategoryOption[] = [
  // Kinesiología
  { name: 'Particular', businessUnit: 'KINESIO', costClassification: 'NONE', group: 'Kinesiología' },
  { name: 'Obra Sociales', businessUnit: 'KINESIO', costClassification: 'NONE', group: 'Kinesiología' },
  { name: 'Adicional Obra Social', businessUnit: 'KINESIO', costClassification: 'NONE', group: 'Kinesiología' },
  { name: 'Unr', businessUnit: 'KINESIO', costClassification: 'NONE', group: 'Kinesiología' },
  { name: 'Iapos', businessUnit: 'KINESIO', costClassification: 'NONE', group: 'Kinesiología' },
  { name: 'Adicionales', businessUnit: 'KINESIO', costClassification: 'NONE', group: 'Kinesiología' },
  { name: 'Drenaje', businessUnit: 'KINESIO', costClassification: 'NONE', group: 'Kinesiología' },
  { name: 'Reflexologia', businessUnit: 'KINESIO', costClassification: 'NONE', group: 'Kinesiología' },
  { name: 'Estampillado', businessUnit: 'KINESIO', costClassification: 'NONE', group: 'Kinesiología' },
  { name: 'Domicilio', businessUnit: 'KINESIO', costClassification: 'NONE', group: 'Kinesiología' },
  { name: 'Médico', businessUnit: 'KINESIO', costClassification: 'NONE', group: 'Kinesiología' },
  { name: 'Nutricionista', businessUnit: 'KINESIO', costClassification: 'NONE', group: 'Kinesiología' },

  // Gimnasio
  { name: 'Gimnasio 1 vez por semana', businessUnit: 'GYM', costClassification: 'NONE', group: 'Gimnasio' },
  { name: 'Gimnasio 2 veces por semana', businessUnit: 'GYM', costClassification: 'NONE', group: 'Gimnasio' },
  { name: 'Gimanasio 3 veces por semana', businessUnit: 'GYM', costClassification: 'NONE', group: 'Gimnasio' },

  // Turismo / Entrenamiento Viajero
  { name: 'Entrenamiento para viajero 1 vez por semana', businessUnit: 'TURISMO', costClassification: 'NONE', group: 'Turismo' },
  { name: 'Entrenamiento para viajero 2 veces por semana', businessUnit: 'TURISMO', costClassification: 'NONE', group: 'Turismo' },
  { name: 'Entrenamiento para viajero 3 veces por semana', businessUnit: 'TURISMO', costClassification: 'NONE', group: 'Turismo' },
  { name: 'Turismo Ventas', businessUnit: 'TURISMO', costClassification: 'NONE', group: 'Turismo' },

  // Alquileres, Evaluaciones y Aparatología
  { name: 'Ondas de Choques', businessUnit: 'ALQUILERES', costClassification: 'NONE', group: 'Alquileres y Equipos' },
  { name: 'Evaluaciones', businessUnit: 'ALQUILERES', costClassification: 'NONE', group: 'Alquileres y Equipos' },
  { name: 'Terapia Manual', businessUnit: 'ALQUILERES', costClassification: 'NONE', group: 'Alquileres y Equipos' },
  { name: 'Posturo', businessUnit: 'ALQUILERES', costClassification: 'NONE', group: 'Alquileres y Equipos' },
  { name: 'Alquiler consultorio', businessUnit: 'ALQUILERES', costClassification: 'NONE', group: 'Alquileres y Equipos' },
  { name: 'Magneto Alquiler', businessUnit: 'ALQUILERES', costClassification: 'NONE', group: 'Alquileres y Equipos' },
  { name: 'Game Ready', businessUnit: 'ALQUILERES', costClassification: 'NONE', group: 'Alquileres y Equipos' },

  // Movimientos Internos / Tesorería
  { name: 'Ingr. Tranferencias', businessUnit: 'GENERAL', costClassification: 'NONE', group: 'Tesorería / Pases de Caja' },
  { name: 'Otros Ingresos', businessUnit: 'GENERAL', costClassification: 'NONE', group: 'Otros' },
];

export const EXPENSE_CATEGORIES: CategoryOption[] = [
  // Costos Variables (Costo de Atender)
  { name: 'Ins. kine', costClassification: 'VARIABLE', businessUnit: 'KINESIO', group: 'Costos Variables' },
  { name: 'Ins. limpieza', costClassification: 'VARIABLE', businessUnit: 'KINESIO', group: 'Costos Variables' },
  { name: 'Arreglos', costClassification: 'VARIABLE', businessUnit: 'KINESIO', group: 'Costos Variables' },
  { name: 'Libreria', costClassification: 'VARIABLE', businessUnit: 'KINESIO', group: 'Costos Variables' },
  { name: 'Gastos reuniones', costClassification: 'VARIABLE', businessUnit: 'KINESIO', group: 'Costos Variables' },
  { name: 'Reuniones', costClassification: 'VARIABLE', businessUnit: 'KINESIO', group: 'Costos Variables' },
  { name: 'Cadeteria', costClassification: 'VARIABLE', businessUnit: 'KINESIO', group: 'Costos Variables' },
  { name: 'Yerba/café', costClassification: 'VARIABLE', businessUnit: 'KINESIO', group: 'Costos Variables' },
  { name: 'Publicidad Digital (Facebook/IG)', costClassification: 'VARIABLE', businessUnit: 'KINESIO', group: 'Costos Variables' },

  // Gastos Fijos / Estructura Operativa
  { name: 'Alquiler Local', costClassification: 'FIXED', businessUnit: 'GENERAL', group: 'Estructura Operativa' },
  { name: 'Luz', costClassification: 'FIXED', businessUnit: 'GENERAL', group: 'Servicios' },
  { name: 'Agua', costClassification: 'FIXED', businessUnit: 'GENERAL', group: 'Servicios' },
  { name: 'Gas', costClassification: 'FIXED', businessUnit: 'GENERAL', group: 'Servicios' },
  { name: 'Teléfono/Internet', costClassification: 'FIXED', businessUnit: 'GENERAL', group: 'Servicios' },
  { name: 'Expensas', costClassification: 'FIXED', businessUnit: 'GENERAL', group: 'Servicios' },
  { name: 'Aguared', costClassification: 'FIXED', businessUnit: 'GENERAL', group: 'Servicios' },
  { name: 'Publicidad', costClassification: 'FIXED', businessUnit: 'GENERAL', group: 'Estructura Operativa' },
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
  { name: 'Otros', costClassification: 'FIXED', businessUnit: 'GENERAL', group: 'Otros' },

  // Inversiones y Pases de Caja
  { name: 'Egresos por Inversiones', costClassification: 'INVESTMENT', businessUnit: 'GENERAL', group: 'Inversiones' },
  { name: 'Retiro', costClassification: 'NONE', businessUnit: 'GENERAL', group: 'Tesorería / Pases de Caja' },
  { name: 'Extracción Transf', costClassification: 'NONE', businessUnit: 'GENERAL', group: 'Tesorería / Pases de Caja' },
];

export const KNOWN_PROFESSIONALS = ['Angie', 'Lean', 'Colo'];

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const HISTORICAL_EERR_2026: HistoricalMonthEERR[] = [
  {
    "month": "Enero",
    "monthNumber": 1,
    "year": 2026,
    "revenue": 10646469.2,
    "kinesioRevenue": 8625019.2,
    "gymRevenue": 1745450.0,
    "turismoRevenue": 0.0,
    "alquileresRevenue": 276000.0,
    "kinesioBreakdown": {
      "Obras sociales": 3543909.74,
      "Adicional Obra Social": 1307400.0,
      "Adicional UNR": 446609.46,
      "Adicional Iapos": 938500.0,
      "Particulares": 2388600.0,
      "Adicionales": 0.0
    },
    "alquileresBreakdown": {
      "Ondas de choque": 135000.0,
      "Evaluaciones": 11000.0,
      "Terapia manual": 13500.0,
      "Posturoterapia": 0.0,
      "Alquiler Magneto": 104000.0,
      "Alquiler consultorio": 12500.0
    },
    "variableCosts": 553116.84,
    "variableCostsBreakdown": {
      "Insumos kinesicos": 74600.0,
      "Insumos limpieza": 113889.0,
      "Arreglos/mantenimiento": 273227.84,
      "Libreria": 0.0,
      "Reuniones": 39750.0,
      "Cadeteria": 10000.0,
      "Yerba/café": 3300.0,
      "Publicidad Digital (Facebook/IG)": 38350.0
    },
    "grossMargin": 10093352.36,
    "fixedCosts": 11157713.11,
    "fixedCostsBreakdown": {
      "Alquileres": 861547.0,
      "Luz": 69866.99,
      "Agua": 29453.0,
      "Gas": 2334.4,
      "Telefono": 9741.92,
      "Internet": 22064.6,
      "Publicidad": 91300.0,
      "Limpieza": 300000.0,
      "Agua Red": 35000.0,
      "Seguro": 28501.0,
      "Ecco": 30616.2,
      "Expensas": 42700.0,
      "Honorarios contadora": 75000.0,
      "Honorarios Couch": 0.0,
      "Sueldos secretarias": 1265040.0,
      "Sueldos kinesiologos": 2553374.0,
      "Cobros OS Angie Lean Colo": 5741174.0
    },
    "ebitda": -1064360.75,
    "investments": 937000
  },
  {
    "month": "Febrero",
    "monthNumber": 2,
    "year": 2026,
    "revenue": 10429505.0,
    "kinesioRevenue": 8351605.0,
    "gymRevenue": 1984750.0,
    "turismoRevenue": 0.0,
    "alquileresRevenue": 93150.0,
    "kinesioBreakdown": {
      "Obras sociales": 3325883.0,
      "Adicional Obra Social": 1159600.0,
      "Adicional UNR": 652222.0,
      "Adicional Iapos": 902700.0,
      "Particulares": 2311200.0,
      "Adicionales": 0.0
    },
    "alquileresBreakdown": {
      "Ondas de choque": 81750.0,
      "Evaluaciones": 11400.0,
      "Terapia manual": 0.0,
      "Posturoterapia": 0.0,
      "Alquiler Magneto": 0.0,
      "Alquiler consultorio": 0.0
    },
    "variableCosts": 693856.97,
    "variableCostsBreakdown": {
      "Insumos kinesicos": 39361.79,
      "Insumos limpieza": 141394.4,
      "Arreglos/mantenimiento": 385740.78,
      "Libreria": 19800.0,
      "Reuniones": 78400.0,
      "Cadeteria": 5000.0,
      "Yerba/café": 6600.0,
      "Publicidad Digital (Facebook/IG)": 17560.0
    },
    "grossMargin": 9735648.03,
    "fixedCosts": 8596887.63,
    "fixedCostsBreakdown": {
      "Alquileres": 853648.0,
      "Luz": 69866.98,
      "Agua": 29453.0,
      "Gas": 2433.23,
      "Telefono": 10400.0,
      "Internet": 22558.05,
      "Publicidad": 91300.0,
      "Limpieza": 275000.0,
      "Agua Red": 35000.0,
      "Seguro": 35259.0,
      "Ecco": 31320.37,
      "Expensas": 68600.0,
      "Honorarios contadora": 75000.0,
      "Honorarios Couch": 150000.0,
      "Sueldos secretarias": 1084320.0,
      "Sueldos kinesiologos": 2226342.0,
      "Cobros OS Angie Lean Colo": 3536387.0
    },
    "ebitda": 1138760.4,
    "investments": 395000
  },
  {
    "month": "Marzo",
    "monthNumber": 3,
    "year": 2026,
    "revenue": 14602868.0,
    "kinesioRevenue": 12346868.0,
    "gymRevenue": 2149500.0,
    "turismoRevenue": 0.0,
    "alquileresRevenue": 106500.0,
    "kinesioBreakdown": {
      "Obras sociales": 5215268.0,
      "Adicional Obra Social": 2111800.0,
      "Adicional UNR": 695300.0,
      "Adicional Iapos": 1291500.0,
      "Particulares": 3033000.0,
      "Adicionales": 0.0
    },
    "alquileresBreakdown": {
      "Ondas de choque": 76500.0,
      "Evaluaciones": 30000.0,
      "Terapia manual": 0.0,
      "Posturoterapia": 0.0,
      "Alquiler Magneto": 0.0,
      "Alquiler consultorio": 0.0
    },
    "variableCosts": 368352.0,
    "variableCostsBreakdown": {
      "Insumos kinesicos": 1000.0,
      "Insumos limpieza": 0.0,
      "Arreglos/mantenimiento": 71100.0,
      "Libreria": 61960.0,
      "Reuniones": 111220.0,
      "Cadeteria": 11000.0,
      "Yerba/café": 20520.0,
      "Publicidad Digital (Facebook/IG)": 91552.0
    },
    "grossMargin": 14234516.0,
    "fixedCosts": 10443286.92,
    "fixedCostsBreakdown": {
      "Alquileres": 840396.0,
      "Luz": 168530.83,
      "Agua": 33680.0,
      "Gas": 2389.97,
      "Telefono": 12000.0,
      "Internet": 23303.12,
      "Publicidad": 96500.0,
      "Limpieza": 300000.0,
      "Agua Red": 35000.0,
      "Seguro": 35259.0,
      "Ecco": 32103.0,
      "Expensas": 27100.0,
      "Honorarios contadora": 78000.0,
      "Honorarios Couch": 150000.0,
      "Sueldos secretarias": 1474720.0,
      "Sueldos kinesiologos": 3358572.0,
      "Cobros OS Angie Lean Colo": 3775733.0
    },
    "ebitda": 3791229.08,
    "investments": 0
  },
  {
    "month": "Abril",
    "monthNumber": 4,
    "year": 2026,
    "revenue": 15975372.0,
    "kinesioRevenue": 13249772.0,
    "gymRevenue": 2150600.0,
    "turismoRevenue": 0.0,
    "alquileresRevenue": 575000.0,
    "kinesioBreakdown": {
      "Obras sociales": 5679190.0,
      "Adicional Obra Social": 2532700.0,
      "Adicional UNR": 487574.0,
      "Adicional Iapos": 1269408.0,
      "Particulares": 3280900.0,
      "Adicionales": 0.0
    },
    "alquileresBreakdown": {
      "Ondas de choque": 378000.0,
      "Evaluaciones": 13000.0,
      "Terapia manual": 0.0,
      "Posturoterapia": 0.0,
      "Alquiler Magneto": 184000.0,
      "Alquiler consultorio": 0.0
    },
    "variableCosts": 497998.0,
    "variableCostsBreakdown": {
      "Insumos kinesicos": 3000.0,
      "Insumos limpieza": 182253.0,
      "Arreglos/mantenimiento": 0.0,
      "Libreria": 40100.0,
      "Reuniones": 14100.0,
      "Cadeteria": 39100.0,
      "Yerba/café": 5600.0,
      "Publicidad Digital (Facebook/IG)": 213845.0
    },
    "grossMargin": 15477374.0,
    "fixedCosts": 10290075.65,
    "fixedCostsBreakdown": {
      "Alquileres": 926602.0,
      "Luz": 168530.83,
      "Agua": 33680.0,
      "Gas": 2578.44,
      "Telefono": 12101.68,
      "Internet": 24307.31,
      "Publicidad": 96500.0,
      "Limpieza": 325000.0,
      "Agua Red": 35000.0,
      "Seguro": 32259.0,
      "Ecco": 32103.39,
      "Expensas": 28900.0,
      "Honorarios contadora": 78000.0,
      "Honorarios Couch": 150000.0,
      "Sueldos secretarias": 1361280.0,
      "Sueldos kinesiologos": 3338964.0,
      "Cobros OS Angie Lean Colo": 3644269.0
    },
    "ebitda": 5187298.35,
    "investments": 591760
  },
  {
    "month": "Mayo",
    "monthNumber": 5,
    "year": 2026,
    "revenue": 14124687.0,
    "kinesioRevenue": 11730087.0,
    "gymRevenue": 2215250.0,
    "turismoRevenue": 0.0,
    "alquileresRevenue": 179350.0,
    "kinesioBreakdown": {
      "Obras sociales": 4447087.0,
      "Adicional Obra Social": 2575400.0,
      "Adicional UNR": 570400.0,
      "Adicional Iapos": 704000.0,
      "Particulares": 3433200.0,
      "Adicionales": 0.0
    },
    "alquileresBreakdown": {
      "Ondas de choque": 65250.0,
      "Evaluaciones": 37100.0,
      "Terapia manual": 0.0,
      "Posturoterapia": 0.0,
      "Alquiler Magneto": 77000.0,
      "Alquiler consultorio": 0.0
    },
    "variableCosts": 199776.31,
    "variableCostsBreakdown": {
      "Insumos kinesicos": 7000.0,
      "Insumos limpieza": 74150.0,
      "Arreglos/mantenimiento": 49950.0,
      "Libreria": 21900.0,
      "Reuniones": 0.0,
      "Cadeteria": 11900.0,
      "Yerba/café": 8700.0,
      "Publicidad Digital (Facebook/IG)": 26176.31
    },
    "grossMargin": 13924910.69,
    "fixedCosts": 11531422.97,
    "fixedCostsBreakdown": {
      "Alquileres": 926252.0,
      "Luz": 190490.52,
      "Agua": 36700.0,
      "Gas": 2504.12,
      "Telefono": 13460.0,
      "Internet": 24915.01,
      "Publicidad": 96500.0,
      "Limpieza": 335000.0,
      "Agua Red": 35000.0,
      "Seguro": 35259.0,
      "Ecco": 33323.32,
      "Expensas": 45900.0,
      "Honorarios contadora": 78000.0,
      "Honorarios Couch": 150000.0,
      "Sueldos secretarias": 1290380.0,
      "Sueldos kinesiologos": 3002260.0,
      "Cobros OS Angie Lean Colo": 5235479.0
    },
    "ebitda": 2393487.72,
    "investments": 114973
  },
  {
    "month": "Junio",
    "monthNumber": 6,
    "year": 2026,
    "revenue": 16659520.0,
    "kinesioRevenue": 13844020.0,
    "gymRevenue": 2314500.0,
    "turismoRevenue": 319000.0,
    "alquileresRevenue": 182000.0,
    "kinesioBreakdown": {
      "Obras sociales": 5782257.0,
      "Adicional Obra Social": 2541500.0,
      "Adicional UNR": 764763.0,
      "Adicional Iapos": 920100.0,
      "Particulares": 3835400.0,
      "Adicionales": 0.0
    },
    "alquileresBreakdown": {
      "Ondas de choque": 170000.0,
      "Evaluaciones": 6800.0,
      "Terapia manual": 0.0,
      "Posturoterapia": 0.0,
      "Alquiler Magneto": 0.0,
      "Alquiler consultorio": 5200.0
    },
    "variableCosts": 306417.16,
    "variableCostsBreakdown": {
      "Insumos kinesicos": 0.0,
      "Insumos limpieza": 26200.0,
      "Arreglos/mantenimiento": 75000.0,
      "Libreria": 27700.0,
      "Reuniones": 45700.0,
      "Cadeteria": 46000.0,
      "Yerba/café": 27898.0,
      "Publicidad Digital (Facebook/IG)": 57919.16
    },
    "grossMargin": 16353102.84,
    "fixedCosts": 12997479.57,
    "fixedCostsBreakdown": {
      "Alquileres": 984160.0,
      "Luz": 190490.51,
      "Agua": 39125.0,
      "Gas": 2669.53,
      "Telefono": 14660.0,
      "Internet": 26036.19,
      "Publicidad": 105000.0,
      "Limpieza": 355000.0,
      "Agua Red": 35000.0,
      "Seguro": 35259.0,
      "Ecco": 35454.34,
      "Expensas": 19900.0,
      "Honorarios contadora": 78000.0,
      "Honorarios Couch": 150000.0,
      "Sueldos secretarias": 2317140.0,
      "Sueldos kinesiologos": 4028374.0,
      "Cobros OS Angie Lean Colo": 4581211.0
    },
    "ebitda": 3355623.27,
    "investments": 0
  },
  {
    "month": "Julio",
    "monthNumber": 7,
    "year": 2026,
    "revenue": 17394919.0,
    "kinesioRevenue": 14351671.0,
    "gymRevenue": 2509848.0,
    "turismoRevenue": 278000.0,
    "alquileresRevenue": 255400.0,
    "kinesioBreakdown": {
      "Obras sociales": 5133071.0,
      "Adicional Obra Social": 3210500.0,
      "Adicional UNR": 521300.0,
      "Adicional Iapos": 943700.0,
      "Particulares": 4543100.0,
      "Adicionales": 0.0
    },
    "alquileresBreakdown": {
      "Ondas de choque": 183000.0,
      "Evaluaciones": 21900.0,
      "Terapia manual": 5500.0,
      "Posturoterapia": 0.0,
      "Alquiler Magneto": 0.0,
      "Alquiler consultorio": 45000.0
    },
    "variableCosts": 767299.0,
    "variableCostsBreakdown": {
      "Insumos kinesicos": 0.0,
      "Insumos limpieza": 229758.0,
      "Arreglos/mantenimiento": 134800.0,
      "Libreria": 25700.0,
      "Reuniones": 239228.0,
      "Cadeteria": 18000.0,
      "Yerba/café": 34190.0,
      "Publicidad Digital (Facebook/IG)": 85623.0
    },
    "grossMargin": 16627620.0,
    "fixedCosts": 13658743.24,
    "fixedCostsBreakdown": {
      "Alquileres": 984160.0,
      "Luz": 164698.63,
      "Agua": 39125.0,
      "Gas": 2692.75,
      "Telefono": 15440.0,
      "Internet": 27338.0,
      "Publicidad": 105000.0,
      "Limpieza": 412500.0,
      "Agua Red": 37500.0,
      "Seguro": 35253.0,
      "Ecco": 39708.86,
      "Expensas": 25700.0,
      "Honorarios contadora": 78000.0,
      "Honorarios Couch": 175000.0,
      "Sueldos secretarias": 1606060.0,
      "Sueldos kinesiologos": 4777496.0,
      "Cobros OS Angie Lean Colo": 5133071.0
    },
    "ebitda": 2968876.76,
    "investments": 0
  },
  {
    "month": "Agosto",
    "monthNumber": 8,
    "year": 2026,
    "revenue": 17604672.0,
    "kinesioRevenue": 14889272.0,
    "gymRevenue": 2417500.0,
    "turismoRevenue": 105000.0,
    "alquileresRevenue": 192900.0,
    "kinesioBreakdown": {
      "Obras sociales": 5955672.0,
      "Adicional Obra Social": 3110900.0,
      "Adicional UNR": 663700.0,
      "Adicional Iapos": 909000.0,
      "Particulares": 4250000.0,
      "Adicionales": 0.0
    },
    "alquileresBreakdown": {
      "Ondas de choque": 180000.0,
      "Evaluaciones": 12900.0,
      "Terapia manual": 0.0,
      "Posturoterapia": 0.0,
      "Alquiler Magneto": 0.0,
      "Alquiler consultorio": 0.0
    },
    "variableCosts": 677854.0,
    "variableCostsBreakdown": {
      "Insumos kinesicos": 59470.0,
      "Insumos limpieza": 28210.0,
      "Arreglos/mantenimiento": 367206.0,
      "Libreria": 28700.0,
      "Reuniones": 66850.0,
      "Cadeteria": 20600.0,
      "Yerba/café": 41326.0,
      "Publicidad Digital (Facebook/IG)": 65492.0
    },
    "grossMargin": 16926818.0,
    "fixedCosts": 14112176.69,
    "fixedCostsBreakdown": {
      "Alquileres": 1003040.0,
      "Luz": 165942.17,
      "Agua": 39125.0,
      "Gas": 2905.64,
      "Telefono": 15440.0,
      "Internet": 28704.88,
      "Publicidad": 619000.0,
      "Limpieza": 366000.0,
      "Agua Red": 37500.0,
      "Seguro": 42266.0,
      "Ecco": 76503.0,
      "Expensas": 37400.0,
      "Honorarios contadora": 82000.0,
      "Honorarios Couch": 175500.0,
      "Sueldos secretarias": 1471200.0,
      "Sueldos kinesiologos": 3993888.0,
      "Cobros OS Angie Lean Colo": 5955762.0
    },
    "ebitda": 2814641.31,
    "investments": 1349160
  },
  {
    "month": "Septiembre",
    "monthNumber": 9,
    "year": 2026,
    "revenue": 18823371.0,
    "kinesioRevenue": 16071891.0,
    "gymRevenue": 2407700.0,
    "turismoRevenue": 0.0,
    "alquileresRevenue": 343780.0,
    "kinesioBreakdown": {
      "Obras sociales": 4961191.0,
      "Adicional Obra Social": 4263200.0,
      "Adicional UNR": 648000.0,
      "Adicional Iapos": 1317000.0,
      "Particulares": 4882500.0,
      "Adicionales": 0.0
    },
    "alquileresBreakdown": {
      "Ondas de choque": 200000.0,
      "Evaluaciones": 28780.0,
      "Terapia manual": 0.0,
      "Posturoterapia": 0.0,
      "Alquiler Magneto": 115000.0,
      "Alquiler consultorio": 0.0
    },
    "variableCosts": 695077.2,
    "variableCostsBreakdown": {
      "Insumos kinesicos": 106471.2,
      "Insumos limpieza": 10700.0,
      "Arreglos/mantenimiento": 297339.0,
      "Libreria": 0.0,
      "Reuniones": 177250.0,
      "Cadeteria": 20000.0,
      "Yerba/café": 76600.0,
      "Publicidad Digital (Facebook/IG)": 6717.0
    },
    "grossMargin": 18128293.8,
    "fixedCosts": 13642438.5,
    "fixedCostsBreakdown": {
      "Alquileres": 984160.0,
      "Luz": 243652.21,
      "Agua": 43110.0,
      "Gas": 2896.97,
      "Telefono": 16860.01,
      "Internet": 30111.39,
      "Publicidad": 499000.0,
      "Limpieza": 390000.0,
      "Agua Red": 37500.0,
      "Seguro": 42266.0,
      "Ecco": 54883.92,
      "Expensas": 27400.0,
      "Honorarios contadora": 82000.0,
      "Honorarios Couch": 270000.0,
      "Sueldos secretarias": 1710720.0,
      "Sueldos kinesiologos": 4246687.0,
      "Cobros OS Angie Lean Colo": 4961191.0
    },
    "ebitda": 4485855.3,
    "investments": 1477260
  },
  {
    "month": "Octubre",
    "monthNumber": 10,
    "year": 2026,
    "revenue": 0.0,
    "kinesioRevenue": 0.0,
    "gymRevenue": 0.0,
    "turismoRevenue": 0.0,
    "alquileresRevenue": 0.0,
    "kinesioBreakdown": {
      "Obras sociales": 0.0,
      "Adicional Obra Social": 0.0,
      "Adicional UNR": 0.0,
      "Adicional Iapos": 0.0,
      "Particulares": 0.0,
      "Adicionales": 0.0
    },
    "alquileresBreakdown": {
      "Ondas de choque": 0.0,
      "Evaluaciones": 0.0,
      "Terapia manual": 0.0,
      "Posturoterapia": 0.0,
      "Alquiler Magneto": 0.0,
      "Alquiler consultorio": 0.0
    },
    "variableCosts": 0.0,
    "variableCostsBreakdown": {
      "Insumos kinesicos": 0.0,
      "Insumos limpieza": 0.0,
      "Arreglos/mantenimiento": 0.0,
      "Libreria": 0.0,
      "Reuniones": 0.0,
      "Cadeteria": 0.0,
      "Yerba/café": 0.0,
      "Publicidad Digital (Facebook/IG)": 0.0
    },
    "grossMargin": 0.0,
    "fixedCosts": 1566149.55,
    "fixedCostsBreakdown": {
      "Alquileres": 1076020.0,
      "Luz": 243652.21,
      "Agua": 43120.0,
      "Gas": 3048.39,
      "Telefono": 17770.0,
      "Internet": 34039.6,
      "Publicidad": 0.0,
      "Limpieza": 0.0,
      "Agua Red": 37500.0,
      "Seguro": 42266.0,
      "Ecco": 41333.35,
      "Expensas": 27400.0,
      "Honorarios contadora": 0.0,
      "Honorarios Couch": 0.0,
      "Sueldos secretarias": 0.0,
      "Sueldos kinesiologos": 0.0,
      "Cobros OS Angie Lean Colo": 0.0
    },
    "ebitda": -1566149.55,
    "investments": 0
  },
  {
    "month": "Noviembre",
    "monthNumber": 11,
    "year": 2026,
    "revenue": 0.0,
    "kinesioRevenue": 0.0,
    "gymRevenue": 0.0,
    "turismoRevenue": 0.0,
    "alquileresRevenue": 0.0,
    "kinesioBreakdown": {
      "Obras sociales": 0.0,
      "Adicional Obra Social": 0.0,
      "Adicional UNR": 0.0,
      "Adicional Iapos": 0.0,
      "Particulares": 0.0,
      "Adicionales": 0.0
    },
    "alquileresBreakdown": {
      "Ondas de choque": 0.0,
      "Evaluaciones": 0.0,
      "Terapia manual": 0.0,
      "Posturoterapia": 0.0,
      "Alquiler Magneto": 0.0,
      "Alquiler consultorio": 0.0
    },
    "variableCosts": 0.0,
    "variableCostsBreakdown": {
      "Insumos kinesicos": 0.0,
      "Insumos limpieza": 0.0,
      "Arreglos/mantenimiento": 0.0,
      "Libreria": 0.0,
      "Reuniones": 0.0,
      "Cadeteria": 0.0,
      "Yerba/café": 0.0,
      "Publicidad Digital (Facebook/IG)": 0.0
    },
    "grossMargin": 0.0,
    "fixedCosts": 0.0,
    "fixedCostsBreakdown": {
      "Alquileres": 0.0,
      "Luz": 0.0,
      "Agua": 0.0,
      "Gas": 0.0,
      "Telefono": 0.0,
      "Internet": 0.0,
      "Publicidad": 0.0,
      "Limpieza": 0.0,
      "Agua Red": 0.0,
      "Seguro": 0.0,
      "Ecco": 0.0,
      "Expensas": 0.0,
      "Honorarios contadora": 0.0,
      "Honorarios Couch": 0.0,
      "Sueldos secretarias": 0.0,
      "Sueldos kinesiologos": 0.0,
      "Cobros OS Angie Lean Colo": 0.0
    },
    "ebitda": 0.0,
    "investments": 0
  },
  {
    "month": "Diciembre",
    "monthNumber": 12,
    "year": 2026,
    "revenue": 0.0,
    "kinesioRevenue": 0.0,
    "gymRevenue": 0.0,
    "turismoRevenue": 0.0,
    "alquileresRevenue": 0.0,
    "kinesioBreakdown": {
      "Obras sociales": 0.0,
      "Adicional Obra Social": 0.0,
      "Adicional UNR": 0.0,
      "Adicional Iapos": 0.0,
      "Particulares": 0.0,
      "Adicionales": 0.0
    },
    "alquileresBreakdown": {
      "Ondas de choque": 0.0,
      "Evaluaciones": 0.0,
      "Terapia manual": 0.0,
      "Posturoterapia": 0.0,
      "Alquiler Magneto": 0.0,
      "Alquiler consultorio": 0.0
    },
    "variableCosts": 0.0,
    "variableCostsBreakdown": {
      "Insumos kinesicos": 0.0,
      "Insumos limpieza": 0.0,
      "Arreglos/mantenimiento": 0.0,
      "Libreria": 0.0,
      "Reuniones": 0.0,
      "Cadeteria": 0.0,
      "Yerba/café": 0.0,
      "Publicidad Digital (Facebook/IG)": 0.0
    },
    "grossMargin": 0.0,
    "fixedCosts": 0.0,
    "fixedCostsBreakdown": {
      "Alquileres": 0.0,
      "Luz": 0.0,
      "Agua": 0.0,
      "Gas": 0.0,
      "Telefono": 0.0,
      "Internet": 0.0,
      "Publicidad": 0.0,
      "Limpieza": 0.0,
      "Agua Red": 0.0,
      "Seguro": 0.0,
      "Ecco": 0.0,
      "Expensas": 0.0,
      "Honorarios contadora": 0.0,
      "Honorarios Couch": 0.0,
      "Sueldos secretarias": 0.0,
      "Sueldos kinesiologos": 0.0,
      "Cobros OS Angie Lean Colo": 0.0
    },
    "ebitda": 0.0,
    "investments": 0
  }
];

export function isInternalTransferCategory(category: string): boolean {
  const c = (category || '').toLowerCase().trim();
  return (
    c.includes('ingr. tranferencias') ||
    c.includes('ingr. transferencias') ||
    c.includes('extracción transf') ||
    c.includes('extraccion transf') ||
    c === 'retiro'
  );
}

export function getAutoClassification(
  category: string,
  isIncome: boolean,
  description?: string,
  amount?: number
): { businessUnit: BusinessUnit; costClassification: CostClassification } {
  const c = (category || '').toLowerCase().trim();
  const d = (description || '').toLowerCase().trim();

  if (isIncome) {
    if (c.includes('tranferencias') || c.includes('transferencias')) {
      return { businessUnit: 'GENERAL', costClassification: 'NONE' };
    }
    if (c.includes('gimnasio') || c.includes('gimanasio') || c.includes('gym')) {
      return { businessUnit: 'GYM', costClassification: 'NONE' };
    }
    if (c.includes('turismo') || c.includes('viajero')) {
      return { businessUnit: 'TURISMO', costClassification: 'NONE' };
    }
    if (
      c.includes('alquiler') ||
      c.includes('magneto') ||
      c.includes('ondas') ||
      c.includes('game ready') ||
      c.includes('evaluacion') ||
      c.includes('terapia manual') ||
      c.includes('posturo')
    ) {
      return { businessUnit: 'ALQUILERES', costClassification: 'NONE' };
    }
    return { businessUnit: 'KINESIO', costClassification: 'NONE' };
  } else {
    if (c.includes('extracción') || c.includes('extraccion') || c === 'retiro') {
      return { businessUnit: 'GENERAL', costClassification: 'NONE' };
    }
    if (c.includes('inversion') || c.includes('inversiones')) {
      return { businessUnit: 'GENERAL', costClassification: 'INVESTMENT' };
    }
    if (
      c.includes('ins.') ||
      c.includes('insumos') ||
      c.includes('arreglos') ||
      c.includes('libreria') ||
      c.includes('reuniones') ||
      c.includes('cadeteria') ||
      c.includes('yerba') ||
      c.includes('cafe') ||
      c.includes('café') ||
      c.includes('facebook')
    ) {
      return { businessUnit: 'KINESIO', costClassification: 'VARIABLE' };
    }
    if (c.includes('publicidad')) {
      if (d.includes('face') || d.includes('ig') || d.includes('meta') || (amount && amount < 50000 && amount !== 5000)) {
        return { businessUnit: 'KINESIO', costClassification: 'VARIABLE' };
      }
      return { businessUnit: 'GENERAL', costClassification: 'FIXED' };
    }
    return { businessUnit: 'GENERAL', costClassification: 'FIXED' };
  }
}
