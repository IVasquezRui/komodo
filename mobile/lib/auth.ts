import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  role: 'passenger' | 'driver' | 'admin';
}

interface AuthState {
  userId: string | null;
  userName: string | null;
  userPhone: string | null;
  userEmail: string | null;
  role: string | null;
  token: string | null;
  refreshToken: string | null;
  isLoggedIn: boolean;
  setSession: (token: string, refreshToken: string, user: UserProfile) => void;
  loginDemo: (id: string, name: string) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      userName: null,
      userPhone: null,
      userEmail: null,
      role: null,
      token: null,
      refreshToken: null,
      isLoggedIn: false,

      setSession: (token, refreshToken, user) =>
        set({
          token,
          refreshToken,
          userId: user.id,
          userName: user.fullName,
          userPhone: user.phoneNumber,
          userEmail: user.email,
          role: user.role,
          isLoggedIn: true,
        }),

      loginDemo: (id, name) =>
        set({
          userId: id,
          userName: name,
          userPhone: '+58412-1234567',
          userEmail: 'demo@komodo.com',
          role: 'passenger',
          token: 'demo-token-bypass',
          refreshToken: 'demo-refresh-bypass',
          isLoggedIn: true,
        }),

      logout: () =>
        set({
          userId: null,
          userName: null,
          userPhone: null,
          userEmail: null,
          role: null,
          token: null,
          refreshToken: null,
          isLoggedIn: false,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
