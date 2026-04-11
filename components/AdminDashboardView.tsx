import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, secondaryAuth } from '../firebase';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { useAuthStore } from '../store/authStore';
import { UserRole, StaffMember, Patient, CLINICAL_ACTIVITIES, STAFF_COLORS } from '../types';
import { Users, Activity, Target, Settings, Building2, UserPlus, Shield, X, MoreVertical, Trash2 } from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const { user } = useAuthStore();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [newStaff, setNewStaff] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    role: UserRole.KINE as UserRole,
    activities: [] as string[],
    themeColor: 'blue'
  });

  const tenantId = user?.tenantId || 'default_tenant';

  const fetchData = async () => {
    if (!db || !user) return;
    setLoading(true);
    try {
      // 1. Fetch Staff for this tenant
      const staffQ = query(collection(db, 'staff'), where('tenantId', '==', tenantId));
      const staffSnap = await getDocs(staffQ);
      const staffData: StaffMember[] = [];
      staffSnap.forEach(doc => staffData.push(doc.data() as StaffMember));
      setStaffList(staffData);

      // 2. Fetch total patients for this tenant
      const patientsQ = query(collection(db, 'patients'), where('tenantId', '==', tenantId));
      const patientsSnap = await getDocs(patientsQ);
      setTotalPatients(patientsSnap.size);

    } catch (e: any) {
      console.error("Error fetching admin data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tenantId]);

  const generateEmail = (username: string, role: string) => {
    return `${username.toLowerCase().trim()}@staff.kineflow.com`; // Usamos dominio generico porque el tenant restringe los datos igual.
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!newStaff.firstName || !newStaff.lastName || !newStaff.username || !newStaff.password) {
      setError("Todos los campos son obligatorios.");
      setIsSubmitting(false);
      return;
    }

    if (newStaff.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (!secondaryAuth || !db) throw new Error("Firebase no inicializado");

      const email = generateEmail(newStaff.username, newStaff.role);
      
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email, newStaff.password);
      const newUid = cred.user.uid;

      const userDoc: StaffMember = {
        id: newUid,
        uid: newUid,
        tenantId: tenantId,
        firstName: newStaff.firstName,
        lastName: newStaff.lastName,
        username: newStaff.username,
        role: newStaff.role,
        password: newStaff.password, // Guardado solo de referencia inicial, Authentication lo maneja seguro.
        activities: newStaff.role === UserRole.KINE ? newStaff.activities : undefined,
        themeColor: newStaff.role === UserRole.KINE ? newStaff.themeColor : undefined
      };

      await setDoc(doc(db, 'staff', newUid), userDoc);

      setNewStaff({
        firstName: '',
        lastName: '',
        username: '',
        password: '',
        role: UserRole.KINE,
        activities: [],
        themeColor: 'blue'
      });
      setShowAddModal(false);
      fetchData(); // Refresh list

    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/email-already-in-use') {
        setError('Ese nombre de usuario ya está registrado en la red mundial.');
      } else {
        setError('Hubo un error al crear el empleado: ' + e.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar el acceso a este empleado?")) return;
    
    // Note: Deleting Auth users client-side is technically restricted, so here we just delete 
    // their Firestore profile which revokes their access to the app's collections.
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'staff', staffId));
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Error al borrar empleado.");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto pb-24">
      <div className="bg-indigo-900 text-white pt-12 pb-24 px-8 md:px-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-pulse"></div>
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-800/50 rounded-full border border-indigo-700/50 backdrop-blur-sm mb-4">
              <Building2 size={14} className="text-indigo-300"/>
              <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Panel Institucional</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Configuración de<br/><span className="text-indigo-400">Personal SaaS</span></h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-12 -mt-12 relative z-20 space-y-8 animate-slide-up">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Users size={32} />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900">{totalPatients}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pacientes Registrados</div>
            </div>
          </div>
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Shield size={32} />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900">{staffList.length - 1}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Empleados Activos</div>
            </div>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Equipo de Trabajo</h2>
              <p className="text-sm font-medium text-slate-500">Administra accesos y roles (Kinesiología/Recepción).</p>
            </div>
            <button onClick={() => setShowAddModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-md shadow-indigo-200">
              <UserPlus size={18} />
              <span className="hidden sm:inline">Nuevo Empleado</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Empleado</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Rol Sistema</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Usuario Login</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                          {staff.firstName[0]}{staff.lastName[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{staff.firstName} {staff.lastName}</div>
                          <div className="text-xs text-slate-400">{staff.id === user?.uid ? 'Tú (Propietario)' : 'Empleado'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        staff.role === UserRole.TENANT_ADMIN ? 'bg-indigo-100 text-indigo-700' :
                        staff.role === UserRole.KINE ? 'bg-primary-100 text-primary-700' :
                        'bg-teal-100 text-teal-700'
                      }`}>
                        {staff.role}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-slate-500">
                      {staff.username}
                    </td>
                    <td className="px-8 py-5 text-right">
                      {staff.id !== user?.uid && (
                        <button onClick={() => handleDeleteStaff(staff.id)} className="w-10 h-10 inline-flex border border-slate-200 items-center justify-center rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative animate-slide-up">
            <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition-colors">
              <X size={20} />
            </button>
            <h3 className="text-2xl font-black text-slate-900 mb-1">Nuevo Empleado</h3>
            <p className="text-sm font-medium text-slate-500 mb-6">El empleado heredará tu ID de institución de forma segura.</p>

            {error && (
              <div className="mb-6 bg-red-50 text-red-600 border border-red-200 text-xs font-bold p-3 rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 ml-1">Nombre</label>
                  <input required value={newStaff.firstName} onChange={e => setNewStaff({...newStaff, firstName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold px-5 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="Juan"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 ml-1">Apellido</label>
                  <input required value={newStaff.lastName} onChange={e => setNewStaff({...newStaff, lastName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold px-5 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="Pérez"/>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 ml-1">Rol</label>
                <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-[1.25rem]">
                  <button type="button" onClick={() => setNewStaff({...newStaff, role: UserRole.KINE})} className={`py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${newStaff.role === UserRole.KINE ? 'bg-white text-indigo-600' : 'text-slate-500 hover:bg-slate-200/50'}`}>Kinesiólogo</button>
                  <button type="button" onClick={() => setNewStaff({...newStaff, role: UserRole.RECEPCION})} className={`py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${newStaff.role === UserRole.RECEPCION ? 'bg-white text-teal-600' : 'text-slate-500 hover:bg-slate-200/50'}`}>Recepcionista</button>
                </div>
              </div>

              {newStaff.role === UserRole.KINE && (
                <div className="space-y-4 pt-2 pb-2 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 ml-1">Color del Perfil en Calendario</label>
                    <div className="flex gap-3">
                      {STAFF_COLORS.map(color => (
                        <button 
                          key={color.id} 
                          type="button" 
                          onClick={() => setNewStaff({...newStaff, themeColor: color.id})}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${color.class.split(' ')[0]} ${newStaff.themeColor === color.id ? 'border-indigo-500 scale-110 shadow-md ring-2 ring-indigo-200 ring-offset-1' : 'border-transparent opacity-70 hover:opacity-100'}`}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-3 ml-1">Actividades que realiza</label>
                    <div className="grid grid-cols-2 gap-2">
                      {CLINICAL_ACTIVITIES.map(act => (
                        <label key={act.id} className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-colors ${newStaff.activities.includes(act.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                          <input 
                            type="checkbox" 
                            className="hidden"
                            checked={newStaff.activities.includes(act.id)}
                            onChange={(e) => {
                              const newActs = e.target.checked 
                                ? [...newStaff.activities, act.id]
                                : newStaff.activities.filter(a => a !== act.id);
                              setNewStaff({...newStaff, activities: newActs});
                            }}
                          />
                          <div className={`w-4 h-4 rounded shadow-sm border flex items-center justify-center flex-shrink-0 ${newStaff.activities.includes(act.id) ? 'bg-indigo-500 border-indigo-600' : 'bg-white border-slate-300'}`}>
                            {newStaff.activities.includes(act.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <span className={`text-[10px] sm:text-xs font-bold leading-tight ${newStaff.activities.includes(act.id) ? 'text-indigo-900' : 'text-slate-600'}`}>{act.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 ml-1">Usuario de Login</label>
                <input required value={newStaff.username} onChange={e => setNewStaff({...newStaff, username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold px-5 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="Ej: kinejuan"/>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 ml-1">Contraseña Inicial</label>
                <input required minLength={6} value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold px-5 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="Mínimo 6 caracteres"/>
              </div>

              <div className="pt-4 mt-8 border-t border-slate-100">
                <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex justify-center items-center gap-2">
                  {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Crear Acceso Empleado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
