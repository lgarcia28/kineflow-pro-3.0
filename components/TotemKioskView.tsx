import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';
import { Patient, CheckInStatus, StaffMember, StaffTimeLog, TenantSettings } from '../types';
import { parseMediaUrl } from '../utils/mediaUrl';
import { 
  CheckCircle, 
  UserCheck, 
  Clock, 
  Delete, 
  X, 
  Lock, 
  ShieldCheck, 
  Tv, 
  AlertCircle,
  LogOut,
  Scan,
  QrCode,
  Sparkles,
  MousePointerClick
} from 'lucide-react';

interface TotemKioskViewProps {
  patients: Patient[];
  staff: StaffMember[];
  timeLogs: StaffTimeLog[];
  onUpdatePatient: (patient: Patient) => void;
  onAddStaffTimeLog: (log: StaffTimeLog) => void;
  onUpdateStaffTimeLog: (log: StaffTimeLog) => void;
  tenantSettings?: TenantSettings;
  onExitKiosk?: () => void;
}

export const TotemKioskView: React.FC<TotemKioskViewProps> = ({
  patients,
  staff,
  timeLogs,
  onUpdatePatient,
  onAddStaffTimeLog,
  onUpdateStaffTimeLog,
  tenantSettings,
  onExitKiosk
}) => {
  // --- Estados de Autorización de Dispositivo ---
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    return localStorage.getItem('kineflow_totem_pin_auth') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // --- Estados del Tótem ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'PATIENT' | 'STAFF'>('PATIENT');
  const [dniInput, setDniInput] = useState('');
  const [welcomePatient, setWelcomePatient] = useState<Patient | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [staffNotification, setStaffNotification] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');

  const dniInputRef = useRef<HTMLInputElement>(null);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetIdleTimer = () => {
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    idleTimeoutRef.current = setTimeout(() => {
      setIsModalOpen(false);
      setDniInput('');
      setErrorMessage(null);
    }, 30000); // 30 segundos de inactividad vuelve a pantalla completa
  };

  const openCheckInModal = () => {
    setIsModalOpen(true);
    resetIdleTimer();
    setTimeout(() => {
      dniInputRef.current?.focus();
    }, 150);
  };

  const closeCheckInModal = () => {
    setIsModalOpen(false);
    setDniInput('');
    setErrorMessage(null);
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
  };

  // Reloj en vivo
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDateStr(now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Mantener Autofocus permanente en el input de DNI cuando el modal está abierto
  useEffect(() => {
    if (isAuthorized && isModalOpen && activeTab === 'PATIENT' && !welcomePatient) {
      const timer = setTimeout(() => {
        dniInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthorized, isModalOpen, activeTab, welcomePatient, dniInput]);

  // Listener Global de Teclado Físico / Pad Numérico / Lector QR USB
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isAuthorized || welcomePatient) return;

      // Si el modal está cerrado y presionan cualquier tecla (o pad numérico)
      if (!isModalOpen) {
        if (/^[0-9]$/.test(e.key)) {
          setDniInput(e.key);
        }
        setIsModalOpen(true);
        resetIdleTimer();
        return;
      }

      // Si el modal ya está abierto
      resetIdleTimer();

      if (e.key === 'Escape') {
        closeCheckInModal();
      } else if (e.key === 'Enter' && activeTab === 'PATIENT') {
        e.preventDefault();
        handlePatientCheckIn();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthorized, welcomePatient, isModalOpen, activeTab, dniInput, patients]);

  // --- Manejo de Autorización PIN de Dispositivo ---
  const handleVerifyDevicePin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const expectedPin = tenantSettings?.totemPin || '1234';
    if (pinInput === expectedPin) {
      localStorage.setItem('kineflow_totem_pin_auth', 'true');
      setIsAuthorized(true);
      setPinError(false);
      setPinInput('');
    } else {
      setPinError(true);
    }
  };

  const handleDeauthorizeDevice = () => {
    if (confirm('¿Desea desautorizar este dispositivo para que solicite el PIN nuevamente?')) {
      localStorage.removeItem('kineflow_totem_pin_auth');
      setIsAuthorized(false);
    }
  };

  // --- Procesar Check-In de Pacientes ---
  const handlePatientCheckIn = () => {
    const cleanDni = dniInput.trim().replace(/\D/g, '');
    if (!cleanDni) return;

    const patient = patients.find(p => p.dni === cleanDni);

    if (patient) {
      const today = new Date().toISOString().split('T')[0];
      const updatedHistory = [...(patient.history || []), `Presente en clínica (Tótem): ${new Date().toLocaleTimeString('es-AR')}`];

      const updatedPatient: Patient = {
        ...patient,
        checkInStatus: CheckInStatus.IN_ROOM,
        lastVisit: today,
        history: updatedHistory
      };

      onUpdatePatient(updatedPatient);
      setWelcomePatient(updatedPatient);
      setDniInput('');
      setErrorMessage(null);

      // Reproducir sonido de confirmación si está disponible
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (err) {}

      // Auto-cerrar mensaje de bienvenida después de 4 segundos y volver a pantalla completa
      setTimeout(() => {
        setWelcomePatient(null);
        setIsModalOpen(false);
      }, 4000);
    } else {
      setErrorMessage(`El DNI ${cleanDni} no figura en el sistema. Por favor acérquese a la recepción.`);
      setDniInput('');
      setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
    }
  };

  // Numpad Táctil en Pantalla
  const handleNumpadPress = (val: string) => {
    if (val === 'CLEAR') {
      setDniInput('');
    } else if (val === 'DELETE') {
      setDniInput(prev => prev.slice(0, -1));
    } else if (val === 'ENTER') {
      handlePatientCheckIn();
    } else {
      if (dniInput.length < 10) {
        setDniInput(prev => prev + val);
      }
    }
  };

  // --- Procesar Fichaje de Kinesiólogos (Clock-In / Clock-Out) ---
  const todayStr = new Date().toISOString().split('T')[0];

  const handleStaffClockAction = (member: StaffMember) => {
    const nowTimeStr = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Buscar si tiene un turno abierto hoy
    const openLog = timeLogs.find(l => l.staffId === member.id && l.status === 'OPEN' && l.date === todayStr);

    if (openLog) {
      // Marcar SALIDA (Clock-Out)
      const inParts = openLog.clockIn.split(':').map(Number);
      const outParts = nowTimeStr.split(':').map(Number);
      const inMinutes = inParts[0] * 60 + inParts[1];
      const outMinutes = outParts[0] * 60 + outParts[1];
      let diffMinutes = outMinutes - inMinutes;
      if (diffMinutes < 0) diffMinutes += 24 * 60;
      const totalHours = Math.round((diffMinutes / 60) * 100) / 100;

      const updatedLog: StaffTimeLog = {
        ...openLog,
        clockOut: nowTimeStr,
        totalHours: totalHours,
        status: 'CLOSED'
      };

      onUpdateStaffTimeLog(updatedLog);
      setStaffNotification(`Salida registrada para ${member.firstName} ${member.lastName} (${nowTimeStr}). Horas del turno: ${totalHours} hs.`);
    } else {
      // Marcar INGRESO (Clock-In)
      const newLog: StaffTimeLog = {
        id: `log_${member.id}_${Date.now()}`,
        tenantId: member.tenantId || 'default',
        staffId: member.id,
        staffName: `${member.firstName} ${member.lastName}`,
        date: todayStr,
        clockIn: nowTimeStr,
        status: 'OPEN'
      };

      onAddStaffTimeLog(newLog);
      setStaffNotification(`Ingreso registrado para ${member.firstName} ${member.lastName} (${nowTimeStr}). ¡Que tengas un gran turno!`);
    }

    setTimeout(() => {
      setStaffNotification(null);
    }, 4500);
  };

  // Video publicitario de fondo
  const bgVideoUrl = tenantSettings?.totemVideoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-athlete-stretching-and-preparing-to-run-41315-large.mp4';

  // --- PANTALLA 1: MODAL DE ACTIVACIÓN DE DISPOSITIVO (PIN) ---
  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 z-[1000] bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-primary-600/20 text-primary-400 rounded-2xl flex items-center justify-center mx-auto border border-primary-500/30 shadow-inner">
            <Lock size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Activar Tótem de Recepción</h2>
            <p className="text-xs font-medium text-slate-400 mt-2">
              Ingrese el PIN de seguridad de la clínica para autorizar este monitor de recepción.
            </p>
          </div>

          <form onSubmit={handleVerifyDevicePin} className="space-y-4">
            <div>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="PIN (Ej: 1234)"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full text-center text-2xl tracking-[0.5em] font-black bg-slate-950 border border-slate-800 text-white rounded-2xl py-4 focus:outline-none focus:border-primary-500 transition-all placeholder:text-slate-600 placeholder:tracking-normal placeholder:text-sm"
                autoFocus
              />
              {pinError && (
                <p className="text-xs font-bold text-rose-500 mt-2 flex items-center justify-center gap-1">
                  <AlertCircle size={14} /> PIN incorrecto. Intente nuevamente.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white font-black py-4 rounded-2xl text-sm uppercase tracking-wider shadow-lg shadow-primary-600/30 transition-all active:scale-95"
            >
              Autorizar Dispositivo
            </button>
          </form>

          {onExitKiosk && (
            <button
              type="button"
              onClick={onExitKiosk}
              className="text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors"
            >
              Volver al sistema principal
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- PANTALLA PRINCIPAL DEL TÓTEM (DISPOSITIVO AUTORIZADO) ---
  return (
    <div 
      onClick={!isModalOpen ? openCheckInModal : undefined}
      className={`fixed inset-0 z-[999] bg-slate-950 text-white overflow-hidden select-none flex flex-col font-sans ${
        !isModalOpen ? 'cursor-pointer' : ''
      }`}
    >
      {/* 1. Video de Fondo Publicitario en Bucle (Soporta YouTube y MP4) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {(() => {
          const media = parseMediaUrl(bgVideoUrl);
          const ytMatch = bgVideoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/);
          const ytId = ytMatch ? ytMatch[1] : null;

          if (media.type === 'youtube' && ytId) {
            return (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1`}
                className="w-full h-full object-cover scale-[1.35] pointer-events-none border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                title="YouTube Totem Background"
              />
            );
          }

          return (
            <video
              key={bgVideoUrl}
              src={bgVideoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          );
        })()}
        {/* Overlay: Sutil cuando está en video, más oscuro cuando el modal está abierto */}
        <div className={`absolute inset-0 transition-all duration-500 ${
          isModalOpen 
            ? 'bg-slate-950/75 backdrop-blur-[3px]' 
            : 'bg-gradient-to-t from-black/80 via-transparent to-black/30'
        }`} />
      </div>

      {/* 2. Barra Superior Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/10 bg-slate-950/30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-600/40 border border-primary-400/30">
            <Tv size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wider uppercase bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              KineFlow Pro
            </h1>
            <p className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Tótem de Auto-Atención Activo
            </p>
          </div>
        </div>

        {/* Reloj y Fecha */}
        <div className="text-right">
          <div className="text-2xl font-black tracking-wider text-white font-mono">{currentTime}</div>
          <div className="text-[11px] font-bold text-slate-300 capitalize">{currentDateStr}</div>
        </div>

        {/* Botones de Control Tótem */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleDeauthorizeDevice(); }}
            title="Desautorizar PIN de esta PC"
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-slate-300 transition-all border border-white/10"
          >
            <ShieldCheck size={18} />
          </button>
          {onExitKiosk && (
            <button
              onClick={(e) => { e.stopPropagation(); onExitKiosk(); }}
              title="Salir del Modo Tótem"
              className="p-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl transition-all border border-rose-500/30"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </header>

      {/* 3. MODO REPOSO: BOTÓN FLOTANTE LLAMATIVO EN PARTE INFERIOR */}
      {!isModalOpen && (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-end pb-12 md:pb-16 pointer-events-none animate-in fade-in duration-300">
          <button
            onClick={(e) => { e.stopPropagation(); openCheckInModal(); }}
            className="pointer-events-auto px-8 py-4 md:px-10 md:py-5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white rounded-full font-black text-base md:text-xl uppercase tracking-wider shadow-2xl shadow-primary-500/60 backdrop-blur-md border-2 border-white/40 flex items-center gap-3 animate-bounce hover:scale-105 active:scale-95 transition-all"
          >
            <Sparkles size={24} className="text-amber-300 animate-spin" />
            <span>Toca la pantalla para dar el Presente</span>
          </button>
          <p className="text-xs md:text-sm font-bold text-white/90 mt-3 drop-shadow-lg">
            O presiona cualquier número en el teclado para ingresar
          </p>
        </div>
      )}

      {/* 4. MODO INTERACTIVO: MODAL DE INGRESO (Se abre al tocar o presionar tecla) */}
      {isModalOpen && (
        <main 
          onClick={(e) => { e.stopPropagation(); resetIdleTimer(); }}
          className="relative z-20 flex-1 flex items-center justify-center p-6"
        >
          <div className="max-w-xl w-full bg-slate-900/90 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] p-8 shadow-2xl shadow-black/90 space-y-6 animate-in zoom-in-95 duration-200 relative">
            
            {/* Botón Volver / Cerrar */}
            <button
              onClick={closeCheckInModal}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full transition-all border border-white/10 flex items-center gap-1 text-xs font-bold px-3 py-1.5"
              title="Volver al video"
            >
              <X size={16} /> <span>Volver</span>
            </button>
            
            {/* Tabs Navegación */}
            <div className="flex bg-slate-950/80 p-1.5 rounded-2xl border border-white/10 max-w-sm">
              <button
                onClick={() => { setActiveTab('PATIENT'); resetIdleTimer(); }}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'PATIENT'
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck size={16} /> Pacientes
              </button>
              <button
                onClick={() => { setActiveTab('STAFF'); resetIdleTimer(); }}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'STAFF'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock size={16} /> Fichar Staff
              </button>
            </div>

          {/* CONTENIDO TAB 1: PACIENTES */}
          {activeTab === 'PATIENT' && (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-black text-white">¡Hola! Danos tu Presente</h2>
                <p className="text-xs text-slate-300 font-medium">
                  Ingresa tu número de DNI para registrar tu llegada a la clínica
                </p>
              </div>

              {/* Input DNI Principal */}
              <div className="relative">
                <input
                  ref={dniInputRef}
                  type="text"
                  inputMode="numeric"
                  placeholder="Escribe tu DNI aquí..."
                  value={dniInput}
                  onChange={(e) => setDniInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-3xl font-black bg-slate-950 border-2 border-primary-500/50 focus:border-primary-400 text-white rounded-2xl py-4 shadow-inner outline-none transition-all placeholder:text-slate-600 placeholder:text-lg"
                />
              </div>

              {/* Teclado Táctil Numérico (Numpad) */}
              <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLEAR', '0', 'DELETE'].map((key) => (
                  <button
                    key={key}
                    onClick={() => handleNumpadPress(key)}
                    className={`py-3.5 rounded-2xl font-black text-lg transition-all active:scale-95 flex items-center justify-center ${
                      key === 'CLEAR'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 text-xs uppercase'
                        : key === 'DELETE'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-white border border-white/10 shadow-md'
                    }`}
                  >
                    {key === 'DELETE' ? <Delete size={20} /> : key === 'CLEAR' ? 'Limpiar' : key}
                  </button>
                ))}
              </div>

              {/* Botón Ingresar */}
              <button
                onClick={handlePatientCheckIn}
                disabled={!dniInput.trim()}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-black py-4 rounded-2xl text-base uppercase tracking-wider shadow-xl shadow-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle size={20} /> Dar Presente
              </button>

              {/* Mensaje de Error */}
              {errorMessage && (
                <div className="p-4 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-center text-xs font-bold text-rose-300 animate-in fade-in duration-200 flex items-center justify-center gap-2">
                  <AlertCircle size={18} />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* CONTENIDO TAB 2: FICHAJE STAFF MEDIANTE QR */}
          {activeTab === 'STAFF' && (
            <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-white">Fichaje de Kinesiólogos / Staff</h2>
                <p className="text-xs text-slate-300 font-medium">
                  Abre la App de Kineflow en tu celular y escanea este código para registrar tu <strong className="text-emerald-400">Ingreso</strong> o <strong className="text-indigo-400">Egreso</strong>.
                </p>
              </div>

              {/* Código QR Blanco Impecable con bordes redondeados */}
              <div className="p-5 bg-white rounded-3xl inline-block shadow-2xl shadow-black/90 border-4 border-indigo-500/40 mx-auto">
                <QRCode
                  value={`kineflow-clockin:${tenantSettings?.id || 'default_tenant'}`}
                  size={200}
                  className="h-auto max-w-full"
                  viewBox="0 0 256 256"
                />
              </div>

              <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/10 max-w-sm mx-auto flex items-center justify-center gap-3 text-xs text-slate-300 font-medium">
                <Scan size={20} className="text-indigo-400 shrink-0 animate-pulse" />
                <span className="text-left leading-tight">
                  En tu celular, presiona el botón <strong className="text-white">"Fichar Turno (QR)"</strong> y apunta la cámara a esta pantalla.
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
      )}

      {/* 4. MODAL FULLSCREEN DE BIENVENIDA A PACIENTE (4 Segundos) */}
      {welcomePatient && (
        <div className="fixed inset-0 z-[1100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="max-w-lg w-full bg-slate-900 border-2 border-emerald-500/60 rounded-[3rem] p-10 text-center space-y-6 shadow-2xl shadow-emerald-500/30">
            <div className="w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-400/40 shadow-inner animate-bounce">
              <CheckCircle size={56} />
            </div>

            <div className="space-y-2">
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-emerald-500/30">
                ¡Presente Registrado!
              </span>
              <h2 className="text-3xl font-black text-white pt-2">
                ¡Hola, {welcomePatient.firstName} {welcomePatient.lastName}!
              </h2>
              <p className="text-sm font-medium text-slate-300 leading-relaxed pt-1">
                Tu llegada ha sido notificada al equipo de kinesiología. Por favor toma asiento en la sala de espera.
              </p>
            </div>

            <div className="pt-2">
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full animate-[progress_4s_linear_forwards]" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
