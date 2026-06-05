import React from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Award, CheckCircle2, Info, Download, Image as ImageIcon } from 'lucide-react';
import { ClinicalEvaluation, Patient } from '../types';
import { generateEvaluationPDF } from '../services/pdfService';

interface EvaluationDetailsModalProps {
  evaluation: ClinicalEvaluation;
  patient: Patient;
  onClose: () => void;
}

// Helper para obtener valores absolutos derecha-izquierda de cada métrica
const getRawValuesForMetric = (label: string, measurements: any): { r?: number; l?: number } | null => {
  if (!measurements) return null;
  const lbl = label.toLowerCase();
  
  if (lbl.includes('flexores cadera 0-0º')) return { r: measurements.strength?.hip_flex_0_r, l: measurements.strength?.hip_flex_0_l };
  if (lbl.includes('flexores cadera 0-90º')) return { r: measurements.strength?.hip_flex_90_r, l: measurements.strength?.hip_flex_90_l };
  if (lbl.includes('aductores') && !lbl.includes('tobillo')) return { r: measurements.strength?.adductor_r, l: measurements.strength?.adductor_l };
  if (lbl.includes('abductores') && !lbl.includes('tobillo')) return { r: measurements.strength?.abductor_r, l: measurements.strength?.abductor_l };
  if (lbl.includes('cuádriceps')) return { r: measurements.strength?.quads_r, l: measurements.strength?.quads_l };
  if (lbl.includes('isquiotibiales')) return { r: measurements.strength?.hams_r, l: measurements.strength?.hams_l };
  if (lbl.includes('tríceps sural')) return { r: measurements.strength?.triceps_sural_r, l: measurements.strength?.triceps_sural_l };
  if (lbl.includes('abductores tobillo')) return { r: measurements.strength?.tobillo_abd_r, l: measurements.strength?.tobillo_abd_l };
  if (lbl.includes('aductores tobillo')) return { r: measurements.strength?.tobillo_add_r, l: measurements.strength?.tobillo_add_l };
  if (lbl.includes('imtp')) return { r: measurements.strength?.imtp_r, l: measurements.strength?.imtp_l };
  if (lbl.includes('rotadores internos hombro')) return { r: measurements.strength?.shoulder_ir_r, l: measurements.strength?.shoulder_ir_l };
  if (lbl.includes('rotadores externos hombro')) return { r: measurements.strength?.shoulder_er_r, l: measurements.strength?.shoulder_er_l };
  if (lbl.includes('ash test i')) return { r: measurements.strength?.ash_i_r, l: measurements.strength?.ash_i_l };
  if (lbl.includes('ash test y')) return { r: measurements.strength?.ash_y_r, l: measurements.strength?.ash_y_l };
  if (lbl.includes('ash test t')) return { r: measurements.strength?.ash_t_r, l: measurements.strength?.ash_t_l };
  if (lbl.includes('handgrip')) return { r: measurements.strength?.handgrip_r, l: measurements.strength?.handgrip_l };
  
  if (lbl.includes('simetría sentadilla')) return { r: measurements.vbt?.squat_r, l: measurements.vbt?.squat_l };
  if (lbl.includes('simetría peso muerto')) return { r: measurements.vbt?.deadlift_r, l: measurements.vbt?.deadlift_l };
  if (lbl.includes('simetría puente glúteo')) return { r: measurements.vbt?.glute_bridge_r, l: measurements.vbt?.glute_bridge_l };
  if (lbl.includes('simetría sentadilla búlgara')) return { r: measurements.vbt?.bulgarian_r, l: measurements.vbt?.bulgarian_l };
  
  if (lbl.includes('cmj 1p altura')) return { r: measurements.jumps_vertical?.cmj_1p_height_r, l: measurements.jumps_vertical?.cmj_1p_height_l };
  if (lbl.includes('cmj 1p frenado')) return { r: measurements.jumps_vertical?.cmj_1p_brake_r, l: measurements.jumps_vertical?.cmj_1p_brake_l };
  if (lbl.includes('cmj 1p propulsión')) return { r: measurements.jumps_vertical?.cmj_1p_prop_r, l: measurements.jumps_vertical?.cmj_1p_prop_l };
  if (lbl.includes('cmj 1p aterrizaje')) return { r: measurements.jumps_vertical?.cmj_1p_land_r, l: measurements.jumps_vertical?.cmj_1p_land_l };
  
  if (lbl.includes('dj 1p altura')) return { r: measurements.jumps_vertical?.dj_1p_height_r, l: measurements.jumps_vertical?.dj_1p_height_l };
  if (lbl.includes('dj 1p contacto')) return { r: measurements.jumps_vertical?.dj_1p_contact_r, l: measurements.jumps_vertical?.dj_1p_contact_l };
  
  if (lbl.includes('single hop')) return { r: measurements.jumps_horizontal?.single_hop_r, l: measurements.jumps_horizontal?.single_hop_l };
  if (lbl.includes('triple hop distancia')) return { r: measurements.jumps_horizontal?.triple_hop_dist_r, l: measurements.jumps_horizontal?.triple_hop_dist_l };
  if (lbl.includes('triple hop contacto')) return { r: measurements.jumps_horizontal?.triple_hop_contact_r, l: measurements.jumps_horizontal?.triple_hop_contact_l };
  if (lbl.includes('crossover hop distancia')) return { r: measurements.jumps_horizontal?.crossover_hop_dist_r, l: measurements.jumps_horizontal?.crossover_hop_dist_l };
  if (lbl.includes('crossover hop contacto')) return { r: measurements.jumps_horizontal?.crossover_hop_contact_r, l: measurements.jumps_horizontal?.crossover_hop_contact_l };
  if (lbl.includes('medial side triple hop')) return { r: measurements.jumps_horizontal?.medial_side_triple_hop_r, l: measurements.jumps_horizontal?.medial_side_triple_hop_l };
  if (lbl.includes('medial rotation hop')) return { r: measurements.jumps_horizontal?.medial_rotation_hop_r, l: measurements.jumps_horizontal?.medial_rotation_hop_l };
  if (lbl.includes('side hop')) return { r: measurements.jumps_horizontal?.side_hop_r, l: measurements.jumps_horizontal?.side_hop_l };
  
  return null;
};

// Componente gráfico para visualizar la simetría/balance
const MetricSymmetryVisualizer = ({ metric, measurements }: { metric: any, measurements: any }) => {
  const raw = getRawValuesForMetric(metric.label, measurements);
  const isLsi = metric.unit === '%';
  const lsiVal = Number(metric.value);
  
  if (!isLsi || isNaN(lsiVal)) return null;

  // Calculamos la posición del marcador en un rango de 50% a 150% (100% en el centro)
  const clampedVal = Math.max(50, Math.min(150, lsiVal));
  const percentPosition = ((clampedVal - 50) / 100) * 100; // 0% a 100% de la barra

  return (
    <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
      {/* Valores absolutos Derecha vs Izquierda */}
      {raw && raw.r !== undefined && raw.l !== undefined && (
        <div className="flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Der: {raw.r}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Izq: {raw.l}
          </span>
        </div>
      )}
      
      {/* Pista de Balance */}
      <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        {/* Zona verde normal de simetría (90% a 110%) */}
        <div 
          className="absolute h-full bg-green-200/50"
          style={{ left: '40%', right: '40%' }} // 90% es el 40% y 110% es el 60% en rango 50-150
        />
        {/* Marcador de valor actual */}
        <div 
          className={`absolute top-0 bottom-0 w-1.5 rounded-full shadow-sm ${
            metric.interpretation === 'normal' ? 'bg-green-500' : 
            metric.interpretation === 'warning' ? 'bg-orange-500' : 'bg-red-500'
          }`}
          style={{ left: `${percentPosition}%`, transform: 'translateX(-50%)' }}
        />
      </div>

      {/* Etiquetas de Lados */}
      <div className="flex justify-between text-[8px] font-black text-slate-300 uppercase tracking-widest px-0.5">
        <span>Déficit Der (50%)</span>
        <span className="text-slate-400">Sano / Simétrico (100%)</span>
        <span>Déficit Izq (150%)</span>
      </div>
    </div>
  );
};

export const EvaluationDetailsModal: React.FC<EvaluationDetailsModalProps> = ({ evaluation, patient, onClose }) => {
  // Recopilar fotos clínicas cargadas
  const clinicalImages = [
    { label: 'Thomas Derecha', url: evaluation.measurements.flexibility?.thomas_r_image_url },
    { label: 'Thomas Izquierda', url: evaluation.measurements.flexibility?.thomas_l_image_url },
    { label: 'SLS Frontal Derecha', url: evaluation.measurements.motor_control?.sls_frontal_r_image_url },
    { label: 'SLS Frontal Izquierda', url: evaluation.measurements.motor_control?.sls_frontal_l_image_url },
    { label: 'SLS Sagital', url: evaluation.measurements.motor_control?.sls_sagital_image_url },
    { label: 'Sentadilla Bipodal', url: evaluation.measurements.motor_control?.squat_bipodal_image_url },
  ].filter(img => img.url);

  return createPortal(
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center sm:p-4 cursor-pointer"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      <div 
        className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 cursor-default"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 sm:px-10 sm:py-8 border-b border-slate-50 flex items-center justify-between bg-primary-600 text-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl">
              <Award size={24} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Reporte de Evaluación</h2>
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
        <div className="flex-1 overflow-y-auto p-5 sm:p-10 bg-white">
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
                          <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none mb-1">{m.label}</p>
                                <p className="text-xl font-black text-slate-800">{m.value}{m.unit}</p>
                              </div>
                              <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                                m.interpretation === 'normal' ? 'bg-green-100 text-green-600' : 
                                m.interpretation === 'warning' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
                              }`}>
                                {m.interpretation}
                              </div>
                            </div>
                            
                            {/* Gráfico/Indicador visual de simetría (LSI) */}
                            <MetricSymmetryVisualizer metric={m} measurements={evaluation.measurements} />
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

            {/* Right Column: Measurements Summary & Photos */}
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

              {/* Galería de Fotos Clínicas */}
              {clinicalImages.length > 0 && (
                <section className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <ImageIcon size={14} /> Fotos Clínicas
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {clinicalImages.map((img, idx) => (
                      <div 
                        key={idx} 
                        className="group relative rounded-xl overflow-hidden border border-slate-200 aspect-square bg-white shadow-sm cursor-zoom-in"
                        title={img.label}
                      >
                        <img src={img.url!} alt={img.label} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                          <p className="text-[8px] font-black text-white uppercase tracking-wider leading-tight w-full truncate">{img.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pt-4 pb-[calc(1rem+var(--sab))] sm:px-10 sm:py-6 border-t border-slate-50 flex items-center justify-between bg-slate-50/30 shrink-0">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] hidden sm:block">KineFlow Pro Clinical System</p>
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 text-center"
          >
            Cerrar Reporte
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
