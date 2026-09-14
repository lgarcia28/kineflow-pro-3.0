import React, { useState, useRef, useEffect } from 'react';
import { PurchaseInvoice, PurchaseInvoiceItem, InventoryItem } from '../types';
import { 
  FileText, 
  Plus, 
  Search, 
  Calendar, 
  DollarSign, 
  Trash2, 
  Eye, 
  FileSpreadsheet, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Paperclip, 
  Boxes, 
  Building2, 
  ChevronRight, 
  Tag, 
  TrendingUp, 
  ArrowDownLeft,
  Sparkles,
  Receipt,
  ExternalLink,
  PackagePlus,
  ArrowRight,
  CornerDownLeft
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface PurchaseInvoicesViewProps {
  invoices: PurchaseInvoice[];
  inventory: InventoryItem[];
  onAddInvoice: (
    invoice: Omit<PurchaseInvoice, 'id' | 'createdAt'>,
    itemsToUpdate: { item: InventoryItem; isNew: boolean; qtyAdded: number; unitCost: number }[]
  ) => void;
  onDeleteInvoice?: (invoiceId: string, revertStock: boolean) => void;
  currentUserName?: string;
}

export const PurchaseInvoicesView: React.FC<PurchaseInvoicesViewProps> = ({
  invoices = [],
  inventory = [],
  onAddInvoice,
  onDeleteInvoice,
  currentUserName = 'Recepción'
}) => {
  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'THIS_MONTH' | 'LAST_MONTH'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] = useState<PurchaseInvoice | null>(null);
  const [showImagePreview, setShowImagePreview] = useState<string | null>(null);
  const [deleteConfirmInvoice, setDeleteConfirmInvoice] = useState<PurchaseInvoice | null>(null);

  // Formulario de Nueva Factura
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('');
  const [formSupplier, setFormSupplier] = useState('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formPaymentMethod, setFormPaymentMethod] = useState<'Efectivo' | 'Transferencia' | 'Tarjeta de Débito' | 'Tarjeta de Crédito' | 'Cuenta Corriente' | 'Otro'>('Transferencia');
  const [formPaymentStatus, setFormPaymentStatus] = useState<'PAID' | 'PENDING'>('PAID');
  const [formReceiptUrl, setFormReceiptUrl] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Lista de ítems cargados en la factura actual
  const [addedItems, setAddedItems] = useState<PurchaseInvoiceItem[]>([]);

  // Referencias para auto-focus y control de teclado
  const searchInputRef = useRef<HTMLInputElement>(null);
  const costInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);

  // Estados para el selector/buscador de productos
  const [productSearch, setProductSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  
  // Si está creando un producto nuevo que no existe en stock
  const [isNewProductMode, setIsNewProductMode] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Limpieza');
  const [newProductUnit, setNewProductUnit] = useState('Unidades');
  
  // Inputs de cantidad y precio para el ítem a agregar
  const [inputQuantity, setInputQuantity] = useState<string>('');
  const [inputUnitCost, setInputUnitCost] = useState<string>('');

  // Lista de proveedores sugeridos previos
  const previousSuppliers = Array.from(new Set(invoices.map(i => i.supplier).filter(Boolean)));

  // Abrir Modal de Creación
  const handleOpenCreate = () => {
    setFormInvoiceNumber('');
    setFormSupplier('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormPaymentMethod('Transferencia');
    setFormPaymentStatus('PAID');
    setFormReceiptUrl('');
    setFormNotes('');
    setAddedItems([]);
    
    // Reset buscador
    setProductSearch('');
    setIsDropdownOpen(false);
    setSelectedInventoryItem(null);
    setIsNewProductMode(false);
    setNewProductName('');
    setNewProductCategory('Limpieza');
    setNewProductUnit('Unidades');
    setInputQuantity('');
    setInputUnitCost('');

    setShowCreateModal(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 150);
  };

  // Filtrar productos disponibles por búsqueda
  const matchingProducts = inventory.filter(item => 
    item.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(productSearch.toLowerCase()))
  );

  // Seleccionar producto del buscador
  const handleSelectProduct = (item: InventoryItem) => {
    setSelectedInventoryItem(item);
    setIsNewProductMode(false);
    setProductSearch(item.name);
    setIsDropdownOpen(false);
    setInputQuantity('');
    setInputUnitCost(item.lastPurchaseCost ? String(item.lastPurchaseCost) : '');
    // Lleva directo al costo, selecciona el valor y permite corregir o dar Enter/Tab para ir a cantidad
    setTimeout(() => {
      costInputRef.current?.focus();
      costInputRef.current?.select();
    }, 80);
  };

  // Seleccionar modo crear nuevo producto
  const handleStartNewProduct = () => {
    setSelectedInventoryItem(null);
    setIsNewProductMode(true);
    setNewProductName(productSearch.trim());
    setNewProductCategory('Limpieza');
    setNewProductUnit('Unidades');
    setIsDropdownOpen(false);
    setInputQuantity('');
    setInputUnitCost('');
    setTimeout(() => {
      costInputRef.current?.focus();
    }, 80);
  };

  // Agregar ítem a la lista de la factura
  const handleAddItemToInvoice = () => {
    const qty = parseFloat(inputQuantity);
    if (isNaN(qty) || qty <= 0) {
      alert('Por favor escribe la cantidad que ingresa (debe ser mayor a 0).');
      quantityInputRef.current?.focus();
      return;
    }

    const unitCost = parseFloat(inputUnitCost) || 0;

    if (isNewProductMode) {
      if (!newProductName.trim()) {
        alert('Por favor escribe el nombre del nuevo producto.');
        return;
      }
      const newItemId = `insumo_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const totalCost = qty * unitCost;

      const newItem: PurchaseInvoiceItem = {
        itemId: newItemId,
        itemName: newProductName.trim(),
        category: newProductCategory.trim() || 'Limpieza',
        unit: newProductUnit.trim() || 'Unidades',
        quantity: qty,
        unitCost: unitCost,
        totalCost: totalCost
      };

      setAddedItems(prev => [...prev, newItem]);
    } else {
      if (!selectedInventoryItem) {
        alert('Por favor busca y selecciona un producto del stock o crea uno nuevo.');
        searchInputRef.current?.focus();
        return;
      }

      const totalCost = qty * unitCost;

      // Si ya está en la lista, sumamos la cantidad y actualizamos precio
      const existingIndex = addedItems.findIndex(it => it.itemId === selectedInventoryItem.id);
      if (existingIndex >= 0) {
        const updated = [...addedItems];
        const newQty = updated[existingIndex].quantity + qty;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          unitCost: unitCost || updated[existingIndex].unitCost,
          totalCost: newQty * (unitCost || updated[existingIndex].unitCost)
        };
        setAddedItems(updated);
      } else {
        const newItem: PurchaseInvoiceItem = {
          itemId: selectedInventoryItem.id,
          itemName: selectedInventoryItem.name,
          category: selectedInventoryItem.category || 'Limpieza',
          unit: selectedInventoryItem.unit || 'Unidades',
          quantity: qty,
          unitCost: unitCost,
          totalCost: totalCost
        };
        setAddedItems(prev => [...prev, newItem]);
      }
    }

    // Resetear buscador para el siguiente producto y hacer foco en el buscador
    setProductSearch('');
    setSelectedInventoryItem(null);
    setIsNewProductMode(false);
    setNewProductName('');
    setInputQuantity('');
    setInputUnitCost('');
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 80);
  };

  // Quitar ítem de la lista
  const handleRemoveAddedItem = (index: number) => {
    setAddedItems(prev => prev.filter((_, i) => i !== index));
  };

  // Cargar imagen de comprobante (Base64)
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo supera los 5MB. Por favor sube una imagen más liviana.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormReceiptUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Calcular total de la factura a partir de los ítems agregados a la lista
  const calculatedTotal = addedItems.reduce((acc, it) => {
    return acc + (Number(it.quantity) || 0) * (Number(it.unitCost) || 0);
  }, 0);

  // Guardar Factura y Actualizar Stock
  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formSupplier.trim()) {
      alert('Por favor ingresa el nombre del proveedor.');
      return;
    }

    if (addedItems.length === 0) {
      alert('Por favor agrega al menos un producto o insumo a la lista de la factura.');
      return;
    }

    const itemsToUpdate: { item: InventoryItem; isNew: boolean; qtyAdded: number; unitCost: number }[] = [];

    addedItems.forEach(it => {
      const existingItem = inventory.find(i => i.id === it.itemId);
      if (existingItem) {
        itemsToUpdate.push({
          item: existingItem,
          isNew: false,
          qtyAdded: it.quantity,
          unitCost: it.unitCost
        });
      } else {
        // Insumo nuevo creado al cargar la factura
        const newItem: InventoryItem = {
          id: it.itemId,
          name: it.itemName,
          category: it.category || 'Limpieza',
          unit: it.unit || 'Unidades',
          currentStock: 0,
          minStock: 1,
          details: 'Cargado vía Factura de Compra',
          lastPurchaseCost: it.unitCost,
          lastPurchaseDate: formDate,
          lastPurchaseQuantity: `${it.quantity} ${it.unit || 'Unidades'}`.trim(),
          updatedAt: new Date().toISOString()
        };
        itemsToUpdate.push({
          item: newItem,
          isNew: true,
          qtyAdded: it.quantity,
          unitCost: it.unitCost
        });
      }
    });

    const newInvoiceData: Omit<PurchaseInvoice, 'id' | 'createdAt'> = {
      invoiceNumber: formInvoiceNumber.trim() || `FC-${Date.now().toString().slice(-6)}`,
      supplier: formSupplier.trim(),
      date: formDate,
      paymentMethod: formPaymentMethod,
      paymentStatus: formPaymentStatus,
      items: addedItems,
      totalAmount: calculatedTotal,
      receiptUrl: formReceiptUrl || undefined,
      notes: formNotes.trim() || undefined,
      registeredBy: currentUserName
    };

    onAddInvoice(newInvoiceData, itemsToUpdate);
    setShowCreateModal(false);
  };

  // Filtrado de Facturas
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.notes && inv.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      inv.items.some(it => it.itemName.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchesDate = true;
    if (dateFilter === 'THIS_MONTH') {
      matchesDate = Boolean(inv.date && inv.date.startsWith(currentMonthStr));
    } else if (dateFilter === 'LAST_MONTH') {
      matchesDate = Boolean(inv.date && inv.date.startsWith(lastMonthStr));
    }

    let matchesStatus = true;
    if (statusFilter === 'PAID') matchesStatus = inv.paymentStatus === 'PAID' || !inv.paymentStatus;
    if (statusFilter === 'PENDING') matchesStatus = inv.paymentStatus === 'PENDING';

    return matchesSearch && matchesDate && matchesStatus;
  });

  // Métricas
  const totalInvoicedThisMonth = invoices
    .filter(inv => inv.date && inv.date.startsWith(currentMonthStr))
    .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

  const totalInvoicesCount = invoices.length;
  const pendingInvoicesCount = invoices.filter(inv => inv.paymentStatus === 'PENDING').length;
  const totalProductsPurchasedThisMonth = invoices
    .filter(inv => inv.date && inv.date.startsWith(currentMonthStr))
    .reduce((sum, inv) => sum + inv.items.reduce((s, it) => s + (it.quantity || 0), 0), 0);

  // Exportar Facturas a Excel
  const handleExportExcel = () => {
    const dataToExport: any[] = [];
    invoices.forEach(inv => {
      inv.items.forEach(it => {
        dataToExport.push({
          'Nº Factura': inv.invoiceNumber,
          'Proveedor': inv.supplier,
          'Fecha': inv.date,
          'Condición de Pago': inv.paymentMethod || 'Efectivo',
          'Estado Pago': inv.paymentStatus === 'PENDING' ? 'PENDIENTE' : 'PAGADA',
          'Insumo / Producto': it.itemName,
          'Categoría': it.category || 'Limpieza',
          'Unidad': it.unit || 'Unidades',
          'Cantidad': it.quantity,
          'Costo Unitario ($)': it.unitCost,
          'Subtotal ($)': it.totalCost,
          'Total Factura ($)': inv.totalAmount,
          'Cargado Por': inv.registeredBy || 'Recepción',
          'Notas': inv.notes || ''
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Facturas_Compras');
    XLSX.writeFile(workbook, `Facturas_Compras_Insumos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Gastado este Mes */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Compras Mes</span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">
              ${totalInvoicedThisMonth.toLocaleString('es-AR')}
            </p>
            <p className="text-xs text-slate-500 font-medium">Facturado en el mes actual</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign size={24} />
          </div>
        </div>

        {/* Card 2: Total Facturas */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Facturas Registradas</span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{totalInvoicesCount}</p>
            <p className="text-xs text-slate-500 font-medium">Comprobantes en el sistema</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileText size={24} />
          </div>
        </div>

        {/* Card 3: Unidades Ingresadas */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Insumos del Mes</span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{totalProductsPurchasedThisMonth}</p>
            <p className="text-xs text-slate-500 font-medium">Unidades ingresadas al stock</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Boxes size={24} />
          </div>
        </div>

        {/* Card 4: Facturas Pendientes */}
        <div className={`p-5 rounded-3xl border shadow-sm flex items-center justify-between transition-all ${
          pendingInvoicesCount > 0 
            ? 'bg-amber-50/70 border-amber-200 text-amber-900' 
            : 'bg-white border-slate-200/80 text-slate-900'
        }`}>
          <div className="space-y-1">
            <span className={`text-[10px] font-black uppercase tracking-widest ${pendingInvoicesCount > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
              Facturas Pendientes
            </span>
            <p className={`text-2xl sm:text-3xl font-black ${pendingInvoicesCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {pendingInvoicesCount}
            </p>
            <p className="text-xs font-medium opacity-80">
              {pendingInvoicesCount > 0 ? 'Pendientes de pago a proveedor' : 'Todas pagadas al día'}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            pendingInvoicesCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-400'
          }`}>
            <Clock size={24} />
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
              placeholder="Buscar por Nº de factura, proveedor o insumo..."
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
              onClick={handleExportExcel}
              className="px-3.5 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all"
              title="Exportar facturas a Excel"
            >
              <FileSpreadsheet size={15} />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-primary-600/30 active:scale-95"
            >
              <Plus size={16} />
              <span>Cargar Factura de Compra</span>
            </button>
          </div>
        </div>

        {/* Filtros rápidos de Fecha y Estado */}
        <div className="flex items-center justify-between gap-4 flex-wrap pt-1 border-t border-slate-100">
          
          {/* Filtro Período */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1">Período:</span>
            <button
              onClick={() => setDateFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                dateFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setDateFilter('THIS_MONTH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                dateFilter === 'THIS_MONTH'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Este Mes
            </button>
            <button
              onClick={() => setDateFilter('LAST_MONTH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                dateFilter === 'LAST_MONTH'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Mes Anterior
            </button>
          </div>

          {/* Filtro Estado de Pago */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1">Estado:</span>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('PAID')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === 'PAID'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Pagadas
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Pendientes ({pendingInvoicesCount})
            </button>
          </div>
        </div>
      </div>

      {/* 3. Listado de Facturas */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="py-4 px-5">Fecha / Nº Factura</th>
                <th className="py-4 px-4">Proveedor</th>
                <th className="py-4 px-4">Insumos Comprados</th>
                <th className="py-4 px-4 text-center">Forma de Pago</th>
                <th className="py-4 px-4 text-center">Estado</th>
                <th className="py-4 px-4 text-right">Total Factura</th>
                <th className="py-4 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400 font-bold space-y-3">
                    <Receipt size={40} className="mx-auto text-slate-300 opacity-60" />
                    <p className="text-sm">No se encontraron facturas de compra registradas con los filtros actuales.</p>
                    <button
                      onClick={handleOpenCreate}
                      className="px-4 py-2 bg-primary-50 text-primary-600 rounded-xl text-xs font-bold hover:bg-primary-100 transition-colors"
                    >
                      + Cargar primera factura
                    </button>
                  </td>
                </tr>
              ) : (
                filteredInvoices.slice().reverse().map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* Fecha y Nº Factura */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-xs">{inv.invoiceNumber}</p>
                          <p className="text-[11px] text-slate-400 font-medium">{inv.date}</p>
                        </div>
                      </div>
                    </td>

                    {/* Proveedor */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={14} className="text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-900">{inv.supplier}</span>
                      </div>
                      {inv.registeredBy && (
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Por {inv.registeredBy}</p>
                      )}
                    </td>

                    {/* Insumos Comprados (Resumen) */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold">
                          <Boxes size={11} /> {inv.items.length} {inv.items.length === 1 ? 'producto' : 'productos'}
                        </span>
                        <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                          {inv.items.map(it => `${it.quantity}x ${it.itemName}`).join(', ')}
                        </p>
                      </div>
                    </td>

                    {/* Forma de Pago */}
                    <td className="py-4 px-4 text-center">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-xl text-[11px] font-bold">
                        {inv.paymentMethod || 'Efectivo'}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="py-4 px-4 text-center">
                      {inv.paymentStatus === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-[10px] font-black uppercase tracking-wider">
                          <Clock size={11} /> Pendiente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] font-black uppercase tracking-wider">
                          <CheckCircle2 size={11} /> Pagada
                        </span>
                      )}
                    </td>

                    {/* Total Factura */}
                    <td className="py-4 px-4 text-right">
                      <p className="font-black text-slate-900 text-sm">
                        ${inv.totalAmount.toLocaleString('es-AR')}
                      </p>
                    </td>

                    {/* Acciones */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.receiptUrl && (
                          <button
                            onClick={() => setShowImagePreview(inv.receiptUrl!)}
                            className="p-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 transition-colors"
                            title="Ver foto del comprobante"
                          >
                            <Paperclip size={14} />
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedInvoiceForDetail(inv)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                          title="Ver detalle completo"
                        >
                          <Eye size={13} />
                          <span>Ver</span>
                        </button>

                        {onDeleteInvoice && (
                          <button
                            onClick={() => setDeleteConfirmInvoice(inv)}
                            className="p-2 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                            title="Eliminar factura"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL: CARGAR NUEVA FACTURA DE COMPRA */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[600] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 my-auto">
            
            {/* Header Modal */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-primary-400 font-bold">
                  <Receipt size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black">Cargar Factura de Compra</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Suma automáticamente los productos al stock del inventario
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSaveInvoice} className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Sección 1: Datos del Comprobante */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-3xl border border-slate-200/80 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileText size={14} className="text-primary-600" /> 1. Datos del Comprobante
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 ml-1">
                      Nº Factura / Ticket *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: A-0001-00045120"
                      value={formInvoiceNumber}
                      onChange={(e) => setFormInvoiceNumber(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 ml-1">
                      Proveedor / Razón Social *
                    </label>
                    <input
                      type="text"
                      required
                      list="suppliers-datalist"
                      placeholder="Ej: Química Central SRL"
                      value={formSupplier}
                      onChange={(e) => setFormSupplier(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                    <datalist id="suppliers-datalist">
                      {previousSuppliers.map(s => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 ml-1">
                      Fecha de Factura / Compra *
                    </label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 ml-1">
                      Condición / Forma de Pago
                    </label>
                    <select
                      value={formPaymentMethod}
                      onChange={(e: any) => setFormPaymentMethod(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    >
                      <option value="Transferencia">Transferencia</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                      <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                      <option value="Cuenta Corriente">Cuenta Corriente</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 ml-1">
                      Estado de Pago
                    </label>
                    <select
                      value={formPaymentStatus}
                      onChange={(e: any) => setFormPaymentStatus(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    >
                      <option value="PAID">Pagada (Cancelada)</option>
                      <option value="PENDING">Pendiente de Pago</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 ml-1">
                      Adjuntar Foto / Factura
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 cursor-pointer bg-white border border-dashed border-slate-300 hover:border-primary-500 rounded-2xl px-3 py-2 text-xs font-bold text-slate-600 flex items-center justify-center gap-1.5 transition-colors">
                        <Paperclip size={13} className="text-primary-600" />
                        <span className="truncate">{formReceiptUrl ? 'Foto Adjunta ✓' : 'Subir archivo'}</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleReceiptUpload}
                          className="hidden"
                        />
                      </label>
                      {formReceiptUrl && (
                        <button
                          type="button"
                          onClick={() => setFormReceiptUrl('')}
                          className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                          title="Quitar foto adjunta"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección 2: Buscador e Ingreso de Productos a la Factura */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-3xl border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Boxes size={14} className="text-primary-600" /> 2. Buscar y Agregar Insumos
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400">
                    {addedItems.length} {addedItems.length === 1 ? 'ítem en lista' : 'ítems en lista'}
                  </span>
                </div>

                {/* 2.1 Buscador Autocomplete y Selector */}
                <div className="relative">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 ml-1">
                    Buscar Producto en Inventario por Nombre
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Escribe el nombre del producto o insumo (ej: Alcohol, Guantes, Toallas...)"
                      value={productSearch}
                      onFocus={() => setIsDropdownOpen(true)}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (matchingProducts.length > 0 && !selectedInventoryItem) {
                            handleSelectProduct(matchingProducts[0]);
                          } else if (productSearch.trim() && !selectedInventoryItem) {
                            handleStartNewProduct();
                          }
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-10 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-slate-400 placeholder:font-normal"
                    />
                    {productSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setProductSearch('');
                          setSelectedInventoryItem(null);
                          setIsNewProductMode(false);
                          setIsDropdownOpen(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Dropdown flotante de sugerencias */}
                  {isDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-60 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
                      {matchingProducts.length > 0 ? (
                        matchingProducts.map(item => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectProduct(item)}
                            className="w-full text-left px-4 py-3 hover:bg-primary-50/60 flex items-center justify-between gap-2 transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                              <span className="inline-block text-[10px] font-medium text-slate-400 mt-0.5">
                                Categoría: {item.category || 'General'}
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold">
                                Stock actual: {item.currentStock} {item.unit || 'unid'}
                              </span>
                              {item.lastPurchaseCost ? (
                                <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
                                  Último: ${item.lastPurchaseCost.toLocaleString('es-AR')}
                                </p>
                              ) : null}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-3.5 text-center text-xs text-slate-500">
                          No se encontró ningún producto con ese nombre.
                        </div>
                      )}

                      {/* Opción para crear nuevo producto */}
                      <button
                        type="button"
                        onClick={handleStartNewProduct}
                        className="w-full text-left px-4 py-3 bg-primary-50/80 hover:bg-primary-100 text-primary-700 flex items-center gap-2 transition-colors font-bold text-xs"
                      >
                        <PackagePlus size={16} />
                        <span>
                          {productSearch.trim() 
                            ? `+ Crear nuevo producto: "${productSearch.trim()}"`
                            : '+ Crear producto nuevo que no está en la lista...'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 2.2 Panel de Producto Seleccionado con Campo Cantidad a la derecha y tecla Enter */}
                {(selectedInventoryItem || isNewProductMode) && (
                  <div className="p-4 bg-white border-2 border-primary-300 rounded-2xl space-y-3 animate-in fade-in duration-200 shadow-sm">
                    
                    {/* Si es nuevo producto: campos de nombre, categoría y unidad */}
                    {isNewProductMode && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pb-2 border-b border-slate-100">
                        <div>
                          <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Nombre del nuevo producto *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej: Guantes de Látex M"
                            value={newProductName}
                            onChange={(e) => setNewProductName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Categoría</label>
                          <select
                            value={newProductCategory}
                            onChange={(e) => setNewProductCategory(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                          >
                            <option value="Limpieza">Limpieza</option>
                            <option value="Descartables">Descartables</option>
                            <option value="Kinesiología">Kinesiología</option>
                            <option value="General">General</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Unidad de Medida</label>
                          <input
                            type="text"
                            placeholder="Unidades, Cajas, Rollos..."
                            value={newProductUnit}
                            onChange={(e) => setNewProductUnit(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Fila Principal: Producto a la izquierda | Precio | Cantidad (con foco y Enter) | Botón */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      
                      {/* Producto Seleccionado */}
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-black uppercase text-primary-600 tracking-wider block">
                          {isNewProductMode ? '★ Nuevo Producto' : '✓ Producto Seleccionado'}
                        </span>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <h5 className="text-sm font-black text-slate-900 truncate">
                            {isNewProductMode ? (newProductName || 'Nuevo Producto') : selectedInventoryItem?.name}
                          </h5>
                          {!isNewProductMode && selectedInventoryItem && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md">
                              Stock actual: {selectedInventoryItem.currentStock} {selectedInventoryItem.unit}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedInventoryItem(null);
                              setIsNewProductMode(false);
                              setProductSearch('');
                              setTimeout(() => searchInputRef.current?.focus(), 50);
                            }}
                            className="text-slate-400 hover:text-slate-600 text-[11px] font-bold underline ml-1 transition-colors"
                          >
                            Cambiar
                          </button>
                        </div>
                      </div>

                      {/* Controles de Entrada a la Derecha */}
                      <div className="flex items-end gap-2.5 flex-wrap sm:flex-nowrap">
                        
                        {/* Precio / Costo Unitario */}
                        <div className="w-28 sm:w-32 space-y-1">
                          <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">
                            Costo Unit ($)
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                            <input
                              ref={costInputRef}
                              type="number"
                              inputMode="decimal"
                              min="0"
                              step="any"
                              value={inputUnitCost}
                              onChange={(e) => setInputUnitCost(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  quantityInputRef.current?.focus();
                                  quantityInputRef.current?.select();
                                }
                              }}
                              placeholder="0"
                              className="w-full bg-slate-50 border-2 border-slate-200 focus:border-primary-500 rounded-xl pl-7 pr-2.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            />
                          </div>
                        </div>

                        {/* Campo Cantidad (Abre teclado numérico en móvil y agrega al presionar Enter) */}
                        <div className="w-32 sm:w-32 space-y-1">
                          <label className="block text-[10px] font-black uppercase text-primary-700 tracking-wider">
                            Cantidad *
                          </label>
                          <input
                            ref={quantityInputRef}
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            step="any"
                            required
                            placeholder="Ej: 5"
                            value={inputQuantity}
                            onChange={(e) => setInputQuantity(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddItemToInvoice();
                              }
                            }}
                            className="w-full bg-primary-50/40 border-2 border-primary-500 rounded-xl px-3 py-2.5 text-sm font-black text-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-primary-500/30 placeholder:text-slate-400"
                          />
                        </div>

                        {/* Botón Agregar a la Factura (o Enter) */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-black uppercase text-transparent tracking-wider">
                            Acción
                          </label>
                          <button
                            type="button"
                            onClick={handleAddItemToInvoice}
                            className="h-[42px] px-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-primary-600/25 transition-all active:scale-95 whitespace-nowrap"
                            title="Presiona Enter o haz clic para agregar"
                          >
                            <Plus size={15} />
                            <span>Agregar</span>
                            <CornerDownLeft size={13} className="opacity-80 hidden sm:inline" />
                          </button>
                        </div>

                      </div>

                    </div>

                    {/* Previsualización del cálculo */}
                    {inputQuantity && (
                      <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 pt-1 border-t border-slate-100">
                        <span>
                          Subtotal: <strong className="text-slate-900 font-bold">${((parseFloat(inputQuantity) || 0) * (parseFloat(inputUnitCost) || 0)).toLocaleString('es-AR')}</strong>
                        </span>
                        {!isNewProductMode && selectedInventoryItem && (
                          <span className="text-teal-700 font-bold">
                            Nuevo stock: {(selectedInventoryItem.currentStock || 0) + (parseFloat(inputQuantity) || 0)} {selectedInventoryItem.unit}
                          </span>
                        )}
                      </div>
                    )}

                  </div>
                )}

                {/* 2.3 Lista Dinámica de Productos Cargados en la Factura */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Productos cargados en esta factura ({addedItems.length})
                    </span>
                    {addedItems.length > 0 && (
                      <span className="text-[11px] font-black text-primary-700">
                        Total acumulado: ${calculatedTotal.toLocaleString('es-AR')}
                      </span>
                    )}
                  </div>

                  {addedItems.length === 0 ? (
                    <div className="p-6 bg-white border border-dashed border-slate-200 rounded-2xl text-center space-y-1.5">
                      <Boxes size={28} className="mx-auto text-slate-300" />
                      <p className="text-xs font-bold text-slate-700">La lista de la factura está vacía</p>
                      <p className="text-[11px] text-slate-400 font-medium">
                        Selecciona un producto arriba, escribe la cantidad y presiona Enter para sumarlo a la lista.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                      {addedItems.map((item, idx) => {
                        const invItem = inventory.find(i => i.id === item.itemId);
                        const currentStock = invItem ? invItem.currentStock : 0;
                        const newStock = currentStock + item.quantity;

                        return (
                          <div key={idx} className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                            
                            {/* Información del Producto */}
                            <div className="space-y-0.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <h6 className="text-xs font-black text-slate-900 truncate">{item.itemName}</h6>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                  {item.category}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium pl-7">
                                <span>Precio: ${item.unitCost.toLocaleString('es-AR')} c/u</span>
                                <span>•</span>
                                <span className="text-teal-700 font-bold">
                                  Stock: {currentStock} → {newStock} {item.unit}
                                </span>
                              </div>
                            </div>

                            {/* Cantidad, Subtotal y Eliminar */}
                            <div className="flex items-center gap-4 shrink-0">
                              
                              {/* Cantidad cargada */}
                              <div className="text-right">
                                <span className="text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-xl">
                                  {item.quantity} {item.unit || 'unid'}
                                </span>
                              </div>

                              {/* Subtotal */}
                              <div className="text-right min-w-[4.5rem]">
                                <span className="text-xs font-black text-slate-900">
                                  ${item.totalCost.toLocaleString('es-AR')}
                                </span>
                              </div>

                              {/* Botón Eliminar de la Lista */}
                              <button
                                type="button"
                                onClick={() => handleRemoveAddedItem(idx)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                title="Quitar de la lista"
                              >
                                <Trash2 size={14} />
                              </button>

                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* Observaciones Opcionales */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 ml-1">
                  Notas / Observaciones (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Pedido mensual de insumos de limpieza y reposición"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              {/* Total y Banner de Alerta Informativo */}
              <div className="bg-primary-50/70 border border-primary-200/80 p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-primary-950">Actualización automática de Stock</p>
                    <p className="text-[11px] text-primary-800 font-medium">
                      Al guardar, se incrementará el stock disponible y quedará registrado en el historial.
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary-700">Total de la Factura</span>
                  <p className="text-2xl font-black text-primary-950">
                    ${calculatedTotal.toLocaleString('es-AR')}
                  </p>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider bg-primary-600 hover:bg-primary-500 text-white shadow-md shadow-primary-600/30 transition-all active:scale-95 flex items-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  <span>Guardar Factura e Incrementar Stock</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: DETALLE DE FACTURA */}
      {selectedInvoiceForDetail && (
        <div className="fixed inset-0 z-[600] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-teal-400 font-bold">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black">Factura {selectedInvoiceForDetail.invoiceNumber}</h3>
                  <p className="text-xs text-slate-400 font-medium">{selectedInvoiceForDetail.supplier}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedInvoiceForDetail(null)}
                className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Información General */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400">Fecha</span>
                  <p className="font-bold text-slate-900">{selectedInvoiceForDetail.date}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400">Forma de Pago</span>
                  <p className="font-bold text-slate-900">{selectedInvoiceForDetail.paymentMethod || 'Efectivo'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400">Estado</span>
                  <p className="font-bold text-emerald-600">
                    {selectedInvoiceForDetail.paymentStatus === 'PENDING' ? 'Pendiente' : 'Pagada'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400">Registrado Por</span>
                  <p className="font-bold text-slate-900">{selectedInvoiceForDetail.registeredBy || 'Recepción'}</p>
                </div>
              </div>

              {/* Desglose de Ítems */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Insumos y Productos Facturados</h4>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                  {selectedInvoiceForDetail.items.map((it, i) => (
                    <div key={i} className="p-3.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-black text-slate-900">{it.itemName}</p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {it.quantity} {it.unit || 'unidades'} • ${it.unitCost.toLocaleString('es-AR')} c/u
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-900 text-sm">
                          ${it.totalCost.toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total y Comprobante Adjunto */}
              <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Abonado</span>
                  <p className="text-2xl font-black">${selectedInvoiceForDetail.totalAmount.toLocaleString('es-AR')}</p>
                </div>

                {selectedInvoiceForDetail.receiptUrl && (
                  <button
                    onClick={() => setShowImagePreview(selectedInvoiceForDetail.receiptUrl!)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Paperclip size={14} /> Ver Comprobante Adjunto
                  </button>
                )}
              </div>

              {selectedInvoiceForDetail.notes && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Notas:</span>
                  <p className="text-slate-700 font-medium">{selectedInvoiceForDetail.notes}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedInvoiceForDetail(null)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL PREVIEW DE FOTO COMPROBANTE */}
      {showImagePreview && (
        <div className="fixed inset-0 z-[700] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-2xl max-h-[85vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold">Comprobante de Factura</span>
              <button
                onClick={() => setShowImagePreview(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[75vh] flex items-center justify-center bg-slate-100">
              <img
                src={showImagePreview}
                alt="Comprobante Factura"
                className="max-h-[70vh] object-contain rounded-xl shadow-md"
              />
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL CONFIRMACIÓN DE ELIMINACIÓN */}
      {deleteConfirmInvoice && onDeleteInvoice && (
        <div className="fixed inset-0 z-[650] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-[2rem] p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertCircle size={26} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">¿Eliminar Factura {deleteConfirmInvoice.invoiceNumber}?</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Proveedor: <strong>{deleteConfirmInvoice.supplier}</strong> (${deleteConfirmInvoice.totalAmount.toLocaleString('es-AR')})
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={() => {
                  onDeleteInvoice(deleteConfirmInvoice.id, true);
                  setDeleteConfirmInvoice(null);
                  setSelectedInvoiceForDetail(null);
                }}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md shadow-red-600/20 transition-all"
              >
                Eliminar y Descontar Insumos del Stock
              </button>
              <button
                onClick={() => {
                  onDeleteInvoice(deleteConfirmInvoice.id, false);
                  setDeleteConfirmInvoice(null);
                  setSelectedInvoiceForDetail(null);
                }}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors"
              >
                Eliminar solo registro (Mantener Stock Actual)
              </button>
              <button
                onClick={() => setDeleteConfirmInvoice(null)}
                className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
