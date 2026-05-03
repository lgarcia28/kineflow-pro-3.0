import React, { useState } from 'react';
import { Patient, PlanType, CheckInStatus, Product, RoutineDay, Appointment, UserRole, StaffMember, Stage, TenantSettings } from '../types';
import { secondaryAuth, auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { generatePatientEmail } from '../utils/authUtils';
import { useAuthStore } from '../store/authStore';
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
  Users,
  Clock,
  ChevronRight,
  Settings2,
  LogOut,
  Moon,
  Trash2,
  CalendarDays,
  CreditCard,
  X
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
  staff: StaffMember[];
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
  staff,
  onAddAppointment,
  onUpdateAppointment,
  onDeleteAppointment
}) => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'PATIENTS' | 'SHOP' | 'CALENDAR'>('PATIENTS');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [schedulePromptPatient, setSchedulePromptPatient] = useState<Patient | null>(null);
  const [autoSchedulePatientId, setAutoSchedulePatientId] = useState<string | null>(null);
  const [formStage, setFormStage] = useState<Stage>(Stage.KINESIOLOGY);

  // Payment states
  const [paymentPatient, setPaymentPatient] = useState<Patient | null>(null);
  const [paymentTypeState, setPaymentTypeState] = useState<'SINGLE' | 'PACK' | 'MONTH'>('PACK');
  const [paymentValue, setPaymentValue] = useState<number>(10);
  const [tenantSettings, setTenantSettings] = useState<TenantSettings>({
    priceSingleSession: 10000,
    pricePack10: 80000,
    priceMonthly: 50000
  });

  React.useEffect(() => {
    const fetchSettings = async () => {
      if (!db || !user?.tenantId) return;
      try {
        const snap = await getDoc(doc(db, 'tenantSettings', user.tenantId));
        if (snap.exists()) {
          setTenantSettings(snap.data() as TenantSettings);
        }
      } catch (e) {
        console.error("Error fetching tenant settings:", e);
      }
    };
    fetchSettings();
  }, [user?.tenantId]);

  // Form states for patient
  const [patientForm, setPatientForm] = useState<Partial<Patient>>({
    firstName: '',
    lastName: '',
    dni: '',
    condition: '',
    injuryDate: new Date().toISOString().split('T')[0],
    surgeryDate: '',
    surgeryType: '',
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
      surgeryType: '',
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
    setFormStage(Stage.KINESIOLOGY);
    setEditingPatient(null);
  };

  const handleEditPatient = (patient: Patient) => {
    setPatientForm(patient);
    setEditingPatient(patient);
    setFormStage(patient.routine?.stage || Stage.KINESIOLOGY);
    setShowAddModal(true);
  };

  const markAppointmentStatus = (patient: Patient, app: Appointment, status: 'COMPLETED' | 'CANCELLED' | 'NOSHOW') => {
    onUpdateAppointment({ ...app, status });
    let updatedPatient = { ...patient };
    const today = new Date().toISOString().split('T')[0];
    
    if (status === 'COMPLETED') {
      if (patient.planType === PlanType.SESSIONS) {
        updatedPatient.remainingSessions = (patient.remainingSessions ?? 0) - 1;
      }
      updatedPatient.checkInStatus = CheckInStatus.IN_ROOM;
      updatedPatient.lastVisit = today;
      updatedPatient.history = [`Turno completado (${today})`, ...(patient.history || [])];
    } else if (status === 'NOSHOW') {
      if (patient.planType === PlanType.SESSIONS) {
        updatedPatient.remainingSessions = (patient.remainingSessions ?? 0) - 1;
        updatedPatient.history = [`Ausente sin aviso (${today}) - Sesión descontada`, ...(patient.history || [])];
      } else {
        updatedPatient.history = [`Ausente sin aviso (${today})`, ...(patient.history || [])];
      }
    } else if (status === 'CANCELLED') {
      updatedPatient.history = [`Ausente con aviso (${today})`, ...(patient.history || [])];
    }
    
    onUpdatePatient(updatedPatient);
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

  const handlePatientSubmit = async (e: React.FormEvent) => {
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
        ...patientForm as Patient,
        routine: {
          ...editingPatient.routine,
          stage: formStage
        }
      });
    } else {
      // Validate tenantId
      const tenantId = useAuthStore.getState().user?.tenantId;
      if (!tenantId) {
        setError("Error crítico: No se encontró el tenantId del usuario.");
        return;
      }

      // Initialize routine days based on sessionsPerWeek
      const days: RoutineDay[] = [];
      const numDays = patientForm.sessionsPerWeek || 3;
      for (let i = 1; i <= numDays; i++) {
        days.push({ id: `day-${Date.now()}-${i}`, name: `Día ${i}`, exercises: [] });
      }

      try {
        let authUid = `p_${Date.now()}`;

        // Attempt to create Firebase Auth user
        if (secondaryAuth) {
          const email = generatePatientEmail(patientForm.dni!);
          // The initial password is the DNI
          const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, patientForm.dni!);
          authUid = userCredential.user.uid;
        } else {
          console.warn("Secondary auth not initialized, skipping Firebase Auth creation.");
        }

        const patient: Patient = {
          ...patientForm as Patient,
          id: authUid, // Use the auth UID as the document ID for consistency
          uid: authUid,
          tenantId: tenantId, 
          lastVisit: new Date().toISOString().split('T')[0],
          routine: {
            id: `r_${Date.now()}`,
            stage: formStage,
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
        setSchedulePromptPatient(patient);
      } catch (err: any) {
        console.error("Error creating auth user:", err);
        setError("Error al crear la cuenta del paciente (¿DNI ya registrado como correo?).");
        return;
      }
    }
    
    setShowAddModal(false);
    resetForm();
  };

  const handleResetPassword = async (patient: Patient) => {
    if (!patient.dni) {
      setError("El paciente no tiene un DNI registrado.");
      return;
    }
    try {
      const email = generatePatientEmail(patient.dni);
      if (auth) {
        await sendPasswordResetEmail(auth, email);
        alert(`Se ha enviado un correo a ${email} (si está configurado) para restablecer la contraseña. \n\nNota: Dado que usamos correos ficticios (dni@pacientes...), en producción deberás usar un servidor (Admin SDK) para setear la clave manualmente, o solicitar el correo real del paciente.`);
      } else {
        alert("Firebase Auth no está activo.");
      }
    } catch (err) {
      console.error(err);
      alert("No se pudo enviar la solicitud de reseteo.");
    }
  };

  const handleCheckIn = (patient: Patient) => {
    let updatedPatient = { ...patient };
    
    // Si es por sesiones, descontamos una (incluso si queda en negativo para registrar deuda)
    if (patient.planType === PlanType.SESSIONS) {
      updatedPatient.remainingSessions = (patient.remainingSessions ?? 0) - 1;
    }
    
    // Cambiamos estado a "En Sala"
    updatedPatient.checkInStatus = CheckInStatus.IN_ROOM;
    updatedPatient.lastVisit = new Date().toISOString().split('T')[0];
    
    onUpdatePatient(updatedPatient);

    // Marcar turno de hoy como completado si existe y estaba SCHEDULED
    const today = new Date().toISOString().split('T')[0];
    const todayApp = appointments.find((a: Appointment) => a.patientId === patient.id && a.date === today && a.status === 'SCHEDULED');
    if (todayApp) {
      onUpdateAppointment({ ...todayApp, status: 'COMPLETED' });
    }
  };

  const handleCheckOut = (patient: Patient) => {
    if (window.confirm(`¿Finalizar sesión de ${patient.firstName} ${patient.lastName}?`)) {
      const today = new Date().toISOString().split('T')[0];
      const newHistory = [`Sesión finalizada el ${today}`, ...(patient.history || [])];
      onUpdatePatient({ ...patient, checkInStatus: CheckInStatus.IDLE, lastVisit: today, history: newHistory });
    }
  };

  const handleRegisterPayment = () => {
    if (!paymentPatient) return;
    
    const today = new Date().toISOString().split('T')[0];
    let updatedPatient = { ...paymentPatient, paymentDate: today };
    let historyMsg = `Pago registrado (${today}): `;

    if (paymentTypeState === 'SINGLE') {
      updatedPatient.planType = PlanType.SESSIONS;
      updatedPatient.totalSessionsPaid = (updatedPatient.totalSessionsPaid || 0) + 1;
      updatedPatient.remainingSessions = (updatedPatient.remainingSessions || 0) + 1;
      historyMsg += `1 sesión suelta.`;
    } else if (paymentTypeState === 'PACK') {
      updatedPatient.planType = PlanType.SESSIONS;
      updatedPatient.totalSessionsPaid = (updatedPatient.totalSessionsPaid || 0) + paymentValue;
      updatedPatient.remainingSessions = (updatedPatient.remainingSessions || 0) + paymentValue;
      historyMsg += `Paquete de ${paymentValue} sesiones.`;
    } else if (paymentTypeState === 'MONTH') {
      updatedPatient.planType = PlanType.TIME;
      const currentExp = new Date(updatedPatient.expirationDate || today);
      const now = new Date();
      let baseDate = currentExp > now ? currentExp : now;
      baseDate.setMonth(baseDate.getMonth() + paymentValue);
      updatedPatient.expirationDate = baseDate.toISOString().split('T')[0];
      historyMsg += `Abono por tiempo (${paymentValue} mes/es). Nuevo vto: ${updatedPatient.expirationDate}`;
    }

    updatedPatient.history = [historyMsg, ...(updatedPatient.history || [])];

    onUpdatePatient(updatedPatient);
    setPaymentPatient(null);
  };

  const getPlanStatus = (patient: Patient) => {
    const today = new Date();
    const expiration = new Date(patient.expirationDate);
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (patient.planType === PlanType.SESSIONS) {
      const remaining = patient.remainingSessions || 0;
      if (remaining < 0) return { label: `Debe ${Math.abs(remaining)} ses.`, color: 'bg-red-600', text: 'text-red-600' };
      if (remaining === 0) return { label: 'Vencido (0 ses.)', color: 'bg-red-500', text: 'text-red-500' };
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

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysAppointments = appointments.filter(a => a.date === todayStr);


  return (
    <div className="flex-1 h-full bg-slate-50/50 overflow-hidden flex flex-col relative w-full">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary-100 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 z-0 pointer-events-none"></div>

      {/* Header */}
      <header className="glass-panel z-20 px-6 py-2.5 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 sticky top-0 border-b border-slate-200/40">
        <div className="flex items-center gap-6">
          <div className="shrink-0">
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">Recepción <span className="text-primary-500">•</span></h1>
          </div>
          
          <div className="flex bg-slate-100/60 backdrop-blur-md p-0.5 rounded-xl shadow-inner border border-slate-200/40">
            <button 
              onClick={() => setActiveTab('PATIENTS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${activeTab === 'PATIENTS' ? 'bg-white text-primary-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <User size={14} /> Pacientes
            </button>
            <button 
              onClick={() => setActiveTab('CALENDAR')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${activeTab === 'CALENDAR' ? 'bg-white text-primary-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <CalendarDays size={14} /> Turnos
            </button>
            <button 
              onClick={() => setActiveTab('SHOP')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${activeTab === 'SHOP' ? 'bg-white text-primary-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ShoppingBag size={14} /> Tienda
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              const inRoomPatients = patients.filter(p => p.checkInStatus === CheckInStatus.IN_ROOM);
              let msg = '¿Desea finalizar la jornada? Se vaciará la sala de espera y se resetearán los estados de todos los pacientes.';
              if (inRoomPatients.length > 0) {
                const names = inRoomPatients.map(p => `${p.firstName} ${p.lastName}`).join(', ');
                msg = `Hay pacientes que no se les finalizó el día:\n\n${names}\n\nSe finalizarán automáticamente. ¿Desea continuar?`;
              }
              if (window.confirm(msg)) {
                onClearWaitingRoom();
              }
            }}
            className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10 active:scale-95 transition-all flex items-center gap-2 border border-slate-700"
          >
            <Moon size={14} /> Finalizar Jornada
          </button>
        </div>
      </header>

      {/* Content */}
      <div className={`flex-1 overflow-y-auto ${activeTab === 'CALENDAR' ? 'p-2 md:p-4' : 'p-4 md:p-8'} scroll-container relative z-10`}>
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

            {/* Turnos de Hoy Section */}
            {todaysAppointments.length > 0 && !searchTerm && (
              <div className="mb-8">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <CalendarDays size={16} /> Pacientes con Turno Hoy
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {todaysAppointments.map(app => {
                    const patient = patients.find(p => p.id === app.patientId);
                    if (!patient) return null;
                    return (
                      <div key={app.id} className="bg-white rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between border border-slate-100 shadow-sm gap-4">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                          <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex flex-col items-center justify-center shrink-0">
                            <span className="text-sm font-black">{app.time}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">{app.patientName}</h4>
                            <p className="text-xs text-slate-500 font-medium">
                              {staff.find(s => s.id === app.kineId)?.firstName} {staff.find(s => s.id === app.kineId)?.lastName}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                          {app.status === 'SCHEDULED' && patient.checkInStatus === CheckInStatus.IDLE ? (
                            <>
                              <button onClick={() => markAppointmentStatus(patient, app, 'COMPLETED')} className="shrink-0 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 rounded-xl text-xs font-bold transition-colors">
                                Dar Presente
                              </button>
                              <button onClick={() => markAppointmentStatus(patient, app, 'NOSHOW')} className="shrink-0 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-xl text-xs font-bold transition-colors">
                                Ausente (Sin Aviso)
                              </button>
                              <button onClick={() => markAppointmentStatus(patient, app, 'CANCELLED')} className="shrink-0 px-4 py-2 bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700 rounded-xl text-xs font-bold transition-colors">
                                Ausente (Con Aviso)
                              </button>
                            </>
                          ) : (
                            <div className="px-4 py-2 bg-slate-50 text-slate-500 rounded-xl text-xs font-bold border border-slate-100 flex items-center gap-2">
                              {app.status === 'COMPLETED' ? <><CheckCircle2 size={14} className="text-emerald-500"/> Presente</> : 
                               app.status === 'NOSHOW' ? <><X size={14} className="text-red-500"/> Faltó (Sin Aviso)</> :
                               app.status === 'CANCELLED' ? <><X size={14} className="text-orange-500"/> Faltó (Con Aviso)</> : 
                               patient.checkInStatus !== CheckInStatus.IDLE ? <><Clock size={14} className="text-amber-500" /> En Sala</> :
                               'Turno Procesado'}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
                          <div className="flex items-center gap-2 w-full md:w-auto">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleCheckIn(patient); }}
                              className="w-full md:w-auto px-6 py-3.5 rounded-[1.25rem] font-bold text-sm flex items-center justify-center gap-2 transition-all bg-emerald-500 text-white hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 hover:-translate-y-0.5 active:scale-95"
                            >
                              <CheckCircle2 size={20} strokeWidth={2.5} /> Dar Presente
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setActiveTab('CALENDAR'); setAutoSchedulePatientId(patient.id); }}
                              className="w-full md:w-auto px-4 py-3.5 rounded-[1.25rem] font-bold text-sm flex items-center justify-center transition-all bg-white text-primary-600 border border-primary-200 hover:bg-primary-50 shadow-sm hover:-translate-y-0.5 active:scale-95"
                              title="Agendar Turno Rápido"
                            >
                              <CalendarDays size={20} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setPaymentPatient(patient); setPaymentTypeState('PACK'); setPaymentValue(10); }}
                              className={`w-full md:w-auto px-4 py-3.5 rounded-[1.25rem] font-bold text-sm flex items-center justify-center transition-all shadow-sm hover:-translate-y-0.5 active:scale-95 ${status.label === 'Vencido' || status.label === 'Próximo a vencer' ? 'bg-orange-500 text-white border-transparent hover:bg-orange-600 shadow-orange-500/20' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                              title="Registrar Pago"
                            >
                              <CreditCard size={20} />
                            </button>
                          </div>
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
              staff={staff}
              onAddAppointment={onAddAppointment}
              onUpdateAppointment={onUpdateAppointment}
              onDeleteAppointment={onDeleteAppointment}
              onUpdatePatient={onUpdatePatient}
              autoSchedulePatientId={autoSchedulePatientId}
              onClearAutoSchedule={() => setAutoSchedulePatientId(null)}
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

                  <div className="col-span-full">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-3 block">Área / Etapa</label>
                    <div className="flex bg-slate-100 p-1 rounded-2xl">
                      <button 
                        type="button"
                        onClick={() => {
                          setFormStage(Stage.KINESIOLOGY);
                          if (!editingPatient) setPatientForm({...patientForm, planType: PlanType.SESSIONS});
                        }}
                        className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm ${formStage === Stage.KINESIOLOGY ? 'bg-white text-primary-600 ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Kinesiología
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setFormStage(Stage.GYM);
                          if (!editingPatient) {
                            const oneMonthLater = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
                            setPatientForm({
                              ...patientForm, 
                              planType: PlanType.TIME,
                              expirationDate: oneMonthLater,
                              totalSessionsPaid: 0,
                              remainingSessions: 0
                            });
                          }
                        }}
                        className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm ${formStage === Stage.GYM ? 'bg-white text-primary-600 ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Gimnasio
                      </button>
                    </div>
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
                  {patientForm.surgeryDate && (
                    <div className="col-span-full space-y-1.5 animate-in fade-in slide-in-from-top-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo de Cirugía</label>
                      <input 
                        placeholder="Ej: Plástica HTH, Meniscectomía..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
                        value={patientForm.surgeryType || ''}
                        onChange={e => setPatientForm({...patientForm, surgeryType: e.target.value})}
                      />
                    </div>
                  )}
                  
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
                  <div className="flex gap-2 order-3 sm:order-1 flex-1 sm:flex-none">
                    <button 
                      type="button" 
                      onClick={() => handleResetPassword(editingPatient)} 
                      className="w-full sm:w-auto text-slate-500 font-bold py-3 px-5 hover:bg-slate-200 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 border border-slate-300"
                    >
                       Restaurar Acceso
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { if(window.confirm('¿ELIMINAR PACIENTE DEFINITIVAMENTE? Esta acción destruirá todo su historial clínico. No se puede deshacer.')) { onDeletePatient(editingPatient.id); setShowAddModal(false); setEditingPatient(null); } }} 
                      className="w-full sm:w-auto text-red-500 font-bold py-3 px-5 hover:bg-red-100 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <Trash2 size={18} /> Borrar
                    </button>
                  </div>
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
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up relative">
            <div className="p-8 pb-6 flex-shrink-0 border-b border-slate-100 flex justify-between items-center bg-white z-10">
              <div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">{editingProduct ? 'Editar Ítem' : 'Añadir a Catálogo'}</h2>
              </div>
              <button onClick={() => { setShowProductModal(false); resetProductForm(); }} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors shrink-0">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scroll-container relative">
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
              <div className="sticky bottom-0 bg-white pt-2 pb-4 mt-4 border-t border-slate-100 z-10">
                <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl shadow-slate-900/20 hover:bg-black active:scale-95 transition-all text-lg flex items-center justify-center gap-2">
                  <CheckCircle2 size={22} /> {editingProduct ? 'Aceptar Cambios' : 'Generar Ítem'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Prompt Modal */}
      {schedulePromptPatient && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden p-8 text-center animate-slide-up">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">¡Paciente Registrado!</h3>
            <p className="text-sm font-medium text-slate-500 mb-8">
              El perfil de {schedulePromptPatient.firstName} se guardó correctamente. ¿Deseas asignarle su primer turno ahora?
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => { 
                  setSchedulePromptPatient(null); 
                  setActiveTab('CALENDAR'); 
                  setAutoSchedulePatientId(schedulePromptPatient.id); 
                }}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white px-6 py-3.5 rounded-[1.25rem] font-black shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <CalendarDays size={20} /> Sí, Agendar Turno
              </button>
              <button 
                onClick={() => setSchedulePromptPatient(null)}
                className="w-full bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-slate-200 px-6 py-3.5 rounded-[1.25rem] font-bold transition-all active:scale-95"
              >
                Más tarde
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentPatient && (() => {
        let paymentTotal = 0;
        if (paymentTypeState === 'SINGLE') {
          paymentTotal = tenantSettings.priceSingleSession;
        } else if (paymentTypeState === 'PACK') {
          paymentTotal = (tenantSettings.pricePack10 / 10) * paymentValue;
        } else if (paymentTypeState === 'MONTH') {
          paymentTotal = tenantSettings.priceMonthly * paymentValue;
        }

        return (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Registrar Pago</h3>
                  <p className="text-xs font-bold text-slate-500">{paymentPatient.firstName} {paymentPatient.lastName}</p>
                </div>
              </div>
              <button onClick={() => setPaymentPatient(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo de Abono</label>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setPaymentTypeState('SINGLE')} className={`py-3 rounded-xl font-bold text-xs transition-all border ${paymentTypeState === 'SINGLE' ? 'bg-primary-50 border-primary-200 text-primary-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>1 Sesión</button>
                  <button onClick={() => setPaymentTypeState('PACK')} className={`py-3 rounded-xl font-bold text-xs transition-all border ${paymentTypeState === 'PACK' ? 'bg-primary-50 border-primary-200 text-primary-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Paquete</button>
                  <button onClick={() => setPaymentTypeState('MONTH')} className={`py-3 rounded-xl font-bold text-xs transition-all border ${paymentTypeState === 'MONTH' ? 'bg-primary-50 border-primary-200 text-primary-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>Mensual</button>
                </div>
              </div>

              {paymentTypeState === 'PACK' && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Cantidad de Sesiones</label>
                  <input type="number" min="1" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 text-lg" value={paymentValue} onChange={e => setPaymentValue(Number(e.target.value))} />
                </div>
              )}

              {paymentTypeState === 'MONTH' && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Cantidad de Meses</label>
                  <input type="number" min="1" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 text-lg" value={paymentValue} onChange={e => setPaymentValue(Number(e.target.value))} />
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-sm font-black text-slate-500 uppercase tracking-widest">Total a Abonar</span>
                <span className="text-2xl font-black text-emerald-600">${paymentTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setPaymentPatient(null)} className="px-6 py-3 rounded-[1.25rem] font-bold text-slate-600 hover:bg-slate-200 transition-colors">Cancelar</button>
                <button onClick={handleRegisterPayment} className="px-6 py-3 rounded-[1.25rem] font-bold bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 hover:-translate-y-0.5 transition-all">Confirmar Pago</button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

    </div>
  );
};
