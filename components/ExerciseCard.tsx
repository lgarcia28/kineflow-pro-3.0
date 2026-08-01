
import React, { useState } from 'react';
import { RoutineExercise, UserRole, Stage, SetEntry, SetSegment } from '../types';
import { CheckCircle, Circle, Minus, Plus, TrendingUp, Trash2, Maximize2, X, Timer, Dumbbell, Play, Activity, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { parseMediaUrl } from '../utils/mediaUrl';

interface ExerciseCardProps {
  exercise: RoutineExercise;
  role: UserRole;
  routineStage?: Stage;
  onUpdate: (id: string, updates: Partial<RoutineExercise>) => void;
  onShowHistory: (exercise: RoutineExercise) => void;
  onDelete: (id: string) => void;
  supersetLabel?: string;       // Ej: "A", "B", "C" para etiquetar dentro del grupo
  supersetColor?: string;       // Clase de color para el indicador lateral
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  isMiddleInGroup?: boolean;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  role,
  routineStage = Stage.KINESIOLOGY,
  onUpdate,
  onShowHistory,
  onDelete,
  supersetLabel,
  supersetColor = 'bg-indigo-500',
  isFirstInGroup,
  isLastInGroup,
  isMiddleInGroup,
}) => {
  const { definition, targetSets, targetReps, targetLoad, currentRpe, currentPain, isDone, setsDetail } = exercise;
  const [isZoomed, setIsZoomed] = useState(false);
  const [showSetsDetail, setShowSetsDetail] = useState(false);
  
  // Permisos: Kine/Admin edita siempre; Paciente edita SOLO si la rutina está en etapa Gimnasio
  const canEditValues = role === UserRole.KINE || role === UserRole.SUPER_ADMIN || role === UserRole.TENANT_ADMIN || (role === UserRole.PATIENT && routineStage === Stage.GYM);
  const isLoadReadOnly = !canEditValues;
  const isTimeBased = definition.metricType === 'time';
  const isTensionBased = definition.metricType === 'tension';

  const media = definition.videoUrl ? parseMediaUrl(definition.videoUrl) : null;

  const getRpeStyle = (rpe: number | undefined) => {
    if (!rpe) return { backgroundColor: '#f1f5f9', color: '#94a3b8', borderColor: '#e2e8f0' };
    const hue = Math.max(0, 120 - (rpe - 1) * (120 / 9));
    return {
      backgroundColor: `hsl(${hue}, 85%, 94%)`,
      color: `hsl(${hue}, 90%, 25%)`,
      borderColor: `hsl(${hue}, 70%, 80%)`,
    };
  };

  const getPainStyle = (pain: number | undefined) => {
    if (!pain) return { backgroundColor: '#f1f5f9', color: '#94a3b8', borderColor: '#e2e8f0' };
    // Pain: 1 (Green) to 10 (Red)
    const hue = Math.max(0, 120 - (pain - 1) * (120 / 9));
    return {
      backgroundColor: `hsl(${hue}, 85%, 94%)`,
      color: `hsl(${hue}, 90%, 25%)`,
      borderColor: `hsl(${hue}, 70%, 80%)`,
    };
  };

  const rpeStyle = getRpeStyle(currentRpe);
  const painStyle = getPainStyle(currentPain);

  const adjustSets = (amount: number, e: React.MouseEvent) => {
    if (!canEditValues) return;
    e.stopPropagation();
    onUpdate(exercise.id, { targetSets: Math.max(1, targetSets + amount) });
  };

  const adjustReps = (amount: number, e: React.MouseEvent) => {
    if (!canEditValues) return;
    e.stopPropagation();
    onUpdate(exercise.id, { targetReps: Math.max(1, targetReps + amount) });
  };

  const adjustLoad = (amount: number, e: React.MouseEvent) => {
    if (!canEditValues) return;
    e.stopPropagation();
    const step = isTimeBased ? 5 : 0.5;
    let newLoad = Math.max(0, Math.round((targetLoad + (amount * step) / 0.5) * 100) / 100);
    onUpdate(exercise.id, { targetLoad: newLoad });
  };

  // --- Funciones para Desglose Serie por Serie / Drop Sets ---
  const handleInitializeSetsDetail = () => {
    if (!canEditValues) return;
    const initialSets: SetEntry[] = Array.from({ length: Math.max(1, targetSets) }, (_, i) => ({
      setNumber: i + 1,
      segments: [{ reps: targetReps, load: targetLoad }]
    }));
    onUpdate(exercise.id, { setsDetail: initialSets });
  };

  const handleAddSet = () => {
    if (!canEditValues) return;
    const current = setsDetail || [];
    const newSet: SetEntry = {
      setNumber: current.length + 1,
      segments: [{ reps: targetReps, load: targetLoad }]
    };
    onUpdate(exercise.id, { setsDetail: [...current, newSet], targetSets: current.length + 1 });
  };

  const handleRemoveSet = (index: number) => {
    if (!canEditValues || !setsDetail) return;
    const updated = setsDetail.filter((_, i) => i !== index).map((s, i) => ({ ...s, setNumber: i + 1 }));
    onUpdate(exercise.id, { setsDetail: updated, targetSets: Math.max(1, updated.length) });
  };

  const handleAddSegment = (setIndex: number) => {
    if (!canEditValues || !setsDetail) return;
    const updated = [...setsDetail];
    const targetSet = { ...updated[setIndex] };
    const lastSeg = targetSet.segments[targetSet.segments.length - 1] || { reps: 4, load: 10 };
    targetSet.segments = [...targetSet.segments, { reps: lastSeg.reps, load: Math.max(0, lastSeg.load - 5) }];
    updated[setIndex] = targetSet;
    onUpdate(exercise.id, { setsDetail: updated });
  };

  const handleRemoveSegment = (setIndex: number, segIndex: number) => {
    if (!canEditValues || !setsDetail) return;
    const updated = [...setsDetail];
    const targetSet = { ...updated[setIndex] };
    if (targetSet.segments.length <= 1) return; // Mantener al menos 1 tramo
    targetSet.segments = targetSet.segments.filter((_, i) => i !== segIndex);
    updated[setIndex] = targetSet;
    onUpdate(exercise.id, { setsDetail: updated });
  };

  const handleUpdateSegment = (setIndex: number, segIndex: number, field: 'reps' | 'load', value: number) => {
    if (!canEditValues || !setsDetail) return;
    const updated = [...setsDetail];
    const targetSet = { ...updated[setIndex] };
    const segments = [...targetSet.segments];
    segments[segIndex] = { ...segments[segIndex], [field]: Math.max(0, value) };
    targetSet.segments = segments;
    updated[setIndex] = targetSet;
    onUpdate(exercise.id, { setsDetail: updated });
  };

  const toggleDone = () => onUpdate(exercise.id, { isDone: !isDone });

  // Miniatura del video (thumbnail)
  const renderThumbnail = () => {
    if (!media) {
      return (
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-xl shrink-0 border border-slate-100 flex items-center justify-center">
          {isTimeBased ? <Timer className="text-slate-300" /> : isTensionBased ? <Activity className="text-purple-500" /> : <Dumbbell className="text-slate-300" />}
        </div>
      );
    }

    if (media.type === 'video') {
      return (
        <button
          onClick={() => setIsZoomed(true)}
          className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200 relative group cursor-zoom-in block"
        >
          <video src={media.embedUrl} autoPlay loop muted playsInline className="w-full h-full object-cover block pointer-events-none" />
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Maximize2 size={16} className="text-white" />
          </div>
        </button>
      );
    }

    if (media.isVideo && media.thumbnailUrl) {
      return (
        <button
          onClick={() => setIsZoomed(true)}
          className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200 relative group cursor-zoom-in block"
        >
          <img
            src={media.thumbnailUrl}
            alt={definition.name}
            className="w-full h-full object-cover block"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
              <Play size={12} className="text-slate-900 ml-0.5" fill="currentColor" />
            </div>
          </div>
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      );
    }

    if (media.isVideo && !media.thumbnailUrl) {
      // Instagram sin thumbnail preview
      return (
        <button
          onClick={() => setIsZoomed(true)}
          className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-pink-400 to-purple-600 rounded-xl overflow-hidden shrink-0 border border-pink-200 relative group cursor-zoom-in flex items-center justify-center"
        >
          <Play size={20} className="text-white" fill="currentColor" />
        </button>
      );
    }

    // Imagen estática
    return (
      <button
        onClick={() => setIsZoomed(true)}
        className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200 relative group cursor-zoom-in block"
      >
        <img src={media.embedUrl} alt={definition.name} className="w-full h-full object-cover block" />
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <Maximize2 size={16} className="text-white" />
        </div>
      </button>
    );
  };

  // Contenido expandido al hacer clic (modal)
  const renderZoomedContent = () => {
    if (!isZoomed || !media) return null;

    return (
      <div
        className="fixed inset-0 z-[500] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
        onClick={() => setIsZoomed(false)}
      >
        <div
          className="relative bg-white rounded-[2.5rem] overflow-hidden shadow-2xl max-w-2xl w-full animate-in zoom-in-95 duration-300 cursor-default"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-6 right-6 z-10 p-3 bg-white/80 backdrop-blur-md hover:bg-white rounded-full text-slate-900 transition-all shadow-lg active:scale-95"
          >
            <X size={24} />
          </button>

          {media.type === 'youtube' || media.type === 'drive' || media.type === 'instagram' ? (
            <div className="aspect-video bg-black flex items-center justify-center">
              <iframe
                src={media.embedUrl}
                title={definition.name}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : media.type === 'video' ? (
            <div className="aspect-video bg-black flex items-center justify-center">
              <video src={media.embedUrl} autoPlay loop muted playsInline controls className="max-w-full max-h-full object-contain block" />
            </div>
          ) : (
            <div className="aspect-video bg-slate-100 flex items-center justify-center">
              <img src={media.embedUrl} alt={definition.name} className="max-w-full max-h-full object-contain block" />
            </div>
          )}

          <div className="p-6">
            <h2 className="text-2xl font-bold text-slate-900">{definition.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-slate-500 uppercase font-bold text-xs tracking-widest">{definition.category}</p>
              {isTimeBased && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Por Tiempo</span>}
              {isTensionBased && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Banda Elástica</span>}
              {media.type !== 'image' && media.type !== 'unknown' && (
                <a
                  href={definition.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-primary-600 hover:underline ml-auto"
                  onClick={e => e.stopPropagation()}
                >
                  Abrir original ↗
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={`bg-white shadow-sm border transition-all duration-300 relative overflow-hidden ${
          isFirstInGroup ? 'rounded-t-2xl rounded-b-none border-b-0' :
          isMiddleInGroup ? 'rounded-none border-b-0' :
          isLastInGroup ? 'rounded-b-2xl rounded-t-none' :
          'rounded-2xl'
      } ${
          isDone ? 'border-slate-100 opacity-60 bg-slate-50' : 'border-slate-200 hover:shadow-md'
      }`}>
        {/* Indicador de Biserie/Triserie */}
        {supersetLabel && (
          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${supersetColor}`} />
        )}
        
        <div className={`p-3.5 ${supersetLabel ? 'pl-4.5' : ''} space-y-3`}>
          {/* Fila Superior: Check, Imagen e Información */}
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={toggleDone}
              disabled={role === UserRole.RECEPCION}
              className={`shrink-0 mt-0.5 transition-transform active:scale-90 ${isDone ? 'text-emerald-500' : 'text-slate-200'} ${role === UserRole.RECEPCION ? 'opacity-50' : ''}`}
            >
              {isDone ? <CheckCircle size={26} fill="currentColor" /> : <Circle size={26} strokeWidth={1.5} />}
            </button>

            {renderThumbnail()}

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <h4 className={`font-black text-base sm:text-lg leading-snug break-words ${isDone ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                      {definition.name}
                    </h4>
                    {supersetLabel && (
                      <span className={`${supersetColor} text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 shadow-sm`}>
                        {supersetLabel}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">{definition.category}</span>
                    {isTimeBased && <span className="bg-blue-50 text-blue-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide">Cronómetro</span>}
                    {isTensionBased && <span className="bg-purple-50 text-purple-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide">Banda Elástica</span>}
                  </div>
                </div>
                {role !== UserRole.RECEPCION && (
                  <button
                    type="button"
                    onClick={() => onShowHistory(exercise)}
                    className="p-1.5 text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg shrink-0 transition-colors border border-primary-100/50"
                    title="Ver gráfico e historial de progreso"
                  >
                    <TrendingUp size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Fila Compacta de Métricas (Plan, Carga, RPE, Dolor) */}
          <div className="bg-slate-50/90 rounded-xl p-2 border border-slate-200/60 shadow-inner flex flex-wrap items-center justify-between gap-1.5">
            {/* Target Sets x Reps */}
            <div className="flex flex-col items-center justify-center px-2 py-0.5 bg-white rounded-lg border border-slate-200/80 shadow-sm shrink-0">
              <p className="text-[7.5px] text-slate-400 font-black uppercase tracking-widest opacity-80">
                {isTimeBased ? 'Series' : 'Plan'}
              </p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-xs font-black text-slate-900 leading-none">{targetSets}</span>
                {!isTimeBased && (
                  <>
                    <span className="text-slate-300 text-[9px] font-bold mx-0.5">×</span>
                    <span className="text-xs font-black text-slate-900 leading-none">{targetReps}</span>
                  </>
                )}
                {isTimeBased && <span className="text-slate-400 text-[8px] font-bold uppercase ml-0.5">Ser</span>}
              </div>
            </div>

            {/* Carga / Tiempo / Tensión */}
            <div className="flex flex-col items-center justify-center px-2 py-0.5 bg-white rounded-lg border border-slate-200/80 shadow-sm shrink-0 flex-1 min-w-[85px]">
              <p className="text-[7.5px] text-slate-400 font-black uppercase tracking-widest opacity-80">
                {isTimeBased ? 'Tiempo' : isTensionBased ? 'Tensión' : 'Carga'}
              </p>
              {isTensionBased ? (
                isLoadReadOnly ? (
                  <span className="text-[11px] font-black text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                    {targetLoad === 1 ? 'Baja' : targetLoad === 2 ? 'Media' : targetLoad === 3 ? 'Alta' : 'Media'}
                  </span>
                ) : (
                  <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onUpdate(exercise.id, { targetLoad: 1 }); }}
                      className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase transition-all ${targetLoad === 1 ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      Baja
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onUpdate(exercise.id, { targetLoad: 2 }); }}
                      className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase transition-all ${targetLoad === 2 ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      Media
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onUpdate(exercise.id, { targetLoad: 3 }); }}
                      className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase transition-all ${targetLoad === 3 ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      Alta
                    </button>
                  </div>
                )
              ) : isLoadReadOnly ? (
                <span className="text-xs font-black text-slate-900 leading-none">
                  {targetLoad}<span className="text-[8px] font-bold text-primary-500 ml-0.5 uppercase">{isTimeBased ? 's' : 'kg'}</span>
                </span>
              ) : (
                <div className="flex items-center gap-1">
                  <button type="button" onClick={(e) => adjustLoad(-0.5, e)} className="w-4 h-4 bg-slate-100 rounded border border-slate-200 flex items-center justify-center shrink-0 active:scale-90"><Minus size={9} className="text-slate-600"/></button>
                  <div className="flex items-baseline gap-0.5">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={targetLoad.toString()}
                      onChange={e => {
                        let valStr = e.target.value.replace(/[^0-9.]/g, '');
                        valStr = valStr.replace(/^0+(?=\d)/, '');
                        onUpdate(exercise.id, { targetLoad: parseFloat(valStr) || 0 });
                      }}
                      className="w-8 text-center font-black text-xs bg-transparent outline-none leading-none focus:text-primary-600"
                      onClick={e => e.stopPropagation()}
                    />
                    <span className="text-[8px] font-black text-slate-400 uppercase leading-none">{isTimeBased ? 's' : 'kg'}</span>
                  </div>
                  <button type="button" onClick={(e) => adjustLoad(0.5, e)} className="w-4 h-4 bg-slate-100 rounded border border-slate-200 flex items-center justify-center shrink-0 active:scale-90"><Plus size={9} className="text-slate-600"/></button>
                </div>
              )}
            </div>

            {role !== UserRole.RECEPCION && (
              <>
                {/* RPE */}
                <div className="flex flex-col items-center justify-center px-1.5 py-0.5 bg-white rounded-lg border border-slate-200/80 shadow-sm shrink-0 min-w-[42px]">
                  <p className="text-[7.5px] text-slate-400 font-black uppercase tracking-widest opacity-80">RPE</p>
                  <select
                    style={rpeStyle}
                    className="font-black text-[9px] rounded px-1 py-0.5 outline-none transition-all border cursor-pointer text-center appearance-none"
                    value={currentRpe || ""}
                    onChange={e => onUpdate(exercise.id, { currentRpe: Number(e.target.value) })}
                  >
                    <option value="" className="bg-white text-slate-400 font-normal">—</option>
                    {[...Array(10)].map((_, i) => (
                      <option key={i+1} value={i+1} style={getRpeStyle(i+1)} className="font-bold">{i+1}</option>
                    ))}
                  </select>
                </div>

                {/* Dolor */}
                <div className="flex flex-col items-center justify-center px-1.5 py-0.5 bg-white rounded-lg border border-slate-200/80 shadow-sm shrink-0 min-w-[42px]">
                  <p className="text-[7.5px] text-slate-400 font-black uppercase tracking-widest opacity-80">Dolor</p>
                  <select
                    style={painStyle}
                    className="font-black text-[9px] rounded px-1 py-0.5 outline-none transition-all border cursor-pointer text-center appearance-none"
                    value={currentPain || ""}
                    onChange={e => onUpdate(exercise.id, { currentPain: Number(e.target.value) })}
                  >
                    <option value="" className="bg-white text-slate-400 font-normal">—</option>
                    {[...Array(10)].map((_, i) => (
                      <option key={i+1} value={i+1} style={getPainStyle(i+1)} className="font-bold">{i+1}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
          
          {/* Observaciones (Compactas) */}
          {role !== UserRole.RECEPCION && (
            <div className={`mt-1.5 ${supersetLabel ? 'ml-2' : ''}`}>
              <textarea
                placeholder="Añadir observación..."
                className="w-full bg-slate-50 border border-slate-200/60 rounded-lg p-2 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500/30 focus:border-primary-500 transition-all resize-none shadow-inner"
                rows={1}
                value={exercise.notes || ''}
                onChange={(e) => onUpdate(exercise.id, { notes: e.target.value })}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Botón opcional para desplegar desglose de series / Drop Sets */}
          {role !== UserRole.RECEPCION && (
            <div className={`mt-2 ${supersetLabel ? 'ml-2' : ''}`}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!setsDetail || setsDetail.length === 0) {
                      handleInitializeSetsDetail();
                    }
                    setShowSetsDetail(!showSetsDetail);
                  }}
                  className="flex items-center gap-1 text-[11px] font-extrabold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-100 transition-all shadow-sm active:scale-95"
                >
                  <Layers size={13} />
                  <span>
                    {showSetsDetail
                      ? 'Ocultar Series'
                      : setsDetail && setsDetail.length > 0
                      ? `Ver/Editar ${setsDetail.length} Series (Drop-Sets)`
                      : 'Detallar Series / Drop Sets (Opcional)'}
                  </span>
                  {showSetsDetail ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {!canEditValues && (
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide bg-slate-100 px-1.5 py-0.5 rounded">
                    Solo Lectura (Etapa Kine)
                  </span>
                )}
              </div>

              {/* Panel desplegable de Series / Drop Sets (Compacto) */}
              {showSetsDetail && (
                <div className="mt-2 p-3 bg-slate-50/90 rounded-xl border border-slate-200 space-y-2 animate-in fade-in duration-200 shadow-inner">
                  <div className="flex items-center justify-between flex-wrap gap-1.5">
                    <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-wide flex items-center gap-1">
                      <Layers size={13} className="text-indigo-600"/> Desglose por Series y Drop-Sets
                    </h5>
                    {canEditValues && (
                      <button
                        type="button"
                        onClick={handleAddSet}
                        className="text-[9px] font-black text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-0.5 rounded-lg flex items-center gap-0.5 shadow-sm transition-all active:scale-95"
                      >
                        <Plus size={10}/> Agregar Serie
                      </button>
                    )}
                  </div>

                  {(!setsDetail || setsDetail.length === 0) ? (
                    <p className="text-[11px] text-slate-400 font-medium text-center py-1">Sin series detalladas aún.</p>
                  ) : (
                    <div className="space-y-2">
                      {setsDetail.map((setEntry, sIdx) => (
                        <div key={sIdx} className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                          {/* Header de la Serie */}
                          <div className="flex items-center justify-between pb-1 border-b border-slate-100 flex-wrap gap-1.5">
                            <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
                              Serie {setEntry.setNumber || sIdx + 1}
                            </span>
                            {canEditValues && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleAddSegment(sIdx)}
                                  className="text-[9px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-0.5 transition-all shadow-sm active:scale-95"
                                  title="Añadir bajada de peso (Drop Set) a esta serie"
                                >
                                  <Plus size={10}/> + Drop Set
                                </button>
                                {setsDetail.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSet(sIdx)}
                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 transition-all"
                                    title="Eliminar toda la Serie"
                                  >
                                    <Trash2 size={10}/>
                                    <span>Eliminar Serie</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Segmentos / Drop Sets de la serie */}
                          <div className="space-y-1.5">
                            {setEntry.segments.map((seg, segIdx) => (
                              <div key={segIdx} className="flex items-center justify-between gap-1.5 bg-slate-50/80 p-1.5 rounded-lg border border-slate-100 flex-wrap sm:flex-nowrap">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${segIdx === 0 ? 'bg-slate-200 text-slate-700' : 'bg-purple-100 text-purple-700 border border-purple-200'}`}>
                                    {segIdx === 0 ? 'Tramo Base' : `Drop Set ${segIdx}`}
                                  </span>
                                  {canEditValues ? (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <div className="flex items-baseline gap-0.5 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm">
                                        <input
                                          type="number"
                                          min="0"
                                          className="w-10 text-center font-black text-xs bg-transparent outline-none focus:text-indigo-600"
                                          value={seg.reps}
                                          onChange={e => handleUpdateSegment(sIdx, segIdx, 'reps', parseInt(e.target.value) || 0)}
                                        />
                                        <span className="text-[8px] font-bold text-slate-400 uppercase">reps</span>
                                      </div>
                                      <span className="text-slate-400 font-bold text-[10px]">@</span>
                                      <div className="flex items-baseline gap-0.5 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm">
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.5"
                                          className="w-12 text-center font-black text-xs bg-transparent outline-none focus:text-indigo-600"
                                          value={seg.load}
                                          onChange={e => handleUpdateSegment(sIdx, segIdx, 'load', parseFloat(e.target.value) || 0)}
                                        />
                                        <span className="text-[8px] font-bold text-slate-400 uppercase">{isTimeBased ? 's' : 'kg'}</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-xs font-black text-slate-800">
                                      {seg.reps} reps @ {seg.load} {isTimeBased ? 's' : 'kg'}
                                    </span>
                                  )}
                                </div>

                                {/* Botón para eliminar ÚNICAMENTE este Drop Set */}
                                {canEditValues && setEntry.segments.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSegment(sIdx, segIdx)}
                                    className="flex items-center gap-0.5 text-[9px] font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-1.5 py-0.5 rounded border border-red-100 transition-all shrink-0 ml-auto"
                                    title="Eliminar solo este Drop Set"
                                  >
                                    <Trash2 size={10} />
                                    <span>Quitar Drop</span>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    {renderZoomedContent()}
  </>
);
};