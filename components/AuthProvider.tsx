import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useAuthStore } from '../store/authStore';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { UserRole } from '../types';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setAuth, setInitializing } = useAuthStore();

  useEffect(() => {
    if (!auth) {
      setInitializing(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          if (!db) {
            console.warn("DB not initialized");
            return;
          }
          // Attempt to find user profile in Firestore
          // First check staff
          const staffQ = query(collection(db, 'staff'), where('uid', '==', firebaseUser.uid));
          const staffSnap = await getDocs(staffQ);
          
          if (!staffSnap.empty) {
            const staffData = staffSnap.docs[0].data();
            setAuth({
              uid: firebaseUser.uid,
              role: staffData.role || UserRole.KINE,
              tenantId: staffData.tenantId || 'default_tenant',
              email: firebaseUser.email,
              displayName: staffData.firstName + ' ' + staffData.lastName
            });
            return;
          }

          // If not staff, check patients
          const patientQ = query(collection(db, 'patients'), where('uid', '==', firebaseUser.uid));
          const patientSnap = await getDocs(patientQ);

          if (!patientSnap.empty) {
            const patientData = patientSnap.docs[0].data();
            setAuth({
              uid: firebaseUser.uid,
              role: UserRole.PATIENT,
              tenantId: patientData.tenantId || 'default_tenant',
              email: firebaseUser.email,
              assignedDni: patientData.dni,
              displayName: patientData.firstName + ' ' + patientData.lastName
            });
            return;
          }

          // Fallback especial para recepción si falló la creación del documento
          if (firebaseUser.email === 'recepcion@staff.kineflow.com') {
             try {
                await setDoc(doc(db, 'staff', firebaseUser.uid), {
                  id: firebaseUser.uid,
                  uid: firebaseUser.uid,
                  firstName: 'Admin',
                  lastName: 'Recepción',
                  username: 'recepcion',
                  password: '', 
                  role: UserRole.RECEPCION,
                  tenantId: 'default_tenant'
                }, { merge: true });
             } catch (e) { console.warn(e); }
             
             setAuth({
               uid: firebaseUser.uid,
               role: UserRole.RECEPCION,
               tenantId: 'default_tenant',
               email: firebaseUser.email,
               displayName: 'Admin Recepción'
             });
             return;
          }

          // Fallback genérico si el documento no se encontró
          setAuth({
            uid: firebaseUser.uid,
            role: UserRole.PATIENT, // default fallback
            tenantId: 'default_tenant',
            email: firebaseUser.email
          });

        } catch (error) {
          console.error("Error fetching user profile:", error);
          setAuth(null);
        }
      } else {
        setAuth(null);
      }
    });

    return () => unsubscribe();
  }, [setAuth, setInitializing]);

  return <>{children}</>;
};
