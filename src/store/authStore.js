import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      username: null,
      loginToken: '',
      isLoggedIn: false,
      balance: '0',
      exposure: '0',

      // Action to log in a user and save their session
      login: (username, loginToken) => set({
        username,
        loginToken: loginToken || '',
        isLoggedIn: true
      }),

      // Action to update balance and exposure
      updateBalance: (balance, exposure) => set({
        balance: balance || '0',
        exposure: exposure || '0'
      }),

      // Action to log out and clear the session
      logout: () => {
        set({
          username: null,
          loginToken: '',
          isLoggedIn: false,
          balance: '0',
          exposure: '0'
        });
        localStorage.removeItem('skyexchange-auth-storage');
        window.location.href = '/login';
      },

      // Helper to update balance etc separately if needed
      updateUser: (data) => set((state) => ({ ...state, ...data })),
      
      // Getter for token
      getToken: () => get().loginToken || '',
    }),
    {
      name: 'skyexchange-auth-storage', // Key for localStorage
    }
  )
);
