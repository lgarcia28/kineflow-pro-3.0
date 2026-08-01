import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, Save, Trash2, ChevronRight, ChevronLeft, 
  Activity, Ruler, Zap, Shield, User, Info, CheckCircle2, AlertTriangle, ChevronDown, Download, X,
  Target, Footprints, MoveVertical, MoveHorizontal, ListChecks, Heart, Thermometer, Brain, Wind
} from 'lucide-react';
import { ClinicalEvaluation, Patient, UserRole } from '../types';
import { processEvaluation } from '../services/evaluationLogic';
import { evaluationService } from '../services/evaluationService';
import { EVALUATION_PROTOCOLS } from '../constants';


// --- Sub-components outside to fix focus issues ---

const SectionGrid = ({ title, children, cols = 4 }: { title: string, children: React.ReactNode, cols?: number }) => {
  const colsClass = cols === 1 ? 'lg:grid-cols-1' : cols === 2 ? 'lg:grid-cols-2' : cols === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4';
  return (
    <div className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-[11px] font-black text-primary-600 uppercase tracking-[0.2em] whitespace-nowrap">{title}</h3>
        <div className="h-px w-full bg-slate-100"></div>
      </div>
      <div className={`grid grid-cols-1 md:grid-cols-2 ${colsClass} gap-4`}>
        {children}
      </div>
    </div>
  );
};

const VASSelector = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => {
  const getColorClasses = (val: number) => {
    if (!val) return 'bg-white border-slate-100 text-slate-800';
    if (val <= 3) return 'bg-green-100 border-green-300 text-green-800';
    if (val <= 6) return 'bg-orange-100 border-orange-300 text-orange-800';
    return 'bg-red-100 border-red-300 text-red-800';
  };

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-normal block" title={label}>{label}</label>
      <div className="relative">
        <select 
          value={value || ''}
          onChange={e => onChange(parseInt(e.target.value))}
          className={`w-full border-2 rounded-xl p-3 font-bold text-sm focus:border-primary-500 focus:ring-0 transition-all shadow-sm appearance-none ${getColorClasses(value)}`}
        >
          <option value="" disabled className="bg-white text-slate-800">Seleccionar (1-10)...</option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
            <option key={num} value={num} className="bg-white text-slate-800">{num}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
          <ChevronDown size={14} />
        </div>
      </div>
    </div>
  );
};


const InputField = ({ label, value, onChange, type = 'number', options, unit, step, tooltip }: { 
  label: string, value: any, onChange: (v: any) => void, type?: 'number' | 'text' | 'select' | 'date', options?: string[], unit?: string, step?: string, tooltip?: string 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 min-h-[16px]">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-normal block truncate" title={label}>{label}</label>
        {tooltip && (
          <div className="relative inline-flex items-center shrink-0">
            <button
              type="button"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
              className="text-slate-400 hover:text-primary-500 focus:outline-none transition-colors p-0.5"
              title="Ver protocolo clínico"
            >
              <Info size={11} strokeWidth={2.5} />
            </button>
            {showTooltip && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900/95 backdrop-blur text-white text-[10px] leading-relaxed font-bold rounded-xl shadow-xl border border-slate-800 p-3 z-[110] animate-in fade-in slide-in-from-bottom-1 pointer-events-none">
                <div className="text-primary-400 font-extrabold uppercase text-[8px] tracking-widest mb-1">Protocolo Clínico:</div>
                <div className="whitespace-pre-line text-slate-100 font-medium">{tooltip}</div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900/95"></div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="relative">
        {type === 'select' ? (
          <div className="relative">
            <select 
              value={value ?? (options ? options[0] : '')}
              onChange={e => onChange(e.target.value)}
              className="w-full bg-white border-2 border-slate-100 rounded-xl p-3 pr-10 font-bold text-slate-800 text-sm focus:border-primary-500 focus:ring-0 transition-all shadow-sm appearance-none"
            >
              {options?.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
              <ChevronDown size={14} />
            </div>
          </div>
        ) : (
          <>
            <input 
              type={type}
              inputMode={type === 'number' ? 'decimal' : undefined}
              step={step || (type === 'number' ? 'any' : undefined)}
              value={value ?? ''}
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

const ImageUploadField = ({ label, imageUrl, onUpload, onClear }: { 
  label: string, imageUrl: string | null, onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void, onClear: () => void 
}) => {
  return (
    <div className="space-y-2">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-normal block">{label}</span>
      <div className="flex gap-4 items-center">
        {!imageUrl ? (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary-200 hover:border-primary-400 rounded-2xl cursor-pointer bg-slate-50 hover:bg-primary-50/30 transition-all group p-4">
            <div className="flex flex-col items-center justify-center gap-1 text-center">
              <svg className="w-6 h-6 text-primary-400 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest">Subir foto</span>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
          </label>
        ) : (
          <div className="relative group w-full h-32 overflow-hidden rounded-2xl border-2 border-slate-100 shadow-sm">
            <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={onClear}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
            >
              <X size={14} />
            </button>
          </div>
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
  const [thomasRImageUrl, setThomasRImageUrl] = useState<string | null>(initialData?.measurements?.flexibility?.thomas_r_image_url || null);
  const [thomasLImageUrl, setThomasLImageUrl] = useState<string | null>(initialData?.measurements?.flexibility?.thomas_l_image_url || null);
  const [slsFrontalRImageUrl, setSlsFrontalRImageUrl] = useState<string | null>(initialData?.measurements?.motor_control?.sls_frontal_r_image_url || null);
  const [slsFrontalLImageUrl, setSlsFrontalLImageUrl] = useState<string | null>(initialData?.measurements?.motor_control?.sls_frontal_l_image_url || null);
  const [slsSagitalImageUrl, setSlsSagitalImageUrl] = useState<string | null>(initialData?.measurements?.motor_control?.sls_sagital_image_url || null);
  const [squatBipodalImageUrl, setSquatBipodalImageUrl] = useState<string | null>(initialData?.measurements?.motor_control?.squat_bipodal_image_url || null);
  const [measurements, setMeasurements] = useState<any>(() => {
    const defaultState: any = {
      basic: { 
        date: new Date().toISOString().split('T')[0], 
        dominantLeg: 'derecha', 
        injuredLeg: 'ninguna',
        pain_during_eval: 'No'
      },
      mobility: {},
      flexibility: {
        thomas_test_psoas_r: 'No evaluado',
        thomas_test_rectus_r: 'No evaluado',
        thomas_test_sartorius_r: 'No evaluado',
        thomas_test_psoas_l: 'No evaluado',
        thomas_test_rectus_l: 'No evaluado',
        thomas_test_sartorius_l: 'No evaluado',
        askling_h_r: 'No evaluado',
        askling_h_l: 'No evaluado',
        slump_test_r: 'No evaluado',
        slump_test_l: 'No evaluado',
      },
      palpation: {
        hip_impingement_r: 'No evaluado',
        hip_impingement_l: 'No evaluado',
        hip_labrum_r: 'No evaluado',
        hip_labrum_l: 'No evaluado',
        sacroiliac_r: 'No evaluado',
        sacroiliac_l: 'No evaluado',
      },
      balance: {
        vestibular_side_r: 'No evaluado',
        vestibular_up_r: 'No evaluado',
        vestibular_side_l: 'No evaluado',
        vestibular_up_l: 'No evaluado',
      },
      mcgill: {},
      functional: {
        braking_test: 'No evaluado',
      },
      strength: {},
      vbt: {},
      jumps_vertical: {},
      jumps_horizontal: {},
      motor_control: {
        sls_frontal_trunk_r: 'No evaluado',
        sls_frontal_pelvis_r: 'No evaluado',
        sls_frontal_hip_r: 'No evaluado',
        sls_frontal_knee_r: 'No evaluado',
        sls_frontal_trunk_l: 'No evaluado',
        sls_frontal_pelvis_l: 'No evaluado',
        sls_frontal_hip_l: 'No evaluado',
        sls_frontal_knee_l: 'No evaluado',
      }
    };

    if (initialData?.measurements) {
      const merged: any = { ...defaultState };
      for (const section of Object.keys(initialData.measurements)) {
        merged[section] = {
          ...((defaultState as any)[section] || {}),
          ...initialData.measurements[section]
        };
      }
      return merged;
    }
    return defaultState;
  });

  const handleImageUpload = (section: string, field: string, setLocalState: (val: string | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setLocalState(dataUrl);
        updateMeasurement(section, field, dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

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

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center sm:p-4" style={{ zIndex: 99999 }}>
      <div className="bg-white w-full h-full sm:h-[95vh] sm:max-w-[95vw] lg:max-w-7xl sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 sm:px-10 sm:py-6 border-b border-slate-50 flex items-center justify-between bg-primary-600 text-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl">
              <Activity size={24} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Evaluación Kinésica Deportiva</h2>
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
          <div className="w-full md:w-64 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-100 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto shrink-0 p-3 sm:p-4 gap-2 no-scrollbar scroll-smooth">
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id as TabType)}
                  className={`flex items-center gap-2 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-3.5 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black transition-all whitespace-nowrap md:whitespace-normal shrink-0 ${
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
          <div className="flex-1 overflow-y-auto p-5 sm:p-8 md:p-12 bg-white no-scrollbar">
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
                  <InputField label="Médico Derivante" value={measurements.basic.referring_doctor} onChange={v => updateMeasurement('basic', 'referring_doctor', v)} type="text" />
                </SectionGrid>
                <SectionGrid title="Dolor & Entrenamiento" cols={2}>
                    <InputField label="Dolor durante evaluación" value={measurements.basic.pain_during_eval} onChange={v => updateMeasurement('basic', 'pain_during_eval', v)} type="select" options={['No', 'Sí']} />
                    <InputField label="Entrenamiento previo a sesión" value={measurements.basic.pre_session_training} onChange={v => updateMeasurement('basic', 'pre_session_training', v)} type="text" />
                </SectionGrid>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comentarios Lesión</label>
                        <textarea className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-sm focus:border-primary-500 min-h-[100px]" value={measurements.basic.injury_comments || ''} onChange={e => updateMeasurement('basic', 'injury_comments', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Antecedentes Generales</label>
                        <textarea className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-sm focus:border-primary-500 min-h-[100px]" value={measurements.basic.medical_history || ''} onChange={e => updateMeasurement('basic', 'medical_history', e.target.value)} />
                    </div>
                </div>
              </div>
            )}

            {/* MOBILITY */}
            {activeTab === 'MOBILITY' && (
              <div className="space-y-2">
                <SectionGrid title="Cadera (ROM 90º)">
                  <InputField label="Rotación interna de cadera 90º Derecha" value={measurements.mobility.hip_ir_90_r} onChange={v => updateMeasurement('mobility', 'hip_ir_90_r', v)} unit="º" tooltip={EVALUATION_PROTOCOLS.hip_ir_90?.description} />
                  <InputField label="Rotación interna de cadera 90º Izquierda" value={measurements.mobility.hip_ir_90_l} onChange={v => updateMeasurement('mobility', 'hip_ir_90_l', v)} unit="º" tooltip={EVALUATION_PROTOCOLS.hip_ir_90?.description} />
                  <InputField label="Rotación externa de cadera 90º Derecha" value={measurements.mobility.hip_er_90_r} onChange={v => updateMeasurement('mobility', 'hip_er_90_r', v)} unit="º" tooltip={EVALUATION_PROTOCOLS.hip_er_90?.description} />
                  <InputField label="Rotación externa de cadera 90º Izquierda" value={measurements.mobility.hip_er_90_l} onChange={v => updateMeasurement('mobility', 'hip_er_90_l', v)} unit="º" tooltip={EVALUATION_PROTOCOLS.hip_er_90?.description} />
                </SectionGrid>
                <SectionGrid title="Rodilla (Ext/Flex)">
                  <InputField label="Extensión pasiva de rodilla Derecha" value={measurements.mobility.knee_ext_pass_r} onChange={v => updateMeasurement('mobility', 'knee_ext_pass_r', v)} unit="º" tooltip={EVALUATION_PROTOCOLS.knee_ext_pass?.description} />
                  <InputField label="Extensión pasiva de rodilla Izquierda" value={measurements.mobility.knee_ext_pass_l} onChange={v => updateMeasurement('mobility', 'knee_ext_pass_l', v)} unit="º" tooltip={EVALUATION_PROTOCOLS.knee_ext_pass?.description} />
                  <InputField label="Flexión activa de rodilla Derecha" value={measurements.mobility.knee_flex_act_r} onChange={v => updateMeasurement('mobility', 'knee_flex_act_r', v)} unit="º" tooltip={EVALUATION_PROTOCOLS.knee_flex_act?.description} />
                  <InputField label="Flexión activa de rodilla Izquierda" value={measurements.mobility.knee_flex_act_l} onChange={v => updateMeasurement('mobility', 'knee_flex_act_l', v)} unit="º" tooltip={EVALUATION_PROTOCOLS.knee_flex_act?.description} />
                  <InputField label="Flexión pasiva de rodilla Derecha" value={measurements.mobility.knee_flex_pass_r} onChange={v => updateMeasurement('mobility', 'knee_flex_pass_r', v)} unit="º" tooltip={EVALUATION_PROTOCOLS.knee_flex_pass?.description} />
                  <InputField label="Flexión pasiva de rodilla Izquierda" value={measurements.mobility.knee_flex_pass_l} onChange={v => updateMeasurement('mobility', 'knee_flex_pass_l', v)} unit="º" tooltip={EVALUATION_PROTOCOLS.knee_flex_pass?.description} />
                </SectionGrid>
                <SectionGrid title="Tobillo & Hombro">
                  <InputField label="Flexión dorsal de tobillo Derecha" value={measurements.mobility.ankle_dorsiflex_r} onChange={v => updateMeasurement('mobility', 'ankle_dorsiflex_r', v)} unit="º" tooltip={EVALUATION_PROTOCOLS.ankle_dorsiflex?.description} />
                  <InputField label="Flexión dorsal de tobillo Izquierda" value={measurements.mobility.ankle_dorsiflex_l} onChange={v => updateMeasurement('mobility', 'ankle_dorsiflex_l', v)} unit="º" tooltip={EVALUATION_PROTOCOLS.ankle_dorsiflex?.description} />
                  <InputField label="Rotación interna de hombro Derecho" value={measurements.mobility.shoulder_ir_r} onChange={v => updateMeasurement('mobility', 'shoulder_ir_r', v)} unit="º" tooltip={EVALUATION_PROTOCOLS.shoulder_ir?.description} />
                  <InputField label="Rotación interna de hombro Izquierdo" value={measurements.mobility.shoulder_ir_l} onChange={v => updateMeasurement('mobility', 'shoulder_ir_l', v)} unit="º" tooltip={EVALUATION_PROTOCOLS.shoulder_ir?.description} />
                  <InputField label="Rotación externa de hombro Derecho" value={measurements.mobility.shoulder_er_r} onChange={v => updateMeasurement('mobility', 'shoulder_er_r', v)} unit="º" tooltip={EVALUATION_PROTOCOLS.shoulder_er?.description} />
                  <InputField label="Rotación externa de hombro Izquierdo" value={measurements.mobility.shoulder_er_l} onChange={v => updateMeasurement('mobility', 'shoulder_er_l', v)} unit="º" tooltip={EVALUATION_PROTOCOLS.shoulder_er?.description} />
                </SectionGrid>
                <SectionGrid title="Perímetros Musculares">
                  <InputField label="Perímetro de muslo Derecho" value={measurements.perimetry?.thigh_r} onChange={v => updateMeasurement('perimetry', 'thigh_r', v)} unit="CM" tooltip={EVALUATION_PROTOCOLS.thigh?.description} />
                  <InputField label="Perímetro de muslo Izquierdo" value={measurements.perimetry?.thigh_l} onChange={v => updateMeasurement('perimetry', 'thigh_l', v)} unit="CM" tooltip={EVALUATION_PROTOCOLS.thigh?.description} />
                  <InputField label="Perímetro de pantorrilla Derecho" value={measurements.perimetry?.calf_r} onChange={v => updateMeasurement('perimetry', 'calf_r', v)} unit="CM" tooltip={EVALUATION_PROTOCOLS.calf?.description} />
                  <InputField label="Perímetro de pantorrilla Izquierdo" value={measurements.perimetry?.calf_l} onChange={v => updateMeasurement('perimetry', 'calf_l', v)} unit="CM" tooltip={EVALUATION_PROTOCOLS.calf?.description} />
                </SectionGrid>
              </div>
            )}

            {/* FLEXIBILITY */}
            {activeTab === 'FLEXIBILITY' && (
              <div className="space-y-2">
                <SectionGrid title="Thomas derecha">
                  <InputField label="Psoas Iíaco" value={measurements.flexibility.thomas_test_psoas_r} onChange={v => updateMeasurement('flexibility', 'thomas_test_psoas_r', v)} type="select" options={['No evaluado', 'OK', 'X']} />
                  <InputField label="Recto Anterior" value={measurements.flexibility.thomas_test_rectus_r} onChange={v => updateMeasurement('flexibility', 'thomas_test_rectus_r', v)} type="select" options={['No evaluado', 'OK', 'X']} />
                  <InputField label="Sartorio" value={measurements.flexibility.thomas_test_sartorius_r} onChange={v => updateMeasurement('flexibility', 'thomas_test_sartorius_r', v)} type="select" options={['No evaluado', 'OK', 'X']} />
                </SectionGrid>
                <SectionGrid title="Thomas izquierda">
                  <InputField label="Psoas Iíaco" value={measurements.flexibility.thomas_test_psoas_l} onChange={v => updateMeasurement('flexibility', 'thomas_test_psoas_l', v)} type="select" options={['No evaluado', 'OK', 'X']} />
                  <InputField label="Recto Anterior" value={measurements.flexibility.thomas_test_rectus_l} onChange={v => updateMeasurement('flexibility', 'thomas_test_rectus_l', v)} type="select" options={['No evaluado', 'OK', 'X']} />
                  <InputField label="Sartorio" value={measurements.flexibility.thomas_test_sartorius_l} onChange={v => updateMeasurement('flexibility', 'thomas_test_sartorius_l', v)} type="select" options={['No evaluado', 'OK', 'X']} />
                </SectionGrid>

                {/* Thomas Test Image Upload */}
                <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-[11px] font-black text-primary-600 uppercase tracking-[0.2em] whitespace-nowrap">Fotos del Test de Thomas</h3>
                    <div className="h-px w-full bg-slate-100"></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <ImageUploadField
                      label="Imagen Thomas Derecha"
                      imageUrl={thomasRImageUrl}
                      onUpload={handleImageUpload('flexibility', 'thomas_r_image_url', setThomasRImageUrl)}
                      onClear={() => { setThomasRImageUrl(null); updateMeasurement('flexibility', 'thomas_r_image_url', null); }}
                    />
                    <ImageUploadField
                      label="Imagen Thomas Izquierda"
                      imageUrl={thomasLImageUrl}
                      onUpload={handleImageUpload('flexibility', 'thomas_l_image_url', setThomasLImageUrl)}
                      onClear={() => { setThomasLImageUrl(null); updateMeasurement('flexibility', 'thomas_l_image_url', null); }}
                    />
                  </div>
                </div>

                <SectionGrid title="Tests Neuro-Ortopédicos">
                  <InputField label="AKE Derecha" value={measurements.flexibility.hams_r} onChange={v => updateMeasurement('flexibility', 'hams_r', v)} unit="º" tooltip={EVALUATION_PROTOCOLS.hams?.description} />
                  <InputField label="AKE Izquierda" value={measurements.flexibility.hams_l} onChange={v => updateMeasurement('flexibility', 'hams_l', v)} unit="º" tooltip={EVALUATION_PROTOCOLS.hams?.description} />
                  <InputField label="Askling test Derecha" value={measurements.flexibility.askling_h_r} onChange={v => updateMeasurement('flexibility', 'askling_h_r', v)} type="select" options={['No evaluado', 'OK', 'X']} tooltip={EVALUATION_PROTOCOLS.askling_h?.description} />
                  <InputField label="Askling test Izquierda" value={measurements.flexibility.askling_h_l} onChange={v => updateMeasurement('flexibility', 'askling_h_l', v)} type="select" options={['No evaluado', 'OK', 'X']} tooltip={EVALUATION_PROTOCOLS.askling_h?.description} />
                  <InputField label="Slump test Derecha" value={measurements.flexibility.slump_test_r} onChange={v => updateMeasurement('flexibility', 'slump_test_r', v)} type="select" options={['No evaluado', 'OK', 'X']} tooltip={EVALUATION_PROTOCOLS.slump_test?.description} />
                  <InputField label="Slump test Izquierda" value={measurements.flexibility.slump_test_l} onChange={v => updateMeasurement('flexibility', 'slump_test_l', v)} type="select" options={['No evaluado', 'OK', 'X']} tooltip={EVALUATION_PROTOCOLS.slump_test?.description} />
                  <InputField label="BKFO test Derecha" value={measurements.flexibility.bkfo_r} onChange={v => updateMeasurement('flexibility', 'bkfo_r', v)} unit="CM" tooltip={EVALUATION_PROTOCOLS.bkfo?.description} />
                  <InputField label="BKFO test Izquierda" value={measurements.flexibility.bkfo_l} onChange={v => updateMeasurement('flexibility', 'bkfo_l', v)} unit="CM" tooltip={EVALUATION_PROTOCOLS.bkfo?.description} />
                </SectionGrid>
              </div>
            )}

            {/* PALPATION */}
            {activeTab === 'PALPATION' && (
              <div className="space-y-6">
                <SectionGrid title="Zonas de Tensión (1-10)" cols={1}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    <VASSelector label="Psoas derecha Palpación" value={measurements.palpation.psoas_r?.palpation} onChange={v => updateDeepMeasurement('palpation', 'psoas_r', 'palpation', v)} />
                    <VASSelector label="Psoas izquierda Palpación" value={measurements.palpation.psoas_l?.palpation} onChange={v => updateDeepMeasurement('palpation', 'psoas_l', 'palpation', v)} />
                    <VASSelector label="Aductor derecha Palpación" value={measurements.palpation.adductor_r?.palpation} onChange={v => updateDeepMeasurement('palpation', 'adductor_r', 'palpation', v)} />
                    <VASSelector label="Aductor izquierda Palpación" value={measurements.palpation.adductor_l?.palpation} onChange={v => updateDeepMeasurement('palpation', 'adductor_l', 'palpation', v)} />
                    <VASSelector label="Pubis derecha Palpación" value={measurements.palpation.pubis_r?.palpation} onChange={v => updateDeepMeasurement('palpation', 'pubis_r', 'palpation', v)} />
                    <VASSelector label="Pubis izquierda Palpación" value={measurements.palpation.pubis_l?.palpation} onChange={v => updateDeepMeasurement('palpation', 'pubis_l', 'palpation', v)} />
                  </div>
                </SectionGrid>
                <SectionGrid title="Hip / Spine Tests">
                  <InputField label="Cadera: impingement Derecha" value={measurements.palpation.hip_impingement_r} onChange={v => updateMeasurement('palpation', 'hip_impingement_r', v)} type="select" options={['No evaluado', 'negativo', 'positivo']} />
                  <InputField label="Cadera: impingement Izquierda" value={measurements.palpation.hip_impingement_l} onChange={v => updateMeasurement('palpation', 'hip_impingement_l', v)} type="select" options={['No evaluado', 'negativo', 'positivo']} />
                  <InputField label="Cadera: labrum anterior Derecha" value={measurements.palpation.hip_labrum_r} onChange={v => updateMeasurement('palpation', 'hip_labrum_r', v)} type="select" options={['No evaluado', 'negativo', 'positivo']} />
                  <InputField label="Cadera: labrum anterior Izquierda" value={measurements.palpation.hip_labrum_l} onChange={v => updateMeasurement('palpation', 'hip_labrum_l', v)} type="select" options={['No evaluado', 'negativo', 'positivo']} />
                  <InputField label="Sacroilíaca Derecha" value={measurements.palpation.sacroiliac_r} onChange={v => updateMeasurement('palpation', 'sacroiliac_r', v)} type="select" options={['No evaluado', 'negativo', 'positivo']} />
                  <InputField label="Sacroilíaca Izquierda" value={measurements.palpation.sacroiliac_l} onChange={v => updateMeasurement('palpation', 'sacroiliac_l', v)} type="select" options={['No evaluado', 'negativo', 'positivo']} />
                  <InputField label="Columna: flexión" value={measurements.palpation.spine_flexion} onChange={v => updateMeasurement('palpation', 'spine_flexion', v)} unit="CM" />
                  <InputField label="Columna: extensión" value={measurements.palpation.spine_extension} onChange={v => updateMeasurement('palpation', 'spine_extension', v)} unit="CM" />
                  <InputField label="Columna: inclinación derecha" value={measurements.palpation.spine_inc_r} onChange={v => updateMeasurement('palpation', 'spine_inc_r', v)} unit="º" />
                  <InputField label="Columna: inclinación izquierda" value={measurements.palpation.spine_inc_l} onChange={v => updateMeasurement('palpation', 'spine_inc_l', v)} unit="º" />
                </SectionGrid>
              </div>
            )}

            {/* BALANCE */}
            {activeTab === 'BALANCE' && (
              <div className="space-y-2">
                <SectionGrid title="Y-Balance Test">
                  <InputField label="Largo en cm del miembro inferior" value={measurements.balance.leg_length} onChange={v => updateMeasurement('balance', 'leg_length', v)} unit="CM" tooltip={EVALUATION_PROTOCOLS.y_balance?.description} />
                  <div className="col-span-1 md:col-span-2 lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                      <InputField label="Y Balance derecha Anterior" value={measurements.balance.y_balance_ant_r} onChange={v => updateMeasurement('balance', 'y_balance_ant_r', v)} unit="CM" tooltip={EVALUATION_PROTOCOLS.y_balance?.description} />
                      <InputField label="Y Balance derecha Posteromedial" value={measurements.balance.y_balance_pm_r} onChange={v => updateMeasurement('balance', 'y_balance_pm_r', v)} unit="CM" tooltip={EVALUATION_PROTOCOLS.y_balance?.description} />
                      <InputField label="Y Balance derecha Posterolateral" value={measurements.balance.y_balance_pl_r} onChange={v => updateMeasurement('balance', 'y_balance_pl_r', v)} unit="CM" tooltip={EVALUATION_PROTOCOLS.y_balance?.description} />
                      <InputField label="Y Balance izquierda Anterior" value={measurements.balance.y_balance_ant_l} onChange={v => updateMeasurement('balance', 'y_balance_ant_l', v)} unit="CM" tooltip={EVALUATION_PROTOCOLS.y_balance?.description} />
                      <InputField label="Y Balance izquierda Posteromedial" value={measurements.balance.y_balance_pm_l} onChange={v => updateMeasurement('balance', 'y_balance_pm_l', v)} unit="CM" tooltip={EVALUATION_PROTOCOLS.y_balance?.description} />
                      <InputField label="Y Balance izquierda Posterolateral" value={measurements.balance.y_balance_pl_l} onChange={v => updateMeasurement('balance', 'y_balance_pl_l', v)} unit="CM" tooltip={EVALUATION_PROTOCOLS.y_balance?.description} />
                  </div>
                </SectionGrid>
                <SectionGrid title="Vestibular / Propiocepción">
                  <InputField label="Prueba de balance: derecha Ojos abiertos" value={measurements.balance.eyes_open_r} onChange={v => updateMeasurement('balance', 'eyes_open_r', v)} unit="SEG" tooltip={EVALUATION_PROTOCOLS.eyes_open?.description} />
                  <InputField label="Prueba de balance: derecha Ojos cerrados" value={measurements.balance.eyes_closed_r} onChange={v => updateMeasurement('balance', 'eyes_closed_r', v)} unit="SEG" tooltip={EVALUATION_PROTOCOLS.eyes_open?.description} />
                  <InputField label="Prueba de balance: izquierda Ojos abiertos" value={measurements.balance.eyes_open_l} onChange={v => updateMeasurement('balance', 'eyes_open_l', v)} unit="SEG" tooltip={EVALUATION_PROTOCOLS.eyes_open?.description} />
                  <InputField label="Prueba de balance: izquierda Ojos cerrados" value={measurements.balance.eyes_closed_l} onChange={v => updateMeasurement('balance', 'eyes_closed_l', v)} unit="SEG" tooltip={EVALUATION_PROTOCOLS.eyes_open?.description} />
                  <InputField label="Prueba de balance vestibular: derecha Lado a lado" value={measurements.balance.vestibular_side_r} onChange={v => updateMeasurement('balance', 'vestibular_side_r', v)} type="select" options={['No evaluado', 'OK', 'X']} tooltip={EVALUATION_PROTOCOLS.eyes_open?.description} />
                  <InputField label="Prueba de balance vestibular: izquierda Lado a lado" value={measurements.balance.vestibular_side_l} onChange={v => updateMeasurement('balance', 'vestibular_side_l', v)} type="select" options={['No evaluado', 'OK', 'X']} tooltip={EVALUATION_PROTOCOLS.eyes_open?.description} />
                  <InputField label="Prueba de balance vestibular: derecha Arriba y abajo" value={measurements.balance.vestibular_up_r} onChange={v => updateMeasurement('balance', 'vestibular_up_r', v)} type="select" options={['No evaluado', 'OK', 'X']} tooltip={EVALUATION_PROTOCOLS.vestibular_updown?.description} />
                  <InputField label="Prueba de balance vestibular: izquierda Arriba y abajo" value={measurements.balance.vestibular_up_l} onChange={v => updateMeasurement('balance', 'vestibular_up_l', v)} type="select" options={['No evaluado', 'OK', 'X']} tooltip={EVALUATION_PROTOCOLS.vestibular_updown?.description} />
                </SectionGrid>
              </div>
            )}

            {/* STRENGTH */}
            {activeTab === 'STRENGTH' && (
              <div className="space-y-6">
                <SectionGrid title="Dinamometría Isométrica (N)">
                  <InputField label="Cuádriceps Derecha" value={measurements.strength.quads_r} onChange={v => updateMeasurement('strength', 'quads_r', v)} unit="N" tooltip={EVALUATION_PROTOCOLS.quads_strength?.description} />
                  <InputField label="Cuádriceps Izquierda" value={measurements.strength.quads_l} onChange={v => updateMeasurement('strength', 'quads_l', v)} unit="N" tooltip={EVALUATION_PROTOCOLS.quads_strength?.description} />
                  <InputField label="Isquiosurales Derecha" value={measurements.strength.hams_r} onChange={v => updateMeasurement('strength', 'hams_r', v)} unit="N" />
                  <InputField label="Isquiosurales Izquierda" value={measurements.strength.hams_l} onChange={v => updateMeasurement('strength', 'hams_l', v)} unit="N" />
                  <InputField label="Aductores Derecha" value={measurements.strength.adductor_r} onChange={v => updateMeasurement('strength', 'adductor_r', v)} unit="N" tooltip={EVALUATION_PROTOCOLS.adductors?.description} />
                  <InputField label="Aductores Izquierda" value={measurements.strength.adductor_l} onChange={v => updateMeasurement('strength', 'adductor_l', v)} unit="N" tooltip={EVALUATION_PROTOCOLS.adductors?.description} />
                  <InputField label="Abductores Derecha" value={measurements.strength.abductor_r} onChange={v => updateMeasurement('strength', 'abductor_r', v)} unit="N" tooltip={EVALUATION_PROTOCOLS.abductors?.description} />
                  <InputField label="Abductores Izquierda" value={measurements.strength.abductor_l} onChange={v => updateMeasurement('strength', 'abductor_l', v)} unit="N" tooltip={EVALUATION_PROTOCOLS.abductors?.description} />
                  <InputField label="Tríceps sural Derecha" value={measurements.strength.triceps_sural_r} onChange={v => updateMeasurement('strength', 'triceps_sural_r', v)} unit="N" />
                  <InputField label="Tríceps sural Izquierda" value={measurements.strength.triceps_sural_l} onChange={v => updateMeasurement('strength', 'triceps_sural_l', v)} unit="N" />
                </SectionGrid>

                <SectionGrid title="Flexores de Cadera & Squeeze Test">
                  <InputField label="Flexores cadera 0-0º Derecha" value={measurements.strength.hip_flex_0_r} onChange={v => updateMeasurement('strength', 'hip_flex_0_r', v)} unit="N" tooltip={EVALUATION_PROTOCOLS.hip_flex_0?.description} />
                  <InputField label="Flexores cadera 0-0º Izquierda" value={measurements.strength.hip_flex_0_l} onChange={v => updateMeasurement('strength', 'hip_flex_0_l', v)} unit="N" tooltip={EVALUATION_PROTOCOLS.hip_flex_0?.description} />
                  <InputField label="Flexores cadera 0-90º Derecha" value={measurements.strength.hip_flex_90_r} onChange={v => updateMeasurement('strength', 'hip_flex_90_r', v)} unit="N" tooltip={EVALUATION_PROTOCOLS.hip_flex_90?.description} />
                  <InputField label="Flexores cadera 0-90º Izquierda" value={measurements.strength.hip_flex_90_l} onChange={v => updateMeasurement('strength', 'hip_flex_90_l', v)} unit="N" tooltip={EVALUATION_PROTOCOLS.hip_flex_90?.description} />
                  <InputField label="Squezze Test" value={measurements.strength.squeeze_test} onChange={v => updateMeasurement('strength', 'squeeze_test', v)} unit="N" tooltip={EVALUATION_PROTOCOLS.squeeze_test?.description} />
                </SectionGrid>

                <SectionGrid title="Dinamometría de Tobillo">
                  <InputField label="Abductores tobillo Derecha" value={measurements.strength.tobillo_abd_r} onChange={v => updateMeasurement('strength', 'tobillo_abd_r', v)} unit="N" />
                  <InputField label="Abductores tobillo Izquierda" value={measurements.strength.tobillo_abd_l} onChange={v => updateMeasurement('strength', 'tobillo_abd_l', v)} unit="N" />
                  <InputField label="Aductores tobillo Derecha" value={measurements.strength.tobillo_add_r} onChange={v => updateMeasurement('strength', 'tobillo_add_r', v)} unit="N" />
                  <InputField label="Aductores tobillo Izquierda" value={measurements.strength.tobillo_add_l} onChange={v => updateMeasurement('strength', 'tobillo_add_l', v)} unit="N" />
                </SectionGrid>

                <SectionGrid title="Hombro & Ash Test (N)">
                  <InputField label="Rotación interna hombro Derecha" value={measurements.strength.shoulder_ri_r} onChange={v => updateMeasurement('strength', 'shoulder_ri_r', v)} unit="N" />
                  <InputField label="Rotación interna hombro Izquierda" value={measurements.strength.shoulder_ri_l} onChange={v => updateMeasurement('strength', 'shoulder_ri_l', v)} unit="N" />
                  <InputField label="Rotación externa hombro Derecha" value={measurements.strength.shoulder_re_r} onChange={v => updateMeasurement('strength', 'shoulder_re_r', v)} unit="N" />
                  <InputField label="Rotación externa hombro Izquierda" value={measurements.strength.shoulder_re_l} onChange={v => updateMeasurement('strength', 'shoulder_re_l', v)} unit="N" />
                  <InputField label="Ash I Derecha" value={measurements.strength.ash_i_r} onChange={v => updateMeasurement('strength', 'ash_i_r', v)} unit="N" />
                  <InputField label="Ash I Izquierda" value={measurements.strength.ash_i_l} onChange={v => updateMeasurement('strength', 'ash_i_l', v)} unit="N" />
                  <InputField label="Ash Y Derecha" value={measurements.strength.ash_y_r} onChange={v => updateMeasurement('strength', 'ash_y_r', v)} unit="N" />
                  <InputField label="Ash Y Izquierda" value={measurements.strength.ash_y_l} onChange={v => updateMeasurement('strength', 'ash_y_l', v)} unit="N" />
                  <InputField label="Ash T Derecha" value={measurements.strength.ash_t_r} onChange={v => updateMeasurement('strength', 'ash_t_r', v)} unit="N" />
                  <InputField label="Ash T Izquierda" value={measurements.strength.ash_t_l} onChange={v => updateMeasurement('strength', 'ash_t_l', v)} unit="N" />
                </SectionGrid>

                <SectionGrid title="Otros Tests de Fuerza">
                  <InputField label="IMTP Fuerza pico" value={measurements.strength.imtp_peak} onChange={v => updateMeasurement('strength', 'imtp_peak', v)} unit="N" />
                  <InputField label="IMTP Fuerza derecha" value={measurements.strength.imtp_r} onChange={v => updateMeasurement('strength', 'imtp_r', v)} unit="N" />
                  <InputField label="IMTP Fuerza izquierda" value={measurements.strength.imtp_l} onChange={v => updateMeasurement('strength', 'imtp_l', v)} unit="N" />
                  <InputField label="Handrip Derecha" value={measurements.strength.handgrip_r} onChange={v => updateMeasurement('strength', 'handgrip_r', v)} unit="N" />
                  <InputField label="Handrip Izquierda" value={measurements.strength.handgrip_l} onChange={v => updateMeasurement('strength', 'handgrip_l', v)} unit="N" />
                </SectionGrid>

                <SectionGrid title="Evolución de Fuerza (Comparativa E1 vs E2)">
                  <InputField label="Cuádriceps derecho Evaluación 1" value={measurements.strength.quads_r_eval1} onChange={v => updateMeasurement('strength', 'quads_r_eval1', v)} unit="N" />
                  <InputField label="Cuádriceps derecho Evaluación 2" value={measurements.strength.quads_r_eval2} onChange={v => updateMeasurement('strength', 'quads_r_eval2', v)} unit="N" />
                  <InputField label="Cuádriceps izquierdo Evaluación 1" value={measurements.strength.quads_l_eval1} onChange={v => updateMeasurement('strength', 'quads_l_eval1', v)} unit="N" />
                  <InputField label="Cuádriceps izquierdo Evaluación 2" value={measurements.strength.quads_l_eval2} onChange={v => updateMeasurement('strength', 'quads_l_eval2', v)} unit="N" />
                  <InputField label="Isquiotibiales derecho Evaluación 1" value={measurements.strength.hams_r_eval1} onChange={v => updateMeasurement('strength', 'hams_r_eval1', v)} unit="N" />
                  <InputField label="Isquiotibiales derecho Evaluación 2" value={measurements.strength.hams_r_eval2} onChange={v => updateMeasurement('strength', 'hams_r_eval2', v)} unit="N" />
                  <InputField label="Isquiotibiales izquierdo Evaluación 1" value={measurements.strength.hams_l_eval1} onChange={v => updateMeasurement('strength', 'hams_l_eval1', v)} unit="N" />
                  <InputField label="Isquiotibiales izquierdo Evaluación 2" value={measurements.strength.hams_l_eval2} onChange={v => updateMeasurement('strength', 'hams_l_eval2', v)} unit="N" />
                </SectionGrid>

                <SectionGrid title="Dolor VAS / Esfuerzo Dinamometría (1-10)" cols={1}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    <VASSelector label="VAS cuádriceps Derecha" value={measurements.strength.quads_vas_r} onChange={v => updateMeasurement('strength', 'quads_vas_r', v)} />
                    <VASSelector label="VAS cuádriceps Izquierda" value={measurements.strength.quads_vas_l} onChange={v => updateMeasurement('strength', 'quads_vas_l', v)} />
                    <VASSelector label="VAS isquiotibiales Derecha" value={measurements.strength.hams_vas_r} onChange={v => updateMeasurement('strength', 'hams_vas_r', v)} />
                    <VASSelector label="VAS isquiotibiales Izquierda" value={measurements.strength.hams_vas_l} onChange={v => updateMeasurement('strength', 'hams_vas_l', v)} />
                    <VASSelector label="VAS aductores Derecha" value={measurements.strength.adductor_vas_r} onChange={v => updateMeasurement('strength', 'adductor_vas_r', v)} />
                    <VASSelector label="VAS aductores Izquierda" value={measurements.strength.adductor_vas_l} onChange={v => updateMeasurement('strength', 'adductor_vas_l', v)} />
                    <VASSelector label="VAS abductores Derecha" value={measurements.strength.abductor_vas_r} onChange={v => updateMeasurement('strength', 'abductor_vas_r', v)} />
                    <VASSelector label="VAS abductores Izquierda" value={measurements.strength.abductor_vas_l} onChange={v => updateMeasurement('strength', 'abductor_vas_l', v)} />
                    <VASSelector label="VAS tríceps sural Derecha" value={measurements.strength.triceps_sural_vas_r} onChange={v => updateMeasurement('strength', 'triceps_sural_vas_r', v)} />
                    <VASSelector label="VAS tríceps sural Izquierda" value={measurements.strength.triceps_sural_vas_l} onChange={v => updateMeasurement('strength', 'triceps_sural_vas_l', v)} />
                    <VASSelector label="VAS flexores cadera 0-0º Derecha" value={measurements.strength.hip_flex_0_vas_r} onChange={v => updateMeasurement('strength', 'hip_flex_0_vas_r', v)} />
                    <VASSelector label="VAS flexores cadera 0-0º Izquierda" value={measurements.strength.hip_flex_0_vas_l} onChange={v => updateMeasurement('strength', 'hip_flex_0_vas_l', v)} />
                    <VASSelector label="VAS flexores cadera 0-90º Derecha" value={measurements.strength.hip_flex_90_vas_r} onChange={v => updateMeasurement('strength', 'hip_flex_90_vas_r', v)} />
                    <VASSelector label="VAS flexores cadera 0-90º Izquierda" value={measurements.strength.hip_flex_90_vas_l} onChange={v => updateMeasurement('strength', 'hip_flex_90_vas_l', v)} />
                    <VASSelector label="VAS Squezze" value={measurements.strength.squeeze_vas} onChange={v => updateMeasurement('strength', 'squeeze_vas', v)} />
                    <VASSelector label="VAS abductores tobillo Derecha" value={measurements.strength.tobillo_abd_vas_r} onChange={v => updateMeasurement('strength', 'tobillo_abd_vas_r', v)} />
                    <VASSelector label="VAS abductores tobillo Izquierda" value={measurements.strength.tobillo_abd_vas_l} onChange={v => updateMeasurement('strength', 'tobillo_abd_vas_l', v)} />
                    <VASSelector label="VAS aductores tobillo Derecha" value={measurements.strength.tobillo_add_vas_r} onChange={v => updateMeasurement('strength', 'tobillo_add_vas_r', v)} />
                    <VASSelector label="VAS aductores tobillo Izquierda" value={measurements.strength.tobillo_add_vas_l} onChange={v => updateMeasurement('strength', 'tobillo_add_vas_l', v)} />
                    <VASSelector label="VAS RI hombro Derecha" value={measurements.strength.shoulder_ri_vas_r} onChange={v => updateMeasurement('strength', 'shoulder_ri_vas_r', v)} />
                    <VASSelector label="VAS RI hombro Izquierda" value={measurements.strength.shoulder_ri_vas_l} onChange={v => updateMeasurement('strength', 'shoulder_ri_vas_l', v)} />
                    <VASSelector label="VAS RE hombro Derecha" value={measurements.strength.shoulder_re_vas_r} onChange={v => updateMeasurement('strength', 'shoulder_re_vas_r', v)} />
                    <VASSelector label="VAS RE hombro Izquierda" value={measurements.strength.shoulder_re_vas_l} onChange={v => updateMeasurement('strength', 'shoulder_re_vas_l', v)} />
                    <VASSelector label="VAS Ash I Derecha" value={measurements.strength.ash_i_vas_r} onChange={v => updateMeasurement('strength', 'ash_i_vas_r', v)} />
                    <VASSelector label="VAS Ash I Izquierda" value={measurements.strength.ash_i_vas_l} onChange={v => updateMeasurement('strength', 'ash_i_vas_l', v)} />
                    <VASSelector label="VAS Ash Y Derecha" value={measurements.strength.ash_y_vas_r} onChange={v => updateMeasurement('strength', 'ash_y_vas_r', v)} />
                    <VASSelector label="VAS Ash Y Izquierda" value={measurements.strength.ash_y_vas_l} onChange={v => updateMeasurement('strength', 'ash_y_vas_l', v)} />
                    <VASSelector label="VAS Ash T Derecha" value={measurements.strength.ash_t_vas_r} onChange={v => updateMeasurement('strength', 'ash_t_vas_r', v)} />
                    <VASSelector label="VAS Ash T Izquierda" value={measurements.strength.ash_t_vas_l} onChange={v => updateMeasurement('strength', 'ash_t_vas_l', v)} />
                  </div>
                </SectionGrid>
              </div>
            )}

            {/* JUMPS_V */}
            {activeTab === 'JUMPS_V' && (
              <div className="space-y-4">
                <SectionGrid title="CMJ Bipodal (2 piezas)">
                  <InputField label="CMJ 2 p Altura del salto" value={measurements.jumps_vertical.cmj_2p_height} onChange={v => updateMeasurement('jumps_vertical', 'cmj_2p_height', v)} unit="CM" />
                  <InputField label="CMJ 2 p: RSI" value={measurements.jumps_vertical.cmj_2p_rsi} onChange={v => updateMeasurement('jumps_vertical', 'cmj_2p_rsi', v)} step="any" />
                  <InputField label="CMJ 2 p: frenado Derecha" value={measurements.jumps_vertical.cmj_2p_brake_r} onChange={v => updateMeasurement('jumps_vertical', 'cmj_2p_brake_r', v)} unit="N" />
                  <InputField label="CMJ 2 p: frenado Izquierda" value={measurements.jumps_vertical.cmj_2p_brake_l} onChange={v => updateMeasurement('jumps_vertical', 'cmj_2p_brake_l', v)} unit="N" />
                  <InputField label="CMJ 2 p: propulsión Derecha" value={measurements.jumps_vertical.cmj_2p_prop_r} onChange={v => updateMeasurement('jumps_vertical', 'cmj_2p_prop_r', v)} unit="N" />
                  <InputField label="CMJ 2 p: propulsión Izquierda" value={measurements.jumps_vertical.cmj_2p_prop_l} onChange={v => updateMeasurement('jumps_vertical', 'cmj_2p_prop_l', v)} unit="N" />
                  <InputField label="CMJ 2 p: aterrizaje Derecha" value={measurements.jumps_vertical.cmj_2p_land_r} onChange={v => updateMeasurement('jumps_vertical', 'cmj_2p_land_r', v)} unit="N" />
                  <InputField label="CMJ 2 p: aterrizaje Izquierda" value={measurements.jumps_vertical.cmj_2p_land_l} onChange={v => updateMeasurement('jumps_vertical', 'cmj_2p_land_l', v)} unit="N" />
                </SectionGrid>
                
                <SectionGrid title="CMJ Unipodal">
                  <InputField label="CMJ 1 p: altura del salto Derecha" value={measurements.jumps_vertical.cmj_1p_height_r} onChange={v => updateMeasurement('jumps_vertical', 'cmj_1p_height_r', v)} unit="CM" />
                  <InputField label="CMJ 1 p: altura del salto Izquierda" value={measurements.jumps_vertical.cmj_1p_height_l} onChange={v => updateMeasurement('jumps_vertical', 'cmj_1p_height_l', v)} unit="CM" />
                  <InputField label="CMJ 1 p: RSI Derecha" value={measurements.jumps_vertical.cmj_1p_rsi_r} onChange={v => updateMeasurement('jumps_vertical', 'cmj_1p_rsi_r', v)} step="any" />
                  <InputField label="CMJ 1 p: RSI Izquierda" value={measurements.jumps_vertical.cmj_1p_rsi_l} onChange={v => updateMeasurement('jumps_vertical', 'cmj_1p_rsi_l', v)} step="any" />
                  <InputField label="CMJ 1 p: frenado Derecha" value={measurements.jumps_vertical.cmj_1p_brake_r} onChange={v => updateMeasurement('jumps_vertical', 'cmj_1p_brake_r', v)} unit="N" />
                  <InputField label="CMJ 1 p: frenado Izquierda" value={measurements.jumps_vertical.cmj_1p_brake_l} onChange={v => updateMeasurement('jumps_vertical', 'cmj_1p_brake_l', v)} unit="N" />
                  <InputField label="CMJ 1 p: propulsión Derecha" value={measurements.jumps_vertical.cmj_1p_prop_r} onChange={v => updateMeasurement('jumps_vertical', 'cmj_1p_prop_r', v)} unit="N" />
                  <InputField label="CMJ 1 p: propulsión Izquierda" value={measurements.jumps_vertical.cmj_1p_prop_l} onChange={v => updateMeasurement('jumps_vertical', 'cmj_1p_prop_l', v)} unit="N" />
                  <InputField label="CMJ 1 p: aterrizaje Derecha" value={measurements.jumps_vertical.cmj_1p_land_r} onChange={v => updateMeasurement('jumps_vertical', 'cmj_1p_land_r', v)} unit="N" />
                  <InputField label="CMJ 1 p: aterrizaje Izquierda" value={measurements.jumps_vertical.cmj_1p_land_l} onChange={v => updateMeasurement('jumps_vertical', 'cmj_1p_land_l', v)} unit="N" />
                </SectionGrid>

                <SectionGrid title="Drop Jump Bipodal">
                  <InputField label="DJ a 2 p altura del salto" value={measurements.jumps_vertical.dj_2p_height} onChange={v => updateMeasurement('jumps_vertical', 'dj_2p_height', v)} unit="CM" tooltip={EVALUATION_PROTOCOLS.dj_height?.description} />
                  <InputField label="DJ a 2 p RSI" value={measurements.jumps_vertical.dj_2p_rsi} onChange={v => updateMeasurement('jumps_vertical', 'dj_2p_rsi', v)} step="any" />
                  <InputField label="DJ a 2 p: fuerza pico Derecha" value={measurements.jumps_vertical.dj_2p_peak_force_r} onChange={v => updateMeasurement('jumps_vertical', 'dj_2p_peak_force_r', v)} unit="N" />
                  <InputField label="DJ a 2 p: fuerza pico Izquierda" value={measurements.jumps_vertical.dj_2p_peak_force_l} onChange={v => updateMeasurement('jumps_vertical', 'dj_2p_peak_force_l', v)} unit="N" />
                </SectionGrid>

                <SectionGrid title="Drop Jump Unipodal">
                  <InputField label="DJ a 1 p altura del salto Derecha" value={measurements.jumps_vertical.dj_1p_height_r} onChange={v => updateMeasurement('jumps_vertical', 'dj_1p_height_r', v)} unit="CM" tooltip={EVALUATION_PROTOCOLS.dj_height?.description} />
                  <InputField label="DJ a 1 p altura del salto Izquierda" value={measurements.jumps_vertical.dj_1p_height_l} onChange={v => updateMeasurement('jumps_vertical', 'dj_1p_height_l', v)} unit="CM" tooltip={EVALUATION_PROTOCOLS.dj_height?.description} />
                  <InputField label="DJ a 1 p: tiempo de contacto Derecha" value={measurements.jumps_vertical.dj_1p_contact_r} onChange={v => updateMeasurement('jumps_vertical', 'dj_1p_contact_r', v)} unit="MS" />
                  <InputField label="DJ a 1 p: tiempo de contacto Izquierda" value={measurements.jumps_vertical.dj_1p_contact_l} onChange={v => updateMeasurement('jumps_vertical', 'dj_1p_contact_l', v)} unit="MS" />
                  <InputField label="DJ a 1 p: RSI Derecha" value={measurements.jumps_vertical.dj_1p_rsi_r} onChange={v => updateMeasurement('jumps_vertical', 'dj_1p_rsi_r', v)} step="any" />
                  <InputField label="DJ a 1 p: RSI Izquierda" value={measurements.jumps_vertical.dj_1p_rsi_l} onChange={v => updateMeasurement('jumps_vertical', 'dj_1p_rsi_l', v)} step="any" />
                </SectionGrid>
              </div>
            )}

            {/* VBT */}
            {activeTab === 'VBT' && (
              <div className="space-y-4">
                <SectionGrid title="VBT Sentadilla">
                  <InputField label="VBT Sentadilla Derecha" value={measurements.vbt.squat_r} onChange={v => updateMeasurement('vbt', 'squat_r', v)} unit="M/S" />
                  <InputField label="VBT Sentadilla Izquierda" value={measurements.vbt.squat_l} onChange={v => updateMeasurement('vbt', 'squat_l', v)} unit="M/S" />
                  <InputField label="Peso utilizado sentadilla" value={measurements.vbt.squat_weight} onChange={v => updateMeasurement('vbt', 'squat_weight', v)} unit="KG" />
                </SectionGrid>
                <SectionGrid title="VBT Peso Muerto">
                  <InputField label="VBT Peso muerto Derecha" value={measurements.vbt.deadlift_r} onChange={v => updateMeasurement('vbt', 'deadlift_r', v)} unit="M/S" />
                  <InputField label="VBT Peso muerto Izquierda" value={measurements.vbt.deadlift_l} onChange={v => updateMeasurement('vbt', 'deadlift_l', v)} unit="M/S" />
                  <InputField label="Peso utilizado peso muerto" value={measurements.vbt.deadlift_weight} onChange={v => updateMeasurement('vbt', 'deadlift_weight', v)} unit="KG" />
                </SectionGrid>
                <SectionGrid title="VBT Puente Glúteo">
                  <InputField label="VBT Puente glúteo Derecha" value={measurements.vbt.glute_bridge_r} onChange={v => updateMeasurement('vbt', 'glute_bridge_r', v)} unit="M/S" />
                  <InputField label="VBT Puente glúteo Izquierda" value={measurements.vbt.glute_bridge_l} onChange={v => updateMeasurement('vbt', 'glute_bridge_l', v)} unit="M/S" />
                  <InputField label="Peso utilizado puente glúteo" value={measurements.vbt.glute_bridge_weight} onChange={v => updateMeasurement('vbt', 'glute_bridge_weight', v)} unit="KG" />
                </SectionGrid>
                <SectionGrid title="VBT Sentadilla Búlgara">
                  <InputField label="VBT Sentadilla búlgara Derecha" value={measurements.vbt.bulgarian_r} onChange={v => updateMeasurement('vbt', 'bulgarian_r', v)} unit="M/S" />
                  <InputField label="VBT Sentadilla búlgara Izquierda" value={measurements.vbt.bulgarian_l} onChange={v => updateMeasurement('vbt', 'bulgarian_l', v)} unit="M/S" />
                  <InputField label="Peso utilizado sentadilla búlgara" value={measurements.vbt.bulgarian_weight} onChange={v => updateMeasurement('vbt', 'bulgarian_weight', v)} unit="KG" />
                </SectionGrid>
              </div>
            )}

            {/* JUMPS_H */}
            {activeTab === 'JUMPS_H' && (
              <div className="space-y-4">
                <SectionGrid title="Saltos Horizontales">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-l-4 border-primary-500 pl-3">Single Hop (cm)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Single Hop Test Derecha" value={measurements.jumps_horizontal.single_hop_r} onChange={v => updateMeasurement('jumps_horizontal', 'single_hop_r', v)} unit="CM" />
                        <InputField label="Single Hop Test Izquierda" value={measurements.jumps_horizontal.single_hop_l} onChange={v => updateMeasurement('jumps_horizontal', 'single_hop_l', v)} unit="CM" />
                      </div>

                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-l-4 border-primary-500 pl-3">Triple Hop (Distancia)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Triple Hop Test: distancia cm Derecha" value={measurements.jumps_horizontal.triple_hop_dist_r} onChange={v => updateMeasurement('jumps_horizontal', 'triple_hop_dist_r', v)} unit="CM" />
                        <InputField label="Triple Hop Test: distancia cm Izquierda" value={measurements.jumps_horizontal.triple_hop_dist_l} onChange={v => updateMeasurement('jumps_horizontal', 'triple_hop_dist_l', v)} unit="CM" />
                      </div>

                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-l-4 border-primary-500 pl-3">Triple Hop (T. Contacto)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Triple Hop Test: tiempo de contacto Derecha" value={measurements.jumps_horizontal.triple_hop_contact_r} onChange={v => updateMeasurement('jumps_horizontal', 'triple_hop_contact_r', v)} unit="MS" />
                        <InputField label="Triple Hop Test: tiempo de contacto Izquierda" value={measurements.jumps_horizontal.triple_hop_contact_l} onChange={v => updateMeasurement('jumps_horizontal', 'triple_hop_contact_l', v)} unit="MS" />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-l-4 border-primary-500 pl-3">Crossover Hop (Distancia)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Crossover Hop Test: distancia cm Derecha" value={measurements.jumps_horizontal.crossover_hop_dist_r} onChange={v => updateMeasurement('jumps_horizontal', 'crossover_hop_dist_r', v)} unit="CM" />
                        <InputField label="Crossover Hop Test: distancia cm Izquierda" value={measurements.jumps_horizontal.crossover_hop_dist_l} onChange={v => updateMeasurement('jumps_horizontal', 'crossover_hop_dist_l', v)} unit="CM" />
                      </div>

                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-l-4 border-primary-500 pl-3">Crossover Hop (T. Contacto)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Crossover Hop Test: tiempo de contacto Derecha" value={measurements.jumps_horizontal.crossover_hop_contact_r} onChange={v => updateMeasurement('jumps_horizontal', 'crossover_hop_contact_r', v)} unit="MS" />
                        <InputField label="Crossover Hop Test: tiempo de contacto Izquierda" value={measurements.jumps_horizontal.crossover_hop_contact_l} onChange={v => updateMeasurement('jumps_horizontal', 'crossover_hop_contact_l', v)} unit="MS" />
                      </div>

                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-l-4 border-primary-500 pl-3">Medial Side Triple Hop</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Medial Side Triple Hop Test: distancia cm Derecha" value={measurements.jumps_horizontal.medial_side_triple_hop_r} onChange={v => updateMeasurement('jumps_horizontal', 'medial_side_triple_hop_r', v)} unit="CM" />
                        <InputField label="Medial Side Triple Hop Test: distancia cm Izquierda" value={measurements.jumps_horizontal.medial_side_triple_hop_l} onChange={v => updateMeasurement('jumps_horizontal', 'medial_side_triple_hop_l', v)} unit="CM" />
                      </div>

                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-l-4 border-primary-500 pl-3">Medial Rotation Hop</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="90 Medial Rotation Hop Test: distancia cm Derecha" value={measurements.jumps_horizontal.medial_rotation_hop_r} onChange={v => updateMeasurement('jumps_horizontal', 'medial_rotation_hop_r', v)} unit="CM" />
                        <InputField label="90 Medial Rotation Hop Test: distancia cm Izquierda" value={measurements.jumps_horizontal.medial_rotation_hop_l} onChange={v => updateMeasurement('jumps_horizontal', 'medial_rotation_hop_l', v)} unit="CM" />
                      </div>

                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-l-4 border-primary-500 pl-3">Side Hop Test</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Side Hop Test Derecha" value={measurements.jumps_horizontal.side_hop_r} onChange={v => updateMeasurement('jumps_horizontal', 'side_hop_r', v)} />
                        <InputField label="Side Hop Test Izquierda" value={measurements.jumps_horizontal.side_hop_l} onChange={v => updateMeasurement('jumps_horizontal', 'side_hop_l', v)} />
                      </div>
                    </div>
                  </div>
                </SectionGrid>
              </div>
            )}

            {/* CONTROL */}
            {activeTab === 'CONTROL' && (
              <div className="space-y-4">
                <SectionGrid title="Sentadilla Bipodal & Bisagra" cols={1}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-l-4 border-primary-500 pl-3">Sentadilla Bipodal</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <VASSelector label="Sentadilla bipodal Derecha" value={measurements.motor_control.bipodal_squat_r} onChange={v => updateMeasurement('motor_control', 'bipodal_squat_r', v)} />
                        <VASSelector label="Sentadilla bipodal Izquierda" value={measurements.motor_control.bipodal_squat_l} onChange={v => updateMeasurement('motor_control', 'bipodal_squat_l', v)} />
                      </div>
                      <div className="mt-3">
                        <ImageUploadField
                          label="Foto Sentadilla Bipodal"
                          imageUrl={squatBipodalImageUrl}
                          onUpload={handleImageUpload('motor_control', 'squat_bipodal_image_url', setSquatBipodalImageUrl)}
                          onClear={() => { setSquatBipodalImageUrl(null); updateMeasurement('motor_control', 'squat_bipodal_image_url', null); }}
                        />
                      </div>
                      
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-l-4 border-primary-500 pl-3">Sentadilla Unipodal (Frontal)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <p className="text-[9px] font-bold text-slate-400 uppercase text-center bg-slate-100 py-1 rounded">Derecha</p>
                          <InputField label="Sentadilla a 1 pierna: vista frontal derecha Déficit de tronco" value={measurements.motor_control.sls_frontal_trunk_r} onChange={v => updateMeasurement('motor_control', 'sls_frontal_trunk_r', v)} type="select" options={['No evaluado', 'OK', 'X']} tooltip={EVALUATION_PROTOCOLS.single_leg_squat?.description} />
                          <InputField label="Sentadilla a 1 pierna: vista frontal derecha Déficit de pelvis" value={measurements.motor_control.sls_frontal_pelvis_r} onChange={v => updateMeasurement('motor_control', 'sls_frontal_pelvis_r', v)} type="select" options={['No evaluado', 'OK', 'X']} tooltip={EVALUATION_PROTOCOLS.single_leg_squat?.description} />
                          <InputField label="Sentadilla a 1 pierna: vista frontal derecha Déficit de cadera" value={measurements.motor_control.sls_frontal_hip_r} onChange={v => updateMeasurement('motor_control', 'sls_frontal_hip_r', v)} type="select" options={['No evaluado', 'OK', 'X']} tooltip={EVALUATION_PROTOCOLS.single_leg_squat?.description} />
                          <InputField label="Sentadilla a 1 pierna: vista frontal derecha Déficit de rodilla" value={measurements.motor_control.sls_frontal_knee_r} onChange={v => updateMeasurement('motor_control', 'sls_frontal_knee_r', v)} type="select" options={['No evaluado', 'OK', 'X']} tooltip={EVALUATION_PROTOCOLS.single_leg_squat?.description} />
                        </div>
                        <div className="space-y-3">
                          <p className="text-[9px] font-bold text-slate-400 uppercase text-center bg-slate-100 py-1 rounded">Izquierda</p>
                          <InputField label="Sentadilla a 1 pierna: vista frontal izquierda Déficit de tronco" value={measurements.motor_control.sls_frontal_trunk_l} onChange={v => updateMeasurement('motor_control', 'sls_frontal_trunk_l', v)} type="select" options={['No evaluado', 'OK', 'X']} tooltip={EVALUATION_PROTOCOLS.single_leg_squat?.description} />
                          <InputField label="Sentadilla a 1 pierna: vista frontal izquierda Déficit de pelvis" value={measurements.motor_control.sls_frontal_pelvis_l} onChange={v => updateMeasurement('motor_control', 'sls_frontal_pelvis_l', v)} type="select" options={['No evaluado', 'OK', 'X']} tooltip={EVALUATION_PROTOCOLS.single_leg_squat?.description} />
                          <InputField label="Sentadilla a 1 pierna: vista frontal izquierda Déficit de cadera" value={measurements.motor_control.sls_frontal_hip_l} onChange={v => updateMeasurement('motor_control', 'sls_frontal_hip_l', v)} type="select" options={['No evaluado', 'OK', 'X']} tooltip={EVALUATION_PROTOCOLS.single_leg_squat?.description} />
                          <InputField label="Sentadilla a 1 pierna: vista frontal izquierda Déficit de rodilla" value={measurements.motor_control.sls_frontal_knee_l} onChange={v => updateMeasurement('motor_control', 'sls_frontal_knee_l', v)} type="select" options={['No evaluado', 'OK', 'X']} tooltip={EVALUATION_PROTOCOLS.single_leg_squat?.description} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                        <ImageUploadField
                          label="Foto SLS Frontal Derecha"
                          imageUrl={slsFrontalRImageUrl}
                          onUpload={handleImageUpload('motor_control', 'sls_frontal_r_image_url', setSlsFrontalRImageUrl)}
                          onClear={() => { setSlsFrontalRImageUrl(null); updateMeasurement('motor_control', 'sls_frontal_r_image_url', null); }}
                        />
                        <ImageUploadField
                          label="Foto SLS Frontal Izquierda"
                          imageUrl={slsFrontalLImageUrl}
                          onUpload={handleImageUpload('motor_control', 'sls_frontal_l_image_url', setSlsFrontalLImageUrl)}
                          onClear={() => { setSlsFrontalLImageUrl(null); updateMeasurement('motor_control', 'sls_frontal_l_image_url', null); }}
                        />
                      </div>
                    </div>
     
                    <div className="space-y-6">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-l-4 border-primary-500 pl-3">Vista Sagital & Otros</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <VASSelector label="Sentadilla a 1 pierna: vista sagital Derecha" value={measurements.motor_control.sls_sagittal_r} onChange={v => updateMeasurement('motor_control', 'sls_sagittal_r', v)} />
                        <VASSelector label="Sentadilla a 1 pierna: vista sagital Izquierda" value={measurements.motor_control.sls_sagittal_l} onChange={v => updateMeasurement('motor_control', 'sls_sagittal_l', v)} />
                      </div>
                      <div className="mt-3 mb-6">
                        <ImageUploadField
                          label="Foto SLS Sagital"
                          imageUrl={slsSagitalImageUrl}
                          onUpload={handleImageUpload('motor_control', 'sls_sagital_image_url', setSlsSagitalImageUrl)}
                          onClear={() => { setSlsSagitalImageUrl(null); updateMeasurement('motor_control', 'sls_sagital_image_url', null); }}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <VASSelector label="Bisagra de cadera Derecha" value={measurements.motor_control.hip_hinge_r} onChange={v => updateMeasurement('motor_control', 'hip_hinge_r', v)} />
                        <VASSelector label="Bisagra de cadera Izquierda" value={measurements.motor_control.hip_hinge_l} onChange={v => updateMeasurement('motor_control', 'hip_hinge_l', v)} />
                      </div>
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-l-4 border-primary-500 pl-3">FMS (0-3)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Estocada - FMS Derecha" value={measurements.motor_control.lunge_fms_r} onChange={v => updateMeasurement('motor_control', 'lunge_fms_r', v)} />
                        <InputField label="Estocada - FMS Izquierda" value={measurements.motor_control.lunge_fms_l} onChange={v => updateMeasurement('motor_control', 'lunge_fms_l', v)} />
                        <InputField label="Paso de valla - FMS Derecha" value={measurements.motor_control.hurdle_step_r} onChange={v => updateMeasurement('motor_control', 'hurdle_step_r', v)} />
                        <InputField label="Paso de valla - FMS Izquierda" value={measurements.motor_control.hurdle_step_l} onChange={v => updateMeasurement('motor_control', 'hurdle_step_l', v)} />
                      </div>
                    </div>
                  </div>
                </SectionGrid>
              </div>
            )}

            {/* MCGILL */}
            {activeTab === 'MCGILL' && (
              <div className="space-y-4">
                <SectionGrid title="Test de McGill (Segundos)">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="Mc Gill Derecha"
                      value={measurements.mcgill.lateral_bridge_r}
                      onChange={(v) => updateMeasurement('mcgill', 'lateral_bridge_r', v)}
                      unit="SEG"
                      tooltip={EVALUATION_PROTOCOLS.mcgill?.description}
                    />
                    <InputField
                      label="Mc Gill Izquierda"
                      value={measurements.mcgill.lateral_bridge_l}
                      onChange={(v) => updateMeasurement('mcgill', 'lateral_bridge_l', v)}
                      unit="SEG"
                      tooltip={EVALUATION_PROTOCOLS.mcgill?.description}
                    />
                    <InputField
                      label="Mc Gill Flexores"
                      value={measurements.mcgill.flexor_endurance}
                      onChange={(v) => updateMeasurement('mcgill', 'flexor_endurance', v)}
                      unit="SEG"
                      tooltip={EVALUATION_PROTOCOLS.mcgill?.description}
                    />
                    <InputField
                      label="Mc Gill Extensores"
                      value={measurements.mcgill.extensor_endurance}
                      onChange={(v) => updateMeasurement('mcgill', 'extensor_endurance', v)}
                      unit="SEG"
                      tooltip={EVALUATION_PROTOCOLS.mcgill?.description}
                    />
                  </div>
                </SectionGrid>
              </div>
            )}

            {/* FUNCTIONAL */}
            {activeTab === 'FUNCTIONAL' && (
              <div className="space-y-6">
                <SectionGrid title="Agilidad & Cambios de Dirección">
                  <InputField label="Prueba de Frenado" value={measurements.functional.braking_test} onChange={v => updateMeasurement('functional', 'braking_test', v)} type="select" options={['No evaluado', 'OK', 'X']} />
                  <InputField label="T Test" value={measurements.functional.t_test} onChange={v => updateMeasurement('functional', 't_test', v)} unit="SEG" />
                  <InputField label="Edgren Side Step Test" value={measurements.functional.edgren_side_step} onChange={v => updateMeasurement('functional', 'edgren_side_step', v)} unit="CM" />
                </SectionGrid>

                <SectionGrid title="CMAS 45º">
                  <InputField label="CMAS 45º Derecha" value={measurements.functional.cmas_45_r} onChange={v => updateMeasurement('functional', 'cmas_45_r', v)} />
                  <InputField label="CMAS 45º Izquierda" value={measurements.functional.cmas_45_l} onChange={v => updateMeasurement('functional', 'cmas_45_l', v)} />
                </SectionGrid>

                <SectionGrid title="CMAS 90º">
                  <InputField label="CMAS 90º Derecha" value={measurements.functional.cmas_90_r} onChange={v => updateMeasurement('functional', 'cmas_90_r', v)} />
                  <InputField label="CMAS 90º Izquierda" value={measurements.functional.cmas_90_l} onChange={v => updateMeasurement('functional', 'cmas_90_l', v)} />
                </SectionGrid>

                <SectionGrid title="Cuestionarios y Escalas Clínicas">
                  <InputField label="Cuestionarios autoinformados IKDC" value={measurements.functional.ikdc} onChange={v => updateMeasurement('functional', 'ikdc', v)} unit="%" />
                  <InputField label="Cuestionarios autoinformados LCA RSI" value={measurements.functional.lca_rsi} onChange={v => updateMeasurement('functional', 'lca_rsi', v)} unit="%" />
                  <InputField label="Cuestionarios autoinformados HAGOS" value={measurements.functional.hagos} onChange={v => updateMeasurement('functional', 'hagos', v)} unit="%" />
                </SectionGrid>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pt-4 pb-[calc(1rem+var(--sab))] sm:px-10 sm:py-6 border-t border-slate-50 flex items-center justify-between bg-slate-50/30 shrink-0">
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
    </div>,
    document.body
  );
};
