import React, { useState } from 'react';
import { UserRole, StaffMember } from '../types';
import { User, Lock, ArrowRight, Activity, ShieldCheck, HeartPulse } from 'lucide-react';

interface LoginProps {
  onLogin: (role: UserRole, dni?: string) => void;
  staff: StaffMember[];
}

export const Login: React.FC<LoginProps> = ({ onLogin, staff }) => {
  const [mode, setMode] = useState<'PATIENT' | 'STAFF'>('PATIENT');
  const [dni, setDni] = useState('');
  const [staffUser, setStaffUser] = useState('');
  const [staffPass, setStaffPass] = useState('');
  const [error, setError] = useState('');

  const handlePatientLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (dni.trim()) {
      onLogin(UserRole.PATIENT, dni);
    }
  };

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Check against staff list
    const member = staff.find(s => s.username.toLowerCase() === staffUser.toLowerCase() && s.password === staffPass);
    
    if (member) {
      onLogin(member.role, member.username);
    } else {
      // Fallback for initial setup if no staff exists
      if (staffUser.toLowerCase() === 'recepcion' && staffPass === '1234') {
        onLogin(UserRole.RECEPCION);
      } else if (staffUser.toLowerCase() === 'kine' && staffPass === '1234') {
        onLogin(UserRole.KINE);
      } else {
        setError('Usuario o contraseña incorrectos');
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-dark-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-pulse" style={{animationDelay: '1s'}}></div>
      
      {/* Left Panel - Branding (Hidden on very small mobile) */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-24 relative z-10 2xl:px-40 xl:border-r border-slate-200/50 bg-white/40 backdrop-blur-3xl">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-16 h-16 bg-primary-600 rounded-[1.25rem] shadow-2xl shadow-primary-500/30 flex items-center justify-center transform hover:scale-105 transition-transform">
            <Activity className="text-white w-8 h-8" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tight">KineFlow<span className="text-primary-600">Pro</span></h1>
            <p className="text-lg text-slate-500 font-medium mt-1">Plataforma Clínica de Alto Rendimiento</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-start gap-5">
             <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center shrink-0">
                <HeartPulse className="text-teal-600 w-6 h-6" />
             </div>
             <div>
               <h3 className="text-xl font-bold text-slate-900">Seguimiento Preciso</h3>
               <p className="text-slate-500 mt-1 leading-relaxed">Gestione la recuperación y evolución clínica con herramientas avanzadas en tiempo real.</p>
             </div>
          </div>
          <div className="flex items-start gap-5">
             <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="text-indigo-600 w-6 h-6" />
             </div>
             <div>
               <h3 className="text-xl font-bold text-slate-900">Historial Seguro</h3>
               <p className="text-slate-500 mt-1 leading-relaxed">Toda la historia clínica, notas y ejercicios almacenados con máxima seguridad.</p>
             </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-[440px] animate-slide-up">
          
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-[1.25rem] shadow-xl shadow-primary-500/30 mb-5">
              <Activity className="text-white w-8 h-8" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">KineFlow Pro</h1>
          </div>

          <div className="glass-card p-10 lg:p-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Bienvenido de nuevo</h2>
            <p className="text-slate-500 mb-8 font-medium">Ingresa tus credenciales para continuar</p>

            <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-8 border border-slate-200/50">
              <button
                onClick={() => setMode('PATIENT')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                  mode === 'PATIENT' ? 'bg-white text-primary-600 shadow-md shadow-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Paciente
              </button>
              <button
                onClick={() => setMode('STAFF')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                  mode === 'STAFF' ? 'bg-white text-primary-600 shadow-md shadow-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Profesional
              </button>
            </div>

            {mode === 'PATIENT' ? (
              <form onSubmit={handlePatientLogin} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                    Número de DNI
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary-500 transition-colors" />
                    <input
                      type="text"
                      value={dni}
                      onChange={(e) => setDni(e.target.value)}
                      placeholder="Ej: 12345678"
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-sans"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-primary-600/20 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  Continuar <ArrowRight size={20} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleStaffLogin} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                    Usuario
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary-500 transition-colors" />
                    <input
                      type="text"
                      value={staffUser}
                      onChange={(e) => setStaffUser(e.target.value)}
                      placeholder="ingrese su usuario"
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                    Contraseña
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary-500 transition-colors" />
                    <input
                      type="password"
                      value={staffPass}
                      onChange={(e) => setStaffPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-sans tracking-widest"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-semibold p-4 rounded-2xl text-center animate-fade-in flex items-center justify-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:scale-[0.98] mt-2"
                >
                  Iniciar Sesión Segura <ArrowRight size={20} />
                </button>
              </form>
            )}

            <div className="mt-10 flex justify-center pt-8 border-t border-slate-100">
               <p className="text-center text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                  RTP Centro de Rehabilitación y Entrenamiento
                  <br/>
                  <span className="opacity-70 mt-1 block">Sistema Seguro KineFlow Pro</span>
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
