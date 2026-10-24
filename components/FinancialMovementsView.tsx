import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Calendar,
  CreditCard,
  Banknote,
  Building,
  User,
  Trash2,
  Edit2,
  FileSpreadsheet,
  X,
  CheckCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  FinancialMovement,
  FinancialMovementType,
  PaymentMethod,
  BusinessUnit,
  CostClassification,
  Patient,
  StaffMember
} from '../types';
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  KNOWN_PROFESSIONALS,
  MONTH_NAMES,
  getAutoClassification
} from '../constants/financialCategories';
import { exportCashFlowExcel, exportEERRExcel } from '../utils/financialExcelExport';

interface FinancialMovementsViewProps {
  movements: FinancialMovement[];
  patients?: Patient[];
  staff?: StaffMember[];
  onAddMovement: (movement: Omit<FinancialMovement, 'id' | 'createdAt'>) => Promise<void> | void;
  onUpdateMovement: (movement: FinancialMovement) => Promise<void> | void;
  onDeleteMovement: (id: string) => Promise<void> | void;
  onBulkAddMovements?: (movements: Omit<FinancialMovement, 'id' | 'createdAt'>[]) => Promise<void> | void;
  onOpenReports?: () => void;
}

export const FinancialMovementsView: React.FC<FinancialMovementsViewProps> = ({
  movements,
  patients = [],
  staff = [],
  onAddMovement,
  onUpdateMovement,
  onDeleteMovement,
  onBulkAddMovements,
  onOpenReports
}) => {
  // Period filter: determina el mejor período inicial con registros
  const defaultPeriod = useMemo(() => {
    const currentDate = new Date();
    const currYear = currentDate.getFullYear();
    const currMonth = currentDate.getMonth() + 1;
    const currPrefix = `${currYear}-${currMonth < 10 ? `0${currMonth}` : currMonth}`;

    // 1. Si el mes actual del sistema tiene movimientos registrados, usar el mes actual
    if (movements.some(m => m.date.startsWith(currPrefix))) {
      return { year: currYear, month: currMonth };
    }

    // 2. Si no, buscar el mes más reciente que sí contenga movimientos registrados
    const monthsWithData = Array.from(new Set(movements.map(m => m.date.slice(0, 7)))).sort();
    if (monthsWithData.length > 0) {
      const latest = monthsWithData[monthsWithData.length - 1]; // e.g. "2026-08"
      const [y, m] = latest.split('-').map(Number);
      return { year: y, month: m };
    }

    // 3. Fallback a Agosto 2026
    return { year: 2026, month: 8 };
  }, [movements]);

  const [selectedYear, setSelectedYear] = useState<number>(defaultPeriod.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(defaultPeriod.month);

  // Si los movimientos cambian y el período seleccionado actualmente no tiene registros mientras que otro sí, sincronizar
  useEffect(() => {
    const curPrefix = `${selectedYear}-${selectedMonth < 10 ? `0${selectedMonth}` : selectedMonth}`;
    const hasMovementsInSelected = movements.some(m => m.date.startsWith(curPrefix));
    if (!hasMovementsInSelected && movements.length > 0) {
      setSelectedYear(defaultPeriod.year);
      setSelectedMonth(defaultPeriod.month);
    }
  }, [movements, defaultPeriod]);

  // Tab & Filters
  const [activeTab, setActiveTab] = useState<'ALL' | 'TRANSFERENCIA' | 'EFECTIVO' | 'INCOME' | 'EXPENSE' | 'RESUMEN'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfessional, setSelectedProfessional] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<FinancialMovement | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedImportMovements, setParsedImportMovements] = useState<Omit<FinancialMovement, 'id' | 'createdAt'>[]>([]);
  const [importSummary, setImportSummary] = useState<{ transCount: number; efecCount: number; totalAmount: number } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State for Add / Edit
  const [formType, setFormType] = useState<FinancialMovementType>('INCOME');
  const [formMethod, setFormMethod] = useState<PaymentMethod>('TRANSFERENCIA');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formAmount, setFormAmount] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('Particular');
  const [formCustomCategory, setFormCustomCategory] = useState<string>('');
  const [formPatientName, setFormPatientName] = useState<string>('');
  const [formCuit, setFormCuit] = useState<string>('');
  const [formProfessional, setFormProfessional] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formCierreNumber, setFormCierreNumber] = useState<string>('');
  const [formBusinessUnit, setFormBusinessUnit] = useState<BusinessUnit>('KINESIO');
  const [formCostClassification, setFormCostClassification] = useState<CostClassification>('NONE');

  // All professionals list combining KNOWN_PROFESSIONALS with staff members
  const allProfessionals = useMemo(() => {
    const set = new Set<string>(KNOWN_PROFESSIONALS);
    staff.forEach(s => {
      if (s.firstName) {
        const shortName = s.firstName.split(' ')[0];
        set.add(shortName);
      }
    });
    return Array.from(set);
  }, [staff]);

  // Filter movements by month and year
  const monthString = selectedMonth < 10 ? `0${selectedMonth}` : `${selectedMonth}`;
  const yearMonthPrefix = `${selectedYear}-${monthString}`;

  const monthMovements = useMemo(() => {
    return movements.filter(m => m.date.startsWith(yearMonthPrefix));
  }, [movements, yearMonthPrefix]);

  // KPI calculations
  const kpis = useMemo(() => {
    let incTrans = 0;
    let incEfec = 0;
    let expTrans = 0;
    let expEfec = 0;

    monthMovements.forEach(m => {
      if (m.type === 'INCOME') {
        if (m.paymentMethod === 'TRANSFERENCIA') incTrans += m.amount;
        else incEfec += m.amount;
      } else {
        if (m.paymentMethod === 'TRANSFERENCIA') expTrans += m.amount;
        else expEfec += m.amount;
      }
    });

    const totalIncome = incTrans + incEfec;
    const totalExpense = expTrans + expEfec;
    const netBalance = totalIncome - totalExpense;
    const saldoTrans = incTrans - expTrans;
    const saldoEfec = incEfec - expEfec;

    return {
      totalIncome,
      incTrans,
      incEfec,
      totalExpense,
      expTrans,
      expEfec,
      netBalance,
      saldoTrans,
      saldoEfec,
      count: monthMovements.length
    };
  }, [monthMovements]);

  // Filtered movements for table
  const displayedMovements = useMemo(() => {
    return monthMovements.filter(m => {
      // Tab filter
      if (activeTab === 'TRANSFERENCIA' && m.paymentMethod !== 'TRANSFERENCIA') return false;
      if (activeTab === 'EFECTIVO' && m.paymentMethod !== 'EFECTIVO') return false;
      if (activeTab === 'INCOME' && m.type !== 'INCOME') return false;
      if (activeTab === 'EXPENSE' && m.type !== 'EXPENSE') return false;

      // Professional filter
      if (selectedProfessional !== 'ALL') {
        if (m.professional?.toLowerCase() !== selectedProfessional.toLowerCase()) return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && m.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesPatient = m.patientName?.toLowerCase().includes(q);
        const matchesCategory = m.category.toLowerCase().includes(q);
        const matchesDesc = m.description?.toLowerCase().includes(q);
        const matchesCuit = m.cuit?.toLowerCase().includes(q);
        const matchesProf = m.professional?.toLowerCase().includes(q);
        const matchesAmount = m.amount.toString().includes(q);

        if (!matchesPatient && !matchesCategory && !matchesDesc && !matchesCuit && !matchesProf && !matchesAmount) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [monthMovements, activeTab, selectedProfessional, selectedCategory, searchQuery]);

  // Categories present in this month for filter dropdown
  const monthCategories = useMemo(() => {
    const set = new Set<string>();
    monthMovements.forEach(m => set.add(m.category));
    return Array.from(set).sort();
  }, [monthMovements]);

  // Resumen by category (like the Excel Resumen sheet)
  const categorySummary = useMemo(() => {
    const incomes: Record<string, number> = {};
    const expenses: Record<string, number> = {};

    monthMovements.forEach(m => {
      if (m.type === 'INCOME') {
        incomes[m.category] = (incomes[m.category] || 0) + m.amount;
      } else {
        expenses[m.category] = (expenses[m.category] || 0) + m.amount;
      }
    });

    const incomeList = Object.entries(incomes)
      .map(([name, total]) => ({ name, total, pct: (total / (kpis.totalIncome || 1)) * 100 }))
      .sort((a, b) => b.total - a.total);

    const expenseList = Object.entries(expenses)
      .map(([name, total]) => ({ name, total, pct: (total / (kpis.totalExpense || 1)) * 100 }))
      .sort((a, b) => b.total - a.total);

    return { incomeList, expenseList };
  }, [monthMovements, kpis.totalIncome, kpis.totalExpense]);

  // Open modal for Create
  const handleOpenCreateModal = (method: PaymentMethod = 'TRANSFERENCIA', type: FinancialMovementType = 'INCOME') => {
    setEditingMovement(null);
    setFormType(type);
    setFormMethod(method);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormAmount('');
    setFormCategory(type === 'INCOME' ? 'Particular' : 'Ins. kine');
    setFormCustomCategory('');
    setFormPatientName('');
    setFormCuit('');
    setFormProfessional('');
    setFormDescription('');
    setFormCierreNumber('');
    const auto = getAutoClassification(type === 'INCOME' ? 'Particular' : 'Ins. kine', type === 'INCOME');
    setFormBusinessUnit(auto.businessUnit);
    setFormCostClassification(auto.costClassification);
    setIsAddModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (mov: FinancialMovement) => {
    setEditingMovement(mov);
    setFormType(mov.type);
    setFormMethod(mov.paymentMethod);
    setFormDate(mov.date);
    setFormAmount(mov.amount.toString());
    setFormCategory(mov.category);
    setFormCustomCategory('');
    setFormPatientName(mov.patientName || '');
    setFormCuit(mov.cuit || '');
    setFormProfessional(mov.professional || '');
    setFormDescription(mov.description || '');
    setFormCierreNumber(mov.cierreNumber ? mov.cierreNumber.toString() : '');
    setFormBusinessUnit(mov.businessUnit || 'GENERAL');
    setFormCostClassification(mov.costClassification || 'NONE');
    setIsAddModalOpen(true);
  };

  // On Category Select Change
  const handleCategoryChange = (cat: string) => {
    setFormCategory(cat);
    if (cat !== 'OTRO') {
      const auto = getAutoClassification(cat, formType === 'INCOME', formDescription, parseFloat(formAmount) || 0);
      setFormBusinessUnit(auto.businessUnit);
      setFormCostClassification(auto.costClassification);
    }
  };

  // Save Movement (Add or Update)
  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = parseFloat(formAmount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      alert('Por favor ingrese un monto válido mayor a 0');
      return;
    }

    const finalCategory = formCategory === 'OTRO' && formCustomCategory.trim()
      ? formCustomCategory.trim()
      : formCategory;

    if (!finalCategory) {
      alert('Por favor ingrese o seleccione una categoría');
      return;
    }

    const auto = getAutoClassification(finalCategory, formType === 'INCOME', formDescription.trim(), finalAmount);

    const movementData = {
      date: formDate,
      type: formType,
      paymentMethod: formMethod,
      amount: finalAmount,
      category: finalCategory,
      businessUnit: auto.businessUnit,
      costClassification: auto.costClassification,
      patientName: formPatientName.trim() || undefined,
      cuit: formCuit.trim() || undefined,
      professional: formProfessional.trim() || undefined,
      description: formDescription.trim() || undefined,
      cierreNumber: formCierreNumber ? parseInt(formCierreNumber) : undefined,
    };

    if (editingMovement) {
      await onUpdateMovement({
        ...editingMovement,
        ...movementData,
      });
    } else {
      await onAddMovement(movementData);
    }

    setIsAddModalOpen(false);
    setEditingMovement(null);
  };

  // Download Cash Flow Excel (Archivo 1: [Mes]_[Año]_Ingresos_y_Gastos.xlsx)
  const handleExportExcel = async () => {
    const monthName = MONTH_NAMES[selectedMonth - 1] || 'Mes';
    await exportCashFlowExcel(monthMovements, monthName, selectedYear);
  };

  // Download EERR Excel (Archivo 2: EERR_RTP_[Mes]_[Año].xlsx)
  const handleExportEERR = async () => {
    await exportEERRExcel(movements, selectedMonth, selectedYear);
  };

  // Parse Excel File for Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        const importedRows: Omit<FinancialMovement, 'id' | 'createdAt'>[] = [];
        let transCount = 0;
        let efecCount = 0;
        let totalAmount = 0;

        workbook.SheetNames.forEach(sheetName => {
          const lowerName = sheetName.toLowerCase().trim();
          const isTrans = lowerName.includes('transf');
          const isEfec = lowerName.includes('efectivo') || lowerName.includes('caja');

          if (!isTrans && !isEfec) return;

          const method: PaymentMethod = isTrans ? 'TRANSFERENCIA' : 'EFECTIVO';
          const worksheet = workbook.Sheets[sheetName];
          const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: null });

          rawData.forEach((row) => {
            // Find fields flexibly
            const fechaRaw = row['FECHA'] || row['Fecha'] || row['date'] || row['fecha'];
            if (!fechaRaw) return;

            let dateStr = '';
            if (typeof fechaRaw === 'number') {
              // Excel serial date to YYYY-MM-DD
              const dateObj = new Date(Math.round((fechaRaw - 25569) * 86400 * 1000));
              dateStr = dateObj.toISOString().split('T')[0];
            } else {
              const str = String(fechaRaw).trim();
              if (str.includes('/')) {
                const parts = str.split('/');
                if (parts.length === 3) {
                  const day = parts[0].padStart(2, '0');
                  const month = parts[1].padStart(2, '0');
                  const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                  dateStr = `${year}-${month}-${day}`;
                }
              } else if (str.includes('-')) {
                dateStr = str.substring(0, 10);
              }
            }
            if (!dateStr || dateStr.length < 10) return;

            const entrada = parseFloat(row['ENTRADA'] || row['Entrada'] || row['Ingreso'] || 0);
            const salida = parseFloat(row['SALIDA'] || row['Salida'] || row['Egreso'] || 0);

            if (entrada > 0) {
              const category = String(row['CONCEPTO INGRESO'] || row['Concepto'] || row['CATEGORIA'] || 'Particular').trim();
              const desc = row['DESCRIPCION'] || row['DETALLE'] || row['Detalle'] ? String(row['DESCRIPCION'] || row['DETALLE'] || row['Detalle']) : undefined;
              const auto = getAutoClassification(category, true, desc, entrada);
              importedRows.push({
                date: dateStr,
                type: 'INCOME',
                paymentMethod: method,
                amount: entrada,
                category,
                businessUnit: auto.businessUnit,
                costClassification: auto.costClassification,
                patientName: row['PACIENTE'] || row['Paciente'] || undefined,
                cuit: row['CUIT'] ? String(row['CUIT']) : undefined,
                professional: row['KINE'] || row['Kine'] || row['Profesional'] || undefined,
                description: desc,
                cierreNumber: row['N° CIERRE'] || row['Cierre'] ? parseInt(row['N° CIERRE'] || row['Cierre']) : undefined,
              });
              if (method === 'TRANSFERENCIA') transCount++;
              else efecCount++;
              totalAmount += entrada;
            }

            if (salida > 0) {
              const category = String(row['CONCEPTO SALIDA'] || row['Concepto'] || row['CATEGORIA'] || 'Otros').trim();
              const desc = row['DESCRIPCION'] || row['DETALLE'] || row['Detalle'] ? String(row['DESCRIPCION'] || row['DETALLE'] || row['Detalle']) : undefined;
              const auto = getAutoClassification(category, false, desc, salida);
              importedRows.push({
                date: dateStr,
                type: 'EXPENSE',
                paymentMethod: method,
                amount: salida,
                category,
                businessUnit: auto.businessUnit,
                costClassification: auto.costClassification,
                patientName: row['PACIENTE'] || row['Paciente'] || undefined,
                cuit: row['CUIT'] ? String(row['CUIT']) : undefined,
                professional: row['KINE'] || row['Kine'] || row['Profesional'] || undefined,
                description: desc,
                cierreNumber: row['N° CIERRE'] || row['Cierre'] ? parseInt(row['N° CIERRE'] || row['Cierre']) : undefined,
              });
              if (method === 'TRANSFERENCIA') transCount++;
              else efecCount++;
              totalAmount += salida;
            }
          });
        });

        if (importedRows.length === 0) {
          alert('No se pudieron encontrar registros en las hojas "Transferencias" o "Efectivo" de este archivo Excel.');
          return;
        }

        setParsedImportMovements(importedRows);
        setImportSummary({ transCount, efecCount, totalAmount });
        setIsImportModalOpen(true);
      } catch (err) {
        console.error('Error al leer Excel:', err);
        alert('Error al leer el archivo Excel. Asegúrate de que sea un archivo válido .xlsx');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // Confirm Import
  const handleConfirmImport = async () => {
    if (!parsedImportMovements.length || !onBulkAddMovements) return;
    setIsImporting(true);
    try {
      await onBulkAddMovements(parsedImportMovements);
      setIsImportModalOpen(false);
      setParsedImportMovements([]);
      setImportSummary(null);
      alert(`¡Se importaron ${parsedImportMovements.length} movimientos con éxito!`);
    } catch (err) {
      console.error('Error importing:', err);
      alert('Hubo un error al guardar los movimientos.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header / Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
              <DollarSign size={14} /> Finanzas y Caja Diaria
            </span>
            <span className="text-xs font-bold text-slate-400">RTP Kinesiología</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">
            Gestión Financiera de Movimientos
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-0.5">
            Registro de transferencias, ingresos y egresos de efectivo con conciliación automática.
          </p>
        </div>

        {/* Month Selector & Action Buttons */}
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

          {/* Import Excel */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
            title="Importar movimientos desde archivo Excel de Caja"
          >
            <Upload size={14} className="text-primary-600" />
            <span>Importar</span>
          </button>

          {/* Botón A: Exportar Caja Diaria (Excel) -> [Mes]_[Año]_Ingresos_y_Gastos.xlsx */}
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 rounded-2xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
            title="Descargar archivo independiente 1: [Mes]_[Año]_Ingresos_y_Gastos.xlsx (Resumen, Transferencias y Efectivo)"
          >
            <Download size={14} />
            <span>📥 Exportar Caja Diaria (Excel)</span>
          </button>

          {/* Botón B: Exportar Estado de Resultados (Excel) -> EERR_RTP_[Mes]_[Año].xlsx */}
          <button
            onClick={handleExportEERR}
            className="px-3.5 py-2.5 rounded-2xl text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
            title="Descargar archivo independiente 2: EERR_RTP_[Mes]_[Año].xlsx (Dashboard Gerencial y Económico)"
          >
            <FileSpreadsheet size={14} />
            <span>📥 Exportar Estado de Resultados (Excel)</span>
          </button>

          {/* View P&L Reports */}
          {onOpenReports && (
            <button
              onClick={onOpenReports}
              className="px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
            >
              <BarChart3 size={14} />
              <span>Ver Panel EERR</span>
            </button>
          )}

          {/* Add Movement Button */}
          <button
            onClick={() => handleOpenCreateModal('TRANSFERENCIA', 'INCOME')}
            className="px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/20 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>Nuevo Movimiento</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Income */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-6 -mt-6 transition-all group-hover:scale-110" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700">Ingresos Totales</span>
            <div className="p-2 bg-emerald-100/60 rounded-xl text-emerald-700">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight relative z-10">
            ${kpis.totalIncome.toLocaleString('es-AR')}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between relative z-10">
            <span>Transf: <strong>${kpis.incTrans.toLocaleString('es-AR')}</strong></span>
            <span>Efec: <strong>${kpis.incEfec.toLocaleString('es-AR')}</strong></span>
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-6 -mt-6 transition-all group-hover:scale-110" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-700">Egresos Totales</span>
            <div className="p-2 bg-rose-100/60 rounded-xl text-rose-700">
              <ArrowDownRight size={18} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight relative z-10">
            ${kpis.totalExpense.toLocaleString('es-AR')}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between relative z-10">
            <span>Transf: <strong>${kpis.expTrans.toLocaleString('es-AR')}</strong></span>
            <span>Efec: <strong>${kpis.expEfec.toLocaleString('es-AR')}</strong></span>
          </div>
        </div>

        {/* Saldo Efectivo */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-6 -mt-6 transition-all group-hover:scale-110" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-700">Caja Efectivo</span>
            <div className="p-2 bg-amber-100/60 rounded-xl text-amber-700">
              <Banknote size={18} />
            </div>
          </div>
          <p className={`text-2xl font-black tracking-tight relative z-10 ${kpis.saldoEfec >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            ${kpis.saldoEfec.toLocaleString('es-AR')}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between relative z-10">
            <span>Ing: ${kpis.incEfec.toLocaleString('es-AR')}</span>
            <span>Egr: ${kpis.expEfec.toLocaleString('es-AR')}</span>
          </div>
        </div>

        {/* Saldo Banco / Transferencias */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-6 -mt-6 transition-all group-hover:scale-110" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-700">Banco / Transf.</span>
            <div className="p-2 bg-blue-100/60 rounded-xl text-blue-700">
              <CreditCard size={18} />
            </div>
          </div>
          <p className={`text-2xl font-black tracking-tight relative z-10 ${kpis.saldoTrans >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            ${kpis.saldoTrans.toLocaleString('es-AR')}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between relative z-10">
            <span>Ing: ${kpis.incTrans.toLocaleString('es-AR')}</span>
            <span>Egr: ${kpis.expTrans.toLocaleString('es-AR')}</span>
          </div>
        </div>

        {/* Balance Neto */}
        <div className={`rounded-3xl p-5 border shadow-sm relative overflow-hidden group ${
          kpis.netBalance >= 0
            ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-500'
            : 'bg-gradient-to-br from-rose-600 to-red-700 text-white border-rose-500'
        }`}>
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-100">Resultado Neto</span>
            <div className="p-2 bg-white/20 rounded-xl text-white">
              <Wallet size={18} />
            </div>
          </div>
          <p className="text-2xl font-black tracking-tight relative z-10">
            ${kpis.netBalance.toLocaleString('es-AR')}
          </p>
          <div className="mt-3 pt-3 border-t border-white/20 text-[11px] text-emerald-100 flex justify-between relative z-10">
            <span>Mes: {MONTH_NAMES[selectedMonth - 1]}</span>
            <span>{kpis.count} movs.</span>
          </div>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todos ({monthMovements.length})
            </button>
            <button
              onClick={() => setActiveTab('TRANSFERENCIA')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'TRANSFERENCIA'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CreditCard size={14} />
              Transferencias ({monthMovements.filter(m => m.paymentMethod === 'TRANSFERENCIA').length})
            </button>
            <button
              onClick={() => setActiveTab('EFECTIVO')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'EFECTIVO'
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Banknote size={14} />
              Efectivo ({monthMovements.filter(m => m.paymentMethod === 'EFECTIVO').length})
            </button>
            <button
              onClick={() => setActiveTab('INCOME')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'INCOME'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TrendingUp size={14} />
              Ingresos ({monthMovements.filter(m => m.type === 'INCOME').length})
            </button>
            <button
              onClick={() => setActiveTab('EXPENSE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'EXPENSE'
                  ? 'bg-white text-rose-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TrendingDown size={14} />
              Egresos ({monthMovements.filter(m => m.type === 'EXPENSE').length})
            </button>
            <button
              onClick={() => setActiveTab('RESUMEN')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'RESUMEN'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileSpreadsheet size={14} />
              Resumen Categorías
            </button>
          </div>

          {/* Quick Filter Selects */}
          <div className="flex items-center gap-2">
            {/* Professional Filter */}
            <select
              value={selectedProfessional}
              onChange={e => setSelectedProfessional(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="ALL">Kine: Todos</option>
              {allProfessionals.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 max-w-[180px] truncate"
            >
              <option value="ALL">Categoría: Todas</option>
              {monthCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Search Bar */}
        {activeTab !== 'RESUMEN' && (
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por paciente, concepto, profesional, CUIT o detalle..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* VIEW CONTENT */}
      {activeTab === 'RESUMEN' ? (
        /* RESUMEN VIEW (Matching Excel Resumen sheet) */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income Categories */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Ingresos por Concepto</h3>
                  <p className="text-xs text-slate-400">Total: ${kpis.totalIncome.toLocaleString('es-AR')}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                {categorySummary.incomeList.length} conceptos
              </span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {categorySummary.incomeList.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors">
                  <div className="flex justify-between items-center text-xs font-bold mb-1">
                    <span className="text-slate-800">{item.name}</span>
                    <span className="text-emerald-700 font-black">${item.total.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(2, item.pct))}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 text-right">
                    {item.pct.toFixed(1)}% del total
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expense Categories */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <TrendingDown size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Egresos / Gastos por Concepto</h3>
                  <p className="text-xs text-slate-400">Total: ${kpis.totalExpense.toLocaleString('es-AR')}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                {categorySummary.expenseList.length} conceptos
              </span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {categorySummary.expenseList.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors">
                  <div className="flex justify-between items-center text-xs font-bold mb-1">
                    <span className="text-slate-800">{item.name}</span>
                    <span className="text-rose-700 font-black">${item.total.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(2, item.pct))}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 text-right">
                    {item.pct.toFixed(1)}% del total
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* TABLE VIEW FOR MOVEMENTS */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div
            className="overflow-x-auto max-h-[640px] focus:outline-2 focus:outline-primary-500"
            tabIndex={0}
            role="region"
            aria-label="Tabla de movimientos financieros"
          >
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_theme(colors.slate.200)]">
                <tr className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Medio</th>
                  <th className="py-3 px-4">Concepto / Categoría</th>
                  <th className="py-3 px-4">Paciente / Entidad</th>
                  <th className="py-3 px-4">CUIT</th>
                  <th className="py-3 px-4">Kine</th>
                  <th className="py-3 px-4">Detalle</th>
                  <th className="py-3 px-4 text-right">Monto</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {displayedMovements.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <Wallet size={36} className="mx-auto mb-2 text-slate-300" />
                      <p className="font-bold text-sm">No se encontraron movimientos</p>
                      <p className="text-xs text-slate-400 mt-1">Prueba cambiando los filtros o registra un nuevo movimiento.</p>
                    </td>
                  </tr>
                ) : (
                  displayedMovements.map((mov) => {
                    const isIncome = mov.type === 'INCOME';
                    return (
                      <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Fecha & Cierre */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-bold text-slate-800">{mov.date}</span>
                          {mov.cierreNumber && (
                            <span className="block text-[10px] text-slate-400">Cierre #{mov.cierreNumber}</span>
                          )}
                        </td>

                        {/* Medio de Pago */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            mov.paymentMethod === 'TRANSFERENCIA'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {mov.paymentMethod === 'TRANSFERENCIA' ? <CreditCard size={11} /> : <Banknote size={11} />}
                            {mov.paymentMethod === 'TRANSFERENCIA' ? 'Transf' : 'Efectivo'}
                          </span>
                        </td>

                        {/* Categoría / Concepto */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{mov.category}</div>
                          {mov.businessUnit && mov.businessUnit !== 'GENERAL' && (
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">{mov.businessUnit}</span>
                          )}
                        </td>

                        {/* Paciente */}
                        <td className="py-3 px-4">
                          {mov.patientName ? (
                            <span className="font-medium text-slate-800">{mov.patientName}</span>
                          ) : (
                            <span className="text-slate-300 italic">-</span>
                          )}
                        </td>

                        {/* CUIT */}
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {mov.cuit || <span className="text-slate-300 italic">-</span>}
                        </td>

                        {/* Kinesiólogo */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {mov.professional ? (
                            <span className="inline-block px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-bold">
                              {mov.professional}
                            </span>
                          ) : (
                            <span className="text-slate-300 italic">-</span>
                          )}
                        </td>

                        {/* Detalle */}
                        <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate" title={mov.description}>
                          {mov.description || <span className="text-slate-300 italic">-</span>}
                        </td>

                        {/* Monto */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span className={`font-black text-sm ${
                            isIncome ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {isIncome ? '+' : '-'}${mov.amount.toLocaleString('es-AR')}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditModal(mov)}
                              className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="Editar movimiento"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(mov.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Eliminar movimiento"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* Table Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
            <span>Mostrando {displayedMovements.length} de {monthMovements.length} movimientos de {MONTH_NAMES[selectedMonth - 1]} {selectedYear}</span>
            <span className="font-bold text-slate-700">
              Subtotal Filtrado: ${displayedMovements.reduce((acc, m) => acc + (m.type === 'INCOME' ? m.amount : -m.amount), 0).toLocaleString('es-AR')}
            </span>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className={`p-2.5 rounded-2xl ${formType === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  <DollarSign size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingMovement ? 'Editar Movimiento' : 'Nuevo Movimiento Financiero'}
                  </h3>
                  <p className="text-xs text-slate-400">Ingreso o egreso para la conciliación de caja</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMovement} className="space-y-4 mt-4">
              {/* Type Toggle: Ingreso / Egreso */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setFormType('INCOME');
                    handleCategoryChange('Particular');
                  }}
                  className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    formType === 'INCOME'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowUpRight size={14} />
                  Ingreso (+)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormType('EXPENSE');
                    handleCategoryChange('Ins. kine');
                  }}
                  className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    formType === 'EXPENSE'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowDownRight size={14} />
                  Egreso / Gasto (-)
                </button>
              </div>

              {/* Payment Method: Transferencia / Efectivo */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setFormMethod('TRANSFERENCIA')}
                  className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    formMethod === 'TRANSFERENCIA'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CreditCard size={14} />
                  Transferencia
                </button>
                <button
                  type="button"
                  onClick={() => setFormMethod('EFECTIVO')}
                  className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    formMethod === 'EFECTIVO'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Banknote size={14} />
                  Efectivo
                </button>
              </div>

              {/* Monto & Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Monto ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={formAmount}
                    onChange={e => setFormAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 font-black text-slate-900 text-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Categoría / Concepto */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                  Categoría / Concepto *
                </label>
                <select
                  value={formCategory}
                  onChange={e => handleCategoryChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 font-bold text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {(formType === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => (
                    <option key={c.name} value={c.name}>{c.name} ({c.group})</option>
                  ))}
                  <option value="OTRO">Otro concepto personalizado...</option>
                </select>
                {formCategory === 'OTRO' && (
                  <input
                    type="text"
                    required
                    placeholder="Escriba la nueva categoría..."
                    value={formCustomCategory}
                    onChange={e => setFormCustomCategory(e.target.value)}
                    className="mt-2 w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                )}
              </div>

              {/* Paciente y CUIT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Paciente / Contraparte
                  </label>
                  <input
                    type="text"
                    list="patient-names-list"
                    placeholder="Nombre del paciente..."
                    value={formPatientName}
                    onChange={e => {
                      const val = e.target.value;
                      setFormPatientName(val);
                      // Auto-fill CUIT/DNI if matches a patient
                      const found = patients.find(p => `${p.firstName} ${p.lastName}`.trim().toLowerCase() === val.toLowerCase());
                      if (found && found.dni && !formCuit) {
                        setFormCuit(found.dni);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <datalist id="patient-names-list">
                    {patients.map(p => (
                      <option key={p.id} value={`${p.firstName} ${p.lastName}`.trim()}>{p.dni ? `DNI: ${p.dni}` : ''}</option>
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    CUIT / DNI
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 20-12345678-9"
                    value={formCuit}
                    onChange={e => setFormCuit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Kinesiólogo / Profesional */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Kine / Profesional
                  </label>
                  <select
                    value={formProfessional}
                    onChange={e => setFormProfessional(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">(Ninguno / General)</option>
                    {allProfessionals.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    N° Cierre / Día
                  </label>
                  <input
                    type="number"
                    placeholder="Opcional (ej: 1, 2...)"
                    value={formCierreNumber}
                    onChange={e => setFormCierreNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Detalle / Descripción */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                  Detalle / Observaciones
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalle o descripción adicional del movimiento..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/20 active:scale-95 transition-all"
                >
                  {editingMovement ? 'Guardar Cambios' : 'Registrar Movimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={24} />
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1">¿Eliminar Movimiento?</h3>
            <p className="text-xs text-slate-500 mb-6">
              Esta acción eliminará el registro de la caja y de los reportes. Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await onDeleteMovement(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-5 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT PREVIEW MODAL */}
      {isImportModalOpen && importSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] max-w-lg w-full p-6 shadow-2xl border border-slate-100 text-left animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl">
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Confirmar Importación de Excel</h3>
                <p className="text-xs text-slate-400">Se detectaron los siguientes datos en el archivo</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 mb-4 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Movimientos de Transferencias:</span>
                <span className="font-black text-slate-900">{importSummary.transCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Movimientos de Efectivo:</span>
                <span className="font-black text-slate-900">{importSummary.efecCount}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-700 font-bold">Total a Importar:</span>
                <span className="font-black text-primary-600 text-sm">{parsedImportMovements.length} movimientos</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-700 font-bold">Volumen Total Procesado:</span>
                <span className="font-black text-emerald-600 text-sm">${importSummary.totalAmount.toLocaleString('es-AR')}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mb-6">
              Los movimientos se sincronizarán directamente con la base de datos de la clínica y estarán disponibles en el panel de caja y estado de resultados.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                disabled={isImporting}
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedImportMovements([]);
                }}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                disabled={isImporting}
                onClick={handleConfirmImport}
                className="px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/20 active:scale-95 transition-all flex items-center gap-1.5"
              >
                {isImporting ? (
                  <span>Importando...</span>
                ) : (
                  <>
                    <CheckCircle size={15} />
                    <span>Confirmar e Importar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
