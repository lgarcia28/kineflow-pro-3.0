import React, { useState, useEffect, useMemo } from 'react';
import { Patient, RoutineExercise, Stage, UserRole, RoutineDay, ExerciseLog, ExerciseDefinition, CheckInStatus, PlanType, ClinicalEvaluation } from '../types';
import { EvaluationDashboard } from './EvaluationDashboard';
import { ExerciseCard } from './ExerciseCard';
import { generateAIPortion } from '../services/aiService';
import { ProgressChart } from './ProgressChart';
import { parseMediaUrl } from '../utils/mediaUrl';
import { BODY_REGIONS, inferExerciseCategories } from '../utils/exerciseCategories';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
    FileText, Plus, Search, X, Calendar, Trash2, Edit2, Save,
    Activity, Minus, Layers, TrendingUp, CheckSquare, Square, BarChart2, CheckCircle2, History, ChevronRightCircle, Timer, Dumbbell, Maximize2, Award, Link2, Unlink, GripVertical, Sparkles
} from 'lucide-react';
import { Reorder, motion, useDragControls } from 'framer-motion';

interface ReorderableExerciseItemProps {
  ex: RoutineExercise;
  day: RoutineDay;
  dayExercises: RoutineExercise[];
  isSelectedInEditor: boolean;
  ssInfo?: { label: string; color: string };
  editorSelectedExIds: string[];
  setEditorSelectedExIds: React.Dispatch<React.SetStateAction<string[]>>;
  handleExerciseUpdate: (id: string, updates: Partial<RoutineExercise>) => void;
  handleRemoveExercise: (dayId: string, id: string) => void;
  setZoomedImage: React.Dispatch<React.SetStateAction<{ url: string; name: string } | null>>;
}

const ReorderableExerciseItem: React.FC<ReorderableExerciseItemProps> = ({
  ex,
  day,
  dayExercises,
  isSelectedInEditor,
  ssInfo,
  editorSelectedExIds,
  setEditorSelectedExIds,
  handleExerciseUpdate,
  handleRemoveExercise,
  setZoomedImage
}) => {
  const dragControls = useDragControls();
  const hasSupersetGroup = !!ex.supersetGroup;

  // Calculate dynamic group classes
  let isFirstInGroup = false;
  let isLastInGroup = false;
  let isMiddleInGroup = false;

  if (hasSupersetGroup) {
    const siblings = dayExercises.filter(e => e.supersetGroup === ex.supersetGroup);
    if (siblings.length > 1) {
      const sibIdx = siblings.indexOf(ex);
      isFirstInGroup = sibIdx === 0;
      isLastInGroup = sibIdx === siblings.length - 1;
      isMiddleInGroup = !isFirstInGroup && !isLastInGroup;
    }
  }

  const groupClasses = isFirstInGroup ? 'rounded-t-2xl rounded-b-none border-b-0' :
                       isMiddleInGroup ? 'rounded-none border-b-0' :
                       isLastInGroup ? 'rounded-b-2xl rounded-t-none' : 'rounded-2xl';

  const bgSelection = isSelectedInEditor ? 'border-indigo-400 ring-2 ring-indigo-100 z-10' : 'border-slate-200 hover:shadow-md';

  return (
    <Reorder.Item
      value={ex}
      id={ex.id}
      dragListener={false}
      dragControls={dragControls}
      className={`flex flex-row items-center p-2.5 bg-white border transition-all overflow-hidden relative group select-none ${groupClasses} ${bgSelection} ${hasSupersetGroup ? 'pl-4' : ''}`}
    >
      {hasSupersetGroup && (
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${ssInfo?.color || 'bg-indigo-500'}`} />
      )}

      {/* Drag Handle (Tirador) */}
      <div 
        onPointerDown={(e) => dragControls.start(e)} 
        className="cursor-grab active:cursor-grabbing p-1.5 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-lg shrink-0 touch-none"
      >
        <GripVertical size={16} strokeWidth={2.5} />
      </div>

      {/* Checkbox de selección */}
      <button
        onClick={() => setEditorSelectedExIds(prev =>
          prev.includes(ex.id) ? prev.filter(id => id !== ex.id) : [...prev, ex.id]
        )}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all z-20 shadow-sm shrink-0 mr-1.5 ${isSelectedInEditor ? 'bg-indigo-500 border-indigo-500' : 'bg-slate-50 border-slate-300 hover:border-indigo-400'}`}
      >
        {isSelectedInEditor && <CheckSquare size={12} className="text-white" />}
      </button>
      
      <div className="flex-1 flex items-center gap-3 pr-6 min-w-0">
          {(() => {
            const media = ex.definition.videoUrl ? parseMediaUrl(ex.definition.videoUrl) : null;
            if (media && (media.thumbnailUrl || media.type === 'instagram')) {
              return (
                <button 
                  onClick={() => setZoomedImage({ url: ex.definition.videoUrl || '', name: ex.definition.name })}
                  className={`w-10 h-10 shrink-0 rounded-xl object-cover shadow-sm overflow-hidden relative group cursor-zoom-in ${media.type === 'instagram' ? 'bg-gradient-to-br from-pink-400 to-purple-600' : 'bg-slate-100'}`}
                >
                  {media.thumbnailUrl ? (
                    <img src={media.thumbnailUrl} className="w-full h-full object-cover" />
                  ) : (
                    <Activity size={12} className="text-white" />
                  )}
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Maximize2 size={12} className="text-white" />
                  </div>
                </button>
              );
            }
            return (
              <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center shadow-inner">
                  {ex.definition.metricType === 'time' ? <Timer size={16} className="text-slate-400"/> : ex.definition.metricType === 'tension' ? <Activity size={16} className="text-purple-400"/> : <Dumbbell size={16} className="text-slate-400"/>}
              </div>
            );
          })()}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              {hasSupersetGroup && (
                <span className={`text-[8px] font-black text-white ${ssInfo?.color || 'bg-indigo-500'} px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm shrink-0`}>
                  {ssInfo?.label}
                </span>
              )}
              <p className="font-bold text-xs text-slate-900 leading-tight group-hover:text-primary-600 transition-colors truncate">{ex.definition.name}</p>
            </div>
            
            {/* Métricas del Editor */}
            {(() => {
              const isTimeBased = ex.definition.metricType === 'time';
              const isTensionBased = ex.definition.metricType === 'tension';
              return (
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 mt-2 bg-slate-50 p-2 rounded-xl border border-slate-100" onClick={e => e.stopPropagation()}>
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <span className="text-[7px] uppercase font-black text-slate-400 tracking-widest mb-0.5">Series</span>
                      <input 
                        type="number" 
                        inputMode="numeric"
                        className="w-full bg-white rounded-md border border-slate-200 text-center text-xs font-black text-slate-900 focus:ring-1 focus:ring-primary-500 py-1 outline-none shadow-sm" 
                        value={ex.targetSets} 
                        onChange={e => handleExerciseUpdate(ex.id, {targetSets: Number(e.target.value)})} 
                      />
                    </div>
                    
                    {!isTimeBased && (
                      <div className="flex flex-col items-center flex-1 min-w-0">
                        <span className="text-[7px] uppercase font-black text-slate-400 tracking-widest mb-0.5">Reps</span>
                        <input 
                          type="number" 
                          inputMode="numeric"
                          className="w-full bg-white rounded-md border border-slate-200 text-center text-xs font-black text-slate-900 focus:ring-1 focus:ring-primary-500 py-1 outline-none shadow-sm" 
                          value={ex.targetReps} 
                          onChange={e => handleExerciseUpdate(ex.id, {targetReps: Number(e.target.value)})} 
                        />
                      </div>
                    )}

                    <div className="flex flex-col items-center flex-1 sm:flex-[1.2] min-w-0 col-span-2 sm:col-span-1">
                      <span className="text-[7px] uppercase font-black text-slate-400 tracking-widest mb-0.5">
                        {isTimeBased ? 'Segundos' : isTensionBased ? 'Tensión' : 'Carga (kg)'}
                      </span>
                      <div className="relative w-full">
                        {isTensionBased ? (
                          <select
                            className="w-full bg-white rounded-md border border-slate-200 text-center text-xs font-black text-purple-600 focus:ring-1 focus:ring-primary-500 py-1 outline-none shadow-sm cursor-pointer"
                            value={ex.targetLoad || 2}
                            onChange={e => handleExerciseUpdate(ex.id, {targetLoad: Number(e.target.value)})}
                          >
                            <option value={1}>Baja</option>
                            <option value={2}>Media</option>
                            <option value={3}>Alta</option>
                          </select>
                        ) : (
                          <input 
                            type="number" 
                            inputMode="decimal"
                            pattern="[0-9]*"
                            className="w-full bg-white rounded-md border border-slate-200 text-center text-xs font-black text-primary-600 focus:ring-1 focus:ring-primary-500 py-1 outline-none shadow-sm" 
                            value={ex.targetLoad} 
                            onChange={e => handleExerciseUpdate(ex.id, {targetLoad: Number(e.target.value)})} 
                          />
                        )}
                      </div>
                    </div>
                </div>
              );
            })()}
          </div>
      </div>
      
      <button 
        onClick={() => handleRemoveExercise(day.id, ex.id)} 
        className="absolute bottom-2.5 right-2.5 p-1 bg-white text-slate-400 hover:text-white hover:bg-red-500 rounded border border-slate-200 transition-all opacity-0 group-hover:opacity-100 shadow-sm z-20"
      >
        <Trash2 size={12}/>
      </button>
    </Reorder.Item>
  );
};

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
  const [activeDayId, setActiveDayId] = useState<string>(patient.routine?.days?.[0]?.id || '');
  const [viewMode, setViewMode] = useState<'daily' | 'plan' | 'stats' | 'evaluations'>('daily');
  const [showHistory, setShowHistory] = useState(false);
  const [showRoutineEditor, setShowRoutineEditor] = useState(false);
  const [kineId, setKineId] = useState<string>('current-kine-id'); // En prod vendría del Auth context
  
  // Estados para modales y edición
  const [chartExercise, setChartExercise] = useState<RoutineExercise | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [exerciseRegionFilter, setExerciseRegionFilter] = useState('');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [isAddingExerciseModal, setIsAddingExerciseModal] = useState<{show: boolean, dayId: string}>({show: false, dayId: ''});
  const [notes, setNotes] = useState('');
  const [zoomedImage, setZoomedImage] = useState<{url: string, name: string} | null>(null);
  
  // --- Estados para Biserie/Triserie en el editor ---
  const [editorSelectedExIds, setEditorSelectedExIds] = useState<string[]>([]);

  // --- Estados para Planificación IA y Mesociclos ---
  const [selectedMesocycle, setSelectedMesocycle] = useState<number>(1);
  const [showAIPlannerModal, setShowAIPlannerModal] = useState(false);
  const [aiObjectives, setAiObjectives] = useState('Fuerza y Control Motor');
  const [aiProgressionStyle, setAiProgressionStyle] = useState('Lineal');
  const [aiSessionsPerWeek, setAiSessionsPerWeek] = useState(patient.sessionsPerWeek || 3);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const isKine = role === UserRole.KINE;
  
  // Safe routine fallbacks
  const safeClinicRoutine = (patient.routine && Array.isArray(patient.routine.days)) 
    ? patient.routine 
    : { id: `r_${patient.id}`, stage: Stage.KINESIOLOGY, currentWeek: 1, days: [] };

  const safeHomeRoutine = (patient.homeRoutine && Array.isArray(patient.homeRoutine.days)) 
    ? patient.homeRoutine 
    : { id: `hr_${patient.id}`, stage: Stage.KINESIOLOGY, currentWeek: 1, days: [] };

  const activeRoutine = routineType === 'CLINIC' ? safeClinicRoutine : safeHomeRoutine;
  const currentWeek = activeRoutine.currentWeek || 1;

  // Sincronizar el día activo si cambia la rutina o el tipo de rutina
  useEffect(() => {
    if (activeRoutine.days.length > 0 && (!activeDayId || !activeRoutine.days.find(d => d.id === activeDayId))) {
        setActiveDayId(activeRoutine.days[0].id);
    }
  }, [activeRoutine.days, activeDayId, routineType]);

  const activeDay = activeRoutine.days.find(d => d.id === activeDayId);

  const resolvedActiveDay = useMemo(() => {
    if (!activeDay) return null;
    const routineKey = routineType === 'CLINIC' ? 'routine' : 'homeRoutine';
    const currentWeekNum = patient[routineKey]?.currentWeek || 1;
    
    return {
      ...activeDay,
      exercises: activeDay.exercises.map(ex => {
        if (ex.weeklyTargets) {
          const target = ex.weeklyTargets.find(t => t.week === currentWeekNum);
          if (target) {
            return {
              ...ex,
              targetSets: target.sets,
              targetReps: target.reps,
              targetLoad: target.load,
            };
          }
        }
        return ex;
      })
    };
  }, [activeDay, patient, routineType]);

  const handleGenerateAIPlan = async () => {
    setIsAiGenerating(true);
    try {
      const generatedDays = await generateAIPortion(
        patient.condition || "Rehabilitación general",
        aiSessionsPerWeek,
        exercises, // librería global de ejercicios
        aiObjectives,
        aiProgressionStyle
      );

      const routineKey = routineType === 'CLINIC' ? 'routine' : 'homeRoutine';
      const currentRoutine = patient[routineKey] || { days: [] };

      // Actualizar la rutina en el paciente
      const updatedPatient: Patient = {
        ...patient,
        sessionsPerWeek: aiSessionsPerWeek,
        [routineKey]: {
          ...currentRoutine,
          currentWeek: 1, // Reiniciar a la semana 1 al crear un nuevo macrociclo
          days: generatedDays
        }
      };

      await onUpdatePatient(updatedPatient);
      setShowAIPlannerModal(false);
      setSelectedMesocycle(1);
      alert("¡Rutina planificada y proyecciones de 6 meses cargadas con éxito!");
    } catch (error) {
      console.error(error);
      alert("Hubo un error al generar la planificación con IA. Por favor, intenta de nuevo.");
    } finally {
      setIsAiGenerating(false);
    }
  };

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

  // LOGICA MAESTRA: FINALIZAR SESIÓN DE RUTINA
  const handleFinishSession = () => {
    const confirmText = `¿Finalizar la sesión actual del día?\n\nEsto hará:\n1. Guardar los ejercicios realizados en el historial.\n2. Limpiar los tildes y marcas para la próxima sesión.\n3. Registrar la asistencia/visita de hoy (${new Date().toLocaleDateString()}).`;
    
    if (!window.confirm(confirmText)) return;

    const today = new Date().toISOString().split('T')[0];
    const targetRoutine = routineType === 'CLINIC' ? safeClinicRoutine : safeHomeRoutine;
    
    // Clonamos y reseteamos los ejercicios realizados
    const resetDays = targetRoutine.days.map(day => ({
      ...day,
      exercises: day.exercises.map(ex => {
        const newHistory = [...(ex.history || [])];
        
        // Si el ejercicio se marcó como hecho, guardamos esa foto en el historial
        if (ex.isDone) {
          newHistory.push({
            date: today,
            week: currentWeek,
            load: ex.targetLoad,
            reps: ex.targetReps,
            rpe: ex.currentRpe || 5,
            pain: ex.currentPain || 0
          });
        }

        return {
          ...ex,
          isDone: false,        // DESTILDAR (RESET PARA LA PRÓXIMA SESIÓN)
          currentRpe: 0,        // RESET A 0
          currentPain: 0,       // RESET DOLOR A 0
          history: newHistory
        };
      })
    }));

    const routineKey = routineType === 'CLINIC' ? 'routine' : 'homeRoutine';

    // Actualizamos el objeto completo
    const updatedPatient: Patient = {
      ...patient,
      lastVisit: today,
      [routineKey]: {
        ...targetRoutine,
        days: resetDays
      }
    };

    onUpdatePatient(updatedPatient);
    
    // Feedback inmediato
    setViewMode('stats'); // Llevamos a estadísticas para ver lo guardado
    setTimeout(() => alert('¡Sesión finalizada y guardada en el historial con éxito!'), 100);
  };

  const handleExerciseUpdate = (exerciseId: string, updates: Partial<RoutineExercise>) => {
    const routineKey = routineType === 'CLINIC' ? 'routine' : 'homeRoutine';
    const currentRoutine = patient[routineKey] || { days: [] };
    const currentWeekNum = currentRoutine.currentWeek || 1;
    
    const newDays = currentRoutine.days.map(day => ({
        ...day,
        exercises: day.exercises.map(ex => {
          if (ex.id === exerciseId) {
            let updatedWeeklyTargets = ex.weeklyTargets ? [...ex.weeklyTargets] : undefined;
            if (updatedWeeklyTargets) {
              const idx = updatedWeeklyTargets.findIndex(t => t.week === currentWeekNum);
              if (idx !== -1) {
                updatedWeeklyTargets[idx] = {
                  ...updatedWeeklyTargets[idx],
                  sets: updates.targetSets !== undefined ? updates.targetSets : updatedWeeklyTargets[idx].sets,
                  reps: updates.targetReps !== undefined ? updates.targetReps : updatedWeeklyTargets[idx].reps,
                  load: updates.targetLoad !== undefined ? updates.targetLoad : updatedWeeklyTargets[idx].load,
                };
              } else {
                updatedWeeklyTargets.push({
                  week: currentWeekNum,
                  sets: updates.targetSets !== undefined ? updates.targetSets : ex.targetSets,
                  reps: updates.targetReps !== undefined ? updates.targetReps : ex.targetReps,
                  load: updates.targetLoad !== undefined ? updates.targetLoad : ex.targetLoad,
                });
              }
            }
            return { ...ex, ...updates, weeklyTargets: updatedWeeklyTargets };
          }
          return ex;
        })
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

  const handleRemoveDay = (dayId: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este día y todos sus ejercicios?")) return;
    const routineKey = routineType === 'CLINIC' ? 'routine' : 'homeRoutine';
    const currentRoutine = patient[routineKey];
    if (!currentRoutine) return;

    const newDays = currentRoutine.days.filter(d => d.id !== dayId);
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
    if (window.confirm('¿Finalizar sesión del paciente?')) {
      const today = new Date().toISOString().split('T')[0];
      const newHistory = [`Sesión finalizada por Kinesiólogo el ${today}`, ...(patient.history || [])];
      onUpdatePatient({ ...patient, checkInStatus: CheckInStatus.IDLE, lastVisit: today, history: newHistory });
    }
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

  const handleReorderExercises = (dayId: string, reorderedExercises: RoutineExercise[]) => {
    const routineKey = routineType === 'CLINIC' ? 'routine' : 'homeRoutine';
    const currentRoutine = patient[routineKey] || { days: [] };
    const newDays = currentRoutine.days.map(day => {
      if (day.id !== dayId) return day;
      return {
        ...day,
        exercises: reorderedExercises
      };
    });
    onUpdatePatient({ ...patient, [routineKey]: { ...currentRoutine, days: newDays } });
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
      <header className="glass-panel border-b border-slate-200/50 px-4 py-2.5 md:px-6 md:py-4 flex items-center justify-between shrink-0 z-30 pt-[calc(0.5rem+var(--sat))] md:pt-[calc(1rem+var(--sat))] relative shadow-sm">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2.5 md:gap-4 hover:-translate-y-0.5 transition-transform">
            <img src={patient.photoUrl} alt="" className="w-9 h-9 md:w-12 md:h-12 rounded-xl md:rounded-2xl object-cover shadow-sm bg-white" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 md:gap-3">
                <h2 className="text-base md:text-2xl font-black text-slate-900 leading-none truncate tracking-tight">
                    {patient.firstName} {patient.lastName}
                </h2>
                {/* BADGE DE SEMANA - SE ACTUALIZA CON LA PROP */}
                <div key={currentWeek} className="bg-primary-600 text-white text-[8px] md:text-[10px] px-2 py-1 md:px-3 md:py-1.5 rounded-full font-bold shadow-lg shadow-primary-500/15 flex items-center gap-1 shrink-0 animate-in zoom-in fade-in duration-500">
                    <Calendar size={10} className="md:w-3 md:h-3" strokeWidth={2.5} />
                    <span className="hidden xs:inline">Sem. </span>{currentWeek}
                </div>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 mt-1 md:mt-2">
                <p className="text-[10px] md:text-xs text-slate-500 font-medium truncate leading-none bg-slate-100/80 px-1.5 py-0.5 rounded">{patient.condition}</p>
                <p className="text-[10px] md:text-xs text-slate-400 font-bold truncate leading-none uppercase tracking-wider hidden xs:block">{patient.dni}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 md:gap-2 items-center shrink-0">
            {patient.checkInStatus === CheckInStatus.IN_ROOM && (
              <button 
                onClick={handleMarkAttended}
                className="bg-emerald-500 text-white p-2 md:px-4 md:py-2.5 rounded-xl md:rounded-[1.25rem] font-bold text-xs hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-95 shrink-0"
                title="Finalizar Sesión"
              >
                <CheckCircle2 size={16} strokeWidth={2.5} />
                <span className="hidden md:inline">Finalizar Sesión</span>
              </button>
            )}
            <span className={`hidden md:flex px-4 py-2 rounded-[1.25rem] text-xs font-bold uppercase tracking-wide border shadow-sm ${patient.routine.stage === Stage.KINESIOLOGY ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-teal-50 border-teal-100 text-teal-600'}`}>
                {patient.routine.stage}
            </span>
            {isKine && (
                <button 
                  onClick={() => setShowRoutineEditor(true)} 
                  className="bg-slate-900 text-white p-2 md:px-4 md:py-2.5 rounded-xl md:rounded-[1.25rem] font-bold text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 active:scale-95 shrink-0"
                  title="Editar Rutina"
                >
                    <Edit2 size={15} />
                    <span className="hidden md:inline">Editar Rutina</span>
                </button>
            )}
            <button 
              onClick={() => setShowHistory(!showHistory)} 
              className={`p-2 md:p-2.5 rounded-xl md:rounded-[1.25rem] border shadow-sm transition-all active:scale-95 shrink-0 ${
                showHistory ? 'bg-primary-50 border-primary-200 text-primary-600' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
              }`}
              title="Ficha Clínica"
            >
                <FileText size={16} />
            </button>
        </div>
      </header>

      {showHistory && (
          <div className="bg-white/80 backdrop-blur-md text-slate-900 p-4 shadow-xl z-20 border-b border-slate-200 animate-in slide-in-from-top-2 duration-300 relative max-h-96 flex flex-col">
              <div className="max-w-4xl mx-auto w-full flex flex-col gap-4">
                  {/* DETALLE CLINICO Y FICHA DE INGRESO */}
                  <div className="bg-blue-50/50 border border-blue-100 rounded-[1.25rem] p-4 flex flex-col gap-3 shrink-0">
                    <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest flex items-center gap-2"><FileText size={14} /> Ficha de Ingreso y Anamnesis</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mt-1">
                       <div>
                         <span className="block text-[10px] font-bold text-slate-400 uppercase">Motivo / Condición</span>
                         <span className="font-bold text-slate-800">{patient.condition || 'No especificada'}</span>
                       </div>
                       <div>
                         <span className="block text-[10px] font-bold text-slate-400 uppercase">Nacimiento / Edad / Sexo</span>
                         <span className="font-bold text-slate-800">
                           {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('es-AR', {timeZone: 'UTC'}) : 'S/D'} 
                           {patient.age ? ` (${patient.age} años)` : ''} 
                           {patient.gender ? ` • ${patient.gender}` : ''}
                         </span>
                       </div>
                       <div>
                         <span className="block text-[10px] font-bold text-slate-400 uppercase">Contacto</span>
                         <span className="font-bold text-slate-800 block">{patient.phone || 'Sin tel.'}</span>
                         {patient.email && <span className="text-[10px] text-slate-500 font-medium">{patient.email}</span>}
                       </div>
                       <div>
                         <span className="block text-[10px] font-bold text-slate-400 uppercase">Obra Social / Socio</span>
                         <span className="font-bold text-slate-800">
                           {patient.healthInsurance || 'Particular'} {patient.affiliateNumber ? `(Nº ${patient.affiliateNumber})` : ''}
                         </span>
                       </div>

                       {patient.address && (
                         <div>
                           <span className="block text-[10px] font-bold text-slate-400 uppercase">Dirección</span>
                           <span className="font-bold text-slate-800">{patient.address}</span>
                         </div>
                       )}

                       {patient.instagram && (
                         <div>
                           <span className="block text-[10px] font-bold text-slate-400 uppercase">Instagram</span>
                           <span className="font-bold text-slate-800">{patient.instagram}</span>
                         </div>
                       )}

                       {(patient.emergencyContactName || patient.emergencyContactPhone) && (
                         <div>
                           <span className="block text-[10px] font-bold text-slate-400 uppercase">Contacto Emergencia</span>
                           <span className="font-bold text-slate-800">{patient.emergencyContactName || 'Registrado'}</span>
                           {patient.emergencyContactPhone && <span className="text-[10px] text-slate-500 block font-medium">Tel: {patient.emergencyContactPhone}</span>}
                         </div>
                       )}

                       <div>
                         <span className="block text-[10px] font-bold text-slate-400 uppercase">Fecha de Lesión</span>
                         <span className="font-bold text-slate-800">
                           {patient.injuryDate ? new Date(patient.injuryDate).toLocaleDateString('es-AR', {timeZone: 'UTC'}) : 'No registrada'}
                         </span>
                       </div>

                       <div>
                         <span className="block text-[10px] font-bold text-slate-400 uppercase">¿Se operó?</span>
                         {patient.surgeryDate ? (
                           <div>
                             <span className="font-bold text-slate-800 block">Sí ({new Date(patient.surgeryDate).toLocaleDateString('es-AR', {timeZone: 'UTC'})})</span>
                             {patient.surgeryType && <span className="text-[10px] font-medium text-slate-500">{patient.surgeryType}</span>}
                           </div>
                         ) : (
                           <span className="font-bold text-slate-800">No</span>
                         )}
                       </div>

                       {(patient.diseaseCardiovascular || patient.diseaseDiabetes || patient.diseaseHypertension || patient.diseaseOther) && (
                         <div className="col-span-2">
                           <span className="block text-[10px] font-bold text-slate-400 uppercase">Enfermedades Previas</span>
                           <span className="font-bold text-slate-800">
                             Cardio: {patient.diseaseCardiovascular || 'NO'} | Diabetes: {patient.diseaseDiabetes || 'NO'} | Hipertensión: {patient.diseaseHypertension || 'NO'}
                             {patient.diseaseOther && patient.diseaseOther !== 'NO' && ` | Otra: ${patient.diseaseOther}`}
                           </span>
                         </div>
                       )}

                       {patient.surgeriesHistory && (
                         <div className="col-span-2">
                           <span className="block text-[10px] font-bold text-slate-400 uppercase">Cirugías Previas</span>
                           <span className="font-bold text-slate-800">{patient.surgeriesHistory}</span>
                         </div>
                       )}

                       {patient.allergies && (
                         <div>
                           <span className="block text-[10px] font-bold text-slate-400 uppercase">Alergias</span>
                           <span className="font-bold text-slate-800">{patient.allergies}</span>
                         </div>
                       )}

                       {patient.currentMedication && (
                         <div>
                           <span className="block text-[10px] font-bold text-slate-400 uppercase">Medicación Actual</span>
                           <span className="font-bold text-slate-800">{patient.currentMedication}</span>
                         </div>
                       )}

                       {patient.hasFitnessCertificate && (
                         <div>
                           <span className="block text-[10px] font-bold text-slate-400 uppercase">Aptitud Física</span>
                           <span className="font-bold text-slate-800">{patient.hasFitnessCertificate}</span>
                         </div>
                       )}

                       {patient.referralSource && (
                         <div>
                           <span className="block text-[10px] font-bold text-slate-400 uppercase">¿Cómo conoció la clínica?</span>
                           <span className="font-bold text-slate-800">{patient.referralSource}</span>
                         </div>
                       )}
                    </div>
                  </div>

                  <div className="flex gap-4 items-center shrink-0">
                      <textarea className="flex-1 h-14 bg-white/50 backdrop-blur-sm text-slate-700 p-3 rounded-[1.25rem] border border-slate-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none resize-none text-sm shadow-inner transition-all font-medium" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Añadir una nota a la historia clínica..." />
                      <button onClick={handleAddNote} className="bg-primary-600 text-white p-4 rounded-[1.25rem] hover:bg-primary-700 hover:-translate-y-0.5 active:scale-95 transition-all shadow-xl shadow-primary-500/20"><Save size={20}/></button>
                  </div>
                  
                  {patient.history && patient.history.length > 0 && (
                      <div className="overflow-y-auto pr-2 pb-2 scroll-container space-y-2 mt-2">
                        {patient.history.map((log, i) => (
                          <div key={i} className="text-sm text-slate-600 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                            {log}
                          </div>
                        ))}
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* SUB-NAV CON BOTÓN DE CIERRE DE SEMANA */}
      <div className="bg-white/70 backdrop-blur-md border-b border-slate-200/50 px-0 md:px-6 flex flex-col justify-between shrink-0 relative z-10 shadow-sm md:py-0 w-full overflow-hidden">
        {/* Mobile View: Two ultra-compact rows, no scroll */}
        <div className="flex flex-col w-full md:hidden">
          {/* Row 1: Days and Clinic/Home Switch */}
          <div className="flex justify-between items-center px-4 py-2 border-b border-slate-100 w-full">
            <div className="flex gap-1.5 items-center">
              {(routineType === 'CLINIC' ? patient.routine : (patient.homeRoutine || { days: [] })).days.map((day) => {
                const isActive = activeDayId === day.id && viewMode === 'daily';
                const shortName = day.name.toLowerCase().includes('casa') 
                  ? 'Casa' 
                  : (day.name.match(/d[íi]a\s*(\d+)/i) 
                    ? `Día ${day.name.match(/d[íi]a\s*(\d+)/i)![1]}` 
                    : day.name.split(':')[0]);
                return (
                  <button 
                    key={day.id} 
                    onClick={() => {setActiveDayId(day.id); setViewMode('daily');}} 
                    className={`px-2.5 py-1 font-black text-[10px] uppercase tracking-wide transition-all shrink-0 rounded-full ${
                      isActive 
                        ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/10' 
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {shortName}
                  </button>
                );
              })}
            </div>
            
            <div className="flex bg-slate-100 p-0.5 rounded-full shrink-0 border border-slate-200/40">
              <button 
                onClick={() => setRoutineType('CLINIC')}
                className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase transition-all duration-300 ${routineType === 'CLINIC' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400'}`}
              >
                Clínica
              </button>
              <button 
                onClick={() => setRoutineType('HOME')}
                className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase transition-all duration-300 ${routineType === 'HOME' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400'}`}
              >
                Dom.
              </button>
            </div>
          </div>

          {/* Row 2: Sub-modes and Finalizar button */}
          <div className="flex justify-between items-center px-4 py-2 w-full bg-slate-50/50">
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setViewMode('plan')} 
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[9px] font-bold uppercase transition-all ${
                  viewMode === 'plan' ? 'bg-primary-600 border-primary-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500'
                }`}
                title="Proyección"
              >
                <Layers size={11} strokeWidth={2.5} />
                <span>Plan</span>
              </button>
              <button 
                onClick={() => setViewMode('stats')} 
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[9px] font-bold uppercase transition-all ${
                  viewMode === 'stats' ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500'
                }`}
                title="Estadísticas"
              >
                <BarChart2 size={11} strokeWidth={2.5} />
                <span>Stats</span>
              </button>
              <button 
                onClick={() => setViewMode('evaluations')} 
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[9px] font-bold uppercase transition-all ${
                  viewMode === 'evaluations' ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500'
                }`}
                title="Evaluaciones"
              >
                <Award size={11} strokeWidth={2.5} />
                <span>Eval</span>
              </button>
            </div>

            <button 
              onClick={handleFinishSession}
              className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-full font-black text-[9px] uppercase tracking-wide shadow-md shadow-emerald-500/10 active:scale-95 transition-all"
              title="Finalizar Sesión del Día"
            >
              <CheckCircle2 size={10} strokeWidth={2.5} />
              Finalizar Sesión
            </button>
          </div>
        </div>

        {/* Desktop View: Standard tabs and switch layout */}
        <div className="hidden md:flex w-full items-center justify-between h-20">
          <div className="flex items-center gap-2.5">
            {/* Desktop switch */}
            <div className="bg-slate-200/50 p-1 rounded-2xl mr-6 shrink-0 shadow-inner flex">
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

            {/* Desktop Day Tabs */}
            <div className="flex gap-2 items-center h-full pt-4">
              {(routineType === 'CLINIC' ? patient.routine : (patient.homeRoutine || { days: [] })).days.map((day) => (
                <button key={day.id} onClick={() => {setActiveDayId(day.id); setViewMode('daily');}} className={`px-6 h-full rounded-t-3xl font-black text-xs uppercase tracking-wide transition-all border-t-2 border-x-2 shrink-0 ${activeDayId === day.id && viewMode === 'daily' ? 'bg-slate-50/80 border-slate-200/60 text-primary-600 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]' : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'} relative`}>
                  {day.name}
                  {activeDayId === day.id && viewMode === 'daily' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500 rounded-t-full"></div>}
                </button>
              ))}
            </div>
            
            <div className="w-px h-8 bg-slate-300/50 mx-4 shrink-0"></div>
            
            <button 
                onClick={handleFinishSession}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-[1.25rem] font-black text-xs uppercase tracking-wide shadow-xl shadow-emerald-500/20 hover:-translate-y-0.5 hover:shadow-emerald-500/30 active:scale-95 transition-all shrink-0 mr-4"
                title="Finalizar Sesión del Día"
            >
                <CheckCircle2 size={16} strokeWidth={2.5} />
                Finalizar Sesión
            </button>
          </div>

          {/* Desktop icons */}
          <div className="flex items-center gap-2 border-l border-slate-300/50 pl-6 ml-2 shrink-0 h-full">
              <button onClick={() => setViewMode('plan')} title="Proyección Mensual" className={`p-3 rounded-2xl transition-all shadow-sm active:scale-95 ${viewMode === 'plan' ? 'bg-primary-600 text-white shadow-primary-500/20 shadow-lg' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}><Layers size={20} strokeWidth={2.5} /></button>
              <button onClick={() => setViewMode('stats')} title="Estadísticas" className={`p-3 rounded-2xl transition-all shadow-sm active:scale-95 ${viewMode === 'stats' ? 'bg-slate-900 text-white shadow-slate-900/20 shadow-lg' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}><BarChart2 size={20} strokeWidth={2.5} /></button>
              <button onClick={() => setViewMode('evaluations')} title="Evaluaciones Clínicas" className={`p-3 rounded-2xl transition-all shadow-sm active:scale-95 ${viewMode === 'evaluations' ? 'bg-blue-600 text-white shadow-blue-500/20 shadow-lg' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}><Award size={20} strokeWidth={2.5} /></button>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-container relative z-10">
        <div className="max-w-5xl mx-auto h-full">
          {/* VISTA DIARIA */}
          {viewMode === 'daily' && resolvedActiveDay ? (
              <div className="space-y-6 max-w-2xl mx-auto pb-24 animate-fade-in">
                  <div className="flex justify-between items-end px-2 mb-4 bg-white/50 backdrop-blur py-4 rounded-2xl shadow-sm border border-slate-200/50">
                      <div className="flex flex-col px-4">
                        <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Calendar size={12}/> Plan del Día</span>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{resolvedActiveDay.name}</h3>
                      </div>
                      <div className="px-4">
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">Ciclo Semana {currentWeek}</span>
                      </div>
                  </div>
                  {(() => {
                      const supersetInfo = getSupersetInfo(resolvedActiveDay.exercises);
                      const blocks: { isGroup: boolean; groupId?: string; exercises: RoutineExercise[] }[] = [];
                      resolvedActiveDay.exercises.forEach(ex => {
                        if (ex.supersetGroup) {
                          if (blocks.length > 0 && blocks[blocks.length - 1].groupId === ex.supersetGroup) {
                            blocks[blocks.length - 1].exercises.push(ex);
                          } else {
                            blocks.push({ isGroup: true, groupId: ex.supersetGroup, exercises: [ex] });
                          }
                        } else {
                          blocks.push({ isGroup: false, exercises: [ex] });
                        }
                      });

                      return (
                        <>
                          {blocks.map((block, bIdx) => (
                            <div key={block.isGroup ? block.groupId : block.exercises[0].id} className={`flex flex-col animate-slide-up ${block.isGroup ? 'shadow-sm rounded-2xl' : ''}`} style={{ animationDelay: `${bIdx * 40}ms` }}>
                              {block.exercises.map((ex, exIdx) => {
                                const ssInfo = supersetInfo.get(ex.id);
                                const isFirstInGroup = block.isGroup && block.exercises.length > 1 && exIdx === 0;
                                const isLastInGroup = block.isGroup && block.exercises.length > 1 && exIdx === block.exercises.length - 1;
                                const isMiddleInGroup = block.isGroup && block.exercises.length > 1 && !isFirstInGroup && !isLastInGroup;

                                return (
                                  <ExerciseCard
                                    key={ex.id}
                                    exercise={ex}
                                    role={role}
                                    onUpdate={(id, up) => handleExerciseUpdate(id, up)}
                                    onShowHistory={(e) => setChartExercise(e)}
                                    onDelete={(id) => handleRemoveExercise(activeDayId, id)}
                                    supersetLabel={ssInfo?.label}
                                    supersetColor={ssInfo?.color}
                                    isFirstInGroup={isFirstInGroup}
                                    isLastInGroup={isLastInGroup}
                                    isMiddleInGroup={isMiddleInGroup}
                                  />
                                );
                              })}
                            </div>
                          ))}

                          {resolvedActiveDay.exercises.length > 0 && (
                            <div className="pt-6 pb-2 text-center">
                              <button
                                onClick={handleFinishSession}
                                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/20 hover:scale-[1.01] active:scale-95 transition-all"
                              >
                                <CheckCircle2 size={18} strokeWidth={2.5} />
                                Finalizar Sesión y Registrar Progreso
                              </button>
                            </div>
                          )}
                        </>
                      );
                  })()}
                  {resolvedActiveDay.exercises.length === 0 && (
                    <div className="py-24 text-center glass-panel rounded-[2rem] border-dashed">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                            <Activity className="text-slate-400" size={32} />
                        </div>
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Día sin ejercicios</p>
                    </div>
                  )}
              </div>

          ) : viewMode === 'plan' ? (
              /* PLAN DE 6 MESES (PROYECCIÓN FUTURA CON IA) */
              <div className="space-y-10 pb-24 max-w-5xl mx-auto animate-slide-up">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/40 backdrop-blur-md p-8 rounded-[2.5rem] border border-slate-200/50 shadow-sm">
                      <div className="space-y-2">
                          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                            Proyección de 6 Meses
                            <span className="bg-amber-100 text-amber-700 text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider">Macrociclo Clínico</span>
                          </h3>
                          <p className="text-sm font-bold text-slate-500">Planifica con IA y proyecta el progreso de sets, repeticiones y cargas a largo plazo.</p>
                      </div>
                      {isKine && (
                        <button
                            onClick={() => setShowAIPlannerModal(true)}
                            className="bg-slate-900 text-white flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95 shrink-0"
                        >
                            <Sparkles size={16} className="text-amber-400 animate-pulse" />
                            Planificar con IA
                        </button>
                      )}
                  </div>

                  {/* Selector de Mesociclo */}
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 p-1.5 bg-slate-200/40 rounded-[2rem] border border-slate-200/30">
                    {[1, 2, 3, 4, 5, 6].map((num) => {
                      const isActive = selectedMesocycle === num;
                      const weeksText = `Semanas ${((num - 1) * 4) + 1}-${num * 4}`;
                      return (
                        <button
                          key={num}
                          onClick={() => setSelectedMesocycle(num)}
                          className={`flex-1 min-w-[120px] py-3 px-4 rounded-[1.5rem] text-xs font-black uppercase tracking-wide transition-all duration-300 ${
                            isActive
                              ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                              : 'text-slate-500 hover:text-slate-800 hover:bg-white/30'
                          }`}
                        >
                          <span className="block text-[9px] opacity-75">Mesociclo {num}</span>
                          <span className="block text-[11px] mt-0.5">{weeksText}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Renderizado de las 4 semanas del Mesociclo seleccionado */}
                  <div className="grid grid-cols-1 gap-8">
                  {(() => {
                    const startWeekNum = (selectedMesocycle - 1) * 4 + 1;
                    const weeksArray = [startWeekNum, startWeekNum + 1, startWeekNum + 2, startWeekNum + 3];
                    const activeRoutine = routineType === 'CLINIC' ? patient.routine : (patient.homeRoutine || { days: [] });
                    
                    if (activeRoutine.days.length === 0 || activeRoutine.days.every(d => d.exercises.length === 0)) {
                      return (
                        <div className="py-20 text-center glass-panel rounded-[2.5rem] border-dashed border-2 border-slate-200">
                          <Activity className="mx-auto text-slate-300 mb-4 animate-pulse" size={48} />
                          <h4 className="text-slate-700 font-black uppercase text-sm tracking-widest">Sin Planificación Activa</h4>
                          <p className="text-slate-400 text-xs mt-2 max-w-sm mx-auto font-medium">Usa la biblioteca de ejercicios o haz click en "Planificar con IA" para diseñar la progresión del paciente.</p>
                        </div>
                      );
                    }

                    return weeksArray.map((weekNum) => {
                      const isCurrent = currentWeek === weekNum;
                      return (
                        <div key={weekNum} className={`glass-card overflow-hidden transition-all duration-300 ${isCurrent ? 'border-primary-200 ring-4 ring-primary-100 shadow-xl scale-[1.01] z-10' : 'border-slate-200/60 opacity-90 hover:opacity-100'}`}>
                            <div className={`px-8 py-5 flex justify-between items-center bg-white border-b border-slate-100 ${isCurrent ? 'bg-primary-50/50' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <h4 className={`font-black text-lg uppercase tracking-wide ${isCurrent ? 'text-primary-700' : 'text-slate-800'}`}>Semana {weekNum}</h4>
                                    {isCurrent && <span className="bg-primary-600 text-white px-3 py-1 rounded-[1rem] text-[9px] font-black uppercase shadow-sm tracking-wider">SEMANA ACTUAL</span>}
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${isCurrent ? 'text-primary-400' : 'text-slate-400'}`}>Mesociclo {selectedMesocycle}</span>
                            </div>
                            
                            <div className="p-6 overflow-x-auto no-scrollbar bg-slate-50/20">
                                <div className="flex gap-6 min-w-max pb-2">
                                    {activeRoutine.days.map((day, idx) => (
                                        <div key={`${weekNum}-${day.id}`} className="w-72 shrink-0 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200/50 hover:shadow-md transition-shadow duration-300">
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                                                <span>Día {idx+1}</span>
                                                <span className="text-[9px] opacity-75 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{day.name.split(':')[0]}</span>
                                            </p>
                                            
                                            <div className="space-y-4">
                                                {day.exercises.map(ex => {
                                                  // Buscar target para esta semana en weeklyTargets
                                                  let wSets = ex.targetSets;
                                                  let wReps = ex.targetReps;
                                                  let wLoad = ex.targetLoad;
                                                  let hasTarget = false;

                                                  if (ex.weeklyTargets) {
                                                    const target = ex.weeklyTargets.find(t => t.week === weekNum);
                                                    if (target) {
                                                      wSets = target.sets;
                                                      wReps = target.reps;
                                                      wLoad = target.load;
                                                      hasTarget = true;
                                                    }
                                                  }

                                                  const isTime = ex.definition.metricType === 'time';
                                                  const isTension = ex.definition.metricType === 'tension';

                                                  return (
                                                    <div key={`${weekNum}-${ex.id}`} className="flex flex-col gap-2 relative">
                                                        <div className="flex items-start justify-between gap-2">
                                                          <span className="text-xs font-black text-slate-800 leading-tight truncate w-[80%]">{ex.definition.name}</span>
                                                          {ex.definition.difficulty && (
                                                            <span className="text-[8px] bg-amber-50 text-amber-700 px-1 py-0.2 rounded font-black tracking-tighter shrink-0 border border-amber-100">D{ex.definition.difficulty}</span>
                                                          )}
                                                        </div>
                                                        
                                                        <div className="flex justify-between items-center mt-1">
                                                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${hasTarget ? 'bg-indigo-50/70 text-indigo-600 border border-indigo-100/30' : 'bg-slate-50 text-slate-500'}`}>
                                                            {wSets}x{isTime ? `${wLoad}s` : wReps}
                                                          </span>
                                                          <span className={`text-[11px] font-black ${isTension ? 'text-purple-600' : 'text-primary-600'}`}>
                                                            {isTime ? 'Isometrico' : 
                                                             isTension ? (wLoad === 1 ? 'Banda Baja' : wLoad === 2 ? 'Banda Media' : 'Banda Alta') : 
                                                             `${wLoad}kg`}
                                                          </span>
                                                        </div>
                                                        <div className="h-[0.5px] bg-slate-100 mt-2"></div>
                                                    </div>
                                                  );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                      );
                    });
                  })()}
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
                                                                          <span className={`text-[13px] font-black ${item.definition.metricType === 'tension' ? 'text-purple-600' : 'text-primary-600'}`}>
                                                                              {item.definition.metricType === 'time' ? '' : 
                                                                               item.definition.metricType === 'tension' ? (item.log.load === 1 ? 'Baja' : item.log.load === 2 ? 'Media' : 'Alta') : 
                                                                               `${item.log.load}kg`}
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
                  <header className="bg-white border-b border-slate-100 px-4 sm:px-8 py-3 flex flex-row items-center justify-between shrink-0 gap-2 sm:gap-4 overflow-x-auto hide-scrollbar">
                      <div className="flex flex-row items-center gap-3 sm:gap-4 w-auto shrink-0">
                          <div className="hidden sm:block landscape:hidden">
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Editor de Rutina</h2>
                            <p className="text-xs font-medium text-slate-500">Modifica la estructura</p>
                          </div>
                          
                          <div className="w-px h-8 bg-slate-200 hidden sm:block mx-0 sm:mx-2 landscape:hidden"></div>
                          
                          <div className="flex flex-row items-center gap-3 shrink-0">
                            <div className="flex bg-slate-100/80 p-1 rounded-xl shadow-inner border border-slate-200/50">
                                <button onClick={() => handleUpdateStage(Stage.KINESIOLOGY)} className={`px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-lg font-bold text-[10px] sm:text-xs uppercase tracking-wide transition-all ${patient.routine.stage === Stage.KINESIOLOGY ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>Kinesiología</button>
                                <button onClick={() => handleUpdateStage(Stage.GYM)} className={`px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-lg font-bold text-[10px] sm:text-xs uppercase tracking-wide transition-all ${patient.routine.stage === Stage.GYM ? 'bg-white text-teal-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>Gimnasio</button>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 bg-white px-1 sm:px-2 py-1 rounded-xl border border-slate-200 shadow-sm shrink-0">
                                <button onClick={handleRemoveLastDay} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"><Minus size={16}/></button>
                                <div className="flex flex-col items-center min-w-[40px]"><span className="text-lg sm:text-xl font-black leading-none">{patient.routine.days.length}</span><span className="text-[8px] font-bold uppercase text-slate-400 tracking-widest mt-0.5">Días</span></div>
                                <button onClick={handleAddDay} disabled={patient.routine.days.length >= 7} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-slate-400 hover:bg-primary-50 hover:text-primary-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"><Plus size={16}/></button>
                            </div>
                          </div>
                      </div>
                      <div className="flex-1"></div>
                      <button onClick={() => setShowRoutineEditor(false)} className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 transition-colors shadow-sm shrink-0 sticky right-0"><X size={20} /></button>
                  </header>
                  <div className="flex-1 overflow-x-auto p-3 sm:p-6 bg-slate-50/50 min-h-0">
                      <div className="flex items-start gap-4 sm:gap-6 h-full min-w-max pb-10">
                          {(routineType === 'CLINIC' ? patient.routine : (patient.homeRoutine || { days: [] })).days.map((day, dIdx) => (
                              <div key={day.id} className="w-[22rem] bg-white rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full shrink-0 overflow-hidden">
                                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center gap-3">
                                      <input className="font-black text-xl text-slate-900 bg-transparent border-none focus:ring-0 p-0 w-full placeholder:text-slate-300 focus:outline-none" value={day.name} onChange={(e) => handleRenameDay(day.id, e.target.value)} placeholder={`Día ${dIdx+1}`} />
                                      <button onClick={() => handleRemoveDay(day.id)} className="text-slate-400 hover:text-red-500 bg-white p-2 rounded-lg shadow-sm border border-slate-200 transition-colors shrink-0" title="Borrar Día"><Trash2 size={16}/></button>
                                  </div>
                                  <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-container bg-white">
                                      {/* Toolbar de Biserie/Triserie flotante se movió al final del contenedor para ser sticky */}
                                      {(() => {
                                        const supersetInfo = getSupersetInfo(day.exercises);
                                        return (
                                          <Reorder.Group 
                                            values={day.exercises} 
                                            onReorder={(newOrder) => handleReorderExercises(day.id, newOrder)} 
                                            className="space-y-3 mb-4"
                                          >
                                            {day.exercises.map((ex) => {
                                              const ssInfo = supersetInfo.get(ex.id);
                                              const isSelectedInEditor = editorSelectedExIds.includes(ex.id);
                                              return (
                                                <ReorderableExerciseItem
                                                  key={ex.id}
                                                  ex={ex}
                                                  day={day}
                                                  dayExercises={day.exercises}
                                                  isSelectedInEditor={isSelectedInEditor}
                                                  ssInfo={ssInfo}
                                                  editorSelectedExIds={editorSelectedExIds}
                                                  setEditorSelectedExIds={setEditorSelectedExIds}
                                                  handleExerciseUpdate={handleExerciseUpdate}
                                                  handleRemoveExercise={handleRemoveExercise}
                                                  setZoomedImage={setZoomedImage}
                                                />
                                              );
                                            })}
                                          </Reorder.Group>
                                        );
                                      })()}

                                      <button onClick={() => setIsAddingExerciseModal({show: true, dayId: day.id})} className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[1.5rem] bg-slate-50/50 text-sm font-bold text-slate-400 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-all flex flex-col items-center gap-2 mb-4">
                                          <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"><Plus size={20} /></div>
                                          Agregar Ejercicio
                                      </button>
                                      
                                      {/* Toolbar Sticky de Biserie/Triserie */}
                                      {(() => {
                                        const hasSelectionInThisDay = editorSelectedExIds.some(id => day.exercises.some(ex => ex.id === id));
                                        if (hasSelectionInThisDay) {
                                          return (
                                            <div className="sticky bottom-2 z-50 animate-slide-up">
                                              <div className="flex flex-col items-center shadow-2xl bg-indigo-900 border border-indigo-800 rounded-2xl p-3 gap-2 flex-wrap text-white">
                                                <span className="text-xs font-bold text-indigo-200">{editorSelectedExIds.length} seleccionado{editorSelectedExIds.length > 1 ? 's' : ''}</span>
                                                <div className="flex gap-2 w-full justify-center">
                                                  <button
                                                    disabled={editorSelectedExIds.length < 2}
                                                    onClick={() => handleGroupAsSuperset(day.id, editorSelectedExIds)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-indigo-500 text-white rounded-xl text-xs font-black disabled:opacity-40 hover:bg-indigo-400 transition-all shadow-sm"
                                                  >
                                                    <Link2 size={14} /> Agrupar
                                                  </button>
                                                  <button
                                                    onClick={() => handleRemoveFromSuperset(day.id, editorSelectedExIds)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white/10 border border-white/20 text-white rounded-xl text-xs font-black hover:bg-red-500 hover:border-red-500 transition-all"
                                                  >
                                                    <Unlink size={14} /> Separar
                                                  </button>
                                                  <button
                                                    onClick={() => setEditorSelectedExIds([])}
                                                    className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-indigo-300 hover:text-white hover:bg-white/20 transition-colors"
                                                  >
                                                    <X size={16} />
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        }
                                        return null;
                                      })()}
                                  </div>
                              </div>
                          ))}

                          {/* Agregar Día Button */}
                          {(routineType === 'CLINIC' ? patient.routine : (patient.homeRoutine || { days: [] })).days.length < 7 && (
                              <button 
                                onClick={handleAddDay}
                                className="w-[22rem] rounded-[2rem] border-2 border-dashed border-slate-300 bg-slate-50/50 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-600 transition-all flex flex-col items-center justify-center h-full min-h-[400px] shrink-0 text-slate-400 font-bold group"
                              >
                                  <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                      <Plus size={32} />
                                  </div>
                                  <span className="text-lg">Agregar Día</span>
                              </button>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {chartExercise && <ProgressChart exercise={chartExercise} patient={patient} onClose={() => setChartExercise(null)} />}
      
      {isAddingExerciseModal.show && (
          <div className="fixed inset-0 z-[350] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-xl h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up relative">
                  <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col gap-3 relative shrink-0">
                      <div className="pr-12">
                         <h3 className="text-xl font-black text-slate-900 tracking-tight">Biblioteca de Ejercicios</h3>
                      </div>
                      <div className="relative group">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                          <input type="text" placeholder="Buscar por nombre, subzona o movimiento..." className="w-full pl-11 pr-4 py-3 bg-slate-100/80 border border-slate-200/50 rounded-xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" value={exerciseSearch} onChange={e => setExerciseSearch(e.target.value)} />
                      </div>
                      
                      {/* Filtros por Zona Corporal */}
                      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        <button
                          onClick={() => setExerciseRegionFilter('')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold whitespace-nowrap transition-all ${!exerciseRegionFilter ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                          Todas las zonas
                        </button>
                        {BODY_REGIONS.map(reg => (
                          <button
                            key={reg}
                            onClick={() => setExerciseRegionFilter(exerciseRegionFilter === reg ? '' : reg)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold whitespace-nowrap transition-all ${exerciseRegionFilter === reg ? 'bg-primary-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                          >
                            {reg}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => { setIsAddingExerciseModal({show:false, dayId:''}); setSelectedExerciseIds([]); setExerciseRegionFilter(''); setExerciseSearch(''); }} className="absolute top-4 right-4 w-8 h-8 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 transition-colors shadow-sm"><X size={18}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-1.5 bg-slate-50/50 scroll-container">
                      {exercises.filter(ex => {
                          const inferred = inferExerciseCategories(ex);
                          if (exerciseRegionFilter && inferred.region !== exerciseRegionFilter) return false;
                          if (exerciseSearch.trim()) {
                            const q = exerciseSearch.toLowerCase();
                            const matchName = ex.name.toLowerCase().includes(q);
                            const matchCat = (ex.category || '').toLowerCase().includes(q);
                            const matchSub = inferred.subRegion.toLowerCase().includes(q);
                            const matchMov = inferred.movementType.toLowerCase().includes(q);
                            return matchName || matchCat || matchSub || matchMov;
                          }
                          return true;
                      }).map(ex => {
                          const isSelected = selectedExerciseIds.includes(ex.id);
                          return (
                              <button key={ex.id} onClick={() => setSelectedExerciseIds(prev => isSelected ? prev.filter(i => i !== ex.id) : [...prev, ex.id])} className={`w-full flex items-center p-2 rounded-lg border-2 transition-all duration-300 text-left ${isSelected ? 'bg-primary-50/50 border-primary-500 shadow-sm ring-2 ring-primary-500/10' : 'bg-white border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300'}`}>
                                  <div className="mr-3 flex-shrink-0 relative">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary-500 border-primary-500' : 'bg-transparent border-slate-300'}`}>
                                        {isSelected && <CheckCircle2 size={10} className="text-white"/>}
                                    </div>
                                  </div>
                                  <div className="relative shrink-0 mr-3">
                                    {(() => {
                                      const media = ex.videoUrl ? parseMediaUrl(ex.videoUrl) : null;
                                      if (media && (media.thumbnailUrl || media.type === 'instagram')) {
                                        return (
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setZoomedImage({ url: ex.videoUrl || '', name: ex.name });
                                            }}
                                            className={`w-10 h-10 rounded-lg object-cover shadow-sm overflow-hidden relative group cursor-zoom-in flex items-center justify-center ${media.type === 'instagram' ? 'bg-gradient-to-br from-pink-400 to-purple-600' : 'bg-slate-100'}`}
                                          >
                                            {media.thumbnailUrl ? (
                                              <img src={media.thumbnailUrl} className="w-full h-full object-cover" />
                                            ) : (
                                              <Activity size={16} className="text-white" />
                                            )}
                                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                              <Maximize2 size={12} className="text-white" />
                                            </div>
                                          </button>
                                        );
                                      }
                                      return (
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shadow-inner">
                                            {ex.metricType === 'time' ? <Timer size={16} className="text-slate-400"/> : ex.metricType === 'tension' ? <Activity size={16} className="text-purple-400"/> : <Dumbbell size={16} className="text-slate-400"/>}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <p className="font-extrabold text-slate-800 text-sm truncate mb-0.5">{ex.name}</p>
                                      <div className="flex gap-2">
                                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded flex items-center">{ex.category}</span>
                                          {ex.metricType === 'time' && <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded flex items-center">Por Tiempo</span>}
                                          {ex.metricType === 'tension' && <span className="text-[9px] font-bold text-purple-500 uppercase tracking-widest bg-purple-50 px-1.5 py-0.5 rounded flex items-center">Banda Elástica</span>}
                                      </div>
                                  </div>
                              </button>
                          );
                      })}
                      {exercises.filter(ex => {
                          const inferred = inferExerciseCategories(ex);
                          if (exerciseRegionFilter && inferred.region !== exerciseRegionFilter) return false;
                          if (exerciseSearch.trim()) {
                            const q = exerciseSearch.toLowerCase();
                            const matchName = ex.name.toLowerCase().includes(q);
                            const matchCat = (ex.category || '').toLowerCase().includes(q);
                            const matchSub = inferred.subRegion.toLowerCase().includes(q);
                            const matchMov = inferred.movementType.toLowerCase().includes(q);
                            return matchName || matchCat || matchSub || matchMov;
                          }
                          return true;
                      }).length === 0 && (
                          <div className="py-16 text-center">
                              <Search className="mx-auto text-slate-300 mb-3" size={36}/>
                              <p className="text-slate-500 font-bold text-base">No se encontraron ejercicios</p>
                              <p className="text-slate-400 text-xs mt-1">Prueba usando otro término o seleccionando otra zona.</p>
                          </div>
                      )}
                  </div>
                  <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] shrink-0">
                        <button disabled={selectedExerciseIds.length === 0} className="bg-slate-900 text-white flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-black text-sm shadow-xl shadow-slate-900/20 disabled:opacity-50 disabled:shadow-none hover:bg-black active:scale-95 transition-all" onClick={() => {
                                const newExs: RoutineExercise[] = selectedExerciseIds.map(id => {
                                    const def = exercises.find(e => e.id === id)!;
                                    return {
                                        id: `re-${Date.now()}-${id}`, definitionId: id, definition: def,
                                        targetSets: 3, targetReps: def.metricType === 'time' ? 0 : 12, targetLoad: def.metricType === 'tension' ? 2 : 0, isDone: false, history: []
                                    };
                                });
                                const routineKey = routineType === 'CLINIC' ? 'routine' : 'homeRoutine';
                                const currentRoutine = patient[routineKey] || { id: `r-${Date.now()}`, stage: Stage.KINESIOLOGY, currentWeek: 1, days: [] };
                                const newDays = currentRoutine.days.map(d => d.id === isAddingExerciseModal.dayId ? { ...d, exercises: [...d.exercises, ...newExs] } : d);
                                onUpdatePatient({ ...patient, [routineKey]: { ...currentRoutine, days: newDays } });
                                setIsAddingExerciseModal({show:false, dayId:''});
                                setSelectedExerciseIds([]);
                            }}>
                                <CheckSquare size={18}/>
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

      {/* AI Planner Modal */}
      {showAIPlannerModal && (
        <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="text-amber-500" size={20} />
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Planificador IA</h3>
              </div>
              <button 
                onClick={() => setShowAIPlannerModal(false)} 
                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                disabled={isAiGenerating}
              >
                <X size={20} />
              </button>
            </header>

            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
              {isAiGenerating ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
                    <Sparkles className="text-amber-500 absolute inset-0 m-auto animate-pulse" size={24} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Generando Planificación...</h4>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">Analizando biblioteca y estructurando progresión de 6 meses</p>
                  </div>
                  <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left space-y-3">
                    <div className="flex items-center gap-2.5 text-xs text-slate-600 font-bold">
                      <span className="text-emerald-500 font-black">✓</span> Evaluando condición: <span className="text-slate-800">{patient.condition || 'General'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-slate-600 font-bold">
                      <span className="text-emerald-500 font-black">✓</span> Escaneando biblioteca de ejercicios
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-slate-600 font-bold">
                      <span className="text-primary-600 animate-spin">⟳</span> Proyectando progresiones de 24 semanas
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-slate-400 font-bold">
                      <span>○</span> Ordenando ejercicios por nivel de dificultad
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Condición Clínica del Paciente</label>
                    <div className="p-4 bg-slate-50 rounded-2xl text-slate-700 text-sm font-bold border border-slate-100">
                      {patient.condition || "No especificada"}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Objetivos del Macrociclo (6 meses)</label>
                    <input 
                      className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all" 
                      value={aiObjectives} 
                      onChange={e => setAiObjectives(e.target.value)} 
                      placeholder="Ej: Aumentar fuerza, hipertrofia muscular, estabilidad lateral..." 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Estilo de Progresión</label>
                    <select
                      className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all border-none cursor-pointer"
                      value={aiProgressionStyle}
                      onChange={e => setAiProgressionStyle(e.target.value)}
                    >
                      <option value="Lineal">Progresión Lineal (Aumento constante y descargas periódicas)</option>
                      <option value="Step">En Escalón (Salto mensual en intensidad y descarga)</option>
                      <option value="Ondulante">Progresión Ondulante (Intensidad y volumen variables semana a semana)</option>
                      <option value="Conservadora">Progresión Conservadora (Lenta y enfocada en control motor)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Frecuencia Semanal (Días de rutina)</label>
                    <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setAiSessionsPerWeek(num)}
                          className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${aiSessionsPerWeek === num ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                        >
                          {num} Día{num !== 1 ? 's' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {!isAiGenerating && (
              <div className="p-6 bg-white border-t border-slate-100 flex gap-3">
                <button 
                  onClick={() => setShowAIPlannerModal(false)} 
                  className="flex-1 py-4 text-xs font-black uppercase text-slate-400 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleGenerateAIPlan}
                  className="flex-[2] py-4 bg-slate-900 text-white rounded-xl text-xs font-black uppercase shadow-xl hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Sparkles size={16} className="text-amber-400" />
                  Generar Planificación
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};