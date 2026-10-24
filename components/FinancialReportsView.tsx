import React, { useState, useMemo } from 'react';
import {
  Download,
  Calendar,
  BarChart3,
  Layers,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Target,
  Wallet
} from 'lucide-react';
import { FinancialMovement } from '../types';
import { MONTH_NAMES } from '../constants/financialCategories';
import {
  exportEERRExcel,
  exportCashFlowExcel,
  computeMonthEERR,
  computeFullYearDashboard,
  DetailedMonthEERR
} from '../utils/financialExcelExport';

interface FinancialReportsViewProps {
  movements: FinancialMovement[];
  onBackToCashFlow?: () => void;
}

export const FinancialReportsView: React.FC<FinancialReportsViewProps> = ({
  movements,
  onBackToCashFlow
}) => {
  // Default to August 2026
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // Agosto default
  const [activeReportTab, setActiveReportTab] = useState<'ECONOMICO' | 'DASHBOARD'>('ECONOMICO');

  const monthString = selectedMonth < 10 ? `0${selectedMonth}` : `${selectedMonth}`;
  const yearMonthPrefix = `${selectedYear}-${monthString}`;
  const currentMonthName = MONTH_NAMES[selectedMonth - 1] || 'Agosto';

  // Current Month Movements for Caja Diaria export
  const currentMonthMovements = useMemo(() => {
    return movements.filter(m => m.date.startsWith(yearMonthPrefix));
  }, [movements, yearMonthPrefix]);

  // Complete EERR calculation for the selected month (reconciled with EERR_RTP_Gonza_Corregido.xlsx)
  const economicSummary = useMemo(() => {
    return computeMonthEERR(movements, selectedMonth, selectedYear);
  }, [movements, selectedMonth, selectedYear]);

  // Previous month EERR for horizontal comparison
  const prevMonthSummary = useMemo(() => {
    const prevM = selectedMonth > 1 ? selectedMonth - 1 : 12;
    const prevY = selectedMonth > 1 ? selectedYear : selectedYear - 1;
    return computeMonthEERR(movements, prevM, prevY);
  }, [movements, selectedMonth, selectedYear]);

  // Full 12-month dashboard data
  const fullYearDashboard: DetailedMonthEERR[] = useMemo(() => {
    return computeFullYearDashboard(movements, selectedYear);
  }, [movements, selectedYear]);

  // Annual Totals
  const annualTotals = useMemo(() => {
    let totalRev = 0;
    let totalVar = 0;
    let totalGross = 0;
    let totalFix = 0;
    let totalEb = 0;
    let totalInv = 0;
    let monthsWithRev = 0;

    fullYearDashboard.forEach(m => {
      if (m.totalRevenue > 0 || m.fixedCosts > 0) {
        totalRev += m.totalRevenue;
        totalVar += m.variableCosts;
        totalGross += m.grossMargin;
        totalFix += m.fixedCosts;
        totalEb += m.ebitda;
        totalInv += m.investments || 0;
      }
      if (m.totalRevenue > 0) {
        monthsWithRev++;
      }
    });

    const avgRev = monthsWithRev > 0 ? totalRev / monthsWithRev : 0;
    const avgEbitda = monthsWithRev > 0 ? totalEb / monthsWithRev : 0;
    const overallEbitdaMargin = totalRev > 0 ? (totalEb / totalRev) * 100 : 0;

    return {
      totalRev,
      totalVar,
      totalGross,
      totalFix,
      totalEb,
      totalInv,
      avgRev,
      avgEbitda,
      overallEbitdaMargin,
      monthsWithRev
    };
  }, [fullYearDashboard]);

  // Post-EBITDA indicators for selected month
  const postEbitdaMetrics = useMemo(() => {
    const gmRatio = economicSummary.totalRevenue > 0
      ? economicSummary.grossMargin / economicSummary.totalRevenue
      : 0;
    const breakEven = gmRatio > 0 ? economicSummary.fixedCosts / gmRatio : 0;
    const breakEvenCompliance = breakEven > 0
      ? ((economicSummary.totalRevenue - breakEven) / breakEven) * 100
      : 0;
    const iiggTax = economicSummary.ebitda > 0 ? economicSummary.ebitda * 0.3 : 0;
    const netProfit = economicSummary.ebitda - iiggTax - economicSummary.investments;
    const netProfitMargin = economicSummary.totalRevenue > 0
      ? (netProfit / economicSummary.totalRevenue) * 100
      : 0;

    return {
      breakEven,
      breakEvenCompliance,
      iiggTax,
      netProfit,
      netProfitMargin
    };
  }, [economicSummary]);

  // Handle Export EERR Excel (Archivo 2: EERR_RTP_[Mes]_[Año].xlsx)
  const handleExportEERR = async () => {
    await exportEERRExcel(movements, selectedMonth, selectedYear);
  };

  // Handle Export Cash Flow Excel (Archivo 1: [Mes]_[Año]_Ingresos_y_Gastos.xlsx)
  const handleExportCashFlow = async () => {
    await exportCashFlowExcel(currentMonthMovements, currentMonthName, selectedYear);
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
            Análisis económico por unidades de negocio, costos variables, margen de contribución, gastos fijos y flujo neto.
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

          {/* Botón A: Exportar Caja Diaria (Excel) -> [Mes]_[Año]_Ingresos_y_Gastos.xlsx */}
          <button
            onClick={handleExportCashFlow}
            className="px-3.5 py-2.5 rounded-2xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
            title="Descargar archivo independiente 1: [Mes]_[Año]_Ingresos_y_Gastos.xlsx (Resumen, Transferencias y Efectivo)"
          >
            <Download size={14} />
            <span>📥 Exportar Caja Diaria (Excel)</span>
          </button>

          {/* Botón B: Exportar Estado de Resultados (Excel) -> EERR_RTP_[Mes]_[Año].xlsx */}
          <button
            onClick={handleExportEERR}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
            title="Descargar archivo independiente 2: EERR_RTP_[Mes]_[Año].xlsx (Dashboard Gerencial y Económico)"
          >
            <FileSpreadsheet size={15} />
            <span>📥 Exportar Estado de Resultados (Excel)</span>
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
          Dashboard Gerencial (Anual {selectedYear})
        </button>
      </div>

      {/* VIEW 1: ESTADO DE RESULTADOS ECONÓMICO */}
      {activeReportTab === 'ECONOMICO' && (
        <div className="space-y-6">
          {/* Top KPI Cards for the month */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Facturación */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">1. Facturación Total</span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                ${Math.round(economicSummary.totalRevenue).toLocaleString('es-AR')}
              </p>
              <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                Ventas netas de las 4 unidades
              </div>
            </div>

            {/* Costos Variables */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">2. Costos Variables</span>
              <p className="text-2xl font-black text-amber-600 mt-1">
                ${Math.round(economicSummary.variableCosts).toLocaleString('es-AR')}
              </p>
              <div className="text-[11px] text-slate-500 mt-2">
                Representa el <strong>{economicSummary.totalRevenue > 0 ? ((economicSummary.variableCosts / economicSummary.totalRevenue) * 100).toFixed(1) : 0}%</strong> de ventas
              </div>
            </div>

            {/* Contribución Marginal */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">3. Margen Bruto</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                ${Math.round(economicSummary.grossMargin).toLocaleString('es-AR')}
              </p>
              <div className="text-[11px] text-slate-500 mt-2">
                Margen de contribución: <strong>{economicSummary.grossMarginPct.toFixed(1)}%</strong>
              </div>
            </div>

            {/* Punto de Equilibrio */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Target size={12} className="text-indigo-500" /> Punto de Equilibrio
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                ${Math.round(postEbitdaMetrics.breakEven).toLocaleString('es-AR')}
              </p>
              <div className={`text-[11px] mt-2 font-bold ${postEbitdaMetrics.breakEvenCompliance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                Cumplimiento: {postEbitdaMetrics.breakEvenCompliance >= 0 ? '+' : ''}{postEbitdaMetrics.breakEvenCompliance.toFixed(1)}%
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
                ${Math.round(economicSummary.ebitda).toLocaleString('es-AR')}
              </p>
              <div className="text-[11px] text-indigo-200 mt-2 flex items-center gap-1.5">
                {economicSummary.ebitda >= 0 ? <CheckCircle2 size={13} className="text-emerald-400" /> : <AlertTriangle size={13} className="text-amber-400" />}
                Margen EBITDA: <strong>{economicSummary.ebitdaMarginPct.toFixed(1)}%</strong>
              </div>
            </div>
          </div>

          {/* Detailed Statement Table (Matching Excel EERR_RTP_Gonza_Corregido.xlsx) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Estado de Resultados Analítico (P&amp;L)</h3>
                <p className="text-xs text-slate-400">
                  Período analizado: {currentMonthName} {selectedYear} vs {prevMonthSummary.monthName} {prevMonthSummary.year}
                </p>
              </div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
                Estructura Contable Gonza RTP
              </span>
            </div>

            <div
              className="overflow-x-auto max-h-[750px] focus:outline-2 focus:outline-indigo-500"
              tabIndex={0}
              role="region"
              aria-label="Tabla de Estado de Resultados Analítico"
            >
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-slate-900 text-white">
                  <tr className="text-[11px] font-black uppercase tracking-wider">
                    <th className="py-3.5 px-6">Concepto / Cuenta Contable</th>
                    <th className="py-3.5 px-6 text-right">{currentMonthName} ($)</th>
                    <th className="py-3.5 px-6 text-right">% Ventas</th>
                    <th className="py-3.5 px-6 text-right text-slate-300">{prevMonthSummary.monthName} ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* 1. VENTAS NETAS */}
                  <tr className="bg-indigo-50/70 font-black text-indigo-950">
                    <td className="py-3.5 px-6 text-sm">1. VENTAS NETAS (FACTURACIÓN TOTAL)</td>
                    <td className="py-3.5 px-6 text-right text-sm">${Math.round(economicSummary.totalRevenue).toLocaleString('es-AR')}</td>
                    <td className="py-3.5 px-6 text-right text-sm">100.0%</td>
                    <td className="py-3.5 px-6 text-right text-xs text-slate-500">${Math.round(prevMonthSummary.totalRevenue).toLocaleString('es-AR')}</td>
                  </tr>

                  {/* Kinesiología */}
                  <tr className="bg-slate-50/70 font-bold text-slate-900">
                    <td className="py-2.5 px-6 pl-9 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" /> 1.1 Unidad Kinesiología y Rehabilitación
                    </td>
                    <td className="py-2.5 px-6 text-right">${Math.round(economicSummary.kinesioRevenue).toLocaleString('es-AR')}</td>
                    <td className="py-2.5 px-6 text-right text-slate-600">
                      {economicSummary.totalRevenue > 0 ? ((economicSummary.kinesioRevenue / economicSummary.totalRevenue) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="py-2.5 px-6 text-right text-slate-400">${Math.round(prevMonthSummary.kinesioRevenue).toLocaleString('es-AR')}</td>
                  </tr>
                  {Object.entries(economicSummary.kinesioBreakdown).map(([sub, val]) => (
                    val > 0 || (prevMonthSummary.kinesioBreakdown[sub] || 0) > 0 ? (
                      <tr key={sub} className="hover:bg-slate-50 text-slate-600">
                        <td className="py-2 px-6 pl-14">• {sub}</td>
                        <td className="py-2 px-6 text-right">${Math.round(val).toLocaleString('es-AR')}</td>
                        <td className="py-2 px-6 text-right text-slate-400">
                          {economicSummary.totalRevenue > 0 ? ((val / economicSummary.totalRevenue) * 100).toFixed(1) : 0}%
                        </td>
                        <td className="py-2 px-6 text-right text-slate-400">${Math.round(prevMonthSummary.kinesioBreakdown[sub] || 0).toLocaleString('es-AR')}</td>
                      </tr>
                    ) : null
                  ))}

                  {/* Gimnasio */}
                  <tr className="bg-slate-50/70 font-bold text-slate-900">
                    <td className="py-2.5 px-6 pl-9 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> 1.2 Unidad Gimnasio y Entrenamiento
                    </td>
                    <td className="py-2.5 px-6 text-right">${Math.round(economicSummary.gymRevenue).toLocaleString('es-AR')}</td>
                    <td className="py-2.5 px-6 text-right text-slate-600">
                      {economicSummary.totalRevenue > 0 ? ((economicSummary.gymRevenue / economicSummary.totalRevenue) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="py-2.5 px-6 text-right text-slate-400">${Math.round(prevMonthSummary.gymRevenue).toLocaleString('es-AR')}</td>
                  </tr>

                  {/* Turismo */}
                  <tr className="bg-slate-50/70 font-bold text-slate-900">
                    <td className="py-2.5 px-6 pl-9 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" /> 1.3 Unidad Turismo Deportivo (Entrenamiento Viajeros)
                    </td>
                    <td className="py-2.5 px-6 text-right">${Math.round(economicSummary.turismoRevenue).toLocaleString('es-AR')}</td>
                    <td className="py-2.5 px-6 text-right text-slate-600">
                      {economicSummary.totalRevenue > 0 ? ((economicSummary.turismoRevenue / economicSummary.totalRevenue) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="py-2.5 px-6 text-right text-slate-400">${Math.round(prevMonthSummary.turismoRevenue).toLocaleString('es-AR')}</td>
                  </tr>

                  {/* Alquileres / Aparatología */}
                  <tr className="bg-slate-50/70 font-bold text-slate-900">
                    <td className="py-2.5 px-6 pl-9 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> 1.4 Unidad Alquileres y Evaluaciones Especiales
                    </td>
                    <td className="py-2.5 px-6 text-right">${Math.round(economicSummary.alquileresRevenue).toLocaleString('es-AR')}</td>
                    <td className="py-2.5 px-6 text-right text-slate-600">
                      {economicSummary.totalRevenue > 0 ? ((economicSummary.alquileresRevenue / economicSummary.totalRevenue) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="py-2.5 px-6 text-right text-slate-400">${Math.round(prevMonthSummary.alquileresRevenue).toLocaleString('es-AR')}</td>
                  </tr>
                  {Object.entries(economicSummary.alquileresBreakdown).map(([sub, val]) => (
                    val > 0 || (prevMonthSummary.alquileresBreakdown[sub] || 0) > 0 ? (
                      <tr key={sub} className="hover:bg-slate-50 text-slate-600">
                        <td className="py-2 px-6 pl-14">• {sub}</td>
                        <td className="py-2 px-6 text-right">${Math.round(val).toLocaleString('es-AR')}</td>
                        <td className="py-2 px-6 text-right text-slate-400">
                          {economicSummary.totalRevenue > 0 ? ((val / economicSummary.totalRevenue) * 100).toFixed(1) : 0}%
                        </td>
                        <td className="py-2 px-6 text-right text-slate-400">${Math.round(prevMonthSummary.alquileresBreakdown[sub] || 0).toLocaleString('es-AR')}</td>
                      </tr>
                    ) : null
                  ))}

                  {/* 2. COSTOS VARIABLES */}
                  <tr className="bg-amber-50/70 font-black text-amber-950">
                    <td className="py-3.5 px-6 text-sm">2. COSTOS VARIABLES (COSTO DE ATENDER)</td>
                    <td className="py-3.5 px-6 text-right text-sm text-amber-700">-${Math.round(economicSummary.variableCosts).toLocaleString('es-AR')}</td>
                    <td className="py-3.5 px-6 text-right text-sm text-amber-700">
                      {economicSummary.totalRevenue > 0 ? ((economicSummary.variableCosts / economicSummary.totalRevenue) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="py-3.5 px-6 text-right text-xs text-slate-500">-${Math.round(prevMonthSummary.variableCosts).toLocaleString('es-AR')}</td>
                  </tr>
                  {Object.entries(economicSummary.variableCostsBreakdown).map(([cat, val]) => (
                    val > 0 || (prevMonthSummary.variableCostsBreakdown[cat] || 0) > 0 ? (
                      <tr key={cat} className="hover:bg-slate-50">
                        <td className="py-2 px-6 pl-12 text-slate-600">• {cat}</td>
                        <td className="py-2 px-6 text-right text-slate-700">${Math.round(val).toLocaleString('es-AR')}</td>
                        <td className="py-2 px-6 text-right text-slate-400">
                          {economicSummary.totalRevenue > 0 ? ((val / economicSummary.totalRevenue) * 100).toFixed(1) : 0}%
                        </td>
                        <td className="py-2 px-6 text-right text-slate-400">${Math.round(prevMonthSummary.variableCostsBreakdown[cat] || 0).toLocaleString('es-AR')}</td>
                      </tr>
                    ) : null
                  ))}

                  {/* 3. CONTRIBUCIÓN MARGINAL */}
                  <tr className="bg-emerald-50/80 font-black text-emerald-950 border-t-2 border-b-2 border-emerald-200">
                    <td className="py-3.5 px-6 text-sm">3. GANANCIA BRUTA / CONTRIBUCIÓN MARGINAL (1 - 2)</td>
                    <td className="py-3.5 px-6 text-right text-sm text-emerald-700">${Math.round(economicSummary.grossMargin).toLocaleString('es-AR')}</td>
                    <td className="py-3.5 px-6 text-right text-sm text-emerald-700">{economicSummary.grossMarginPct.toFixed(1)}%</td>
                    <td className="py-3.5 px-6 text-right text-xs text-emerald-700">${Math.round(prevMonthSummary.grossMargin).toLocaleString('es-AR')}</td>
                  </tr>

                  {/* 4. GASTOS FIJOS */}
                  <tr className="bg-rose-50/70 font-black text-rose-950">
                    <td className="py-3.5 px-6 text-sm">4. GASTOS FIJOS OPERATIVOS (ESTRUCTURA Y PLANTEL)</td>
                    <td className="py-3.5 px-6 text-right text-sm text-rose-700">-${Math.round(economicSummary.fixedCosts).toLocaleString('es-AR')}</td>
                    <td className="py-3.5 px-6 text-right text-sm text-rose-700">
                      {economicSummary.totalRevenue > 0 ? ((economicSummary.fixedCosts / economicSummary.totalRevenue) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="py-3.5 px-6 text-right text-xs text-slate-500">-${Math.round(prevMonthSummary.fixedCosts).toLocaleString('es-AR')}</td>
                  </tr>
                  {Object.entries(economicSummary.fixedCostsBreakdown).map(([cat, val]) => (
                    val > 0 || (prevMonthSummary.fixedCostsBreakdown[cat] || 0) > 0 ? (
                      <tr key={cat} className="hover:bg-slate-50">
                        <td className="py-2 px-6 pl-12 text-slate-600">• {cat}</td>
                        <td className="py-2 px-6 text-right text-slate-700">${Math.round(val).toLocaleString('es-AR')}</td>
                        <td className="py-2 px-6 text-right text-slate-400">
                          {economicSummary.totalRevenue > 0 ? ((val / economicSummary.totalRevenue) * 100).toFixed(1) : 0}%
                        </td>
                        <td className="py-2 px-6 text-right text-slate-400">${Math.round(prevMonthSummary.fixedCostsBreakdown[cat] || 0).toLocaleString('es-AR')}</td>
                      </tr>
                    ) : null
                  ))}

                  {/* 5. EBITDA */}
                  <tr className={`font-black border-t-2 ${
                    economicSummary.ebitda >= 0 ? 'bg-indigo-900 text-white' : 'bg-rose-900 text-white'
                  }`}>
                    <td className="py-4 px-6 text-sm tracking-wide">5. UTILIDAD OPERATIVA / EBITDA (3 - 4)</td>
                    <td className="py-4 px-6 text-right text-sm tracking-wide">${Math.round(economicSummary.ebitda).toLocaleString('es-AR')}</td>
                    <td className="py-4 px-6 text-right text-sm tracking-wide">{economicSummary.ebitdaMarginPct.toFixed(1)}%</td>
                    <td className="py-4 px-6 text-right text-xs text-indigo-200">${Math.round(prevMonthSummary.ebitda).toLocaleString('es-AR')}</td>
                  </tr>

                  {/* POST-EBITDA: IMPUESTOS, CAPEX Y FLUJO NETO */}
                  <tr className="bg-slate-100 font-black text-slate-700 uppercase text-[11px]">
                    <td colSpan={4} className="py-2.5 px-6">Indicadores de Equilibrio, Impuestos, Inversiones (CAPEX) y Flujo Neto</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-6 pl-10 text-slate-600">• Punto de Equilibrio Operativo ($)</td>
                    <td className="py-2.5 px-6 text-right font-bold text-slate-800">${Math.round(postEbitdaMetrics.breakEven).toLocaleString('es-AR')}</td>
                    <td className="py-2.5 px-6 text-right font-bold text-emerald-600">
                      {postEbitdaMetrics.breakEvenCompliance >= 0 ? '+' : ''}{postEbitdaMetrics.breakEvenCompliance.toFixed(1)}% s/Eq.
                    </td>
                    <td className="py-2.5 px-6 text-right text-slate-400">-</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-6 pl-10 text-slate-600">• Provisión Impuesto a las Ganancias (IIGG 30%)</td>
                    <td className="py-2.5 px-6 text-right text-rose-600">-${Math.round(postEbitdaMetrics.iiggTax).toLocaleString('es-AR')}</td>
                    <td className="py-2.5 px-6 text-right text-slate-400">
                      {economicSummary.totalRevenue > 0 ? ((postEbitdaMetrics.iiggTax / economicSummary.totalRevenue) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="py-2.5 px-6 text-right text-slate-400">-</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-6 pl-10 text-slate-600">• Inversiones de Capital / Equipamiento (CAPEX)</td>
                    <td className="py-2.5 px-6 text-right text-amber-700">-${Math.round(economicSummary.investments).toLocaleString('es-AR')}</td>
                    <td className="py-2.5 px-6 text-right text-slate-400">
                      {economicSummary.totalRevenue > 0 ? ((economicSummary.investments / economicSummary.totalRevenue) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="py-2.5 px-6 text-right text-slate-400">-${Math.round(prevMonthSummary.investments).toLocaleString('es-AR')}</td>
                  </tr>
                  <tr className={`font-black border-t-2 ${
                    postEbitdaMetrics.netProfit >= 0 ? 'bg-emerald-50 text-emerald-950' : 'bg-rose-50 text-rose-950'
                  }`}>
                    <td className="py-3.5 px-6 text-sm flex items-center gap-2">
                      <Wallet size={16} className={postEbitdaMetrics.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'} />
                      RENTABILIDAD NETA FINAL (Caja Libre después de IIGG e Inversiones)
                    </td>
                    <td className="py-3.5 px-6 text-right text-sm">${Math.round(postEbitdaMetrics.netProfit).toLocaleString('es-AR')}</td>
                    <td className="py-3.5 px-6 text-right text-sm">{postEbitdaMetrics.netProfitMargin.toFixed(1)}%</td>
                    <td className="py-3.5 px-6 text-right text-xs text-slate-400">-</td>
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
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Facturación Acumulada {selectedYear}</span>
              <p className="text-2xl font-black text-slate-900 mt-1">
                ${Math.round(annualTotals.totalRev).toLocaleString('es-AR')}
              </p>
              <div className="text-[11px] text-slate-500 mt-2">
                Promedio mensual ({annualTotals.monthsWithRev} meses): <strong>${Math.round(annualTotals.avgRev).toLocaleString('es-AR')}</strong>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Margen Bruto Acumulado</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                ${Math.round(annualTotals.totalGross).toLocaleString('es-AR')}
              </p>
              <div className="text-[11px] text-slate-500 mt-2">
                Margen promedio: <strong>{annualTotals.totalRev > 0 ? ((annualTotals.totalGross / annualTotals.totalRev) * 100).toFixed(1) : 0}%</strong>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Gastos Fijos Acumulados</span>
              <p className="text-2xl font-black text-rose-600 mt-1">
                ${Math.round(annualTotals.totalFix).toLocaleString('es-AR')}
              </p>
              <div className="text-[11px] text-slate-500 mt-2">
                Incidencia anual: <strong>{annualTotals.totalRev > 0 ? ((annualTotals.totalFix / annualTotals.totalRev) * 100).toFixed(1) : 0}%</strong>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-3xl p-5 border border-indigo-800 text-white shadow-sm">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-200">EBITDA Acumulado {selectedYear}</span>
              <p className="text-2xl font-black mt-1">
                ${Math.round(annualTotals.totalEb).toLocaleString('es-AR')}
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
                <h3 className="font-black text-slate-900 text-lg">Evolución Mes a Mes {selectedYear}</h3>
                <p className="text-xs text-slate-400">Comparativa de ingresos, costos, margen de contribución, gastos fijos y EBITDA</p>
              </div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
                12 Meses + Acumulado
              </span>
            </div>

            <div
              className="overflow-x-auto max-h-[640px] focus:outline-2 focus:outline-indigo-500"
              tabIndex={0}
              role="region"
              aria-label="Tabla de Evolución Anual del Estado de Resultados"
            >
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-slate-900 text-white">
                  <tr className="text-[11px] font-black uppercase tracking-wider">
                    <th className="py-3.5 px-4">Mes</th>
                    <th className="py-3.5 px-4 text-right">Facturación ($)</th>
                    <th className="py-3.5 px-4 text-right">Costo Variable ($)</th>
                    <th className="py-3.5 px-4 text-right">Ganancia Bruta ($)</th>
                    <th className="py-3.5 px-4 text-right">Margen Bruto %</th>
                    <th className="py-3.5 px-4 text-right">Gastos Fijos ($)</th>
                    <th className="py-3.5 px-4 text-right">EBITDA ($)</th>
                    <th className="py-3.5 px-4 text-right">Margen EBITDA %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fullYearDashboard.map((row) => {
                    const marginPct = row.totalRevenue > 0 ? (row.grossMargin / row.totalRevenue) * 100 : 0;
                    const ebitdaPct = row.totalRevenue > 0 ? (row.ebitda / row.totalRevenue) * 100 : 0;
                    const isSelected = row.monthNumber === selectedMonth;

                    return (
                      <tr
                        key={row.monthName}
                        onClick={() => setSelectedMonth(row.monthNumber)}
                        className={`hover:bg-slate-50 transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50/70 font-bold' : ''}`}
                      >
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {row.monthName}
                          {isSelected && <span className="ml-1.5 text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">Seleccionado</span>}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-800">
                          {row.totalRevenue > 0 ? `$${Math.round(row.totalRevenue).toLocaleString('es-AR')}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-amber-700">
                          {row.variableCosts > 0 ? `$${Math.round(row.variableCosts).toLocaleString('es-AR')}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-700 font-bold">
                          {row.totalRevenue > 0 ? `$${Math.round(row.grossMargin).toLocaleString('es-AR')}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500">
                          {row.totalRevenue > 0 ? `${marginPct.toFixed(1)}%` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-rose-700">
                          {row.fixedCosts > 0 ? `$${Math.round(row.fixedCosts).toLocaleString('es-AR')}` : '-'}
                        </td>
                        <td className={`py-3 px-4 text-right font-black ${
                          row.ebitda >= 0 ? 'text-indigo-900' : 'text-rose-600'
                        }`}>
                          {row.totalRevenue > 0 || row.fixedCosts > 0 ? `$${Math.round(row.ebitda).toLocaleString('es-AR')}` : '-'}
                        </td>
                        <td className={`py-3 px-4 text-right font-black ${
                          ebitdaPct >= 0 ? 'text-indigo-900' : 'text-rose-600'
                        }`}>
                          {row.totalRevenue > 0 ? `${ebitdaPct.toFixed(1)}%` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white font-black text-xs">
                    <td className="py-3.5 px-4">TOTAL ACUMULADO</td>
                    <td className="py-3.5 px-4 text-right">${Math.round(annualTotals.totalRev).toLocaleString('es-AR')}</td>
                    <td className="py-3.5 px-4 text-right text-amber-300">${Math.round(annualTotals.totalVar).toLocaleString('es-AR')}</td>
                    <td className="py-3.5 px-4 text-right text-emerald-300">${Math.round(annualTotals.totalGross).toLocaleString('es-AR')}</td>
                    <td className="py-3.5 px-4 text-right text-slate-300">
                      {annualTotals.totalRev > 0 ? ((annualTotals.totalGross / annualTotals.totalRev) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="py-3.5 px-4 text-right text-rose-300">${Math.round(annualTotals.totalFix).toLocaleString('es-AR')}</td>
                    <td className="py-3.5 px-4 text-right text-indigo-300">${Math.round(annualTotals.totalEb).toLocaleString('es-AR')}</td>
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
