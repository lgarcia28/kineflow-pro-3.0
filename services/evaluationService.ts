import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { ClinicalEvaluation } from '../types';
import { getLocalTodayISO } from '../utils/dateUtils';

const COLLECTION_NAME = 'clinical_evaluations';

export const evaluationService = {
  /**
   * Obtiene todas las evaluaciones de un paciente
   */
  async getByPatientId(patientId: string, tenantId: string = 'default_tenant'): Promise<ClinicalEvaluation[]> {
    if (!db) return [];
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('tenantId', '==', tenantId),
        where('patientId', '==', patientId)
      );
      
      const querySnapshot = await getDocs(q);
      const evaluations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ClinicalEvaluation));

      // Ordenar en memoria para evitar errores de índice en Firebase
      return evaluations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error getting evaluations:', error);
      return [];
    }
  },

  /**
   * Crea una nueva evaluación
   */
  async create(evaluation: Omit<ClinicalEvaluation, 'id'>, tenantId: string = 'default_tenant'): Promise<string | null> {
    if (!db) return null;
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...evaluation,
        tenantId: (evaluation as any).tenantId || tenantId,
        date: evaluation.date || getLocalTodayISO()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating evaluation:', error);
      return null;
    }
  },

  /**
   * Actualiza una evaluación existente
   */
  async update(id: string, evaluation: Partial<ClinicalEvaluation>): Promise<boolean> {
    if (!db) return false;
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, evaluation);
      return true;
    } catch (error) {
      console.error('Error updating evaluation:', error);
      return false;
    }
  }
};
