
import React, { useState } from 'react';
import { Patient, Stage } from '../types';
import { Search, ChevronRight, UserPlus, X, Settings2 } from 'lucide-react';

interface PatientListProps {
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  onAddPatient: (patient: Patient) => void;
  onUpdatePatient: (patient: Patient) => void;
  onDeletePatient: (patientId: string) => void;
}

export const PatientList: React.FC<PatientListProps> = ({
  patients,
  onSelectPatient,
  onAddPatient,
  onUpdatePatient,
  onDeletePatient
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalState, setModalState] = useState<{ show: boolean, editingPatient: Patient | null }>({
    show: false,
    editingPatient: null
  });
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    condition: '',
    age: 30,
    stage: Stage.KINESIOLOGY
  });

  const filteredPatients = patients.filter((p) => {
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const openModal = (patient: Patient | null = null) => {
    if (patient) {
      setFormData({
        firstName: patient.firstName,
        lastName: patient.lastName,
        condition: patient.condition,
        age: patient.age,
        stage: patient.routine.stage
      });
      setModalState({ show: true, editingPatient: patient });
    } else {
      setFormData({ firstName: '', lastName: '', condition: '', age: 30, stage: Stage.KINESIOLOGY });
      setModalState({ show: true, editingPatient: null });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) return;

    if (modalState.editingPatient) {
      onUpdatePatient({
        ...modalState.editingPatient,
        firstName: formData.firstName,
        lastName: formData.lastName,
        age: formData.age,
        condition: formData.condition,
        routine: { ...modalState.editingPatient.routine, stage: formData.stage }
      });
    } else {
      const newPatient: Patient = {
        id: `p-${Date.now()}`,
        firstName: formData.firstName,
        lastName: formData.lastName,
        age: formData.age,
        condition: formData.condition || 'Sin diagnóstico',
        photoUrl: `https://ui-avatars.com/api/?name=${formData.firstName}+${formData.lastName}&background=random`,
        lastVisit: new Date().toISOString().split('T')[0],
        history: [],
        routine: {
          id: `r-${Date.now()}`,
          stage: formData.stage,
          // Fixed: Added missing 'currentWeek' property required by Routine interface
          currentWeek: 1,
          days: [{ id: `d1-${Date.now()}`, name: 'Día 1', exercises: [] }]
        }
      };
      onAddPatient(newPatient);
    }
    setModalState({ show: false, editingPatient: null });
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Pacientes</h1>
          <button onClick={() => openModal()} className="bg-primary-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-primary-700 transition-all text-sm">
            <UserPlus size={18} />
            <span className="hidden xs:inline">Nuevo Paciente</span>
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            className="w-full h-14 pl-12 pr-6 rounded-2xl border-none shadow-sm text-base focus:ring-4 focus:ring-primary-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {filteredPatients.map((patient, index) => (
            <div key={patient.id} className={`flex items-center p-4 cursor-pointer hover:bg-slate-50 transition-colors ${index !== filteredPatients.length - 1 ? 'border-b border-slate-100' : ''}`} onClick={() => onSelectPatient(patient)}>
              <img src={patient.photoUrl} className="w-10 h-10 rounded-full object-cover mr-4" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 truncate">{patient.firstName} {patient.lastName}</h3>
                <p className="text-slate-400 text-xs truncate">{patient.condition}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); openModal(patient); }} className="p-2 text-slate-400 hover:text-primary-600"><Settings2 size={18} /></button>
                <ChevronRight className="text-slate-300" size={20} />
              </div>
            </div>
          ))}
          {filteredPatients.length === 0 && <div className="p-8 text-center text-slate-400 italic">No se encontraron pacientes</div>}
        </div>
      </div>

      {modalState.show && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-6 shadow-2xl animate-in zoom-in-95">
                 <div className="flex justify-between items-center">
                     <h2 className="text-xl font-bold text-slate-900">{modalState.editingPatient ? 'Editar Paciente' : 'Nuevo Paciente'}</h2>
                     <button onClick={() => setModalState({ show: false, editingPatient: null })} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
                 </div>
                 
                 <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nombre</label>
                            <input type="text" required className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Apellido</label>
                            <input type="text" required className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                        </div>
                     </div>

                     <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Edad</label>
                            <input type="number" required className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" value={formData.age} onChange={e => setFormData({...formData, age: Number(e.target.value)})} />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Etapa Inicial</label>
                            <select className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value as Stage})}>
                                <option value={Stage.KINESIOLOGY}>Kinesiología</option>
                                <option value={Stage.GYM}>Gimnasio</option>
                            </select>
                        </div>
                     </div>

                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Diagnóstico / Motivo</label>
                        <input type="text" className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} />
                     </div>

                     <div className="pt-4 flex flex-col gap-3">
                        <button type="submit" className="w-full bg-primary-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary-200 hover:bg-primary-700 transition-colors">
                            {modalState.editingPatient ? 'Actualizar Datos' : 'Crear Paciente'}
                        </button>
                        {modalState.editingPatient && (
                            <button type="button" onClick={() => { if(window.confirm('¿Eliminar paciente?')) { onDeletePatient(modalState.editingPatient!.id); setModalState({show:false, editingPatient:null}); } }} className="w-full text-red-500 font-bold py-2 hover:bg-red-50 rounded-xl transition-colors">
                                Eliminar Paciente
                            </button>
                        )}
                     </div>
                 </form>
             </div>
        </div>
      )}
    </div>
  );
};
