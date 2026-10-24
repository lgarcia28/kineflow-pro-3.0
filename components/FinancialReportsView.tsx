import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Calendar,
  Building,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart3,
  Layers,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { FinancialMovement, HistoricalMonthEERR } from '../types';
import {
  HISTORICAL_EERR_2026,
  MONTH_NAMES
} from '../constants/financialCategories';
import { exportEERRExcel } from '../utils/financialExcelExport';

interface FinancialReportsViewProps {
  movements: FinancialMovement[];
  onBackToCashFlow?: () => void;
}

export const FinancialReportsView: React.FC<FinancialReportsViewProps> = ({
  movements,
  onBackToCashFlow
}) => {
  // Default to August 2026 or current year/month
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // Agosto default
  const [activeReportTab, setActiveReportTab] = useState<'ECONOMICO' | 'DASHBOARD'>('ECONOMICO');

  const monthString = selectedMonth < 10 ? `0${selectedMonth}` : `${selectedMonth}`;
  const yearMonthPrefix = `${selectedYear}-${monthString}`;
  const currentMonthName = MONTH_NAMES[selectedMonth - 1] || 'Agosto';

  // Current Month Movements
  const currentMonthMovements = useMemo(() => {
    return movements.filter(m => m.date.startsWith(yearMonthPrefix));
  }, [movements, yearMonthPrefix]);

  // Economic breakdown calculation for the selected month
  const economicSummary = useMemo(() => {
    let kinesioRevenue = 0;
    let gymRevenue = 0;
    let turismoRevenue = 0;
    let alquileresRevenue = 0;
    let otrosRevenue = 0;

    let variableCosts = 0;
    const variableCostsBreakdown: Record<string, number> = {};

    let fixedCosts = 0;
    const fixedCostsBreakdown: Record<string, number> = {};

    let investments = 0;

    // If we have actual movements in the database for this month, calculate from them!
    if (currentMonthMovements.length > 0) {
      currentMonthMovements.forEach(m => {
        if (m.type === 'INCOME') {
          const unit = m.businessUnit || 'KINESIO';
          if (unit === 'KINESIO') kinesioRevenue += m.amount;
          else if (unit === 'GYM') gymRevenue += m.amount;
          else if (unit === 'TURISMO') turismoRevenue += m.amount;
          else if (unit === 'ALQUILERES') alquileresRevenue += m.amount;
          else otrosRevenue += m.amount;
        } else {
          // Expense
          const costType = m.costClassification || 'FIXED';
          if (costType === 'VARIABLE') {
            variableCosts += m.amount;
            variableCostsBreakdown[m.category] = (variableCostsBreakdown[m.category] || 0) + m.amount;
          } else if (costType === 'FIXED') {
            fixedCosts += m.amount;
            fixedCostsBreakdown[m.category] = (fixedCostsBreakdown[m.category] || 0) + m.amount;
          } else if (costType === 'INVESTMENT') {
            investments += m.amount;
          }
        }
      });
    } else {
      // Fallback to historical numbers if August 2026 or other month has historical record
      const hist = HISTORICAL_EERR_2026.find(h => h.monthNumber === selectedMonth && h.year === selectedYear);
      if (hist && hist.revenue > 0) {
        kinesioRevenue = hist.revenue * 0.72; // ~72% kinesio
        gymRevenue = hist.revenue * 0.16; // ~16% gym
        turismoRevenue = hist.revenue * 0.08; // ~8% turismo
        alquileresRevenue = hist.revenue * 0.04; // ~4% alquileres
        variableCosts = hist.variableCosts;
        fixedCosts = hist.fixedCosts;
      }
    }

    const totalRevenue = kinesioRevenue + gymRevenue + turismoRevenue + alquileresRevenue + otrosRevenue;
    const grossMargin = totalRevenue - variableCosts;
    const grossMarginPct = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;
    const ebitda = grossMargin - fixedCosts;
    const ebitdaMarginPct = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0;

    return {
      monthName: currentMonthName,
      year: selectedYear,
      kinesioRevenue,
      gymRevenue,
      turismoRevenue,
      alquileresRevenue,
      otrosRevenue,
      totalRevenue,
      variableCosts,
      variableCostsBreakdown,
      grossMargin,
      grossMarginPct,
      fixedCosts,
      fixedCostsBreakdown,
      investments,
      ebitda,
      ebitdaMarginPct,
    };
  }, [currentMonthMovements, selectedMonth, selectedYear, currentMonthName]);

  // Merged 12-month dashboard data: blend historical template with live database numbers
  const fullYearDashboard: HistoricalMonthEERR[] = useMemo(() => {
    return HISTORICAL_EERR_2026.map(hist => {
      // Check if we have live movements for this month
      const mStr = hist.monthNumber < 10 ? `0${hist.monthNumber}` : `${hist.monthNumber}`;
      const prefix = `${hist.year}-${mStr}`;
      const mMovements = movements.filter(m => m.date.startsWith(prefix));

      if (mMovements.length > 0) {
        let rev = 0;
        let varCost = 0;
        let fixCost = 0;
        mMovements.forEach(m => {
          if (m.type === 'INCOME') rev += m.amount;
          else {
            if (m.costClassification === 'VARIABLE') varCost += m.amount;
            else if (m.costClassification === 'FIXED') fixCost += m.amount;
          }
        });
        const gm = rev - varCost;
        const eb = gm - fixCost;
        return {
          ...hist,
          revenue: rev,
          variableCosts: varCost,
          grossMargin: gm,
          fixedCosts: fixCost,
          ebitda: eb,
        };
      }
      return hist;
    });
  }, [movements]);

  // Annual Totals
  const annualTotals = useMemo(() => {
    let totalRev = 0;
    let totalVar = 0;
    let totalGross = 0;
    let totalFix = 0;
    let totalEb = 0;
    let monthsWithRev = 0;

    fullYearDashboard.forEach(m => {
      if (m.revenue > 0) {
        totalRev += m.revenue;
        totalVar += m.variableCosts;
        totalGross += m.grossMargin;
        totalFix += m.fixedCosts;
        totalEb += m.ebitda;
        monthsWithRev++;
      }
    });

    const avgRev = monthsWithRev > 0 ? totalRev / monthsWithRev : 0;
    const avgEbitda = monthsWithRev > 0 ? totalEb / monthsWithRev : 0;
    const overallEbitdaMargin = totalRev > 0 ? (totalEb / totalRev) * 100 : 0;

    return { totalRev, totalVar, totalGross, totalFix, totalEb, avgRev, avgEbitda, overallEbitdaMargin, monthsWithRev };
  }, [fullYearDashboard]);

  // Handle Export Excel
  const handleExportEERR = () => {
    exportEERRExcel(fullYearDashboard, economicSummary);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {onBackToCashFlow && (
              <button
                onClick={onBackToCashFlow}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                title="Volver a Caja Diaria"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5">
              <BarChart3 size={14} /> Control de Gestión Gerencial
            </span>
            <span className="text-xs font-bold text-slate-400">RTP Kinesiología</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">
            Estado de Resultados y Rentabilidad (EBITDA)
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">
            Análisis económico por unidades de negocio, costos variables, margen de contribución y gastos fijos.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Selector */}
          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <Calendar size={16} className="text-slate-500 ml-2 mr-1" />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent font-bold text-slate-800 text-xs px-2 py-1 focus:outline-none cursor-pointer"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={idx} value={idx + 1}>{m}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-black text-slate-800 text-xs px-2 py-1 border-l border-slate-300 focus:outline-none cursor-pointer"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          {/* Export Excel Button */}
          <button
            onClick={handleExportEERR}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
            title="Descargar Estado de Resultados y Dashboard Gerencial en Excel"
          >
            <Download size={15} />
            <span>Descargar EERR (Excel)</span>
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-fit">
        <button
          onClick={() => setActiveReportTab('ECONOMICO')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeReportTab === 'ECONOMICO'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers size={15} />
          Económico Mensual ({currentMonthName})
        </button>
        <button
          onClick={() => setActiveReportTab('DASHBOARD')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeReportTab === 'DASHBOARD'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 size={15} />
          Dashboard Gerencial (Anual 2026)
        </button>
      </div>

      {/* VIEW 1: ESTADO DE RESULTADOS ECONÓMICO */}
      {activeReportTab === 'ECONOMICO' && (
        <div className="space-y-6">
          {/* Top KPI Cards for the month */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Facturación */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">1. Facturación Total</span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                ${economicSummary.totalRevenue.toLocaleString('es-AR')}
              </p>
              <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                Ventas netas de todas las unidades
              </div>
            </div>

            {/* Costos Variables */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">2. Costo de Atender</span>
              <p className="text-2xl font-black text-amber-600 mt-1">
                ${economicSummary.variableCosts.toLocaleString('es-AR')}
              </p>
              <div className="text-[11px] text-slate-500 mt-2">
                Representa el <strong>{economicSummary.totalRevenue > 0 ? ((economicSummary.variableCosts / economicSummary.totalRevenue) * 100).toFixed(1) : 0}%</strong> de ventas
              </div>
            </div>

            {/* Contribución Marginal */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">3. Margen Bruto</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                ${economicSummary.grossMargin.toLocaleString('es-AR')}
              </p>
              <div className="text-[11px] text-slate-500 mt-2">
                Margen de contribución: <strong>{economicSummary.grossMarginPct.toFixed(1)}%</strong>
              </div>
            </div>

            {/* EBITDA */}
            <div className={`rounded-3xl p-5 border shadow-sm ${
              economicSummary.ebitda >= 0
                ? 'bg-gradient-to-br from-indigo-900 to-indigo-950 text-white border-indigo-800'
                : 'bg-gradient-to-br from-rose-900 to-rose-950 text-white border-rose-800'
            }`}>
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-200">5. Utilidad Operativa (EBITDA)</span>
              <p className="text-2xl font-black mt-1">
                ${economicSummary.ebitda.toLocaleString('es-AR')}
              </p>
              <div className="text-[11px] text-indigo-200 mt-2 flex items-center gap-1.5">
                {economicSummary.ebitda >= 0 ? <CheckCircle2 size={13} className="text-emerald-400" /> : <AlertTriangle size={13} className="text-amber-400" />}
                Margen EBITDA: <strong>{economicSummary.ebitdaMarginPct.toFixed(1)}%</strong>
              </div>
            </div>
          </div>

          {/* Detailed Statement Table (Matching Excel EERR) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Estado de Resultados Analítico</h3>
                <p className="text-xs text-slate-400">Período: {currentMonthName} {selectedYear}</p>
              </div>
              <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-700">
                Modelo RTP Estructurado
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <th className="py-3 px-6">Línea del Estado de Resultados</th>
                    <th className="py-3 px-6 text-right">Monto ($)</th>
                    <th className="py-3 px-6 text-right">% Facturación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* 1. VENTAS NETAS */}
                  <tr className="bg-indigo-50/50 font-black text-indigo-950">
                    <td className="py-3.5 px-6 text-sm">1. VENTAS NETAS</td>
                    <td className="py-3.5 px-6 text-right text-sm">${economicSummary.totalRevenue.toLocaleString('es-AR')}</td>
                    <td className="py-3.5 px-6 text-right text-sm">100.0%</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-6 pl-10 text-slate-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Kinesiología
                    </td>
                    <td className="py-2.5 px-6 text-right font-medium text-slate-800">${economicSummary.kinesioRevenue.toLocaleString('es-AR')}</td>
                    <td className="py-2.5 px-6 text-right text-slate-500">
                      {economicSummary.totalRevenue > 0 ? ((economicSummary.kinesioRevenue / economicSummary.totalRevenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-6 pl-10 text-slate-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Gimnasio
                    </td>
                    <td className="py-2.5 px-6 text-right font-medium text-slate-800">${economicSummary.gymRevenue.toLocaleString('es-AR')}</td>
                    <td className="py-2.5 px-6 text-right text-slate-500">
                      {economicSummary.totalRevenue > 0 ? ((economicSummary.gymRevenue / economicSummary.totalRevenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-6 pl-10 text-slate-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Turismo
                    </td>
                    <td className="py-2.5 px-6 text-right font-medium text-slate-800">${economicSummary.turismoRevenue.toLocaleString('es-AR')}</td>
                    <td className="py-2.5 px-6 text-right text-slate-500">
                      {economicSummary.totalRevenue > 0 ? ((economicSummary.turismoRevenue / economicSummary.totalRevenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-6 pl-10 text-slate-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Alquileres / Aparatología
                    </td>
                    <td className="py-2.5 px-6 text-right font-medium text-slate-800">${economicSummary.alquileresRevenue.toLocaleString('es-AR')}</td>
                    <td className="py-2.5 px-6 text-right text-slate-500">
                      {economicSummary.totalRevenue > 0 ? ((economicSummary.alquileresRevenue / economicSummary.totalRevenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                  {economicSummary.otrosRevenue > 0 && (
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-6 pl-10 text-slate-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Otros Ingresos
                      </td>
                      <td className="py-2.5 px-6 text-right font-medium text-slate-800">${economicSummary.otrosRevenue.toLocaleString('es-AR')}</td>
                      <td className="py-2.5 px-6 text-right text-slate-500">
                        {economicSummary.totalRevenue > 0 ? ((economicSummary.otrosRevenue / economicSummary.totalRevenue) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  )}

                  {/* 2. COSTOS VARIABLES */}
                  <tr className="bg-amber-50/50 font-black text-amber-950">
                    <td className="py-3.5 px-6 text-sm">2. COSTOS VARIABLES (Insumos y Operativos)</td>
                    <td className="py-3.5 px-6 text-right text-sm text-amber-700">-${economicSummary.variableCosts.toLocaleString('es-AR')}</td>
                    <td className="py-3.5 px-6 text-right text-sm text-amber-700">
                      {economicSummary.totalRevenue > 0 ? ((economicSummary.variableCosts / economicSummary.totalRevenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                  {Object.entries(economicSummary.variableCostsBreakdown).map(([cat, val]) => (
                    <tr key={cat} className="hover:bg-slate-50">
                      <td className="py-2.5 px-6 pl-10 text-slate-600">{cat}</td>
                      <td className="py-2.5 px-6 text-right text-slate-700">${val.toLocaleString('es-AR')}</td>
                      <td className="py-2.5 px-6 text-right text-slate-400">
                        {economicSummary.totalRevenue > 0 ? ((val / economicSummary.totalRevenue) * 100).toFixed(2) : 0}%
                      </td>
                    </tr>
                  ))}

                  {/* 3. CONTRIBUCIÓN MARGINAL */}
                  <tr className="bg-emerald-50/60 font-black text-emerald-950 border-t-2 border-b-2 border-emerald-200">
                    <td className="py-3.5 px-6 text-sm">3. GANANCIA BRUTA (Contribución Marginal)</td>
                    <td className="py-3.5 px-6 text-right text-sm text-emerald-700 font-black">${economicSummary.grossMargin.toLocaleString('es-AR')}</td>
                    <td className="py-3.5 px-6 text-right text-sm text-emerald-700 font-black">{economicSummary.grossMarginPct.toFixed(1)}%</td>
                  </tr>

                  {/* 4. GASTOS FIJOS */}
                  <tr className="bg-rose-50/50 font-black text-rose-950">
                    <td className="py-3.5 px-6 text-sm">4. GASTOS FIJOS (Estructura Operativa y Sueldos)</td>
                    <td className="py-3.5 px-6 text-right text-sm text-rose-700">-${economicSummary.fixedCosts.toLocaleString('es-AR')}</td>
                    <td className="py-3.5 px-6 text-right text-sm text-rose-700">
                      {economicSummary.totalRevenue > 0 ? ((economicSummary.fixedCosts / economicSummary.totalRevenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                  {Object.entries(economicSummary.fixedCostsBreakdown).map(([cat, val]) => (
                    <tr key={cat} className="hover:bg-slate-50">
                      <td className="py-2.5 px-6 pl-10 text-slate-600">{cat}</td>
                      <td className="py-2.5 px-6 text-right text-slate-700">${val.toLocaleString('es-AR')}</td>
                      <td className="py-2.5 px-6 text-right text-slate-400">
                        {economicSummary.totalRevenue > 0 ? ((val / economicSummary.totalRevenue) * 100).toFixed(2) : 0}%
                      </td>
                    </tr>
                  ))}

                  {/* 5. EBITDA */}
                  <tr className={`font-black border-t-2 ${
                    economicSummary.ebitda >= 0 ? 'bg-indigo-900 text-white' : 'bg-rose-900 text-white'
                  }`}>
                    <td className="py-4 px-6 text-base tracking-wide">5. UTILIDAD OPERATIVA (EBITDA)</td>
                    <td className="py-4 px-6 text-right text-base tracking-wide">${economicSummary.ebitda.toLocaleString('es-AR')}</td>
                    <td className="py-4 px-6 text-right text-base tracking-wide">{economicSummary.ebitdaMarginPct.toFixed(1)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: DASHBOARD GERENCIAL ANUAL (12 MESES) */}
      {activeReportTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {/* Annual Overview KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Facturación Acumulada 2026</span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                ${annualTotals.totalRev.toLocaleString('es-AR')}
              </p>
              <div className="text-[11px] text-slate-500 mt-2">
                Promedio mensual: <strong>${Math.round(annualTotals.avgRev).toLocaleString('es-AR')}</strong>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Margen Bruto Acumulado</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                ${annualTotals.totalGross.toLocaleString('es-AR')}
              </p>
              <div className="text-[11px] text-slate-500 mt-2">
                Margen promedio: <strong>{annualTotals.totalRev > 0 ? ((annualTotals.totalGross / annualTotals.totalRev) * 100).toFixed(1) : 0}%</strong>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Gastos Fijos Acumulados</span>
              <p className="text-2xl font-black text-rose-600 mt-1">
                ${annualTotals.totalFix.toLocaleString('es-AR')}
              </p>
              <div className="text-[11px] text-slate-500 mt-2">
                Incidencia anual: <strong>{annualTotals.totalRev > 0 ? ((annualTotals.totalFix / annualTotals.totalRev) * 100).toFixed(1) : 0}%</strong>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-3xl p-5 border border-indigo-800 text-white shadow-sm">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-200">EBITDA Acumulado 2026</span>
              <p className="text-2xl font-black mt-1">
                ${annualTotals.totalEb.toLocaleString('es-AR')}
              </p>
              <div className="text-[11px] text-indigo-200 mt-2">
                Margen EBITDA Anual: <strong>{annualTotals.overallEbitdaMargin.toFixed(1)}%</strong>
              </div>
            </div>
          </div>

          {/* 12 Months Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Evolución Mes a Mes 2026</h3>
                <p className="text-xs text-slate-400">Comparativa de ingresos, costos y EBITDA acumulados en el año</p>
              </div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
                12 Meses
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <th className="py-3 px-4">Mes</th>
                    <th className="py-3 px-4 text-right">Facturación ($)</th>
                    <th className="py-3 px-4 text-right">Costo Variable ($)</th>
                    <th className="py-3 px-4 text-right">Ganancia Bruta ($)</th>
                    <th className="py-3 px-4 text-right">Margen Bruto %</th>
                    <th className="py-3 px-4 text-right">Gastos Fijos ($)</th>
                    <th className="py-3 px-4 text-right">EBITDA ($)</th>
                    <th className="py-3 px-4 text-right">Margen EBITDA %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fullYearDashboard.map((row) => {
                    const marginPct = row.revenue > 0 ? (row.grossMargin / row.revenue) * 100 : 0;
                    const ebitdaPct = row.revenue > 0 ? (row.ebitda / row.revenue) * 100 : 0;
                    const isSelected = row.monthNumber === selectedMonth;

                    return (
                      <tr
                        key={row.month}
                        className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-indigo-50/50 font-bold' : ''}`}
                      >
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {row.month}
                          {isSelected && <span className="ml-1.5 text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">Actual</span>}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-800">
                          {row.revenue > 0 ? `$${row.revenue.toLocaleString('es-AR')}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-amber-700">
                          {row.variableCosts > 0 ? `$${row.variableCosts.toLocaleString('es-AR')}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-700 font-bold">
                          {row.revenue > 0 ? `$${row.grossMargin.toLocaleString('es-AR')}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500">
                          {row.revenue > 0 ? `${marginPct.toFixed(1)}%` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-rose-700">
                          {row.fixedCosts > 0 ? `$${row.fixedCosts.toLocaleString('es-AR')}` : '-'}
                        </td>
                        <td className={`py-3 px-4 text-right font-black ${
                          row.ebitda >= 0 ? 'text-indigo-900' : 'text-rose-600'
                        }`}>
                          {row.revenue > 0 || row.fixedCosts > 0 ? `$${row.ebitda.toLocaleString('es-AR')}` : '-'}
                        </td>
                        <td className={`py-3 px-4 text-right font-black ${
                          ebitdaPct >= 0 ? 'text-indigo-900' : 'text-rose-600'
                        }`}>
                          {row.revenue > 0 ? `${ebitdaPct.toFixed(1)}%` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white font-black text-xs">
                    <td className="py-3.5 px-4">TOTAL ACUMULADO</td>
                    <td className="py-3.5 px-4 text-right">${annualTotals.totalRev.toLocaleString('es-AR')}</td>
                    <td className="py-3.5 px-4 text-right text-amber-300">${annualTotals.totalVar.toLocaleString('es-AR')}</td>
                    <td className="py-3.5 px-4 text-right text-emerald-300">${annualTotals.totalGross.toLocaleString('es-AR')}</td>
                    <td className="py-3.5 px-4 text-right text-slate-300">
                      {annualTotals.totalRev > 0 ? ((annualTotals.totalGross / annualTotals.totalRev) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="py-3.5 px-4 text-right text-rose-300">${annualTotals.totalFix.toLocaleString('es-AR')}</td>
                    <td className="py-3.5 px-4 text-right text-indigo-300">${annualTotals.totalEb.toLocaleString('es-AR')}</td>
                    <td className="py-3.5 px-4 text-right text-indigo-300">{annualTotals.overallEbitdaMargin.toFixed(1)}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
