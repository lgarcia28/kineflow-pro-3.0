
import React, { useState } from 'react';
import { RoutineExercise, UserRole } from '../types';
import { CheckCircle, Circle, Minus, Plus, TrendingUp, Trash2, Maximize2, X, Timer, Dumbbell, Play } from 'lucide-react';
import { parseMediaUrl } from '../utils/mediaUrl';

interface ExerciseCardProps {
  exercise: RoutineExercise;
  role: UserRole;
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
  onUpdate,
  onShowHistory,
  onDelete,
  supersetLabel,
  supersetColor = 'bg-indigo-500',
  isFirstInGroup,
  isLastInGroup,
  isMiddleInGroup,
}) => {
  const { definition, targetSets, targetReps, targetLoad, currentRpe, currentPain, isDone } = exercise;
  const [isZoomed, setIsZoomed] = useState(false);
  
  const isReadOnly = role === UserRole.PATIENT || role === UserRole.RECEPCION;
  const isLoadReadOnly = role === UserRole.RECEPCION; // Pacientes pueden editar la carga (registro propio)
  const isTimeBased = definition.metricType === 'time';

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
    if (isReadOnly) return;
    e.stopPropagation();
    onUpdate(exercise.id, { targetSets: Math.max(1, targetSets + amount) });
  };

  const adjustReps = (amount: number, e: React.MouseEvent) => {
    if (isReadOnly) return;
    e.stopPropagation();
    onUpdate(exercise.id, { targetReps: Math.max(1, targetReps + amount) });
  };

  const adjustLoad = (amount: number, e: React.MouseEvent) => {
    if (isReadOnly) return;
    e.stopPropagation();
    const step = isTimeBased ? 5 : 0.5;
    let newLoad = Math.max(0, Math.round((targetLoad + (amount * step) / 0.5) * 100) / 100);
    onUpdate(exercise.id, { targetLoad: newLoad });
  };

  const toggleDone = () => onUpdate(exercise.id, { isDone: !isDone });

  // Miniatura del video (thumbnail)
  const renderThumbnail = () => {
    if (!media) {
      return (
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-xl shrink-0 border border-slate-100 flex items-center justify-center">
          {isTimeBased ? <Timer className="text-slate-300" /> : <Dumbbell className="text-slate-300" />}
        </div>
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
    if (!media || !isZoomed) return null;

    return (
      <div
        className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        onClick={() => setIsZoomed(false)}
      >
        <div
          className="relative bg-white rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full animate-in zoom-in-95 cursor-default"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
          >
            <X size={24} />
          </button>

          {media.isVideo ? (
            <div className="aspect-video bg-slate-900">
              <iframe
                src={media.embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={definition.name}
              />
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
        
        <div className={`p-4 ${supersetLabel ? 'pl-5' : ''} space-y-4`}>
          {/* Fila Superior: Check, Imagen e Información */}
          <div className="flex items-start gap-4">
            <button
              onClick={toggleDone}
              disabled={role === UserRole.RECEPCION}
              className={`shrink-0 mt-1 transition-transform active:scale-90 ${isDone ? 'text-emerald-500' : 'text-slate-200'} ${role === UserRole.RECEPCION ? 'opacity-50' : ''}`}
            >
              {isDone ? <CheckCircle size={32} fill="currentColor" /> : <Circle size={32} strokeWidth={1.5} />}
            </button>

            {renderThumbnail()}

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start pr-1">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h4 className={`font-black text-lg leading-tight truncate ${isDone ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                      {definition.name}
                    </h4>
                    {supersetLabel && (
                      <span className={`${supersetColor} text-white text-[10px] font-black px-2.5 py-0.5 rounded-lg uppercase tracking-wider shrink-0 shadow-sm shadow-indigo-100`}>
                        {supersetLabel}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{definition.category}</span>
                    {isTimeBased && <span className="bg-blue-50 text-blue-600 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wide">Cronómetro</span>}
                  </div>
                </div>
                {role === UserRole.KINE && (
                  <button onClick={() => onShowHistory(exercise)} className="p-2 text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl shrink-0 transition-colors shadow-sm border border-primary-100/50">
                    <TrendingUp size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Fila Inferior: Métricas - En 1 sola línea (Restaurado a pedido del usuario) */}
          <div className="flex items-stretch bg-slate-50/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-200/60 shadow-inner overflow-x-auto hide-scrollbar">
            {/* Series x Reps - SOLO LECTURA en esta vista */}
            <div className="flex flex-col items-center justify-center py-2 px-2 border-r border-slate-200/60 shrink-0 min-w-[70px]">
              <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1 opacity-80">
                {isTimeBased ? 'Series' : 'Plan'}
              </p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-sm font-black text-slate-900 leading-none">{targetSets}</span>
                {!isTimeBased && (
                  <>
                    <span className="text-slate-300 text-[10px] font-bold mx-0.5">×</span>
                    <span className="text-sm font-black text-slate-900 leading-none">{targetReps}</span>
                  </>
                )}
                {isTimeBased && <span className="text-slate-400 text-[9px] font-bold uppercase tracking-tighter ml-0.5">Ser</span>}
              </div>
            </div>

            {/* Carga */}
            <div className="flex flex-col items-center justify-center py-2 px-2 border-r border-slate-200/60 shrink-0 min-w-[75px] flex-1">
              <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1 opacity-80">
                {isTimeBased ? 'Tiempo' : 'Carga'}
              </p>
              {isLoadReadOnly ? (
                <span className="text-sm font-black text-slate-900 leading-none">
                  {targetLoad}<span className="text-[9px] font-bold text-primary-500 ml-1 uppercase">{isTimeBased ? 's' : 'kg'}</span>
                </span>
              ) : (
                <div className="flex items-center gap-1">
                  <button onClick={(e) => adjustLoad(-0.5, e)} className="w-5 h-5 bg-white rounded-md shadow-sm border border-slate-200 flex items-center justify-center shrink-0 active:scale-90 transition-transform"><Minus size={10} className="text-slate-600"/></button>
                  <div className="flex flex-col items-center">
                    <div className="flex items-baseline gap-0.5">
                      <input
                        type="number"
                        inputMode="decimal"
                        pattern="[0-9]*"
                        min={0}
                        step={0.5}
                        value={targetLoad}
                        onChange={e => onUpdate(exercise.id, { targetLoad: parseFloat(e.target.value) || 0 })}
                        className="w-8 text-center font-black text-sm bg-transparent outline-none leading-none focus:text-primary-600 transition-colors"
                        onClick={e => e.stopPropagation()}
                      />
                      <span className="text-[8px] font-black text-slate-400 uppercase leading-none">{isTimeBased ? 's' : 'kg'}</span>
                    </div>
                  </div>
                  <button onClick={(e) => adjustLoad(0.5, e)} className="w-5 h-5 bg-white rounded-md shadow-sm border border-slate-200 flex items-center justify-center shrink-0 active:scale-90 transition-transform"><Plus size={10} className="text-slate-600"/></button>
                </div>
              )}
            </div>

            {role !== UserRole.RECEPCION && (
              <>
                {/* RPE */}
                <div className="flex flex-col items-center justify-center py-2 px-1.5 border-r border-slate-200/60 shrink-0 min-w-[45px]">
                  <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1 opacity-80">RPE</p>
                  <select
                    style={rpeStyle}
                    className="font-black text-[10px] rounded w-[38px] py-1 outline-none transition-all border shadow-sm cursor-pointer text-center appearance-none"
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
                <div className="flex flex-col items-center justify-center py-2 px-1.5 shrink-0 min-w-[45px]">
                  <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1 opacity-80">Dolor</p>
                  <select
                    style={painStyle}
                    className="font-black text-[10px] rounded w-[38px] py-1 outline-none transition-all border shadow-sm cursor-pointer text-center appearance-none"
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
        </div>

        {role === UserRole.KINE && (
          <button onClick={() => onDelete(exercise.id)} className="absolute top-3 right-3 p-1.5 text-slate-200 hover:text-red-500 transition-colors">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {renderZoomedContent()}
    </>
  );
};