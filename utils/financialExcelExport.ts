import * as XLSX from 'xlsx';
import { FinancialMovement, HistoricalMonthEERR } from '../types';

export function exportCashFlowExcel(
  movements: FinancialMovement[],
  monthName: string = 'Agosto',
  year: number = 2026
) {
  const wb = XLSX.utils.book_new();

  // 1. Separar Transferencias y Efectivo
  const transMovements = movements.filter(m => m.paymentMethod === 'TRANSFERENCIA');
  const efecMovements = movements.filter(m => m.paymentMethod === 'EFECTIVO');

  // Ordenar por fecha cronológica
  transMovements.sort((a, b) => a.date.localeCompare(b.date));
  efecMovements.sort((a, b) => a.date.localeCompare(b.date));

  // --- HOJA RESUMEN ---
  // Agrupar por categoría
  const incomeCategoryTotals: Record<string, number> = {};
  const expenseCategoryTotals: Record<string, number> = {};

  let totalEfectivoIncome = 0;
  let totalEfectivoExpense = 0;
  let totalTransIncome = 0;
  let totalTransExpense = 0;

  movements.forEach(m => {
    if (m.type === 'INCOME') {
      incomeCategoryTotals[m.category] = (incomeCategoryTotals[m.category] || 0) + m.amount;
      if (m.paymentMethod === 'EFECTIVO') totalEfectivoIncome += m.amount;
      if (m.paymentMethod === 'TRANSFERENCIA') totalTransIncome += m.amount;
    } else {
      expenseCategoryTotals[m.category] = (expenseCategoryTotals[m.category] || 0) + m.amount;
      if (m.paymentMethod === 'EFECTIVO') totalEfectivoExpense += m.amount;
      if (m.paymentMethod === 'TRANSFERENCIA') totalTransExpense += m.amount;
    }
  });

  const totalIncome = totalEfectivoIncome + totalTransIncome;
  const totalExpense = totalEfectivoExpense + totalTransExpense;
  const balanceNeto = totalIncome - totalExpense;

  const resumenRows: any[] = [
    { 'A': 'Resumen del presupuesto mensual', 'B': '' },
    { 'A': `RTP MES ${monthName.toUpperCase()} ${year}`, 'B': '' },
    { 'A': 'Resultado Neto', 'B': balanceNeto },
    { 'A': '', 'B': '' },
    { 'A': 'RESUMEN DE INGRESOS', 'B': 'TOTAL ($)' },
  ];

  Object.entries(incomeCategoryTotals)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, val]) => {
      resumenRows.push({ 'A': cat, 'B': val });
    });

  resumenRows.push({ 'A': 'TOTAL INGRESOS', 'B': totalIncome });
  resumenRows.push({ 'A': '', 'B': '' });
  resumenRows.push({ 'A': 'RESUMEN DE GASTOS / EGRESOS', 'B': 'TOTAL ($)' });

  Object.entries(expenseCategoryTotals)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, val]) => {
      resumenRows.push({ 'A': cat, 'B': val });
    });

  resumenRows.push({ 'A': 'TOTAL GASTOS', 'B': totalExpense });
  resumenRows.push({ 'A': '', 'B': '' });
  resumenRows.push({ 'A': 'TOTAL POR MEDIO DE PAGO', 'B': 'INGRESOS ($)', 'C': 'EGRESOS ($)', 'D': 'SALDO ($)' });
  resumenRows.push({
    'A': 'Efectivo',
    'B': totalEfectivoIncome,
    'C': totalEfectivoExpense,
    'D': totalEfectivoIncome - totalEfectivoExpense
  });
  resumenRows.push({
    'A': 'Transferencias',
    'B': totalTransIncome,
    'C': totalTransExpense,
    'D': totalTransIncome - totalTransExpense
  });
  resumenRows.push({
    'A': 'TOTAL GENERAL',
    'B': totalIncome,
    'C': totalExpense,
    'D': balanceNeto
  });

  const wsResumen = XLSX.utils.json_to_sheet(resumenRows, { skipHeader: true });
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

  // --- HOJA TRANSFERENCIAS ---
  let saldoTrans = 0;
  const transRows: any[] = [];
  transMovements.forEach(m => {
    const isIncome = m.type === 'INCOME';
    if (isIncome) saldoTrans += m.amount;
    else saldoTrans -= m.amount;

    transRows.push({
      'FECHA': m.date,
      'N° CIERRE': m.cierreNumber || '',
      'ENTRADA': isIncome ? m.amount : '',
      'CONCEPTO INGRESO': isIncome ? m.category : '',
      'PACIENTE': m.patientName || '',
      'CUIT': m.cuit || '',
      'KINE': m.professional || '',
      'CONCEPTO SALIDA': !isIncome ? m.category : '',
      'SALIDA': !isIncome ? m.amount : '',
      'DESCRIPCION': m.description || '',
      'SALDO': saldoTrans
    });
  });

  const wsTrans = XLSX.utils.json_to_sheet(transRows);
  XLSX.utils.book_append_sheet(wb, wsTrans, 'Transferencias');

  // --- HOJA EFECTIVO ---
  let saldoEfec = 0;
  const efecRows: any[] = [];
  efecMovements.forEach(m => {
    const isIncome = m.type === 'INCOME';
    if (isIncome) saldoEfec += m.amount;
    else saldoEfec -= m.amount;

    efecRows.push({
      'FECHA': m.date,
      'N° CIERRE': m.cierreNumber || '',
      'ENTRADA': isIncome ? m.amount : '',
      'CONCEPTO INGRESO': isIncome ? m.category : '',
      'PACIENTE': m.patientName || '',
      'CONCEPTO SALIDA': !isIncome ? m.category : '',
      'SALIDA': !isIncome ? m.amount : '',
      'DETALLE': m.description || '',
      'SALDO': saldoEfec
    });
  });

  const wsEfec = XLSX.utils.json_to_sheet(efecRows);
  XLSX.utils.book_append_sheet(wb, wsEfec, 'Efectivo');

  // Descargar archivo
  XLSX.writeFile(wb, `${monthName}_${year}_Ingresos_y_Gastos.xlsx`);
}

export function exportEERRExcel(
  historicalMonths: HistoricalMonthEERR[],
  currentMonthSummary?: {
    monthName: string;
    year: number;
    kinesioRevenue: number;
    gymRevenue: number;
    turismoRevenue: number;
    alquileresRevenue: number;
    totalRevenue: number;
    variableCosts: number;
    variableCostsBreakdown: Record<string, number>;
    fixedCosts: number;
    fixedCostsBreakdown: Record<string, number>;
    grossMargin: number;
    ebitda: number;
  }
) {
  const wb = XLSX.utils.book_new();

  // --- HOJA 1: DASHBOARD GERENCIAL ---
  const dashboardRows = historicalMonths.map(h => {
    const marginPct = h.revenue > 0 ? (h.grossMargin / h.revenue) * 100 : 0;
    const ebitdaPct = h.revenue > 0 ? (h.ebitda / h.revenue) * 100 : 0;
    return {
      'Mes': h.month,
      'Facturación ($)': h.revenue,
      'Costo de atender ($)': h.variableCosts,
      'Ganancia Bruta ($)': h.grossMargin,
      'Margen Bruto (%)': `${marginPct.toFixed(1)}%`,
      'Gastos Fijos ($)': h.fixedCosts,
      'Ganancia (EBITDA) ($)': h.ebitda,
      'Margen EBITDA (%)': `${ebitdaPct.toFixed(1)}%`
    };
  });

  const wsDashboard = XLSX.utils.json_to_sheet(dashboardRows);
  XLSX.utils.book_append_sheet(wb, wsDashboard, 'Dashboard Gerencial');

  // --- HOJA 2: ECONÓMICO (ESTADO DE RESULTADOS DETALLADO) ---
  if (currentMonthSummary) {
    const rev = currentMonthSummary.totalRevenue || 1;
    const ecoRows: any[] = [
      { 'Concepto': `ESTADO DE RESULTADOS - ${currentMonthSummary.monthName.toUpperCase()} ${currentMonthSummary.year}`, '$': '', '%': '' },
      { 'Concepto': '', '$': '', '%': '' },
      { 'Concepto': '1. VENTAS NETAS', '$': currentMonthSummary.totalRevenue, '%': '100.0%' },
      { 'Concepto': '   Kinesiología', '$': currentMonthSummary.kinesioRevenue, '%': `${((currentMonthSummary.kinesioRevenue / rev) * 100).toFixed(1)}%` },
      { 'Concepto': '   Gimnasio', '$': currentMonthSummary.gymRevenue, '%': `${((currentMonthSummary.gymRevenue / rev) * 100).toFixed(1)}%` },
      { 'Concepto': '   Turismo', '$': currentMonthSummary.turismoRevenue, '%': `${((currentMonthSummary.turismoRevenue / rev) * 100).toFixed(1)}%` },
      { 'Concepto': '   Alquileres / Aparatología', '$': currentMonthSummary.alquileresRevenue, '%': `${((currentMonthSummary.alquileresRevenue / rev) * 100).toFixed(1)}%` },
      { 'Concepto': '', '$': '', '%': '' },
      { 'Concepto': '2. COSTOS VARIABLES (Insumos y Operativos)', '$': currentMonthSummary.variableCosts, '%': `${((currentMonthSummary.variableCosts / rev) * 100).toFixed(1)}%` },
    ];

    Object.entries(currentMonthSummary.variableCostsBreakdown || {}).forEach(([cat, val]) => {
      ecoRows.push({
        'Concepto': `   ${cat}`,
        '$': val,
        '%': `${((val / rev) * 100).toFixed(2)}%`
      });
    });

    ecoRows.push({ 'Concepto': '', '$': '', '%': '' });
    ecoRows.push({
      'Concepto': '3. CONTRIBUCIÓN MARGINAL (Margen Bruto)',
      '$': currentMonthSummary.grossMargin,
      '%': `${((currentMonthSummary.grossMargin / rev) * 100).toFixed(1)}%`
    });
    ecoRows.push({ 'Concepto': '', '$': '', '%': '' });
    ecoRows.push({
      'Concepto': '4. GASTOS FIJOS (Estructura Operativa)',
      '$': currentMonthSummary.fixedCosts,
      '%': `${((currentMonthSummary.fixedCosts / rev) * 100).toFixed(1)}%`
    });

    Object.entries(currentMonthSummary.fixedCostsBreakdown || {}).forEach(([cat, val]) => {
      ecoRows.push({
        'Concepto': `   ${cat}`,
        '$': val,
        '%': `${((val / rev) * 100).toFixed(2)}%`
      });
    });

    ecoRows.push({ 'Concepto': '', '$': '', '%': '' });
    ecoRows.push({
      'Concepto': '5. UTILIDAD OPERATIVA (EBITDA)',
      '$': currentMonthSummary.ebitda,
      '%': `${((currentMonthSummary.ebitda / rev) * 100).toFixed(1)}%`
    });

    const wsEco = XLSX.utils.json_to_sheet(ecoRows);
    XLSX.utils.book_append_sheet(wb, wsEco, 'Económico');
  }

  const selectedTitle = currentMonthSummary ? currentMonthSummary.monthName : 'Anual';
  XLSX.writeFile(wb, `EERR_RTP_${selectedTitle}_2026.xlsx`);
}
