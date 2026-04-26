import React, { useState, useEffect } from 'react';
import { User, Lock, ArrowRight, Activity, ShieldCheck, HeartPulse, Fingerprint, X } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { generatePatientEmail, generateStaffEmail } from '../utils/authUtils';
import { doc, setDoc } from 'firebase/firestore';
import { UserRole } from '../types';
import {
  isBiometricSupported,
  hasBiometricRegistered,
  getBiometricEmail,
  getBiometricName,
  registerBiometric,
  authenticateWithBiometric,
  clearBiometricCredential
} from '../utils/biometricAuth';

export const Login: React.FC = () => {
  const [mode, setMode] = useState<'PATIENT' | 'STAFF'>('PATIENT');
  const [dni, setDni] = useState('');
  const [patientPass, setPatientPass] = useState('');
  const [staffUser, setStaffUser] = useState('');
  const [staffPass, setStaffPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Biometric state
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false); // offer to register after login
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingDisplayName, setPendingDisplayName] = useState('');
  const [biometricScreen, setBiometricScreen] = useState(false); // show biometric login screen
  const [biometricError, setBiometricError] = useState('');

  // On mount: check if biometric is registered and go straight to biometric screen
  useEffect(() => {
    if (isBiometricSupported() && hasBiometricRegistered()) {
      setBiometricScreen(true);
    }
  }, []);

  const handlePatientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dni.trim() || !patientPass.trim()) return;
    setLoading(true);
    setError('');
    try {
      const email = generatePatientEmail(dni.trim());
      if (auth) {
        await signInWithEmailAndPassword(auth, email, patientPass);
        // Offer biometric registration
        if (isBiometricSupported() && !hasBiometricRegistered()) {
          setPendingEmail(email);
          setPendingDisplayName(`Paciente ${dni.trim()}`);
          setShowBiometricPrompt(true);
        }
      } else {
        throw new Error("Firebase Auth no inicializado");
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffUser.trim() || !staffPass.trim()) return;
    setError('');
    setLoading(true);
    
    try {
      if (!auth) throw new Error("Firebase Auth no inicializado");

      // ====== INICIALIZACIÃ“N SECRETA PARA EL PRIMER USO ======
      if (staffUser.trim().toUpperCase() === 'RECEPCION_INIT' && (staffPass === '123456' || staffPass === '1234')) {
        const email = 'recepcion@staff.kineflow.com';
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, '123456');
          if (db) {
            await setDoc(doc(db, 'staff', cred.user.uid), {
              id: cred.user.uid,
              uid: cred.user.uid,
              firstName: 'Admin',
              lastName: 'RecepciÃ³n',
              username: 'recepcion',
              password: '', 
              role: UserRole.RECEPCION,
              tenantId: 'default_tenant'
            });
            alert('Â¡Usuario RecepciÃ³n creado con Ã©xito! IngrÃ©selo en el siguiente inicio.');
            setStaffUser('');
            setStaffPass('');
            return;
          }
        } catch (e: any) {
          if (e.code === 'auth/email-already-in-use') {
            setError('El usuario de inicializaciÃ³n ya fue creado. Ingrese con recepcion / 123456');
          } else {
            setError('Error al inicializar: ' + e.message);
          }
          return;
        }
      }
      // ====== INICIALIZACIÃ“N SECRETA PARA EL PRIMER USO KINE ======
      if (staffUser.trim().toUpperCase() === 'KINE_INIT' && (staffPass === '123456' || staffPass === '1234')) {
        const email = 'kine@staff.kineflow.com';
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, '123456');
          if (db) {
            await setDoc(doc(db, 'staff', cred.user.uid), {
              id: cred.user.uid,
              uid: cred.user.uid,
              firstName: 'Admin',
              lastName: 'KinesiÃ³logo',
              username: 'kine',
              password: '', 
              role: UserRole.KINE,
              tenantId: 'default_tenant'
            });
            alert('Â¡Usuario KinesiÃ³logo creado con Ã©xito! IngrÃ©selo en el siguiente inicio.');
            setStaffUser('');
            setStaffPass('');
            return;
          }
        } catch (e: any) {
          if (e.code === 'auth/email-already-in-use') {
            setError('El kine de inicializaciÃ³n ya fue creado. Ingrese con kine / 123456');
          } else {
            setError('Error al inicializar Kine: ' + e.message);
          }
          return;
        }
      }
      
      // ====== INICIALIZACIÃ“N SECRETA PARA DUEÃ‘O DE PLATAFORMA (SUPER ADMIN) ======
      if (staffUser.trim().toUpperCase() === 'MASTER_INIT') {
        const initPass = staffPass.length >= 6 ? staffPass : '123456';
        const email = 'super_admin@kineflow.com';
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, initPass);
          if (db) {
            await setDoc(doc(db, 'staff', cred.user.uid), {
              id: cred.user.uid,
              uid: cred.user.uid,
              firstName: 'DueÃ±o',
              lastName: 'Plataforma',
              username: 'superadmin',
              password: '', 
              role: UserRole.SUPER_ADMIN,
              tenantId: 'global'
            });
            await signInWithEmailAndPassword(auth, email, initPass);
            return;
          }
        } catch (e: any) {
          if (e.code === 'auth/email-already-in-use') {
            try {
               await signInWithEmailAndPassword(auth, email, initPass);
               return;
            } catch (err: any) {
               setError('El SÃºper Administrador ya existe. Intente conectarse como "superadmin" con su clave real.');
            }
          } else {
            setError('Error al inicializar Super Admin: ' + e.message);
          }
          return;
        }
      }

      // ====== INICIALIZACIÃ“N SECRETA PARA DUEÃ‘O DE CLÃNICA ======
      if (staffUser.trim().toUpperCase() === 'TENANT_INIT' || staffUser.trim().toUpperCase() === 'TENANT_ADMIN') {
        const initPass = staffPass.length >= 6 ? staffPass : '123456';
        const email = 'admin_master@kineflow.com'; // Usamos un nuevo correo para evitar choque con cuentas corruptas/olvidadas
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, initPass);
          if (db) {
            await setDoc(doc(db, 'staff', cred.user.uid), {
              id: cred.user.uid,
              uid: cred.user.uid,
              firstName: 'Director',
              lastName: 'Institucional',
              username: 'admin',
              password: '', 
              role: UserRole.TENANT_ADMIN,
              tenantId: 'default_tenant'
            });
            // Autologin directo post-registro
            await signInWithEmailAndPassword(auth, email, initPass);
            return;
          }
        } catch (e: any) {
          if (e.code === 'auth/email-already-in-use') {
            try {
               // Si ya estaba creado, forzamos el logueo para mayor comodidad
               await signInWithEmailAndPassword(auth, email, initPass);
               return;
            } catch (err: any) {
               setError('El administrador inicial ya fue creado, pero la contraseÃ±a no coincide. Intente conectarse como "admin" con su clave real.');
            }
          } else {
            setError('Error al inicializar Admin: ' + e.message);
          }
          return;
        }
      }
      // =======================================================
      // Intentamos con email generado (o directo si insertaron a mano)
      let email = staffUser.includes('@') ? staffUser.trim() : generateStaffEmail(staffUser.trim().toLowerCase());
      
      // Mapeo especial para el administrador institucional para que no choque con el sufijo @staff
      if (staffUser.trim().toLowerCase() === 'admin') {
        email = 'admin_master@kineflow.com';
      } else if (staffUser.trim().toLowerCase() === 'superadmin') {
        email = 'super_admin@kineflow.com';
      }

      if (auth) {
        await signInWithEmailAndPassword(auth, email, staffPass);
        // Offer biometric registration
        if (isBiometricSupported() && !hasBiometricRegistered()) {
          setPendingEmail(email);
          setPendingDisplayName(staffUser.trim());
          setShowBiometricPrompt(true);
        }
      } else {
         throw new Error("Firebase Auth no inicializado");
      }
    } catch (err: any) {
      setError(`Error: ${err.message || err.code || 'Desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setBiometricError('');
    setLoading(true);
    try {
      const ok = await authenticateWithBiometric();
      if (!ok) {
        setBiometricError('VerificaciÃ³n biomÃ©trica fallida. IntentÃ¡ de nuevo.');
        return;
      }
      // Biometric passed â€” re-sign in with saved email via Firebase
      // Firebase already persists the session; if current user exists we're done.
      // If session expired, we can't re-auth without password, so show password form.
      if (auth && auth.currentUser) {
        // Session still valid â€” biometric was just a gate, we're in!
        return; // Auth state listener in App.tsx will handle navigation
      } else {
        // Session expired â€” can't auto-login without password, fall back
        setBiometricError('Tu sesiÃ³n expirÃ³. Por favor ingresÃ¡ con usuario y contraseÃ±a.');
        clearBiometricCredential();
        setBiometricScreen(false);
      }
    } catch {
      setBiometricError('Error al verificar biometrÃ­a. IntentÃ¡ con contraseÃ±a.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterBiometric = async () => {
    setLoading(true);
    const ok = await registerBiometric(pendingEmail, pendingDisplayName);
    setLoading(false);
    setShowBiometricPrompt(false);
    if (!ok) {
      // User cancelled or not supported â€” just proceed normally
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-dark-50 relative overflow-hidden">

      {/* ===== BIOMETRIC REGISTRATION OFFER MODAL ===== */}
      {showBiometricPrompt && (
        <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 animate-slide-up text-center">
            <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <Fingerprint className="text-primary-600 w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Acceso BiomÃ©trico</h3>
            <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
              Â¿QuerÃ©s usar <strong>Face ID o huella dactilar</strong> para entrar mÃ¡s rÃ¡pido la prÃ³xima vez?
            </p>
            <div className="space-y-3">
              <button
                onClick={handleRegisterBiometric}
                disabled={loading}
                className="w-full bg-primary-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-primary-600/20 flex items-center justify-center gap-2 hover:bg-primary-700 transition-all disabled:opacity-60"
              >
                <Fingerprint size={20} /> {loading ? 'Registrando...' : 'Activar Face ID / Huella'}
              </button>
              <button
                onClick={() => setShowBiometricPrompt(false)}
                className="w-full py-3 text-slate-500 font-bold text-sm hover:text-slate-700 transition-colors"
              >
                Ahora no
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== BIOMETRIC LOGIN SCREEN ===== */}
      {biometricScreen && !showBiometricPrompt && (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-primary-50 relative overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-pulse"></div>
          <div className="w-full max-w-sm text-center animate-slide-up">
            <div className="w-24 h-24 bg-primary-600 rounded-[2rem] shadow-2xl shadow-primary-500/30 flex items-center justify-center mx-auto mb-6">
              <Activity className="text-white w-12 h-12" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-1">KineFlow<span className="text-primary-600">Pro</span></h1>
            <p className="text-slate-500 font-medium mb-10">Bienvenido/a, <span className="font-black text-slate-700">{getBiometricName()}</span></p>

            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/60 mb-4">
              <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-5 ring-4 ring-primary-100">
                <Fingerprint className="text-primary-600 w-10 h-10" />
              </div>
              <h2 className="text-lg font-black text-slate-900 mb-2">VerificaciÃ³n BiomÃ©trica</h2>
              <p className="text-sm text-slate-400 font-medium mb-6">UsÃ¡ Face ID o tu huella dactilar para acceder</p>

              {biometricError && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold p-3 rounded-2xl mb-4">
                  {biometricError}
                </div>
              )}

              <button
                onClick={handleBiometricLogin}
                disabled={loading}
                className="w-full bg-primary-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-primary-600/20 flex items-center justify-center gap-2 hover:bg-primary-700 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                <Fingerprint size={22} /> {loading ? 'Verificando...' : 'Acceder con BiometrÃ­a'}
              </button>
            </div>

            <button
              onClick={() => { clearBiometricCredential(); setBiometricScreen(false); }}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold transition-colors flex items-center gap-1 mx-auto"
            >
              <X size={12} /> Usar usuario y contraseÃ±a
            </button>
          </div>
        </div>
      )}

      {/* ===== NORMAL LOGIN (only shown if NOT in biometric screen) ===== */}
      {!biometricScreen && <>
        {/* Decorative Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-pulse" style={{animationDelay: '1s'}}></div>
        
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex flex-1 flex-col justify-center px-24 relative z-10 2xl:px-40 xl:border-r border-slate-200/50 bg-white/40 backdrop-blur-3xl">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-16 h-16 bg-primary-600 rounded-[1.25rem] shadow-2xl shadow-primary-500/30 flex items-center justify-center transform hover:scale-105 transition-transform">
              <Activity className="text-white w-8 h-8" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tight">KineFlow<span className="text-primary-600">Pro</span></h1>
              <p className="text-lg text-slate-500 font-medium mt-1">Plataforma ClÃ­nica Asegurada</p>
            </div>
          </div>
          <div className="space-y-8">
            <div className="flex items-start gap-5">
               <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center shrink-0">
                  <HeartPulse className="text-teal-600 w-6 h-6" />
               </div>
               <div>
                 <h3 className="text-xl font-bold text-slate-900">Seguimiento Preciso</h3>
                 <p className="text-slate-500 mt-1 leading-relaxed">Gestione la recuperaciÃ³n y evoluciÃ³n clÃ­nica con herramientas avanzadas en tiempo real.</p>
               </div>
            </div>
            <div className="flex items-start gap-5">
               <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
                  <ShieldCheck className="text-indigo-600 w-6 h-6" />
               </div>
               <div>
                 <h3 className="text-xl font-bold text-slate-900">Historial Cifrado</h3>
                 <p className="text-slate-500 mt-1 leading-relaxed">ProtecciÃ³n de acceso multi-nivel y encriptaciÃ³n de datos de salud en la nube.</p>
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
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Ingreso Seguro</h2>
              <p className="text-slate-500 mb-8 font-medium">ValidaciÃ³n cifrada de credenciales</p>

              <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-8 border border-slate-200/50">
                <button onClick={() => setMode('PATIENT')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${mode === 'PATIENT' ? 'bg-white text-primary-600 shadow-md shadow-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>Paciente</button>
                <button onClick={() => setMode('STAFF')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${mode === 'STAFF' ? 'bg-white text-primary-600 shadow-md shadow-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>Profesional</button>
              </div>

              {mode === 'PATIENT' ? (
                <form onSubmit={handlePatientLogin} className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">NÃºmero de DNI</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary-500 transition-colors" />
                      <input type="text" value={dni} onChange={(e) => setDni(e.target.value)} placeholder="Ej: 12345678" className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-sans" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">ContraseÃ±a</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary-500 transition-colors" />
                      <input type="password" value={patientPass} onChange={(e) => setPatientPass(e.target.value)} placeholder="Ingresa tu contraseÃ±a" className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-sans tracking-widest" />
                    </div>
                  </div>
                  {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-semibold p-4 rounded-2xl text-center animate-fade-in flex items-center justify-center gap-2"><ShieldCheck className="w-5 h-5" />{error}</div>}
                  <button type="submit" disabled={loading} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-primary-600/20 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70">
                    {loading ? 'Validando...' : 'Iniciar SesiÃ³n'} <ArrowRight size={20} />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleStaffLogin} className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Usuario o Email</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary-500 transition-colors" />
                      <input type="text" value={staffUser} onChange={(e) => setStaffUser(e.target.value)} placeholder="ingrese su usuario" className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">ContraseÃ±a</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary-500 transition-colors" />
                      <input type="password" value={staffPass} onChange={(e) => setStaffPass(e.target.value)} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-sans tracking-widest" />
                    </div>
                  </div>
                  {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-semibold p-4 rounded-2xl text-center animate-fade-in flex items-center justify-center gap-2"><ShieldCheck className="w-5 h-5" />{error}</div>}
                  <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:scale-[0.98] mt-2 disabled:opacity-70">
                    {loading ? 'Conectando...' : 'Acceso Autorizado'} <ArrowRight size={20} />
                  </button>
                </form>
              )}

              <div className="mt-10 flex justify-center pt-8 border-t border-slate-100">
                 <p className="text-center text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                    Sistema Multi-Sede<br/>
                    <span className="opacity-70 mt-1 block">Entorno Seguro KineFlow Pro</span>
                 </p>
              </div>
            </div>
          </div>
        </div>
      </>}
    </div>
  );
};
