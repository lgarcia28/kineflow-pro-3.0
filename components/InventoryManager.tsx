import React, { useState } from 'react';
import { InventoryItem, InventoryMovement } from '../types';
import { 
  Package, 
  Plus, 
  Minus, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  History, 
  Trash2, 
  Edit3, 
  Filter, 
  Calendar, 
  DollarSign, 
  FileSpreadsheet, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Sparkles,
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardList,
  Receipt
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface InventoryManagerProps {
  items: InventoryItem[];
  movements: InventoryMovement[];
  onAddItem: (item: InventoryItem) => void;
  onUpdateItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onRegisterMovement: (movement: Omit<InventoryMovement, 'id' | 'createdAt'>) => void;
  onOpenInvoices?: () => void;
  currentUserName?: string;
}

const normalizeItemCategory = (category: string, name?: string): string => {
  const cat = (category || '').trim();
  const lower = cat.toLowerCase();
  if (lower === 'descartables' || lower === 'descartable') return 'Descartables';
  if (lower === 'limpieza') return 'Limpieza';
  if (name) {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('toalla') || nameLower.includes('bobina') || nameLower.includes('arranque')) {
      return 'Descartables';
    }
  }
  if (lower.includes('limpieza') || lower.includes('baño') || lower.includes('higiene') || lower.includes('desinfección') || lower.includes('desinfeccion') || lower.includes('general')) {
    return 'Limpieza';
  }
  return cat || 'Limpieza';
};

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  items,
  movements,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onRegisterMovement,
  onOpenInvoices,
  currentUserName = 'Recepción'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Normalizar ítems en memoria
  const normalizedItems = items.map(item => ({
    ...item,
    category: normalizeItemCategory(item.category, item.name)
  }));

  // Modales
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showMovementModal, setShowMovementModal] = useState<'IN' | 'OUT' | null>(null);
  const [selectedItemForMovement, setSelectedItemForMovement] = useState<InventoryItem | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Formulario de Insumo (Crear / Editar)
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('Limpieza');
  const [itemUnit, setItemUnit] = useState('Unidades');
  const [itemStock, setItemStock] = useState<number>(1);
  const [itemMinStock, setItemMinStock] = useState<number>(1);
  const [itemDetails, setItemDetails] = useState('');
  const [itemLastCost, setItemLastCost] = useState<number>(0);
  const [itemLastQuantity, setItemLastQuantity] = useState('');

  // Creación dinámica de categoría en el modal
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Formulario de Movimiento (Ingreso / Baja)
  const [movementQty, setMovementQty] = useState<number>(1);
  const [movementReason, setMovementReason] = useState('');
  const [movementDate, setMovementDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [movementCost, setMovementCost] = useState<number>(0);

  // Lista de categorías únicas encontradas en los ítems
  const defaultCategories = ['Limpieza', 'Descartables'];
  const categories = Array.from(new Set([...defaultCategories, ...normalizedItems.map(i => i.category).filter(Boolean)]));

  // Filtrar ítems
  const filteredItems = normalizedItems.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.details && item.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const isLow = (item.minStock !== undefined && item.currentStock <= item.minStock) || item.currentStock <= 0;
    const matchesLowStock = !onlyLowStock || isLow;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  // Métricas
  const totalItemsCount = normalizedItems.length;
  const lowStockItems = normalizedItems.filter(i => (i.minStock !== undefined && i.currentStock <= i.minStock) || i.currentStock <= 0);
  const lowStockCount = lowStockItems.length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const movementsThisMonth = movements.filter(m => {
    if (!m.date) return false;
    const [y, mth] = m.date.split('-').map(Number);
    return y === currentYear && (mth - 1) === currentMonth;
  });

  // Abrir Modal de Edición
  const handleOpenEdit = (item: InventoryItem) => {
    const normalizedCat = normalizeItemCategory(item.category, item.name);
    setEditingItem(item);
    setItemName(item.name);
    setItemCategory(normalizedCat);
    setItemUnit(item.unit || 'Unidades');
    setItemStock(item.currentStock);
    setItemMinStock(item.minStock || 1);
    setItemDetails(item.details || '');
    setItemLastCost(item.lastPurchaseCost || 0);
    setItemLastQuantity(item.lastPurchaseQuantity || '');
    setIsCreatingCategory(false);
    setNewCategoryName('');
    setShowItemModal(true);
  };

  // Abrir Modal de Creación
  const handleOpenCreate = () => {
    setEditingItem(null);
    setItemName('');
    setItemCategory('Limpieza');
    setItemUnit('Unidades');
    setItemStock(1);
    setItemMinStock(1);
    setItemDetails('');
    setItemLastCost(0);
    setItemLastQuantity('');
    setIsCreatingCategory(false);
    setNewCategoryName('');
    setShowItemModal(true);
  };

  // Guardar Insumo (Nuevo o Editado)
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    if (editingItem) {
      onUpdateItem({
        ...editingItem,
        name: itemName.trim(),
        category: itemCategory,
        unit: itemUnit,
        currentStock: Number(itemStock),
        minStock: Number(itemMinStock),
        details: itemDetails.trim(),
        lastPurchaseCost: Number(itemLastCost),
        lastPurchaseQuantity: itemLastQuantity.trim(),
        updatedAt: new Date().toISOString()
      });
    } else {
      const newItem: InventoryItem = {
        id: `insumo_${Date.now()}`,
        name: itemName.trim(),
        category: itemCategory,
        unit: itemUnit,
        currentStock: Number(itemStock),
        minStock: Number(itemMinStock),
        details: itemDetails.trim(),
        lastPurchaseDate: new Date().toISOString().split('T')[0],
        lastPurchaseCost: Number(itemLastCost),
        lastPurchaseQuantity: itemLastQuantity.trim(),
        updatedAt: new Date().toISOString()
      };
      onAddItem(newItem);
    }

    setShowItemModal(false);
  };

  // Abrir Modal de Movimiento Express (+ / -)
  const handleOpenMovement = (item: InventoryItem, type: 'IN' | 'OUT') => {
    setSelectedItemForMovement(item);
    setShowMovementModal(type);
    setMovementQty(1);
    setMovementCost(item.lastPurchaseCost || 0);
    setMovementDate(new Date().toISOString().split('T')[0]);
    setMovementReason(type === 'IN' ? 'Compra / Reposición de stock' : 'Consumo / Uso en clínica');
  };

  // Confirmar Movimiento (+ / -)
  const handleConfirmMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForMovement || movementQty <= 0) return;

    const qty = Number(movementQty);
    const prevStock = selectedItemForMovement.currentStock;
    const newStock = showMovementModal === 'IN' ? prevStock + qty : Math.max(0, prevStock - qty);
    const enteredCost = showMovementModal === 'IN' && movementCost > 0 ? Number(movementCost) : undefined;

    onRegisterMovement({
      itemId: selectedItemForMovement.id,
      itemName: selectedItemForMovement.name,
      type: showMovementModal!,
      quantity: qty,
      previousStock: prevStock,
      newStock: newStock,
      cost: enteredCost,
      reason: movementReason.trim() || (showMovementModal === 'IN' ? 'Ingreso de stock' : 'Baja de stock'),
      performedBy: currentUserName,
      date: movementDate
    });

    if (showMovementModal === 'IN' && enteredCost !== undefined) {
      onUpdateItem({
        ...selectedItemForMovement,
        currentStock: newStock,
        lastPurchaseCost: enteredCost,
        lastPurchaseDate: movementDate,
        lastPurchaseQuantity: `${qty} ${selectedItemForMovement.unit || ''}`.trim(),
        updatedAt: new Date().toISOString()
      });
    }

    setShowMovementModal(null);
    setSelectedItemForMovement(null);
  };

  // Exportar a Excel
  const handleExportExcel = () => {
    const dataToExport = items.map(item => ({
      'Código': item.id,
      'Producto / Insumo': item.name,
      'Categoría': item.category,
      'Unidad / Presentación': item.unit,
      'Stock Actual': item.currentStock,
      'Stock Mínimo': item.minStock || 0,
      'Estado': (item.minStock && item.currentStock <= item.minStock) ? 'STOCK BAJO' : 'OK',
      'Detalle': item.details || '',
      'Última Compra': item.lastPurchaseDate || '',
      'Costo Última Compra ($)': item.lastPurchaseCost || 0,
      'Cantidad Comprada': item.lastPurchaseQuantity || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');
    XLSX.writeFile(workbook, `Inventario_Insumos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header y Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Card 1: Total Insumos */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Insumos</span>
            <p className="text-3xl font-black text-slate-900">{totalItemsCount}</p>
            <p className="text-xs text-slate-500 font-medium">Registrados en la clínica</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Boxes size={24} />
          </div>
        </div>

        {/* Card 2: Stock Bajo Alerta */}
        <div className={`p-5 rounded-3xl border shadow-sm flex items-center justify-between transition-all ${
          lowStockCount > 0 
            ? 'bg-amber-50/70 border-amber-200 text-amber-900' 
            : 'bg-white border-slate-200/80 text-slate-900'
        }`}>
          <div className="space-y-1">
            <span className={`text-[10px] font-black uppercase tracking-widest ${lowStockCount > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
              Alertas de Stock Bajo
            </span>
            <p className={`text-3xl font-black ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {lowStockCount}
            </p>
            <p className="text-xs font-medium opacity-80">
              {lowStockCount > 0 ? 'Requieren compra o reposición' : 'Todo en nivel óptimo'}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            lowStockCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-600'
          }`}>
            <AlertTriangle size={24} />
          </div>
        </div>

        {/* Card 3: Movimientos del Mes */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Movimientos Este Mes</span>
            <p className="text-3xl font-black text-slate-900">{movementsThisMonth.length}</p>
            <p className="text-xs text-slate-500 font-medium">Ingresos y bajas registradas</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <ClipboardList size={24} />
          </div>
        </div>
      </div>

      {/* 2. Barra de Herramientas y Acciones */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Buscador */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar insumo por nombre, detalle o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-slate-400"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Botones Principales */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              className={`px-3.5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all border ${
                onlyLowStock
                  ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <AlertTriangle size={15} />
              <span>{onlyLowStock ? 'Mostrando Stock Bajo' : 'Filtrar Stock Bajo'}</span>
              {lowStockCount > 0 && (
                <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-black">
                  {lowStockCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowHistoryModal(true)}
              className="px-3.5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all border border-slate-200"
            >
              <History size={15} />
              <span className="hidden sm:inline">Historial</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3.5 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all"
              title="Exportar inventario completo a Excel"
            >
              <FileSpreadsheet size={15} />
              <span className="hidden sm:inline">Excel</span>
            </button>

            {onOpenInvoices && (
              <button
                onClick={onOpenInvoices}
                className="px-3.5 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm active:scale-95"
                title="Cargar y consultar Facturas de Compra"
              >
                <Receipt size={15} />
                <span className="hidden sm:inline">Facturas de Compra</span>
              </button>
            )}

            <button
              onClick={handleOpenCreate}
              className="px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-primary-600/30 active:scale-95"
            >
              <Plus size={16} />
              <span>Nuevo Insumo</span>
            </button>
          </div>
        </div>

        {/* Categorías (Pills) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Todas ({normalizedItems.length})
          </button>
          {categories.map(cat => {
            const count = normalizedItems.filter(i => i.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Tabla de Insumos */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="py-4 px-5">Insumo / Producto</th>
                <th className="py-4 px-4">Presentación / Detalle</th>
                <th className="py-4 px-4 text-center">Stock Actual</th>
                <th className="py-4 px-4 text-center">Stock Seguridad (Punto Pedido)</th>
                <th className="py-4 px-4">Última Compra</th>
                <th className="py-4 px-5 text-right">Acciones de Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold space-y-2">
                    <Boxes size={36} className="mx-auto text-slate-300 opacity-60" />
                    <p>No se encontraron insumos que coincidan con la búsqueda o filtro.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const safetyThreshold = item.minStock !== undefined ? item.minStock : 1;
                  const isLow = item.currentStock <= safetyThreshold;
                  const isZero = item.currentStock <= 0;

                  return (
                    <tr key={item.id} className={`transition-colors ${isLow ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-slate-50/80'}`}>
                      
                      {/* Nombre y Categoría */}
                      <td className="py-4 px-5">
                        <div>
                          <p className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                            {item.name}
                            {isLow && (
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" title="Alerta de Punto de Pedido alcanzado"></span>
                            )}
                          </p>
                          <span className="inline-block px-2 py-0.5 mt-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200/60">
                            {item.category || 'General'}
                          </span>
                        </div>
                      </td>

                      {/* Presentación / Detalle */}
                      <td className="py-4 px-4 text-slate-600">
                        <div>
                          <p className="font-bold text-slate-800">{item.unit}</p>
                          {item.details && (
                            <p className="text-[11px] text-slate-400 font-medium line-clamp-1">{item.details}</p>
                          )}
                        </div>
                      </td>

                      {/* Stock Actual - En ROJO cuando llega al stock de seguridad o menos */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`px-3 py-1.5 rounded-xl font-black text-xs border transition-all ${
                            isZero
                              ? 'bg-red-600 text-white border-red-700 shadow-md shadow-red-600/30 animate-pulse'
                              : isLow
                              ? 'bg-red-500 text-white border-red-600 shadow-md shadow-red-500/20'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            {item.currentStock} {item.unit}
                          </span>
                          {isLow && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded-md border border-red-200">
                              <AlertTriangle size={10} /> {isZero ? 'Agotado' : '¡Punto Pedido!'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock de Seguridad / Punto de Reorden (Editable directamente en la fila) */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={item.minStock ?? 1}
                              onChange={(e) => {
                                const val = Math.max(0, parseFloat(e.target.value) || 0);
                                onUpdateItem({ ...item, minStock: val, updatedAt: new Date().toISOString() });
                              }}
                              className="w-16 text-center font-black text-xs bg-slate-50 border border-slate-200 rounded-xl py-1.5 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all shadow-inner"
                              title="Haz clic para editar el Stock de Seguridad / Punto de Pedido"
                            />
                            <span className="text-[10px] text-slate-400 font-bold">{item.unit}</span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-medium">Click para editar</span>
                        </div>
                      </td>

                      {/* Última Compra */}
                      <td className="py-4 px-4 text-[11px] text-slate-500">
                        {item.lastPurchaseCost ? (
                          <div>
                            <p className="font-black text-slate-800">${item.lastPurchaseCost.toLocaleString('es-AR')}</p>
                            <p className="text-[10px] text-slate-400">{item.lastPurchaseQuantity || item.lastPurchaseDate || '-'}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Sin datos</span>
                        )}
                      </td>

                      {/* Acciones Rápidas */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Botón Ingreso Express (+) */}
                          <button
                            onClick={() => handleOpenMovement(item, 'IN')}
                            className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-black transition-all hover:scale-105 active:scale-95"
                            title="Ingresar Stock (+)"
                          >
                            <Plus size={16} />
                          </button>

                          {/* Botón Baja Express (-) */}
                          <button
                            onClick={() => handleOpenMovement(item, 'OUT')}
                            className="p-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 font-black transition-all hover:scale-105 active:scale-95"
                            title="Dar de Baja Stock (-)"
                          >
                            <Minus size={16} />
                          </button>

                          {/* Botón Editar */}
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                            title="Editar Insumo"
                          >
                            <Edit3 size={15} />
                          </button>

                          {/* Botón Eliminar */}
                          <button
                            onClick={() => {
                              if (confirm(`¿Seguro que deseas eliminar el insumo "${item.name}"?`)) {
                                onDeleteItem(item.id);
                              }
                            }}
                            className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Eliminar Insumo"
                          >
                            <Trash2 size={15} />
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
      </div>

      {/* 4. MODAL ALTA / EDICIÓN DE INSUMO */}
      {showItemModal && (
        <div className="fixed inset-0 z-[600] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-primary-400 font-bold">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black">{editingItem ? 'Editar Insumo' : 'Nuevo Insumo'}</h3>
                  <p className="text-xs text-slate-400 font-medium">Control de stock de la clínica</p>
                </div>
              </div>
              <button 
                onClick={() => setShowItemModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 ml-1">
                  Nombre del Insumo / Producto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Papel Higiénico, Jabón Líquido, etc."
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5 ml-1">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Categoría *
                    </label>
                    {!isCreatingCategory && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingCategory(true);
                          setNewCategoryName('');
                        }}
                        className="text-[10px] font-bold text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
                      >
                        <Plus size={11} /> Nueva
                      </button>
                    )}
                  </div>

                  {isCreatingCategory ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="Ej: Insumos Médicos..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="flex-1 bg-white border-2 border-primary-500 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newCategoryName.trim()) {
                            setItemCategory(newCategoryName.trim());
                            setIsCreatingCategory(false);
                            setNewCategoryName('');
                          }
                        }}
                        className="px-3 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                      >
                        Usar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingCategory(false);
                          setNewCategoryName('');
                        }}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
                        title="Cancelar"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <select
                      value={itemCategory}
                      onChange={(e) => {
                        if (e.target.value === '__NEW__') {
                          setIsCreatingCategory(true);
                          setNewCategoryName('');
                        } else {
                          setItemCategory(e.target.value);
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    >
                      {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="__NEW__">+ Crear Nueva Categoría...</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 ml-1">
                    Unidad de Medida
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Rollos, Bidón 5L, Cajas, Paquetes"
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 ml-1">
                    Stock Actual Disponible *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={itemStock}
                    onChange={(e) => setItemStock(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                  <p className="text-[10px] text-slate-400 font-medium mt-1 ml-1">Cantidad física existente</p>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-indigo-600 tracking-wider mb-1.5 ml-1 flex items-center gap-1">
                    <AlertTriangle size={12} className="text-amber-500" /> Stock Seguridad (Punto Pedido) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={itemMinStock}
                    onChange={(e) => setItemMinStock(parseFloat(e.target.value) || 0)}
                    className="w-full bg-indigo-50/50 border-2 border-indigo-200 rounded-2xl px-4 py-3 text-xs font-black text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-red-600 font-bold mt-1 ml-1">
                    Al llegar a este número se pondrá en <strong>ROJO</strong>.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 ml-1">
                  Detalles / Presentación (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: 300 mts / Bolsa x 8, 45x60"
                  value={itemDetails}
                  onChange={(e) => setItemDetails(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 ml-1">
                    Costo Última Compra ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={itemLastCost}
                    onChange={(e) => setItemLastCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 ml-1">
                    Cantidad Última Compra
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 2 rollos, 1 caja"
                    value={itemLastQuantity}
                    onChange={(e) => setItemLastQuantity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-5 py-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider bg-primary-600 hover:bg-primary-500 text-white shadow-md shadow-primary-600/30 transition-all active:scale-95"
                >
                  {editingItem ? 'Guardar Cambios' : 'Crear Insumo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL DE INGRESO (+) O BAJA (-) DE STOCK */}
      {showMovementModal && selectedItemForMovement && (
        <div className="fixed inset-0 z-[600] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className={`p-6 text-white flex items-center justify-between ${
              showMovementModal === 'IN' ? 'bg-emerald-600' : 'bg-amber-600'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                  {showMovementModal === 'IN' ? <ArrowDownLeft size={22} /> : <ArrowUpRight size={22} />}
                </div>
                <div>
                  <h3 className="text-lg font-black">
                    {showMovementModal === 'IN' ? 'Ingreso de Stock (+)' : 'Baja de Stock (-)'}
                  </h3>
                  <p className="text-xs text-white/80 font-medium">
                    {selectedItemForMovement.name}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setShowMovementModal(null); setSelectedItemForMovement(null); }}
                className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmMovement} className="p-6 space-y-4">
              
              {/* Información de Stock Actual */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Stock Actual</span>
                  <p className="text-base font-black text-slate-900">
                    {selectedItemForMovement.currentStock} {selectedItemForMovement.unit}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Stock Resultante</span>
                  <p className={`text-base font-black ${
                    showMovementModal === 'IN' ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {showMovementModal === 'IN' 
                      ? selectedItemForMovement.currentStock + (Number(movementQty) || 0)
                      : Math.max(0, selectedItemForMovement.currentStock - (Number(movementQty) || 0))
                    } {selectedItemForMovement.unit}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 ml-1">
                  Cantidad a {showMovementModal === 'IN' ? 'Ingresar' : 'Dar de Baja'} *
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={movementQty}
                  onChange={(e) => setMovementQty(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-lg font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-center"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 ml-1">
                  Motivo / Observación
                </label>
                <input
                  type="text"
                  placeholder={showMovementModal === 'IN' ? 'Ej: Compra mayorista, reposición' : 'Ej: Limpieza semanal, merma, rotura'}
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              {showMovementModal === 'IN' && (
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 ml-1 flex items-center justify-between">
                    <span>Precio / Costo Total de Compra ($)</span>
                    <span className="text-slate-400 font-normal lowercase">(opcional)</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Ej: 21696"
                      value={movementCost || ''}
                      onChange={(e) => setMovementCost(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-1 ml-1">
                    Actualiza automáticamente el registro de costo de última compra del producto.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 ml-1">
                  Fecha del Movimiento
                </label>
                <input
                  type="date"
                  value={movementDate}
                  onChange={(e) => setMovementDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowMovementModal(null); setSelectedItemForMovement(null); }}
                  className="px-5 py-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider text-white shadow-md transition-all active:scale-95 ${
                    showMovementModal === 'IN' 
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30' 
                      : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                  }`}
                >
                  Confirmar {showMovementModal === 'IN' ? 'Ingreso' : 'Baja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL DE HISTORIAL DE MOVIMIENTOS */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[600] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-teal-400 font-bold">
                  <History size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black">Historial de Movimientos de Inventario</h3>
                  <p className="text-xs text-slate-400 font-medium">Auditoría cronológica de ingresos y bajas</p>
                </div>
              </div>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {movements.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-bold space-y-2">
                  <ClipboardList size={36} className="mx-auto text-slate-300 opacity-60" />
                  <p>Aún no hay movimientos de stock registrados.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {movements.slice().reverse().map(mov => (
                    <div key={mov.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                          mov.type === 'IN' 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                            : 'bg-amber-50 text-amber-600 border border-amber-200'
                        }`}>
                          {mov.type === 'IN' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">{mov.itemName}</p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {mov.reason} {mov.performedBy ? `• Por ${mov.performedBy}` : ''}
                            {mov.cost ? ` • Costo: $${mov.cost.toLocaleString('es-AR')}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-xs font-black ${
                          mov.type === 'IN' ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          {mov.type === 'IN' ? `+${mov.quantity}` : `-${mov.quantity}`}
                        </span>
                        <p className="text-[10px] text-slate-400 font-bold">
                          Stock: {mov.previousStock} ➔ {mov.newStock} | {mov.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
