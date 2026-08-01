import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { RoutineExercise, Patient, ExerciseLog, SetEntry } from '../types';
import { TrendingUp, Layers, Calendar, Dumbbell, Activity } from 'lucide-react';

interface ProgressChartProps {
  exercise: RoutineExercise;
  patient?: Patient;
  onClose: () => void;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ exercise, patient, onClose }) => {
  const metricType = exercise.definition.metricType || 'kg';
  const [metricFilter, setMetricFilter] = useState<'ALL' | 'LOAD' | 'REPS'>('ALL');
  
  // Aggregate history from all instances of the same exercise definition across all days
  let data: ExerciseLog[] = [];
  
  if (patient) {
    const seen = new Set<string>();
    const allHistory: any[] = [];

    const processExerciseHistory = (ex: RoutineExercise) => {
      if (ex.definitionId === exercise.definitionId && ex.history) {
        ex.history.forEach(log => {
          // Unique key based on date, week, reps and load
          const uniqueKey = `${log.date}-${log.week || ''}-${log.load}-${log.reps}`;
          if (!seen.has(uniqueKey)) {
            seen.add(uniqueKey);
            allHistory.push(log);
          }
        });
      }
    };

    // Collect from clinic routine
    if (patient.routine && patient.routine.days) {
      patient.routine.days.forEach(day => {
        day.exercises.forEach(processExerciseHistory);
      });
    }

    // Collect from home routine
    if (patient.homeRoutine && patient.homeRoutine.days) {
      patient.homeRoutine.days.forEach(day => {
        day.exercises.forEach(processExerciseHistory);
      });
    }

    // Sort chronologically by date
    allHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    data = allHistory;

    // Append the active week's current target load as a live active point
    const currentWeekNum = patient.routine?.currentWeek || 1;
    const isAlreadyLogged = data.some(log => log.week === currentWeekNum);
    if (!isAlreadyLogged && exercise.targetLoad !== undefined) {
      data = [
        ...data,
        {
          date: new Date().toISOString().split('T')[0],
          week: currentWeekNum,
          load: exercise.targetLoad,
          reps: exercise.targetReps,
          rpe: exercise.currentRpe || 5,
          pain: exercise.currentPain || 0,
          setsDetail: exercise.setsDetail,
          isLivePoint: true
        } as any
      ];
    }
  } else {
    // Fall back to the single exercise history if patient is not passed
    data = exercise.history || [];
  }

  // Dynamic labels based on metric type
  const loadLabel = metricType === 'time' ? 'Tiempo (s)' : metricType === 'tension' ? 'Tensión' : 'Carga (kg)';

  // Helper para formatear el desglose de Drop-Sets
  const formatSetsDetail = (setsDetail?: SetEntry[]) => {
    if (!setsDetail || setsDetail.length === 0) return null;
    return setsDetail.map((set, sIdx) => {
      const segsStr = set.segments.map(s => `${s.reps}×${s.load}${metricType === 'time' ? 's' : 'kg'}`).join(' + ');
      return `S${set.setNumber || sIdx + 1}: ${segsStr}`;
    }).join(' | ');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-[2.5rem] w-full max-w-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 my-auto max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-3 py-1 rounded-full uppercase tracking-wider">
                {exercise.definition.category}
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {metricType === 'time' ? 'Cronómetro' : metricType === 'tension' ? 'Banda Elástica' : 'Pesos/Métricas'}
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{exercise.definition.name}</h3>
            <p className="text-xs font-semibold text-slate-500">Evolución de Carga, Repeticiones e Historial de Series</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-all active:scale-95">
            ✕
          </button>
        </div>

        {/* Filtros de Métricas */}
        <div className="flex items-center gap-2 mb-4 shrink-0 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setMetricFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${metricFilter === 'ALL' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            Ver Todo (Carga + Reps)
          </button>
          <button
            onClick={() => setMetricFilter('LOAD')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${metricFilter === 'LOAD' ? 'bg-sky-500 text-white shadow-md' : 'bg-sky-50 text-sky-700 hover:bg-sky-100'}`}
          >
            Solo {loadLabel}
          </button>
          <button
            onClick={() => setMetricFilter('REPS')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${metricFilter === 'REPS' ? 'bg-emerald-500 text-white shadow-md' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
          >
            Solo Repeticiones
          </button>
        </div>

        {/* Gráfica Recharts */}
        <div className="h-64 sm:h-72 w-full shrink-0 mb-6 bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{fontSize: 11, fontWeight: 700}} stroke="#94a3b8" />
                
                <YAxis 
                  yAxisId="left" 
                  stroke="#0ea5e9" 
                  tick={{fontSize: 11}} 
                  label={{ value: loadLabel, angle: -90, position: 'insideLeft', fill: '#0ea5e9', offset: -5 }} 
                />
                
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#10b981" 
                  tick={{fontSize: 11}} 
                  label={{ value: 'Repeticiones', angle: 90, position: 'insideRight', fill: '#10b981', offset: 5 }} 
                />
                
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 700}}
                  formatter={(value: any, name: string, props: any) => {
                    const payload = props.payload;
                    const suffix = payload && payload.isLivePoint ? ' (Actual)' : '';
                    return [`${value}${suffix}`, name];
                  }}
                />
                <Legend wrapperStyle={{paddingTop: '10px'}} />
                
                {(metricFilter === 'ALL' || metricFilter === 'LOAD') && (
                  <Line yAxisId="left" type="monotone" dataKey="load" name={loadLabel} stroke="#0ea5e9" strokeWidth={3} activeDot={{ r: 8 }} />
                )}
                
                {(metricFilter === 'ALL' || metricFilter === 'REPS') && (
                  <Line yAxisId="right" type="monotone" dataKey="reps" name="Repeticiones" stroke="#10b981" strokeWidth={3} activeDot={{ r: 6 }} />
                )}

                {metricFilter === 'ALL' && (
                  <Line yAxisId="left" type="monotone" dataKey="rpe" name="Esfuerzo (RPE)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 font-bold text-sm">
              No hay datos registrados para este ejercicio
            </div>
          )}
        </div>

        {/* Tabla de Historial Detallado */}
        <div className="flex-1 overflow-y-auto min-h-[160px] pr-1">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calendar size={14} className="text-primary-600"/> Registros de Historial ({data.length})
          </h4>

          {data.length > 0 ? (
            <div className="space-y-2">
              {data.slice().reverse().map((log: any, idx) => {
                const dropSetsFormatted = formatSetsDetail(log.setsDetail);
                return (
                  <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col gap-2 hover:bg-slate-100/60 transition-colors">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">{log.date}</span>
                        {log.week && <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-bold">Semana {log.week}</span>}
                        {log.isLivePoint && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-bold">Sesión Activa</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-sky-600 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">
                          {log.load} {metricType === 'time' ? 's' : 'kg'}
                        </span>
                        <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                          {log.reps} reps
                        </span>
                        {log.rpe ? (
                          <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                            RPE {log.rpe}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Desglose de Series y Drop-Sets si existe */}
                    {dropSetsFormatted && (
                      <div className="mt-1 pt-2 border-t border-slate-200/60 flex items-start gap-1.5 text-[11px] font-semibold text-slate-700 bg-white p-2.5 rounded-xl border border-slate-100">
                        <Layers size={13} className="text-indigo-500 shrink-0 mt-0.5"/>
                        <span className="text-slate-500 font-bold uppercase text-[9px] shrink-0 mt-0.5">Series:</span>
                        <span className="font-bold text-indigo-950 font-mono text-[11px] leading-tight">{dropSetsFormatted}</span>
                      </div>
                    )}

                    {log.observation && (
                      <p className="text-xs text-slate-500 italic">"{log.observation}"</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 font-medium text-center py-4">No hay historial guardado.</p>
          )}
        </div>

      </div>
    </div>
  );
};