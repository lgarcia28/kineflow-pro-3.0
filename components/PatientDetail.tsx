import React, { useState, useEffect, useMemo } from 'react';
import { Patient, RoutineExercise, Stage, UserRole, RoutineDay, ExerciseLog, ExerciseDefinition, CheckInStatus, PlanType, ClinicalEvaluation } from '../types';
import { EvaluationDashboard } from './EvaluationDashboard';
import { ExerciseCard } from './ExerciseCard';
import { ProgressChart } from './ProgressChart';
import { parseMediaUrl } from '../utils/mediaUrl';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
    FileText, Plus, Search, X, Calendar, Trash2, Edit2, Save,
    Activity, Minus, Layers, TrendingUp, CheckSquare, Square, BarChart2, CheckCircle2, History, ChevronRightCircle, Timer, Dumbbell, Maximize2, Award, Link2, Unlink
} from 'lucide-react';

interface PatientDetailProps {
  patient: Patient;
  role: UserRole;
  onUpdatePatient: (updated: Patient) => void;
  exercises: ExerciseDefinition[]; // Prop para recibir la librería dinámica
}

export const PatientDetail: React.FC<PatientDetailProps> = ({
  patient,
  role,
  onUpdatePatient,
  exercises // Usamos esto en lugar de EXERCISES constante
}) => {
  // Estado local para la navegación
  const [routineType, setRoutineType] = useState<'CLINIC' | 'HOME'>('CLINIC');
  const [activeDayId, setActiveDayId] = useState<string>(patient.routine.days[0]?.id || '');
  const [viewMode, setViewMode] = useState<'daily' | 'plan' | 'stats' | 'evaluations'>('daily');
  const [showHistory, setShowHistory] = useState(false);
  const [showRoutineEditor, setShowRoutineEditor] = useState(false);
  const [kineId, setKineId] = useState<string>('current-kine-id'); // En prod vendría del Auth context
  
  // Estados para modales y edición
  const [chartExercise, setChartExercise] = useState<RoutineExercise | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [isAddingExerciseModal, setIsAddingExerciseModal] = useState<{show: boolean, dayId: string}>({show: false, dayId: ''});
  const [notes, setNotes] = useState('');
  const [zoomedImage, setZoomedImage] = useState<{url: string, name: string} | null>(null);
  
  // --- Estados para Biserie/Triserie en el editor ---
  const [editorSelectedExIds, setEditorSelectedExIds] = useState<string[]>([]);

  const isKine = role === UserRole.KINE;
  
  // IMPORTANTE: Obtenemos el número de semana siempre de la prop patient
  const currentWeek = patient.routine.currentWeek || 1;

  // Sincronizar el día activo si cambia la rutina o el tipo de rutina
  useEffect(() => {
    const currentRoutine = routineType === 'CLINIC' ? patient.routine : (patient.homeRoutine || { days: [] });
    if (currentRoutine.days.length > 0 && (!activeDayId || !currentRoutine.days.find(d => d.id === activeDayId))) {
        setActiveDayId(currentRoutine.days[0].id);
    }
  }, [patient.routine.days, patient.homeRoutine?.days, activeDayId, routineType]);

  const activeDay = (routineType === 'CLINIC' ? patient.routine : (patient.homeRoutine || { days: [] })).days.find(d => d.id === activeDayId);

  // LOGICA PARA OBTENER SEMANAS UNICAS DE HISTORIAL (ORDEN ASCENDENTE 1, 2, 3...)
  const historyWeeksAscending = useMemo(() => {
    const weeks = new Set<number>();
    patient.routine.days.forEach(day => {
        day.exercises.forEach(ex => {
            ex.history?.forEach(log => {
                if (log.week) weeks.add(log.week);
            });
        });
    });
    // Ordenar ASCENDENTE (Semana 1, Semana 2, etc.)
    return Array.from(weeks).sort((a, b) => a - b);
  }, [patient]);

  // LOGICA MAESTRA: FINALIZAR SEMANA
  const handleStartNewWeek = () => {
    const confirmText = `¿Finalizar la SEMANA ${currentWeek}?\n\nEsto hará:\n1. Guardar lo realizado en el historial.\n2. Limpiar los checks de hoy.\n3. Avanzar a la SEMANA ${currentWeek + 1}.`;
    
    if (!window.confirm(confirmText)) return;

    const today = new Date().toISOString().split('T')[0];
    
    // Clonamos y reseteamos profundamente
    const resetDays = patient.routine.days.map(day => ({
      ...day,
      exercises: day.exercises.map(ex => {
        const newHistory = [...(ex.history || [])];
        
        // Si el ejercicio se marcó como hecho, guardamos esa foto en el historial con el NÚMERO DE SEMANA ACTUAL
        if (ex.isDone) {
          newHistory.push({
            date: today,
            week: currentWeek, // GUARDA EL NÚMERO DE SEMANA
            load: ex.targetLoad,
            reps: ex.targetReps,
            rpe: ex.currentRpe || 5
          });
        }

        return {
          ...ex,
          isDone: false,        // DESTILDAR (RESET)
          currentRpe: 0,        // RESET A 0
          history: newHistory
        };
      })
    }));

    // Actualizamos el objeto completo
    const updatedPatient: Patient = {
      ...patient,
      lastVisit: today,
      routine: {
        ...patient.routine,
        currentWeek: currentWeek + 1, // INCREMENTAR SEMANA
        days: resetDays
      }
    };

    onUpdatePatient(updatedPatient);
    
    // Feedback inmediato
    setViewMode('stats'); // Llevamos a stats para que vea que se guardó
    setTimeout(() => alert(`¡Semana ${currentWeek} completada y guardada!`), 100);
  };

  const handleExerciseUpdate = (exerciseId: string, updates: Partial<RoutineExercise>) => {
    const routineKey = routineType === 'CLINIC' ? 'routine' : 'homeRoutine';
    const currentRoutine = patient[routineKey] || { days: [] };
    
    const newDays = currentRoutine.days.map(day => ({
        ...day,
        exercises: day.exercises.map(ex => ex.id === exerciseId ? { ...ex, ...updates } : ex)
    }));
    
    onUpdatePatient({ 
      ...patient, 
      [routineKey]: { ...currentRoutine, days: newDays } 
    });
  };

  const handleRemoveExercise = (dayId: string, exerciseId: string) => {
    const routineKey = routineType === 'CLINIC' ? 'routine' : 'homeRoutine';
    const currentRoutine = patient[routineKey] || { days: [] };

    const newDays = currentRoutine.days.map(day => 
        day.id === dayId ? { ...day, exercises: day.exercises.filter(ex => ex.id !== exerciseId) } : day
    );
    onUpdatePatient({ ...patient, [routineKey]: { ...currentRoutine, days: newDays } });
  };

  const handleUpdateStage = (newStage: Stage) => {
    onUpdatePatient({ ...patient, routine: { ...patient.routine, stage: newStage } });
  };

  const handleAddDay = () => {
    const routineKey = routineType === 'CLINIC' ? 'routine' : 'homeRoutine';
    const currentRoutine = patient[routineKey] || { id: `r-${Date.now()}`, stage: Stage.KINESIOLOGY, currentWeek: 1, days: [] };
    
    if (currentRoutine.days.length >= 7) return;
    const newDay: RoutineDay = { id: `day-${Date.now()}`, name: `Día ${currentRoutine.days.length + 1}`, exercises: [] };
    onUpdatePatient({ ...patient, [routineKey]: { ...currentRoutine, days: [...currentRoutine.days, newDay] } });
  };

  const handleRemoveLastDay = () => {
    const routineKey = routineType === 'CLINIC' ? 'routine' : 'homeRoutine';
    const currentRoutine = patient[routineKey];
    if (!currentRoutine) return;

    const lastDay = currentRoutine.days[currentRoutine.days.length - 1];
    if (currentRoutine.days.length <= 1 || lastDay.exercises.length > 0) return;
    onUpdatePatient({ ...patient, [routineKey]: { ...currentRoutine, days: currentRoutine.days.slice(0, -1) } });
  };

  const handleRenameDay = (dayId: string, newName: string) => {
    const routineKey = routineType === 'CLINIC' ? 'routine' : 'homeRoutine';
    const currentRoutine = patient[routineKey];
    if (!currentRoutine) return;

    const newDays = currentRoutine.days.map(day => day.id === dayId ? { ...day, name: newName } : day);
    onUpdatePatient({ ...patient, [routineKey]: { ...currentRoutine, days: newDays } });
  };

  const handleMarkAttended = () => {
    onUpdatePatient({ ...patient, checkInStatus: CheckInStatus.ATTENDED });
  };

  const handleAddNote = () => {
    if(!notes.trim()) return;
    const updatedHistory = [`Nota: ${notes}`, ...(patient.history || [])];
    onUpdatePatient({ ...patient, history: updatedHistory });
    setNotes('');
    setShowHistory(false);
  };

  // --- LÓGICA DE BISERIE/TRISERIE ---
  const handleGroupAsSuperset = (dayId: string, exIds: string[]) => {
    if (exIds.length < 2) return;
    const groupId = `superset_${Date.now()}`;
    const routineKey = routineType === 'CLINIC' ? 'routine' : 'homeRoutine';
    const currentRoutine = patient[routineKey] || { days: [] };
    const newDays = currentRoutine.days.map(day => {
      if (day.id !== dayId) return day;
      return {
        ...day,
        exercises: day.exercises.map(ex =>
          exIds.includes(ex.id) ? { ...ex, supersetGroup: groupId } : ex
        )
      };
    });
    onUpdatePatient({ ...patient, [routineKey]: { ...currentRoutine, days: newDays } });
    setEditorSelectedExIds([]);
  };

  const handleRemoveFromSuperset = (dayId: string, exIds: string[]) => {
    const routineKey = routineType === 'CLINIC' ? 'routine' : 'homeRoutine';
    const currentRoutine = patient[routineKey] || { days: [] };
    const newDays = currentRoutine.days.map(day => {
      if (day.id !== dayId) return day;
      return {
        ...day,
        exercises: day.exercises.map(ex =>
          exIds.includes(ex.id) ? { ...ex, supersetGroup: undefined } : ex
        )
      };
    });
    onUpdatePatient({ ...patient, [routineKey]: { ...currentRoutine, days: newDays } });
    setEditorSelectedExIds([]);
  };

  // Paleta de colores para grupos de superseries
  const supersetPalette = [
    { bg: 'bg-indigo-500', text: 'text-indigo-600', key: 'indigo' },
    { bg: 'bg-emerald-500', text: 'text-emerald-600', key: 'emerald' },
    { bg: 'bg-orange-500', text: 'text-orange-600', key: 'orange' },
    { bg: 'bg-pink-500', text: 'text-pink-600', key: 'pink' },
    { bg: 'bg-cyan-500', text: 'text-cyan-600', key: 'cyan' },
  ];

  // Calcula supersetLabel y color para cada ejercicio del día activo
  const getSupersetInfo = (exercises: RoutineExercise[]) => {
    const groupMap = new Map<string, { label: string; color: string }>();
    let groupIndex = 0;
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const result = new Map<string, { label: string; color: string }>();

    exercises.forEach(ex => {
      if (!ex.supersetGroup) return;
      if (!groupMap.has(ex.supersetGroup)) {
        const idx = groupIndex % supersetPalette.length;
        groupMap.set(ex.supersetGroup, { label: letters[idx] || String.fromCharCode(65 + idx), color: supersetPalette[idx].bg });
        groupIndex++;
      }
    });

    // Asigna etiqueta numérica dentro del grupo (A1, A2, etc.)
    const groupCounters = new Map<string, number>();
    exercises.forEach(ex => {
      if (!ex.supersetGroup) return;
      const info = groupMap.get(ex.supersetGroup)!;
      const count = (groupCounters.get(ex.supersetGroup) || 0) + 1;
      groupCounters.set(ex.supersetGroup, count);
      const seriesName = count === 1 ? (groupCounters.size > 1 ? `Biserie ${info.label}` : 'Biserie 1') : `Biserie ${count}`;
      result.set(ex.id, { label: `${info.label}${count}`, color: info.color });
    });

    return result;
  };

  // Helper para color RPE en historial
  const getRpeColor = (rpe: number) => {
      const hue = Math.max(0, 120 - (rpe - 1) * (120 / 9));
      return `hsl(${hue}, 80%, 40%)`;
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-50 overflow-hidden relative">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-primary-50 to-transparent opacity-60 z-0 pointer-events-none"></div>

      {/* HEADER DINÁMICO */}
      <header className="glass-panel border-b border-slate-200/50 px-6 py-4 flex items-center justify-between shrink-0 z-30 pt-[calc(1rem+var(--sat))] relative shadow-sm">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-4 hover:-translate-y-0.5 transition-transform">
            <img src={patient.photoUrl} alt="" className="w-12 h-12 rounded-2xl object-cover shadow-sm bg-white" />
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-none truncate tracking-tight">
                    {patient.firstName} {patient.lastName}
                </h2>
                {/* BADGE DE SEMANA - SE ACTUALIZA CON LA PROP */}
                <div key={currentWeek} className="bg-primary-600 text-white text-[10px] px-3 py-1.5 rounded-[1rem] font-bold shadow-lg shadow-primary-500/20 flex items-center gap-1.5 animate-in zoom-in fade-in duration-500">
                    <Calendar size={12} strokeWidth={2.5} />
                    Semana {currentWeek}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-xs text-slate-500 font-medium truncate leading-none bg-slate-100/80 px-2 py-0.5 rounded-md">{patient.condition}</p>
                <p className="text-xs text-slate-400 font-bold truncate leading-none uppercase tracking-wider">{patient.dni}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 items-center">
            {patient.checkInStatus === CheckInStatus.IN_ROOM && (
              <button 
                onClick={handleMarkAttended}
                className="bg-emerald-500 text-white px-4 py-2.5 rounded-[1.25rem] font-bold text-xs hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-95"
              >
                <CheckCircle2 size={16} strokeWidth={2.5} /> <span className="hidden md:inline">Marcar Atendido</span>
              </button>
            )}
            <span className={`hidden md:flex px-4 py-2 rounded-[1.25rem] text-xs font-bold uppercase tracking-wide border shadow-sm ${patient.routine.stage === Stage.KINESIOLOGY ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-teal-50 border-teal-100 text-teal-600'}`}>
                {patient.routine.stage}
            </span>
            {isKine && (
                <button onClick={() => setShowRoutineEditor(true)} className="bg-slate-900 text-white px-4 py-2.5 rounded-[1.25rem] font-bold text-xs hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl shadow-slate-900/20 active:scale-95">
                    <Edit2 size={14} /> <span className="hidden md:inline">Editar Rutina</span>
                </button>
            )}
            <button onClick={() => setShowHistory(!showHistory)} className={`p-2.5 rounded-[1.25rem] border shadow-sm transition-all active:scale-95 ${showHistory ? 'bg-primary-50 border-primary-200 text-primary-600' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'}`}>
                <FileText size={18} />
            </button>
        </div>
      </header>

      {showHistory && (
          <div className="bg-white/80 backdrop-blur-md text-slate-900 p-4 shadow-xl z-20 border-b border-slate-200 animate-in slide-in-from-top-2 duration-300 relative">
              <div className="max-w-4xl mx-auto flex gap-4 items-center">
                  <textarea className="flex-1 h-14 bg-white/50 backdrop-blur-sm text-slate-700 p-3 rounded-[1.25rem] border border-slate-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none resize-none text-sm shadow-inner transition-all font-medium" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Añadir una nota a la historia clínica..." />
                  <button onClick={handleAddNote} className="bg-primary-600 text-white p-4 rounded-[1.25rem] hover:bg-primary-700 hover:-translate-y-0.5 active:scale-95 transition-all shadow-xl shadow-primary-500/20"><Save size={20}/></button>
              </div>
          </div>
      )}

      {/* SUB-NAV CON BOTÓN DE CIERRE DE SEMANA */}
      <div className="bg-white/50 backdrop-blur-sm border-b border-slate-200/60 px-6 flex justify-between shrink-0 h-20 items-center relative z-10 shadow-sm">
          <div className="flex gap-2 overflow-x-auto no-scrollbar items-center h-full pt-4">
            <div className="flex bg-slate-200/50 p-1 rounded-2xl mr-6 shrink-0 shadow-inner">
              <button 
                onClick={() => setRoutineType('CLINIC')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 ${routineType === 'CLINIC' ? 'bg-white text-primary-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Clínica
              </button>
              <button 
                onClick={() => setRoutineType('HOME')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 ${routineType === 'HOME' ? 'bg-white text-primary-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Domicilio
              </button>
            </div>

            {(routineType === 'CLINIC' ? patient.routine : (patient.homeRoutine || { days: [] })).days.map((day) => (
              <button key={day.id} onClick={() => {setActiveDayId(day.id); setViewMode('daily');}} className={`px-6 h-full rounded-t-3xl font-black text-xs uppercase tracking-wide transition-all border-t-2 border-x-2 ${activeDayId === day.id && viewMode === 'daily' ? 'bg-slate-50/80 border-slate-200/60 text-primary-600 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]' : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'} relative`}>
                {day.name}
                {activeDayId === day.id && viewMode === 'daily' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500 rounded-t-full"></div>}
              </button>
            ))}
            
            <div className="w-px h-8 bg-slate-300/50 mx-4 shrink-0"></div>
            
            <button 
                onClick={handleStartNewWeek}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-[1.25rem] font-black text-xs uppercase tracking-wide shadow-xl shadow-indigo-500/20 hover:-translate-y-0.5 hover:shadow-indigo-500/30 active:scale-95 transition-all shrink-0 mr-4"
            >
                <ChevronRightCircle size={18} strokeWidth={2.5} />
                Finalizar Semana
            </button>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-300/50 pl-6 ml-2 shrink-0">
              <button onClick={() => setViewMode('plan')} title="Proyección Mensual" className={`p-3 rounded-2xl transition-all shadow-sm active:scale-95 ${viewMode === 'plan' ? 'bg-primary-600 text-white shadow-primary-500/20 shadow-lg' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}><Layers size={20} strokeWidth={2.5} /></button>
              <button onClick={() => setViewMode('stats')} title="Estadísticas" className={`p-3 rounded-2xl transition-all shadow-sm active:scale-95 ${viewMode === 'stats' ? 'bg-slate-900 text-white shadow-slate-900/20 shadow-lg' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}><BarChart2 size={20} strokeWidth={2.5} /></button>
              <button onClick={() => setViewMode('evaluations')} title="Evaluaciones Clínicas" className={`p-3 rounded-2xl transition-all shadow-sm active:scale-95 ${viewMode === 'evaluations' ? 'bg-blue-600 text-white shadow-blue-500/20 shadow-lg' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}><Award size={20} strokeWidth={2.5} /></button>
          </div>
      </div>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-container relative z-10">
        <div className="max-w-5xl mx-auto h-full">
          {/* VISTA DIARIA */}
          {viewMode === 'daily' && activeDay ? (
              <div className="space-y-6 max-w-2xl mx-auto pb-24 animate-fade-in">
                  <div className="flex justify-between items-end px-2 mb-4 bg-white/50 backdrop-blur py-4 rounded-2xl shadow-sm border border-slate-200/50">
                      <div className="flex flex-col px-4">
                        <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Calendar size={12}/> Plan del Día</span>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{activeDay.name}</h3>
                      </div>
                      <div className="px-4">
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">Ciclo Semana {currentWeek}</span>
                      </div>
                  </div>
                  {(() => {
                      const supersetInfo = getSupersetInfo(activeDay.exercises);
                      return activeDay.exercises.map((ex, idx) => {
                        const ssInfo = supersetInfo.get(ex.id);
                        return (
                          <div className="animate-slide-up" style={{ animationDelay: `${idx * 40}ms` }} key={ex.id}>
                            <ExerciseCard
                              exercise={ex}
                              role={role}
                              onUpdate={(id, up) => handleExerciseUpdate(id, up)}
                              onShowHistory={(e) => setChartExercise(e)}
                              onDelete={(id) => handleRemoveExercise(activeDayId, id)}
                              supersetLabel={ssInfo?.label}
                              supersetColor={ssInfo?.color}
                            />
                          </div>
                        );
                      });
                  })()}
                  {activeDay.exercises.length === 0 && (
                    <div className="py-24 text-center glass-panel rounded-[2rem] border-dashed">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                            <Activity className="text-slate-400" size={32} />
                        </div>
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Día sin ejercicios</p>
                    </div>
                  )}
              </div>

          ) : viewMode === 'plan' ? (
              /* PLAN MENSUAL (PROYECCIÓN FUTURA) */
              <div className="space-y-12 pb-24 max-w-5xl mx-auto animate-slide-up">
                  <div className="text-center space-y-3 mb-10">
                      <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Proyección Mensual</h3>
                      <p className="text-sm font-bold text-slate-500">Vista anticipada de las próximas semanas de entrenamiento</p>
                  </div>

                  {/* Mostramos 4 semanas: actual y 3 siguientes */}
                  <div className="space-y-8">
                  {[0, 1, 2, 3].map((offset) => {
                      const weekNum = currentWeek + offset;
                      const isCurrent = offset === 0;
                      return (
                        <div key={weekNum} className={`glass-card overflow-hidden transition-all duration-300 ${isCurrent ? 'border-primary-200 ring-4 ring-primary-100 shadow-xl scale-[1.01] z-10' : 'border-slate-200/60 opacity-90 hover:opacity-100'}`}>
                            <div className={`px-8 py-6 flex justify-between items-center bg-white border-b border-slate-100 ${isCurrent ? 'bg-primary-50/50' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <h4 className={`font-black text-lg uppercase tracking-wide ${isCurrent ? 'text-primary-700' : 'text-slate-800'}`}>Semana {weekNum}</h4>
                                    {isCurrent && <span className="bg-primary-600 text-white px-3 py-1 rounded-[1rem] text-[10px] font-black uppercase shadow-sm">SEMANA ACTUAL</span>}
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isCurrent ? 'text-primary-400' : 'text-slate-400'}`}>Proyección</span>
                            </div>
                            <div className="p-8 overflow-x-auto no-scrollbar bg-slate-50/30">
                                <div className="flex gap-6 min-w-max pb-4">
                                    {patient.routine.days.map((day, idx) => (
                                        <div key={`${weekNum}-${day.id}`} className="w-64 shrink-0 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200/60 transition-transform hover:-translate-y-1 duration-300">
                                            <p className="text-xs font-black text-slate-500 uppercase mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                                                <span>Día {idx+1}</span>
                                                <span className="text-[10px] opacity-50 bg-slate-100 px-2 py-0.5 rounded-md">{day.name}</span>
                                            </p>
                                            <div className="space-y-4">
                                                {day.exercises.map(ex => (
                                                    <div key={`${weekNum}-${ex.id}`} className="flex flex-col gap-2 relative">
                                                        <span className="text-[11px] font-extrabold text-slate-800 leading-tight">{ex.definition.name}</span>
                                                        <div className="flex justify-between items-center">
                                                          <span className="text-[11px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{ex.targetSets}x{ex.targetReps}</span>
                                                          <span className="text-[12px] font-black text-primary-600">{ex.targetLoad}kg</span>
                                                        </div>
                                                        <div className="h-px bg-slate-100 mt-2"></div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                      );
                  })}
                  </div>
              </div>
          ) : viewMode === 'stats' ? (
              /* VISTA DE HISTORIAL REAL (CRONOLÓGICO) */
              <div className="space-y-12 pb-24 max-w-5xl mx-auto animate-slide-up">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="glass-card p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 inline-flex items-center gap-1.5"><Calendar size={14}/> Semana Activa</span>
                          <span className="text-6xl font-black text-slate-900 relative z-10">{currentWeek}</span>
                      </div>
                      <div className="glass-card p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 inline-flex items-center gap-1.5"><TrendingUp size={14}/> Progreso Global</span>
                          <span className="text-6xl font-black text-indigo-600 relative z-10">{(historyWeeksAscending.length * 10)}%</span>
                      </div>
                      <div className="glass-card p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 inline-flex items-center gap-1.5"><CheckSquare size={14}/> Semanas Guard.</span>
                          <span className="text-6xl font-black text-emerald-500 relative z-10">{historyWeeksAscending.length}</span>
                      </div>
                  </div>

                  <div className="space-y-8 mt-16">
                      <div className="flex items-center gap-4 px-2 mb-8">
                        <div className="p-3 bg-slate-900 rounded-[1.25rem] text-white shadow-xl shadow-slate-900/20"><History size={24} /></div>
                        <h4 className="font-black text-2xl uppercase text-slate-900 tracking-tight">Historial Cronológico</h4>
                      </div>
                      
                      {historyWeeksAscending.length > 0 ? (
                        historyWeeksAscending.map((weekNum, index) => {
                            let weekDate = "Sin fecha";
                            for (const day of patient.routine.days) {
                                for (const ex of day.exercises) {
                                    const log = ex.history?.find(h => h.week === weekNum);
                                    if (log) { weekDate = log.date; break; }
                                }
                                if (weekDate !== "Sin fecha") break;
                            }

                            return (
                                <div key={weekNum} className="glass-panel overflow-hidden transition-all duration-300 border-slate-200/60 shadow-sm hover:shadow-md">
                                    <div className="bg-slate-900/95 backdrop-blur px-8 py-6 flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <h4 className="text-white font-black text-lg uppercase tracking-wide">Semana {weekNum}</h4>
                                            <span className="bg-slate-800 text-slate-300 px-4 py-1.5 rounded-[1rem] text-[10px] font-bold shadow-sm border border-slate-700/50 inline-flex items-center gap-1.5"><Calendar size={12}/> {weekDate}</span>
                                        </div>
                                        <span className="text-emerald-400 text-xs font-black uppercase tracking-widest inline-flex items-center gap-1"><CheckCircle2 size={14}/> Completada</span>
                                    </div>
                                    <div className="p-8 overflow-x-auto no-scrollbar bg-white/40">
                                        <div className="flex gap-6 min-w-max pb-4">
                                            {patient.routine.days.map((day, idx) => {
                                                const exercisesInWeek = day.exercises
                                                    .map(ex => {
                                                        const log = ex.history?.find(h => h.week === weekNum);
                                                        return log ? { ...ex, log } : null;
                                                    })
                                                    .filter((item): item is (RoutineExercise & { log: ExerciseLog }) => item !== null);

                                                return (
                                                    <div key={`${weekNum}-${day.id}`} className={`w-72 shrink-0 rounded-[2rem] p-6 border transition-all ${exercisesInWeek.length > 0 ? 'bg-white shadow-sm border-slate-200/60' : 'bg-slate-50/50 border-slate-200 border-dashed opacity-50'}`}>
                                                        <p className={`text-xs font-black uppercase mb-5 pb-3 border-b flex justify-between items-center ${exercisesInWeek.length > 0 ? 'text-slate-500 border-slate-100' : 'text-slate-300 border-slate-100'}`}>
                                                            <span>Día {idx+1}</span>
                                                            <span className="text-[10px] uppercase font-bold opacity-70 bg-slate-100 px-2 py-0.5 rounded-md">{day.name}</span>
                                                        </p>
                                                        
                                                        {exercisesInWeek.length > 0 ? (
                                                            <div className="space-y-4">
                                                                {exercisesInWeek.map(item => (
                                                                    <div key={`${weekNum}-${item.id}`} className="flex flex-col gap-2 relative border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                                                                        {/* Indicador de RPE tipo tag */}
                                                                        <div className="flex justify-between items-start gap-2">
                                                                          <span className="text-xs font-extrabold text-slate-800 leading-tight">{item.definition.name}</span>
                                                                          <span className="text-[9px] font-black text-white px-2 py-1 rounded-md shrink-0 shadow-sm" style={{backgroundColor: getRpeColor(item.log.rpe)}}>RPE {item.log.rpe}</span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center mt-1">
                                                                          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                                                            {item.definition.metricType === 'time' ? `${item.log.load}s` : `${item.log.reps} reps`}
                                                                          </span>
                                                                          <span className="text-[13px] font-black text-primary-600">
                                                                              {item.definition.metricType === 'time' ? '' : `${item.log.load}kg`}
                                                                          </span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="py-8 text-center flex flex-col items-center opacity-60">
                                                              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-2"><History className="text-slate-300" size={16}/></div>
                                                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sin registros</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                      ) : (
                          <div className="p-16 text-center glass-panel rounded-[2rem] border-dashed">
                              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50"><History className="text-slate-400" size={32}/></div>
                              <p className="text-slate-500 font-black text-xl uppercase tracking-widest mb-2">No hay historial</p>
                              <p className="text-slate-400 font-bold text-sm">Completa una semana para ver los registros aquí.</p>
                          </div>
                      )}
                  </div>
              </div>
          ) : viewMode === 'evaluations' ? (
              <EvaluationDashboard patient={patient} role={role} kineId={kineId} />
          ) : null}
        </div>
      </main>

      {/* MODALES REUTILIZANDO ESTILOS MODERNOS (como en RecepcionView) */}
      {showRoutineEditor && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex flex-col pt-[var(--sat)] animate-fade-in p-4 md:p-8">
              <div className="bg-white flex-1 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up relative">
                  <header className="bg-white border-b border-slate-100 px-6 sm:px-8 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between shrink-0 gap-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                          <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Editor de Rutina</h2>
                            <p className="text-sm font-medium text-slate-500 mt-1">Modifica la estructura y ejercicios</p>
                          </div>
                          
                          <div className="w-px h-10 bg-slate-200 hidden sm:block mx-2"></div>
                          
                          <div className="flex flex-wrap gap-4">
                            <div className="flex bg-slate-100/80 p-1 rounded-2xl shadow-inner border border-slate-200/50">
                                <button onClick={() => handleUpdateStage(Stage.KINESIOLOGY)} className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide transition-all ${patient.routine.stage === Stage.KINESIOLOGY ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>Kinesiología</button>
                                <button onClick={() => handleUpdateStage(Stage.GYM)} className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide transition-all ${patient.routine.stage === Stage.GYM ? 'bg-white text-teal-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>Gimnasio</button>
                            </div>
                            <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-2xl border border-slate-200 shadow-sm">
                                <button onClick={handleRemoveLastDay} className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"><Minus size={20}/></button>
                                <div className="flex flex-col items-center min-w-[50px]"><span className="text-xl font-black leading-none">{patient.routine.days.length}</span><span className="text-[9px] font-bold uppercase text-slate-400 tracking-widest mt-0.5">Días</span></div>
                                <button onClick={handleAddDay} disabled={patient.routine.days.length >= 7} className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-primary-50 hover:text-primary-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"><Plus size={20}/></button>
                            </div>
                          </div>
                      </div>
                      <button onClick={() => setShowRoutineEditor(false)} className="absolute top-6 right-6 w-12 h-12 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 transition-colors shadow-sm"><X size={24} /></button>
                  </header>
                  <div className="flex-1 overflow-x-auto p-6 sm:p-8 bg-slate-50/50">
                      <div className="flex items-start gap-6 h-full min-w-max pb-10">
                          {(routineType === 'CLINIC' ? patient.routine : (patient.homeRoutine || { days: [] })).days.map((day, dIdx) => (
                              <div key={day.id} className="w-[22rem] bg-white rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full shrink-0 overflow-hidden">
                                  <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-2">
                                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Día {dIdx+1}</div>
                                      <input className="font-black text-xl text-slate-900 bg-transparent border-none focus:ring-0 p-0 w-full placeholder:text-slate-300 focus:outline-none" value={day.name} onChange={(e) => handleRenameDay(day.id, e.target.value)} placeholder="Nombre del día" />
                                  </div>
                                  <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-container bg-white">
                                      {/* Toolbar de Biserie/Triserie */}
                                      {editorSelectedExIds.length >= 1 && (
                                        <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 mb-2 gap-2 flex-wrap">
                                          <span className="text-xs font-black text-indigo-700">{editorSelectedExIds.length} seleccionado{editorSelectedExIds.length > 1 ? 's' : ''}</span>
                                          <div className="flex gap-2">
                                            <button
                                              disabled={editorSelectedExIds.length < 2}
                                              onClick={() => handleGroupAsSuperset(day.id, editorSelectedExIds)}
                                              className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-black disabled:opacity-40 hover:bg-indigo-700 transition-all"
                                            >
                                              <Link2 size={12} /> Biserie/Triserie
                                            </button>
                                            <button
                                              onClick={() => handleRemoveFromSuperset(day.id, editorSelectedExIds)}
                                              className="flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 text-slate-500 rounded-lg text-[10px] font-black hover:bg-red-50 hover:text-red-500 transition-all"
                                            >
                                              <Unlink size={12} /> Desagrupar
                                            </button>
                                            <button
                                              onClick={() => setEditorSelectedExIds([])}
                                              className="p-1 text-slate-400 hover:text-slate-600"
                                            >
                                              <X size={14} />
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                      {(() => {
                                        const supersetInfo = getSupersetInfo(day.exercises);
                                        return day.exercises.map((ex) => {
                                          const isSelectedInEditor = editorSelectedExIds.includes(ex.id);
                                          const hasSupersetGroup = !!ex.supersetGroup;
                                          const ssInfo = supersetInfo.get(ex.id);
                                          return (
                                            <div key={ex.id} className={`flex flex-col gap-3 p-4 bg-white rounded-2xl border shadow-sm transition-all group relative ${isSelectedInEditor ? 'border-indigo-400 ring-2 ring-indigo-100' : hasSupersetGroup ? `border-l-4 ${ssInfo?.color || 'border-l-indigo-400'} border-slate-200` : 'border-slate-200 hover:border-primary-300'}`}>
                                              {/* Checkbox de selección */}
                                              <button
                                                onClick={() => setEditorSelectedExIds(prev =>
                                                  prev.includes(ex.id) ? prev.filter(id => id !== ex.id) : [...prev, ex.id]
                                                )}
                                                className={`absolute top-3 left-3 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all z-10 ${isSelectedInEditor ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-slate-300 hover:border-indigo-400'}`}
                                              >
                                                {isSelectedInEditor && <CheckSquare size={12} className="text-white" />}
                                              </button>
                                              {hasSupersetGroup && !isSelectedInEditor && (
                                                <span className={`absolute top-3 right-10 text-[9px] font-black text-white ${ssInfo?.color || 'bg-indigo-500'} px-2 py-0.5 rounded-full uppercase tracking-wider`}>
                                                  Serie {ssInfo?.label}
                                                </span>
                                              )}
                                              <div className="flex items-start justify-between gap-3 pl-7">
                                                  {(() => {
                                                    const media = ex.definition.videoUrl ? parseMediaUrl(ex.definition.videoUrl) : null;
                                                    if (media && (media.thumbnailUrl || media.type === 'instagram')) {
                                                      return (
                                                        <button 
                                                          onClick={() => setZoomedImage({ url: ex.definition.videoUrl || '', name: ex.definition.name })}
                                                          className={`w-12 h-12 rounded-[1rem] object-cover shadow-sm overflow-hidden relative group cursor-zoom-in ${media.type === 'instagram' ? 'bg-gradient-to-br from-pink-400 to-purple-600' : 'bg-slate-100'}`}
                                                        >
                                                          {media.thumbnailUrl ? (
                                                            <img src={media.thumbnailUrl} className="w-full h-full object-cover" />
                                                          ) : (
                                                            <Activity size={14} className="text-white" />
                                                          )}
                                                          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                            <Maximize2 size={14} className="text-white" />
                                                          </div>
                                                        </button>
                                                      );
                                                    }
                                                    return (
                                                      <div className="w-12 h-12 rounded-[1rem] bg-slate-100 flex items-center justify-center shadow-inner">
                                                          {ex.definition.metricType === 'time' ? <Timer size={20} className="text-slate-400"/> : <Dumbbell size={20} className="text-slate-400"/>}
                                                      </div>
                                                    );
                                                  })()}
                                                  <div className="flex-1 min-w-0 pr-6 mt-1">
                                                    <p className="font-extrabold text-sm text-slate-900 leading-tight group-hover:text-primary-600 transition-colors">{ex.definition.name}</p>
                                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1">{ex.definition.category}</p>
                                                  </div>
                                                  <button onClick={() => handleRemoveExercise(day.id, ex.id)} className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 hover:text-white hover:bg-red-500 rounded-lg transition-all opacity-0 group-hover:opacity-100 shadow-sm"><Trash2 size={16}/></button>
                                              </div>
                                              <div className="grid grid-cols-3 gap-2 mt-2">
                                                  <div className="bg-slate-50 rounded-xl p-2 border border-slate-100 flex flex-col focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all items-center">
                                                    <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">Series</span>
                                                    <input type="number" className="w-full bg-transparent text-center font-black text-base text-slate-900 focus:outline-none p-0 border-none" value={ex.targetSets} onChange={e => handleExerciseUpdate(ex.id, {targetSets: Number(e.target.value)})} />
                                                  </div>
                                                  
                                                  <div className="bg-slate-50 rounded-xl p-2 border border-slate-100 flex flex-col focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all items-center">
                                                    <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">{ex.definition.metricType === 'time' ? '' : 'Reps'}</span>
                                                    {ex.definition.metricType === 'time' ? (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold">-</div>
                                                    ) : (
                                                        <input type="number" className="w-full bg-transparent text-center font-black text-base text-slate-900 focus:outline-none p-0 border-none" value={ex.targetReps} onChange={e => handleExerciseUpdate(ex.id, {targetReps: Number(e.target.value)})} />
                                                    )}
                                                  </div>


                                                  <div className="bg-slate-50 rounded-xl p-2 border border-slate-100 flex flex-col focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all items-center">
                                                    <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">{ex.definition.metricType === 'time' ? 'Seg.' : 'Kg'}</span>
                                                    <input type="number" className="w-full bg-transparent text-center font-black text-base text-primary-600 focus:outline-none p-0 border-none" value={ex.targetLoad} onChange={e => handleExerciseUpdate(ex.id, {targetLoad: Number(e.target.value)})} />
                                                  </div>
                                              </div>
                                          </div>
                                        );
                                      });
                                    })()}

                                      <button onClick={() => setIsAddingExerciseModal({show: true, dayId: day.id})} className="w-full py-8 border-2 border-dashed border-slate-200 rounded-[1.5rem] bg-slate-50/50 text-sm font-bold text-slate-400 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-all flex flex-col items-center gap-3">
                                          <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center"><Plus size={24} /></div>
                                          Agregar Ejercicio
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {chartExercise && <ProgressChart exercise={chartExercise} onClose={() => setChartExercise(null)} />}
      
      {isAddingExerciseModal.show && (
          <div className="fixed inset-0 z-[350] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-xl h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up relative">
                  <div className="p-8 border-b border-slate-100 flex flex-col gap-6 relative">
                      <div className="pr-12">
                         <h3 className="text-2xl font-black text-slate-900 tracking-tight">Biblioteca de Ejercicios</h3>
                         <p className="text-sm font-medium text-slate-500">Selecciona los ejercicios para agregar a este día.</p>
                      </div>
                      <div className="relative group">
                          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={22} />
                          <input type="text" placeholder="Buscar por nombre o músculo..." className="w-full pl-14 pr-6 py-4 bg-slate-100/80 border border-slate-200/50 rounded-[1.5rem] text-base font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all" value={exerciseSearch} onChange={e => setExerciseSearch(e.target.value)} />
                      </div>
                      <button onClick={() => { setIsAddingExerciseModal({show:false, dayId:''}); setSelectedExerciseIds([]); }} className="absolute top-8 right-8 w-12 h-12 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 transition-colors shadow-sm"><X size={24}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/50 scroll-container">
                      {exercises.filter(ex => ex.name.toLowerCase().includes(exerciseSearch.toLowerCase())).map(ex => {
                          const isSelected = selectedExerciseIds.includes(ex.id);
                          return (
                              <button key={ex.id} onClick={() => setSelectedExerciseIds(prev => isSelected ? prev.filter(i => i !== ex.id) : [...prev, ex.id])} className={`w-full flex items-center p-5 rounded-[1.5rem] border-2 transition-all duration-300 text-left ${isSelected ? 'bg-primary-50/50 border-primary-500 shadow-md ring-4 ring-primary-500/10' : 'bg-white border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300'}`}>
                                  <div className="mr-5 flex-shrink-0 relative">
                                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-primary-500 border-primary-500' : 'bg-transparent border-slate-300'}`}>
                                        {isSelected && <CheckCircle2 size={16} className="text-white"/>}
                                    </div>
                                  </div>
                                  <div className="relative shrink-0 mr-5">
                                    {(() => {
                                      const media = ex.videoUrl ? parseMediaUrl(ex.videoUrl) : null;
                                      if (media && (media.thumbnailUrl || media.type === 'instagram')) {
                                        return (
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setZoomedImage({ url: ex.videoUrl || '', name: ex.name });
                                            }}
                                            className={`w-16 h-16 rounded-[1.25rem] object-cover shadow-sm overflow-hidden relative group cursor-zoom-in flex items-center justify-center ${media.type === 'instagram' ? 'bg-gradient-to-br from-pink-400 to-purple-600' : 'bg-slate-100'}`}
                                          >
                                            {media.thumbnailUrl ? (
                                              <img src={media.thumbnailUrl} className="w-full h-full object-cover" />
                                            ) : (
                                              <Activity size={24} className="text-white" />
                                            )}
                                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                              <Maximize2 size={16} className="text-white" />
                                            </div>
                                          </button>
                                        );
                                      }
                                      return (
                                        <div className="w-16 h-16 rounded-[1.25rem] bg-slate-100 flex items-center justify-center shadow-inner">
                                            {ex.metricType === 'time' ? <Timer size={24} className="text-slate-400"/> : <Dumbbell size={24} className="text-slate-400"/>}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <p className="font-black text-slate-800 text-base truncate mb-1">{ex.name}</p>
                                      <div className="flex gap-2">
                                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded flex items-center">{ex.category}</span>
                                          {ex.metricType === 'time' && <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded flex items-center">Por Tiempo</span>}
                                      </div>
                                  </div>
                              </button>
                          );
                      })}
                      {exercises.filter(ex => ex.name.toLowerCase().includes(exerciseSearch.toLowerCase())).length === 0 && (
                          <div className="py-20 text-center">
                              <Search className="mx-auto text-slate-300 mb-4" size={40}/>
                              <p className="text-slate-500 font-bold text-lg">No se encontraron rutinas</p>
                              <p className="text-slate-400 text-sm mt-1">Prueba usando otro término de búsqueda.</p>
                          </div>
                      )}
                  </div>
                  <div className="p-8 bg-white border-t border-slate-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                        <button disabled={selectedExerciseIds.length === 0} className="bg-slate-900 text-white flex items-center justify-center gap-3 w-full py-5 rounded-[1.5rem] font-black text-base shadow-xl shadow-slate-900/20 disabled:opacity-50 disabled:shadow-none hover:bg-black active:scale-95 transition-all" onClick={() => {
                                const newExs: RoutineExercise[] = selectedExerciseIds.map(id => {
                                    const def = exercises.find(e => e.id === id)!;
                                    return {
                                        id: `re-${Date.now()}-${id}`, definitionId: id, definition: def,
                                        targetSets: 3, targetReps: def.metricType === 'time' ? 0 : 12, targetLoad: 0, isDone: false, history: []
                                    };
                                });
                                const routineKey = routineType === 'CLINIC' ? 'routine' : 'homeRoutine';
                                const currentRoutine = patient[routineKey] || { id: `r-${Date.now()}`, stage: Stage.KINESIOLOGY, currentWeek: 1, days: [] };
                                const newDays = currentRoutine.days.map(d => d.id === isAddingExerciseModal.dayId ? { ...d, exercises: [...d.exercises, ...newExs] } : d);
                                onUpdatePatient({ ...patient, [routineKey]: { ...currentRoutine, days: newDays } });
                                setIsAddingExerciseModal({show:false, dayId:''});
                                setSelectedExerciseIds([]);
                            }}>
                                <CheckSquare size={22}/>
                                Confirmar {selectedExerciseIds.length > 0 ? selectedExerciseIds.length : ''} Ejercicio{selectedExerciseIds.length !== 1 ? 's' : ''}
                        </button>
                  </div>
              </div>
          </div>
      )}

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[500] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
          onClick={() => setZoomedImage(null)}
        >
          <div 
            className="relative bg-white rounded-[2.5rem] overflow-hidden shadow-2xl max-w-2xl w-full animate-in zoom-in-95 duration-300 cursor-default"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setZoomedImage(null)}
              className="absolute top-6 right-6 z-10 p-3 bg-white/80 backdrop-blur-md hover:bg-white rounded-full text-slate-900 transition-all shadow-lg active:scale-95"
            >
              <X size={24} />
            </button>
            <div className="aspect-video bg-slate-100 flex items-center justify-center">
              <img src={zoomedImage.url} alt={zoomedImage.name} className="max-w-full max-h-full object-contain block" />
            </div>
            <div className="p-8">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{zoomedImage.name}</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Biblioteca de Ejercicios</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};