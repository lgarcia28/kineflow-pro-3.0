
import React, { useState, useMemo, useEffect } from 'react';
import { 
  format, 
  addDays, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  startOfMonth, 
  endOfMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  subWeeks,
  addWeeks,
  parseISO,
  isToday,
  startOfDay,
  setHours,
  setMinutes
} from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  MoreVertical,
  Trash2,
  CheckCircle2,
  XCircle,
  Repeat
} from 'lucide-react';
import { Patient, Appointment, RecurringSlot, StaffMember, UserRole, STAFF_COLORS, CLINICAL_ACTIVITIES } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TurnoCalendarProps {
  patients: Patient[];
  appointments: Appointment[];
  staff: StaffMember[];
  onAddAppointment: (appointment: Appointment) => void;
  onUpdateAppointment: (appointment: Appointment) => void;
  onDeleteAppointment: (id: string) => void;
  onUpdatePatient: (patient: Patient) => void;
  autoSchedulePatientId?: string | null;
  onClearAutoSchedule?: () => void;
}

export const TurnoCalendar: React.FC<TurnoCalendarProps> = ({
  patients,
  appointments,
  staff,
  onAddAppointment,
  onUpdateAppointment,
  onDeleteAppointment,
  onUpdatePatient,
  autoSchedulePatientId,
  onClearAutoSchedule
}) => {
  const [view, setView] = useState<'WEEK' | 'MONTH'>('WEEK');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  
  // --- Estados para el Modo Ráfaga (Multi-Booking) ---
  const [isMultiBookingMode, setIsMultiBookingMode] = useState(false);
  const [multiBookingPatientId, setMultiBookingPatientId] = useState('');
  const [multiBookingKineId, setMultiBookingKineId] = useState('');
  const [multiBookingActivityId, setMultiBookingActivityId] = useState('');

  // Use effect to auto-open modal if autoSchedulePatientId is provided
  useEffect(() => {
    if (autoSchedulePatientId) {
      setSelectedSlot(null);
      setEditingAppointment(null);
      setShowAddModal(true);
    }
  }, [autoSchedulePatientId]);

  // Time slots to display in week view (e.g., 08:00 to 20:00 every 30 mins)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 8; h <= 20; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      if (h < 20) {
        slots.push(`${h.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  }, []);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    // Add padding days for start and end of month
    const startPadded = startOfWeek(start, { weekStartsOn: 1 });
    const endPadded = endOfWeek(end, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startPadded, end: endPadded });
  }, [currentDate]);

  const handlePrev = () => {
    if (view === 'WEEK') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    if (view === 'WEEK') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const handleSlotClick = (date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const timeStr = time;

    if (isMultiBookingMode && multiBookingPatientId) {
      const patient = patients.find(p => p.id === multiBookingPatientId);
      if (!patient) return;

      const newApp: Appointment = {
        id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        date: dateStr,
        time: timeStr,
        duration: 60,
        status: 'SCHEDULED',
        isRecurring: false,
        kineId: multiBookingKineId,
        activityId: multiBookingActivityId,
        notes: ''
      };
      onAddAppointment(newApp);
      return;
    }

    setSelectedSlot({ date: dateStr, time: timeStr });
    setEditingAppointment(null);
    setShowAddModal(true);
  };

  const handleEditAppointment = (app: Appointment) => {
    setEditingAppointment(app);
    setSelectedSlot(null);
    setShowAddModal(true);
  };

  const getAppStatus = (app: Appointment) => {
    if (app.status === 'COMPLETED' || app.status === 'CANCELLED') return app.status;
    
    // Check if appointment time has passed
    const appDateTime = new Date(`${app.date}T${app.time}`);
    if (appDateTime < new Date() && app.status === 'SCHEDULED') {
      return 'NOSHOW';
    }
    return app.status;
  };

  const getAppointmentsForSlot = (date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter(app => app.date === dateStr && app.time === time);
  };

  const getAppointmentsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter(app => app.date === dateStr);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
      {/* Calendar Header */}
      <div className="px-6 py-3 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-100 rounded-xl p-1">
            <button 
              onClick={() => setView('WEEK')}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                view === 'WEEK' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Semana
            </button>
            <button 
              onClick={() => setView('MONTH')}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                view === 'MONTH' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Mes
            </button>
          </div>
          <h2 className="text-xl font-black text-slate-900 capitalize">
            {view === 'WEEK' 
              ? `Semana del ${format(weekDays[0], 'd')} de ${format(weekDays[0], 'MMMM', { locale: es })}`
              : format(currentDate, "MMMM yyyy", { locale: es })}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handlePrev} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
          >
            Hoy
          </button>
          <button onClick={handleNext} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
            <ChevronRight size={20} />
          </button>
          
          <button 
            onClick={() => {
              setIsMultiBookingMode(!isMultiBookingMode);
              if (!isMultiBookingMode) {
                setMultiBookingPatientId('');
                setMultiBookingKineId('');
                setMultiBookingActivityId('');
              }
            }}
            className={cn(
              "ml-2 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all border",
              isMultiBookingMode 
                ? "bg-primary-600 text-white border-primary-500 shadow-lg shadow-primary-500/20" 
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            <Repeat size={16} /> 
            <span className="hidden sm:inline">{isMultiBookingMode ? 'Cerrar Modo Ráfaga' : 'Modo Ráfaga'}</span>
          </button>

          <button 
            onClick={() => { setSelectedSlot(null); setShowAddModal(true); }}
            className="ml-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-black transition-all"
          >
            <Plus size={16} /> Agendar
          </button>
        </div>
      </div>

      {/* Floating Multi-Booking Bar */}
      {isMultiBookingMode && (
        <div className="mx-6 my-3 p-4 bg-primary-50 border border-primary-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-600/20">
              <User size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest leading-none mb-1">Modo Agendamiento Múltiple</p>
              <p className="text-xs font-bold text-slate-600">Seleccioná un paciente y tocá los huecos libres para agendar al toque.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <select 
              className="w-full sm:w-48 bg-white border border-primary-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all pointer-events-auto"
              value={multiBookingPatientId}
              onChange={(e) => setMultiBookingPatientId(e.target.value)}
            >
              <option value="">Paciente...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>

            <select 
              className="w-full sm:w-40 bg-white border border-primary-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all pointer-events-auto"
              value={multiBookingKineId}
              onChange={e => {
                setMultiBookingKineId(e.target.value);
                setMultiBookingActivityId('');
              }}
            >
              <option value="">Profesional...</option>
              <option value="ANY">Cualquiera</option>
              {staff.filter(s => s.role === UserRole.KINE).map(k => (
                <option key={k.id} value={k.id}>{k.firstName} {k.lastName}</option>
              ))}
            </select>

            <select 
              className="w-full sm:w-40 bg-white border border-primary-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all pointer-events-auto"
              value={multiBookingActivityId}
              onChange={e => setMultiBookingActivityId(e.target.value)}
              disabled={!multiBookingKineId}
            >
              <option value="">Actividad...</option>
              {multiBookingKineId && (() => {
                if (multiBookingKineId === 'ANY') {
                  return CLINICAL_ACTIVITIES.map(act => (
                    <option key={act.id} value={act.id}>{act.name}</option>
                  ));
                }
                const selectedKine = staff.find(s => s.id === multiBookingKineId);
                if (!selectedKine || !selectedKine.activities) return null;
                return selectedKine.activities.map(actId => {
                  const act = CLINICAL_ACTIVITIES.find(a => a.id === actId);
                  return <option key={actId} value={actId}>{act ? act.name : actId}</option>;
                });
              })()}
            </select>
            
            <button 
              onClick={() => {
                setIsMultiBookingMode(false);
                setMultiBookingPatientId('');
                setMultiBookingKineId('');
                setMultiBookingActivityId('');
              }}
              className="px-4 py-2.5 bg-primary-600 text-white rounded-xl text-xs font-black shadow-lg shadow-primary-600/10 hover:bg-primary-700 transition-all"
            >
              Finalizar
            </button>
          </div>
        </div>
      )}

      {/* Calendar Body */}
      <div className="flex-1 overflow-auto">
        {view === 'WEEK' ? (
          <div className="min-w-[800px]">
            {/* Week Header */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-100 sticky top-0 bg-white z-20 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
              <div className="p-2 border-r border-slate-50"></div>
              {weekDays.map(day => (
                <div key={day.toString()} className={cn(
                  "py-2 px-1 flex flex-col items-center justify-center border-r border-slate-50 last:border-r-0",
                  isToday(day) && "bg-primary-50/30"
                )}>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{format(day, 'EEE', { locale: es })}</p>
                  <p className={cn(
                    "text-sm font-black mt-1 leading-none",
                    isToday(day) ? "text-primary-600" : "text-slate-900"
                  )}>{format(day, 'd')}</p>
                </div>
              ))}
            </div>

            {/* Week Grid */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)]">
              {timeSlots.map(time => (
                <React.Fragment key={time}>
                  <div className="pr-2 py-0 border-b border-r border-slate-50 text-right sticky left-0 bg-white z-10 w-[60px]">
                    <span className="text-[9px] font-bold text-slate-400 relative top-[-6px] bg-white px-1">{time}</span>
                  </div>
                  {weekDays.map(day => {
                    const slotAppointments = getAppointmentsForSlot(day, time);
                    return (
                      <div 
                        key={`${day}-${time}`} 
                        onClick={() => handleSlotClick(day, time)}
                        className={cn(
                          "border-b border-r border-slate-100/50 last:border-r-0 min-h-[48px] p-[3px] transition-colors cursor-pointer group relative",
                          isMultiBookingMode && multiBookingPatientId ? "hover:bg-primary-50 cursor-crosshair" : "hover:bg-slate-50/80"
                        )}
                      >
                        {slotAppointments.map(app => {
                          const status = getAppStatus(app);
                          const kine = staff.find(s => s.id === app.kineId);
                          const kineColor = STAFF_COLORS.find(c => c.id === kine?.themeColor);
                          const activity = CLINICAL_ACTIVITIES.find(a => a.id === app.activityId);

                          // Base color: always use kine color if available, otherwise blue default
                          const baseBg    = kineColor?.bg     ?? '#eff6ff';
                          const baseBorder = kineColor?.border ?? '#3b82f6';
                          const baseText  = kineColor?.text   ?? '#1e3a8a';

                          // Adjust style per status
                          const cardStyle: React.CSSProperties =
                            status === 'COMPLETED'  ? { backgroundColor: '#d1fae5', borderColor: '#10b981', color: '#064e3b', borderLeftColor: '#10b981' } :
                            (status === 'CANCELLED' || status === 'NOSHOW')  ? { backgroundColor: '#fee2e2', borderColor: '#f87171', color: '#7f1d1d', borderLeftColor: '#ef4444', opacity: 0.8 } :
                            /* SCHEDULED */           { backgroundColor: baseBg,   borderColor: baseBorder, color: baseText,  borderLeftColor: baseBorder };

                          return (
                            <div
                              key={app.id}
                              onClick={(e) => { e.stopPropagation(); handleEditAppointment(app); }}
                              style={cardStyle}
                              className="flex flex-col px-1.5 py-1.5 rounded-[8px] text-[10px] font-bold mb-[3px] shadow-sm border border-l-[3px] truncate leading-tight transition-all hover:scale-[1.02] cursor-pointer"
                            >
                              <div className="flex items-center justify-between">
                                <span className="truncate">{app.patientName}</span>
                                {app.isRecurring && <Repeat size={8} className="shrink-0 ml-1 opacity-50" />}
                              </div>
                              {activity && (
                                <div style={{ display:'flex', alignItems:'center', gap:'3px', marginTop:'2px' }}>
                                  <span style={{ backgroundColor: activity.hex, width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, display: 'inline-block' }}></span>
                                  <span style={{ fontSize:'8px', textTransform:'uppercase', letterSpacing:'0.05em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{activity.name}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-7 h-full min-h-[600px]">
            {/* Month Header */}
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
              <div key={day} className="p-4 text-center border-b border-r border-slate-100 bg-slate-50/50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</span>
              </div>
            ))}
            {/* Month Grid */}
            {monthDays.map(day => {
              const dayApps = getAppointmentsForDay(day);
              const isCurrentMonth = format(day, 'M') === format(currentDate, 'M');
              return (
                <div 
                  key={day.toString()} 
                  className={cn(
                    "p-2 border-b border-r border-slate-100 min-h-[120px] transition-colors hover:bg-slate-50/50 cursor-pointer",
                    !isCurrentMonth && "bg-slate-50/30 opacity-50",
                    isToday(day) && "bg-primary-50/20"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn(
                      "w-6 h-6 flex items-center justify-center rounded-full text-xs font-black",
                      isToday(day) ? "bg-primary-600 text-white" : "text-slate-900"
                    )}>
                      {format(day, 'd')}
                    </span>
                    {dayApps.length > 0 && (
                      <span className="text-[10px] font-black text-slate-400">{dayApps.length} turnos</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {dayApps.slice(0, 3).map(app => {
                      const status = getAppStatus(app);
                      const kine = staff.find(s => s.id === app.kineId);
                      const kineColor = STAFF_COLORS.find(c => c.id === kine?.themeColor);
                      const activity = CLINICAL_ACTIVITIES.find(a => a.id === app.activityId);

                      const baseBg     = kineColor?.bg     ?? '#eff6ff';
                      const baseBorder = kineColor?.border ?? '#3b82f6';
                      const baseText   = kineColor?.text   ?? '#1e3a8a';

                      const cardStyle: React.CSSProperties =
                        status === 'COMPLETED'  ? { backgroundColor: '#d1fae5', borderColor: '#10b981', color: '#064e3b', borderLeftColor: '#10b981' } :
                        (status === 'CANCELLED' || status === 'NOSHOW') ? { backgroundColor: '#fee2e2', borderColor: '#f87171', color: '#7f1d1d', borderLeftColor: '#ef4444', opacity: 0.8 } :
                        /* SCHEDULED */           { backgroundColor: baseBg,   borderColor: baseBorder, color: baseText,  borderLeftColor: baseBorder };

                      return (
                        <div
                          key={app.id}
                          onClick={(e) => { e.stopPropagation(); handleEditAppointment(app); }}
                          style={cardStyle}
                          className="px-1.5 py-1 rounded-[6px] text-[9px] font-bold truncate leading-tight transition-all hover:scale-[1.02] border border-l-[3px] cursor-pointer"
                        >
                          <div style={{ display:'flex', alignItems:'center', gap:'3px' }}>
                            {activity && <span style={{ backgroundColor: activity.hex, width:'5px', height:'5px', borderRadius:'50%', flexShrink:0, display:'inline-block' }}></span>}
                            <span className="truncate">{app.time} {app.patientName}</span>
                          </div>
                        </div>
                      );
                    })}
                    {dayApps.length > 3 && (
                      <div className="text-[9px] font-bold text-primary-600 pl-2">
                        + {dayApps.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Appointment Modal */}
      {showAddModal && (
        <AppointmentModal 
          patients={patients}
          staff={staff}
          selectedSlot={selectedSlot}
          initialAppointment={editingAppointment}
          autoPatientId={autoSchedulePatientId}
          onClose={() => { 
            setShowAddModal(false); 
            setEditingAppointment(null); 
            if(onClearAutoSchedule) onClearAutoSchedule();
          }}
          onSave={(app) => {
            if (editingAppointment) onUpdateAppointment(app);
            else onAddAppointment(app);
            setShowAddModal(false);
            setEditingAppointment(null);
          }}
          onDelete={(id) => {
            onDeleteAppointment(id);
            setShowAddModal(false);
            setEditingAppointment(null);
          }}
          onUpdatePatient={onUpdatePatient}
          onBulkAddAppointments={(apps) => {
            apps.forEach(app => onAddAppointment(app));
          }}
        />
      )}
    </div>
  );
};

interface AppointmentModalProps {
  patients: Patient[];
  staff: StaffMember[];
  selectedSlot: { date: string; time: string } | null;
  initialAppointment: Appointment | null;
  onClose: () => void;
  onSave: (app: Appointment) => void;
  onDelete: (id: string) => void;
  onUpdatePatient: (patient: Patient) => void;
  onBulkAddAppointments: (apps: Appointment[]) => void;
  autoPatientId?: string | null;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({
  patients,
  staff,
  selectedSlot,
  initialAppointment,
  onClose,
  onSave,
  onDelete,
  onUpdatePatient,
  onBulkAddAppointments,
  autoPatientId
}) => {
  const [patientId, setPatientId] = useState(initialAppointment?.patientId || autoPatientId || '');
  const [date, setDate] = useState(initialAppointment?.date || selectedSlot?.date || format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState(initialAppointment?.time || selectedSlot?.time || '08:00');
  const [kineId, setKineId] = useState(initialAppointment?.kineId || '');
  const [activityId, setActivityId] = useState(initialAppointment?.activityId || '');
  const [isRecurring, setIsRecurring] = useState(initialAppointment?.isRecurring || false);
  const [recurringSlots, setRecurringSlots] = useState<RecurringSlot[]>([]);
  const [notes, setNotes] = useState(initialAppointment?.notes || '');
  const [weeksToGenerate, setWeeksToGenerate] = useState(4);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const selectedPatient = useMemo(() => patients.find(p => p.id === patientId), [patients, patientId]);

  useEffect(() => {
    if (selectedPatient) {
      setRecurringSlots(selectedPatient.recurringSlots || []);
      if (selectedPatient.recurringSlots && selectedPatient.recurringSlots.length > 0) {
        setIsRecurring(true);
      }
    }
  }, [selectedPatient]);

  const handleAddSlot = () => {
    setRecurringSlots([...recurringSlots, { dayOfWeek: 1, time: '08:00' }]);
  };

  const handleRemoveSlot = (index: number) => {
    setRecurringSlots(recurringSlots.filter((_, i) => i !== index));
  };

  const handleUpdateSlot = (index: number, field: keyof RecurringSlot, value: any) => {
    const newSlots = [...recurringSlots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setRecurringSlots(newSlots);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    if (isRecurring && !initialAppointment) {
      // Update patient's recurring slots
      onUpdatePatient({
        ...selectedPatient,
        recurringSlots
      });

      // Generate appointments if requested
      if (weeksToGenerate > 0) {
        const newApps: Appointment[] = [];
        const startDate = startOfDay(parseISO(date));
        
        for (let i = 0; i < weeksToGenerate; i++) {
          recurringSlots.forEach(slot => {
            // Calculate date for this slot in this week
            const weekStart = addWeeks(startOfWeek(startDate, { weekStartsOn: 1 }), i);
            const slotDate = addDays(weekStart, slot.dayOfWeek === 0 ? 6 : slot.dayOfWeek - 1);
            
            // Only add if it's today or in the future from the selected date
            if (slotDate >= startDate) {
              newApps.push({
                id: `app_${Date.now()}_${i}_${slot.dayOfWeek}`,
                patientId: selectedPatient.id,
                patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
                date: format(slotDate, 'yyyy-MM-dd'),
                time: slot.time,
                duration: 60,
                status: 'SCHEDULED',
                isRecurring: true,
                kineId: slot.kineId || kineId,
                activityId: slot.activityId || activityId,
                notes
              });
            }
          });
        }
        onBulkAddAppointments(newApps);
      }
    } else {
      const newApp: Appointment = {
        id: initialAppointment?.id || `app_${Date.now()}`,
        patientId,
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        date,
        time,
        duration: 60,
        status: initialAppointment?.status || 'SCHEDULED',
        isRecurring,
        kineId,
        activityId,
        notes
      };
      onSave(newApp);
    }
    onClose();
  };

  const daysLabels = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 pb-6 flex-shrink-0 border-b border-slate-100 flex justify-between items-center bg-white z-10">
          <h2 className="text-2xl font-black text-slate-900">{initialAppointment ? 'Editar Turno' : 'Agendar Turno'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full transition-colors shrink-0">
            <XCircle size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 scroll-container relative">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Paciente</label>
              <select 
                className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold"
                value={patientId}
                onChange={e => setPatientId(e.target.value)}
                required
              >
                <option value="">Seleccionar Paciente...</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.dni})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Profesional {isRecurring && '(Por Defecto)'}</label>
                <select 
                  className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold"
                  value={kineId}
                  onChange={e => {
                    setKineId(e.target.value);
                    setActivityId(''); // Reset activity when kine changes
                  }}
                  required={!isRecurring}
                >
                  <option value="">Seleccionar Profesional...</option>
                  <option value="ANY">Cualquiera (Sin preferencia)</option>
                  {staff.filter(s => s.role === UserRole.KINE).map(k => (
                    <option key={k.id} value={k.id}>{k.firstName} {k.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Actividad {isRecurring && '(Por Defecto)'}</label>
                <select 
                  className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold disabled:opacity-50"
                  value={activityId}
                  onChange={e => setActivityId(e.target.value)}
                  required={!isRecurring && !!kineId}
                  disabled={!kineId}
                >
                  <option value="">Elegir actividad...</option>
                  {kineId && (() => {
                    if (kineId === 'ANY') {
                      return CLINICAL_ACTIVITIES.map(act => (
                        <option key={act.id} value={act.id}>{act.name}</option>
                      ));
                    }
                    const selectedKine = staff.find(s => s.id === kineId);
                    if (!selectedKine || !selectedKine.activities) return null;
                    return selectedKine.activities.map(actId => {
                      const act = CLINICAL_ACTIVITIES.find(a => a.id === actId);
                      return <option key={actId} value={actId}>{act ? act.name : actId}</option>;
                    });
                  })()}
                </select>
              </div>
            </div>

            {!isRecurring ? (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha</label>
                  <input 
                    type="date"
                    className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hora</label>
                  <input 
                    type="time"
                    className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Horarios Semanales</label>
                  <button 
                    type="button"
                    onClick={handleAddSlot}
                    className="text-primary-600 text-xs font-black flex items-center gap-1 hover:text-primary-700"
                  >
                    <Plus size={14} /> Agregar Día
                  </button>
                </div>
                
                <div className="space-y-2">
                  {recurringSlots.map((slot, index) => (
                    <div key={index} className="flex flex-col gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2">
                        <select 
                          className="flex-1 bg-white border-slate-200 rounded-lg text-xs font-bold p-2"
                          value={slot.dayOfWeek}
                          onChange={e => handleUpdateSlot(index, 'dayOfWeek', Number(e.target.value))}
                        >
                          {daysLabels.map((label, i) => (
                            <option key={i} value={i}>{label}</option>
                          ))}
                        </select>
                        <input 
                          type="time"
                          className="w-24 bg-white border-slate-200 rounded-lg text-xs font-bold p-2"
                          value={slot.time}
                          onChange={e => handleUpdateSlot(index, 'time', e.target.value)}
                        />
                        <button 
                          type="button"
                          onClick={() => handleRemoveSlot(index)}
                          className="p-2 text-red-400 hover:text-red-600 bg-white rounded-lg border border-red-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <select 
                          className="flex-1 bg-white border-slate-200 rounded-lg text-[10px] font-bold p-2"
                          value={slot.kineId || ''}
                          onChange={e => {
                            handleUpdateSlot(index, 'kineId', e.target.value);
                            handleUpdateSlot(index, 'activityId', '');
                          }}
                        >
                          <option value="">(Usar Por Defecto)</option>
                          <option value="ANY">Cualquiera</option>
                          {staff.filter(s => s.role === UserRole.KINE).map(k => (
                            <option key={k.id} value={k.id}>{k.firstName} {k.lastName}</option>
                          ))}
                        </select>
                        <select 
                          className="flex-1 bg-white border-slate-200 rounded-lg text-[10px] font-bold p-2 disabled:opacity-50"
                          value={slot.activityId || ''}
                          onChange={e => handleUpdateSlot(index, 'activityId', e.target.value)}
                          disabled={!slot.kineId && !kineId}
                        >
                          <option value="">(Usar Por Defecto)</option>
                          {(slot.kineId || kineId) && (() => {
                            const kId = slot.kineId || kineId;
                            if (kId === 'ANY') {
                              return CLINICAL_ACTIVITIES.map(act => (
                                <option key={act.id} value={act.id}>{act.name}</option>
                              ));
                            }
                            const selectedKine = staff.find(s => s.id === kId);
                            if (!selectedKine || !selectedKine.activities) return null;
                            return selectedKine.activities.map(actId => {
                              const act = CLINICAL_ACTIVITIES.find(a => a.id === actId);
                              return <option key={actId} value={actId}>{act ? act.name : actId}</option>;
                            });
                          })()}
                        </select>
                      </div>
                    </div>
                  ))}
                  {recurringSlots.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-4">No hay horarios definidos</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Generar turnos para las próximas:</label>
                  <select 
                    className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold"
                    value={weeksToGenerate}
                    onChange={e => setWeeksToGenerate(Number(e.target.value))}
                  >
                    <option value={0}>No generar (solo guardar horario)</option>
                    <option value={1}>1 semana</option>
                    <option value={2}>2 semanas</option>
                    <option value={4}>4 semanas (1 mes)</option>
                    <option value={8}>8 semanas (2 meses)</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
              <input 
                type="checkbox"
                id="recurring"
                checked={isRecurring}
                onChange={e => setIsRecurring(e.target.checked)}
                className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="recurring" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Repeat size={16} /> Gestión de Horarios Fijos
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notas</label>
              <textarea 
                className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold h-24 resize-none"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Observaciones..."
              />
            </div>

            <div className="flex flex-col gap-3 mt-4 sticky bottom-0 bg-white pt-2 pb-2 border-t border-slate-100 z-10">
              <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl shadow-slate-200">
                {initialAppointment ? 'Guardar Cambios' : (isRecurring ? 'Guardar Horarios y Generar' : 'Confirmar Turno')}
              </button>
              
              {initialAppointment && (
                !confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="w-full text-red-500 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} /> Eliminar Turno
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 py-2 rounded-xl text-xs font-black text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(initialAppointment.id)}
                      className="flex-1 py-2 rounded-xl text-xs font-black text-white bg-red-500 hover:bg-red-600 transition-all flex items-center justify-center gap-1"
                    >
                      <Trash2 size={14} /> Confirmar Eliminación
                    </button>
                  </div>
                )
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
