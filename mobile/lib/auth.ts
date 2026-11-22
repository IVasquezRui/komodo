import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  userId: string | null;
  userName: string | null;
  isLoggedIn: boolean;
  login: (id: string, name: string) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      userName: null,
      isLoggedIn: false,
      login: (id, name) => set({ userId: id, userName: name, isLoggedIn: true }),
      logout: () => set({ userId: null, userName: null, isLoggedIn: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
