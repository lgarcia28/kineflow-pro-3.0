import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, secondaryAuth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuthStore } from '../store/authStore';
import { UserRole, Tenant, StaffMember } from '../types';
import { Building2, Plus, Server, CheckCircle2, ShieldAlert, X, Activity } from 'lucide-react';
import { generateStaffEmail } from '../utils/authUtils';

export const SuperAdminDashboardView: React.FC = () => {
  const { user } = useAuthStore();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantAdmins, setTenantAdmins] = useState<Record<string, string>>({}); // tenantId -> username
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form
  const [newTenantName, setNewTenantName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const fetchData = async () => {
    if (!db || !user) return;
    setLoading(true);
    try {
      // Fetch Tenants
      const tenantsQ = query(collection(db, 'tenants'));
      const tenantsSnap = await getDocs(tenantsQ);
      const tenantsData: Tenant[] = [];
      tenantsSnap.forEach(tDoc => tenantsData.push(tDoc.data() as Tenant));
      setTenants(tenantsData);

      // Fetch Admins
      const staffQ = query(collection(db, 'staff')); // Could filter Client-side
      const staffSnap = await getDocs(staffQ);
      const adminsMap: Record<string, string> = {};
      staffSnap.forEach(sDoc => {
        const staff = sDoc.data() as StaffMember;
        if (staff.role === UserRole.TENANT_ADMIN && staff.tenantId) {
          adminsMap[staff.tenantId] = staff.username;
        }
      });
      setTenantAdmins(adminsMap);
      
    } catch (e: any) {
      console.error("Error fetching super admin data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!newTenantName || !adminUsername || !adminPassword) {
      setError("Todos los campos son obligatorios.");
      setIsSubmitting(false);
      return;
    }

    if (adminPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (!secondaryAuth || !db) throw new Error("Firebase no inicializado");

      // 1. Create Institution (Tenant)
      const newTenantRef = doc(collection(db, 'tenants'));
      const tenantId = newTenantRef.id;

      const newTenant: Tenant = {
        id: tenantId,
        name: newTenantName,
        createdAt: new Date().toISOString(),
        isActive: true
      };

      // 2. Create Auth User for the Director
      const sanitizedUsername = adminUsername.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      const email = generateStaffEmail(sanitizedUsername);
      
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email, adminPassword);
      const newUid = cred.user.uid;

      // 3. Save Director in Staff
      const adminDoc: StaffMember = {
        id: newUid,
        uid: newUid,
        tenantId: tenantId,
        firstName: 'Director',
        lastName: newTenantName,
        username: sanitizedUsername,
        role: UserRole.TENANT_ADMIN,
        password: adminPassword 
      };

      // Save both docs in transaction/batch ideally, using independent sets here
      await setDoc(newTenantRef, newTenant);
      await setDoc(doc(db, 'staff', newUid), adminDoc);

      setNewTenantName('');
      setAdminUsername('');
      setAdminPassword('');
      setShowAddModal(false);
      fetchData(); // Refresh

    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/email-already-in-use') {
        setError('Ese usuario de director ya está en uso. Elige otro usuario (ej: kine_rosario).');
      } else {
        setError('Error al crear institución: ' + e.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center h-full bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cargando Red de Clínicas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto pb-24">
      <div className="bg-slate-900 text-white pt-12 pb-24 px-8 md:px-12 relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[150%] bg-blue-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[120%] bg-teal-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700 mb-4 shadow-lg shadow-black/20">
              <Server size={14} className="text-blue-400"/>
              <span className="text-[10px] items-center font-bold text-slate-300 uppercase tracking-widest">KineFlow Network <span className="ml-2 text-blue-400">● Live</span></span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Master <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">Control</span></h1>
            <p className="text-slate-400 mt-2 font-medium">Gestión Multi-Tenant de Instituciones y Clínicas Afiliadas.</p>
          </div>
          
          <button onClick={() => setShowAddModal(true)} className="bg-white text-slate-900 hover:bg-blue-50 hover:text-blue-700 px-6 py-4 rounded-[1.25rem] font-bold flex items-center gap-3 transition-all shadow-xl shadow-black/20 active:scale-95">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
               <Plus size={18} />
            </div>
            <span>Crear Clínica</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-12 -mt-12 relative z-20 space-y-8 animate-slide-up">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/40 border border-slate-100 flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Building2 size={28} />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900">{tenants.length}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Instituciones Activas</div>
            </div>
          </div>
          <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/40 border border-slate-100 flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
              <Activity size={28} />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900">Operativo</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Estado del Clúster</div>
            </div>
          </div>
        </div>

        {/* Tenants Table */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100">
            <h2 className="text-2xl font-black text-slate-900">Red de Instituciones</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Espacios aislados de datos en la plataforma.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Institución</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">ID (Tenant)</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Usuario Director</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[1rem] bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-600 group-hover:scale-105 transition-transform flex-shrink-0">
                          {tenant.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="font-bold text-slate-900 text-base">{tenant.name}</div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                       <code className="text-[11px] px-2 py-1 bg-slate-100 text-slate-500 rounded-md font-medium tracking-wide">
                          {tenant.id}
                       </code>
                    </td>
                    <td className="px-8 py-5">
                       <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-bold tracking-wide">
                          <ShieldAlert size={14} className="text-yellow-400"/>
                          {tenantAdmins[tenant.id] || 'Sin Asignar'}
                       </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                          <CheckCircle2 size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Activo</span>
                       </div>
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-medium">
                      No hay instituciones creadas en la red.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Tenant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative animate-slide-up border border-slate-200/50">
            <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition-colors hover:bg-slate-200">
              <X size={20} />
            </button>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
               <Building2 size={24} />
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 mb-2">Crear Nueva Clínica</h3>
            <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">Se generará un espacio de datos 100% aislado. El director que asignes será el único capaz de agregar empleados a esta institución.</p>

            {error && (
              <div className="mb-6 bg-red-50 text-red-600 border border-red-200 text-xs font-bold p-4 rounded-2xl flex gap-3 items-start">
                <ShieldAlert size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateTenant} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 ml-1">Nombre Comercial de la Clínica</label>
                <input required value={newTenantName} onChange={e => setNewTenantName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold px-5 py-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg" placeholder="Ej: KineSport Rosario"/>
              </div>

              <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
                
                <div className="flex items-center gap-2 mb-2">
                   <ShieldAlert size={16} className="text-indigo-500" />
                   <h4 className="text-xs font-black uppercase text-indigo-900 tracking-wider">Credenciales del Director</h4>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 ml-1">Usuario de Ingreso</label>
                  <input required value={adminUsername} onChange={e => setAdminUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))} className="w-full bg-white border border-slate-200 text-slate-900 font-bold px-5 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono" placeholder="Ej: adminrosario"/>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 ml-1">Contraseña Inicial</label>
                  <input required minLength={6} value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full bg-white border border-slate-200 text-slate-900 font-bold px-5 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all tracking-widest font-mono" placeholder="Mínimo 6 caracteres"/>
                </div>
              </div>

              <div className="pt-4 mt-2">
                <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4.5 rounded-[1.25rem] transition-all shadow-xl shadow-slate-900/20 flex justify-center items-center gap-2 text-lg h-14">
                  {isSubmitting ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Desplegar Institución'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
