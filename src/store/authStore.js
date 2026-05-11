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
        // First reset the store state
        set({
          username: null,
          loginToken: '',
          isLoggedIn: false,
          balance: '0',
          exposure: '0'
        });
        
        // Explicitly clear all storage to prevent stale data re-hydration
        try {
          localStorage.removeItem('skyexchange-auth-storage');
          localStorage.clear(); // Clear any other leftovers
          sessionStorage.clear();
        } catch (e) {
          console.error('Storage clear error:', e);
        }

        // Force a clean redirect based on device type
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
          window.location.replace('/login');
        } else {
          // On desktop, go home and we will trigger login modal via query param or other means
          window.location.replace('/?login=true');
        }
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
