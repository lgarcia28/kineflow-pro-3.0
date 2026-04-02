import React, { useState } from 'react';
import { Patient, PlanType, CheckInStatus, Product, RoutineDay, Appointment } from '../types';
import { 
  UserPlus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Package, 
  Plus,
  ShoppingBag,
  User,
  Clock,
  ChevronRight,
  Settings2,
  Trash2,
  X,
  Moon,
  CalendarDays
} from 'lucide-react';
import { TurnoCalendar } from './TurnoCalendar';

interface RecepcionViewProps {
  patients: Patient[];
  onAddPatient: (patient: Patient) => void;
  onUpdatePatient: (patient: Patient) => void;
  onDeletePatient: (id: string) => void;
  onClearWaitingRoom: () => void;
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  appointments: Appointment[];
  onAddAppointment: (app: Appointment) => void;
  onUpdateAppointment: (app: Appointment) => void;
  onDeleteAppointment: (id: string) => void;
}

export const RecepcionView: React.FC<RecepcionViewProps> = ({ 
  patients, 
  onAddPatient, 
  onUpdatePatient,
  onDeletePatient,
  onClearWaitingRoom,
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  appointments,
  onAddAppointment,
  onUpdateAppointment,
  onDeleteAppointment
}) => {
  const [activeTab, setActiveTab] = useState<'PATIENTS' | 'SHOP' | 'CALENDAR'>('PATIENTS');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states for patient
  const [patientForm, setPatientForm] = useState<Partial<Patient>>({
    firstName: '',
    lastName: '',
    dni: '',
    condition: '',
    injuryDate: new Date().toISOString().split('T')[0],
    surgeryDate: '',
    sessionsPerWeek: 3,
    planType: PlanType.SESSIONS,
    totalSessionsPaid: 12,
    remainingSessions: 12,
    paymentDate: new Date().toISOString().split('T')[0],
    expirationDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    hasHomePlan: false,
    checkInStatus: CheckInStatus.IDLE,
    photoUrl: 'https://picsum.photos/200/200',
    lastVisit: '',
    history: [],
    routine: { id: Math.random().toString(), stage: 0 as any, currentWeek: 1, days: [] },
    homeRoutine: { id: Math.random().toString(), stage: 0 as any, currentWeek: 1, days: [] }
  });

  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    imageUrl: 'https://picsum.photos/seed/product/400/400',
    category: 'Suplementos',
    type: 'PRODUCT'
  });

  const resetForm = () => {
    setError(null);
    setPatientForm({
      firstName: '',
      lastName: '',
      dni: '',
      condition: '',
      injuryDate: new Date().toISOString().split('T')[0],
      surgeryDate: '',
      sessionsPerWeek: 3,
      planType: PlanType.SESSIONS,
      totalSessionsPaid: 12,
      remainingSessions: 12,
      paymentDate: new Date().toISOString().split('T')[0],
      expirationDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      hasHomePlan: false,
      checkInStatus: CheckInStatus.IDLE,
      photoUrl: 'https://picsum.photos/200/200',
      lastVisit: '',
      history: [],
      routine: { id: Math.random().toString(), stage: 0 as any, currentWeek: 1, days: [] },
      homeRoutine: { id: Math.random().toString(), stage: 0 as any, currentWeek: 1, days: [] }
    });
    setEditingPatient(null);
  };

  const handleEditPatient = (patient: Patient) => {
    setPatientForm(patient);
    setEditingPatient(patient);
    setShowAddModal(true);
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: 0,
      imageUrl: 'https://picsum.photos/seed/product/400/400',
      category: 'Suplementos',
      type: 'PRODUCT'
    });
    setEditingProduct(null);
  };

  const handleEditProduct = (product: Product) => {
    setProductForm(product);
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        ...productForm as Product
      });
    } else {
      const newProduct: Product = {
        ...productForm as Product,
        id: `prod_${Date.now()}`
      };
      onAddProduct(newProduct);
    }
    setShowProductModal(false);
    resetProductForm();
  };

  const handlePatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for duplicate DNI
    const duplicate = patients.find((p: Patient) => p.dni === patientForm.dni && (!editingPatient || p.id !== editingPatient.id));
    if (duplicate) {
      setError(`Ya existe un paciente con el DNI ${patientForm.dni} (${duplicate.firstName} ${duplicate.lastName})`);
      return;
    }

    if (editingPatient) {
      onUpdatePatient({
        ...editingPatient,
        ...patientForm as Patient
      });
    } else {
      // Initialize routine days based on sessionsPerWeek
      const days: RoutineDay[] = [];
      const numDays = patientForm.sessionsPerWeek || 3;
      for (let i = 1; i <= numDays; i++) {
        days.push({ id: `day-${Date.now()}-${i}`, name: `Día ${i}`, exercises: [] });
      }

      const patient: Patient = {
        ...patientForm as Patient,
        id: `p_${Date.now()}`,
        lastVisit: new Date().toISOString().split('T')[0],
        routine: {
          id: `r_${Date.now()}`,
          stage: 0 as any,
          currentWeek: 1,
          days: days
        },
        homeRoutine: {
          id: `hr_${Date.now()}`,
          stage: 0 as any,
          currentWeek: 1,
          days: [{ id: `hday-${Date.now()}`, name: 'Rutina Casa', exercises: [] }]
        }
      };
      onAddPatient(patient);
    }
    
    setShowAddModal(false);
    resetForm();
  };

  const handleCheckIn = (patient: Patient) => {
    let updatedPatient = { ...patient };
    
    // Si es por sesiones, descontamos una
    if (patient.planType === PlanType.SESSIONS && (patient.remainingSessions ?? 0) > 0) {
      updatedPatient.remainingSessions = (patient.remainingSessions ?? 0) - 1;
    }
    
    // Cambiamos estado a "En Sala"
    updatedPatient.checkInStatus = CheckInStatus.IN_ROOM;
    updatedPatient.lastVisit = new Date().toISOString().split('T')[0];
    
    onUpdatePatient(updatedPatient);

    // Marcar turno de hoy como completado si existe
    const today = new Date().toISOString().split('T')[0];
    const todayApp = appointments.find((a: Appointment) => a.patientId === patient.id && a.date === today && a.status === 'SCHEDULED');
    if (todayApp) {
      onUpdateAppointment({ ...todayApp, status: 'COMPLETED' });
    }
  };

  const handleCheckOut = (patient: Patient) => {
    if (window.confirm(`¿Finalizar sesión de ${patient.firstName} ${patient.lastName}?`)) {
      onUpdatePatient({ ...patient, checkInStatus: CheckInStatus.ATTENDED });
    }
  };

  const getPlanStatus = (patient: Patient) => {
    const today = new Date();
    const expiration = new Date(patient.expirationDate);
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (patient.planType === PlanType.SESSIONS) {
      const remaining = patient.remainingSessions || 0;
      if (remaining <= 0) return { label: 'Vencido (0 ses.)', color: 'bg-red-500', text: 'text-red-500' };
      if (remaining <= 3) return { label: `${remaining} ses. restantes`, color: 'bg-orange-500', text: 'text-orange-500' };
      return { label: `${remaining} ses. restantes`, color: 'bg-emerald-500', text: 'text-emerald-500' };
    } else {
      if (diffDays <= 0) return { label: 'Vencido', color: 'bg-red-500', text: 'text-red-500' };
      if (diffDays <= 7) return { label: `Vence en ${diffDays} días`, color: 'bg-orange-500', text: 'text-orange-500' };
      return { label: `Vigente (${diffDays} días)`, color: 'bg-emerald-500', text: 'text-emerald-500' };
    }
  };

  const filteredPatients = patients.filter((p: Patient) => 
    `${p.firstName} ${p.lastName} ${p.dni}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 h-full bg-slate-50/50 overflow-hidden flex flex-col relative w-full">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary-100 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 z-0 pointer-events-none"></div>

      {/* Header */}
      <header className="glass-panel z-10 px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 border-b border-slate-200/50">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">Recepción <span className="text-primary-500">•</span></h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Gestión de Ingresos y Administración</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => {
              if (window.confirm('¿Desea finalizar la jornada? Se vaciará la sala de espera y se resetearán los estados de todos los pacientes.')) {
                onClearWaitingRoom();
              }
            }}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20 active:scale-95 transition-all flex items-center gap-2 mr-2 md:mr-4 border border-slate-700"
          >
            <Moon size={16} /> Finalizar Jornada
          </button>
          
          <div className="flex bg-slate-100/80 backdrop-blur-md p-1 rounded-2xl shadow-inner border border-slate-200/50">
            <button 
              onClick={() => setActiveTab('PATIENTS')}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'PATIENTS' ? 'bg-white text-primary-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <User size={16} /> Pacientes
            </button>
            <button 
              onClick={() => setActiveTab('CALENDAR')}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'CALENDAR' ? 'bg-white text-primary-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <CalendarDays size={16} /> Turnos
            </button>
            <button 
              onClick={() => setActiveTab('SHOP')}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'SHOP' ? 'bg-white text-primary-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ShoppingBag size={16} /> Tienda
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-container relative z-10">
        {activeTab === 'PATIENTS' ? (
          <div className="max-w-5xl mx-auto space-y-8 animate-slide-up">
            {/* Search and Add */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                   <Search className="text-slate-400 w-5 h-5 group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input 
                  type="text" 
                  placeholder="Buscar pacientes por nombre, apellido o DNI..."
                  value={searchTerm}
                  onChange={(e: any) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-[1.5rem] py-4 pl-12 pr-4 shadow-sm text-slate-900 font-medium focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm md:text-base"
                />
              </div>
              <button 
                onClick={() => { resetForm(); setShowAddModal(true); }}
                className="bg-primary-600 text-white px-8 py-4 rounded-[1.5rem] font-bold shadow-xl shadow-primary-500/20 flex items-center justify-center gap-2 hover:bg-primary-700 hover:-translate-y-0.5 active:scale-95 transition-all w-full md:w-auto shrink-0"
              >
                <UserPlus size={20} strokeWidth={2.5} /> Nuevo Ingreso
              </button>
            </div>

            {/* Patient List */}
            <div className="grid grid-cols-1 gap-4">
              {filteredPatients.length === 0 ? (
                <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-[2rem] border border-slate-200/50 border-dashed">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="text-slate-400" size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">No hay pacientes</h3>
                  <p className="text-slate-500 mt-1">Busque otro término o cree un nuevo ingreso.</p>
                </div>
              ) : (
                filteredPatients.map((patient, index) => {
                  const status = getPlanStatus(patient);
                  return (
                    <div 
                      key={patient.id} 
                      className="glass-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Patient Info */}
                      <div className="flex items-center gap-5 flex-1 w-full cursor-pointer group" onClick={() => handleEditPatient(patient)}>
                        <div className="relative shrink-0">
                           <div className="absolute inset-0 bg-primary-100 rounded-2xl transform rotate-3 group-hover:rotate-6 transition-transform"></div>
                           <img src={patient.photoUrl} alt="" className="w-16 h-16 rounded-2xl object-cover relative z-10 shadow-sm border border-slate-100" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-primary-600 transition-colors">{patient.firstName} {patient.lastName}</h3>
                            <button className="text-slate-300 hover:text-slate-900 transition-colors p-1 bg-slate-50 rounded-lg opacity-0 md:group-hover:opacity-100"><Settings2 size={14} /></button>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md">DNI: {patient.dni}</span>
                            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[150px] md:max-w-xs">{patient.condition}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${status.color}`}></span>
                            <span className={`text-[11px] font-black uppercase tracking-wider ${status.text}`}>{status.label}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto border-t md:border-none border-slate-100 pt-4 md:pt-0">
                        <div className="text-left md:text-right px-2">
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Vencimiento</p>
                          <p className="text-sm font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 inline-block">{patient.expirationDate}</p>
                        </div>
                        
                        {patient.checkInStatus === CheckInStatus.IDLE ? (
                          <button 
                            onClick={() => handleCheckIn(patient)}
                            className="w-full md:w-auto px-6 py-3.5 rounded-[1.25rem] font-bold text-sm flex items-center justify-center gap-2 transition-all bg-emerald-500 text-white hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 hover:-translate-y-0.5 active:scale-95"
                          >
                            <CheckCircle2 size={20} strokeWidth={2.5} /> Dar Presente
                          </button>
                        ) : patient.checkInStatus === CheckInStatus.IN_ROOM ? (
                          <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="flex-1 md:flex-none px-4 py-3.5 rounded-[1.25rem] font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 shadow-inner border border-amber-200/50">
                              <Clock size={18} className="animate-pulse" /> En Sala
                            </div>
                            <button 
                              onClick={() => handleCheckOut(patient)}
                              className="px-4 py-3.5 rounded-[1.25rem] font-bold text-sm flex items-center justify-center bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 shadow-sm transition-all active:scale-95"
                              title="Finalizar Sesión"
                            >
                              <X size={20} strokeWidth={2.5} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="flex-1 md:flex-none px-4 py-3.5 rounded-[1.25rem] font-bold text-sm flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-100">
                              <CheckCircle2 size={18} /> Atendido
                            </div>
                            <button 
                              onClick={() => onUpdatePatient({ ...patient, checkInStatus: CheckInStatus.IDLE })}
                              className="p-3.5 rounded-[1.25rem] bg-white border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all shadow-sm active:scale-95"
                              title="Resetear para nuevo ingreso"
                            >
                              <Settings2 size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : activeTab === 'CALENDAR' ? (
          <div className="h-full max-w-6xl mx-auto animate-fade-in">
            <TurnoCalendar 
              patients={patients}
              appointments={appointments}
              onAddAppointment={onAddAppointment}
              onUpdateAppointment={onUpdateAppointment}
              onDeleteAppointment={onDeleteAppointment}
              onUpdatePatient={onUpdatePatient}
            />
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-8 animate-slide-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                 <h2 className="text-2xl font-black text-slate-900">Catálogo de Tienda</h2>
                 <p className="text-sm font-medium text-slate-500">Administre servicios y productos a la venta</p>
              </div>
              <button 
                onClick={() => setShowProductModal(true)}
                className="bg-primary-600 text-white px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-primary-500/20 hover:bg-primary-700 hover:-translate-y-0.5 transition-all w-full md:w-auto justify-center"
              >
                <Plus size={20} strokeWidth={2.5} /> Nuevo Item
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product: Product) => (
                <div key={product.id} className="glass-card overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                    
                    {/* Tags overlay */}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${product.type === 'SERVICE' ? 'text-indigo-600' : 'text-teal-600'}`}>
                        {product.type === 'SERVICE' ? 'Servicio' : 'Producto'}
                      </span>
                    </div>
                    
                    <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-lg">
                      <p className="text-sm font-black text-white">${product.price}</p>
                    </div>

                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 backdrop-blur-sm">
                      <button 
                        onClick={() => handleEditProduct(product)}
                        className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-900 hover:scale-110 transition-all transform translate-y-8 group-hover:translate-y-0 duration-300 shadow-xl"
                      >
                        <Settings2 size={20} />
                      </button>
                      <button 
                        onClick={() => { if(window.confirm('¿Eliminar producto/servicio permanentemente?')) onDeleteProduct(product.id); }}
                        className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 hover:scale-110 transition-all transform translate-y-8 group-hover:translate-y-0 duration-300 delay-50 shadow-xl shadow-red-500/30"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{product.category}</span>
                    </div>
                    <h4 className="text-lg font-black text-slate-900 mb-2 leading-tight">{product.name}</h4>
                    <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed">{product.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modern Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
            <div className="p-6 sm:p-8 flex-shrink-0 border-b border-slate-100 flex justify-between items-center bg-white">
              <div>
                 <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{editingPatient ? 'Editar Perfil' : 'Nuevo Ingreso'}</h2>
                 <p className="text-slate-500 font-medium text-sm mt-1">Complete los datos clínicos correspondientes.</p>
              </div>
              <button onClick={() => { setShowAddModal(false); setEditingPatient(null); setError(null); }} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 scroll-container relative">
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600 animate-slide-up shadow-sm">
                    <AlertCircle size={20} className="shrink-0" />
                    <p className="text-sm font-bold">{error}</p>
                  </div>
                )}

                <form id="patient-form" onSubmit={handlePatientSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre</label>
                    <input 
                      placeholder="Nombre del paciente" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                      value={patientForm.firstName}
                      onChange={e => setPatientForm({...patientForm, firstName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Apellido</label>
                    <input 
                      placeholder="Apellido del paciente" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                      value={patientForm.lastName}
                      onChange={e => setPatientForm({...patientForm, lastName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Documento (DNI)</label>
                    <input 
                      placeholder="Número de DNI" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                      value={patientForm.dni}
                      onChange={e => setPatientForm({...patientForm, dni: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Diagnóstico / Condición</label>
                    <input 
                      placeholder="Ej: Post-op LCA" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                      value={patientForm.condition}
                      onChange={e => setPatientForm({...patientForm, condition: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="col-span-full h-px bg-slate-100 my-2"></div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Fecha de Lesión</label>
                    <input 
                      type="date"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                      value={patientForm.injuryDate}
                      onChange={e => setPatientForm({...patientForm, injuryDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Fecha de Cirugía <span className="normal-case font-medium opacity-50">(opc.)</span></label>
                    <input 
                      type="date"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                      value={patientForm.surgeryDate}
                      onChange={e => setPatientForm({...patientForm, surgeryDate: e.target.value})}
                    />
                  </div>
                  
                  <div className="col-span-full h-px bg-slate-100 my-2"></div>

                  <div className="col-span-full">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-3 block">Estilo de Planificación</label>
                    <div className="flex bg-slate-100 p-1 rounded-2xl">
                      <button 
                        type="button"
                        onClick={() => setPatientForm({...patientForm, planType: PlanType.SESSIONS})}
                        className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm ${patientForm.planType === PlanType.SESSIONS ? 'bg-white text-primary-600 ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Paquete de Sesiones
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          const oneMonthLater = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
                          setPatientForm({
                            ...patientForm, 
                            planType: PlanType.TIME,
                            expirationDate: oneMonthLater,
                            totalSessionsPaid: 0,
                            remainingSessions: 0
                          });
                        }}
                        className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm ${patientForm.planType === PlanType.TIME ? 'bg-white text-primary-600 ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Plan Mensual (Tiempo)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Frecuencia (Semanal)</label>
                    <input 
                      type="number"
                      min="1" max="7"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                      value={patientForm.sessionsPerWeek}
                      onChange={e => setPatientForm({...patientForm, sessionsPerWeek: Number(e.target.value)})}
                    />
                  </div>

                  {patientForm.planType === PlanType.SESSIONS && (
                    <div className="space-y-1.5 animate-fade-in">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Cant. Sesiones (Abonadas)</label>
                      <input 
                        type="number"
                        min="1"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                        value={patientForm.totalSessionsPaid}
                        onChange={e => setPatientForm({...patientForm, totalSessionsPaid: Number(e.target.value), remainingSessions: Number(e.target.value)})}
                      />
                    </div>
                  )}

                  <div className="col-span-full">
                     <label className="cursor-pointer flex items-center gap-4 p-5 bg-indigo-50 border border-indigo-100 rounded-[1.5rem] hover:bg-indigo-100/50 transition-colors">
                      <div className="relative flex items-center">
                        <input 
                          type="checkbox"
                          checked={patientForm.hasHomePlan}
                          onChange={e => setPatientForm({...patientForm, hasHomePlan: e.target.checked})}
                          className="peer sr-only"
                        />
                        <div className="w-12 h-6 bg-slate-300 rounded-full peer-checked:bg-primary-500 transition-colors shadow-inner"></div>
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-6 shadow-sm"></div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Activar "Plan para Casa"</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Permite asignar rutinas extra-consultorio visibles para el paciente.</p>
                      </div>
                    </label>
                  </div>
                </form>
            </div>
            
            {/* Footer Modal */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0">
               {editingPatient ? (
                  <button 
                    type="button" 
                    onClick={() => { if(window.confirm('¿ELIMINAR PACIENTE DEFINITIVAMENTE? Esta acción destruirá todo su historial clínico. No se puede deshacer.')) { onDeletePatient(editingPatient.id); setShowAddModal(false); setEditingPatient(null); } }} 
                    className="w-full sm:w-auto text-red-500 font-bold py-3 px-5 hover:bg-red-100 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 order-2 sm:order-1"
                  >
                    <Trash2 size={18} /> Borrar Perfil
                  </button>
                ) : <div className="hidden sm:block"></div>}
                
                <button type="submit" form="patient-form" className="w-full sm:w-auto bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-slate-900/20 active:scale-95 transition-all order-1 sm:order-2 flex items-center justify-center gap-2">
                  <CheckCircle2 size={20} /> {editingPatient ? 'Guardar Cambios' : 'Ingresar Paciente'}
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in shadow-2xl">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-8 pb-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">{editingProduct ? 'Editar Ítem' : 'Añadir a Catálogo'}</h2>
              </div>
              <button onClick={() => { setShowProductModal(false); resetProductForm(); }} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleProductSubmit} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Clasificación</label>
                <div className="flex p-1 bg-slate-100 rounded-2xl shadow-inner border border-slate-200/50">
                  <button 
                    type="button"
                    onClick={() => setProductForm({...productForm, type: 'PRODUCT'})}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${productForm.type !== 'SERVICE' ? 'bg-white shadow-sm ring-1 ring-slate-200 text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Producto Físico
                  </button>
                  <button 
                    type="button"
                    onClick={() => setProductForm({...productForm, type: 'SERVICE'})}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${productForm.type === 'SERVICE' ? 'bg-white shadow-sm ring-1 ring-slate-200 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Servicio
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre</label>
                <input 
                  placeholder={productForm.type === 'SERVICE' ? "Ej: Sesión Drenaje Linfático" : "Ej: Banda Elástica Intensa"} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                  value={productForm.name}
                  onChange={e => setProductForm({...productForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Precio ($)</label>
                  <input 
                    type="number"
                    placeholder="0" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm text-lg"
                    value={productForm.price}
                    onChange={e => setProductForm({...productForm, price: Number(e.target.value)})}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Etiqueta</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                    value={productForm.category}
                    onChange={e => setProductForm({...productForm, category: e.target.value})}
                  >
                    <option value="Evaluaciones">Evaluaciones</option>
                    <option value="Suplementos">Suplementos</option>
                    <option value="Accesorios">Accesorios</option>
                    <option value="Indumentaria">Indumentaria</option>
                    <option value="Servicios">Servicios Cl.</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Descripción corta</label>
                <textarea 
                  placeholder="Detalles..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm h-24 resize-none leading-relaxed"
                  value={productForm.description}
                  onChange={e => setProductForm({...productForm, description: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-1.5 pb-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Foto URL (Render)</label>
                <input 
                  placeholder="https://..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-medium text-slate-600 text-xs focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                  value={productForm.imageUrl}
                  onChange={e => setProductForm({...productForm, imageUrl: e.target.value})}
                />
              </div>
              
              <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl shadow-slate-900/20 mt-2 hover:bg-black active:scale-95 transition-all text-lg flex items-center justify-center gap-2">
                <CheckCircle2 size={22} /> {editingProduct ? 'Aceptar Cambios' : 'Generar Ítem'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
