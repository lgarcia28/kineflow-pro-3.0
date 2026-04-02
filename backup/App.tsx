
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { PatientList } from './components/PatientList';
import { PatientDetail } from './components/PatientDetail';
import { ExerciseLibrary } from './components/ExerciseLibrary'; // Importamos el nuevo componente
import { MOCK_PATIENTS, EXERCISES as INITIAL_EXERCISES } from './constants';
import { Patient, ViewState, UserRole, ExerciseDefinition } from './types';
import { db, isConfigValid } from './firebase';
import { Download, X } from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc,
  setDoc,
  deleteDoc,
  query
} from 'firebase/firestore';

const App: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  // ESTADO GLOBAL DE EJERCICIOS
  const [exercises, setExercises] = useState<ExerciseDefinition[]>(INITIAL_EXERCISES);
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);

  const [loading, setLoading] = useState(true);
  const [activePatientIds, setActivePatientIds] = useState<string[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>('HOME');
  const [currentRole] = useState<UserRole>(UserRole.KINE);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Helper para evitar errores de "undefined" en Firestore
  const sanitizeForFirestore = (data: any) => {
    return JSON.parse(JSON.stringify(data));
  };

  // Monitoreo de Conexión
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

  // Lógica PWA Install
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Solo mostrar banner si no estamos ya en modo standalone
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
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  useEffect(() => {
    if (!isConfigValid || !db) {
      setPatients(MOCK_PATIENTS);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'patients'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const patientsData: Patient[] = [];
      snapshot.forEach((doc) => {
        patientsData.push(doc.data() as Patient);
      });
      // Si hay datos en FB los usamos, si no, mock (pero priorizamos la carga real)
      if (!snapshot.empty) {
        setPatients(patientsData);
      } else if (patients.length === 0) {
        // Solo fallback a mock si no hay nada en estado ni en DB
        setPatients(MOCK_PATIENTS);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      if (patients.length === 0) setPatients(MOCK_PATIENTS);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // HANDLERS PARA EJERCICIOS GLOBALES
  const handleAddExercise = (newEx: ExerciseDefinition) => {
    setExercises(prev => [...prev, newEx]);
    // TODO: Persistir en DB si fuera necesario
  };

  const handleUpdateExercise = (updatedEx: ExerciseDefinition) => {
    setExercises(prev => prev.map(ex => ex.id === updatedEx.id ? updatedEx : ex));
  };

  const handleDeleteExercise = (id: string) => {
    setExercises(prev => prev.filter(ex => ex.id !== id));
  };

  const handleSelectPatient = (patient: Patient) => {
    if (!activePatientIds.includes(patient.id)) {
      setActivePatientIds(prev => [patient.id, ...prev]);
    }
    setSelectedPatientId(patient.id);
    setView('PATIENT_DETAIL');
  };

  const handleAddPatient = async (newPatient: Patient) => {
    // Optimistic Update
    setPatients(prev => [...prev, newPatient]);

    if (isConfigValid && db) {
      try {
        const safeData = sanitizeForFirestore(newPatient);
        await setDoc(doc(db, 'patients', newPatient.id), safeData);
      } catch (e) { console.error(e); }
    }
  };

  const handleUpdatePatient = async (updatedPatient: Patient) => {
    // Optimistic Update: Actualizamos la UI inmediatamente sin esperar a Firebase
    setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));

    if (isConfigValid && db) {
      try {
        // Firebase no acepta 'undefined', sanitizamos el objeto
        const safeData = sanitizeForFirestore(updatedPatient);
        await updateDoc(doc(db, 'patients', updatedPatient.id), safeData);
      } catch (e) { 
        console.error("Error updating patient:", e);
        // Aquí podríamos hacer rollback si fuera crítico
      }
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    // Optimistic Update
    setPatients(prev => prev.filter(p => p.id !== patientId));
    
    if (isConfigValid && db) {
      try {
        await deleteDoc(doc(db, 'patients', patientId));
      } catch (e) { console.error(e); }
    }
  };

  const activePatients = activePatientIds
    .map(id => patients.find(p => p.id === id))
    .filter((p): p is Patient => !!p);

  const currentPatient = patients.find(p => p.id === selectedPatientId);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-xl">
             <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-400 font-bold tracking-widest text-xs uppercase">Cargando KineFlow</p>
        </div>
      </div>
    );
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

      {/* MODAL DE BIBLIOTECA */}
      {showExerciseLibrary && (
        <ExerciseLibrary 
          exercises={exercises}
          onAddExercise={handleAddExercise}
          onUpdateExercise={handleUpdateExercise}
          onDeleteExercise={handleDeleteExercise}
          onClose={() => setShowExerciseLibrary(false)}
        />
      )}

      <Sidebar 
          activePatients={activePatients}
          selectedPatientId={selectedPatientId}
          onSelectPatient={(id) => { setSelectedPatientId(id); setView('PATIENT_DETAIL'); }}
          onRemoveActive={(id, e) => {
              e.stopPropagation();
              setActivePatientIds(prev => prev.filter(p => p !== id));
              if (selectedPatientId === id) { setSelectedPatientId(null); setView('HOME'); }
          }}
          onGoHome={() => { setView('HOME'); setSelectedPatientId(null); }}
          onOpenLibrary={() => setShowExerciseLibrary(true)} // Nuevo prop
          isOnline={isOnline}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {view === 'HOME' ? (
            <PatientList 
                patients={patients} 
                onSelectPatient={handleSelectPatient} 
                onAddPatient={handleAddPatient}
                onUpdatePatient={handleUpdatePatient}
                onDeletePatient={handleDeletePatient}
            />
        ) : currentPatient && (
            <PatientDetail 
                patient={currentPatient}
                role={currentRole}
                exercises={exercises} // Pasamos la librería dinámica
                onUpdatePatient={handleUpdatePatient}
            />
        )}
      </main>
    </div>
  );
};

export default App;