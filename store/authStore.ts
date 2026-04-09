import { create } from 'zustand';
import { UserRole } from '../types';

interface AuthProfile {
  uid: string;
  role: UserRole;
  tenantId: string;
  email: string | null;
  assignedDni?: string; // Solo para pacientes
  displayName?: string;
}

interface AuthState {
  user: AuthProfile | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  setAuth: (user: AuthProfile | null) => void;
  setInitializing: (val: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,

  setAuth: (user) => set({ 
    user, 
    isAuthenticated: !!user,
    isInitializing: false 
  }),

  setInitializing: (val) => set({ isInitializing: val }),

  logout: () => set({ 
    user: null, 
    isAuthenticated: false 
  }),
}));
