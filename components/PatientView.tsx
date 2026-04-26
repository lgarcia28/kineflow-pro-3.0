import React, { useState } from 'react';
import { Patient, Product, PlanType, RoutineExercise, RoutineDay, ExerciseDefinition, UserRole, Stage } from '../types';
import { TabataTimer } from './TabataTimer';
import { 
  Calendar, 
  ShoppingBag, 
  Home, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  MessageCircle,
  ChevronRight,
  Activity,
  User,
  AlertCircle,
  Timer,
  X,
  Maximize2,
  Award
} from 'lucide-react';
import { EvaluationDashboard } from './EvaluationDashboard';
import { parseMediaUrl } from '../utils/mediaUrl';

interface PatientViewProps {
  patient: Patient;
  products: Product[];
  exercises: ExerciseDefinition[];
  onUpdatePatient: (updated: Patient) => void;
}

export const PatientView: React.FC<PatientViewProps> = ({ patient, products, exercises, onUpdatePatient }) => {
  // Helper: get the latest image URL from central library, fall back to definition's stored URL
  const resolveExerciseImage = (ex: RoutineExercise): string | undefined => {
    const master = exercises.find(e => e.id === ex.definitionId);
    return master?.videoUrl || ex.definition?.videoUrl;
  };
  const [activeTab, setActiveTab] = useState<'HOME' | 'ROUTINE' | 'HOME_ROUTINE' | 'TIMER' | 'EVALUATIONS'>('HOME');
  // Guardamos solo el ID del día para que cuando Firestore actualice el patient, el selectedDay refleje los nuevos datos
  const [selectedDayId, setSelectedDayId] = useState<string | null>(
    patient.routine.days[0]?.id || null
  );
  // Derivamos selectedDay dinámicamente desde la prop patient para que siempre esté actualizado
  const selectedDay = patient.routine.days.find(d => d.id === selectedDayId) || patient.routine.days[0] || null;
  const [zoomedImage, setZoomedImage] = useState<{url: string, name: string} | null>(null);

  const supersetPalette = [
    { bg: 'bg-indigo-500', text: 'text-indigo-600', key: 'indigo' },
    { bg: 'bg-emerald-500', text: 'text-emerald-600', key: 'emerald' },
    { bg: 'bg-orange-500', text: 'text-orange-600', key: 'orange' },
    { bg: 'bg-pink-500', text: 'text-pink-600', key: 'pink' },
    { bg: 'bg-cyan-500', text: 'text-cyan-600', key: 'cyan' },
  ];

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

    const groupCounters = new Map<string, number>();
    exercises.forEach(ex => {
      if (!ex.supersetGroup) return;
      const info = groupMap.get(ex.supersetGroup)!;
      const count = (groupCounters.get(ex.supersetGroup) || 0) + 1;
      groupCounters.set(ex.supersetGroup, count);
      result.set(ex.id, { label: `${info.label}${count}`, color: info.color });
    });

    return result;
  };

  const getPlanStatus = () => {
    const today = new Date();
    const expiration = new Date(patient.expirationDate);
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (patient.planType === PlanType.SESSIONS) {
      const remaining = patient.remainingSessions || 0;
      if (remaining <= 0) return { label: 'Vencido', sub: '0 sesiones restantes', color: 'bg-red-500', text: 'text-red-500', bg: 'bg-red-50' };
      if (remaining <= 3) return { label: 'Próximo a vencer', sub: `${remaining} sesiones restantes`, color: 'bg-orange-500', text: 'text-orange-500', bg: 'bg-orange-50' };
      return { label: 'Vigente', sub: `${remaining} sesiones restantes`, color: 'bg-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-50' };
    } else {
      if (diffDays <= 0) return { label: 'Vencido', sub: `Expiró el ${patient.expirationDate}`, color: 'bg-red-500', text: 'text-red-500', bg: 'bg-red-50' };
      if (diffDays <= 7) return { label: 'Próximo a vencer', sub: `Vence en ${diffDays} días`, color: 'bg-orange-500', text: 'text-orange-500', bg: 'bg-orange-50' };
      return { label: 'Vigente', sub: `Vence en ${diffDays} días`, color: 'bg-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-50' };
    }
  };

  const handleWhatsApp = (productName: string) => {
    const message = encodeURIComponent(`Hola! Soy ${patient.firstName} ${patient.lastName} y estoy interesado en el producto: ${productName}`);
    window.open(`https://wa.me/5493416055274?text=${message}`, '_blank');
  };

  const handleMarkHomeDone = (exerciseId: string, observations?: string) => {
    if (!patient.homeRoutine) return;

    const today = new Date().toISOString().split('T')[0];
    const newDays = patient.homeRoutine.days.map(day => ({
      ...day,
      exercises: day.exercises.map(ex => {
        if (ex.id === exerciseId) {
          const newHistory = [...(ex.history || [])];
          newHistory.push({
            date: today,
            week: patient.homeRoutine?.currentWeek || 1,
            load: ex.targetLoad,
            reps: ex.targetReps,
            rpe: 5, // Default RPE for home
            pain: 0, // Default pain
            observation: observations
          });
          return { ...ex, isDone: true, history: newHistory };
        }
        return ex;
      })
    }));

    onUpdatePatient({
      ...patient,
      homeRoutine: { ...patient.homeRoutine, days: newDays }
    });
  };

  const status = getPlanStatus();

  return (
    <div className="flex-1 h-full bg-slate-50 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="bg-white px-6 py-6 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-100">
            <User className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 leading-tight">Hola, {patient.firstName}</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Panel del Paciente</p>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-full ${status.bg} flex items-center gap-2 border border-white`}>
          <span className={`w-2 h-2 rounded-full ${status.color}`}></span>
          <span className={`text-[10px] font-black uppercase tracking-wider ${status.text}`}>{status.label}</span>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white px-6 py-2 flex gap-4 overflow-x-auto border-b border-slate-100 scroll-container">
        <button 
          onClick={() => setActiveTab('HOME')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'HOME' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-400'}`}
        >
          <Home size={18} /> Inicio
        </button>
        <button 
          onClick={() => setActiveTab('ROUTINE')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'ROUTINE' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-400'}`}
        >
          <Activity size={18} /> Mi Rutina
        </button>
        <button 
          onClick={() => setActiveTab('HOME_ROUTINE')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'HOME_ROUTINE' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-400'}`}
        >
          <Home size={18} /> Domiciliaria
        </button>
        <button 
          onClick={() => setActiveTab('TIMER')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'TIMER' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-400'}`}
        >
          <Timer size={18} /> Timer
        </button>
        <button 
          onClick={() => setActiveTab('EVALUATIONS')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'EVALUATIONS' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400'}`}
        >
          <Award size={18} /> Resultados
        </button>
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-24">
        {activeTab === 'HOME' && (
          <div className="max-w-md mx-auto space-y-8">
            {/* Status Card */}
            <div className={`p-8 rounded-[2.5rem] shadow-xl border border-white ${status.bg}`}>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Estado de tu Plan</p>
              <h2 className={`text-4xl font-black mb-2 ${status.text}`}>{status.label}</h2>
              <p className="text-slate-500 font-medium">{status.sub}</p>
              {patient.expirationDate && (
                <div className="mt-6 flex items-center gap-2 text-xs font-bold text-slate-400">
                  <Calendar size={14} />
                  {patient.planType === PlanType.SESSIONS ? 'Sesiones hasta:' : 'Vence el:'} {patient.expirationDate}
                </div>
              )}
            </div>

            {/* Shop Section */}
            <div className="space-y-8">
              {/* Services Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-black text-slate-900">Servicios y Evaluaciones</h3>
                  <span className="bg-blue-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-blue-100">
                    Nuevos Servicios
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {products.filter(p => p.type === 'SERVICE').map(product => (
                    <div key={product.id} className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 flex items-center gap-4">
                      <img src={product.imageUrl} alt="" className="w-20 h-20 rounded-2xl object-cover" />
                      <div className="flex-1">
                        <h4 className="font-black text-slate-900 text-sm">{product.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{product.category}</p>
                        <p className="text-xs text-slate-500 font-medium mb-2">Consultar precio</p>
                        <button 
                          onClick={() => handleWhatsApp(product.name)}
                          className="flex items-center gap-2 text-blue-500 font-black text-xs hover:underline"
                        >
                          <MessageCircle size={14} /> Consultar por WhatsApp
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Products Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-black text-slate-900">Productos RTP</h3>
                  <span className="bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-emerald-100">
                    15% OFF Pacientes
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {products.filter(p => p.type !== 'SERVICE').map(product => (
                    <div key={product.id} className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 flex items-center gap-4">
                      <img src={product.imageUrl} alt="" className="w-20 h-20 rounded-2xl object-cover" />
                      <div className="flex-1">
                        <h4 className="font-black text-slate-900 text-sm">{product.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{product.category}</p>
                        <p className="text-xs text-slate-500 font-medium mb-2">Consultar precio</p>
                        <button 
                          onClick={() => handleWhatsApp(product.name)}
                          className="flex items-center gap-2 text-emerald-500 font-black text-xs hover:underline"
                        >
                          <MessageCircle size={14} /> Consultar por WhatsApp
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ROUTINE' && (
          <div className="max-w-md mx-auto space-y-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scroll-container">
              {patient.routine.days.map(day => (
                <button
                  key={day.id}
                  onClick={() => setSelectedDayId(day.id)}
                  className={`px-6 py-3 rounded-2xl font-black text-xs whitespace-nowrap transition-all ${selectedDay?.id === day.id ? 'bg-primary-600 text-white shadow-lg shadow-primary-100' : 'bg-white text-slate-400 border border-slate-100'}`}
                >
                  {day.name}
                </button>
              ))}
            </div>

            {selectedDay ? (
              <div className="space-y-4">
                {(() => {
                  const supersetInfo = getSupersetInfo(selectedDay.exercises);
                  const blocks: { isGroup: boolean; groupId?: string; exercises: RoutineExercise[] }[] = [];
                  selectedDay.exercises.forEach(ex => {
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

                  return blocks.map((block) => (
                    <div key={block.isGroup ? block.groupId : block.exercises[0].id} className={`flex flex-col ${block.isGroup ? 'shadow-sm rounded-[2rem]' : ''}`}>
                      {block.exercises.map((ex, exIdx) => {
                        const ssInfo = supersetInfo.get(ex.id);
                        const isFirstInGroup = block.isGroup && block.exercises.length > 1 && exIdx === 0;
                        const isLastInGroup = block.isGroup && block.exercises.length > 1 && exIdx === block.exercises.length - 1;
                        const isMiddleInGroup = block.isGroup && block.exercises.length > 1 && !isFirstInGroup && !isLastInGroup;
                        
                        const groupClasses = isFirstInGroup ? 'rounded-t-[2rem] rounded-b-none border-b-0' :
                                             isMiddleInGroup ? 'rounded-none border-b-0' :
                                             isLastInGroup ? 'rounded-b-[2rem] rounded-t-none' : 'rounded-[2rem] shadow-sm';

                        const url = resolveExerciseImage(ex);
                        const media = url ? parseMediaUrl(url) : null;
                        const isGym = patient.routine.stage === Stage.GYM;

                        const getBgColor = (val: number | undefined) => {
                          if (!val) return { backgroundColor: '#ffffff', color: '#94a3b8', borderColor: '#e2e8f0' };
                          const hue = Math.max(0, 120 - (val - 1) * (120 / 9));
                          return {
                            backgroundColor: `hsl(${hue}, 85%, 94%)`,
                            color: `hsl(${hue}, 90%, 25%)`,
                            borderColor: `hsl(${hue}, 70%, 80%)`,
                          };
                        };

                        return (
                          <div key={ex.id} className={`bg-white p-5 border relative overflow-hidden transition-all ${groupClasses} ${block.isGroup ? 'border-slate-200' : 'border-slate-100'}`}>
                            {ssInfo && (
                              <div className={`absolute left-0 top-0 bottom-0 w-2 ${ssInfo.color}`} />
                            )}
                            <div className={`flex items-start gap-4 ${ssInfo ? 'pl-3' : ''}`}>
                              <button 
                                onClick={() => { if (url) setZoomedImage({ url, name: ex.definition.name }); }}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shrink-0 relative group mt-1 ${media ? 'cursor-zoom-in' : ''} ${media?.type === 'instagram' ? 'bg-gradient-to-br from-pink-400 to-purple-600' : 'bg-slate-50'}`}
                              >
                                {media ? (
                                  <>
                                    {media.thumbnailUrl ? <img src={media.thumbnailUrl} alt="" className="w-full h-full object-cover" /> : <Activity className="text-white" size={16}/>}
                                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                      <Maximize2 size={14} className="text-white" />
                                    </div>
                                  </>
                                ) : (
                                  <Activity className="text-slate-300" />
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <h4 className="font-black text-slate-900 truncate leading-tight">{ex.definition.name}</h4>
                                  {ssInfo && <span className={`${ssInfo.color} text-white px-2 py-0.5 rounded-md text-[9px] font-black uppercase shrink-0`}>{ssInfo.label}</span>}
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{ex.definition.category}</p>
                                
                                {/* Fila Inferior: Métricas - A la derecha de la imagen */}
                                <div className={`flex flex-nowrap items-stretch bg-slate-50/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-200/60 shadow-inner mt-3 overflow-x-auto hide-scrollbar`}>
                              {/* Series x Reps - SOLO LECTURA */}
                              <div className="flex flex-col items-center justify-center py-2 px-2 border-r border-slate-200/60 shrink-0 min-w-[70px]">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap mb-1 opacity-80">Plan</p>
                                <div className="flex items-baseline gap-0.5">
                                  <span className="text-sm font-black text-slate-800 leading-none">{ex.targetSets}</span>
                                  <span className="text-slate-300 text-[10px] font-bold mx-0.5">×</span>
                                  <span className="text-sm font-black text-slate-800 leading-none">{ex.targetReps}</span>
                                </div>
                              </div>

                              {/* Carga/Tiempo - EDITABLE SI ES GYM */}
                              <div className="flex flex-col items-center justify-center py-2 px-2 border-r border-slate-200/60 shrink-0 min-w-[75px] flex-1">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap mb-1 opacity-80">{ex.definition.metricType === 'kg' ? 'Carga' : 'Tiempo'}</p>
                                {isGym ? (
                                  <div className="flex flex-col items-center">
                                    <div className="flex items-baseline gap-0.5">
                                      <input 
                                        type="number"
                                        inputMode="decimal"
                                        pattern="[0-9]*"
                                        className="w-10 bg-transparent text-center text-sm font-black text-slate-800 outline-none focus:text-primary-600 transition-colors"
                                        value={ex.targetLoad ?? ''}
                                        onChange={(e) => {
                                          const newLoad = Number(e.target.value);
                                          const newDays = patient.routine.days.map(d => {
                                            if (d.id === selectedDay!.id) {
                                              return { ...d, exercises: d.exercises.map(exItem => exItem.id === ex.id ? { ...exItem, targetLoad: newLoad } : exItem) };
                                            }
                                            return d;
                                          });
                                          onUpdatePatient({ ...patient, routine: { ...patient.routine, days: newDays } });
                                        }}
                                      />
                                      <span className="text-[8px] font-black text-slate-400 uppercase">{ex.definition.metricType === 'kg' ? 'kg' : 's'}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm font-black text-slate-800 leading-none">
                                    {ex.targetLoad}<span className="text-[8px] font-bold text-primary-500 ml-1 uppercase">{ex.definition.metricType === 'kg' ? 'kg' : 's'}</span>
                                  </p>
                                )}
                              </div>

                              {isGym && (
                                <>
                                  {/* RPE */}
                                  <div className="flex flex-col items-center justify-center py-2 px-1.5 border-r border-slate-200/60 shrink-0 min-w-[45px]">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap mb-1 opacity-80">RPE</p>
                                    <select
                                      style={getBgColor(ex.currentRpe)}
                                      className="font-black text-[10px] rounded w-[38px] py-1 outline-none transition-all border shadow-sm cursor-pointer text-center appearance-none"
                                      value={ex.currentRpe || ""}
                                      onChange={(e) => {
                                        const newDays = patient.routine.days.map(d => {
                                          if (d.id === selectedDay!.id) {
                                            return { ...d, exercises: d.exercises.map(exItem => exItem.id === ex.id ? { ...exItem, currentRpe: Number(e.target.value) } : exItem) };
                                          }
                                          return d;
                                        });
                                        onUpdatePatient({ ...patient, routine: { ...patient.routine, days: newDays } });
                                      }}
                                    >
                                      <option value="" className="bg-white text-slate-400 font-normal">—</option>
                                      {[...Array(10)].map((_, i) => (
                                        <option key={i+1} value={i+1} style={getBgColor(i+1)} className="font-bold">{i+1}</option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Dolor */}
                                  <div className="flex flex-col items-center justify-center py-2 px-1.5 shrink-0 min-w-[45px]">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap mb-1 opacity-80">Dolor</p>
                                    <select
                                      style={getBgColor(ex.currentPain)}
                                      className="font-black text-[10px] rounded w-[38px] py-1 outline-none transition-all border shadow-sm cursor-pointer text-center appearance-none"
                                      value={ex.currentPain || ""}
                                      onChange={(e) => {
                                        const newDays = patient.routine.days.map(d => {
                                          if (d.id === selectedDay!.id) {
                                            return { ...d, exercises: d.exercises.map(exItem => exItem.id === ex.id ? { ...exItem, currentPain: Number(e.target.value) } : exItem) };
                                          }
                                          return d;
                                        });
                                        onUpdatePatient({ ...patient, routine: { ...patient.routine, days: newDays } });
                                      }}
                                    >
                                      <option value="" className="bg-white text-slate-400 font-normal">—</option>
                                      {[...Array(10)].map((_, i) => (
                                        <option key={i+1} value={i+1} style={getBgColor(i+1)} className="font-bold">{i+1}</option>
                                      ))}
                                    </select>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                          </div>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                <AlertCircle className="mx-auto text-slate-300 w-12 h-12 mb-4" />
                <p className="text-slate-400 font-bold">No hay rutina asignada para hoy</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'HOME_ROUTINE' && (
          <div className="max-w-md mx-auto">
            {patient.hasHomePlan && patient.homeRoutine ? (
              <div className="space-y-6">
                <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl">
                  <h2 className="text-3xl font-black mb-2">Rutina Domiciliaria</h2>
                  <p className="text-slate-400 text-sm font-medium">Ejercicios para realizar en casa y complementar tu tratamiento.</p>
                </div>
                <div className="space-y-4">
                  {(() => {
                    const days = patient.homeRoutine?.days[0];
                    if (!days) return null;
                    const supersetInfo = getSupersetInfo(days.exercises);
                    const blocks: { isGroup: boolean; groupId?: string; exercises: RoutineExercise[] }[] = [];
                    days.exercises.forEach(ex => {
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

                    return blocks.map((block) => (
                      <div key={block.isGroup ? block.groupId : block.exercises[0].id} className={`flex flex-col ${block.isGroup ? 'shadow-sm rounded-[2rem]' : ''}`}>
                        {block.exercises.map((ex, exIdx) => {
                          const ssInfo = supersetInfo.get(ex.id);
                          const isFirstInGroup = block.isGroup && block.exercises.length > 1 && exIdx === 0;
                          const isLastInGroup = block.isGroup && block.exercises.length > 1 && exIdx === block.exercises.length - 1;
                          const isMiddleInGroup = block.isGroup && block.exercises.length > 1 && !isFirstInGroup && !isLastInGroup;
                          
                          const groupClasses = isFirstInGroup ? 'rounded-t-[2rem] rounded-b-none border-b-0' :
                                               isMiddleInGroup ? 'rounded-none border-b-0' :
                                               isLastInGroup ? 'rounded-b-[2rem] rounded-t-none' : 'rounded-[2rem] shadow-sm';

                          const url = resolveExerciseImage(ex);
                          const media = url ? parseMediaUrl(url) : null;
                          
                          return (
                            <div key={ex.id} className={`bg-white p-5 border transition-all relative overflow-hidden ${groupClasses} ${ex.isDone ? 'border-emerald-500 bg-emerald-50/30' : block.isGroup ? 'border-slate-200' : 'border-slate-100'}`}>
                              {ssInfo && !ex.isDone && (
                                <div className={`absolute left-0 top-0 bottom-0 w-2 ${ssInfo.color}`} />
                              )}
                              <div className={`flex items-center justify-between mb-4 ${ssInfo && !ex.isDone ? 'pl-3' : ''}`}>
                                <div className="flex items-center gap-4">
                                  <button 
                                    onClick={() => { if (url) setZoomedImage({ url, name: ex.definition.name }); }}
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shrink-0 relative group ${media ? 'cursor-zoom-in' : ''} ${ex.isDone ? 'bg-emerald-500 text-white' : media?.type === 'instagram' ? 'bg-gradient-to-br from-pink-400 to-purple-600 outline-none' : 'bg-slate-50 text-primary-600'}`}
                                  >
                                    {!ex.isDone && media ? (
                                      <>
                                        {media.thumbnailUrl ? <img src={media.thumbnailUrl} alt="" className="w-full h-full object-cover" /> : <Activity className="text-white" size={16}/>}
                                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                          <Maximize2 size={14} className="text-white" />
                                        </div>
                                      </>
                                    ) : (
                                      ex.isDone ? <CheckCircle2 size={24} /> : <Home size={24} />
                                    )}
                                  </button>
                                  <div className="min-w-0 pr-4">
                                    <div className="flex items-center gap-2">
                                      <h4 className={`font-black truncate ${ex.isDone ? 'text-emerald-900' : 'text-slate-900'}`}>{ex.definition.name}</h4>
                                      {ssInfo && !ex.isDone && <span className={`${ssInfo.color} text-white px-2 py-0.5 rounded-md text-[9px] font-black uppercase shrink-0`}>{ssInfo.label}</span>}
                                    </div>
                                    <p className="text-xs text-slate-400 font-bold mt-0.5">{ex.targetSets}x{ex.targetReps} • {ex.targetLoad}{ex.definition.metricType === 'kg' ? 'kg' : 's'}</p>
                                  </div>
                                </div>
                                {!ex.isDone && (
                                  <button 
                                    onClick={() => handleMarkHomeDone(ex.id)}
                                    className="w-10 h-10 shrink-0 rounded-full border-2 border-slate-100 flex items-center justify-center text-slate-300 hover:border-emerald-500 hover:text-emerald-500 transition-all bg-white shadow-sm"
                                  >
                                    <CheckCircle2 size={20} />
                                  </button>
                                )}
                              </div>
                              {!ex.isDone && (
                                <textarea 
                                  placeholder="Observaciones (opcional)..."
                                  className={`w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-medium placeholder:text-slate-300 focus:ring-1 focus:ring-primary-500 ${ssInfo ? 'ml-3 w-[calc(100%-0.75rem)]' : ''}`}
                                  onBlur={(e) => {
                                    if (e.target.value.trim()) {
                                      // We could save observations here if we wanted to
                                    }
                                  }}
                                />
                              )}
                              {ex.isDone && (
                                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                  <CheckCircle2 size={14} /> Completado hoy
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 px-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="text-slate-300 w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Sin Rutina Domiciliaria</h3>
                <p className="text-slate-500 text-sm font-medium mb-8">No tienes una rutina domiciliaria disponible. Para obtenerla, contacta al profesional.</p>
                <button 
                  onClick={() => handleWhatsApp('Rutina Domiciliaria')}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2"
                >
                  <MessageCircle size={20} /> Consultar con Profesional
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'TIMER' && (
          <TabataTimer />
        )}

        {activeTab === 'EVALUATIONS' && (
          <EvaluationDashboard 
            patient={patient} 
            role={UserRole.PATIENT} 
            kineId="" 
          />
        )}
      </div>

      {/* Image Zoom Modal */}
      {zoomedImage && (() => {
        const media = parseMediaUrl(zoomedImage.url);
        return (
          <div 
            className="fixed inset-0 z-[300] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
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
              {media.isVideo ? (
                <div className="aspect-video bg-slate-900">
                  <iframe src={media.embedUrl} className="w-full h-full" allowFullScreen title={zoomedImage.name} />
                </div>
              ) : (
                <div className="aspect-video bg-slate-100 flex items-center justify-center">
                  <img src={media.embedUrl} alt={zoomedImage.name} className="max-w-full max-h-full object-contain block" />
                </div>
              )}
              <div className="p-8">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{zoomedImage.name}</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Vista Detallada</p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
