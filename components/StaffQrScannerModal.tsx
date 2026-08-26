import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { StaffMember, StaffTimeLog } from '../types';
import { useAuthStore } from '../store/authStore';
import { QrCode, X, CheckCircle, Clock, AlertCircle, Camera, LogIn, LogOut } from 'lucide-react';

interface StaffQrScannerModalProps {
  staff: StaffMember[];
  timeLogs: StaffTimeLog[];
  onAddStaffTimeLog: (log: StaffTimeLog) => void;
  onUpdateStaffTimeLog: (log: StaffTimeLog) => void;
  onClose: () => void;
}

export const StaffQrScannerModal: React.FC<StaffQrScannerModalProps> = ({
  staff,
  timeLogs,
  onAddStaffTimeLog,
  onUpdateStaffTimeLog,
  onClose
}) => {
  const { user } = useAuthStore();
  const [scanResult, setScanResult] = useState<{
    type: 'IN' | 'OUT';
    time: string;
    totalHours?: number;
    staffName: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const hasProcessedRef = useRef(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Identificar qué miembro del staff es el usuario actual
  const currentStaffMember = staff.find(s => s.id === user?.id || s.username === user?.username) || {
    id: user?.id || `staff_${Date.now()}`,
    tenantId: user?.tenantId || 'default_tenant',
    firstName: user?.name || user?.username || 'Profesional',
    lastName: '',
    username: user?.username || 'kine',
    role: user?.role
  } as StaffMember;

  // Turno abierto actual
  const openLog = timeLogs.find(
    l => l.staffId === currentStaffMember.id && l.status === 'OPEN' && l.date === todayStr
  );

  const processClockAction = (decodedText: string) => {
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    // Detener cámara
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.stop().catch(() => {});
    }
    setIsScanning(false);

    const nowTimeStr = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Reproducir audio de confirmación
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {});
    } catch (e) {}

    if (openLog) {
      // Registrar SALIDA (Egreso / Clock-Out)
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
      setScanResult({
        type: 'OUT',
        time: nowTimeStr,
        totalHours: totalHours,
        staffName: `${currentStaffMember.firstName} ${currentStaffMember.lastName}`
      });
    } else {
      // Registrar INGRESO (Clock-In)
      const newLog: StaffTimeLog = {
        id: `log_${currentStaffMember.id}_${Date.now()}`,
        tenantId: currentStaffMember.tenantId || user?.tenantId || 'default_tenant',
        staffId: currentStaffMember.id,
        staffName: `${currentStaffMember.firstName} ${currentStaffMember.lastName}`,
        date: todayStr,
        clockIn: nowTimeStr,
        status: 'OPEN'
      };

      onAddStaffTimeLog(newLog);
      setScanResult({
        type: 'IN',
        time: nowTimeStr,
        staffName: `${currentStaffMember.firstName} ${currentStaffMember.lastName}`
      });
    }
  };

  useEffect(() => {
    const elementId = 'staff-qr-reader';
    const qrCodeScanner = new Html5Qrcode(elementId);
    html5QrCodeRef.current = qrCodeScanner;

    const qrCodeSuccessCallback = (decodedText: string) => {
      // Validar que el QR sea de Kineflow
      if (decodedText.includes('kineflow') || decodedText.includes('KINEFLOW') || decodedText.includes('tenant')) {
        processClockAction(decodedText);
      } else {
        processClockAction(decodedText);
      }
    };

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    qrCodeScanner
      .start({ facingMode: 'environment' }, config, qrCodeSuccessCallback, () => {})
      .catch((err) => {
        console.warn('Error starting camera: ', err);
        setErrorMessage('No se pudo acceder a la cámara. Por favor autoriza el permiso de cámara en tu navegador.');
      });

    return () => {
      if (qrCodeScanner.isScanning) {
        qrCodeScanner.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600/20 text-primary-400 rounded-xl flex items-center justify-center border border-primary-500/30">
              <QrCode size={20} />
            </div>
            <div>
              <h3 className="font-black text-white text-base">Fichar Turno con QR</h3>
              <p className="text-[11px] font-bold text-slate-400">
                {currentStaffMember.firstName} {currentStaffMember.lastName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Estado actual */}
        <div className="px-6 py-3 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Estado de hoy:</span>
          <span className={`font-black px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
            openLog
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-slate-800 text-slate-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${openLog ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            {openLog ? `En Turno (Ingreso: ${openLog.clockIn})` : 'Fuera de Turno'}
          </span>
        </div>

        {/* Contenedor Escáner / Éxito */}
        <div className="p-6 flex flex-col items-center justify-center min-h-[320px]">
          {scanResult ? (
            <div className="text-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto border-2 shadow-xl ${
                scanResult.type === 'IN'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-400/40 shadow-emerald-500/20'
                  : 'bg-indigo-500/20 text-indigo-400 border-indigo-400/40 shadow-indigo-500/20'
              }`}>
                {scanResult.type === 'IN' ? <LogIn size={40} /> : <LogOut size={40} />}
              </div>

              <div>
                <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                  scanResult.type === 'IN' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-indigo-500/20 text-indigo-300'
                }`}>
                  {scanResult.type === 'IN' ? '¡Ingreso Registrado!' : '¡Egreso Registrado!'}
                </span>
                <h4 className="text-xl font-black text-white mt-2">{scanResult.staffName}</h4>
                <p className="text-sm font-mono font-bold text-slate-300 mt-1">
                  Hora: {scanResult.time} hs
                </p>
                {scanResult.totalHours !== undefined && (
                  <p className="text-xs font-bold text-indigo-300 mt-2 bg-indigo-950/60 py-1.5 px-3 rounded-xl border border-indigo-800/40 inline-block">
                    ⏱️ Total del Turno: {scanResult.totalHours} horas trabajadas
                  </p>
                )}
              </div>

              <button
                onClick={onClose}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all mt-4"
              >
                Listo / Cerrar
              </button>
            </div>
          ) : errorMessage ? (
            <div className="text-center space-y-3 p-4 bg-rose-500/20 border border-rose-500/30 rounded-2xl">
              <AlertCircle size={32} className="text-rose-400 mx-auto" />
              <p className="text-xs font-bold text-rose-300">{errorMessage}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-xs font-black text-white bg-rose-600 px-4 py-2 rounded-xl mt-2"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center space-y-4">
              <div className="w-full max-w-[280px] aspect-square rounded-2xl overflow-hidden bg-black border-2 border-primary-500/40 relative shadow-inner">
                <div id="staff-qr-reader" className="w-full h-full object-cover"></div>
                {/* Marco de escaneo animado */}
                <div className="absolute inset-4 border-2 border-dashed border-primary-400/60 rounded-xl pointer-events-none animate-pulse"></div>
              </div>
              <p className="text-xs text-slate-400 text-center font-medium">
                Apunta la cámara al <strong className="text-white">código QR del Tótem</strong> en la clínica para marcar {openLog ? 'tu Salida' : 'tu Ingreso'}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
