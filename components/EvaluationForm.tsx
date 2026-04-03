import React, { useState } from 'react';
import { 
  Plus, Save, Trash2, ChevronRight, ChevronLeft, 
  Activity, Ruler, Zap, Shield, User, Info, CheckCircle2, AlertTriangle, ChevronDown, Download, X
} from 'lucide-react';
import { ClinicalEvaluation, Patient, UserRole } from '../types';
import { processEvaluation } from '../services/evaluationLogic';
import { evaluationService } from '../services/evaluationService';

interface EvaluationFormProps {
  patient: Patient;
  onSave: (evaluation: ClinicalEvaluation) => void;
  onCancel: () => void;
  initialData?: ClinicalEvaluation;
}

type TabType = 'BASICS' | 'MOBILITY' | 'PERIMETRY' | 'FLEXIBILITY' | 'STABILITY' | 'MCGILL' | 'FUNCTIONAL' | 'STRENGTH' | 'JUMPS';

export const EvaluationForm: React.FC<EvaluationFormProps> = ({ patient, onSave, onCancel, initialData }) => {
  const [activeTab, setActiveTab] = useState<TabType>('BASICS');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [measurements, setMeasurements] = useState<any>(initialData?.measurements || {
    basic: { 
        date: new Date().toISOString().split('T')[0],
        dominantLeg: 'derecha',
        injuredLeg: 'ninguna'
    },
    mobility: {},
    perimetry: {},
    flexibility: {
      thomas_psoas_r: 'normal',
      thomas_psoas_l: 'normal',
      thomas_rectus_r: 'normal',
      thomas_rectus_l: 'normal',
      askling_r: 'negativo',
      askling_l: 'negativo',
      slump_r: 'negativo',
      slump_l: 'negativo'
    },
    stability: {},
    mcgill: {},
    functional: {},
    strength: {},
    jumps: {}
  });

  const tabs: { id: TabType, label: string, icon: any }[] = [
    { id: 'BASICS', label: 'Básicos', icon: User },
    { id: 'MOBILITY', label: 'Movilidad', icon: Ruler },
    { id: 'PERIMETRY', label: 'Perimetría', icon: Activity },
    { id: 'FLEXIBILITY', label: 'Flexibilidad', icon: Info },
    { id: 'STABILITY', label: 'Estabilidad', icon: Shield },
    { id: 'MCGILL', label: 'McGill', icon: CheckCircle2 },
    { id: 'FUNCTIONAL', label: 'Funcional', icon: Zap },
    { id: 'STRENGTH', label: 'Fuerza', icon: Plus },
    { id: 'JUMPS', label: 'Saltos', icon: Activity },
  ];

  const updateMeasurement = (section: string, field: string, value: any) => {
    setMeasurements((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { conclusions, metrics } = processEvaluation(measurements);
      
      const summaryMetrics = {
          weight: Number(measurements.basic.weight) || 0,
          rsi_cmj: metrics.find(m => m.label.includes('RSI'))?.value as number || 0,
          lsi_knee_ext: metrics.find(m => m.label.includes('Cuádriceps'))?.value as number || 0
      };

      const newEval: Omit<ClinicalEvaluation, 'id'> = {
        patientId: patient.id,
        kineId: 'kine_123', // Hardcoded for now
        date: measurements.basic.date,
        status: 'published',
        measurements,
        results: { conclusions, metrics },
        summaryMetrics
      };

      const id = await evaluationService.create(newEval);
      if (id) {
        onSave({ ...newEval, id } as ClinicalEvaluation);
      }
    } catch (error) {
      console.error('Error saving evaluation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const InputField = ({ label, section, field, type = 'number', options, unit }: { label: string, section: string, field: string, type?: 'number' | 'text' | 'select' | 'date', options?: string[], unit?: string }) => {
    const value = measurements[section]?.[field] || '';
    
    return (
      <div className="space-y-1">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
        <div className="relative">
          {type === 'select' ? (
            <select 
              value={value || (options ? options[0] : '')}
              onChange={e => updateMeasurement(section, field, e.target.value)}
              className="w-full bg-white border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-800 text-sm focus:border-primary-500 focus:ring-0 transition-all shadow-sm"
            >
              {options?.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
            </select>
          ) : (
            <>
              <input 
                type={type}
                value={value}
                onChange={e => updateMeasurement(section, field, type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                className={`w-full bg-white border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-800 text-sm focus:border-primary-500 focus:ring-0 transition-all shadow-sm ${unit ? 'pr-12' : ''}`}
                placeholder={type === 'number' ? '0' : ''}
              />
              {unit && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">{unit}</span>}
            </>
          )}
        </div>
      </div>
    );
  };

  const SectionGrid = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-[11px] font-black text-primary-600 uppercase tracking-[0.2em] whitespace-nowrap">{title}</h3>
        <div className="h-px w-full bg-slate-100"></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {children}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl max-h-[95vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-primary-600 text-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl">
              <Activity size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight">Nueva Evaluación Clínica</h2>
              <p className="text-white/80 font-bold text-sm mt-1">
                Paciente: {patient.firstName} {patient.lastName}
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="p-3 hover:bg-white/10 rounded-2xl transition-all">
            <X size={28} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-10 py-4 bg-slate-50/50 flex gap-2 overflow-x-auto no-scrollbar border-b border-slate-100 shrink-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 scale-105' : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-100'}`}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 bg-white">
          {activeTab === 'BASICS' && (
            <div className="space-y-6">
              <SectionGrid title="Contexto General">
                <InputField section="basic" field="date" label="Fecha" type="date" />
                <InputField section="basic" field="age" label="Edad" unit="AÑOS" />
                <InputField section="basic" field="weight" label="Peso" unit="KG" />
                <InputField section="basic" field="height" label="Altura" unit="CM" />
              </SectionGrid>
              <SectionGrid title="Lesión & Dominancia">
                <InputField section="basic" field="dominantLeg" label="Dominancia" type="select" options={['derecha', 'izquierda']} />
                <InputField section="basic" field="injuredLeg" label="Lesión" type="select" options={['ninguna', 'derecha', 'izquierda']} />
                <InputField section="basic" field="painLevel" label="Dolor (0-10)" />
              </SectionGrid>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comentarios Clínicos</label>
                <textarea 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-900 focus:border-primary-500 transition-all min-h-[100px]"
                  placeholder="Tipo de lesión, fecha de cirugía, antecedentes..."
                  value={measurements.basic.notes || ''}
                  onChange={e => updateMeasurement('basic', 'notes', e.target.value)}
                />
              </div>
            </div>
          )}

          {activeTab === 'MOBILITY' && (
            <div className="space-y-2">
              <SectionGrid title="Cadera (ROM 90º)">
                <InputField section="mobility" field="hip_ir_90_r" label="RI Der" unit="º" />
                <InputField section="mobility" field="hip_ir_90_l" label="RI Izq" unit="º" />
                <InputField section="mobility" field="hip_er_90_r" label="RE Der" unit="º" />
                <InputField section="mobility" field="hip_er_90_l" label="RE Izq" unit="º" />
              </SectionGrid>
              <SectionGrid title="Rodilla">
                <InputField section="mobility" field="knee_ext_pass_r" label="Ext Pas Der" unit="º" />
                <InputField section="mobility" field="knee_ext_pass_l" label="Ext Pas Izq" unit="º" />
                <InputField section="mobility" field="knee_flex_act_r" label="Flex Act Der" unit="º" />
                <InputField section="mobility" field="knee_flex_act_l" label="Flex Act Izq" unit="º" />
              </SectionGrid>
              <SectionGrid title="Tobillo & Hombro">
                <InputField section="mobility" field="ankle_dorsiflex_r" label="Dorsi Der" unit="CM" />
                <InputField section="mobility" field="ankle_dorsiflex_l" label="Dorsi Izq" unit="CM" />
                <InputField section="mobility" field="shoulder_ir_r" label="Hombro RI Der" unit="º" />
                <InputField section="mobility" field="shoulder_ir_l" label="Hombro RI Izq" unit="º" />
              </SectionGrid>
            </div>
          )}

          {activeTab === 'FLEXIBILITY' && (
            <div className="space-y-2">
              <SectionGrid title="Test de Thomas">
                <InputField section="flexibility" field="thomas_psoas_r" label="Psoas Der" type="select" options={['normal', 'corto']} />
                <InputField section="flexibility" field="thomas_psoas_l" label="Psoas Izq" type="select" options={['normal', 'corto']} />
                <InputField section="flexibility" field="thomas_rectus_r" label="Recto Der" type="select" options={['normal', 'corto']} />
                <InputField section="flexibility" field="thomas_rectus_l" label="Recto Izq" type="select" options={['normal', 'corto']} />
              </SectionGrid>
              <SectionGrid title="Flexibilidad Isquios & Neuro">
                <InputField section="flexibility" field="ake_r" label="AKE Der" unit="º" />
                <InputField section="flexibility" field="ake_l" label="AKE Izq" unit="º" />
                <InputField section="flexibility" field="askling_r" label="Askling Der" type="select" options={['negativo', 'positivo']} />
                <InputField section="flexibility" field="askling_l" label="Askling Izq" type="select" options={['negativo', 'positivo']} />
              </SectionGrid>
            </div>
          )}

          {activeTab === 'STRENGTH' && (
            <div className="space-y-2">
              <SectionGrid title="Flexores de Cadera">
                <InputField section="strength" field="hip_flex_0_r" label="0º Der" unit="KG" />
                <InputField section="strength" field="hip_flex_0_l" label="0º Izq" unit="KG" />
                <InputField section="strength" field="hip_flex_0_vas_r" label="VAS Der" />
                <InputField section="strength" field="hip_flex_0_vas_l" label="VAS Izq" />
              </SectionGrid>
              <SectionGrid title="Aductores / Abductores">
                <InputField section="strength" field="adductor_r" label="Adut. Der" unit="KG" />
                <InputField section="strength" field="adductor_l" label="Adut. Izq" unit="KG" />
                <InputField section="strength" field="abductor_r" label="Abdu. Der" unit="KG" />
                <InputField section="strength" field="abductor_l" label="Abdu. Izq" unit="KG" />
              </SectionGrid>
              <SectionGrid title="Cuádriceps / Isquios">
                <InputField section="strength" field="quads_r" label="Cuad. Der" unit="KG" />
                <InputField section="strength" field="quads_l" label="Cuad. Izq" unit="KG" />
                <InputField section="strength" field="hams_r" label="Isquio. Der" unit="KG" />
                <InputField section="strength" field="hams_l" label="Isquio. Izq" unit="KG" />
              </SectionGrid>
            </div>
          )}

          {activeTab === 'JUMPS' && (
            <div className="space-y-2">
              <SectionGrid title="Saltos Verticales">
                <InputField section="jumps" field="cmj_height" label="CMJ Altura" unit="CM" />
                <InputField section="jumps" field="cmj_rsi" label="CMJ RSI" />
                <InputField section="jumps" field="sj_height" label="SJ Altura" unit="CM" />
                <InputField section="jumps" field="sj_rsi" label="SJ RSI" />
              </SectionGrid>
              <SectionGrid title="Saltos Horizontales">
                <InputField section="jumps" field="broad_jump" label="Broad Jump" unit="CM" />
                <InputField section="jumps" field="triple_hop_r" label="Triple Hop Der" unit="CM" />
                <InputField section="jumps" field="triple_hop_l" label="Triple Hop Izq" unit="CM" />
              </SectionGrid>
            </div>
          )}

          {activeTab === 'PERIMETRY' && (
            <SectionGrid title="Trofiismo (Perimetría cm)">
              <InputField section="perimetry" field="thigh_10cm_r" label="Muslo 10cm Der" unit="CM" />
              <InputField section="perimetry" field="thigh_10cm_l" label="Muslo 10cm Izq" unit="CM" />
              <InputField section="perimetry" field="thigh_20cm_r" label="Muslo 20cm Der" unit="CM" />
              <InputField section="perimetry" field="thigh_20cm_l" label="Muslo 20cm Izq" unit="CM" />
              <InputField section="perimetry" field="calf_max_r" label="Pantorrilla Der" unit="CM" />
              <InputField section="perimetry" field="calf_max_l" label="Pantorrilla Izq" unit="CM" />
            </SectionGrid>
          )}

          {activeTab === 'STABILITY' && (
            <div className="space-y-2">
              <SectionGrid title="Y-Balance Test (cm)">
                <InputField section="stability" field="y_balance_ant_r" label="Der Ant" unit="CM" />
                <InputField section="stability" field="y_balance_ant_l" label="Izq Ant" unit="CM" />
                <InputField section="stability" field="y_balance_pm_r" label="Der Post-Med" unit="CM" />
                <InputField section="stability" field="y_balance_pm_l" label="Izq Post-Med" unit="CM" />
                <InputField section="stability" field="y_balance_pl_r" label="Der Post-Lat" unit="CM" />
                <InputField section="stability" field="y_balance_pl_l" label="Izq Post-Lat" unit="CM" />
                <InputField section="stability" field="leg_length" label="Largo Miembro" unit="CM" />
              </SectionGrid>
            </div>
          )}

          {activeTab === 'MCGILL' && (
            <SectionGrid title="Resistencia Core (McGill - seg)">
              <InputField section="mcgill" field="flexor_endurance" label="Flexores" unit="SEG" />
              <InputField section="mcgill" field="extensor_endurance" label="Extensores" unit="SEG" />
              <InputField section="mcgill" field="lateral_bridge_r" label="Puente Lat Der" unit="SEG" />
              <InputField section="mcgill" field="lateral_bridge_l" label="Puente Lat Izq" unit="SEG" />
            </SectionGrid>
          )}

          {activeTab === 'FUNCTIONAL' && (
            <div className="space-y-2">
              <SectionGrid title="Resistencia Muscular">
                <InputField section="functional" field="glute_bridge_r" label="Puente G. Der" unit="REPS" />
                <InputField section="functional" field="glute_bridge_l" label="Puente G. Izq" unit="REPS" />
                <InputField section="functional" field="calf_raise_r" label="Gemelo Der" unit="REPS" />
                <InputField section="functional" field="calf_raise_l" label="Gemelo Izq" unit="REPS" />
              </SectionGrid>
              <SectionGrid title="Control Motor (VAS)">
                <InputField section="functional" field="glute_bridge_vas_r" label="VAS Puente D" />
                <InputField section="functional" field="glute_bridge_vas_l" label="VAS Puente I" />
                <InputField section="functional" field="single_leg_squat_vas_r" label="VAS SLS Der" />
                <InputField section="functional" field="single_leg_squat_vas_l" label="VAS SLS Izq" />
              </SectionGrid>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-10 py-8 border-t border-slate-50 flex items-center justify-end bg-slate-50/30 shrink-0 gap-4">
          <button 
            onClick={onCancel}
            className="px-8 py-4 rounded-2xl font-black text-slate-400 hover:text-slate-600 transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-12 py-4 rounded-2xl font-black text-white bg-primary-600 hover:bg-primary-700 shadow-xl shadow-primary-200 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? (
                <Activity size={20} className="animate-spin" />
            ) : (
                <Save size={20} />
            )}
            {isSubmitting ? 'Guardando...' : 'Finalizar y Publicar'}
          </button>
        </div>
      </div>
    </div>
  );
};
