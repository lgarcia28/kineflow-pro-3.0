import React, { useState, useEffect, useMemo } from 'react';
import { Patient, RoutineExercise, Stage, UserRole, RoutineDay, ExerciseLog, ExerciseDefinition } from '../types';
import { ExerciseCard } from './ExerciseCard';
import { ProgressChart } from './ProgressChart';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
    FileText, Plus, Search, X, Calendar, Trash2, Edit2, Save,
    Activity, Minus, Layers, TrendingUp, CheckSquare, Square, BarChart2, CheckCircle2, History, ChevronRightCircle, Timer, Dumbbell
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
  const [activeDayId, setActiveDayId] = useState<string>(patient.routine.days[0]?.id || '');
  const [viewMode, setViewMode] = useState<'daily' | 'plan' | 'stats'>('daily');
  const [showHistory, setShowHistory] = useState(false);
  const [showRoutineEditor, setShowRoutineEditor] = useState(false);
  
  // Estados para modales y edición
  const [chartExercise, setChartExercise] = useState<RoutineExercise | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [isAddingExerciseModal, setIsAddingExerciseModal] = useState<{show: boolean, dayId: string}>({show: false, dayId: ''});
  const [notes, setNotes] = useState('');

  const isKine = role === UserRole.KINE;
  
  // IMPORTANTE: Obtenemos el número de semana siempre de la prop patient
  const currentWeek = patient.routine.currentWeek || 1;

  // Sincronizar el día activo si cambia la rutina
  useEffect(() => {
    if (patient.routine.days.length > 0 && (!activeDayId || !patient.routine.days.find(d => d.id === activeDayId))) {
        setActiveDayId(patient.routine.days[0].id);
    }
  }, [patient.routine.days, activeDayId]);

  const activeDay = patient.routine.days.find(d => d.id === activeDayId);

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
    const newDays = patient.routine.days.map(day => ({
        ...day,
        exercises: day.exercises.map(ex => ex.id === exerciseId ? { ...ex, ...updates } : ex)
    }));
    onUpdatePatient({ ...patient, routine: { ...patient.routine, days: newDays } });
  };

  const handleRemoveExercise = (dayId: string, exerciseId: string) => {
    const newDays = patient.routine.days.map(day => 
        day.id === dayId ? { ...day, exercises: day.exercises.filter(ex => ex.id !== exerciseId) } : day
    );
    onUpdatePatient({ ...patient, routine: { ...patient.routine, days: newDays } });
  };

  const handleUpdateStage = (newStage: Stage) => {
    onUpdatePatient({ ...patient, routine: { ...patient.routine, stage: newStage } });
  };

  const handleAddDay = () => {
    if (patient.routine.days.length >= 7) return;
    const newDay: RoutineDay = { id: `day-${Date.now()}`, name: `Día ${patient.routine.days.length + 1}`, exercises: [] };
    onUpdatePatient({ ...patient, routine: { ...patient.routine, days: [...patient.routine.days, newDay] } });
  };

  const handleRemoveLastDay = () => {
    const lastDay = patient.routine.days[patient.routine.days.length - 1];
    if (patient.routine.days.length <= 1 || lastDay.exercises.length > 0) return;
    onUpdatePatient({ ...patient, routine: { ...patient.routine, days: patient.routine.days.slice(0, -1) } });
  };

  const handleRenameDay = (dayId: string, newName: string) => {
    const newDays = patient.routine.days.map(day => day.id === dayId ? { ...day, name: newName } : day);
    onUpdatePatient({ ...patient, routine: { ...patient.routine, days: newDays } });
  };

  const handleAddNote = () => {
    if(!notes.trim()) return;
    const updatedHistory = [`Nota: ${notes}`, ...(patient.history || [])];
    onUpdatePatient({ ...patient, history: updatedHistory });
    setNotes('');
    setShowHistory(false);
  };

  // Helper para color RPE en historial
  const getRpeColor = (rpe: number) => {
      const hue = Math.max(0, 120 - (rpe - 1) * (120 / 9));
      return `hsl(${hue}, 80%, 40%)`;
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-50 overflow-hidden relative">
      {/* HEADER DINÁMICO */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 z-30 pt-[calc(0.75rem+var(--sat))]">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-black text-slate-900 leading-none truncate uppercase tracking-tighter">
                {patient.firstName} {patient.lastName}
            </h2>
            {/* BADGE DE SEMANA - SE ACTUALIZA CON LA PROP */}
            <div key={currentWeek} className="bg-primary-600 text-white text-[10px] px-3 py-1 rounded-full font-black uppercase shadow-lg shadow-primary-200 flex items-center gap-1.5 animate-in zoom-in fade-in duration-500">
                <Calendar size={12} />
                Semana {currentWeek}
            </div>
          </div>
          <p className="text-[9px] text-slate-400 font-black mt-1.5 uppercase tracking-widest leading-none">{patient.condition}</p>
        </div>
        <div className="flex gap-2 items-center">
            <span className={`px-2.5 py-1.5 rounded-xl text-[8px] font-black uppercase ${patient.routine.stage === Stage.KINESIOLOGY ? 'bg-kine/10 text-kine' : 'bg-gym/10 text-gym'}`}>
                {patient.routine.stage}
            </span>
            {isKine && (
                <button onClick={() => setShowRoutineEditor(true)} className="bg-slate-900 text-white px-3 py-2 rounded-xl font-bold text-[9px] uppercase hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-md">
                    <Edit2 size={12} /> <span>Editar Rutina</span>
                </button>
            )}
            <button onClick={() => setShowHistory(!showHistory)} className={`p-2.5 rounded-xl border transition-all ${showHistory ? 'bg-primary-50 border-primary-200 text-primary-600' : 'bg-white border-slate-200 text-slate-400'}`}>
                <FileText size={18} />
            </button>
        </div>
      </header>

      {showHistory && (
          <div className="bg-slate-900 text-white p-3 shadow-xl z-20 border-b border-slate-800 animate-in slide-in-from-top duration-200">
              <div className="max-w-4xl mx-auto flex gap-4 items-center">
                  <textarea className="flex-1 h-12 bg-slate-800/50 text-slate-200 p-2 rounded-xl border border-slate-700 outline-none resize-none text-[10px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Escribir nota..." />
                  <button onClick={handleAddNote} className="bg-primary-600 text-white p-3 rounded-xl hover:bg-primary-500 transition-colors shadow-lg"><Save size={18}/></button>
              </div>
          </div>
      )}

      {/* SUB-NAV CON BOTÓN DE CIERRE DE SEMANA */}
      <div className="bg-white border-b border-slate-200 px-4 flex justify-between shrink-0 h-16 items-center">
          <div className="flex gap-1 overflow-x-auto no-scrollbar items-center h-full pt-3">
            {patient.routine.days.map((day) => (
              <button key={day.id} onClick={() => {setActiveDayId(day.id); setViewMode('daily');}} className={`px-5 h-full rounded-t-2xl font-black text-[10px] uppercase tracking-wider transition-all border-t border-x ${activeDayId === day.id && viewMode === 'daily' ? 'bg-slate-50 border-slate-200 text-primary-600' : 'bg-white border-transparent text-slate-300 hover:text-slate-400'}`}>
                {day.name}
              </button>
            ))}
            
            <div className="w-[1.5px] h-8 bg-slate-100 mx-3 shrink-0"></div>
            
            <button 
                onClick={handleStartNewWeek}
                className="flex items-center gap-2 px-6 py-2.5 bg-kine text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-kine/20 hover:scale-105 active:scale-95 transition-all shrink-0 mr-4"
            >
                <ChevronRightCircle size={16} />
                Finalizar Semana
            </button>
          </div>
          <div className="flex items-center gap-2 border-l pl-4 ml-2 shrink-0">
              <button onClick={() => setViewMode('plan')} title="Proyección Mensual" className={`p-2.5 rounded-2xl transition-all ${viewMode === 'plan' ? 'bg-primary-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}><Layers size={22}/></button>
              <button onClick={() => setViewMode('stats')} title="Estadísticas" className={`p-2.5 rounded-2xl transition-all ${viewMode === 'stats' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}><BarChart2 size={22}/></button>
          </div>
      </div>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-container">
        <div className="max-w-4xl mx-auto h-full">
          {/* VISTA DIARIA */}
          {viewMode === 'daily' && activeDay ? (
              <div className="space-y-4 max-w-xl mx-auto pb-24">
                  <div className="flex justify-between items-end px-2 mb-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">Plan del Día</span>
                        <h3 className="text-sm font-black text-slate-800 uppercase">{activeDay.name}</h3>
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 italic">Ciclo Semana {currentWeek}</span>
                  </div>
                  {activeDay.exercises.map(ex => (
                    <ExerciseCard key={ex.id} exercise={ex} role={role} onUpdate={(id, up) => handleExerciseUpdate(id, up)} onShowHistory={(e) => setChartExercise(e)} onDelete={(id) => handleRemoveExercise(activeDayId, id)} />
                  ))}
                  {activeDay.exercises.length === 0 && (
                    <div className="py-24 text-center">
                        <Activity className="mx-auto mb-4 text-slate-200" size={48} />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Día sin ejercicios</p>
                    </div>
                  )}
              </div>
          ) : viewMode === 'plan' ? (
              /* PLAN MENSUAL (PROYECCIÓN FUTURA) */
              <div className="space-y-12 pb-24 max-w-4xl mx-auto">
                  <div className="text-center space-y-3 mb-12">
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Proyección Mensual</h3>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Semanas proyectadas desde la actual</p>
                  </div>

                  {/* Mostramos 4 semanas: actual y 3 siguientes */}
                  {[0, 1, 2, 3].map((offset) => {
                      const weekNum = currentWeek + offset;
                      const isCurrent = offset === 0;
                      return (
                        <div key={weekNum} className={`bg-white rounded-[3rem] border overflow-hidden shadow-md transition-all ${isCurrent ? 'border-primary-500 ring-8 ring-primary-50/50 scale-[1.02] z-10' : 'border-slate-200 opacity-80'}`}>
                            <div className={`px-8 py-5 flex justify-between items-center ${isCurrent ? 'bg-primary-600' : 'bg-slate-900'}`}>
                                <div className="flex items-center gap-3">
                                    <h4 className="text-white font-black text-sm uppercase tracking-[0.2em]">Semana {weekNum}</h4>
                                    {isCurrent && <span className="bg-white text-primary-600 px-3 py-1 rounded-full text-[9px] font-black uppercase shadow-sm">SEMANA ACTUAL</span>}
                                </div>
                                <span className="text-white/30 text-[9px] font-black uppercase tracking-widest">Proyección</span>
                            </div>
                            <div className="p-8 overflow-x-auto no-scrollbar">
                                <div className="flex gap-5 min-w-max pb-4">
                                    {patient.routine.days.map((day, idx) => (
                                        <div key={`${weekNum}-${day.id}`} className="w-56 shrink-0 bg-slate-50/70 rounded-3xl p-5 border border-slate-100">
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-4 pb-2 border-b">Día {idx+1}</p>
                                            <div className="space-y-3">
                                                {day.exercises.map(ex => (
                                                    <div key={`${weekNum}-${ex.id}`} className="flex flex-col gap-1.5 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                                        <span className="text-[10px] font-black text-slate-800 truncate">{ex.definition.name}</span>
                                                        <div className="flex justify-between items-center mt-1">
                                                          <span className="text-[10px] font-black text-slate-400">{ex.targetSets}x{ex.targetReps}</span>
                                                          <span className="text-[12px] font-black text-primary-600">{ex.targetLoad}kg</span>
                                                        </div>
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
          ) : viewMode === 'stats' ? (
              /* VISTA DE HISTORIAL REAL (CRONOLÓGICO) */
              <div className="space-y-12 pb-24 max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center">
                          <span className="text-[11px] font-black text-slate-400 uppercase mb-3 tracking-widest">Semana Activa</span>
                          <span className="text-4xl font-black text-slate-900">{currentWeek}</span>
                      </div>
                      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center">
                          <span className="text-[11px] font-black text-slate-400 uppercase mb-3 tracking-widest">Progreso Global</span>
                          <span className="text-4xl font-black text-kine">{(historyWeeksAscending.length * 10)}%</span>
                      </div>
                      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center">
                          <span className="text-[11px] font-black text-slate-400 uppercase mb-3 tracking-widest">Semanas Guardadas</span>
                          <span className="text-4xl font-black text-gym">{historyWeeksAscending.length}</span>
                      </div>
                  </div>

                  <div className="space-y-8">
                      <div className="flex items-center gap-4 px-2">
                        <div className="p-2.5 bg-slate-900 rounded-xl text-white"><History size={20} /></div>
                        <h4 className="font-black text-base uppercase text-slate-900 leading-none">Historial Cronológico</h4>
                      </div>
                      
                      {historyWeeksAscending.length > 0 ? (
                        historyWeeksAscending.map((weekNum, index) => {
                            // Encontramos la fecha asociada a esa semana (tomamos la del primer ejercicio encontrado)
                            let weekDate = "Sin fecha";
                            for (const day of patient.routine.days) {
                                for (const ex of day.exercises) {
                                    const log = ex.history?.find(h => h.week === weekNum);
                                    if (log) {
                                        weekDate = log.date;
                                        break;
                                    }
                                }
                                if (weekDate !== "Sin fecha") break;
                            }

                            return (
                                <div key={weekNum} className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-md">
                                    <div className="bg-slate-900 px-8 py-5 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-white font-black text-sm uppercase tracking-[0.2em]">Semana {weekNum}</h4>
                                            <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-[9px] font-black uppercase shadow-sm border border-slate-700">{weekDate}</span>
                                        </div>
                                        <span className="text-white/30 text-[9px] font-black uppercase tracking-widest">Completada</span>
                                    </div>
                                    <div className="p-8 overflow-x-auto no-scrollbar">
                                        <div className="flex gap-5 min-w-max pb-4">
                                            {patient.routine.days.map((day, idx) => {
                                                // Filtramos ejercicios que tengan un log con ESTA SEMANA (weekNum)
                                                const exercisesInWeek = day.exercises
                                                    .map(ex => {
                                                        const log = ex.history?.find(h => h.week === weekNum);
                                                        return log ? { ...ex, log } : null;
                                                    })
                                                    .filter((item): item is (RoutineExercise & { log: ExerciseLog }) => item !== null);

                                                return (
                                                    <div key={`${weekNum}-${day.id}`} className={`w-56 shrink-0 rounded-3xl p-5 border ${exercisesInWeek.length > 0 ? 'bg-slate-50/70 border-slate-100' : 'bg-slate-50/20 border-slate-100 border-dashed opacity-50'}`}>
                                                        <p className={`text-[10px] font-black uppercase mb-4 pb-2 border-b ${exercisesInWeek.length > 0 ? 'text-slate-400 border-slate-200' : 'text-slate-200 border-slate-100'}`}>Día {idx+1}</p>
                                                        
                                                        {exercisesInWeek.length > 0 ? (
                                                            <div className="space-y-3">
                                                                {exercisesInWeek.map(item => (
                                                                    <div key={`${weekNum}-${item.id}`} className="flex flex-col gap-1.5 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                                                                        {/* Indicador de RPE */}
                                                                        <div className="absolute right-0 top-0 bottom-0 w-1" style={{backgroundColor: getRpeColor(item.log.rpe)}}></div>
                                                                        
                                                                        <span className="text-[10px] font-black text-slate-800 truncate pr-2">{item.definition.name}</span>
                                                                        <div className="flex justify-between items-center mt-1">
                                                                          <span className="text-[10px] font-black text-slate-400">
                                                                            {item.definition.metricType === 'time' ? `${item.log.load}s` : `${item.log.reps} reps`}
                                                                          </span>
                                                                          <div className="flex gap-2 items-center">
                                                                            <span className="text-[12px] font-black text-primary-600">
                                                                                {item.definition.metricType === 'time' ? '' : `${item.log.load}kg`}
                                                                            </span>
                                                                            <span className="text-[8px] font-black text-white px-1.5 py-0.5 rounded-md" style={{backgroundColor: getRpeColor(item.log.rpe)}}>RPE {item.log.rpe}</span>
                                                                          </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-[9px] text-slate-300 italic text-center py-4">Sin registros</p>
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
                          <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                              <p className="text-slate-400 font-bold text-xs">No hay historial de semanas completadas aún.</p>
                          </div>
                      )}
                  </div>
              </div>
          ) : null}
        </div>
      </main>

      {/* ROUTINE EDITOR MODAL */}
      {showRoutineEditor && (
          <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col pt-[var(--sat)] animate-in slide-in-from-bottom-5 duration-300">
              <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-6">
                      <div className="flex bg-slate-100 p-1 rounded-xl">
                          <button onClick={() => handleUpdateStage(Stage.KINESIOLOGY)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${patient.routine.stage === Stage.KINESIOLOGY ? 'bg-white text-kine shadow-sm' : 'text-slate-400'}`}>Kinesiología</button>
                          <button onClick={() => handleUpdateStage(Stage.GYM)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${patient.routine.stage === Stage.GYM ? 'bg-white text-gym shadow-sm' : 'text-slate-400'}`}>Gimnasio</button>
                      </div>
                      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                          <button onClick={handleRemoveLastDay} className="text-slate-400 hover:text-red-500 disabled:opacity-20 transition-colors"><Minus size={18}/></button>
                          <div className="flex flex-col items-center min-w-[40px]"><span className="text-[12px] font-black leading-none">{patient.routine.days.length}</span><span className="text-[6px] font-black uppercase text-slate-300 tracking-tighter">Días</span></div>
                          <button onClick={handleAddDay} disabled={patient.routine.days.length >= 7} className="text-slate-400 hover:text-primary-600 disabled:opacity-20 transition-colors"><Plus size={18}/></button>
                      </div>
                  </div>
                  <button onClick={() => setShowRoutineEditor(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
              </header>
              <div className="flex-1 overflow-x-auto p-4 bg-slate-50">
                  <div className="flex items-start gap-4 h-full min-w-max pb-10">
                      {patient.routine.days.map((day) => (
                          <div key={day.id} className="w-64 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-full shrink-0">
                              <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                                  <input className="font-black text-xs text-slate-800 bg-transparent border-none focus:ring-0 p-0 w-full uppercase" value={day.name} onChange={(e) => handleRenameDay(day.id, e.target.value)} />
                              </div>
                              <div className="flex-1 overflow-y-auto p-3 space-y-2 scroll-container">
                                  {day.exercises.map((ex) => (
                                      <div key={ex.id} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
                                          <div className="flex items-center justify-between gap-2">
                                              {ex.definition.videoUrl ? (
                                                <img src={ex.definition.videoUrl} className="w-8 h-8 rounded-lg object-cover" />
                                              ) : (
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                                    {ex.definition.metricType === 'time' ? <Timer size={14} className="text-slate-300"/> : <Dumbbell size={14} className="text-slate-300"/>}
                                                </div>
                                              )}
                                              <p className="font-bold text-[10px] text-slate-800 truncate flex-1 leading-tight">{ex.definition.name}</p>
                                              <button onClick={() => handleRemoveExercise(day.id, ex.id)} className="p-1.5 text-slate-300 hover:text-red-500"><Trash2 size={12}/></button>
                                          </div>
                                          <div className="grid grid-cols-3 gap-1">
                                              <input type="number" className="bg-white rounded-lg text-center font-black text-[10px] py-1 border-slate-100 focus:ring-primary-500" value={ex.targetSets} onChange={e => handleExerciseUpdate(ex.id, {targetSets: Number(e.target.value)})} />
                                              {ex.definition.metricType === 'time' ? (
                                                  <div className="flex items-center justify-center text-[9px] text-slate-400 font-bold bg-slate-50 rounded-lg">---</div>
                                              ) : (
                                                  <input type="number" className="bg-white rounded-lg text-center font-black text-[10px] py-1 border-slate-100 focus:ring-primary-500" value={ex.targetReps} onChange={e => handleExerciseUpdate(ex.id, {targetReps: Number(e.target.value)})} />
                                              )}
                                              <input type="number" className="bg-white rounded-lg text-center font-black text-[10px] py-1 border-slate-100 focus:ring-primary-500" value={ex.targetLoad} onChange={e => handleExerciseUpdate(ex.id, {targetLoad: Number(e.target.value)})} />
                                          </div>
                                          <div className="flex justify-between px-1">
                                              <span className="text-[8px] text-slate-400 uppercase font-bold">Series</span>
                                              <span className="text-[8px] text-slate-400 uppercase font-bold">{ex.definition.metricType === 'time' ? '' : 'Reps'}</span>
                                              <span className="text-[8px] text-slate-400 uppercase font-bold">{ex.definition.metricType === 'time' ? 'Segundos' : 'Kg'}</span>
                                          </div>
                                      </div>
                                  ))}
                                  <button onClick={() => setIsAddingExerciseModal({show: true, dayId: day.id})} className="w-full py-6 border-2 border-dashed border-slate-200 rounded-2xl text-[9px] font-black text-slate-400 uppercase hover:bg-slate-50 hover:text-primary-600 transition-all flex flex-col items-center gap-1.5">
                                      <Plus size={16} /> Agregar Ejercicio
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* OTROS MODALES (STATS Y ADD EXERCISE) */}
      {chartExercise && <ProgressChart exercise={chartExercise} onClose={() => setChartExercise(null)} />}
      
      {isAddingExerciseModal.show && (
          <div className="fixed inset-0 z-[350] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md h-[75vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-6 border-b flex items-center gap-4">
                      <div className="relative flex-1">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                          <input type="text" placeholder="Buscar..." className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-[12px] font-bold outline-none" value={exerciseSearch} onChange={e => setExerciseSearch(e.target.value)} />
                      </div>
                      <button onClick={() => { setIsAddingExerciseModal({show:false, dayId:''}); setSelectedExerciseIds([]); }} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X size={28}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 scroll-container">
                      {exercises.filter(ex => ex.name.toLowerCase().includes(exerciseSearch.toLowerCase())).map(ex => {
                          const isSelected = selectedExerciseIds.includes(ex.id);
                          return (
                              <button key={ex.id} onClick={() => setSelectedExerciseIds(prev => isSelected ? prev.filter(i => i !== ex.id) : [...prev, ex.id])} className={`w-full flex items-center p-4 rounded-3xl border-2 transition-all text-left ${isSelected ? 'bg-primary-50 border-primary-500 shadow-md' : 'bg-white border-slate-50 hover:border-slate-100'}`}>
                                  <div className="mr-4">{isSelected ? <CheckSquare size={24} className="text-primary-600"/> : <Square size={24} className="text-slate-200"/>}</div>
                                  {ex.videoUrl ? (
                                      <img src={ex.videoUrl} className="w-14 h-14 rounded-2xl object-cover mr-4" />
                                  ) : (
                                      <div className="w-14 h-14 rounded-2xl bg-slate-100 mr-4 flex items-center justify-center text-slate-300">
                                          {ex.metricType === 'time' ? <Timer size={24}/> : <Dumbbell size={24}/>}
                                      </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                      <p className="font-black text-slate-800 text-[12px] truncate uppercase leading-none">{ex.name}</p>
                                      <div className="flex gap-2 mt-1">
                                          <span className="text-[10px] text-slate-400">{ex.category}</span>
                                          {ex.metricType === 'time' && <span className="text-[9px] text-blue-500 font-bold bg-blue-50 px-1 rounded">TIEMPO</span>}
                                      </div>
                                  </div>
                              </button>
                          );
                      })}
                  </div>
                  <div className="p-8 bg-white border-t">
                        <button disabled={selectedExerciseIds.length === 0} className="bg-primary-600 text-white w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest disabled:opacity-30 shadow-xl shadow-primary-200 transition-all active:scale-95" onClick={() => {
                                const newExs: RoutineExercise[] = selectedExerciseIds.map(id => {
                                    const def = exercises.find(e => e.id === id)!;
                                    return {
                                        id: `re-${Date.now()}-${id}`, definitionId: id, definition: def,
                                        targetSets: 3, targetReps: def.metricType === 'time' ? 0 : 12, targetLoad: 0, isDone: false, history: []
                                    };
                                });
                                const newDays = patient.routine.days.map(d => d.id === isAddingExerciseModal.dayId ? { ...d, exercises: [...d.exercises, ...newExs] } : d);
                                onUpdatePatient({ ...patient, routine: { ...patient.routine, days: newDays } });
                                setIsAddingExerciseModal({show:false, dayId:''});
                                setSelectedExerciseIds([]);
                            }}>Confirmar Ejercicios</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};