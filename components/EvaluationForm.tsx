import React, { useState, useMemo } from 'react';
import { 
  Plus, Save, Trash2, ChevronRight, ChevronLeft, 
  Activity, Ruler, Zap, Shield, User, Info, CheckCircle2, AlertTriangle, ChevronDown, Download, X,
  Target, Footprints, MoveVertical, MoveHorizontal, ListChecks, Heart, Thermometer, Brain, Wind
} from 'lucide-react';
import { ClinicalEvaluation, Patient, UserRole } from '../types';
import { processEvaluation } from '../services/evaluationLogic';
import { evaluationService } from '../services/evaluationService';

// --- Sub-components outside to fix focus issues ---

const SectionGrid = ({ title, children, cols = 4 }: { title: string, children: React.ReactNode, cols?: number }) => (
  <div className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
    <div className="flex items-center gap-3 mb-4">
      <h3 className="text-[11px] font-black text-primary-600 uppercase tracking-[0.2em] whitespace-nowrap">{title}</h3>
      <div className="h-px w-full bg-slate-100"></div>
    </div>
    <div className={`grid grid-cols-2 md:grid-cols-${cols} gap-4`}>
      {children}
    </div>
  </div>
);

const VASSelector = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => {
  const colors = [
    'bg-emerald-500', 'bg-emerald-400', 'bg-green-400', 'bg-yellow-400', 
    'bg-yellow-500', 'bg-orange-400', 'bg-orange-500', 'bg-red-400', 
    'bg-red-500', 'bg-red-600'
  ];

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num, i) => (
          <button
            key={num}
            onClick={() => onChange(num)}
            className={`flex-1 h-10 rounded-lg text-xs font-bold transition-all ${
              value === num ? `${colors[i]} text-white shadow-lg scale-110 z-10` : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
            }`}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
};

const InputField = ({ label, value, onChange, type = 'number', options, unit }: { 
  label: string, value: any, onChange: (v: any) => void, type?: 'number' | 'text' | 'select' | 'date', options?: string[], unit?: string 
}) => {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest line-clamp-1" title={label}>{label}</label>
      <div className="relative">
        {type === 'select' ? (
          <select 
            value={value || (options ? options[0] : '')}
            onChange={e => onChange(e.target.value)}
            className="w-full bg-white border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-800 text-sm focus:border-primary-500 focus:ring-0 transition-all shadow-sm"
          >
            {options?.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
          </select>
        ) : (
          <>
            <input 
              type={type}
              inputMode={type === 'number' ? 'numeric' : undefined}
              value={value || ''}
              onChange={e => onChange(type === 'number' ? parseFloat(e.target.value) : e.target.value)}
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

// --- Main Form Component ---

interface EvaluationFormProps {
  patient: Patient;
  onSave: (evaluation: ClinicalEvaluation) => void;
  onCancel: () => void;
  initialData?: ClinicalEvaluation;
}

type TabType = 'BASICS' | 'MOBILITY' | 'FLEXIBILITY' | 'PALPATION' | 'BALANCE' | 'MCGILL' | 'FUNCTIONAL' | 'STRENGTH' | 'VBT' | 'JUMPS_V' | 'JUMPS_H' | 'CONTROL';

export const EvaluationForm: React.FC<EvaluationFormProps> = ({ patient, onSave, onCancel, initialData }) => {
  const [activeTab, setActiveTab] = useState<TabType>('BASICS');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [measurements, setMeasurements] = useState<any>(initialData?.measurements || {
    basic: { date: new Date().toISOString().split('T')[0], dominantLeg: 'derecha', injuredLeg: 'ninguna' },
    mobility: {}, flexibility: {}, palpation: {}, balance: {}, mcgill: {}, functional: {}, strength: {}, vbt: {}, jumps_vertical: {}, jumps_horizontal: {}, motor_control: {}
  });

  const categories = [
    { id: 'BASICS', label: 'Básicos', icon: User },
    { id: 'MOBILITY', label: 'Movilidad', icon: Ruler },
    { id: 'FLEXIBILITY', label: 'Flexibilidad', icon: Info },
    { id: 'PALPATION', label: 'Clínica', icon: Thermometer },
    { id: 'BALANCE', label: 'Equilibrio', icon: Brain },
    { id: 'MCGILL', label: 'McGill', icon: CheckCircle2 },
    { id: 'FUNCTIONAL', label: 'Funcional', icon: Zap },
    { id: 'STRENGTH', label: 'Fuerza', icon: Plus },
    { id: 'VBT', label: 'Potencia', icon: Activity },
    { id: 'JUMPS_V', label: 'S. Vertical', icon: MoveVertical },
    { id: 'JUMPS_H', label: 'S. Horiz.', icon: MoveHorizontal },
    { id: 'CONTROL', label: 'Control Mot.', icon: Target },
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

  const updateDeepMeasurement = (section: string, sub: string, field: string, value: any) => {
    setMeasurements((prev: any) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [sub]: {
            ...prev[section][sub],
            [field]: value
          }
        }
      }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { conclusions, metrics } = processEvaluation(measurements);
      
      const summaryMetrics = {
          weight: Number(measurements.basic.weight) || 0,
          rsi_cmj: Number(measurements.jumps_vertical?.cmj_2p_rsi) || 0,
          lsi_knee_ext: metrics.find(m => m.label.includes('Cuádriceps'))?.value as number || 0
      };

      const newEval: Omit<ClinicalEvaluation, 'id'> = {
        patientId: patient.id,
        kineId: 'kine_123',
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

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[95vw] lg:max-w-7xl h-[95vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-10 py-6 border-b border-slate-50 flex items-center justify-between bg-primary-600 text-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl">
              <Activity size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Evaluación Kinésica Deportiva</h2>
              <p className="text-white/80 font-bold text-xs mt-0.5">
                Paciente: {patient.firstName} {patient.lastName} | DNI: {patient.dni}
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-2xl transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Sidebar / Tabs */}
          <div className="w-full md:w-64 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-100 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto shrink-0 p-4 gap-2 no-scrollbar scroll-smooth">
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id as TabType)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[11px] font-black transition-all whitespace-nowrap md:whitespace-normal shrink-0 ${
                    activeTab === cat.id 
                      ? 'bg-primary-600 text-white shadow-xl shadow-primary-200 -translate-y-0.5' 
                      : 'bg-transparent text-slate-400 hover:text-slate-700 hover:bg-white'
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="uppercase tracking-widest">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Scrolling Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-12 bg-white no-scrollbar">
            {/* BASICS */}
            {activeTab === 'BASICS' && (
              <div className="space-y-6">
                <SectionGrid title="Contexto General">
                  <InputField label="Fecha" value={measurements.basic.date} onChange={v => updateMeasurement('basic', 'date', v)} type="date" />
                  <InputField label="Edad" value={measurements.basic.age} onChange={v => updateMeasurement('basic', 'age', v)} unit="AÑOS" />
                  <InputField label="Peso" value={measurements.basic.weight} onChange={v => updateMeasurement('basic', 'weight', v)} unit="KG" />
                  <InputField label="Altura" value={measurements.basic.height} onChange={v => updateMeasurement('basic', 'height', v)} unit="CM" />
                </SectionGrid>
                <SectionGrid title="Lesión & Médico">
                  <InputField label="Dominancia" value={measurements.basic.dominantLeg} onChange={v => updateMeasurement('basic', 'dominantLeg', v)} type="select" options={['derecha', 'izquierda']} />
                  <InputField label="Pierna Lesión" value={measurements.basic.injuredLeg} onChange={v => updateMeasurement('basic', 'injuredLeg', v)} type="select" options={['ninguna', 'derecha', 'izquierda']} />
                  <InputField label="Tipo Lesión" value={measurements.basic.injuryType} onChange={v => updateMeasurement('basic', 'injuryType', v)} type="text" />
                  <InputField label="Médico Derivante" value={measurements.basic.referringDoctor} onChange={v => updateMeasurement('basic', 'referringDoctor', v)} type="text" />
                </SectionGrid>
                <SectionGrid title="Dolor & Entrenamiento" cols={2}>
                    <VASSelector label="Dolor durante la sesión (1-10)" value={measurements.basic.painLevel} onChange={v => updateMeasurement('basic', 'painLevel', v)} />
                    <InputField label="Entrenamiento previo a sesión" value={measurements.basic.prevSessionTraining} onChange={v => updateMeasurement('basic', 'prevSessionTraining', v)} type="text" />
                </SectionGrid>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comentarios Lesión / Antecedentes</label>
                        <textarea className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-sm focus:border-primary-500 min-h-[100px]" value={measurements.basic.injuryComments || ''} onChange={e => updateMeasurement('basic', 'injuryComments', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Antecedentes Generales</label>
                        <textarea className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-sm focus:border-primary-500 min-h-[100px]" value={measurements.basic.antecedents || ''} onChange={e => updateMeasurement('basic', 'antecedents', e.target.value)} />
                    </div>
                </div>
              </div>
            )}

            {/* MOBILITY */}
            {activeTab === 'MOBILITY' && (
              <div className="space-y-2">
                <SectionGrid title="Cadera (ROM 90º)">
                  <InputField label="RI Der" value={measurements.mobility.hip_ir_90_r} onChange={v => updateMeasurement('mobility', 'hip_ir_90_r', v)} unit="º" />
                  <InputField label="RI Izq" value={measurements.mobility.hip_ir_90_l} onChange={v => updateMeasurement('mobility', 'hip_ir_90_l', v)} unit="º" />
                  <InputField label="RE Der" value={measurements.mobility.hip_er_90_r} onChange={v => updateMeasurement('mobility', 'hip_er_90_r', v)} unit="º" />
                  <InputField label="RE Izq" value={measurements.mobility.hip_er_90_l} onChange={v => updateMeasurement('mobility', 'hip_er_90_l', v)} unit="º" />
                </SectionGrid>
                <SectionGrid title="Rodilla (Ext/Flex)">
                  <InputField label="Ext Pas Der" value={measurements.mobility.knee_ext_pass_r} onChange={v => updateMeasurement('mobility', 'knee_ext_pass_r', v)} unit="º" />
                  <InputField label="Ext Pas Izq" value={measurements.mobility.knee_ext_pass_l} onChange={v => updateMeasurement('mobility', 'knee_ext_pass_l', v)} unit="º" />
                  <InputField label="Flex Act Der" value={measurements.mobility.knee_flex_act_r} onChange={v => updateMeasurement('mobility', 'knee_flex_act_r', v)} unit="º" />
                  <InputField label="Flex Act Izq" value={measurements.mobility.knee_flex_act_l} onChange={v => updateMeasurement('mobility', 'knee_flex_act_l', v)} unit="º" />
                  <InputField label="Flex Pas Der" value={measurements.mobility.knee_flex_pass_r} onChange={v => updateMeasurement('mobility', 'knee_flex_pass_r', v)} unit="º" />
                  <InputField label="Flex Pas Izq" value={measurements.mobility.knee_flex_pass_l} onChange={v => updateMeasurement('mobility', 'knee_flex_pass_l', v)} unit="º" />
                </SectionGrid>
                <SectionGrid title="Tobillo & Hombro">
                  <InputField label="Dorsi Tob Der" value={measurements.mobility.ankle_dorsiflex_r} onChange={v => updateMeasurement('mobility', 'ankle_dorsiflex_r', v)} unit="CM" />
                  <InputField label="Dorsi Tob Izq" value={measurements.mobility.ankle_dorsiflex_l} onChange={v => updateMeasurement('mobility', 'ankle_dorsiflex_l', v)} unit="CM" />
                  <InputField label="RI Hombro Der" value={measurements.mobility.shoulder_ir_r} onChange={v => updateMeasurement('mobility', 'shoulder_ir_r', v)} unit="º" />
                  <InputField label="RI Hombro Izq" value={measurements.mobility.shoulder_ir_l} onChange={v => updateMeasurement('mobility', 'shoulder_ir_l', v)} unit="º" />
                  <InputField label="RE Hombro Der" value={measurements.mobility.shoulder_er_r} onChange={v => updateMeasurement('mobility', 'shoulder_er_r', v)} unit="º" />
                  <InputField label="RE Hombro Izq" value={measurements.mobility.shoulder_er_l} onChange={v => updateMeasurement('mobility', 'shoulder_er_l', v)} unit="º" />
                </SectionGrid>
              </div>
            )}

            {/* FLEXIBILITY */}
            {activeTab === 'FLEXIBILITY' && (
              <div className="space-y-2">
                <SectionGrid title="Thomas Test (DERECHA)">
                  <InputField label="Psoas Ilíaco" value={measurements.flexibility.thomas_psoas_r} onChange={v => updateMeasurement('flexibility', 'thomas_psoas_r', v)} type="select" options={['normal', 'corto']} />
                  <InputField label="Recto Anterior" value={measurements.flexibility.thomas_rectus_r} onChange={v => updateMeasurement('flexibility', 'thomas_rectus_r', v)} type="select" options={['normal', 'corto']} />
                  <InputField label="Sartorio" value={measurements.flexibility.thomas_sartorius_r} onChange={v => updateMeasurement('flexibility', 'thomas_sartorius_r', v)} type="select" options={['normal', 'corto']} />
                </SectionGrid>
                <SectionGrid title="Thomas Test (IZQUIERDA)">
                  <InputField label="Psoas Ilíaco" value={measurements.flexibility.thomas_psoas_l} onChange={v => updateMeasurement('flexibility', 'thomas_psoas_l', v)} type="select" options={['normal', 'corto']} />
                  <InputField label="Recto Anterior" value={measurements.flexibility.thomas_rectus_l} onChange={v => updateMeasurement('flexibility', 'thomas_rectus_l', v)} type="select" options={['normal', 'corto']} />
                  <InputField label="Sartorio" value={measurements.flexibility.thomas_sartorius_l} onChange={v => updateMeasurement('flexibility', 'thomas_sartorius_l', v)} type="select" options={['normal', 'corto']} />
                </SectionGrid>
                <SectionGrid title="Tests Neuro-Ortopédicos">
                  <InputField label="AKE Der" value={measurements.flexibility.ake_r} onChange={v => updateMeasurement('flexibility', 'ake_r', v)} unit="º" />
                  <InputField label="AKE Izq" value={measurements.flexibility.ake_l} onChange={v => updateMeasurement('flexibility', 'ake_l', v)} unit="º" />
                  <InputField label="Askling Der" value={measurements.flexibility.askling_r} onChange={v => updateMeasurement('flexibility', 'askling_r', v)} type="select" options={['negativo', 'positivo']} />
                  <InputField label="Askling Izq" value={measurements.flexibility.askling_l} onChange={v => updateMeasurement('flexibility', 'askling_l', v)} type="select" options={['negativo', 'positivo']} />
                  <InputField label="Slump Der" value={measurements.flexibility.slump_r} onChange={v => updateMeasurement('flexibility', 'slump_r', v)} type="select" options={['negativo', 'positivo']} />
                  <InputField label="Slump Izq" value={measurements.flexibility.slump_l} onChange={v => updateMeasurement('flexibility', 'slump_l', v)} type="select" options={['negativo', 'positivo']} />
                  <InputField label="BKFO Der" value={measurements.flexibility.bkfo_r} onChange={v => updateMeasurement('flexibility', 'bkfo_r', v)} unit="CM" />
                  <InputField label="BKFO Izq" value={measurements.flexibility.bkfo_l} onChange={v => updateMeasurement('flexibility', 'bkfo_l', v)} unit="CM" />
                </SectionGrid>
              </div>
            )}

            {/* PALPATION */}
            {activeTab === 'PALPATION' && (
              <div className="space-y-6">
                <SectionGrid title="Zonas de Tensión (1-10)" cols={1}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    <VASSelector label="Psoas Der - Palpación" value={measurements.palpation.psoas_r?.palpation} onChange={v => updateDeepMeasurement('palpation', 'psoas_r', 'palpation', v)} />
                    <VASSelector label="Psoas Izq - Palpación" value={measurements.palpation.psoas_l?.palpation} onChange={v => updateDeepMeasurement('palpation', 'psoas_l', 'palpation', v)} />
                    <VASSelector label="Aductor Der - Palpación" value={measurements.palpation.adductor_r?.palpation} onChange={v => updateDeepMeasurement('palpation', 'adductor_r', 'palpation', v)} />
                    <VASSelector label="Aductor Izq - Palpación" value={measurements.palpation.adductor_l?.palpation} onChange={v => updateDeepMeasurement('palpation', 'adductor_l', 'palpation', v)} />
                    <VASSelector label="Pubis Der - Palpación" value={measurements.palpation.pubis_r?.palpation} onChange={v => updateDeepMeasurement('palpation', 'pubis_r', 'palpation', v)} />
                    <VASSelector label="Pubis Izq - Palpación" value={measurements.palpation.pubis_l?.palpation} onChange={v => updateDeepMeasurement('palpation', 'pubis_l', 'palpation', v)} />
                  </div>
                </SectionGrid>
                <SectionGrid title="Hip / Spine Tests">
                  <InputField label="Hip Impingement D" value={measurements.palpation.hip_impingement_r} onChange={v => updateMeasurement('palpation', 'hip_impingement_r', v)} type="select" options={['negativo', 'positivo']} />
                  <InputField label="Hip Impingement I" value={measurements.palpation.hip_impingement_l} onChange={v => updateMeasurement('palpation', 'hip_impingement_l', v)} type="select" options={['negativo', 'positivo']} />
                  <InputField label="Labrum Ant D" value={measurements.palpation.hip_labrum_r} onChange={v => updateMeasurement('palpation', 'hip_labrum_r', v)} type="select" options={['negativo', 'positivo']} />
                  <InputField label="Labrum Ant I" value={measurements.palpation.hip_labrum_l} onChange={v => updateMeasurement('palpation', 'hip_labrum_l', v)} type="select" options={['negativo', 'positivo']} />
                  <InputField label="Spine Flexion" value={measurements.palpation.spine_flexion} onChange={v => updateMeasurement('palpation', 'spine_flexion', v)} unit="CM" />
                  <InputField label="Spine Extension" value={measurements.palpation.spine_extension} onChange={v => updateMeasurement('palpation', 'spine_extension', v)} unit="CM" />
                </SectionGrid>
              </div>
            )}

            {/* BALANCE */}
            {activeTab === 'BALANCE' && (
              <div className="space-y-2">
                <SectionGrid title="Y-Balance Test">
                  <InputField label="Largo Miembro" value={measurements.balance.leg_length} onChange={v => updateMeasurement('balance', 'leg_length', v)} unit="CM" />
                  <div className="col-span-4 grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                      <InputField label="Der Anterior" value={measurements.balance.y_balance_ant_r} onChange={v => updateMeasurement('balance', 'y_balance_ant_r', v)} unit="CM" />
                      <InputField label="Der Post-Med" value={measurements.balance.y_balance_pm_r} onChange={v => updateMeasurement('balance', 'y_balance_pm_r', v)} unit="CM" />
                      <InputField label="Der Post-Lat" value={measurements.balance.y_balance_pl_r} onChange={v => updateMeasurement('balance', 'y_balance_pl_r', v)} unit="CM" />
                      <InputField label="Izq Anterior" value={measurements.balance.y_balance_ant_l} onChange={v => updateMeasurement('balance', 'y_balance_ant_l', v)} unit="CM" />
                      <InputField label="Izq Post-Med" value={measurements.balance.y_balance_pm_l} onChange={v => updateMeasurement('balance', 'y_balance_pm_l', v)} unit="CM" />
                      <InputField label="Izq Post-Lat" value={measurements.balance.y_balance_pl_l} onChange={v => updateMeasurement('balance', 'y_balance_pl_l', v)} unit="CM" />
                  </div>
                </SectionGrid>
                <SectionGrid title="Vestibular / Propiocepción">
                  <InputField label="Balance O.A. Der" value={measurements.balance.eyes_open_r} onChange={v => updateMeasurement('balance', 'eyes_open_r', v)} unit="SEG" />
                  <InputField label="Balance O.C. Der" value={measurements.balance.eyes_closed_r} onChange={v => updateMeasurement('balance', 'eyes_closed_r', v)} unit="SEG" />
                  <InputField label="Balance O.A. Izq" value={measurements.balance.eyes_open_l} onChange={v => updateMeasurement('balance', 'eyes_open_l', v)} unit="SEG" />
                  <InputField label="Balance O.C. Izq" value={measurements.balance.eyes_closed_l} onChange={v => updateMeasurement('balance', 'eyes_closed_l', v)} unit="SEG" />
                  <InputField label="Vestibular Side D" value={measurements.balance.vestibular_side_r} onChange={v => updateMeasurement('balance', 'vestibular_side_r', v)} unit="SEG" />
                  <InputField label="Vestibular Side I" value={measurements.balance.vestibular_side_l} onChange={v => updateMeasurement('balance', 'vestibular_side_l', v)} unit="SEG" />
                </SectionGrid>
              </div>
            )}

            {/* STRENGTH */}
            {activeTab === 'STRENGTH' && (
              <div className="space-y-2">
                <SectionGrid title="Fuerza Isométrica (KG)">
                  <InputField label="Cua. Der" value={measurements.strength.quads_r} onChange={v => updateMeasurement('strength', 'quads_r', v)} unit="KG" />
                  <InputField label="Cua. Izq" value={measurements.strength.quads_l} onChange={v => updateMeasurement('strength', 'quads_l', v)} unit="KG" />
                  <InputField label="Isquio. Der" value={measurements.strength.hams_r} onChange={v => updateMeasurement('strength', 'hams_r', v)} unit="KG" />
                  <InputField label="Isquio. Izq" value={measurements.strength.hams_l} onChange={v => updateMeasurement('strength', 'hams_l', v)} unit="KG" />
                  <InputField label="Adut. Der" value={measurements.strength.adductor_r} onChange={v => updateMeasurement('strength', 'adductor_r', v)} unit="KG" />
                  <InputField label="Adut. Izq" value={measurements.strength.adductor_l} onChange={v => updateMeasurement('strength', 'adductor_l', v)} unit="KG" />
                  <InputField label="Abdu. Der" value={measurements.strength.abductor_r} onChange={v => updateMeasurement('strength', 'abductor_r', v)} unit="KG" />
                  <InputField label="Abdu. Izq" value={measurements.strength.abductor_l} onChange={v => updateMeasurement('strength', 'abductor_l', v)} unit="KG" />
                </SectionGrid>
                <div className="h-4"></div>
                <SectionGrid title="VAS / Dolor Esfuerzo (1-10)" cols={1}>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                        <VASSelector label="VAS Cuádriceps Der" value={measurements.strength.quads_vas_r} onChange={v => updateMeasurement('strength', 'quads_vas_r', v)} />
                        <VASSelector label="VAS Cuádriceps Izq" value={measurements.strength.quads_vas_l} onChange={v => updateMeasurement('strength', 'quads_vas_l', v)} />
                        <VASSelector label="VAS Adut/Abdu Der" value={measurements.strength.adductor_vas_r} onChange={v => updateMeasurement('strength', 'adductor_vas_r', v)} />
                        <VASSelector label="VAS Adut/Abdu Izq" value={measurements.strength.adductor_vas_l} onChange={v => updateMeasurement('strength', 'adductor_vas_l', v)} />
                   </div>
                </SectionGrid>
              </div>
            )}

            {/* JUMPS_V */}
            {activeTab === 'JUMPS_V' && (
              <div className="space-y-2">
                <SectionGrid title="CMJ Bipodal (2 piezas)">
                  <InputField label="Altura Salto" value={measurements.jumps_vertical.cmj_2p_height} onChange={v => updateMeasurement('jumps_vertical', 'cmj_2p_height', v)} unit="CM" />
                  <InputField label="RSI" value={measurements.jumps_vertical.cmj_2p_rsi} onChange={v => updateMeasurement('jumps_vertical', 'cmj_2p_rsi', v)} />
                </SectionGrid>
                <SectionGrid title="CMJ Unipodal">
                  <InputField label="Altura Der" value={measurements.jumps_vertical.cmj_1p_height_r} onChange={v => updateMeasurement('jumps_vertical', 'cmj_1p_height_r', v)} unit="CM" />
                  <InputField label="Altura Izq" value={measurements.jumps_vertical.cmj_1p_height_l} onChange={v => updateMeasurement('jumps_vertical', 'cmj_1p_height_l', v)} unit="CM" />
                  <InputField label="RSI Der" value={measurements.jumps_vertical.cmj_1p_rsi_r} onChange={v => updateMeasurement('jumps_vertical', 'cmj_1p_rsi_r', v)} />
                  <InputField label="RSI Izq" value={measurements.jumps_vertical.cmj_1p_rsi_l} onChange={v => updateMeasurement('jumps_vertical', 'cmj_1p_rsi_l', v)} />
                </SectionGrid>
                <SectionGrid title="Drop Jump">
                  <InputField label="Altura DJ 2p" value={measurements.jumps_vertical.dj_2p_height} onChange={v => updateMeasurement('jumps_vertical', 'dj_2p_height', v)} unit="CM" />
                  <InputField label="RSI DJ 2p" value={measurements.jumps_vertical.dj_2p_rsi} onChange={v => updateMeasurement('jumps_vertical', 'dj_2p_rsi', v)} />
                </SectionGrid>
              </div>
            )}

            {/* VBT */}
            {activeTab === 'VBT' && (
              <div className="space-y-4">
                <SectionGrid title="VBT Sentadilla">
                  <InputField label="Derecha" value={measurements.vbt.squat_r} onChange={v => updateMeasurement('vbt', 'squat_r', v)} unit="M/S" />
                  <InputField label="Izquierda" value={measurements.vbt.squat_l} onChange={v => updateMeasurement('vbt', 'squat_l', v)} unit="M/S" />
                  <InputField label="Peso Utilizado" value={measurements.vbt.squat_weight} onChange={v => updateMeasurement('vbt', 'squat_weight', v)} unit="KG" />
                </SectionGrid>
                <SectionGrid title="VBT Peso Muerto">
                  <InputField label="Derecha" value={measurements.vbt.deadlift_r} onChange={v => updateMeasurement('vbt', 'deadlift_r', v)} unit="M/S" />
                  <InputField label="Izquierda" value={measurements.vbt.deadlift_l} onChange={v => updateMeasurement('vbt', 'deadlift_l', v)} unit="M/S" />
                  <InputField label="Peso Utilizado" value={measurements.vbt.deadlift_weight} onChange={v => updateMeasurement('vbt', 'deadlift_weight', v)} unit="KG" />
                </SectionGrid>
                <SectionGrid title="VBT Puente Glúteo">
                  <InputField label="Derecha" value={measurements.vbt.glute_bridge_r} onChange={v => updateMeasurement('vbt', 'glute_bridge_r', v)} unit="M/S" />
                  <InputField label="Izquierda" value={measurements.vbt.glute_bridge_l} onChange={v => updateMeasurement('vbt', 'glute_bridge_l', v)} unit="M/S" />
                  <InputField label="Peso Utilizado" value={measurements.vbt.glute_bridge_weight} onChange={v => updateMeasurement('vbt', 'glute_bridge_weight', v)} unit="KG" />
                </SectionGrid>
              </div>
            )}

            {/* JUMPS_H */}
            {activeTab === 'JUMPS_H' && (
              <div className="space-y-4">
                <SectionGrid title="Single Hop Test">
                  <InputField label="Distancia Der" value={measurements.jumps_horizontal.single_hop_r} onChange={v => updateMeasurement('jumps_horizontal', 'single_hop_r', v)} unit="CM" />
                  <InputField label="Distancia Izq" value={measurements.jumps_horizontal.single_hop_l} onChange={v => updateMeasurement('jumps_horizontal', 'single_hop_l', v)} unit="CM" />
                </SectionGrid>
                <SectionGrid title="Triple Hop Test">
                  <InputField label="Dist. Der" value={measurements.jumps_horizontal.triple_hop_dist_r} onChange={v => updateMeasurement('jumps_horizontal', 'triple_hop_dist_r', v)} unit="CM" />
                  <InputField label="Dist. Izq" value={measurements.jumps_horizontal.triple_hop_dist_l} onChange={v => updateMeasurement('jumps_horizontal', 'triple_hop_dist_l', v)} unit="CM" />
                  <InputField label="T. Contacto Der" value={measurements.jumps_horizontal.triple_hop_tc_r} onChange={v => updateMeasurement('jumps_horizontal', 'triple_hop_tc_r', v)} unit="MS" />
                  <InputField label="T. Contacto Izq" value={measurements.jumps_horizontal.triple_hop_tc_l} onChange={v => updateMeasurement('jumps_horizontal', 'triple_hop_tc_l', v)} unit="MS" />
                </SectionGrid>
                <SectionGrid title="Crossover Hop Test">
                  <InputField label="Dist. Der" value={measurements.jumps_horizontal.crossover_hop_dist_r} onChange={v => updateMeasurement('jumps_horizontal', 'crossover_hop_dist_r', v)} unit="CM" />
                  <InputField label="Dist. Izq" value={measurements.jumps_horizontal.crossover_hop_dist_l} onChange={v => updateMeasurement('jumps_horizontal', 'crossover_hop_dist_l', v)} unit="CM" />
                </SectionGrid>
                <SectionGrid title="Otros Tests">
                  <InputField label="Medial Side Der" value={measurements.jumps_horizontal.medial_side_r} onChange={v => updateMeasurement('jumps_horizontal', 'medial_side_r', v)} unit="CM" />
                  <InputField label="Medial Side Izq" value={measurements.jumps_horizontal.medial_side_l} onChange={v => updateMeasurement('jumps_horizontal', 'medial_side_l', v)} unit="CM" />
                  <InputField label="90 Medial Rot Der" value={measurements.jumps_horizontal.medial_rot_90_r} onChange={v => updateMeasurement('jumps_horizontal', 'medial_rot_90_r', v)} unit="CM" />
                  <InputField label="90 Medial Rot Izq" value={measurements.jumps_horizontal.medial_rot_90_l} onChange={v => updateMeasurement('jumps_horizontal', 'medial_rot_90_l', v)} unit="CM" />
                </SectionGrid>
              </div>
            )}

            {/* CONTROL */}
            {activeTab === 'CONTROL' && (
              <div className="space-y-4">
                <SectionGrid title="Sentadilla Bipodal & Bisagra">
                   <InputField label="Sentadilla Bip Der" value={measurements.motor_control.squat_bip_r} onChange={v => updateMeasurement('motor_control', 'squat_bip_r', v)} type="select" options={['', 'normal', 'déficit']} />
                   <InputField label="Sentadilla Bip Izq" value={measurements.motor_control.squat_bip_l} onChange={v => updateMeasurement('motor_control', 'squat_bip_l', v)} type="select" options={['', 'normal', 'déficit']} />
                   <InputField label="Bisagra Cadera Der" value={measurements.motor_control.hip_hinge_r} onChange={v => updateMeasurement('motor_control', 'hip_hinge_r', v)} type="select" options={['', 'normal', 'déficit']} />
                   <InputField label="Bisagra Cadera Izq" value={measurements.motor_control.hip_hinge_l} onChange={v => updateMeasurement('motor_control', 'hip_hinge_l', v)} type="select" options={['', 'normal', 'déficit']} />
                </SectionGrid>
                <SectionGrid title="Sentadilla 1 Pierna (Frontal Der)">
                  <InputField label="Tronco" value={measurements.motor_control.squat_1p_front_trunk_r} onChange={v => updateMeasurement('motor_control', 'squat_1p_front_trunk_r', v)} type="select" options={['', 'normal', 'déficit']} />
                  <InputField label="Pelvis" value={measurements.motor_control.squat_1p_front_pelvis_r} onChange={v => updateMeasurement('motor_control', 'squat_1p_front_pelvis_r', v)} type="select" options={['', 'normal', 'déficit']} />
                  <InputField label="Cadera" value={measurements.motor_control.squat_1p_front_hip_r} onChange={v => updateMeasurement('motor_control', 'squat_1p_front_hip_r', v)} type="select" options={['', 'normal', 'déficit']} />
                  <InputField label="Rodilla" value={measurements.motor_control.squat_1p_front_knee_r} onChange={v => updateMeasurement('motor_control', 'squat_1p_front_knee_r', v)} type="select" options={['', 'normal', 'déficit']} />
                </SectionGrid>
                <SectionGrid title="Sentadilla 1 Pierna (Frontal Izq)">
                  <InputField label="Tronco" value={measurements.motor_control.squat_1p_front_trunk_l} onChange={v => updateMeasurement('motor_control', 'squat_1p_front_trunk_l', v)} type="select" options={['', 'normal', 'déficit']} />
                  <InputField label="Pelvis" value={measurements.motor_control.squat_1p_front_pelvis_l} onChange={v => updateMeasurement('motor_control', 'squat_1p_front_pelvis_l', v)} type="select" options={['', 'normal', 'déficit']} />
                  <InputField label="Cadera" value={measurements.motor_control.squat_1p_front_hip_l} onChange={v => updateMeasurement('motor_control', 'squat_1p_front_hip_l', v)} type="select" options={['', 'normal', 'déficit']} />
                  <InputField label="Rodilla" value={measurements.motor_control.squat_1p_front_knee_l} onChange={v => updateMeasurement('motor_control', 'squat_1p_front_knee_l', v)} type="select" options={['', 'normal', 'déficit']} />
                </SectionGrid>
                <SectionGrid title="FMS & Sagital">
                  <InputField label="Sagital Der" value={measurements.motor_control.squat_1p_sag_r} onChange={v => updateMeasurement('motor_control', 'squat_1p_sag_r', v)} type="select" options={['', 'normal', 'déficit']} />
                  <InputField label="Sagital Izq" value={measurements.motor_control.squat_1p_sag_l} onChange={v => updateMeasurement('motor_control', 'squat_1p_sag_l', v)} type="select" options={['', 'normal', 'déficit']} />
                  <InputField label="Estocada FMS Der" value={measurements.motor_control.lunge_fms_r} onChange={v => updateMeasurement('motor_control', 'lunge_fms_r', v)} type="select" options={['', 'normal', 'déficit']} />
                  <InputField label="Estocada FMS Izq" value={measurements.motor_control.lunge_fms_l} onChange={v => updateMeasurement('motor_control', 'lunge_fms_l', v)} type="select" options={['', 'normal', 'déficit']} />
                  <InputField label="Valla FMS Der" value={measurements.motor_control.hurdle_fms_r} onChange={v => updateMeasurement('motor_control', 'hurdle_fms_r', v)} type="select" options={['', 'normal', 'déficit']} />
                  <InputField label="Valla FMS Izq" value={measurements.motor_control.hurdle_fms_l} onChange={v => updateMeasurement('motor_control', 'hurdle_fms_l', v)} type="select" options={['', 'normal', 'déficit']} />
                </SectionGrid>
              </div>
            )}

            {/* MCGILL */}
            {activeTab === 'MCGILL' && (
              <div className="space-y-4">
                <SectionGrid title="Test de McGill (Segundos)">
                  <InputField label="Lateral Der" value={measurements.mcgill.side_r} onChange={v => updateMeasurement('mcgill', 'side_r', v)} unit="SEG" />
                  <InputField label="Lateral Izq" value={measurements.mcgill.side_l} onChange={v => updateMeasurement('mcgill', 'side_l', v)} unit="SEG" />
                  <InputField label="Flexores (Sorensen)" value={measurements.mcgill.flexors} onChange={v => updateMeasurement('mcgill', 'flexors', v)} unit="SEG" />
                  <InputField label="Extensores" value={measurements.mcgill.extensors} onChange={v => updateMeasurement('mcgill', 'extensors', v)} unit="SEG" />
                </SectionGrid>
              </div>
            )}

            {/* FUNCTIONAL */}
            {activeTab === 'FUNCTIONAL' && (
              <div className="space-y-4">
                <SectionGrid title="Agilidad & Cambios de Dirección">
                   <InputField label="Prueba de Frenado" value={measurements.functional.braking} onChange={v => updateMeasurement('functional', 'braking', v)} unit="SEG" />
                   <InputField label="T Test" value={measurements.functional.t_test} onChange={v => updateMeasurement('functional', 't_test', v)} unit="SEG" />
                   <InputField label="Edgren Side Step" value={measurements.functional.edgren} onChange={v => updateMeasurement('functional', 'edgren', v)} unit="REPS" />
                </SectionGrid>
                <SectionGrid title="CMAS (Escala de C. de Dirección)">
                   <InputField label="CMAS 45º Der" value={measurements.functional.cmas_45_r} onChange={v => updateMeasurement('functional', 'cmas_45_r', v)} type="text" />
                   <InputField label="CMAS 45º Izq" value={measurements.functional.cmas_45_l} onChange={v => updateMeasurement('functional', 'cmas_45_l', v)} type="text" />
                   <InputField label="CMAS 90º Der" value={measurements.functional.cmas_90_r} onChange={v => updateMeasurement('functional', 'cmas_90_r', v)} type="text" />
                   <InputField label="CMAS 90º Izq" value={measurements.functional.cmas_90_l} onChange={v => updateMeasurement('functional', 'cmas_90_l', v)} type="text" />
                </SectionGrid>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-6 border-t border-slate-50 flex items-center justify-between bg-slate-50/30 shrink-0">
          <button onClick={onCancel} className="px-6 py-3 rounded-2xl font-black text-slate-400 hover:text-slate-600 transition-all text-xs uppercase tracking-widest">
            Cancelar
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="px-10 py-3 rounded-2xl font-black text-white bg-primary-600 hover:bg-primary-700 shadow-xl shadow-primary-200 transition-all flex items-center gap-2 hover:scale-[1.02] disabled:opacity-50 text-xs uppercase tracking-widest"
          >
            {isSubmitting ? <Activity size={18} className="animate-spin" /> : <Save size={18} />}
            {isSubmitting ? 'Guardando...' : 'Finalizar y Publicar'}
          </button>
        </div>
      </div>
    </div>
  );
};
