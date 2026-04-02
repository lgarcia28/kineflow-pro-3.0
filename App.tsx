
import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { SoundSettings } from './components/SoundSettings';
import { PatientList } from './components/PatientList';
import { PatientDetail } from './components/PatientDetail';
import { ExerciseLibrary } from './components/ExerciseLibrary';
import { Login } from './components/Login';
import { RecepcionView } from './components/RecepcionView';
import { PatientView } from './components/PatientView';
import { ShopAdmin } from './components/ShopAdmin';
import { StaffAdmin } from './components/StaffAdmin';
import { MOCK_PATIENTS, EXERCISES as INITIAL_EXERCISES, MOCK_PRODUCTS, MOCK_APPOINTMENTS } from './constants';
import { Patient, ViewState, UserRole, ExerciseDefinition, Product, CheckInStatus, StaffMember, Appointment } from './types';
import { db, isConfigValid } from './firebase';
import { Download, X, LogOut } from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc,
  setDoc,
  deleteDoc,
  query,
  addDoc
} from 'firebase/firestore';

const App: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [exercises, setExercises] = useState<ExerciseDefinition[]>(INITIAL_EXERCISES);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);

  const [loading, setLoading] = useState(true);
  const [activePatientIds, setActivePatientIds] = useState<string[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>('LOGIN');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [loggedPatientDni, setLoggedPatientDni] = useState<string | null>(null);
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  
  const prevInRoomIds = useRef<Set<string>>(new Set());
  const [notificationSound, setNotificationSound] = useState<string>(localStorage.getItem('kineflow_sound') || 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
  const [showSoundSettings, setShowSoundSettings] = useState(false);

  const soundOptions = [
    { id: 'iphone-note', name: 'Chime Elegante (Estilo iPhone)', url: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3' },
    { id: 'iphone-glass', name: 'Chime Cristalino', url: 'https://assets.mixkit.co/active_storage/sfx/2359/2359-preview.mp3' },
    { id: 'soft-chime', name: 'Campana Suave', url: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3' },
    { id: 'classic-bell', name: 'Campana Clásica', url: 'https://assets.mixkit.co/active_storage/sfx/2361/2361-preview.mp3' },
    { id: 'service-bell', name: 'Timbre de Servicio', url: 'https://assets.mixkit.co/active_storage/sfx/2363/2363-preview.mp3' },
    { id: 'modern-chime', name: 'Campana Moderna', url: 'https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3' },
  ];

  const handleSelectSound = (url: string) => {
    setNotificationSound(url);
    localStorage.setItem('kineflow_sound', url);
    const audio = new Audio(url);
    audio.play().catch(e => console.error("Preview failed:", e));
  };

  const isInitialLoad = useRef(true);

  // Notification sound logic for Kinesiologist
  useEffect(() => {
    if (currentUserRole !== UserRole.KINE || loading) return;

    const currentInRoomIds = new Set(
      patients
        .filter(p => p.checkInStatus === CheckInStatus.IN_ROOM)
        .map(p => p.id)
    );

    // On initial load, just populate the ref without playing sound
    if (isInitialLoad.current) {
      prevInRoomIds.current = currentInRoomIds;
      isInitialLoad.current = false;
      return;
    }

    // Check if there are new IDs in the current set that weren't in the previous set
    const newArrivals = Array.from(currentInRoomIds).filter(id => !prevInRoomIds.current.has(id));

    if (newArrivals.length > 0) {
      console.log("New arrivals detected:", newArrivals);
      const audio = new Audio(notificationSound);
      audio.play().then(() => {
        console.log("Notification sound played successfully");
      }).catch(err => {
        console.error("Audio playback failed:", err);
      });
      
      // Optional: Show a browser notification if permitted
      if ("Notification" in window && Notification.permission === "granted") {
        newArrivals.forEach(id => {
          const patient = patients.find(p => p.id === id);
          if (patient) {
            new Notification("Nuevo Paciente en Sala", {
              body: `${patient.firstName} ${patient.lastName} ha llegado.`,
              icon: patient.photoUrl
            });
          }
        });
      }
    }

    prevInRoomIds.current = currentInRoomIds;
  }, [patients, currentUserRole, loading]);

  // Request notification permission
  useEffect(() => {
    if (currentUserRole === UserRole.KINE && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [currentUserRole]);

  // Persistence of session
  useEffect(() => {
    const savedRole = localStorage.getItem('kineflow_role');
    const savedDni = localStorage.getItem('kineflow_dni');
    if (savedRole) {
      setCurrentUserRole(savedRole as UserRole);
      if (savedRole === UserRole.PATIENT && savedDni) {
        setLoggedPatientDni(savedDni);
      }
      setView('HOME');
    }
  }, []);

  useEffect(() => {
    console.log("Firebase Config Valid:", isConfigValid);
    console.log("Firestore DB Instance:", !!db);
  }, []);

  const handleLogin = (role: UserRole, dni?: string) => {
    console.log("Logging in as:", role, "DNI:", dni);
    setCurrentUserRole(role);
    if (dni) {
      setLoggedPatientDni(dni);
      localStorage.setItem('kineflow_dni', dni);
    }
    localStorage.setItem('kineflow_role', role);
    setView('HOME');
  };

  const handleLogout = () => {
    console.log("Logging out");
    setCurrentUserRole(null);
    setLoggedPatientDni(null);
    localStorage.removeItem('kineflow_role');
    localStorage.removeItem('kineflow_dni');
    setView('LOGIN');
  };

  const sanitizeForFirestore = (data: any) => {
    return JSON.parse(JSON.stringify(data));
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setShowInstallBanner(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallBanner(false);
    setDeferredPrompt(null);
  };

  useEffect(() => {
    if (!isConfigValid || !db) {
      setPatients(MOCK_PATIENTS);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'patients'));
    console.log("Starting Firestore snapshot listener...");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const patientsData: Patient[] = [];
      snapshot.forEach((doc) => {
        patientsData.push(doc.data() as Patient);
      });
      
      console.log(`Firestore Snapshot: ${patientsData.length} patients found`);
      
      if (!snapshot.empty) {
        setPatients(patientsData);
      } else {
        console.log("Firestore is empty, using mock data");
        setPatients(MOCK_PATIENTS);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setPatients(MOCK_PATIENTS);
      setLoading(false);
    });

    const staffQ = query(collection(db, 'staff'));
    const unsubscribeStaff = onSnapshot(staffQ, (snapshot) => {
      const staffData: StaffMember[] = [];
      snapshot.forEach((doc) => {
        staffData.push(doc.data() as StaffMember);
      });
      setStaff(staffData);
    });

    const productsQ = query(collection(db, 'products'));
    const unsubscribeProducts = onSnapshot(productsQ, (snapshot) => {
      const productsData: Product[] = [];
      snapshot.forEach((doc) => {
        productsData.push(doc.data() as Product);
      });
      if (!snapshot.empty) {
        setProducts(productsData);
      } else {
        setProducts(MOCK_PRODUCTS);
      }
    });

    const appointmentsQ = query(collection(db, 'appointments'));
    const unsubscribeAppointments = onSnapshot(appointmentsQ, (snapshot) => {
      const appointmentsData: Appointment[] = [];
      snapshot.forEach((doc) => {
        appointmentsData.push(doc.data() as Appointment);
      });
      if (!snapshot.empty) {
        setAppointments(appointmentsData);
      } else {
        setAppointments(MOCK_APPOINTMENTS);
      }
    });

    const exercisesQ = query(collection(db, 'exercises'));
    const unsubscribeExercises = onSnapshot(exercisesQ, (snapshot) => {
      const exercisesData: ExerciseDefinition[] = [];
      snapshot.forEach((doc) => {
        exercisesData.push(doc.data() as ExerciseDefinition);
      });
      if (!snapshot.empty) {
        setExercises(exercisesData);
      } else {
        setExercises(INITIAL_EXERCISES);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeStaff();
      unsubscribeProducts();
      unsubscribeAppointments();
      unsubscribeExercises();
    };
  }, []);

  const handleAddExercise = async (newEx: ExerciseDefinition) => {
    if (db) {
      try {
        await setDoc(doc(db, 'exercises', newEx.id), sanitizeForFirestore(newEx));
      } catch (e) { console.error(e); }
    } else {
      setExercises(prev => [...prev, newEx]);
    }
  };

  const handleUpdateExercise = async (updatedEx: ExerciseDefinition) => {
    if (db) {
      try {
        await setDoc(doc(db, 'exercises', updatedEx.id), sanitizeForFirestore(updatedEx), { merge: true });
      } catch (e) { console.error(e); }
    } else {
      setExercises(prev => prev.map(ex => ex.id === updatedEx.id ? updatedEx : ex));
    }
  };

  const handleDeleteExercise = async (id: string) => {
    if (db) {
      try {
        await deleteDoc(doc(db, 'exercises', id));
      } catch (e) { console.error(e); }
    } else {
      setExercises(prev => prev.filter(ex => ex.id !== id));
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    if (!activePatientIds.includes(patient.id)) {
      setActivePatientIds(prev => [patient.id, ...prev]);
    }
    setSelectedPatientId(patient.id);
    setView('PATIENT_DETAIL');
  };

  const handleAddPatient = async (newPatient: Patient) => {
    console.log("Adding patient:", newPatient.firstName, newPatient.lastName);
    setPatients(prev => [...prev, newPatient]);
    if (isConfigValid && db) {
      try {
        const safeData = sanitizeForFirestore(newPatient);
        await setDoc(doc(db, 'patients', newPatient.id), safeData);
        console.log("Patient saved to Firestore successfully");
      } catch (e: any) { 
        console.error("Error saving patient to Firestore:", e);
        if (e.code === 'permission-denied') {
          alert("Error de Permisos: La base de datos está bloqueada. Asegúrese de haber configurado las Reglas de Firestore en el Firebase Console.");
        } else {
          alert("Error al guardar en la base de datos. Verifique su conexión.");
        }
      }
    }
  };

  const handleUpdatePatient = async (updatedPatient: Patient) => {
    console.log("Updating patient:", updatedPatient.firstName, updatedPatient.lastName);
    setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
    
    if (updatedPatient.checkInStatus === CheckInStatus.ATTENDED && !activePatientIds.includes(updatedPatient.id)) {
      setActivePatientIds(prev => [updatedPatient.id, ...prev]);
    }

    if (isConfigValid && db) {
      try {
        const safeData = sanitizeForFirestore(updatedPatient);
        // Use setDoc with merge: true to be more resilient (works if doc doesn't exist)
        await setDoc(doc(db, 'patients', updatedPatient.id), safeData, { merge: true });
        console.log("Patient updated in Firestore successfully");
      } catch (e: any) { 
        console.error("Error updating patient in Firestore:", e);
        if (e.code === 'permission-denied') {
          console.warn("Permisos insuficientes para actualizar. Verifique las reglas de Firestore.");
        }
      }
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    setPatients(prev => prev.filter(p => p.id !== patientId));
    if (isConfigValid && db) {
      try {
        await deleteDoc(doc(db, 'patients', patientId));
      } catch (e) { console.error(e); }
    }
  };

  const handleClearWaitingRoom = async () => {
    const patientsToReset = patients.filter(p => p.checkInStatus !== CheckInStatus.IDLE);
    if (patientsToReset.length === 0) return;

    // Update local state first
    setPatients(prev => prev.map(p => ({
      ...p,
      checkInStatus: CheckInStatus.IDLE
    })));

    // Update Firestore
    if (isConfigValid && db) {
      const firestore = db;
      try {
        const promises = patientsToReset.map(p => 
          updateDoc(doc(firestore, 'patients', p.id), { checkInStatus: CheckInStatus.IDLE })
        );
        await Promise.all(promises);
        console.log("Waiting room cleared successfully");
      } catch (e) {
        console.error("Error clearing waiting room:", e);
      }
    }
  };

  const handleAddProduct = async (product: Product) => {
    if (db) {
      try {
        await setDoc(doc(db, 'products', product.id), sanitizeForFirestore(product));
      } catch (e) { console.error(e); }
    } else {
      setProducts(prev => [...prev, product]);
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    if (db) {
      try {
        await setDoc(doc(db, 'products', updatedProduct.id), sanitizeForFirestore(updatedProduct), { merge: true });
      } catch (e) { console.error(e); }
    } else {
      setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (db) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (e) { console.error(e); }
    } else {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleAddAppointment = async (app: Appointment) => {
    if (db) {
      try {
        await setDoc(doc(db, 'appointments', app.id), app);
      } catch (e) { console.error(e); }
    } else {
      setAppointments(prev => [...prev, app]);
    }
  };

  const handleUpdateAppointment = async (app: Appointment) => {
    if (db) {
      try {
        await setDoc(doc(db, 'appointments', app.id), app, { merge: true });
      } catch (e) { console.error(e); }
    } else {
      setAppointments(prev => prev.map(a => a.id === app.id ? app : a));
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (db) {
      try {
        await deleteDoc(doc(db, 'appointments', id));
      } catch (e) { console.error(e); }
    } else {
      setAppointments(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleAddStaff = async (member: StaffMember) => {
    if (db) {
      try {
        await setDoc(doc(db, 'staff', member.id), sanitizeForFirestore(member));
      } catch (e) { console.error(e); }
    } else {
      setStaff(prev => [...prev, member]);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (db) {
      try {
        await deleteDoc(doc(db, 'staff', id));
      } catch (e) { console.error(e); }
    } else {
      setStaff(prev => prev.filter(s => s.id !== id));
    }
  };

  const sidebarPatients = [
    ...patients.filter(p => p.checkInStatus === CheckInStatus.IN_ROOM),
    ...activePatientIds
      .map(id => patients.find(p => p.id === id))
      .filter((p): p is Patient => !!p && p.checkInStatus !== CheckInStatus.IN_ROOM)
  ];

  const currentPatient = patients.find(p => p.id === selectedPatientId);
  const loggedPatient = patients.find(p => p.dni === loggedPatientDni);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-dark-50 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-300 rounded-full mix-blend-multiply filter blur-[120px] opacity-40 animate-pulse"></div>
        <div className="relative flex flex-col items-center gap-6 animate-fade-in z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-primary-500 blur-xl opacity-50 rounded-full animate-pulse"></div>
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary-500/40 relative z-10">
               <div className="w-10 h-10 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
          </div>
          <p className="text-primary-800 font-extrabold tracking-[0.2em] text-sm uppercase">Cargando KineFlow</p>
        </div>
      </div>
    );
  }

  if (view === 'LOGIN' || !currentUserRole) {
    return <Login onLogin={handleLogin} staff={staff} />;
  }

  return (
    <div className="flex flex-col md:flex-row w-full h-[100dvh] bg-slate-50 overflow-hidden relative">
      {showInstallBanner && (
        <div className="fixed top-[calc(1rem+var(--sat))] left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-lg">
          <div className="bg-slate-900 text-white p-4 rounded-[2rem] shadow-2xl flex items-center justify-between border border-slate-800 backdrop-blur-md bg-opacity-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <Download size={20} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-black">Instalar KineFlow Pro</p>
                <p className="text-[10px] text-slate-400 font-medium">Experiencia nativa a pantalla completa</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleInstallClick} className="bg-white text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider">Instalar</button>
              <button onClick={() => setShowInstallBanner(false)} className="p-2 text-slate-500"><X size={18} /></button>
            </div>
          </div>
        </div>
      )}

      {showExerciseLibrary && (
        <ExerciseLibrary 
          exercises={exercises}
          onAddExercise={handleAddExercise}
          onUpdateExercise={handleUpdateExercise}
          onDeleteExercise={handleDeleteExercise}
          onClose={() => setShowExerciseLibrary(false)}
        />
      )}

      {showSoundSettings && (
        <SoundSettings 
          options={soundOptions}
          selectedUrl={notificationSound}
          onSelect={handleSelectSound}
          onClose={() => setShowSoundSettings(false)}
        />
      )}

      {currentUserRole === UserRole.KINE && (
        <Sidebar 
            activePatients={sidebarPatients}
            selectedPatientId={selectedPatientId}
            onSelectPatient={(id) => { setSelectedPatientId(id); setView('PATIENT_DETAIL'); }}
            onOpenSettings={() => setShowSoundSettings(true)}
            onRemoveActive={(id, e) => {
                e.stopPropagation();
                setActivePatientIds(prev => prev.filter(p => p !== id));
                if (selectedPatientId === id) { setSelectedPatientId(null); setView('HOME'); }
            }}
            onGoHome={() => { setView('HOME'); setSelectedPatientId(null); }}
            onOpenLibrary={() => setShowExerciseLibrary(true)}
            onOpenStaffAdmin={() => setView('STAFF_ADMIN')}
            isOnline={isOnline}
        />
      )}

      {view === 'STAFF_ADMIN' && currentUserRole === UserRole.KINE && (
        <StaffAdmin 
          staff={staff}
          onAddStaff={handleAddStaff}
          onDeleteStaff={handleDeleteStaff}
          onClose={() => setView('HOME')}
        />
      )}

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Logout button for all roles */}
        <button 
          onClick={handleLogout}
          className="fixed bottom-6 right-6 z-[100] w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center text-red-500 border border-slate-100 hover:bg-red-50 transition-all"
        >
          <LogOut size={20} />
        </button>

        {currentUserRole === UserRole.RECEPCION ? (
          <RecepcionView 
            patients={patients}
            onAddPatient={handleAddPatient}
            onUpdatePatient={handleUpdatePatient}
            onDeletePatient={handleDeletePatient}
            onClearWaitingRoom={handleClearWaitingRoom}
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            appointments={appointments}
            onAddAppointment={handleAddAppointment}
            onUpdateAppointment={handleUpdateAppointment}
            onDeleteAppointment={handleDeleteAppointment}
          />
        ) : currentUserRole === UserRole.PATIENT ? (
          loggedPatient ? (
            <PatientView patient={loggedPatient} products={products} onUpdatePatient={handleUpdatePatient} />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Paciente no encontrado</h2>
                <p className="text-slate-500 mb-2">El DNI ingresado <strong>({loggedPatientDni})</strong> no corresponde a ningún paciente registrado.</p>
                <p className="text-slate-400 text-xs mb-6">Asegúrese de que el profesional lo haya registrado correctamente.</p>
                <button onClick={handleLogout} className="bg-primary-600 text-white px-8 py-3 rounded-2xl font-black">Volver</button>
              </div>
            </div>
          )
        ) : (
          // KINE VIEW
          view === 'HOME' ? (
            <PatientList 
                patients={patients} 
                onSelectPatient={handleSelectPatient} 
            />
          ) : currentPatient && (
            <PatientDetail 
                patient={currentPatient}
                role={currentUserRole}
                exercises={exercises}
                onUpdatePatient={handleUpdatePatient}
            />
          )
        )}
      </main>
    </div>
  );
};

export default App;
