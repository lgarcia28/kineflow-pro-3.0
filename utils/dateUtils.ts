/**
 * Devuelve la fecha local en formato YYYY-MM-DD (respetando la zona horaria del navegador, ej. UTC-3 Argentina)
 * para evitar el salto de día a las 21:00 hs que ocurre con new Date().toISOString().split('T')[0].
 */
export const getLocalTodayISO = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getLocalDateOffsetISO = (daysOffset: number, baseDate: Date = new Date()): string => {
  const target = new Date(baseDate.getTime());
  target.setDate(target.getDate() + daysOffset);
  return getLocalTodayISO(target);
};
