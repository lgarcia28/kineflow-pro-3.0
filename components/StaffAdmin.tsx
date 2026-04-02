import React, { useState } from 'react';
import { StaffMember, UserRole } from '../types';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Trash2, 
  X, 
  Check,
  User,
  Lock
} from 'lucide-react';

interface StaffAdminProps {
  staff: StaffMember[];
  onAddStaff: (member: StaffMember) => void;
  onDeleteStaff: (id: string) => void;
  onClose: () => void;
}

export const StaffAdmin: React.FC<StaffAdminProps> = ({ staff, onAddStaff, onDeleteStaff, onClose }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState<Partial<StaffMember>>({
    role: UserRole.RECEPCION
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMember.username && newMember.firstName && newMember.lastName && newMember.password) {
      onAddStaff({
        id: Math.random().toString(36).substr(2, 9),
        username: newMember.username,
        password: newMember.password,
        firstName: newMember.firstName,
        lastName: newMember.lastName,
        role: newMember.role as UserRole
      });
      setShowAddModal(false);
      setNewMember({ role: UserRole.RECEPCION });
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
              <Users className="text-white w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Gestión de Profesionales</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Administración de Accesos</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-primary-100"
            >
              <UserPlus size={16} /> Nuevo Usuario
            </button>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staff.map((member) => (
              <div 
                key={member.id}
                className="bg-slate-50 border border-slate-100 rounded-3xl p-6 flex items-center justify-between group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    member.role === UserRole.KINE ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    <Shield size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900">{member.firstName} {member.lastName}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">@{member.username}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span className={`text-[10px] font-black uppercase tracking-wider ${
                        member.role === UserRole.KINE ? 'text-indigo-600' : 'text-emerald-600'
                      }`}>
                        {member.role === UserRole.KINE ? 'Kinesiólogo' : 'Recepción'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onDeleteStaff(member.id)}
                  className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>

          {staff.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-slate-200 w-10 h-10" />
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No hay profesionales registrados</p>
            </div>
          )}
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900">Nuevo Profesional</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAdd} className="p-8 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre</label>
                    <input
                      required
                      type="text"
                      value={newMember.firstName || ''}
                      onChange={e => setNewMember({...newMember, firstName: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Apellido</label>
                    <input
                      required
                      type="text"
                      value={newMember.lastName || ''}
                      onChange={e => setNewMember({...newMember, lastName: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Usuario</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      required
                      type="text"
                      value={newMember.username || ''}
                      onChange={e => setNewMember({...newMember, username: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      required
                      type="password"
                      value={newMember.password || ''}
                      onChange={e => setNewMember({...newMember, password: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Rol</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewMember({...newMember, role: UserRole.KINE})}
                      className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider border-2 transition-all ${
                        newMember.role === UserRole.KINE 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                        : 'border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      Kinesiólogo
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMember({...newMember, role: UserRole.RECEPCION})}
                      className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider border-2 transition-all ${
                        newMember.role === UserRole.RECEPCION 
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-600' 
                        : 'border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      Recepción
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-4"
                >
                  <Check size={20} /> Crear Usuario
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
