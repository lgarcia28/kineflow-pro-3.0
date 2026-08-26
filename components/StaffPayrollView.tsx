import React, { useState } from 'react';
import { StaffMember, StaffTimeLog, TenantSettings } from '../types';
import { 
  Clock, 
  DollarSign, 
  Calendar, 
  Users, 
  Download, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Settings,
  X,
  UserCheck,
  Tv
} from 'lucide-react';

interface StaffPayrollViewProps {
  staff: StaffMember[];
  timeLogs: StaffTimeLog[];
  tenantSettings?: TenantSettings;
  onUpdateStaffMember: (member: StaffMember) => void;
  onAddStaffTimeLog: (log: StaffTimeLog) => void;
  onUpdateStaffTimeLog: (log: StaffTimeLog) => void;
  onDeleteStaffTimeLog: (id: string) => void;
  onUpdateTenantSettings?: (settings: Partial<TenantSettings>) => void;
}

export const StaffPayrollView: React.FC<StaffPayrollViewProps> = ({
  staff,
  timeLogs,
  tenantSettings,
  onUpdateStaffMember,
  onAddStaffTimeLog,
  onUpdateStaffTimeLog,
  onDeleteStaffTimeLog,
  onUpdateTenantSettings
}) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [detailStaff, setDetailStaff] = useState<StaffMember | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAddLogModal, setShowAddLogModal] = useState(false);

  // Formulario Nuevo Fichaje Manual
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualClockIn, setManualClockIn] = useState('08:00');
  const [manualClockOut, setManualClockOut] = useState('12:00');
  const [manualStaffId, setManualStaffId] = useState('');

  // Formulario Configuración de Clínica / Tótem
  const [totemPin, setTotemPin] = useState(tenantSettings?.totemPin || '1234');
  const [totemVideoUrl, setTotemVideoUrl] = useState(tenantSettings?.totemVideoUrl || '');

  const monthsList = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Filtrar logs del mes y año seleccionados
  const filteredLogs = timeLogs.filter(log => {
    if (!log.date) return false;
    const [y, m] = log.date.split('-').map(Number);
    return y === selectedYear && (m - 1) === selectedMonth;
  });

  // Totales generales
  const totalHoursMonth = filteredLogs.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);

  const calculateStaffTotalPay = (member: StaffMember) => {
    const memberLogs = filteredLogs.filter(l => l.staffId === member.id);
    const memberHours = memberLogs.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);
    const rate = member.hourlyRate || 0;
    return memberHours * rate;
  };

  const totalPayrollMonth = staff.reduce((acc, curr) => acc + calculateStaffTotalPay(curr), 0);

  // Guardar Tarifa por Hora de Staff
  const handleHourlyRateChange = (member: StaffMember, rate: number) => {
    onUpdateStaffMember({
      ...member,
      hourlyRate: rate
    });
  };

  // Guardar Configuración de Tótem
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateTenantSettings) {
      onUpdateTenantSettings({
        totemPin,
        totemVideoUrl
      });
    }
    setShowConfigModal(false);
  };

  // Agregar Fichaje Manual
  const handleAddManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStaffId) return;

    const targetStaff = staff.find(s => s.id === manualStaffId);
    if (!targetStaff) return;

    const inParts = manualClockIn.split(':').map(Number);
    const outParts = manualClockOut.split(':').map(Number);
    const inMin = inParts[0] * 60 + inParts[1];
    const outMin = outParts[0] * 60 + outParts[1];
    let diff = outMin - inMin;
    if (diff < 0) diff += 24 * 60;
    const totalHours = Math.round((diff / 60) * 100) / 100;

    const newLog: StaffTimeLog = {
      id: `manual_${Date.now()}`,
      tenantId: targetStaff.tenantId || 'default',
      staffId: targetStaff.id,
      staffName: `${targetStaff.firstName} ${targetStaff.lastName}`,
      date: manualDate,
      clockIn: `${manualClockIn}:00`,
      clockOut: `${manualClockOut}:00`,
      totalHours: totalHours,
      status: 'CLOSED',
      notes: 'Ingreso manual por administración'
    };

    onAddStaffTimeLog(newLog);
    setShowAddLogModal(false);
  };

  // Exportar reporte a CSV
  const handleExportCSV = () => {
    const headers = ['Kinesiologo', 'Dias Trabajados', 'Horas Totales', 'Tarifa Hora ($)', 'Total a Pagar ($)'];
    const rows = staff.map(s => {
      const sLogs = filteredLogs.filter(l => l.staffId === s.id);
      const uniqueDays = new Set(sLogs.map(l => l.date)).size;
      const sHours = sLogs.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);
      const rate = s.hourlyRate || 0;
      const totalPay = sHours * rate;
      return [
        `"${s.firstName} ${s.lastName}"`,
        uniqueDays,
        sHours.toFixed(2),
        rate,
        totalPay.toFixed(2)
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Liquidacion_Staff_${monthsList[selectedMonth]}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header y Controles */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Clock size={22} className="text-primary-600" /> Control de Asistencia y Liquidaciones
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Registro de horas fichadas por kinesiólogos y cálculo mensual de honorarios.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Selector de Mes */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-slate-100 border border-slate-200 text-slate-900 text-xs font-black rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
          >
            {monthsList.map((m, idx) => (
              <option key={idx} value={idx}>{m}</option>
            ))}
          </select>

          {/* Selector de Año */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-slate-100 border border-slate-200 text-slate-900 text-xs font-black rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Configuración Tótem */}
          <button
            onClick={() => setShowConfigModal(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all border border-slate-200"
          >
            <Settings size={15} /> Ajustes Tótem
          </button>

          {/* Fichaje Manual */}
          <button
            onClick={() => setShowAddLogModal(true)}
            className="bg-primary-50 hover:bg-primary-100 text-primary-700 px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all border border-primary-200"
          >
            <Plus size={15} /> Fichaje Manual
          </button>

          {/* Exportar */}
          <button
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Download size={15} /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white p-5 rounded-3xl shadow-lg shadow-primary-600/20 space-y-1">
          <div className="flex items-center justify-between opacity-80 text-xs font-black uppercase tracking-widest">
            <span>Total Horas del Mes</span>
            <Clock size={18} />
          </div>
          <p className="text-3xl font-black">{totalHoursMonth.toFixed(1)} <span className="text-lg font-medium opacity-80">hs</span></p>
          <p className="text-[11px] opacity-75 font-medium">{monthsList[selectedMonth]} {selectedYear}</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-black uppercase tracking-widest">
            <span>Total a Liquidar</span>
            <DollarSign size={18} className="text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-slate-900">${totalPayrollMonth.toLocaleString('es-AR')}</p>
          <p className="text-[11px] text-slate-400 font-medium">Suma total del staff activo</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-black uppercase tracking-widest">
            <span>Kinesiólogos Activos</span>
            <Users size={18} className="text-indigo-500" />
          </div>
          <p className="text-3xl font-black text-slate-900">{staff.length}</p>
          <p className="text-[11px] text-slate-400 font-medium">Registrados en la clínica</p>
        </div>
      </div>

      {/* Tabla de Liquidación por Kinesiólogo */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <UserCheck size={16} className="text-primary-600" /> Resumen de Honorarios y Horas Fichadas
          </h3>
          <span className="text-[11px] font-bold text-slate-400">
            {monthsList[selectedMonth]} {selectedYear}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="py-3.5 px-4">Kinesiólogo / Staff</th>
                <th className="py-3.5 px-4 text-center">Días Asistidos</th>
                <th className="py-3.5 px-4 text-center">Horas Totales</th>
                <th className="py-3.5 px-4 text-center">Tarifa x Hora ($)</th>
                <th className="py-3.5 px-4 text-right">Total a Pagar ($)</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">
                    No hay miembros del staff cargados.
                  </td>
                </tr>
              ) : (
                staff.map((member) => {
                  const memberLogs = filteredLogs.filter(l => l.staffId === member.id);
                  const uniqueDays = new Set(memberLogs.map(l => l.date)).size;
                  const memberHours = memberLogs.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);
                  const rate = member.hourlyRate || 0;
                  const totalPay = memberHours * rate;

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-black text-slate-900">{member.firstName} {member.lastName}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{member.role}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {uniqueDays} días
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                          {memberHours.toFixed(1)} hs
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-slate-400 font-bold">$</span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={member.hourlyRate || ''}
                            onChange={(e) => handleHourlyRateChange(member, parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-24 text-center font-black text-xs bg-slate-50 border border-slate-200 rounded-lg p-1 focus:bg-white focus:border-primary-500 outline-none"
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-sm">
                          ${totalPay.toLocaleString('es-AR')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setDetailStaff(member)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all border border-slate-200"
                        >
                          Ver Fichajes ({memberLogs.length})
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETALLE DE FICHAJES POR KINESIÓLOGO */}
      {detailStaff && (
        <div className="fixed inset-0 z-[500] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg">
                  Fichajes de {detailStaff.firstName} {detailStaff.lastName}
                </h3>
                <p className="text-xs text-slate-400">
                  {monthsList[selectedMonth]} {selectedYear}
                </p>
              </div>
              <button
                onClick={() => setDetailStaff(null)}
                className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {filteredLogs.filter(l => l.staffId === detailStaff.id).length === 0 ? (
                <p className="text-center py-8 text-slate-400 font-bold text-xs">
                  No hay fichajes registrados para este profesional en {monthsList[selectedMonth]}.
                </p>
              ) : (
                filteredLogs
                  .filter(l => l.staffId === detailStaff.id)
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((log) => (
                    <div
                      key={log.id}
                      className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="font-black text-slate-900 text-sm">{log.date}</p>
                        <p className="text-xs text-slate-500 font-medium">
                          Ingreso: <strong className="text-slate-800">{log.clockIn}</strong> — 
                          Salida: <strong className="text-slate-800">{log.clockOut || 'En curso...'}</strong>
                        </p>
                        {log.notes && <p className="text-[10px] text-slate-400 italic mt-0.5">{log.notes}</p>}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-black text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                          {log.totalHours ? `${log.totalHours} hs` : 'En curso'}
                        </span>
                        <button
                          onClick={() => {
                            if (confirm('¿Eliminar este fichaje?')) {
                              onDeleteStaffTimeLog(log.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Eliminar registro"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setDetailStaff(null)}
                className="bg-slate-900 text-white font-black text-xs px-6 py-2.5 rounded-xl uppercase tracking-wider shadow-md hover:bg-slate-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURACIÓN TÓTEM Y PIN */}
      {showConfigModal && (
        <div className="fixed inset-0 z-[500] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-black text-base flex items-center gap-2">
                <Tv size={18} className="text-primary-400" /> Ajustes del Tótem de la Clínica
              </h3>
              <button onClick={() => setShowConfigModal(false)} className="p-1.5 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="p-6 space-y-4 text-xs font-medium">
              <div>
                <label className="block font-black text-slate-700 mb-1">
                  PIN de Activación del Tótem (Dispositivo Autorizado)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={totemPin}
                  onChange={(e) => setTotemPin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black text-slate-900 focus:bg-white focus:border-primary-500 outline-none"
                  placeholder="Ej: 1234"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Este PIN se solicitará la primera vez que se abra el enlace `/totem` en la PC de recepción.
                </p>
              </div>

              <div>
                <label className="block font-black text-slate-700 mb-1">
                  URL del Video Publicitario de Fondo
                </label>
                <input
                  type="url"
                  value={totemVideoUrl}
                  onChange={(e) => setTotemVideoUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-900 focus:bg-white focus:border-primary-500 outline-none"
                  placeholder="https://servidor.com/video_promocional.mp4"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Enlace directo a archivo de video MP4. Si se deja en blanco, usará el video deportivo por defecto.
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-black uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-black uppercase tracking-wider shadow-lg shadow-primary-600/30"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FICHAJE MANUAL */}
      {showAddLogModal && (
        <div className="fixed inset-0 z-[500] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-black text-base flex items-center gap-2">
                <Plus size={18} className="text-emerald-400" /> Registrar Turno Manual
              </h3>
              <button onClick={() => setShowAddLogModal(false)} className="p-1.5 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddManualLog} className="p-6 space-y-4 text-xs font-medium">
              <div>
                <label className="block font-black text-slate-700 mb-1">Kinesiólogo / Staff</label>
                <select
                  value={manualStaffId}
                  onChange={(e) => setManualStaffId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-900 focus:bg-white focus:border-primary-500 outline-none"
                >
                  <option value="">-- Seleccionar Profesional --</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-black text-slate-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-900 focus:bg-white focus:border-primary-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-700 mb-1">Hora Ingreso</label>
                  <input
                    type="time"
                    value={manualClockIn}
                    onChange={(e) => setManualClockIn(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-900 focus:bg-white focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-black text-slate-700 mb-1">Hora Salida</label>
                  <input
                    type="time"
                    value={manualClockOut}
                    onChange={(e) => setManualClockOut(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-900 focus:bg-white focus:border-primary-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddLogModal(false)}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-black uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-black uppercase tracking-wider shadow-lg shadow-emerald-600/30"
                >
                  Guardar Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
