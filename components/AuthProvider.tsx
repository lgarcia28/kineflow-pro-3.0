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
            setInitializing(false);
            return;
          }

          // 1. Check direct staff document by UID first (compliant with strict security rules)
          const directStaffSnap = await getDoc(doc(db, 'staff', firebaseUser.uid));
          if (directStaffSnap.exists()) {
            const staffData = directStaffSnap.data();
            setAuth({
              uid: firebaseUser.uid,
              role: staffData.role || UserRole.KINE,
              tenantId: staffData.tenantId || 'default_tenant',
              email: firebaseUser.email,
              displayName: `${staffData.firstName || ''} ${staffData.lastName || ''}`.trim()
            });
            return;
          }

          // 2. Check direct patient document by UID
          const directPatientSnap = await getDoc(doc(db, 'patients', firebaseUser.uid));
          if (directPatientSnap.exists()) {
            const patientData = directPatientSnap.data();
            setAuth({
              uid: firebaseUser.uid,
              role: UserRole.PATIENT,
              tenantId: patientData.tenantId || 'default_tenant',
              email: firebaseUser.email,
              assignedDni: patientData.dni,
              displayName: `${patientData.firstName || ''} ${patientData.lastName || ''}`.trim()
            });
            return;
          }

          // 3. Fallback query by uid field if document ID differs from Auth UID
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
              displayName: `${patientData.firstName || ''} ${patientData.lastName || ''}`.trim()
            });
            return;
          }

          // Fallback genérico con privilegio mínimo (PATIENT) si el documento no existe aún
          setAuth({
            uid: firebaseUser.uid,
            role: UserRole.PATIENT,
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
