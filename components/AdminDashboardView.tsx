import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db, secondaryAuth } from '../firebase';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { useAuthStore } from '../store/authStore';
import { UserRole, StaffMember, Patient, CLINICAL_ACTIVITIES, STAFF_COLORS, TenantSettings } from '../types';
import { Users, Activity, Target, Settings, Building2, UserPlus, Shield, X, MoreVertical, Trash2 } from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const { user } = useAuthStore();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [customRoleName, setCustomRoleName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [tenantSettings, setTenantSettings] = useState<TenantSettings>({
    priceSingleSession: 10000,
    pricePack10: 80000,
    priceMonthly: 50000
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Form State
  const [newStaff, setNewStaff] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    role: UserRole.KINE as UserRole | string,
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

      // 3. Fetch Tenant Settings
      const settingsRef = doc(db, 'tenantSettings', tenantId);
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        setTenantSettings(settingsSnap.data() as TenantSettings);
      }

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

  const handleSubmitStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!newStaff.firstName || !newStaff.lastName || (!editingStaffId && (!newStaff.username || !newStaff.password))) {
      setError("Por favor completa los campos obligatorios.");
      setIsSubmitting(false);
      return;
    }

    if (!editingStaffId && newStaff.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      setIsSubmitting(false);
      return;
    }

    const finalRole = isCustomRole ? customRoleName.trim().toUpperCase() : newStaff.role;
    if (isCustomRole && !finalRole) {
      setError("Por favor ingresa un nombre para el nuevo rol.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (!db) throw new Error("Firebase no inicializado");

      if (editingStaffId) {
        const userRef = doc(db, 'staff', editingStaffId);
        const updates: Partial<StaffMember> = {
          firstName: newStaff.firstName,
          lastName: newStaff.lastName,
          role: finalRole,
          activities: (newStaff.role === UserRole.KINE || newStaff.role === UserRole.GYM || isCustomRole) ? newStaff.activities : undefined,
          themeColor: (newStaff.role === UserRole.KINE || newStaff.role === UserRole.GYM || isCustomRole) ? newStaff.themeColor : undefined
        };
        await setDoc(userRef, updates, { merge: true });
      } else {
        if (!secondaryAuth) throw new Error("Firebase no inicializado");
        const email = generateEmail(newStaff.username, finalRole);
        const cred = await createUserWithEmailAndPassword(secondaryAuth, email, newStaff.password);
        const newUid = cred.user.uid;

        const userDoc: StaffMember = {
          id: newUid,
          uid: newUid,
          tenantId: tenantId,
          firstName: newStaff.firstName,
          lastName: newStaff.lastName,
          username: newStaff.username,
          role: finalRole,
          password: newStaff.password,
          activities: (newStaff.role === UserRole.KINE || newStaff.role === UserRole.GYM || isCustomRole) ? newStaff.activities : undefined,
          themeColor: (newStaff.role === UserRole.KINE || newStaff.role === UserRole.GYM || isCustomRole) ? newStaff.themeColor : undefined
        };

        await setDoc(doc(db, 'staff', newUid), userDoc);
      }

      setNewStaff({
        firstName: '',
        lastName: '',
        username: '',
        password: '',
        role: UserRole.KINE,
        activities: [],
        themeColor: 'blue'
      });
      setIsCustomRole(false);
      setCustomRoleName('');
      setEditingStaffId(null);
      setShowAddModal(false);
      fetchData(); // Refresh list

    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/email-already-in-use') {
        setError('Ese nombre de usuario ya está registrado.');
      } else {
        setError('Hubo un error al guardar el empleado: ' + e.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStaff = (staff: StaffMember) => {
    const isStandard = Object.values(UserRole).includes(staff.role as UserRole);
    setNewStaff({
      firstName: staff.firstName,
      lastName: staff.lastName,
      username: staff.username,
      password: staff.password || '',
      role: isStandard ? (staff.role as UserRole) : 'CUSTOM',
      activities: staff.activities || [],
      themeColor: staff.themeColor || 'blue'
    });
    setIsCustomRole(!isStandard);
    setCustomRoleName(isStandard ? '' : staff.role);
    setEditingStaffId(staff.id);
    setError('');
    setShowAddModal(true);
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

  const handleSaveSettings = async () => {
    if (!db) return;
    setIsSavingSettings(true);
    try {
      await setDoc(doc(db, 'tenantSettings', tenantId), { ...tenantSettings, id: tenantId }, { merge: true });
      alert('Precios guardados exitosamente.');
    } catch(e) {
      console.error(e);
      alert('Error al guardar configuración.');
    } finally {
      setIsSavingSettings(false);
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

        {/* Settings Card */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 mb-8">
          <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Settings size={24} /></div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Configuración de Precios</h2>
              <p className="text-sm font-medium text-slate-500">Valores base de referencia para cobros en Recepción.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">1 Sesión Suelta</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-8 font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" value={tenantSettings.priceSingleSession} onChange={e => setTenantSettings({...tenantSettings, priceSingleSession: Number(e.target.value)})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Paquete de 10 Sesiones</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-8 font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" value={tenantSettings.pricePack10} onChange={e => setTenantSettings({...tenantSettings, pricePack10: Number(e.target.value)})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Abono Mensual</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-8 font-black text-slate-900 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" value={tenantSettings.priceMonthly} onChange={e => setTenantSettings({...tenantSettings, priceMonthly: Number(e.target.value)})} />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button onClick={handleSaveSettings} disabled={isSavingSettings} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3.5 rounded-[1.25rem] font-bold flex items-center gap-2 shadow-xl shadow-emerald-500/20 transition-all disabled:opacity-50">
              <Settings size={20} /> Guardar Precios
            </button>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Equipo de Trabajo</h2>
              <p className="text-sm font-medium text-slate-500">Administra accesos y roles (Kinesiología/Recepción).</p>
            </div>
            <button onClick={() => { setEditingStaffId(null); setNewStaff({firstName:'', lastName:'', username:'', password:'', role:UserRole.KINE, activities:[], themeColor:'blue'}); setIsCustomRole(false); setCustomRoleName(''); setError(''); setShowAddModal(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-md shadow-indigo-200">
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
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEditStaff(staff)} className="w-10 h-10 inline-flex border border-slate-200 items-center justify-center rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-colors" title="Editar">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={() => handleDeleteStaff(staff.id)} className="w-10 h-10 inline-flex border border-slate-200 items-center justify-center rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-colors" title="Eliminar">
                            <Trash2 size={16} />
                          </button>
                        </div>
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
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] animate-slide-up relative">
            <div className="p-8 pb-6 flex-shrink-0 border-b border-slate-100 flex justify-between items-start bg-white z-10">
               <div>
                 <h3 className="text-2xl font-black text-slate-900 mb-1">{editingStaffId ? 'Editar Empleado' : 'Nuevo Empleado'}</h3>
                 <p className="text-sm font-medium text-slate-500">{editingStaffId ? 'Actualiza los datos del perfil.' : 'El empleado heredará tu ID de forma segura.'}</p>
               </div>
               <button onClick={() => { setShowAddModal(false); setError(''); setNewStaff({firstName:'', lastName:'', username:'', password:'', role:UserRole.KINE, activities:[], themeColor:'blue'}); setIsCustomRole(false); setCustomRoleName(''); }} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2.5 rounded-full transition-colors shrink-0 ml-4">
                 <X size={20} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 scroll-container relative">

            <form onSubmit={handleSubmitStaff} className="space-y-4">
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-slate-100 rounded-[1.25rem]">
                  <button type="button" onClick={() => { setNewStaff({...newStaff, role: UserRole.KINE}); setIsCustomRole(false); setCustomRoleName(''); }} className={`py-3 rounded-xl font-bold text-[10px] sm:text-xs transition-all shadow-sm ${newStaff.role === UserRole.KINE && !isCustomRole ? 'bg-white text-indigo-600' : 'text-slate-500 hover:bg-slate-200/50'}`}>Kinesiólogo</button>
                  <button type="button" onClick={() => { setNewStaff({...newStaff, role: UserRole.GYM}); setIsCustomRole(false); setCustomRoleName(''); }} className={`py-3 rounded-xl font-bold text-[10px] sm:text-xs transition-all shadow-sm ${newStaff.role === UserRole.GYM && !isCustomRole ? 'bg-white text-indigo-600' : 'text-slate-500 hover:bg-slate-200/50'}`}>GYM</button>
                  <button type="button" onClick={() => { setNewStaff({...newStaff, role: UserRole.RECEPCION}); setIsCustomRole(false); setCustomRoleName(''); }} className={`py-3 rounded-xl font-bold text-[10px] sm:text-xs transition-all shadow-sm ${newStaff.role === UserRole.RECEPCION && !isCustomRole ? 'bg-white text-teal-600' : 'text-slate-500 hover:bg-slate-200/50'}`}>Recepción</button>
                  <button type="button" onClick={() => { setIsCustomRole(true); }} className={`py-3 rounded-xl font-bold text-[10px] sm:text-xs transition-all shadow-sm ${isCustomRole ? 'bg-white text-indigo-600' : 'text-slate-500 hover:bg-slate-200/50'}`}>Otro...</button>
                </div>
                {isCustomRole && (
                  <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                     <input type="text" placeholder="Nombre del nuevo rol (ej: NUTRICIONISTA)" value={customRoleName} onChange={e => setCustomRoleName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold px-5 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"/>
                  </div>
                )}
              </div>

              {(newStaff.role === UserRole.KINE || newStaff.role === UserRole.GYM || isCustomRole) && (
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

              {!editingStaffId ? (
                <>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 ml-1">Usuario de Login</label>
                    <input required value={newStaff.username} onChange={e => setNewStaff({...newStaff, username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold px-5 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="Ej: kinejuan"/>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 ml-1">Contraseña Inicial</label>
                    <input required minLength={6} value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold px-5 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="Mínimo 6 caracteres"/>
                  </div>
                </>
              ) : (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold p-4 rounded-2xl">
                  ⚠️ <strong>Por seguridad</strong>, el usuario de login y la contraseña no se pueden modificar. Si necesitas cambiarlos, elimina este empleado y vuelve a crearlo.
                </div>
              )}

              <div className="pt-4 mt-8 border-t border-slate-100 sticky bottom-0 bg-white z-10 pb-2">
                <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex justify-center items-center gap-2 mb-3">
                  {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (editingStaffId ? 'Guardar Cambios' : 'Crear Acceso Empleado')}
                </button>
                {error && (
                  <div className="bg-red-50 text-red-600 border border-red-200 text-xs font-bold p-3 rounded-xl animate-in slide-in-from-top-2">
                    {error}
                  </div>
                )}
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
