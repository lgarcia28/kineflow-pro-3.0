import React from 'react';
import { X, Calendar, Award, CheckCircle2, AlertTriangle, Info, Download } from 'lucide-react';
import { ClinicalEvaluation, Patient } from '../types';
import { generateEvaluationPDF } from '../services/pdfService';

interface EvaluationDetailsModalProps {
  evaluation: ClinicalEvaluation;
  patient: Patient;
  onClose: () => void;
}

export const EvaluationDetailsModal: React.FC<EvaluationDetailsModalProps> = ({ evaluation, patient, onClose }) => {
  return (
    <div 
      className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 cursor-default"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-primary-600 text-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl">
              <Award size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Reporte de Evaluación</h2>
              <p className="text-white/80 font-bold text-sm mt-1 flex items-center gap-2">
                <Calendar size={14} /> {new Date(evaluation.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => generateEvaluationPDF(evaluation, patient)}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-2xl transition-all flex items-center gap-2 font-black text-xs uppercase tracking-widest"
              title="Descargar PDF"
            >
              <Download size={18} /> PDF
            </button>
            <button 
              onClick={onClose} 
              className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
              aria-label="Cerrar"
            >
              <X size={28} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Metrics */}
            <div className="lg:col-span-2 space-y-8">
              <section>
                <h3 className="text-[11px] font-black text-primary-600 uppercase tracking-[0.2em] mb-4">Resultados Clave (LSI / RSI)</h3>
                <div className="space-y-6">
                  {Object.entries(
                    evaluation.results.metrics.reduce((acc: any, m) => {
                      if (!acc[m.category]) acc[m.category] = [];
                      acc[m.category].push(m);
                      return acc;
                    }, {})
                  ).map(([category, categoryMetrics]: [string, any]) => (
                    <div key={category} className="space-y-3">
                      <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">{category}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {categoryMetrics.map((m: any, idx: number) => (
                          <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{m.label}</p>
                              <p className="text-xl font-black text-slate-800">{m.value}{m.unit}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                              m.interpretation === 'normal' ? 'bg-green-100 text-green-600' : 
                              m.interpretation === 'warning' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
                            }`}>
                              {m.interpretation}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {evaluation.results.metrics.length === 0 && (
                    <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No hay métricas específicas calculadas</p>
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-[11px] font-black text-primary-600 uppercase tracking-[0.2em] mb-4">Conclusiones Clínicas</h3>
                <div className="space-y-3">
                  {evaluation.results.conclusions.map((c, idx) => (
                    <div key={idx} className="flex gap-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                      <div className="text-blue-500 shrink-0 mt-0.5">
                        <CheckCircle2 size={18} />
                      </div>
                      <p className="text-sm font-bold text-slate-700 leading-relaxed">{c}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Column: Measurements Summary */}
            <div className="space-y-8">
              <section className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Info size={14} /> Datos de Ingreso
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-slate-200 pb-2">
                        <span className="text-xs font-black text-slate-400 uppercase">Peso</span>
                        <span className="text-sm font-black text-slate-700">{evaluation.measurements.basic?.weight || 'N/A'} kg</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-slate-200 pb-2">
                        <span className="text-xs font-black text-slate-400 uppercase">Dolor</span>
                        <span className="text-sm font-black text-slate-700">{evaluation.measurements.basic?.pain_during_eval || 'No'}</span>
                    </div>
                    {evaluation.measurements.basic?.injuredLeg !== 'ninguna' && (
                        <div className="flex justify-between items-end border-b border-slate-200 pb-2">
                            <span className="text-xs font-black text-slate-400 uppercase">Lado Lesionado</span>
                            <span className="text-sm font-black text-red-600 uppercase">{evaluation.measurements.basic?.injuredLeg}</span>
                        </div>
                    )}
                </div>
                {evaluation.measurements.basic?.injury_comments && (
                  <div className="mt-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Comentarios</p>
                    <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
                      "{evaluation.measurements.basic.injury_comments}"
                    </p>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-6 border-t border-slate-50 flex items-center justify-between bg-slate-50/30 shrink-0">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">KineFlow Pro Clinical System</p>
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
          >
            Cerrar Reporte
          </button>
        </div>
      </div>
    </div>
  );
};
