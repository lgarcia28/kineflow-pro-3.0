import React from 'react';
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
import { RoutineExercise, Patient } from '../types';

interface ProgressChartProps {
  exercise: RoutineExercise;
  patient?: Patient;
  onClose: () => void;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ exercise, patient, onClose }) => {
  const metricType = exercise.definition.metricType || 'kg';
  
  // Aggregate history from all instances of the same exercise definition across all days
  let data: any[] = [];
  
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
          isLivePoint: true
        }
      ];
    }
  } else {
    // Fall back to the single exercise history if patient is not passed
    data = exercise.history || [];
  }

  // Dynamic labels based on metric type
  const labelText = metricType === 'time' ? 'Tiempo (s)' : metricType === 'tension' ? 'Tensión' : 'Carga (kg)';

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h3 className="text-2xl font-bold text-slate-900">{exercise.definition.name}</h3>
                <p className="text-slate-500">Historial de progreso</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 bg-slate-100 rounded-full">
                ✕
            </button>
        </div>

        <div className="h-80 w-full">
            {data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#94a3b8" />
                    
                    {metricType === 'tension' ? (
                      <YAxis 
                        yAxisId="left" 
                        stroke="#7c3aed" 
                        domain={[1, 3]} 
                        ticks={[1, 2, 3]} 
                        tickFormatter={(tick) => tick === 1 ? 'Baja' : tick === 2 ? 'Media' : 'Alta'} 
                        tick={{fontSize: 11}} 
                        label={{ value: labelText, angle: -90, position: 'insideLeft', fill: '#7c3aed', offset: -5 }} 
                      />
                    ) : (
                      <YAxis 
                        yAxisId="left" 
                        stroke="#0ea5e9" 
                        tick={{fontSize: 11}} 
                        label={{ value: labelText, angle: -90, position: 'insideLeft', fill: '#0ea5e9', offset: -5 }} 
                      />
                    )}
                    
                    <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" label={{ value: 'RPE', angle: 90, position: 'insideRight', fill: '#f59e0b', offset: 5 }} tick={{fontSize: 11}} />
                    
                    <Tooltip 
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        formatter={(value: any, name: string, props: any) => {
                          const payload = props.payload;
                          const suffix = payload && payload.isLivePoint ? ' (Actual)' : '';
                          
                          if (name === 'Tensión') {
                            if (value === 1) return [`Baja${suffix}`, name];
                            if (value === 2) return [`Media${suffix}`, name];
                            if (value === 3) return [`Alta${suffix}`, name];
                          }
                          return [`${value}${suffix}`, name];
                        }}
                    />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="load" name={labelText} stroke={metricType === 'tension' ? '#7c3aed' : '#0ea5e9'} strokeWidth={3} activeDot={{ r: 8 }} />
                    <Line yAxisId="right" type="monotone" dataKey="rpe" name="Esfuerzo (RPE)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl">
                    No hay datos suficientes
                </div>
            )}
        </div>
      </div>
    </div>
  );
};