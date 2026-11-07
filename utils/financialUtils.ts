import { FinancialMovement } from '../types';

/**
 * Computes the automatic and sequential cierre/batch number (N° Cierre).
 * 
 * Rules:
 * 1. If movements already exist on targetDate with a valid cierreNumber (> 0),
 *    the active cierre for that day is Math.max(...sameDayCierres).
 * 2. If no movements exist on targetDate with a cierreNumber, the new day starts
 *    at (overallMaxCierreAcrossAllMovements + 1).
 * 3. Fallback to 1 if no movements exist in the system.
 */
export const getSuggestedCierreNumber = (
  targetDate: string,
  movements: FinancialMovement[] = []
): number => {
  if (!movements || movements.length === 0) {
    return 1;
  }

  // 1. Existing cierres on the exact targetDate
  const sameDayCierres = movements
    .filter(m => m.date === targetDate && typeof m.cierreNumber === 'number' && m.cierreNumber > 0)
    .map(m => m.cierreNumber as number);

  if (sameDayCierres.length > 0) {
    return Math.max(...sameDayCierres);
  }

  // 2. No cierres on targetDate: increment the global maximum cierre
  const allCierres = movements
    .filter(m => typeof m.cierreNumber === 'number' && m.cierreNumber > 0)
    .map(m => m.cierreNumber as number);

  if (allCierres.length > 0) {
    return Math.max(...allCierres) + 1;
  }

  return 1;
};
