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
import { RoutineExercise } from '../types';

interface ProgressChartProps {
  exercise: RoutineExercise;
  onClose: () => void;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ exercise, onClose }) => {
  const data = exercise.history || [];

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
                    <YAxis yAxisId="left" stroke="#0ea5e9" label={{ value: 'Carga (kg)', angle: -90, position: 'insideLeft', fill: '#0ea5e9' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" label={{ value: 'RPE', angle: 90, position: 'insideRight', fill: '#f59e0b' }} />
                    <Tooltip 
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="load" name="Carga (kg)" stroke="#0ea5e9" strokeWidth={3} activeDot={{ r: 8 }} />
                    <Line yAxisId="right" type="monotone" dataKey="rpe" name="Esferzo (RPE)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" />
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