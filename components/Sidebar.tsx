import React from 'react';
import { Patient, CheckInStatus } from '../types';
import { X, Home, Wifi, WifiOff, Activity, Dumbbell, Users, Clock, Settings } from 'lucide-react';

interface SidebarProps {
  activePatients: Patient[];
  selectedPatientId: string | null;
  onSelectPatient: (patientId: string) => void;
  onRemoveActive: (patientId: string, e: React.MouseEvent) => void;
  onGoHome: () => void;
  onOpenLibrary?: () => void;
  onOpenStaffAdmin?: () => void;
  onOpenSettings?: () => void;
  isOnline: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePatients,
  selectedPatientId,
  onSelectPatient,
  onRemoveActive,
  onGoHome,
  onOpenLibrary,
  onOpenStaffAdmin,
  onOpenSettings,
  isOnline
}) => {
  return (
    <aside className="w-full md:w-20 glass-panel md:border-x-0 md:border-y-0 border-r border-slate-200/50 flex flex-row md:flex-col h-auto md:h-full shrink-0 z-50 px-2 md:px-0 bg-white/70">
      {/* Logo Section */}
      <div className="flex items-center md:justify-center py-3 md:py-6 px-2 md:px-0">
        <button onClick={onGoHome} className="group relative">
          <div className="absolute inset-0 bg-primary-400 rounded-2xl blur opacity-40 group-hover:opacity-70 transition-opacity"></div>
          <div className="relative w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-xl shadow-primary-500/20 group-hover:scale-105 transition-transform duration-300">
            <Activity className="text-white" size={26} strokeWidth={2.5} />
          </div>
        </button>
      </div>

      {/* Main Nav Section */}
      <nav className="flex items-center md:flex-col md:space-y-4 md:mt-4 px-2">
        <button 
          onClick={onGoHome}
          title="Panel Central"
          className={`relative h-full md:h-12 w-14 md:w-14 flex flex-col items-center justify-center rounded-2xl transition-all duration-300 ${!selectedPatientId ? 'bg-primary-50 text-primary-600 shadow-sm' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
        >
          <Home size={24} strokeWidth={!selectedPatientId ? 2.5 : 2} />
          {!selectedPatientId && <div className="hidden md:block absolute -right-1 w-1.5 h-6 bg-primary-600 rounded-l-full"></div>}
        </button>
        {onOpenLibrary && (
          <button 
            onClick={onOpenLibrary}
            title="Biblioteca de Ejercicios"
            className="h-full md:h-12 w-14 md:w-14 flex flex-col items-center justify-center rounded-2xl transition-all duration-300 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <Dumbbell size={24} />
          </button>
        )}
        {onOpenStaffAdmin && (
          <button 
            onClick={onOpenStaffAdmin}
            title="Gestión de Profesionales"
            className="h-full md:h-12 w-14 md:w-14 flex flex-col items-center justify-center rounded-2xl transition-all duration-300 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <Users size={24} />
          </button>
        )}
      </nav>

      {/* Active Patients Section */}
      <div className="flex-1 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto no-scrollbar md:scroll-container items-center py-2 md:py-6 gap-5 px-3 md:px-0">
        <div className="hidden md:block w-8 h-[1px] bg-slate-200/60 my-2"></div>
        {activePatients.map((patient) => {
          const isInRoom = patient.checkInStatus === CheckInStatus.IN_ROOM;
          const isSelected = selectedPatientId === patient.id;
          return (
            <div 
              key={patient.id}
              onClick={() => onSelectPatient(patient.id)}
              title={`${patient.firstName} ${patient.lastName}${isInRoom ? ' (En Sala)' : ''}`}
              className={`group relative flex flex-col items-center p-1.5 rounded-[1.25rem] cursor-pointer transition-all duration-300 transform hover:-translate-y-1 shrink-0 w-14 md:w-14 ${
                isSelected 
                  ? 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] ring-2 ring-primary-500 ring-offset-2 ring-offset-slate-50 scale-105' 
                  : isInRoom 
                    ? 'bg-gradient-to-b from-yellow-50 to-amber-100/50 shadow-sm ring-1 ring-yellow-400/50 hover:shadow-md'
                    : 'hover:bg-white/60 hover:shadow-sm'
              }`}
            >
              <div className="relative">
                <img src={patient.photoUrl} className={`w-10 h-10 md:w-11 md:h-11 rounded-xl object-cover transition-all ${isSelected ? 'shadow-md' : 'shadow-sm'} ${isInRoom && !isSelected ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}`} />
                {isInRoom && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-900 rounded-full p-1.5 shadow-lg shadow-yellow-500/30 animate-bounce">
                    <Clock size={12} strokeWidth={3} className="text-white" />
                  </div>
                )}
                {isSelected && (
                  <div className="absolute inset-0 rounded-xl border-2 border-primary-500/20"></div>
                )}
              </div>
              <span className={`mt-2 text-[9px] font-black uppercase truncate w-full text-center tracking-wider leading-none transition-colors ${isSelected ? 'text-primary-700' : isInRoom ? 'text-amber-700' : 'text-slate-500'}`}>
                {patient.firstName}
              </span>
              <button 
                onClick={(e) => onRemoveActive(patient.id, e)}
                className="absolute -top-2 -left-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 bg-white shadow-xl shadow-red-500/20 border border-slate-100 rounded-full text-red-500 transition-all hover:scale-125 hover:bg-red-50 z-10"
              >
                <X size={10} strokeWidth={3} />
              </button>
            </div>
          );
        })}
        {activePatients.length === 0 && (
          <div className="hidden md:flex flex-col items-center justify-center opacity-20 py-4">
             <Activity size={24} />
          </div>
        )}
      </div>

      {/* Settings Button */}
      <div className="hidden md:flex flex-col items-center gap-3 pb-6">
        <button 
          onClick={onOpenSettings}
          className="p-3 text-slate-400 hover:text-primary-600 hover:bg-white rounded-2xl transition-all shadow-sm hover:shadow-md"
          title="Ajustes de Sonido"
        >
          <Settings size={22} />
        </button>

        {/* Online Status */}
        <div className="p-3 rounded-2xl bg-white/50 shadow-sm border border-slate-100/50">
          {isOnline ? (
            <div className="relative">
              <Wifi size={20} className="text-teal-500" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-teal-400 rounded-full animate-ping opacity-75"></div>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-teal-500 rounded-full border-2 border-white"></div>
            </div>
          ) : (
            <WifiOff size={20} className="text-red-500 animate-pulse" />
          )}
        </div>
      </div>
    </aside>
  );
};