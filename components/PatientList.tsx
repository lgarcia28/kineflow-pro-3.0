
import React, { useState } from 'react';
import { Patient, Stage, CheckInStatus, PlanType } from '../types';
import { Search, ChevronRight, UserPlus, X, Settings2, Users, Clock, CheckCircle2 } from 'lucide-react';

interface PatientListProps {
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
}

export const PatientList: React.FC<PatientListProps> = ({
  patients,
  onSelectPatient
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false); // Toggle between "En Sala" and "Todos"
  
  const filteredPatients = patients.filter((p: Patient) => {
    const fullName = `${p.firstName} ${p.lastName} ${p.dni}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());
    
    if (showAll) return matchesSearch;
    // En Sala: Solo los que están actualmente esperando o en sesión (IN_ROOM)
    return matchesSearch && p.checkInStatus === CheckInStatus.IN_ROOM;
  });

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-slate-50/50 p-4 md:p-8 relative w-full">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary-100 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 z-0 pointer-events-none"></div>

      <div className="max-w-4xl mx-auto space-y-6 relative z-10 animate-slide-up">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              {showAll ? 'Todos los Pacientes' : 'Acceso Rápido'}
            </h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
              {showAll ? 'Base de datos completa' : 'Pacientes en sala hoy'}
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowAll(!showAll)}
              className={`px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-300 text-sm shadow-sm active:scale-95 ${
                showAll 
                  ? 'bg-white text-slate-600 border border-slate-200/60 hover:bg-slate-50' 
                  : 'bg-primary-600 text-white shadow-primary-500/20 shadow-lg hover:bg-primary-700 hover:-translate-y-0.5'
              }`}
            >
              {showAll ? <Clock size={18} /> : <Users size={18} />}
              <span>{showAll ? 'Ver en Sala' : 'Ver Todos'}</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
             <Search className="text-slate-400 w-5 h-5 group-focus-within:text-primary-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o DNI..."
            className="w-full h-16 pl-14 pr-6 bg-white/70 backdrop-blur-md rounded-[1.5rem] border border-slate-200/60 shadow-sm text-base font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* List */}
        <div className="glass-panel rounded-[2rem] overflow-hidden shadow-xl shadow-slate-200/10 border border-slate-200/50">
          {filteredPatients.map((patient, index) => (
            <div 
              key={patient.id} 
              className={`group flex items-center p-5 cursor-pointer hover:bg-white/80 transition-all duration-300 ${
                index !== filteredPatients.length - 1 ? 'border-b border-slate-100/50' : ''
              }`} 
              onClick={() => onSelectPatient(patient)}
            >
              <div className="relative shrink-0 mr-5">
                 <div className={`absolute inset-0 rounded-2xl transform rotate-3 group-hover:rotate-6 transition-transform ${patient.checkInStatus === CheckInStatus.IN_ROOM ? 'bg-amber-400' : patient.checkInStatus === CheckInStatus.ATTENDED ? 'bg-emerald-400' : 'bg-primary-100'}`}></div>
                 <img src={patient.photoUrl} className="w-14 h-14 rounded-2xl object-cover relative z-10 shadow-sm" />
                 
                 {/* Status Indicator */}
                 {patient.checkInStatus !== CheckInStatus.IDLE && (
                   <div className={`absolute -top-1.5 -right-1.5 z-20 w-4 h-4 rounded-full border-2 border-white shadow-sm ${patient.checkInStatus === CheckInStatus.IN_ROOM ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
                 )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-extrabold text-slate-900 text-lg truncate group-hover:text-primary-600 transition-colors">{patient.firstName} {patient.lastName}</h3>
                  {patient.checkInStatus === CheckInStatus.IN_ROOM && (
                    <span className="bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 shadow-sm text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border border-amber-200/50 flex items-center gap-1 shrink-0">
                      <Clock size={10} /> En Sala
                    </span>
                  )}
                  {patient.checkInStatus === CheckInStatus.ATTENDED && (
                    <span className="bg-emerald-50 text-emerald-600 shadow-sm text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border border-emerald-100 flex items-center gap-1 shrink-0">
                      <CheckCircle2 size={10} /> Atendido
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-xs select-all">DNI: {patient.dni}</span>
                  <span className="truncate">{patient.condition}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 pl-4 shrink-0">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary-50 group-hover:text-primary-600 group-hover:scale-110 transition-all duration-300">
                  <ChevronRight size={20} strokeWidth={2.5} />
                </div>
                {patient.planType === PlanType.SESSIONS && patient.remainingSessions !== undefined && (
                   <span className={`text-[10px] font-bold uppercase tracking-wider ${patient.remainingSessions <= 3 ? 'text-orange-500' : 'text-slate-400'}`}>{patient.remainingSessions} ses. rest.</span>
                )}
              </div>
            </div>
          ))}

          {filteredPatients.length === 0 && (
            <div className="p-16 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 bg-white/50 backdrop-blur shadow-sm">
                 <Users className="text-slate-300" size={32} />
              </div>
              <p className="font-black text-xl text-slate-900">No se encontraron pacientes</p>
              {!showAll && <p className="text-sm font-medium text-slate-500 mt-2">Usa el botón "Ver Todos" para buscar en la base completa.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
