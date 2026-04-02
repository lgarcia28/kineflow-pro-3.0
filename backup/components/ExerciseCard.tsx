
import React, { useState } from 'react';
import { RoutineExercise, UserRole } from '../types';
import { CheckCircle, Circle, Minus, Plus, TrendingUp, Trash2, Maximize2, X, Timer, Dumbbell } from 'lucide-react';

interface ExerciseCardProps {
  exercise: RoutineExercise;
  role: UserRole;
  onUpdate: (id: string, updates: Partial<RoutineExercise>) => void;
  onShowHistory: (exercise: RoutineExercise) => void;
  onDelete: (id: string) => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  role,
  onUpdate,
  onShowHistory,
  onDelete,
}) => {
  const { definition, targetSets, targetReps, targetLoad, currentRpe, isDone } = exercise;
  const [isZoomed, setIsZoomed] = useState(false);
  
  const isReadOnly = role === UserRole.PATIENT || role === UserRole.ADMIN;
  const isTimeBased = definition.metricType === 'time';

  const getRpeStyle = (rpe: number | undefined) => {
    if (!rpe) return { backgroundColor: '#f1f5f9', color: '#94a3b8', borderColor: '#e2e8f0' };
    const hue = Math.max(0, 120 - (rpe - 1) * (120 / 9));
    return {
      backgroundColor: `hsl(${hue}, 85%, 94%)`,
      color: `hsl(${hue}, 90%, 25%)`,
      borderColor: `hsl(${hue}, 70%, 80%)`,
    };
  };

  const rpeStyle = getRpeStyle(currentRpe);

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
    // Si es tiempo, saltos de 5 seg, si es peso, saltos de 0.5kg
    const step = isTimeBased ? 5 : 0.5;
    let newLoad = Math.max(0, Math.round((targetLoad + (amount * step) / 0.5) * 100) / 100);
    onUpdate(exercise.id, { targetLoad: newLoad });
  };

  const toggleDone = () => onUpdate(exercise.id, { isDone: !isDone });

  return (
    <>
      <div className={`bg-white rounded-2xl p-4 shadow-sm border transition-all duration-300 relative ${
          isDone ? 'border-slate-100 opacity-60 bg-slate-50' : 'border-slate-200 hover:shadow-md'
      }`}>
        <div className="flex items-start gap-3">
          <button 
            onClick={toggleDone} 
            disabled={role === UserRole.ADMIN}
            className={`shrink-0 mt-1 ${isDone ? 'text-kine' : 'text-slate-300'} ${role === UserRole.ADMIN ? 'opacity-50' : ''}`}
          >
            {isDone ? <CheckCircle size={28} fill="currentColor" /> : <Circle size={28} />}
          </button>

          {definition.videoUrl ? (
            <button 
              onClick={() => setIsZoomed(true)}
              className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200 relative group cursor-zoom-in block"
            >
              <img 
                src={definition.videoUrl} 
                alt={definition.name} 
                className="w-full h-full object-cover block"
                style={{ display: 'block' }} 
              />
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Maximize2 size={16} className="text-white" />
              </div>
            </button>
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-xl shrink-0 border border-slate-100 flex items-center justify-center">
                 {isTimeBased ? <Timer className="text-slate-300" /> : <Dumbbell className="text-slate-300" />}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2 pr-6">
              <div className="min-w-0">
                <h4 className={`font-bold text-base truncate ${isDone ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                  {definition.name}
                </h4>
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
              <div className="col-span-12 sm:col-span-6 flex flex-col justify-center">
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

              <div className="col-span-6 sm:col-span-3 border-l border-slate-100 pl-2">
                <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">{isTimeBased ? 'Tiempo (s)' : 'Carga (kg)'}</p>
                <div className={`flex items-center rounded-lg p-0.5 w-full max-w-[100px] ${isReadOnly ? 'bg-slate-50' : 'bg-slate-100'}`}>
                  {!isReadOnly && <button onClick={(e) => adjustLoad(-0.5, e)} className="p-1 bg-white rounded shadow-sm"><Minus size={12}/></button>}
                  <span className="w-full text-center font-bold text-sm">{targetLoad}</span>
                  {!isReadOnly && <button onClick={(e) => adjustLoad(0.5, e)} className="p-1 bg-white rounded shadow-sm"><Plus size={12}/></button>}
                </div>
              </div>

              {role !== UserRole.ADMIN && (
                <div className="col-span-6 sm:col-span-3 border-l border-slate-100 pl-2">
                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Esfuerzo</p>
                    <select 
                      style={rpeStyle}
                      className="font-black text-sm rounded-lg w-full p-1.5 outline-none disabled:opacity-50 transition-colors border shadow-sm cursor-pointer"
                      value={currentRpe || ""}
                      onChange={e => onUpdate(exercise.id, { currentRpe: Number(e.target.value) })}
                    >
                      <option value="" className="bg-white text-slate-400 font-normal">RPE</option>
                      {[...Array(10)].map((_, i) => (
                        <option key={i+1} value={i+1} className="bg-white text-slate-900 font-medium">
                          {i+1} {i+1 === 1 ? '(Fácil)' : i+1 === 10 ? '(Máximo)' : ''}
                        </option>
                      ))}
                    </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {role === UserRole.KINE && (
          <button onClick={() => onDelete(exercise.id)} className="absolute top-3 right-3 p-1.5 text-slate-200 hover:text-red-500 transition-colors">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {isZoomed && definition.videoUrl && (
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
              className="absolute top-4 right-4 z-10 p-2 bg-black/10 hover:bg-black/20 rounded-full text-white transition-colors"
            >
              <X size={24} />
            </button>
            <div className="aspect-video bg-slate-900 flex items-center justify-center">
              <img src={definition.videoUrl} alt={definition.name} className="max-w-full max-h-full object-contain block" />
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-slate-900">{definition.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                 <p className="text-slate-500 uppercase font-bold text-xs tracking-widest">{definition.category}</p>
                 {isTimeBased && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Por Tiempo</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};