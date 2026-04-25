import React from 'react';
import { Patient, CheckInStatus } from '../types';
import { X, Home, Wifi, WifiOff, Activity, Dumbbell, Users, Clock, Settings, LogOut, ChevronRight, Menu } from 'lucide-react';

interface SidebarProps {
  activePatients: Patient[];
  selectedPatientId: string | null;
  onSelectPatient: (patientId: string) => void;
  onRemoveActive: (patientId: string, e: React.MouseEvent) => void;
  onGoHome: () => void;
  onOpenLibrary?: () => void;
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
  onOpenSettings,
  isOnline
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  return (
    <aside className="w-full md:w-20 glass-panel md:border-x-0 md:border-y-0 border-r border-slate-200/50 flex flex-row md:flex-col h-auto md:h-full shrink-0 z-50 px-2 md:px-0 bg-white/70 relative">
      {/* Logo & Menu Section */}
      <div className="flex items-center md:justify-center py-3 md:py-6 px-2 md:px-0 relative group">
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)} 
          className={`group relative transition-transform active:scale-90 ${isMenuOpen ? 'scale-110' : ''}`}
        >
          <div className="absolute inset-0 bg-primary-400 rounded-2xl blur opacity-40 group-hover:opacity-70 transition-opacity"></div>
          <div className="relative w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-xl shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-all duration-300">
            {isMenuOpen ? <X className="text-white" size={24} /> : <Activity className="text-white" size={26} strokeWidth={2.5} />}
          </div>
        </button>

        {/* Floating Menu Overlay */}
        {isMenuOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-[2px]" onClick={() => setIsMenuOpen(false)}></div>
            <div className="absolute top-full md:top-6 left-2 md:left-full ml-0 md:ml-4 w-64 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-4 z-50 animate-in slide-in-from-left-4 duration-300">
              <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className={`p-2 rounded-xl bg-white shadow-sm transition-colors ${isOnline ? 'text-emerald-500' : 'text-red-500'}`}>
                  {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</p>
                  <p className={`text-xs font-bold ${isOnline ? 'text-emerald-600' : 'text-red-600'}`}>
                    {isOnline ? 'Conectado a la Red' : 'Modo Desconectado'}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <button 
                  onClick={() => { onGoHome(); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-primary-50 text-slate-600 hover:text-primary-600 transition-all group/item"
                >
                  <Home size={20} className="group-hover/item:scale-110 transition-transform" />
                  <span className="text-sm font-black uppercase tracking-wide">Panel Central</span>
                </button>

                {onOpenLibrary && (
                  <button 
                    onClick={() => { onOpenLibrary(); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-primary-50 text-slate-600 hover:text-primary-600 transition-all group/item"
                  >
                    <Dumbbell size={20} className="group-hover/item:scale-110 transition-transform" />
                    <span className="text-sm font-black uppercase tracking-wide">Biblioteca</span>
                  </button>
                )}

                <div className="h-px bg-slate-100 my-2 mx-4"></div>

                <button 
                  onClick={() => { if(onOpenSettings) onOpenSettings(); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-primary-50 text-slate-600 hover:text-primary-600 transition-all group/item"
                >
                  <Settings size={20} className="group-hover/item:rotate-90 transition-transform duration-500" />
                  <span className="text-sm font-black uppercase tracking-wide">Sonidos / Ajustes</span>
                </button>
              </div>

              <div className="mt-4 p-4 bg-primary-600 rounded-2xl text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">KineFlow Pro</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">V 3.0</span>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-glow shadow-emerald-400/50"></div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Active Patients Section - Now Flex-1 to take all space */}
      <div className="flex-1 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto no-scrollbar md:scroll-container items-center md:items-stretch py-2 md:py-4 gap-4 px-3 md:px-2">
        <div className="hidden md:block w-8 h-[1px] bg-slate-200/40 my-2 mx-auto shrink-0"></div>
        {activePatients.map((patient) => {
          const isInRoom = patient.checkInStatus === CheckInStatus.IN_ROOM;
          const isSelected = selectedPatientId === patient.id;
          return (
            <div 
              key={patient.id}
              onClick={() => onSelectPatient(patient.id)}
              title={`${patient.firstName} ${patient.lastName}${isInRoom ? ' (En Sala)' : ''}`}
              className={`group relative flex flex-col items-center p-2 rounded-[1.5rem] cursor-pointer transition-all duration-300 shrink-0 w-16 md:w-full ${
                isSelected 
                  ? 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] ring-2 ring-primary-500 ring-offset-2 ring-offset-slate-50 scale-105' 
                  : isInRoom 
                    ? 'bg-gradient-to-b from-yellow-50 to-amber-50 shadow-sm ring-1 ring-yellow-400/50 hover:shadow-md'
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
              </div>
              <span className={`mt-2 text-[9px] font-black uppercase truncate w-full text-center tracking-wider leading-none transition-colors ${isSelected ? 'text-primary-700' : isInRoom ? 'text-amber-700' : 'text-slate-500'}`}>
                {patient.firstName}
              </span>
              <button 
                onClick={(e) => onRemoveActive(patient.id, e)}
                className="absolute -top-2 -left-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1.5 bg-white shadow-xl shadow-red-500/20 border border-slate-100 rounded-full text-red-500 transition-all hover:scale-125 hover:bg-red-50 z-10"
              >
                <X size={10} strokeWidth={4} />
              </button>
            </div>
          );
        })}
        {activePatients.length === 0 && (
          <div className="hidden md:flex flex-col items-center justify-center opacity-10 py-10">
             <Activity size={32} strokeWidth={1} />
          </div>
        )}
      </div>

      {/* Online Status Indicator (Mini) at Bottom if menu closed */}
      {!isMenuOpen && (
        <div className="hidden md:flex flex-col items-center pb-6">
           <div className={`w-2 h-2 rounded-full shadow-glow ${isOnline ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-red-500 animate-pulse shadow-red-500/50'}`}></div>
        </div>
      )}
    </aside>
  );
};