
import React from 'react';
import { Patient } from '../types';
import { X, Home, Wifi, WifiOff, Activity, Dumbbell } from 'lucide-react';

interface SidebarProps {
  activePatients: Patient[];
  selectedPatientId: string | null;
  onSelectPatient: (patientId: string) => void;
  onRemoveActive: (patientId: string, e: React.MouseEvent) => void;
  onGoHome: () => void;
  onOpenLibrary?: () => void; // Nuevo prop opcional
  isOnline: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePatients,
  selectedPatientId,
  onSelectPatient,
  onRemoveActive,
  onGoHome,
  onOpenLibrary,
  isOnline
}) => {
  return (
    <aside className="w-full md:w-14 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-row md:flex-col h-auto md:h-full shrink-0 z-50 px-2 md:px-0">
      {/* Logo Section */}
      <div className="flex items-center md:justify-center border-r md:border-r-0 md:border-b border-slate-50 py-2 md:py-4 px-2 md:px-0">
        <button onClick={onGoHome} className="group">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <Activity className="text-white" size={24} />
          </div>
        </button>
      </div>

      {/* Main Nav Section */}
      <nav className="flex items-center md:flex-col md:space-y-1 md:mt-2 border-r md:border-r-0 md:border-none border-slate-50 px-1">
        <button 
          onClick={onGoHome}
          title="Panel Central"
          className={`h-full md:h-auto w-12 md:w-full flex flex-col items-center justify-center py-2 md:py-4 rounded-xl transition-all ${!selectedPatientId ? 'bg-primary-50 text-primary-600' : 'text-slate-300 hover:bg-slate-50'}`}
        >
          <Home size={22} />
        </button>
        {onOpenLibrary && (
          <button 
            onClick={onOpenLibrary}
            title="Biblioteca de Ejercicios"
            className="h-full md:h-auto w-12 md:w-full flex flex-col items-center justify-center py-2 md:py-4 rounded-xl transition-all text-slate-300 hover:bg-slate-50 hover:text-slate-600"
          >
            <Dumbbell size={22} />
          </button>
        )}
      </nav>

      {/* Active Patients Section - Horizontal on Mobile, Vertical on Desktop */}
      <div className="flex-1 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto no-scrollbar md:scroll-container items-center py-2 md:py-4 gap-3 px-3 md:px-1">
        {activePatients.map((patient) => (
          <div 
            key={patient.id}
            onClick={() => onSelectPatient(patient.id)}
            title={`${patient.firstName} ${patient.lastName}`}
            className={`group relative flex flex-col items-center p-1 rounded-xl cursor-pointer transition-all border-2 shrink-0 w-12 md:w-11 ${selectedPatientId === patient.id ? 'bg-white border-primary-500 shadow-sm ring-4 ring-primary-50' : 'border-transparent hover:bg-slate-50'}`}
          >
            <img src={patient.photoUrl} className="w-8 h-8 md:w-9 md:h-9 rounded-lg object-cover mb-1" />
            <span className="text-[7px] font-black uppercase text-slate-500 truncate w-full text-center tracking-tighter leading-none">
              {patient.firstName}
            </span>
            <button 
              onClick={(e) => onRemoveActive(patient.id, e)}
              className="absolute -top-1 -right-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 p-0.5 bg-white shadow-md border border-slate-100 rounded-full text-red-500 transition-all hover:scale-125 z-10"
            >
              <X size={8} strokeWidth={3} />
            </button>
          </div>
        ))}
        {activePatients.length === 0 && (
          <div className="hidden md:flex flex-col items-center justify-center opacity-10 py-4">
             <Activity size={16} />
          </div>
        )}
      </div>

      {/* Online Status */}
      <div className="hidden md:flex p-4 border-t border-slate-50 justify-center items-center">
        {isOnline ? (
          <div className="relative">
            <Wifi size={20} className="text-kine drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-kine rounded-full animate-ping"></div>
          </div>
        ) : (
          <WifiOff size={20} className="text-red-500 animate-pulse" />
        )}
      </div>
    </aside>
  );
};