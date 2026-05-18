import { create } from 'zustand';
import type { AuthSessionDTO } from '../../../shared/contracts/index.js';

const AUTH_SESSION_STATUS = {
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  UNKNOWN: 'unknown',
} as const;

type AuthSessionStatus = (typeof AUTH_SESSION_STATUS)[keyof typeof AUTH_SESSION_STATUS];

interface AuthState {
  session: AuthSessionDTO | null;
  status: AuthSessionStatus;
  setSession: (session: AuthSessionDTO) => void;
  clearSession: () => void;
  patchUser: (patch: Partial<AuthSessionDTO['user']>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  status: AUTH_SESSION_STATUS.UNKNOWN,
  setSession: (session) => set({ session, status: AUTH_SESSION_STATUS.AUTHENTICATED }),
  clearSession: () => set({ session: null, status: AUTH_SESSION_STATUS.UNAUTHENTICATED }),
  patchUser: (patch) =>
    set((state) => {
      if (!state.session) return state;
      return {
        session: { user: { ...state.session.user, ...patch } },
      };
    }),
}));

export const authSessionStatus = AUTH_SESSION_STATUS;
export type { AuthSessionStatus };
