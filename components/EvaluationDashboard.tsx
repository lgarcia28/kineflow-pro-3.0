import React, { useState, useEffect } from 'react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
    History, Plus, TrendingUp, Calendar, ChevronRight, FileText, 
    ArrowUpRight, ArrowDownRight, Award, Download, Search, BookOpen
} from 'lucide-react';
import { ClinicalEvaluation, Patient, UserRole } from '../types';
import { evaluationService } from '../services/evaluationService';
import { generateEvaluationPDF } from '../services/pdfService';
import { EvaluationForm } from './EvaluationForm';
import { EvaluationDetailsModal } from './EvaluationDetailsModal';
import { EVALUATION_PROTOCOLS } from '../constants';


interface EvaluationDashboardProps {
  patient: Patient;
  role: UserRole;
  kineId: string;
}

export const EvaluationDashboard: React.FC<EvaluationDashboardProps> = ({
  patient,
  role,
  kineId
}) => {
  const [evaluations, setEvaluations] = useState<ClinicalEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewEval, setShowNewEval] = useState(false);
  const [selectedEval, setSelectedEval] = useState<ClinicalEvaluation | null>(null);
  
  const [activeTab, setActiveTab] = useState<'history' | 'protocols'>('history');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  useEffect(() => {
    fetchEvaluations();
  }, [patient.id]);

  const fetchEvaluations = async () => {
    setLoading(true);
    const data = await evaluationService.getByPatientId(patient.id);
    setEvaluations(data);
    setLoading(false);
  };

  const handleSaveNew = (newEval: ClinicalEvaluation) => {
    setEvaluations(prev => [newEval, ...prev]);
    setShowNewEval(false);
  };

  // Datos para gráficas de evolución
  const evolutionData = evaluations
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(ev => ({
      date: new Date(ev.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
      'LSI Rodilla (%)': ev.summaryMetrics.lsi_knee_ext || 0,
      'RSI Salto': ev.summaryMetrics.rsi_cmj || 0,
      'Peso (kg)': ev.summaryMetrics.weight || 0
    }));

  const latestEval = evaluations[0];

  const categoriesList = [
    'Todos', 
    'Movilidad', 
    'Flexibilidad', 
    'Antropometría', 
    'Meningorradicular', 
    'Balance', 
    'Core / Resistencia', 
    'Fuerza Funcional', 
    'Dinamometría', 
    'Saltos / Pliometría'
  ];

  const filteredProtocols = Object.values(EVALUATION_PROTOCOLS).filter(proto => {
    const matchesCategory = selectedCategory === 'Todos' || proto.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch = proto.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          proto.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          proto.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Award className="w-7 h-7 text-blue-600" />
            Evaluaciones Clínicas
          </h2>
          <p className="text-gray-500">Monitoreo de progreso clínico, test funcionales y definiciones operativas</p>
        </div>
        
        {role === UserRole.KINE && (
          <button 
            onClick={() => setShowNewEval(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <Plus className="w-5 h-5" /> Nueva Evaluación
          </button>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex bg-slate-100/80 p-1.5 rounded-[1.5rem] w-fit shadow-inner border border-slate-200/50">
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 ${
            activeTab === 'history' 
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200/40' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4.5 h-4.5" />
          Historial y Evolución
        </button>
        <button
          onClick={() => setActiveTab('protocols')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 ${
            activeTab === 'protocols' 
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200/40' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4.5 h-4.5" />
          Definición Operativa
        </button>
      </div>

      {activeTab === 'history' ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Evolution Summary Chart */}
          {evaluations.length > 1 && (
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Evolución de Simetría y Potencia
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    />
                    <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                    <Line 
                        type="monotone" 
                        dataKey="LSI Rodilla (%)" 
                        stroke="#2563eb" 
                        strokeWidth={4} 
                        dot={{r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#fff'}} 
                        activeDot={{r: 8}}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="RSI Salto" 
                        stroke="#10b981" 
                        strokeWidth={4} 
                        dot={{r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} 
                        activeDot={{r: 8}}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Evaluations List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
                [1,2,3].map(n => (
                    <div key={n} className="h-48 bg-gray-50 animate-pulse rounded-3xl border"></div>
                ))
            ) : evaluations.length > 0 ? (
              evaluations.map((ev) => (
                <div 
                  key={ev.id}
                  onClick={() => setSelectedEval(ev)}
                  className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <FileText className="w-16 h-16 text-blue-600" />
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-gray-800">{new Date(ev.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm text-gray-500 line-clamp-2 italic">
                      "{ev.results.conclusions[0] || 'Evaluación de rutina completada exitosamente.'}"
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                        {ev.results.metrics.slice(0, 2).map((m, idx) => (
                            <span key={idx} className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-1 rounded-lg ${
                                m.interpretation === 'normal' ? 'bg-green-50 text-green-600' : 
                                m.interpretation === 'warning' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
                            }`}>
                                {m.label}: {m.value}{m.unit}
                            </span>
                        ))}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <button 
                        onClick={(e) => { e.stopPropagation(); generateEvaluationPDF(ev, patient); }}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-all flex items-center gap-2 text-xs font-bold"
                    >
                        <Download className="w-4 h-4" /> PDF
                    </button>
                    <div className="text-blue-600 font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Ver Reporte <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium text-lg">No hay evaluaciones registradas aún.</p>
                {role === UserRole.KINE && (
                    <button onClick={() => setShowNewEval(true)} className="mt-4 text-blue-600 font-bold hover:underline">
                        Comenzar Primera Evaluación
                    </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Search & Categories filter */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
            <div className="relative w-full md:max-w-md shrink-0">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar protocolo o ejercicio..."
                className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 pl-11 pr-4 font-bold text-slate-800 text-sm focus:bg-white focus:border-blue-500 focus:ring-0 transition-all shadow-inner"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            </div>
            
            <div className="flex gap-2 items-center overflow-x-auto w-full md:w-auto py-1 no-scrollbar scroll-smooth">
              {categoriesList.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                      : 'bg-slate-50 text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Protocols */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProtocols.length > 0 ? (
              filteredProtocols.map((proto, idx) => (
                <div 
                  key={idx}
                  className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-lg ${
                        proto.category === 'Movilidad' ? 'bg-emerald-50 text-emerald-600' :
                        proto.category === 'Flexibilidad' ? 'bg-amber-50 text-amber-600' :
                        proto.category === 'Dinamometría' ? 'bg-indigo-50 text-indigo-600' :
                        proto.category === 'Balance' || proto.category.includes('Balance') ? 'bg-purple-50 text-purple-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {proto.category}
                      </span>
                      <BookOpen className="w-4 h-4 text-slate-300" />
                    </div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-3">{proto.name}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-bold whitespace-pre-line">
                      {proto.description || "Sin protocolo específico descripto en la planilla oficial."}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-bold text-lg">No se encontraron protocolos.</p>
                <p className="text-slate-400 font-semibold text-sm">Prueba con otra búsqueda o categoría.</p>
              </div>
            )}
          </div>
        </div>
      )}


      {/* Modal: New Evaluation Form */}
      {showNewEval && (
        <EvaluationForm 
          patient={patient}
          onCancel={() => setShowNewEval(false)}
          onSave={handleSaveNew}
        />
      )}

      {/* Modal: Evaluation Result View (Detail) */}
      {selectedEval && (
        <EvaluationDetailsModal 
           evaluation={selectedEval}
           patient={patient}
           onClose={() => setSelectedEval(null)}
        />
      )}
    </div>
  );
};
