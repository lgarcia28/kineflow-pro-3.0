
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
        
        <div className={`p-4 ${supersetLabel ? 'pl-5' : ''}`}>
          <div className="flex items-start gap-3">
            <button
              onClick={toggleDone}
              disabled={role === UserRole.RECEPCION}
              className={`shrink-0 mt-1 ${isDone ? 'text-kine' : 'text-slate-300'} ${role === UserRole.RECEPCION ? 'opacity-50' : ''}`}
            >
              {isDone ? <CheckCircle size={28} fill="currentColor" /> : <Circle size={28} />}
            </button>

            {renderThumbnail()}

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-2 pr-6">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={`font-bold text-base truncate ${isDone ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                      {definition.name}
                    </h4>
                    {supersetLabel && (
                      <span className={`${supersetColor} text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0`}>
                        {supersetLabel}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{definition.category}</span>
                    {isTimeBased && <span className="bg-blue-50 text-blue-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Tiempo</span>}
                  </div>
                </div>
                {role === UserRole.KINE && (
                  <button onClick={() => onShowHistory(exercise)} className="p-1.5 text-primary-600 bg-primary-50 rounded-lg shrink-0">
                    <TrendingUp size={16} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-12 gap-y-3 gap-x-2">
                <div className="col-span-12 sm:col-span-5 flex flex-col justify-center">
                  <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">{isTimeBased ? 'Series' : 'Series x Reps'}</p>
                  <div className="flex items-center gap-1">
                    <div className={`flex items-center rounded-lg p-0.5 ${isReadOnly ? 'bg-slate-50' : 'bg-slate-100'}`}>
                      {!isReadOnly && <button onClick={(e) => adjustSets(-1, e)} className="p-1 bg-white rounded shadow-sm"><Minus size={12}/></button>}
                      <span className="w-8 text-center font-bold text-sm">{targetSets}</span>
                      {!isReadOnly && <button onClick={(e) => adjustSets(1, e)} className="p-1 bg-white rounded shadow-sm"><Plus size={12}/></button>}
                    </div>
                    
                    {!isTimeBased && (
                      <>
                        <span className="text-slate-300 text-xs">x</span>
                        <div className={`flex items-center rounded-lg p-0.5 ${isReadOnly ? 'bg-slate-50' : 'bg-slate-100'}`}>
                          {!isReadOnly && <button onClick={(e) => adjustReps(-1, e)} className="p-1 bg-white rounded shadow-sm"><Minus size={12}/></button>}
                          <span className="w-9 text-center font-bold text-sm">{targetReps}</span>
                          {!isReadOnly && <button onClick={(e) => adjustReps(1, e)} className="p-1 bg-white rounded shadow-sm"><Plus size={12}/></button>}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="col-span-4 sm:col-span-3 border-l border-slate-100 pl-2">
                  <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">{isTimeBased ? 'Tiempo (s)' : 'Carga'}</p>
                  <div className={`flex items-center rounded-lg p-0.5 w-full max-w-[120px] ${isReadOnly ? 'bg-slate-50' : 'bg-slate-100'}`}>
                    {!isReadOnly && <button onClick={(e) => adjustLoad(-0.5, e)} className="p-1 bg-white rounded shadow-sm shrink-0"><Minus size={12}/></button>}
                    {isReadOnly ? (
                      <span className="w-full text-center font-bold text-sm">
                        {targetLoad} <span className="text-[10px] font-normal text-slate-400">{isTimeBased ? 's' : 'kg'}</span>
                      </span>
                    ) : (
                      <div className="flex items-center flex-1 min-w-0">
                        <input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step={0.5}
                          value={targetLoad}
                          onChange={e => onUpdate(exercise.id, { targetLoad: parseFloat(e.target.value) || 0 })}
                          className="w-full text-center font-bold text-sm bg-transparent outline-none min-w-0"
                          onClick={e => e.stopPropagation()}
                        />
                        <span className="text-[10px] font-bold text-slate-400 shrink-0 mr-0.5">{isTimeBased ? 's' : 'kg'}</span>
                      </div>
                    )}
                    {!isReadOnly && <button onClick={(e) => adjustLoad(0.5, e)} className="p-1 bg-white rounded shadow-sm shrink-0"><Plus size={12}/></button>}
                  </div>
                </div>

                {role !== UserRole.RECEPCION && (
                  <>
                    <div className="col-span-4 sm:col-span-2 border-l border-slate-100 pl-2">
                      <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">RPE</p>
                      <select
                        style={rpeStyle}
                        className="font-black text-xs rounded-lg w-full p-1.5 outline-none disabled:opacity-50 transition-colors border shadow-sm cursor-pointer text-center"
                        value={currentRpe || ""}
                        onChange={e => onUpdate(exercise.id, { currentRpe: Number(e.target.value) })}
                      >
                        <option value="" className="bg-white text-slate-400 font-normal">RPE</option>
                        {[...Array(10)].map((_, i) => (
                          <option key={i+1} value={i+1} style={getRpeStyle(i+1)} className="font-medium">
                            {i+1}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-4 sm:col-span-2 border-l border-slate-100 pl-2">
                      <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Dolor</p>
                      <select
                        style={painStyle}
                        className="font-black text-xs rounded-lg w-full p-1.5 outline-none disabled:opacity-50 transition-colors border shadow-sm cursor-pointer text-center"
                        value={currentPain || ""}
                        onChange={e => onUpdate(exercise.id, { currentPain: Number(e.target.value) })}
                      >
                        <option value="" className="bg-white text-slate-400 font-normal">Dolor</option>
                        {[...Array(10)].map((_, i) => (
                          <option key={i+1} value={i+1} style={getPainStyle(i+1)} className="font-medium">
                            {i+1}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
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